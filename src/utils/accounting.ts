import {
  AccountOption,
  BalanceSheetData,
  IncomeStatementData,
  IncomeTaxDetail,
  IncomeTaxScheme,
  InvoiceRecord,
  JournalEntry,
  LedgerAccount,
  OperationalExpense,
  PurchaseTransaction,
  SaleTransaction,
  TaxInvoiceEntry,
  TrialBalanceRow,
  WithholdingTaxSlip,
} from '../types';

export const INITIAL_EQUITY = 50000000; // Modal Awal Disetor Rp 50.000.000

export const CHART_OF_ACCOUNTS: AccountOption[] = [
  // 1. ASET (1-xxx)
  { code: '1-101', name: 'Kas & Bank', category: 'Aset', normalBalance: 'Debit', description: 'Kas di tangan dan rekening giro / tabungan operasional' },
  { code: '1-102', name: 'Piutang Usaha (Klien)', category: 'Aset', normalBalance: 'Debit', description: 'Tagihan penjualan material yang belum dibayar klien' },
  { code: '1-103', name: 'PPN Masukan (Pajak Dibayar di Muka)', category: 'Aset', normalBalance: 'Debit', description: 'Kredit PPN masukan dari quarry & faktur pembelian' },
  { code: '1-104', name: 'Uang Muka PPh 22 (Pajak Dibayar di Muka)', category: 'Aset', normalBalance: 'Debit', description: 'Kredit pajak PPh 22 yang dipotong WAPU BUMN' },
  { code: '1-105', name: 'Perlengkapan & ATK Kantor', category: 'Aset', normalBalance: 'Debit', description: 'Stok alat tulis, kertas, formulir, dan perlengkapan kantor' },
  { code: '1-106', name: 'Uang Muka Sewa & Operasional', category: 'Aset', normalBalance: 'Debit', description: 'Uang muka sewa lahan/mess atau persekot operasional' },
  { code: '1-107', name: 'Uang Muka PPh 23 / PPh 25 (Pajak Dibayar di Muka)', category: 'Aset', normalBalance: 'Debit', description: 'Kredit pajak PPh 23 dan angsuran PPh 25 dibayar di muka' },
  { code: '1-201', name: 'Kendaraan & Dump Truck (Aset Tetap)', category: 'Aset', normalBalance: 'Debit', description: 'Armada kendaraan dump truck tronton & operasional' },
  { code: '1-202', name: 'Akumulasi Penyusutan Kendaraan', category: 'Aset', normalBalance: 'Kredit', description: 'Akumulasi depresiasi kendaraan operasional' },
  { code: '1-203', name: 'Peralatan & Mesin Berat (Aset Tetap)', category: 'Aset', normalBalance: 'Debit', description: 'Wheel loader, excavator, genset, dan timbangan' },

  // 2. KEWAJIBAN (2-xxx)
  { code: '2-101', name: 'Hutang Usaha (Supplier / Quarry)', category: 'Kewajiban', normalBalance: 'Kredit', description: 'Kewajiban tagihan pembelian material ke quarry' },
  { code: '2-102', name: 'Utang PPN Keluaran', category: 'Kewajiban', normalBalance: 'Kredit', description: 'PPN keluaran dari penjualan material yang dipungut' },
  { code: '2-103', name: 'Utang PPh 23 / PPh 21 (Titipan Pajak)', category: 'Kewajiban', normalBalance: 'Kredit', description: 'Potongan PPh 23/21 atas jasa/upah yang belum disetor' },
  { code: '2-104', name: 'Hutang Beban Operasional / Gaji', category: 'Kewajiban', normalBalance: 'Kredit', description: 'Biaya operasional atau gaji yang masih harus dibayar' },
  { code: '2-105', name: 'Utang Pajak Penghasilan (PPh Terutang)', category: 'Kewajiban', normalBalance: 'Kredit', description: 'Kewajiban PPh Final / PPh Badan periode berjalan yang belum disetor' },
  { code: '2-201', name: 'Hutang Bank & Lembaga Keuangan', category: 'Kewajiban', normalBalance: 'Kredit', description: 'Pinjaman modal kerja jangka panjang dari bank' },

  // 3. EKUITAS (3-xxx)
  { code: '3-101', name: 'Modal Usaha Pemilik', category: 'Ekuitas', normalBalance: 'Kredit', description: 'Modal disetor awal pemilik perusahaan' },
  { code: '3-102', name: 'Prive / Penarikan Pribadi', category: 'Ekuitas', normalBalance: 'Debit', description: 'Penarikan dana oleh pemilik untuk keperluan pribadi' },
  { code: '3-103', name: 'Laba Ditahan', category: 'Ekuitas', normalBalance: 'Kredit', description: 'Akumulasi laba periode lalu yang ditahan perusahaan' },

  // 4. PENDAPATAN (4-xxx)
  { code: '4-101', name: 'Pendapatan Penjualan Material', category: 'Pendapatan', normalBalance: 'Kredit', description: 'Pendapatan utama penjualan pasir, split, sirtu, base course' },
  { code: '4-102', name: 'Pendapatan Jasa Angkut & Pengiriman', category: 'Pendapatan', normalBalance: 'Kredit', description: 'Pendapatan ongkos kirim / trucking terpisah' },
  { code: '4-103', name: 'Pendapatan Sewa Alat Berat', category: 'Pendapatan', normalBalance: 'Kredit', description: 'Pendapatan sewa alat berat / dump truck ke pihak lain' },

  // 5. BEBAN POKOK PENJUALAN (5-xxx)
  { code: '5-101', name: 'Beban Pokok Penjualan (HPP)', category: 'HPP', normalBalance: 'Debit', description: 'Harga pokok pembelian material langsung dari tambang quarry' },

  // 6. BEBAN OPERASIONAL (6-xxx)
  { code: '6-101', name: 'Beban BBM & Armada Solar', category: 'Beban', normalBalance: 'Debit', description: 'Pengisian bahan bakar solar armada pengiriman dump truck' },
  { code: '6-102', name: 'Beban Gaji & Upah Sopir (Uang Jalan)', category: 'Beban', normalBalance: 'Debit', description: 'Uang jalan, upah ritase, dan makan sopir harian' },
  { code: '6-103', name: 'Beban Gaji & Insentif Karyawan/Staf', category: 'Beban', normalBalance: 'Debit', description: 'Gaji pokok, tunjangan & insentif staf kantor & lapangan' },
  { code: '6-104', name: 'Beban Maintenance, Oli & Sparepart', category: 'Beban', normalBalance: 'Debit', description: 'Perawatan berkala, ganti oli, ban & sparepart truk' },
  { code: '6-105', name: 'Beban Retribusi, E-Toll & Jalan', category: 'Beban', normalBalance: 'Debit', description: 'Biaya tol, TPR, retribusi jembatan timbang & perizinan' },
  { code: '6-106', name: 'Beban Perlengkapan & ATK Kantor', category: 'Beban', normalBalance: 'Debit', description: 'Pembelian kertas surat jalan, invoice, tinta printer, ATK' },
  { code: '6-107', name: 'Beban Pengiriman Dokumen & Invoice', category: 'Beban', normalBalance: 'Debit', description: 'Kurir ekspedisi pengiriman fisik berkas invoice & faktur' },
  { code: '6-108', name: 'Beban Sewa Kantor / Mess / Gudang', category: 'Beban', normalBalance: 'Debit', description: 'Sewa kantor operasional, mess sopir, atau pool dump truck' },
  { code: '6-109', name: 'Beban Listrik, Air & Internet', category: 'Beban', normalBalance: 'Debit', description: 'Tagihan utilitas PLN, PAM, telepon & internet kantor' },
  { code: '6-110', name: 'Beban Jamuan & Konsumsi Lapangan', category: 'Beban', normalBalance: 'Debit', description: 'Konsumsi koordinasi proyek, quarry, dan pengawas' },
  { code: '6-199', name: 'Beban Operasional Lain-lain', category: 'Beban', normalBalance: 'Debit', description: 'Beban operasional umum yang belum terklasifikasi' },

  // 7. PENDAPATAN / BEBAN LAIN-LAIN & PAJAK PENGHASILAN (7-xxx)
  { code: '7-101', name: 'Pendapatan Bunga & Non-Operasional', category: 'Pendapatan', normalBalance: 'Kredit', description: 'Bunga bank, selisih kas, atau pendapatan non-operasional' },
  { code: '7-201', name: 'Beban Administrasi Bank & Pajak Bunga', category: 'Beban', normalBalance: 'Debit', description: 'Biaya admin rekening bank, transfer, dan pajak bunga' },
  { code: '7-301', name: 'Beban Pajak Penghasilan (PPh Final / PPh Badan)', category: 'Beban', normalBalance: 'Debit', description: 'Beban pajak penghasilan perusahaan (PPh Final 0.5% / PPh Badan 11% / 22%)' },
];

