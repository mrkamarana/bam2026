import {
  CompanyProfile,
  TaxCalculationType,
  TaxInvoiceEntry,
  TaxProfile,
  WithholdingTaxSlip,
} from '../types';

export interface TaxCalculationResult {
  dpp: number;
  ppnAmount: number;
  pph22Amount: number;
  totalWithTax: number;
  netReceivableAmount: number;
}

/**
 * Menghitung rincian DPP, PPN 11%, dan PPh 22 WAPU
 */
export function calculateTransactionTax(
  baseAmount: number,
  taxType: TaxCalculationType = 'exclude',
  ppnRate: number = 11,
  pph22Rate: number = 0,
  isWapu: boolean = false
): TaxCalculationResult {
  let dpp = 0;
  let ppnAmount = 0;
  let pph22Amount = 0;
  let totalWithTax = 0;
  let netReceivableAmount = 0;

  if (taxType === 'non-ppn') {
    dpp = baseAmount;
    ppnAmount = 0;
    pph22Amount = pph22Rate > 0 ? Math.round((dpp * pph22Rate) / 100) : 0;
    totalWithTax = baseAmount;
    netReceivableAmount = totalWithTax - pph22Amount;
  } else if (taxType === 'include') {
    // Harga sudah termasuk PPN: DPP = Gross / (1 + PPN_Rate/100)
    dpp = Math.round(baseAmount / (1 + ppnRate / 100));
    ppnAmount = baseAmount - dpp;
    pph22Amount = pph22Rate > 0 ? Math.round((dpp * pph22Rate) / 100) : 0;
    totalWithTax = baseAmount;
    // Jika WAPU, PPN dipungut bendahara/BUMN, PPh 22 dipotong langsung
    netReceivableAmount = isWapu
      ? dpp - pph22Amount
      : totalWithTax - pph22Amount;
  } else {
    // 'exclude' atau 'wapu'
    dpp = baseAmount;
    ppnAmount = Math.round((dpp * ppnRate) / 100);
    pph22Amount = pph22Rate > 0 ? Math.round((dpp * pph22Rate) / 100) : 0;
    totalWithTax = dpp + ppnAmount;
    netReceivableAmount = isWapu || taxType === 'wapu'
      ? dpp - pph22Amount // WAPU membayarkan nilai DPP dikurangi PPh 22
      : totalWithTax;
  }

  return {
    dpp,
    ppnAmount,
    pph22Amount,
    totalWithTax,
    netReceivableAmount,
  };
}

/**
 * Format Nomor Seri Faktur Pajak (NSFP) standar DJP
 * Contoh: 010.000-26.00000101
 */
export function formatNSFP(prefix: string, index: number): string {
  const cleanPrefix = prefix.endsWith('.') ? prefix : `${prefix}.`;
  const paddedIndex = String(index).padStart(8, '0');
  return `${cleanPrefix}${paddedIndex}`;
}

/**
 * Format NPWP standar 16 / 15 digit
 */
export function formatNPWP(npwp?: string): string {
  if (!npwp) return '00.000.000.0-000.000';
  const clean = npwp.replace(/\D/g, '');
  if (clean.length === 15) {
    return `${clean.slice(0, 2)}.${clean.slice(2, 5)}.${clean.slice(5, 8)}.${clean.slice(8, 9)}-${clean.slice(9, 12)}.${clean.slice(12, 15)}`;
  }
  if (clean.length === 16) {
    return `${clean.slice(0, 2)}.${clean.slice(2, 5)}.${clean.slice(5, 8)}.${clean.slice(8, 9)}-${clean.slice(9, 12)}.${clean.slice(12, 15)} (${clean.slice(15)})`;
  }
  return npwp;
}

export interface MonthlyTaxSummary {
  period: string; // YYYY-MM
  // PPN
  totalOutputDPP: number;
  totalOutputPPN: number;
  outputPPNSelf: number; // Disetor Sendiri (Kode 01)
  outputPPNWapu: number; // Dipungut WAPU (Kode 02, 03)
  totalInputDPP: number;
  totalInputPPN: number;
  ppnUnderOverPayment: number; // PPN Kurang (Positif) / Lebih (Negatif) Bayar
  ppnStatus: 'Kurang Bayar' | 'Lebih Bayar' | 'Nihil';
  // PPh
  totalPPh22Prepaid: number; // PPh 22 dipotong pihak lain (Kredit Pajak)
  totalPPh23Payable: number; // PPh 23 dipotong sendiri atas jasa/sewa (Utang Pajak)
  totalPPh21Payable: number; // PPh 21 upah tenaga kerja/sopir
  totalPPh42Payable: number;
  totalTaxPayableToState: number; // Estimasi Billing Setor Kas Negara
}

/**
 * Rekapitulasi Pajak Bulanan (SPT Masa PPN & Unifikasi PPh)
 */