export function getAccountByCode(code: string): AccountOption | undefined {
  return CHART_OF_ACCOUNTS.find((a) => a.code === code);
}

export function generateGeneralJournal(
  sales: SaleTransaction[],
  purchases: PurchaseTransaction[],
  expenses: OperationalExpense[],
  taxInvoices: TaxInvoiceEntry[] = [],
  withholdingSlips: WithholdingTaxSlip[] = [],
  customJournals: JournalEntry[] = [],
  deletedJournalIds: string[] = []
): JournalEntry[] {
  const entries: JournalEntry[] = [];

  // Initial Equity Entry
  entries.push({
    id: 'jrn-init-modal',
    date: '2026-08-01',
    refNo: 'MOD-001',
    description: 'Setoran Modal Awal Pemilik',
    debitAccountCode: '1-101',
    debitAccountName: 'Kas & Bank',
    creditAccountCode: '3-101',
    creditAccountName: 'Modal Usaha Pemilik',
    amount: INITIAL_EQUITY,
    sourceType: 'modal',
  });

  // Sales Entries
  sales.forEach((s) => {
    const isPaid = s.paymentStatus === 'Lunas';
    entries.push({
      id: `jrn-sale-${s.id}`,
      date: s.date,
      refNo: s.deliveryNoteNumber,
      description: `Penjualan ${s.itemName} ke ${s.clientName} (${s.volume} ${s.unit}) - PO: ${s.poNumber}`,
      debitAccountCode: isPaid ? '1-101' : '1-102',
      debitAccountName: isPaid ? 'Kas & Bank' : 'Piutang Usaha (Klien)',
      creditAccountCode: '4-101',
      creditAccountName: 'Pendapatan Penjualan Material',
      amount: s.totalAmount,
      sourceType: 'penjualan',
      sourceId: s.id,
    });
  });

  // Purchases Entries (HPP)
  purchases.forEach((p) => {
    const isPaid = p.paymentStatus === 'Lunas';
    entries.push({
      id: `jrn-pur-${p.id}`,
      date: p.date,
      refNo: p.deliveryNoteNumber,
      description: `Pembelian Material ${p.itemName} dari ${p.supplierName} (${p.volume} ${p.unit})`,
      debitAccountCode: '5-101',
      debitAccountName: 'Beban Pokok Penjualan (HPP)',
      creditAccountCode: isPaid ? '1-101' : '2-101',
      creditAccountName: isPaid ? 'Kas & Bank' : 'Hutang Usaha (Supplier)',
      amount: p.totalAmount,
      sourceType: 'pembelian',
      sourceId: p.id,
    });
  });

  // Manual Transactions (Expenses, Assets, Revenues, etc.)
  expenses.forEach((e) => {
    const amount = e.amount || (e.quantity * (e.pricePerUnit || 0)) || 0;
    if (amount <= 0) return;

    const accountCode = e.accountCode || '6-101';
    const acc = getAccountByCode(accountCode);
    const accountName = acc?.name || e.accountName || e.category || 'Beban Operasional';
    const isPayByDebt = e.paymentMethod === 'Hutang';

    let debitCode = '6-101';
    let debitName = 'Beban Operasional & Pengiriman';
    let creditCode = isPayByDebt ? '2-104' : '1-101';
    let creditName = isPayByDebt ? 'Hutang Beban Operasional / Gaji' : 'Kas & Bank';

    if (accountCode.startsWith('1-')) {
      // Pembelian Aset / Perlengkapan
      debitCode = accountCode;
      debitName = accountName;
      creditCode = isPayByDebt ? '2-101' : '1-101';
      creditName = isPayByDebt ? 'Hutang Usaha' : 'Kas & Bank';
    } else if (accountCode.startsWith('2-')) {
      // Pelunasan Hutang
      debitCode = accountCode;
      debitName = accountName;
      creditCode = '1-101';
      creditName = 'Kas & Bank';
    } else if (accountCode.startsWith('3-102')) {
      // Prive (Penarikan Modal Pemilik)
      debitCode = '3-102';
      debitName = accountName;
      creditCode = '1-101';
      creditName = 'Kas & Bank';
    } else if (accountCode.startsWith('3-101')) {
      // Tambahan Modal Disetor
      debitCode = '1-101';
      debitName = 'Kas & Bank';
      creditCode = '3-101';
      creditName = accountName;
    } else if (accountCode.startsWith('4-') || accountCode === '7-101') {
      // Pemasukan / Pendapatan Lain
      debitCode = '1-101';
      debitName = 'Kas & Bank';
      creditCode = accountCode;
      creditName = accountName;
    } else {
      // Beban Operasional / Administrasi (6-xxx atau 7-201)
      debitCode = accountCode;
      debitName = accountName;
      creditCode = isPayByDebt ? '2-104' : '1-101';
      creditName = isPayByDebt ? 'Hutang Beban Operasional / Gaji' : 'Kas & Bank';
    }

    const detailText = e.quantity && e.unit && e.pricePerUnit
      ? ` (${e.quantity} ${e.unit} @ Rp ${e.pricePerUnit.toLocaleString('id-ID')})`
      : '';

    entries.push({
      id: `jrn-exp-${e.id}`,
      date: e.date,
      refNo: `TRX-${e.id.slice(-4).toUpperCase()}`,
      description: `${e.transactionName || e.description || e.category}${detailText}`,
      debitAccountCode: debitCode,
      debitAccountName: debitName,
      creditAccountCode: creditCode,
      creditAccountName: creditName,
      amount: amount,
      sourceType: 'pengeluaran',
      sourceId: e.id,
    });
  });

  // Tax Invoices (PPN Keluaran & PPN Masukan)
  taxInvoices.forEach((tax) => {
    if (tax.status === 'Dibatalkan') return;

    if (tax.type === 'keluaran' && !tax.isWapu && tax.ppnAmount > 0) {
      entries.push({
        id: `jrn-tax-out-${tax.id}`,
        date: tax.date,
        refNo: tax.taxNumber,
        description: `PPN Keluaran Faktur Pajak ${tax.taxNumber} atas ${tax.counterpartyName}`,
        debitAccountCode: '1-102',
        debitAccountName: 'Piutang Usaha (Klien)',
        creditAccountCode: '2-102',
        creditAccountName: 'Utang PPN Keluaran',
        amount: tax.ppnAmount,
        sourceType: 'pajak',
        sourceId: tax.id,
      });
    } else if (tax.type === 'keluaran' && tax.isWapu && tax.pph22Amount && tax.pph22Amount > 0) {
      entries.push({
        id: `jrn-tax-pph22-${tax.id}`,
        date: tax.date,
        refNo: tax.taxNumber,
        description: `Uang Muka PPh Pasal 22 Dipungut WAPU ${tax.counterpartyName}`,
        debitAccountCode: '1-104',
        debitAccountName: 'Uang Muka PPh 22 (Pajak Dibayar di Muka)',
        creditAccountCode: '1-102',
        creditAccountName: 'Piutang Usaha (Klien)',
        amount: tax.pph22Amount,
        sourceType: 'pajak',
        sourceId: tax.id,
      });
    } else if (tax.type === 'masukan' && tax.ppnAmount > 0) {
      entries.push({
        id: `jrn-tax-in-${tax.id}`,
        date: tax.date,
        refNo: tax.taxNumber,
        description: `PPN Masukan Faktur Pajak ${tax.taxNumber} dari ${tax.counterpartyName}`,
        debitAccountCode: '1-103',
        debitAccountName: 'PPN Masukan (Pajak Dibayar di Muka)',
        creditAccountCode: '2-101',
        creditAccountName: 'Hutang Usaha (Supplier)',
        amount: tax.ppnAmount,
        sourceType: 'pajak',
        sourceId: tax.id,
      });
    }
  });

  // Withholding Tax Slips (PPh 23 & PPh 21)
  withholdingSlips.forEach((slip) => {
    if (slip.bupotStatus === 'Final' && (slip.taxType === 'PPh 23' || slip.taxType === 'PPh 21')) {
      entries.push({
        id: `jrn-bupot-${slip.id}`,
        date: slip.date,
        refNo: slip.slipNumber,
        description: `Pemotongan ${slip.taxType} atas ${slip.objectDescription} (${slip.recipientName})`,
        debitAccountCode: '6-101',
        debitAccountName: 'Beban Operasional & Pengiriman',
        creditAccountCode: '2-103',
        creditAccountName: 'Utang PPh 23 / PPh 21 (Titipan Pajak)',
        amount: slip.taxAmount,
        sourceType: 'pajak',
        sourceId: slip.id,
      });
    }
  });

  // Add Custom / Manual Adjustment Journals
  customJournals.forEach((cj) => {
    entries.push(cj);
  });

  // Filter out deleted journal entries
  const activeEntries = entries.filter((e) => !deletedJournalIds.includes(e.id));

  // Sort by date ascending
  return activeEntries.sort((a, b) => a.date.localeCompare(b.date));
}

export function generateGeneralLedger(journalEntries: JournalEntry[]): LedgerAccount[] {
  // Use all defined chart of accounts
  return CHART_OF_ACCOUNTS.map((acc) => {
    let runningBalance = 0;
    const entries: LedgerAccount['entries'] = [];
    let totalDebit = 0;
    let totalCredit = 0;

    journalEntries.forEach((j) => {
      let isDebit = false;
      let isCredit = false;

      if (j.debitAccountCode === acc.code) {
        isDebit = true;
      }
      if (j.creditAccountCode === acc.code) {
        isCredit = true;
      }

      if (isDebit || isCredit) {
        const debit = isDebit ? j.amount : 0;
        const credit = isCredit ? j.amount : 0;

        totalDebit += debit;
        totalCredit += credit;

        if (acc.normalBalance === 'Debit') {
          runningBalance += debit - credit;
        } else {
          runningBalance += credit - debit;
        }

        entries.push({
          id: `${j.id}-${acc.code}`,
          date: j.date,
          refNo: j.refNo,
          description: j.description,
          debit,
          credit,
          balance: runningBalance,
        });
      }
    });

    return {
      code: acc.code,
      name: acc.name,
      category: acc.category,
      normalBalance: acc.normalBalance,
      entries,
      totalDebit,
      totalCredit,
      finalBalance: runningBalance,
    };
  });
}