export function calculateMonthlyTaxSummary(
  invoices: TaxInvoiceEntry[],
  withholdingSlips: WithholdingTaxSlip[],
  period: string = '2026-08'
): MonthlyTaxSummary {
  // Filter invoices for period
  const periodInvoices = period === 'semua'
    ? invoices
    : invoices.filter((inv) => inv.taxPeriod === period || inv.date.startsWith(period));

  let totalOutputDPP = 0;
  let totalOutputPPN = 0;
  let outputPPNSelf = 0;
  let outputPPNWapu = 0;
  let totalInputDPP = 0;
  let totalInputPPN = 0;

  periodInvoices.forEach((inv) => {
    if (inv.status === 'Dibatalkan') return;

    if (inv.type === 'keluaran') {
      totalOutputDPP += inv.dpp;
      totalOutputPPN += inv.ppnAmount;
      if (inv.isWapu || inv.transactionCode === '02' || inv.transactionCode === '03') {
        outputPPNWapu += inv.ppnAmount;
      } else {
        outputPPNSelf += inv.ppnAmount;
      }
    } else {
      totalInputDPP += inv.dpp;
      totalInputPPN += inv.ppnAmount;
    }
  });

  // PPN Kurang Bayar = PPN Keluaran (Disetor Sendiri) - PPN Masukan
  const ppnUnderOverPayment = outputPPNSelf - totalInputPPN;
  let ppnStatus: MonthlyTaxSummary['ppnStatus'] = 'Nihil';
  if (ppnUnderOverPayment > 0) ppnStatus = 'Kurang Bayar';
  else if (ppnUnderOverPayment < 0) ppnStatus = 'Lebih Bayar';

  // Withholding Slips
  const periodSlips = period === 'semua'
    ? withholdingSlips
    : withholdingSlips.filter((s) => s.taxPeriod === period || s.date.startsWith(period));

  let totalPPh22Prepaid = 0;
  let totalPPh23Payable = 0;
  let totalPPh21Payable = 0;
  let totalPPh42Payable = 0;

  periodSlips.forEach((s) => {
    if (s.taxType === 'PPh 22') totalPPh22Prepaid += s.taxAmount;
    else if (s.taxType === 'PPh 23') totalPPh23Payable += s.taxAmount;
    else if (s.taxType === 'PPh 21') totalPPh21Payable += s.taxAmount;
    else if (s.taxType === 'PPh 4(2)') totalPPh42Payable += s.taxAmount;
  });

  // Total kewajiban setor kas negara = PPN Kurang Bayar (jika > 0) + PPh 23 + PPh 21 + PPh 4(2)
  const totalTaxPayableToState =
    Math.max(0, ppnUnderOverPayment) +
    totalPPh23Payable +
    totalPPh21Payable +
    totalPPh42Payable;

  return {
    period,
    totalOutputDPP,
    totalOutputPPN,
    outputPPNSelf,
    outputPPNWapu,
    totalInputDPP,
    totalInputPPN,
    ppnUnderOverPayment,
    ppnStatus,
    totalPPh22Prepaid,
    totalPPh23Payable,
    totalPPh21Payable,
    totalPPh42Payable,
    totalTaxPayableToState,
  };
}

/**
 * Generate CSV format DJP e-Faktur Pajak Keluaran (Format OF DJP)
 */
export function generateEFakturOutputCSV(
  invoices: TaxInvoiceEntry[],
  companyProfile: CompanyProfile
): string {
  const outputInvoices = invoices.filter((i) => i.type === 'keluaran');
  
  // Header standard e-Faktur DJP
  const lines: string[] = [
    'FK;KD_JENIS_TRANSAKSI;FG_PENGGANTI;NOMOR_FAKTUR;MASA_PAJAK;TAHUN_PAJAK;TANGGAL_FAKTUR;NPWP;NAMA;ALAMAT_LENGKAP;JUMLAH_DPP;JUMLAH_PPN;JUMLAH_PPNBM;ID_KETERANGAN_TAMBAHAN;FG_UANG_MUKA;UANG_MUKA_DPP;UANG_MUKA_PPN;UANG_MUKA_PPNBM;REFERENSI;KODE_DOKUMEN_PENDUKUNG',
  ];

  outputInvoices.forEach((inv) => {
    const rawNumber = inv.taxNumber.replace(/\D/g, '');
    const masaPajak = inv.taxPeriod ? inv.taxPeriod.split('-')[1] : '08';
    const tahunPajak = inv.taxPeriod ? inv.taxPeriod.split('-')[0] : '2026';
    const cleanNPWP = inv.counterpartyNPWP.replace(/\D/g, '').padEnd(15, '0');

    lines.push(
      `FK;${inv.transactionCode};0;${rawNumber};${masaPajak};${tahunPajak};${inv.date};${cleanNPWP};${inv.counterpartyName.replace(/;/g, ',')};${inv.counterpartyAddress.replace(/;/g, ',')};${inv.dpp};${inv.ppnAmount};0;;0;0;0;0;${inv.refNumber};`
    );
  });

  return lines.join('\r\n');
}

/**
 * Trigger download of CSV file
 */
export function downloadTaxCSV(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