export function generateTrialBalance(ledger: LedgerAccount[]): {
  rows: TrialBalanceRow[];
  totalDebit: number;
  totalCredit: number;
  isBalanced: boolean;
} {
  let totalDebit = 0;
  let totalCredit = 0;

  const rows: TrialBalanceRow[] = ledger
    .filter((acc) => acc.totalDebit > 0 || acc.totalCredit > 0 || acc.finalBalance !== 0)
    .map((acc) => {
      let debit = 0;
      let credit = 0;

      if (acc.normalBalance === 'Debit') {
        if (acc.finalBalance >= 0) {
          debit = acc.finalBalance;
        } else {
          credit = Math.abs(acc.finalBalance);
        }
      } else {
        if (acc.finalBalance >= 0) {
          credit = acc.finalBalance;
        } else {
          debit = Math.abs(acc.finalBalance);
        }
      }

      totalDebit += debit;
      totalCredit += credit;

      return {
        code: acc.code,
        name: acc.name,
        category: acc.category,
        debit,
        credit,
      };
    });

  return {
    rows,
    totalDebit,
    totalCredit,
    isBalanced: Math.abs(totalDebit - totalCredit) < 1,
  };
}

export function generateIncomeStatement(
  sales: SaleTransaction[],
  purchases: PurchaseTransaction[],
  expenses: OperationalExpense[],
  taxInvoices: TaxInvoiceEntry[] = [],
  withholdingSlips: WithholdingTaxSlip[] = [],
  taxScheme: IncomeTaxScheme = 'pp55_final_0_5',
  manualTaxAmount?: number
): IncomeStatementData {
  // Aggregate sales by item name
  const revenueMap = new Map<string, { volume: number; unit: string; amount: number }>();
  let totalRevenue = 0;

  sales.forEach((s) => {
    totalRevenue += s.totalAmount;
    const existing = revenueMap.get(s.itemName) || { volume: 0, unit: s.unit, amount: 0 };
    existing.volume += s.volume;
    existing.amount += s.totalAmount;
    revenueMap.set(s.itemName, existing);
  });

  // Aggregate other manual revenue accounts (4-102, 4-103, 7-101)
  expenses.forEach((e) => {
    const code = e.accountCode || '';
    if (code.startsWith('4-') && code !== '4-101') {
      const amt = e.amount || (e.quantity * (e.pricePerUnit || 0)) || 0;
      totalRevenue += amt;
      const accName = e.accountName || e.transactionName || 'Pendapatan Lainnya';
      const existing = revenueMap.get(accName) || { volume: e.quantity || 1, unit: e.unit || 'Ls', amount: 0 };
      existing.volume += e.quantity || 1;
      existing.amount += amt;
      revenueMap.set(accName, existing);
    }
  });

  const revenueDetails = Array.from(revenueMap.entries()).map(([name, data]) => ({
    name,
    volume: data.volume,
    unit: data.unit,
    amount: data.amount,
  }));

  // Aggregate purchases (HPP) by item name
  const hppMap = new Map<string, { volume: number; unit: string; amount: number }>();
  let totalHPP = 0;

  purchases.forEach((p) => {
    totalHPP += p.totalAmount;
    const existing = hppMap.get(p.itemName) || { volume: 0, unit: p.unit, amount: 0 };
    existing.volume += p.volume;
    existing.amount += p.totalAmount;
    hppMap.set(p.itemName, existing);
  });

  const hppDetails = Array.from(hppMap.entries()).map(([name, data]) => ({
    name,
    volume: data.volume,
    unit: data.unit,
    amount: data.amount,
  }));

  const grossProfit = totalRevenue - totalHPP;

  // Aggregate Expenses (Accounts 6-xxx and 7-201, excluding 7-301 tax expense so it's calculated in tax section)
  const expenseMap = new Map<string, number>();
  let totalOperatingExpense = 0;

  expenses.forEach((e) => {
    const code = e.accountCode || '6-101';
    // Only consider accounts that belong to operating/admin expenses (6-xxx or 7-201)
    if (code.startsWith('6-') || code === '7-201') {
      const amt = e.amount || (e.quantity * (e.pricePerUnit || 0)) || 0;
      totalOperatingExpense += amt;
      const key = e.accountName || e.category || 'Beban Operasional';
      const cur = expenseMap.get(key) || 0;
      expenseMap.set(key, cur + amt);
    }
  });

  const expenseDetails = Array.from(expenseMap.entries()).map(([category, amount]) => ({
    category,
    amount,
  }));

  const netOperatingProfit = grossProfit - totalOperatingExpense;
  const netProfitBeforeTax = netOperatingProfit;

  // Calculate Integrated Tax Summary (PPN & Withholdings)
  let totalOutputPPN = 0;
  let totalWapuPPN = 0;
  let totalInputPPN = 0;
  let totalPrepaidPPh22 = 0;

  taxInvoices.forEach((tax) => {
    if (tax.status === 'Dibatalkan') return;
    if (tax.type === 'keluaran') {
      totalOutputPPN += tax.ppnAmount;
      if (tax.isWapu) {
        totalWapuPPN += tax.ppnAmount;
        if (tax.pph22Amount) totalPrepaidPPh22 += tax.pph22Amount;
      }
    } else if (tax.type === 'masukan') {
      totalInputPPN += tax.ppnAmount;
    }
  });

  purchases.forEach((p) => {
    if (p.hasInputTax && p.inputPPNAmount && !taxInvoices.some((t) => t.refNumber === p.deliveryNoteNumber)) {
      totalInputPPN += p.inputPPNAmount;
    }
  });
  expenses.forEach((e) => {
    if (e.inputPPNAmount && !taxInvoices.some((t) => t.refNumber === `EXP-${e.id.slice(-4)}`)) {
      totalInputPPN += e.inputPPNAmount;
    }
  });

  let totalWithholdingPPh23 = 0;
  let totalWithholdingPPh21 = 0;
  withholdingSlips.forEach((w) => {
    if (w.taxType === 'PPh 23') totalWithholdingPPh23 += w.taxAmount;
    if (w.taxType === 'PPh 21') totalWithholdingPPh21 += w.taxAmount;
    if (w.taxType === 'PPh 22' && !totalPrepaidPPh22) totalPrepaidPPh22 += w.taxAmount;
  });

  const nonWapuOutputPPN = totalOutputPPN - totalWapuPPN;
  const netPPNPayable = nonWapuOutputPPN - totalInputPPN;

  // =========================================================================
  // PAJAK PENGHASILAN (PPH / INCOME TAX) CALCULATION ENGINE
  // =========================================================================
  let schemeLabel = 'PPh Final UMKM PP 55/2022 (0.5% Omzet)';
  let taxableBase = totalRevenue;
  let taxRate = 0.5;
  let grossTaxExpense = 0;
  let description = 'Dikenakan 0.5% dari total peredaran bruto (omzet penjualan) sesuai PP 55 Tahun 2022.';

  if (taxScheme === 'pp55_final_0_5') {
    schemeLabel = 'PPh Final UMKM PP 55/2022 (0.5% dari Omzet)';
    taxableBase = totalRevenue;
    taxRate = 0.5;
    grossTaxExpense = Math.round(totalRevenue * 0.005);
    description = 'Beban Pajak Penghasilan Final UMKM (PP No. 55/2022) sebesar 0.5% dari seluruh peredaran bruto/omzet penjualan.';
  } else if (taxScheme === 'badan_fasilitas_11') {
    schemeLabel = 'PPh Badan Fasilitas Ps. 31E UU HPP (11% Laba Kena Pajak)';
    taxableBase = Math.max(0, netProfitBeforeTax);
    taxRate = 11;
    grossTaxExpense = Math.round(taxableBase * 0.11);
    description = 'Fasilitas Pasal 31E UU HPP: Pengurangan tarif 50% dari tarif normal 22% (Tarif Efektif 11%) atas Penghasilan Kena Pajak bagi wajib pajak badan beromzet s/d Rp 4.8 Miliar.';
  } else if (taxScheme === 'badan_normal_22') {
    schemeLabel = 'PPh Badan Tarif Normal UU HPP (22% Laba Kena Pajak)';
    taxableBase = Math.max(0, netProfitBeforeTax);
    taxRate = 22;
    grossTaxExpense = Math.round(taxableBase * 0.22);
    description = 'Tarif umum PPh Badan sebesar 22% dari Penghasilan Kena Pajak (Laba Sebelum Pajak) sesuai UU HPP No. 7 Tahun 2021.';
  } else if (taxScheme === 'manual') {
    schemeLabel = 'Pajak Penghasilan Kustom / Penyesuaian Manual';
    taxableBase = netProfitBeforeTax;
    grossTaxExpense = manualTaxAmount !== undefined ? manualTaxAmount : Math.round(totalRevenue * 0.005);
    taxRate = netProfitBeforeTax > 0 ? (grossTaxExpense / netProfitBeforeTax) * 100 : 0;
    description = 'Nominal beban pajak penghasilan diatur secara manual berdasarkan rekonsiliasi fiskal perusahaan.';
  } else if (taxScheme === 'none') {
    schemeLabel = 'Tanpa Pajak Penghasilan (0%)';
    taxableBase = 0;
    taxRate = 0;
    grossTaxExpense = 0;
    description = 'Beban pajak penghasilan dinonaktifkan (Rp 0).';
  }

  // Check if user manually entered any expense with account 7-301 in expenses
  const recorded7301Tax = expenses
    .filter((e) => e.accountCode === '7-301')
    .reduce((sum, e) => sum + (e.amount || 0), 0);

  if (recorded7301Tax > 0 && taxScheme === 'pp55_final_0_5' && grossTaxExpense === 0) {
    grossTaxExpense = recorded7301Tax;
  }

  const prepaidTaxCredit = totalPrepaidPPh22 + totalWithholdingPPh23;
  const netTaxPayable = Math.max(0, grossTaxExpense - prepaidTaxCredit);
  const effectiveTaxRate = totalRevenue > 0 ? (grossTaxExpense / totalRevenue) * 100 : 0;
  const incomeTaxExpense = grossTaxExpense;
  const estimatedIncomeTax = grossTaxExpense;

  // Laba Bersih Setelah Pajak Penghasilan (Net Profit After Tax)
  const netProfit = netProfitBeforeTax - incomeTaxExpense;

  const incomeTax: IncomeTaxDetail = {
    scheme: taxScheme,
    schemeLabel,
    taxableBase,
    taxRate,
    grossTaxExpense,
    prepaidTaxCredit,
    netTaxPayable,
    effectiveTaxRate,
    description,
  };

  return {
    totalRevenue,
    revenueDetails,
    totalHPP,
    hppDetails,
    grossProfit,
    totalOperatingExpense,
    expenseDetails,
    netOperatingProfit,
    netProfitBeforeTax,
    incomeTax,
    incomeTaxExpense,
    totalOutputPPN,
    totalWapuPPN,
    totalInputPPN,
    netPPNPayable,
    totalPrepaidPPh22,
    totalWithholdingPPh23,
    totalWithholdingPPh21,
    estimatedIncomeTax,
    netProfit,
  };
}

export function generateBalanceSheet(
  ledger: LedgerAccount[],
  netProfit: number
): BalanceSheetData {
  // Collect asset accounts
  const assetAccounts = ledger.filter((a) => a.category === 'Aset' && (a.totalDebit > 0 || a.totalCredit > 0 || a.finalBalance !== 0));
  const currentAssets = assetAccounts.map((a) => ({
    name: a.name,
    code: a.code,
    amount: a.finalBalance,
  }));
  const totalAssets = currentAssets.reduce((sum, item) => sum + item.amount, 0);

  // Collect liability accounts
  const liabilityAccounts = ledger.filter((a) => a.category === 'Kewajiban' && (a.totalDebit > 0 || a.totalCredit > 0 || a.finalBalance !== 0));
  const currentLiabilities = liabilityAccounts.map((a) => ({
    name: a.name,
    code: a.code,
    amount: a.finalBalance,
  }));
  const totalLiabilities = currentLiabilities.reduce((sum, item) => sum + item.amount, 0);

  // Collect equity accounts
  const modalAccount = ledger.find((a) => a.code === '3-101');
  const priveAccount = ledger.find((a) => a.code === '3-102');
  const modalAwal = modalAccount ? modalAccount.finalBalance : INITIAL_EQUITY;
  const priveAmount = priveAccount ? priveAccount.finalBalance : 0;

  const equityItems = [
    { name: 'Modal Awal Disetor Pemilik', code: '3-101', amount: modalAwal },
  ];
  if (priveAmount > 0) {
    equityItems.push({ name: 'Prive / Penarikan Pribadi Pemilik', code: '3-102', amount: -priveAmount });
  }

  const totalEquity = modalAwal - priveAmount + netProfit;
  const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;
  const discrepancy = Math.abs(totalAssets - totalLiabilitiesAndEquity);
  const isBalanced = discrepancy < 1;

  return {
    assets: {
      currentAssets,
      totalCurrentAssets: totalAssets,
      totalAssets,
    },
    liabilities: {
      currentLiabilities,
      totalLiabilities,
    },
    equity: {
      items: equityItems,
      currentPeriodProfit: netProfit,
      totalEquity,
    },
    isBalanced,
    discrepancy,
  };
}

export function calculateInvoiceReceivablesSummary(invoices: InvoiceRecord[] = []) {
  let totalInvoiced = 0;
  let totalNetReceivable = 0;
  let totalPaid = 0;
  let totalRemaining = 0;
  let countLunas = 0;
  let countSebagian = 0;
  let countBelumLunas = 0;

  invoices.forEach((inv) => {
    const netAmount = inv.isWapu && inv.netReceivableAmount ? inv.netReceivableAmount : inv.totalAmount;
    totalInvoiced += inv.totalAmount;
    totalNetReceivable += netAmount;
    totalPaid += inv.amountPaid || 0;
    totalRemaining += Math.max(0, netAmount - (inv.amountPaid || 0));

    if (inv.status === 'Lunas' || (inv.amountPaid >= netAmount && netAmount > 0)) {
      countLunas++;
    } else if (inv.status === 'Sebagian' || (inv.amountPaid > 0 && inv.amountPaid < netAmount)) {
      countSebagian++;
    } else {
      countBelumLunas++;
    }
  });

  const collectionRate = totalNetReceivable > 0 ? (totalPaid / totalNetReceivable) * 100 : 0;

  return {
    totalInvoiced,
    totalNetReceivable,
    totalPaid,
    totalRemaining,
    countLunas,
    countSebagian,
    countBelumLunas,
    totalCount: invoices.length,
    collectionRate,
  };
}


