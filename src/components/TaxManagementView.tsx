import React, { useState, useMemo } from 'react';
import {
  FileCheck2,
  Download,
  Plus,
  Printer,
  Calculator,
  Building2,
  Calendar,
  Layers,
  ArrowDownLeft,
  ArrowUpRight,
  Receipt,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Settings,
  ShieldCheck,
  Search,
  Filter,
  Trash2,
  Edit,
  Info,
} from 'lucide-react';
import {
  ClientSupplier,
  CompanyProfile,
  SaleTransaction,
  PurchaseTransaction,
  TaxCalculationType,
  TaxInvoiceEntry,
  TaxProfile,
  WithholdingTaxSlip,
} from '../types';
import {
  calculateMonthlyTaxSummary,
  calculateTransactionTax,
  downloadTaxCSV,
  formatNPWP,
  formatNSFP,
  generateEFakturOutputCSV,
} from '../utils/taxHelper';
import { formatDateIndo, formatNumber, formatRupiah, terbilang } from '../utils/formatters';

interface TaxManagementViewProps {
  companyProfile: CompanyProfile;
  taxProfile: TaxProfile;
  onUpdateTaxProfile: (updated: TaxProfile) => void;
  taxInvoices: TaxInvoiceEntry[];
  onAddTaxInvoice: (invoice: TaxInvoiceEntry) => void;
  onUpdateTaxInvoice?: (invoice: TaxInvoiceEntry) => void;
  onDeleteTaxInvoice: (id: string) => void;
  withholdingSlips: WithholdingTaxSlip[];
  onAddWithholdingSlip: (slip: WithholdingTaxSlip) => void;
  onDeleteWithholdingSlip: (id: string) => void;
  sales: SaleTransaction[];
  purchases: PurchaseTransaction[];
  clientsSuppliers: ClientSupplier[];
  onOpenPrintModal: (title: string, content: React.ReactNode) => void;
}

export const TaxManagementView: React.FC<TaxManagementViewProps> = ({
  companyProfile,
  taxProfile,
  onUpdateTaxProfile,
  taxInvoices,
  onAddTaxInvoice,
  onUpdateTaxInvoice,
  onDeleteTaxInvoice,
  withholdingSlips,
  onAddWithholdingSlip,
  onDeleteWithholdingSlip,
  sales,
  purchases,
  clientsSuppliers,
  onOpenPrintModal,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<
    'ringkasan' | 'faktur-keluaran' | 'faktur-masukan' | 'ebupot' | 'kalkulator' | 'pengaturan-pajak'
  >('ringkasan');

  const [selectedPeriod, setSelectedPeriod] = useState<string>('2026-08');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Form Modal States for Tax Invoice (Add & Edit)
  const [showAddInvoiceModal, setShowAddInvoiceModal] = useState<boolean>(false);
  const [editingInvoice, setEditingInvoice] = useState<TaxInvoiceEntry | null>(null);
  const [invoiceType, setInvoiceType] = useState<'keluaran' | 'masukan'>('keluaran');
  const [invTaxNumber, setInvTaxNumber] = useState<string>('');
  const [invRefNumber, setInvRefNumber] = useState<string>('');
  const [invDate, setInvDate] = useState<string>('2026-08-17');
  const [invCounterparty, setInvCounterparty] = useState<string>('');
  const [invNPWP, setInvNPWP] = useState<string>('');
  const [invAddress, setInvAddress] = useState<string>('');
  const [invTransCode, setInvTransCode] = useState<'01' | '02' | '03' | '04' | '07' | '08'>('01');
  const [invDPP, setInvDPP] = useState<number>(10000000);
  const [invPPNRate, setInvPPNRate] = useState<number>(11);
  const [invIsWapu, setInvIsWapu] = useState<boolean>(false);
  const [invPPh22Rate, setInvPPh22Rate] = useState<number>(1.5);
  const [invStatus, setInvStatus] = useState<'Approved' | 'Draft' | 'Dibatalkan'>('Approved');
  const [invNTPN, setInvNTPN] = useState<string>('');
  const [invNotes, setInvNotes] = useState<string>('');

  // Open modal for new invoice
  const handleOpenAddInvoiceModal = (type: 'keluaran' | 'masukan') => {
    setEditingInvoice(null);
    setInvoiceType(type);
    const today = new Date().toISOString().slice(0, 10);
    setInvDate(today);
    if (type === 'keluaran') {
      const nextIndex = taxProfile.lastNsfpIndex + 1;
      setInvTaxNumber(formatNSFP(taxProfile.nsfpPrefix, nextIndex));
    } else {
      setInvTaxNumber('');
    }
    setInvRefNumber('');
    setInvCounterparty('');
    setInvNPWP('');
    setInvAddress('');
    setInvTransCode('01');
    setInvDPP(10000000);
    setInvPPNRate(11);
    setInvIsWapu(false);
    setInvPPh22Rate(1.5);
    setInvStatus('Approved');
    setInvNTPN('');
    setInvNotes('');
    setShowAddInvoiceModal(true);
  };

  // Open modal for editing existing invoice
  const handleOpenEditInvoiceModal = (inv: TaxInvoiceEntry) => {
    setEditingInvoice(inv);
    setInvoiceType(inv.type);
    setInvTaxNumber(inv.taxNumber);
    setInvRefNumber(inv.refNumber);
    setInvDate(inv.date);
    setInvCounterparty(inv.counterpartyName);
    setInvNPWP(inv.counterpartyNPWP);
    setInvAddress(inv.counterpartyAddress || '');
    setInvTransCode(inv.transactionCode || '01');
    setInvDPP(inv.dpp);
    setInvPPNRate(inv.ppnRate ?? 11);
    setInvIsWapu(inv.isWapu ?? false);
    setInvPPh22Rate(inv.pph22Rate ?? 1.5);
    setInvStatus(inv.status || 'Approved');
    setInvNTPN(inv.ntpn || '');
    setInvNotes(inv.notes || '');
    setShowAddInvoiceModal(true);
  };

  // Form Modal for New Withholding Slip
  const [showAddSlipModal, setShowAddSlipModal] = useState<boolean>(false);
  const [slipTaxType, setSlipTaxType] = useState<'PPh 22' | 'PPh 23' | 'PPh 4(2)' | 'PPh 21'>('PPh 23');
  const [slipDate, setSlipDate] = useState<string>('2026-08-17');
  const [slipRecipient, setSlipRecipient] = useState<string>('');
  const [slipNPWP, setSlipNPWP] = useState<string>('');
  const [slipObjDesc, setSlipObjDesc] = useState<string>('Sewa Kendaraan Dump Truck / Armada Angkut');
  const [slipGross, setSlipGross] = useState<number>(5000000);
  const [slipRate, setSlipRate] = useState<number>(2.0);

  // Calculator State
  const [calcBaseAmount, setCalcBaseAmount] = useState<number>(50000000);
  const [calcTaxType, setCalcTaxType] = useState<TaxCalculationType>('exclude');
  const [calcPPNRate, setCalcPPNRate] = useState<number>(11);
  const [calcPPh22Rate, setCalcPPh22Rate] = useState<number>(1.5);
  const [calcIsWapu, setCalcIsWapu] = useState<boolean>(true);

  // Filtered Tax Summary
  const taxSummary = useMemo(() => {
    return calculateMonthlyTaxSummary(taxInvoices, withholdingSlips, selectedPeriod);
  }, [taxInvoices, withholdingSlips, selectedPeriod]);

  // Filtered Invoices (Diurutkan dari Tanggal Terbaru ke Terlama)
  const filteredInvoices = useMemo(() => {
    return taxInvoices
      .filter((inv) => {
        const matchPeriod = selectedPeriod === 'semua' || inv.taxPeriod === selectedPeriod || inv.date.startsWith(selectedPeriod);
        const matchQuery =
          inv.counterpartyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          inv.taxNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          inv.refNumber.toLowerCase().includes(searchQuery.toLowerCase());
        return matchPeriod && matchQuery;
      })
      .sort((a, b) => {
        const dateDiff = b.date.localeCompare(a.date);
        if (dateDiff !== 0) return dateDiff;
        return (b.taxNumber || '').localeCompare(a.taxNumber || '');
      });
  }, [taxInvoices, selectedPeriod, searchQuery]);

  const outputInvoices = useMemo(
    () => filteredInvoices.filter((i) => i.type === 'keluaran'),
    [filteredInvoices]
  );
  const inputInvoices = useMemo(
    () => filteredInvoices.filter((i) => i.type === 'masukan'),
    [filteredInvoices]
  );

  // Filtered Withholding Slips (Diurutkan dari Tanggal Terbaru ke Terlama)
  const filteredSlips = useMemo(() => {
    return withholdingSlips
      .filter((s) => {
        const matchPeriod = selectedPeriod === 'semua' || s.taxPeriod === selectedPeriod || s.date.startsWith(selectedPeriod);
        const matchQuery =
          s.recipientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.slipNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.objectDescription.toLowerCase().includes(searchQuery.toLowerCase());
        return matchPeriod && matchQuery;
      })
      .sort((a, b) => {
        const dateDiff = b.date.localeCompare(a.date);
        if (dateDiff !== 0) return dateDiff;
        return (b.slipNumber || '').localeCompare(a.slipNumber || '');
      });
  }, [withholdingSlips, selectedPeriod, searchQuery]);

  // Handle save (create or update) tax invoice
  const handleSaveTaxInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    const ppnAmount = Math.round((invDPP * invPPNRate) / 100);
    const pph22Amount = invIsWapu ? Math.round((invDPP * invPPh22Rate) / 100) : 0;

    if (editingInvoice) {
      const updatedEntry: TaxInvoiceEntry = {
        ...editingInvoice,
        type: invoiceType,
        taxNumber: invTaxNumber || editingInvoice.taxNumber,
        refNumber: invRefNumber || editingInvoice.refNumber,
        date: invDate,
        taxPeriod: invDate.slice(0, 7),
        counterpartyName: invCounterparty || (invoiceType === 'keluaran' ? 'Pelanggan Proyek' : 'Pemasok Material'),
        counterpartyNPWP: invNPWP || '00.000.000.0-000.000',
        counterpartyAddress: invAddress || '',
        transactionCode: invTransCode,
        dpp: invDPP,
        ppnRate: invPPNRate,
        ppnAmount,
        pph22Rate: invIsWapu ? invPPh22Rate : 0,
        pph22Amount,
        isWapu: invIsWapu,
        status: invStatus,
        ntpn: invNTPN,
        notes: invNotes,
      };

      if (onUpdateTaxInvoice) {
        onUpdateTaxInvoice(updatedEntry);
      }
    } else {
      let finalTaxNumber = invTaxNumber;
      let nextIndex = taxProfile.lastNsfpIndex;
      if (invoiceType === 'keluaran' && !finalTaxNumber) {
        nextIndex = taxProfile.lastNsfpIndex + 1;
        finalTaxNumber = formatNSFP(taxProfile.nsfpPrefix, nextIndex);
      } else if (!finalTaxNumber) {
        finalTaxNumber = `FM-${invDate.replace(/-/g, '')}-${Date.now().toString().slice(-4)}`;
      }

      const newEntry: TaxInvoiceEntry = {
        id: `tax-${Date.now()}`,
        type: invoiceType,
        taxNumber: finalTaxNumber,
        refNumber: invRefNumber || `REF-${Date.now().toString().slice(-4)}`,
        date: invDate,
        taxPeriod: invDate.slice(0, 7),
        counterpartyName: invCounterparty || (invoiceType === 'keluaran' ? 'Pelanggan Proyek' : 'Pemasok Material'),
        counterpartyNPWP: invNPWP || '00.000.000.0-000.000',
        counterpartyAddress: invAddress || 'Alamat Belum Terdaftar',
        transactionCode: invTransCode,
        dpp: invDPP,
        ppnRate: invPPNRate,
        ppnAmount,
        pph22Rate: invIsWapu ? invPPh22Rate : 0,
        pph22Amount,
        isWapu: invIsWapu,
        status: invStatus,
        ntpn: invNTPN,
        notes: invNotes,
        createdAt: new Date().toISOString(),
      };

      onAddTaxInvoice(newEntry);
      if (invoiceType === 'keluaran' && nextIndex > taxProfile.lastNsfpIndex) {
        onUpdateTaxProfile({
          ...taxProfile,
          lastNsfpIndex: nextIndex,
        });
      }
    }

    setShowAddInvoiceModal(false);
    setEditingInvoice(null);
    // Reset
    setInvRefNumber('');
    setInvDPP(10000000);
    setInvNotes('');
  };

  // Handle create withholding slip
  const handleSaveWithholdingSlip = (e: React.FormEvent) => {
    e.preventDefault();
    const taxAmount = Math.round((slipGross * slipRate) / 100);
    const newSlip: WithholdingTaxSlip = {
      id: `bp-${Date.now()}`,
      slipNumber: `BP-${slipTaxType.replace(/\s+/g, '')}/${slipDate.replace(/-/g, '')}/${Math.floor(100 + Math.random() * 900)}`,
      taxType: slipTaxType,
      date: slipDate,
      taxPeriod: slipDate.slice(0, 7),
      recipientName: slipRecipient || 'Pihak Ketiga / Vendor',
      recipientNPWP: slipNPWP || '00.000.000.0-000.000',
      objectCode: slipTaxType === 'PPh 23' ? '28-102-01' : slipTaxType === 'PPh 22' ? '22-100-01' : '21-100-03',
      objectDescription: slipObjDesc,
      grossAmount: slipGross,
      rate: slipRate,
      taxAmount,
      bupotStatus: 'Final',
      createdAt: new Date().toISOString(),
    };

    onAddWithholdingSlip(newSlip);
    setShowAddSlipModal(false);
    setSlipRecipient('');
    setSlipGross(5000000);
  };

  // Export e-Faktur CSV
  const handleExportEFakturCSV = () => {
    const csvContent = generateEFakturOutputCSV(taxInvoices, companyProfile);
    const filename = `eFaktur_DJP_Keluaran_${selectedPeriod}_${companyProfile.name.replace(/\s+/g, '_')}.csv`;
    downloadTaxCSV(csvContent, filename);
  };

  // Print Official Tax Invoice
  const handlePrintTaxInvoice = (inv: TaxInvoiceEntry) => {
    const printContent = (
      <div className="font-sans text-slate-900 leading-tight space-y-3 p-2">
        {/* Header DJP Standar */}
        <div className="border-2 border-slate-900 p-2 text-center bg-slate-100 font-bold text-sm tracking-wider uppercase">
          FAKTUR PAJAK STANDAR DJP
        </div>

        {/* Kode dan Nomor Seri Faktur Pajak */}
        <div className="border border-slate-800 p-2 text-xs flex justify-between items-center bg-slate-50">
          <div>
            <span className="font-bold text-slate-600 block text-[10px]">KODE & NOMOR SERI FAKTUR PAJAK:</span>
            <span className="font-mono text-sm font-extrabold text-blue-950">{inv.taxNumber}</span>
          </div>
          <div className="text-right text-[11px]">
            <span className="font-bold block">Status: RESMI / VALID</span>
            <span className="text-slate-600">Masa Pajak: {inv.taxPeriod}</span>
          </div>
        </div>

        {/* Pengusaha Kena Pajak (Penjual) */}
        <div className="border border-slate-800 p-2.5 text-xs space-y-1 bg-white">
          <div className="font-bold text-[11px] text-slate-800 uppercase border-b border-slate-300 pb-1 mb-1">
            PENGUSAHA KENA PAJAK (PENJUAL / SUPPLIER)
          </div>
          <div className="grid grid-cols-4 gap-2">
            <span className="text-slate-600">Nama PKP:</span>
            <span className="col-span-3 font-bold">{companyProfile.name}</span>
            <span className="text-slate-600">Alamat:</span>
            <span className="col-span-3">{companyProfile.address}</span>
            <span className="text-slate-600">NPWP / NIK:</span>
            <span className="col-span-3 font-mono font-bold text-blue-900">{formatNPWP(companyProfile.npwp)}</span>
            <span className="text-slate-600">NITKU:</span>
            <span className="col-span-3 font-mono">{taxProfile.nitku}</span>
          </div>
        </div>

        {/* Pembeli Barang Kena Pajak / Penerima Jasa */}
        <div className="border border-slate-800 p-2.5 text-xs space-y-1 bg-white">
          <div className="font-bold text-[11px] text-slate-800 uppercase border-b border-slate-300 pb-1 mb-1">
            PEMBELI BARANG KENA PAJAK / PENERIMA JASA KENA PAJAK
          </div>
          <div className="grid grid-cols-4 gap-2">
            <span className="text-slate-600">Nama Pembeli:</span>
            <span className="col-span-3 font-bold">{inv.counterpartyName}</span>
            <span className="text-slate-600">Alamat:</span>
            <span className="col-span-3">{inv.counterpartyAddress}</span>
            <span className="text-slate-600">NPWP / NIK:</span>
            <span className="col-span-3 font-mono font-bold text-slate-900">{formatNPWP(inv.counterpartyNPWP)}</span>
            <span className="text-slate-600">Referensi / PO:</span>
            <span className="col-span-3 font-mono font-semibold">{inv.refNumber}</span>
          </div>
        </div>

        {/* Tabel Penyerahan Barang Kena Pajak */}
        <div className="border border-slate-800">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-slate-200 border-b border-slate-800 font-bold text-slate-800">
                <th className="p-1.5 border-r border-slate-400 w-8 text-center">No</th>
                <th className="p-1.5 border-r border-slate-400 text-left">Nama Barang Kena Pajak / Jasa Kena Pajak</th>
                <th className="p-1.5 text-right">Harga Jual / Penggantian (Rp)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-2 border-r border-slate-300 text-center">1</td>
                <td className="p-2 border-r border-slate-300">
                  <div className="font-semibold text-slate-900">
                    Penyerahan Material Konstruksi (Batu Split / Pasir / Base Course)
                  </div>
                  <div className="text-[10px] text-slate-500">Ref Transaksi: {inv.refNumber} - {inv.notes}</div>
                </td>
                <td className="p-2 text-right font-mono font-bold text-slate-900">{formatRupiah(inv.dpp)}</td>
              </tr>
            </tbody>
            <tfoot className="border-t border-slate-800 text-xs font-semibold bg-slate-50">
              <tr className="border-b border-slate-300">
                <td colSpan={2} className="p-1.5 text-right border-r border-slate-300">
                  Harga Jual / Penggantian / Dasar Pengenaan Pajak (DPP):
                </td>
                <td className="p-1.5 text-right font-mono font-bold">{formatRupiah(inv.dpp)}</td>
              </tr>
              <tr className="border-b border-slate-300">
                <td colSpan={2} className="p-1.5 text-right border-r border-slate-300">
                  PPN = {inv.ppnRate}% × Dasar Pengenaan Pajak:
                </td>
                <td className="p-1.5 text-right font-mono font-bold text-blue-900">{formatRupiah(inv.ppnAmount)}</td>
              </tr>
              {inv.isWapu && inv.pph22Amount ? (
                <tr className="border-b border-slate-300 text-amber-900">
                  <td colSpan={2} className="p-1.5 text-right border-r border-slate-300">
                    PPh Pasal 22 ({inv.pph22Rate}%) Dipungut WAPU Bendahara/BUMN:
                  </td>
                  <td className="p-1.5 text-right font-mono font-bold">({formatRupiah(inv.pph22Amount)})</td>
                </tr>
              ) : null}
              <tr className="bg-slate-200 text-slate-900 font-extrabold">
                <td colSpan={2} className="p-2 text-right border-r border-slate-400 uppercase">
                  Total Nilai Faktur:
                </td>
                <td className="p-2 text-right font-mono text-sm">{formatRupiah(inv.dpp + inv.ppnAmount)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Terbilang PPN */}
        <div className="p-2 bg-slate-100 border border-slate-300 rounded text-xs space-y-0.5">
          <span className="font-bold text-[10px] text-slate-500 uppercase">TERBILANG PPN:</span>
          <p className="font-semibold italic text-slate-800"># {terbilang(inv.ppnAmount)} Rupiah #</p>
        </div>

        {/* Tanda Tangan & QR Code Verifikasi */}
        <div className="pt-2 flex justify-between items-end text-xs">
          <div className="text-[10px] text-slate-500 max-w-xs space-y-1">
            <p>Sesuai dengan ketentuan perpajakan Republik Indonesia (UU HPP & Peraturan DJP No. PER-03/PJ/2022).</p>
            <p className="font-mono text-slate-400">ID Dokumen: {inv.id} | Status e-Faktur: APPROVED</p>
          </div>

          <div className="text-center space-y-1 min-w-[200px]">
            <p className="text-slate-600 text-[11px]">Cibinong, {formatDateIndo(inv.date)}</p>
            <p className="font-bold text-slate-900 text-xs">Kuasa Pengusaha Kena Pajak,</p>
            <div className="h-14 flex items-center justify-center">
              <div className="border border-dashed border-blue-600 bg-blue-50/50 text-blue-800 text-[10px] px-3 py-1 font-mono rounded">
                [ TANDA TANGAN ELEKTRONIK TERSERTIFIKASI ]
              </div>
            </div>
            <p className="font-extrabold text-slate-900 text-xs underline">{companyProfile.signatoryName}</p>
            <p className="text-[10px] text-slate-600">{companyProfile.signatoryRole}</p>
          </div>
        </div>
      </div>
    );

    onOpenPrintModal(`Faktur Pajak Standar ${inv.taxNumber}`, printContent);
  };

  // Print Withholding Tax Slip (e-Bupot)
  const handlePrintWithholdingSlip = (slip: WithholdingTaxSlip) => {
    const printContent = (
      <div className="font-sans text-slate-900 leading-tight space-y-3 p-2">
        <div className="border-2 border-slate-900 p-2 text-center bg-slate-100 font-bold text-sm tracking-wider uppercase">
          BUKTI PEMOTONGAN PAJAK PENGHASILAN ({slip.taxType.toUpperCase()})
        </div>

        <div className="border border-slate-800 p-2 text-xs flex justify-between items-center bg-slate-50">
          <div>
            <span className="font-bold text-slate-600 block text-[10px]">NOMOR BUKTI POTONG (UNIFIKASI):</span>
            <span className="font-mono text-sm font-extrabold text-blue-950">{slip.slipNumber}</span>
          </div>
          <div className="text-right text-[11px]">
            <span className="font-bold block">Masa / Tahun Pajak: {slip.taxPeriod}</span>
            <span className="text-emerald-700 font-bold">STATUS: FINAL & VALID</span>
          </div>
        </div>

        <div className="border border-slate-800 p-2.5 text-xs space-y-1 bg-white">
          <div className="font-bold text-[11px] text-slate-800 uppercase border-b border-slate-300 pb-1 mb-1">
            A. IDENTITAS PEMOTONG PAJAK
          </div>
          <div className="grid grid-cols-4 gap-2">
            <span className="text-slate-600">NPWP Pemotong:</span>
            <span className="col-span-3 font-mono font-bold text-blue-900">{formatNPWP(companyProfile.npwp)}</span>
            <span className="text-slate-600">Nama Pemotong:</span>
            <span className="col-span-3 font-bold">{companyProfile.name}</span>
            <span className="text-slate-600">Alamat Pemotong:</span>
            <span className="col-span-3">{companyProfile.address}</span>
          </div>
        </div>

        <div className="border border-slate-800 p-2.5 text-xs space-y-1 bg-white">
          <div className="font-bold text-[11px] text-slate-800 uppercase border-b border-slate-300 pb-1 mb-1">
            B. IDENTITAS PIHAK YANG DIPOTONG
          </div>
          <div className="grid grid-cols-4 gap-2">
            <span className="text-slate-600">NPWP / NIK:</span>
            <span className="col-span-3 font-mono font-bold">{formatNPWP(slip.recipientNPWP)}</span>
            <span className="text-slate-600">Nama Penerima:</span>
            <span className="col-span-3 font-bold">{slip.recipientName}</span>
          </div>
        </div>

        <div className="border border-slate-800">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-slate-200 border-b border-slate-800 font-bold text-slate-800">
                <th className="p-1.5 border-r border-slate-400 w-16 text-center">Kode Objek</th>
                <th className="p-1.5 border-r border-slate-400 text-left">Uraian Objek Pemotongan</th>
                <th className="p-1.5 border-r border-slate-400 text-right">Jumlah Penghasilan Bruto (Rp)</th>
                <th className="p-1.5 border-r border-slate-400 text-center w-16">Tarif (%)</th>
                <th className="p-1.5 text-right">PPh Yang Dipotong (Rp)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-2 border-r border-slate-300 text-center font-mono font-bold">{slip.objectCode}</td>
                <td className="p-2 border-r border-slate-300 font-semibold">{slip.objectDescription}</td>
                <td className="p-2 border-r border-slate-300 text-right font-mono">{formatRupiah(slip.grossAmount)}</td>
                <td className="p-2 border-r border-slate-300 text-center font-mono font-bold">{slip.rate}%</td>
                <td className="p-2 text-right font-mono font-extrabold text-blue-900">{formatRupiah(slip.taxAmount)}</td>
              </tr>
            </tbody>
            <tfoot className="border-t border-slate-800 text-xs font-bold bg-slate-200 text-slate-900">
              <tr>
                <td colSpan={2} className="p-2 text-right border-r border-slate-400 uppercase">
                  TOTAL JUMLAH PPh TERPOTONG:
                </td>
                <td className="p-2 text-right border-r border-slate-400 font-mono">{formatRupiah(slip.grossAmount)}</td>
                <td className="p-2 border-r border-slate-400"></td>
                <td className="p-2 text-right font-mono text-sm font-extrabold text-slate-950">
                  {formatRupiah(slip.taxAmount)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="p-2 bg-slate-100 border border-slate-300 rounded text-xs">
          <span className="font-bold text-[10px] text-slate-500 uppercase block">TERBILANG PPH:</span>
          <p className="font-semibold italic text-slate-800"># {terbilang(slip.taxAmount)} Rupiah #</p>
        </div>

        <div className="pt-2 flex justify-between items-end text-xs">
          <div className="text-[10px] text-slate-500 max-w-xs space-y-1">
            <p>Bukti Pemotongan ini diterbitkan melalui modul e-Bupot Unifikasi terintegrasi.</p>
          </div>

          <div className="text-center space-y-1 min-w-[200px]">
            <p className="text-slate-600 text-[11px]">Tanggal: {formatDateIndo(slip.date)}</p>
            <p className="font-bold text-slate-900 text-xs">Pemotong Pajak,</p>
            <div className="h-12 flex items-center justify-center">
              <span className="text-[10px] font-mono text-blue-700 bg-blue-50 px-2 py-0.5 border border-blue-200 rounded">
                [ TERCATAT ELEKTRONIK ]
              </span>
            </div>
            <p className="font-extrabold text-slate-900 text-xs underline">{companyProfile.signatoryName}</p>
            <p className="text-[10px] text-slate-600">{companyProfile.signatoryRole}</p>
          </div>
        </div>
      </div>
    );

    onOpenPrintModal(`Bukti Potong ${slip.slipNumber}`, printContent);
  };

  // Calculator Result
  const calcResult = useMemo(() => {
    return calculateTransactionTax(
      calcBaseAmount,
      calcTaxType,
      calcPPNRate,
      calcPPh22Rate,
      calcIsWapu
    );
  }, [calcBaseAmount, calcTaxType, calcPPNRate, calcPPh22Rate, calcIsWapu]);

  return (
    <div className="space-y-3.5 pb-12">
      {/* Top Header / Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-white p-3.5 rounded border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
              Perpajakan Terintegrasi & Faktur Pajak DJP
            </h2>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800 border border-blue-300">
              PKP AKTIF
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Manajemen PPN 11%, WAPU BUMN, Faktur Pajak Keluaran/Masukan, e-Bupot PPh 22/23/21 & Ekspor CSV DJP
          </p>
        </div>

        {/* Filter Masa Pajak */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1.5 rounded border border-slate-300 text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span className="font-semibold text-slate-600">Masa Pajak:</span>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="bg-transparent font-bold text-slate-900 focus:outline-none cursor-pointer"
            >
              <option value="2026-08">Agustus 2026</option>
              <option value="2026-07">Juli 2026</option>
              <option value="2026-06">Juni 2026</option>
              <option value="semua">Semua Periode</option>
            </select>
          </div>

          <button
            id="btn-export-efaktur-csv"
            onClick={handleExportEFakturCSV}
            className="flex items-center gap-1 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded transition shadow-2xs cursor-pointer"
            title="Download file CSV siap impor ke aplikasi e-Faktur DJP"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Ekspor CSV e-Faktur</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-200 gap-1 bg-slate-100/70 p-1 rounded-t">
        <button
          onClick={() => setActiveSubTab('ringkasan')}
          className={`px-3 py-1.5 text-xs font-bold rounded flex items-center gap-1.5 transition ${
            activeSubTab === 'ringkasan'
              ? 'bg-white text-blue-700 shadow-2xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <Receipt className="w-3.5 h-3.5" />
          <span>Dashboard SPT Masa PPN</span>
        </button>

        <button
          onClick={() => setActiveSubTab('faktur-keluaran')}
          className={`px-3 py-1.5 text-xs font-bold rounded flex items-center gap-1.5 transition ${
            activeSubTab === 'faktur-keluaran'
              ? 'bg-white text-blue-700 shadow-2xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
          <span>Faktur Pajak Keluaran ({outputInvoices.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('faktur-masukan')}
          className={`px-3 py-1.5 text-xs font-bold rounded flex items-center gap-1.5 transition ${
            activeSubTab === 'faktur-masukan'
              ? 'bg-white text-blue-700 shadow-2xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <ArrowDownLeft className="w-3.5 h-3.5 text-amber-600" />
          <span>Faktur Pajak Masukan ({inputInvoices.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('ebupot')}
          className={`px-3 py-1.5 text-xs font-bold rounded flex items-center gap-1.5 transition ${
            activeSubTab === 'ebupot'
              ? 'bg-white text-blue-700 shadow-2xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <FileCheck2 className="w-3.5 h-3.5 text-indigo-600" />
          <span>e-Bupot PPh 22/23/21 ({filteredSlips.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('kalkulator')}
          className={`px-3 py-1.5 text-xs font-bold rounded flex items-center gap-1.5 transition ${
            activeSubTab === 'kalkulator'
              ? 'bg-white text-blue-700 shadow-2xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <Calculator className="w-3.5 h-3.5 text-slate-700" />
          <span>Kalkulator & Tender Pajak</span>
        </button>

        <button
          onClick={() => setActiveSubTab('pengaturan-pajak')}
          className={`px-3 py-1.5 text-xs font-bold rounded flex items-center gap-1.5 transition ${
            activeSubTab === 'pengaturan-pajak'
              ? 'bg-white text-blue-700 shadow-2xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <Settings className="w-3.5 h-3.5 text-slate-600" />
          <span>Profil & NSFP</span>
        </button>
      </div>

      {/* TAB CONTENT: RINGKASAN SPT MASA & TAX HEALTH DASHBOARD */}
      {activeSubTab === 'ringkasan' && (
        <div className="space-y-3.5">
          {/* Top KPI Cards Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {/* PPN Keluaran */}
            <div className="bg-white p-3 rounded border border-slate-200 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase">
                <span>PPN Keluaran (Penjualan)</span>
                <ArrowUpRight className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-base font-extrabold text-slate-900 font-mono">
                {formatRupiah(taxSummary.totalOutputPPN)}
              </div>
              <div className="text-[10px] text-slate-500 flex justify-between pt-1 border-t border-slate-100">
                <span>Disetor Sendiri: {formatRupiah(taxSummary.outputPPNSelf)}</span>
                <span className="text-blue-700 font-semibold">WAPU: {formatRupiah(taxSummary.outputPPNWapu)}</span>
              </div>
            </div>

            {/* PPN Masukan */}
            <div className="bg-white p-3 rounded border border-slate-200 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase">
                <span>PPN Masukan (Pembelian)</span>
                <ArrowDownLeft className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-base font-extrabold text-slate-900 font-mono">
                {formatRupiah(taxSummary.totalInputPPN)}
              </div>
              <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                Dapat dikreditkan dari supplier/quarry
              </div>
            </div>

            {/* Status SPT Masa PPN (Kurang/Lebih Bayar) */}
            <div className={`p-3 rounded border shadow-2xs space-y-1 ${
              taxSummary.ppnUnderOverPayment > 0
                ? 'bg-rose-50 border-rose-200 text-rose-950'
                : 'bg-emerald-50 border-emerald-200 text-emerald-950'
            }`}>
              <div className="flex items-center justify-between text-[11px] font-bold uppercase">
                <span>Status PPN Masa 1111</span>
                <span className={`px-1.5 py-0.5 text-[9px] font-extrabold rounded ${
                  taxSummary.ppnUnderOverPayment > 0 ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'
                }`}>
                  {taxSummary.ppnStatus}
                </span>
              </div>
              <div className="text-base font-extrabold font-mono">
                {formatRupiah(Math.abs(taxSummary.ppnUnderOverPayment))}
              </div>
              <div className="text-[10px] opacity-80 pt-1 border-t border-current/20">
                {taxSummary.ppnUnderOverPayment > 0
                  ? 'Kewajiban setor ke Kas Negara'
                  : 'Lebih bayar dapat dikompensasikan'}
              </div>
            </div>

            {/* Kredit PPh 22 & Utang PPh Potongan */}
            <div className="bg-white p-3 rounded border border-slate-200 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase">
                <span>PPh 22 Terpungut WAPU</span>
                <FileCheck2 className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-base font-extrabold text-blue-900 font-mono">
                {formatRupiah(taxSummary.totalPPh22Prepaid)}
              </div>
              <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                Kredit Pajak PPh Badan Tahunan (Pasal 28A)
              </div>
            </div>
          </div>

          {/* SPT Masa 1111 Ringkasan Formulir Induk */}
          <div className="bg-white rounded border border-slate-200 shadow-2xs overflow-hidden">
            <div className="bg-slate-900 text-white p-2.5 px-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-blue-400" />
                <span className="font-bold text-xs tracking-wide">
                  REKAPITULASI FORMULIR INDUK SPT MASA PPN 1111 (PERIODE: {selectedPeriod})
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">NPWP: {taxProfile.npwp}</span>
            </div>

            <div className="p-3 text-xs space-y-3">
              {/* Bagian I: Penyerahan BKP / JKP */}
              <div>
                <h4 className="font-bold text-slate-800 text-[11px] uppercase border-b border-slate-200 pb-1 mb-1.5 flex items-center gap-1.5">
                  <span className="w-4 h-4 bg-slate-200 rounded text-center leading-4 text-[10px] font-bold">I</span>
                  I. PENYERAHAN BARANG KENA PAJAK / JASA KENA PAJAK
                </h4>
                <div className="space-y-1 pl-5">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">A. Terutang PPN (Penyerahan Dalam Negeri dengan Faktur Pajak):</span>
                    <span className="font-mono font-bold text-slate-900">{formatRupiah(taxSummary.totalOutputDPP)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100 pl-4 text-slate-500 text-[11px]">
                    <span>1. PPN yang harus dipungut sendiri (Kode Faktur 010):</span>
                    <span className="font-mono font-semibold text-slate-800">{formatRupiah(taxSummary.outputPPNSelf)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100 pl-4 text-slate-500 text-[11px]">
                    <span>2. PPN yang dipungut oleh Pemungut PPN (WAPU BUMN / Bendahara - Kode 020/030):</span>
                    <span className="font-mono font-semibold text-blue-800">{formatRupiah(taxSummary.outputPPNWapu)}</span>
                  </div>
                  <div className="flex justify-between py-1 font-bold text-slate-900 bg-slate-50 px-2 rounded">
                    <span>JUMLAH SELURUH PPN KELUARAN:</span>
                    <span className="font-mono text-blue-900">{formatRupiah(taxSummary.totalOutputPPN)}</span>
                  </div>
                </div>
              </div>

              {/* Bagian II: Penghitungan PPN Kurang/Lebih Bayar */}
              <div>
                <h4 className="font-bold text-slate-800 text-[11px] uppercase border-b border-slate-200 pb-1 mb-1.5 flex items-center gap-1.5">
                  <span className="w-4 h-4 bg-slate-200 rounded text-center leading-4 text-[10px] font-bold">II</span>
                  II. PENGHITUNGAN PPN KURANG BAYAR / LEBIH BAYAR
                </h4>
                <div className="space-y-1 pl-5">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">A. Pajak Keluaran yang harus dipungut sendiri:</span>
                    <span className="font-mono font-bold text-slate-900">{formatRupiah(taxSummary.outputPPNSelf)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">B. Pajak Masukan yang dapat dikreditkan:</span>
                    <span className="font-mono font-bold text-amber-800">({formatRupiah(taxSummary.totalInputPPN)})</span>
                  </div>
                  <div className={`flex justify-between py-1.5 px-2 rounded font-extrabold text-sm ${
                    taxSummary.ppnUnderOverPayment > 0 ? 'bg-rose-100 text-rose-950' : 'bg-emerald-100 text-emerald-950'
                  }`}>
                    <span>
                      C. PPN KURANG / (LEBIH) BAYAR ({taxSummary.ppnStatus}):
                    </span>
                    <span className="font-mono">{formatRupiah(taxSummary.ppnUnderOverPayment)}</span>
                  </div>
                </div>
              </div>

              {/* Kalender & Batas Waktu DJP */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-2">
                <div className="p-2.5 bg-blue-50 border border-blue-200 rounded space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-blue-900 text-xs">
                    <Info className="w-3.5 h-3.5 text-blue-600" />
                    Jadwal Batas Waktu Penyetoran & Pelaporan:
                  </div>
                  <ul className="text-[11px] text-blue-900 space-y-0.5 list-disc list-inside">
                    <li>
                      <strong>SPT Masa PPN:</strong> Akhir bulan berikutnya (Tgl 30/31)
                    </li>
                    <li>
                      <strong>SPT Masa Unifikasi (PPh 22/23/21):</strong> Tgl 20 bulan berikutnya
                    </li>
                    <li>
                      <strong>Kode Akun Pajak (KAP) PPN:</strong> 411211 (KJS: 100)
                    </li>
                  </ul>
                </div>

                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded space-y-1">
                  <div className="font-bold text-slate-800 text-xs flex items-center justify-between">
                    <span>Identitas Kantor Pelayanan Pajak (KPP)</span>
                    <span className="text-[10px] font-mono bg-slate-200 px-1.5 py-0.2 rounded">KLU: 46631</span>
                  </div>
                  <div className="text-[11px] text-slate-600 space-y-0.5">
                    <p>Terdaftar di: <strong>{taxProfile.kppName}</strong></p>
                    <p>EFIN Perusahaan: <strong>{taxProfile.efin}</strong></p>
                    <p>Status: Pengusaha Kena Pajak Sejak {formatDateIndo(taxProfile.pkpDate)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: FAKTUR PAJAK KELUARAN */}
      {activeSubTab === 'faktur-keluaran' && (
        <div className="space-y-3 bg-white p-3.5 rounded border border-slate-200 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                Daftar Faktur Pajak Keluaran (Penjualan Material Proyek)
              </h3>
              <p className="text-xs text-slate-500">
                Terhubung langsung dengan PO Proyek & Surat Jalan. Siap ekspor format e-Faktur DJP.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari NSFP / Klien / PO..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-7 pr-2.5 py-1 text-xs border border-slate-300 rounded w-48 focus:outline-none focus:border-blue-600"
                />
              </div>

              <button
                id="btn-add-tax-invoice-out"
                onClick={() => handleOpenAddInvoiceModal('keluaran')}
                className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded transition shadow-2xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Buat Faktur Keluaran</span>
              </button>
            </div>
          </div>

          {/* Tabel Faktur Pajak Keluaran */}
          <div className="overflow-x-auto border border-slate-200 rounded">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                  <th className="p-2 w-8 text-center">No</th>
                  <th className="p-2">Nomor Seri Faktur (NSFP)</th>
                  <th className="p-2">Tanggal</th>
                  <th className="p-2">Referensi PO / SJ</th>
                  <th className="p-2">Nama Pembeli (Klien)</th>
                  <th className="p-2">NPWP Pembeli</th>
                  <th className="p-2 text-center">Kode</th>
                  <th className="p-2 text-right">DPP (Rp)</th>
                  <th className="p-2 text-right">PPN 11% (Rp)</th>
                  <th className="p-2 text-right">PPh 22 (Rp)</th>
                  <th className="p-2 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {outputInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="p-4 text-center text-slate-400 italic">
                      Belum ada data Faktur Pajak Keluaran untuk periode ini.
                    </td>
                  </tr>
                ) : (
                  outputInvoices.map((inv, idx) => (
                    <tr key={inv.id} className="hover:bg-slate-50">
                      <td className="p-2 text-center text-slate-500">{idx + 1}</td>
                      <td className="p-2 font-mono font-bold text-blue-900">{inv.taxNumber}</td>
                      <td className="p-2 text-slate-700">{formatDateIndo(inv.date)}</td>
                      <td className="p-2 font-mono text-[11px] text-slate-600">{inv.refNumber}</td>
                      <td className="p-2 font-semibold text-slate-900">{inv.counterpartyName}</td>
                      <td className="p-2 font-mono text-[11px] text-slate-600">{formatNPWP(inv.counterpartyNPWP)}</td>
                      <td className="p-2 text-center">
                        <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                          inv.transactionCode === '03' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-800'
                        }`}>
                          {inv.transactionCode} {inv.isWapu ? '(WAPU)' : ''}
                        </span>
                      </td>
                      <td className="p-2 text-right font-mono font-semibold">{formatRupiah(inv.dpp)}</td>
                      <td className="p-2 text-right font-mono font-bold text-slate-900">{formatRupiah(inv.ppnAmount)}</td>
                      <td className="p-2 text-right font-mono text-amber-800">
                        {inv.pph22Amount ? formatRupiah(inv.pph22Amount) : '-'}
                      </td>
                      <td className="p-2 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handlePrintTaxInvoice(inv)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded border border-blue-200 transition"
                            title="Cetak Faktur Pajak Standar DJP"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEditInvoiceModal(inv)}
                            className="p-1 text-amber-600 hover:bg-amber-50 rounded border border-amber-200 transition"
                            title="Edit Faktur Pajak Keluaran"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteTaxInvoice(inv.id)}
                            className="p-1 text-rose-600 hover:bg-rose-50 rounded border border-rose-200 transition"
                            title="Hapus Faktur Pajak"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {outputInvoices.length > 0 && (
                <tfoot>
                  <tr className="bg-slate-100 font-bold border-t-2 border-slate-300">
                    <td colSpan={7} className="p-2 text-right uppercase">
                      TOTAL FAKTUR KELUARAN:
                    </td>
                    <td className="p-2 text-right font-mono">
                      {formatRupiah(outputInvoices.reduce((sum, i) => sum + i.dpp, 0))}
                    </td>
                    <td className="p-2 text-right font-mono text-blue-900 font-extrabold">
                      {formatRupiah(outputInvoices.reduce((sum, i) => sum + i.ppnAmount, 0))}
                    </td>
                    <td className="p-2 text-right font-mono text-amber-900">
                      {formatRupiah(outputInvoices.reduce((sum, i) => sum + (i.pph22Amount || 0), 0))}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: FAKTUR PAJAK MASUKAN */}
      {activeSubTab === 'faktur-masukan' && (
        <div className="space-y-3 bg-white p-3.5 rounded border border-slate-200 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                <ArrowDownLeft className="w-4 h-4 text-amber-600" />
                Daftar Faktur Pajak Masukan (Kredit Pajak Quarry & Vendor BBM)
              </h3>
              <p className="text-xs text-slate-500">
                Pajak Masukan yang dapat dikreditkan untuk mengurangi PPN Keluaran yang disetor ke Kas Negara.
              </p>
            </div>

            <button
              id="btn-add-tax-invoice-in"
              onClick={() => handleOpenAddInvoiceModal('masukan')}
              className="flex items-center gap-1 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded transition shadow-2xs cursor-pointer self-start"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Catat Pajak Masukan</span>
            </button>
          </div>

          {/* Tabel Faktur Pajak Masukan */}
          <div className="overflow-x-auto border border-slate-200 rounded">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                  <th className="p-2 w-8 text-center">No</th>
                  <th className="p-2">Nomor Faktur Masukan</th>
                  <th className="p-2">Tanggal</th>
                  <th className="p-2">Nama Pemasok / Quarry</th>
                  <th className="p-2">NPWP Pemasok</th>
                  <th className="p-2 text-right">DPP (Rp)</th>
                  <th className="p-2 text-right">PPN Masukan (Rp)</th>
                  <th className="p-2">Keterangan</th>
                  <th className="p-2 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {inputInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-4 text-center text-slate-400 italic">
                      Belum ada data Faktur Pajak Masukan untuk periode ini.
                    </td>
                  </tr>
                ) : (
                  inputInvoices.map((inv, idx) => (
                    <tr key={inv.id} className="hover:bg-slate-50">
                      <td className="p-2 text-center text-slate-500">{idx + 1}</td>
                      <td className="p-2 font-mono font-bold text-slate-900">{inv.taxNumber}</td>
                      <td className="p-2 text-slate-700">{formatDateIndo(inv.date)}</td>
                      <td className="p-2 font-semibold text-slate-900">{inv.counterpartyName}</td>
                      <td className="p-2 font-mono text-[11px] text-slate-600">{formatNPWP(inv.counterpartyNPWP)}</td>
                      <td className="p-2 text-right font-mono">{formatRupiah(inv.dpp)}</td>
                      <td className="p-2 text-right font-mono font-bold text-amber-800">{formatRupiah(inv.ppnAmount)}</td>
                      <td className="p-2 text-slate-600 text-[11px]">{inv.notes || '-'}</td>
                      <td className="p-2 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEditInvoiceModal(inv)}
                            className="p-1 text-amber-600 hover:bg-amber-50 rounded border border-amber-200 transition"
                            title="Edit Faktur Pajak Masukan"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteTaxInvoice(inv.id)}
                            className="p-1 text-rose-600 hover:bg-rose-50 rounded border border-rose-200 transition"
                            title="Hapus Faktur Pajak"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {inputInvoices.length > 0 && (
                <tfoot>
                  <tr className="bg-slate-100 font-bold border-t-2 border-slate-300">
                    <td colSpan={5} className="p-2 text-right uppercase">
                      TOTAL FAKTUR MASUKAN:
                    </td>
                    <td className="p-2 text-right font-mono">
                      {formatRupiah(inputInvoices.reduce((sum, i) => sum + i.dpp, 0))}
                    </td>
                    <td className="p-2 text-right font-mono text-amber-900 font-extrabold">
                      {formatRupiah(inputInvoices.reduce((sum, i) => sum + i.ppnAmount, 0))}
                    </td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: E-BUPOT UNIFIKASI PPH */}
      {activeSubTab === 'ebupot' && (
        <div className="space-y-3 bg-white p-3.5 rounded border border-slate-200 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                <FileCheck2 className="w-4 h-4 text-indigo-600" />
                Bukti Pemotongan Pajak Penghasilan (e-Bupot Unifikasi)
              </h3>
              <p className="text-xs text-slate-500">
                Pencatatan PPh Pasal 22 (Material ke BUMN), PPh 23 (Sewa Armada/Bengkel), & PPh 21 (Upah Sopir).
              </p>
            </div>

            <button
              id="btn-add-withholding-slip"
              onClick={() => setShowAddSlipModal(true)}
              className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded transition shadow-2xs cursor-pointer self-start"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Terbitkan Bukti Potong</span>
            </button>
          </div>

          {/* Tabel e-Bupot */}
          <div className="overflow-x-auto border border-slate-200 rounded">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                  <th className="p-2 w-8 text-center">No</th>
                  <th className="p-2">Nomor Bukti Potong</th>
                  <th className="p-2">Jenis PPh</th>
                  <th className="p-2">Tanggal</th>
                  <th className="p-2">Nama Pihak Yang Dipotong</th>
                  <th className="p-2">Uraian Transaksi</th>
                  <th className="p-2 text-right">Nilai Bruto (Rp)</th>
                  <th className="p-2 text-center w-14">Tarif</th>
                  <th className="p-2 text-right">PPh Dipotong (Rp)</th>
                  <th className="p-2 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredSlips.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-4 text-center text-slate-400 italic">
                      Belum ada bukti pemotongan PPh untuk periode ini.
                    </td>
                  </tr>
                ) : (
                  filteredSlips.map((slip, idx) => (
                    <tr key={slip.id} className="hover:bg-slate-50">
                      <td className="p-2 text-center text-slate-500">{idx + 1}</td>
                      <td className="p-2 font-mono font-bold text-indigo-950">{slip.slipNumber}</td>
                      <td className="p-2">
                        <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                          slip.taxType === 'PPh 22'
                            ? 'bg-blue-100 text-blue-800'
                            : slip.taxType === 'PPh 23'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {slip.taxType}
                        </span>
                      </td>
                      <td className="p-2 text-slate-700">{formatDateIndo(slip.date)}</td>
                      <td className="p-2 font-semibold text-slate-900">{slip.recipientName}</td>
                      <td className="p-2 text-slate-600 text-[11px]">{slip.objectDescription}</td>
                      <td className="p-2 text-right font-mono">{formatRupiah(slip.grossAmount)}</td>
                      <td className="p-2 text-center font-mono font-bold">{slip.rate}%</td>
                      <td className="p-2 text-right font-mono font-extrabold text-blue-900">{formatRupiah(slip.taxAmount)}</td>
                      <td className="p-2 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handlePrintWithholdingSlip(slip)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded border border-blue-200 transition"
                            title="Cetak Bukti Potong Resmi"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteWithholdingSlip(slip.id)}
                            className="p-1 text-rose-600 hover:bg-rose-50 rounded border border-rose-200 transition"
                            title="Hapus Bukti Potong"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: KALKULATOR & SIMULASI TENDER PAJAK */}
      {activeSubTab === 'kalkulator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
          <div className="lg:col-span-6 bg-white p-3.5 rounded border border-slate-200 shadow-2xs space-y-3">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5 border-b border-slate-200 pb-2">
              <Calculator className="w-4 h-4 text-blue-600" />
              Parameter Simulasi Perhitungan Pajak
            </h3>

            <div className="space-y-2.5 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Nilai Penjualan Material / Dasar Kontrak (Rp):
                </label>
                <input
                  type="number"
                  value={calcBaseAmount}
                  onChange={(e) => setCalcBaseAmount(Number(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono font-bold text-sm focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Metode Pengenaan Pajak Pertambahan Nilai (PPN):
                </label>
                <select
                  value={calcTaxType}
                  onChange={(e) => setCalcTaxType(e.target.value as TaxCalculationType)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-semibold focus:outline-none focus:border-blue-600"
                >
                  <option value="exclude">Exclude PPN (DPP + PPN 11% Ditambahkan ke Invoice)</option>
                  <option value="include">Include PPN (Harga Kontrak Sudah Termasuk PPN 11%)</option>
                  <option value="wapu">WAPU BUMN / Pemerintah (PPN Dipungut Pemungut)</option>
                  <option value="non-ppn">Bebas PPN / Non-PKP</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Tarif PPN (%):</label>
                  <input
                    type="number"
                    value={calcPPNRate}
                    onChange={(e) => setCalcPPNRate(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Tarif PPh 22 (%):</label>
                  <input
                    type="number"
                    step="0.1"
                    value={calcPPh22Rate}
                    onChange={(e) => setCalcPPh22Rate(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono font-bold"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={calcIsWapu}
                    onChange={(e) => setCalcIsWapu(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                  />
                  <span className="font-semibold text-slate-800">
                    Proyek WAPU (BUMN / Dinas PU / Pemda - PPN & PPh 22 dipotong langsung oleh pembeli)
                  </span>
                </label>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 bg-slate-900 text-white p-4 rounded shadow-2xs space-y-3.5">
            <h3 className="text-sm font-extrabold text-blue-400 flex items-center gap-1.5 border-b border-slate-800 pb-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Hasil Rincian Faktur & Arus Kas Bersih (Net Cash Flow)
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Dasar Pengenaan Pajak (DPP):</span>
                <span className="font-mono font-bold text-white">{formatRupiah(calcResult.dpp)}</span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Pajak Pertambahan Nilai (PPN {calcPPNRate}%):</span>
                <span className="font-mono font-bold text-blue-300">{formatRupiah(calcResult.ppnAmount)}</span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Total Nilai Faktur / Invoice:</span>
                <span className="font-mono font-extrabold text-white text-sm">
                  {formatRupiah(calcResult.totalWithTax)}
                </span>
              </div>

              {calcIsWapu && (
                <div className="flex justify-between py-1.5 border-b border-slate-800 text-amber-300">
                  <span>Potongan PPh 22 ({calcPPh22Rate}% WAPU):</span>
                  <span className="font-mono font-bold">({formatRupiah(calcResult.pph22Amount)})</span>
                </div>
              )}

              <div className="p-3 bg-slate-800 rounded border border-slate-700 mt-3 space-y-1">
                <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">
                  CASH MASUK REKENING (SETELAH POTONGAN WAPU):
                </span>
                <div className="text-lg font-mono font-extrabold text-emerald-300">
                  {formatRupiah(calcResult.netReceivableAmount)}
                </div>
                <p className="text-[10px] text-slate-400">
                  # {terbilang(calcResult.netReceivableAmount)} Rupiah #
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: PENGATURAN PROFIL & NSFP */}
      {activeSubTab === 'pengaturan-pajak' && (
        <div className="bg-white p-4 rounded border border-slate-200 shadow-2xs space-y-4 max-w-3xl">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
              <Settings className="w-4 h-4 text-blue-600" />
              Profil Pengusaha Kena Pajak (PKP) & Konfigurasi e-Faktur
            </h3>
            <p className="text-xs text-slate-500">
              Pengaturan ini akan digunakan secara otomatis pada pembuatan Faktur Pajak dan Bukti Potong.
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              onUpdateTaxProfile({ ...taxProfile });
            }}
            className="space-y-3 text-xs"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">NPWP Perusahaan (15/16 Digit):</label>
                <input
                  type="text"
                  value={taxProfile.npwp}
                  onChange={(e) => onUpdateTaxProfile({ ...taxProfile, npwp: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono font-bold focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">NITKU (Nomor Induk Tempat Kegiatan Usaha):</label>
                <input
                  type="text"
                  value={taxProfile.nitku}
                  onChange={(e) => onUpdateTaxProfile({ ...taxProfile, nitku: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">KPP Pratama Terdaftar:</label>
                <input
                  type="text"
                  value={taxProfile.kppName}
                  onChange={(e) => onUpdateTaxProfile({ ...taxProfile, kppName: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-semibold focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Kode Klasifikasi Lapangan Usaha (KLU):</label>
                <input
                  type="text"
                  value={taxProfile.klu}
                  onChange={(e) => onUpdateTaxProfile({ ...taxProfile, klu: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Prefix Nomor Seri Faktur Pajak (NSFP):</label>
                <input
                  type="text"
                  value={taxProfile.nsfpPrefix}
                  onChange={(e) => onUpdateTaxProfile({ ...taxProfile, nsfpPrefix: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono font-bold focus:outline-none focus:border-blue-600"
                  placeholder="010.000-26."
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Nomor Urut Terakhir NSFP:</label>
                <input
                  type="number"
                  value={taxProfile.lastNsfpIndex}
                  onChange={(e) => onUpdateTaxProfile({ ...taxProfile, lastNsfpIndex: Number(e.target.value) })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono font-bold focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded text-xs shadow-2xs transition cursor-pointer"
              >
                Simpan Profil Pajak
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: ADD / EDIT TAX INVOICE */}
      {showAddInvoiceModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl border border-slate-300 w-full max-w-lg overflow-hidden my-6">
            <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  invoiceType === 'keluaran' ? 'bg-blue-600 text-white' : 'bg-amber-600 text-white'
                }`}>
                  {invoiceType === 'keluaran' ? 'Keluaran' : 'Masukan'}
                </span>
                <h3 className="font-bold text-xs">
                  {editingInvoice
                    ? `Edit Faktur Pajak ${invoiceType === 'keluaran' ? 'Keluaran' : 'Masukan'}`
                    : (invoiceType === 'keluaran' ? '+ Buat Faktur Pajak Keluaran Baru' : '+ Catat Faktur Pajak Masukan')}
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowAddInvoiceModal(false);
                  setEditingInvoice(null);
                }}
                className="text-slate-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveTaxInvoice} className="p-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-0.5">
                    {invoiceType === 'keluaran' ? 'Nomor Seri Faktur (NSFP) *' : 'Nomor Faktur Masukan *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={invoiceType === 'keluaran' ? '010.000-26.00000001' : 'FM-01-2026...'}
                    value={invTaxNumber}
                    onChange={(e) => setInvTaxNumber(e.target.value)}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded font-mono font-bold text-blue-900 bg-slate-50 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-0.5">Tanggal Faktur *</label>
                  <input
                    type="date"
                    required
                    value={invDate}
                    onChange={(e) => setInvDate(e.target.value)}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-0.5">No Referensi / PO / SJ *</label>
                  <input
                    type="text"
                    required
                    placeholder="PO-2026/..."
                    value={invRefNumber}
                    onChange={(e) => setInvRefNumber(e.target.value)}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-0.5">Status Faktur *</label>
                  <select
                    value={invStatus}
                    onChange={(e) => setInvStatus(e.target.value as any)}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded font-semibold"
                  >
                    <option value="Approved">Approved / Siap Lapor</option>
                    <option value="Draft">Draft</option>
                    <option value="Dibatalkan">Dibatalkan</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-0.5">
                  {invoiceType === 'keluaran' ? 'Nama Pembeli / Klien *' : 'Nama Supplier / Quarry *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder="PT..."
                  value={invCounterparty}
                  onChange={(e) => setInvCounterparty(e.target.value)}
                  className="w-full px-2 py-1.5 border border-slate-300 rounded font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-0.5">NPWP Lawan Transaksi *</label>
                  <input
                    type="text"
                    required
                    placeholder="01.234.567.8-..."
                    value={invNPWP}
                    onChange={(e) => setInvNPWP(e.target.value)}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-0.5">Kode Transaksi DJP *</label>
                  <select
                    value={invTransCode}
                    onChange={(e) => setInvTransCode(e.target.value as any)}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded font-semibold"
                  >
                    <option value="01">01 - Bukan Pemungut (Swasta)</option>
                    <option value="02">02 - Pemungut Bendahara Pemerintah</option>
                    <option value="03">03 - Pemungut BUMN (WAPU)</option>
                    <option value="04">04 - DPP Nilai Lain</option>
                    <option value="08">08 - Dibebaskan PPN</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-0.5">Alamat Lengkap</label>
                <input
                  type="text"
                  value={invAddress}
                  onChange={(e) => setInvAddress(e.target.value)}
                  className="w-full px-2 py-1.5 border border-slate-300 rounded"
                  placeholder="Jl. Raya..."
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-0.5">Dasar Pengenaan Pajak (DPP Rp) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={invDPP}
                    onChange={(e) => setInvDPP(Number(e.target.value))}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-0.5">Tarif PPN (%) *</label>
                  <input
                    type="number"
                    value={invPPNRate}
                    onChange={(e) => setInvPPNRate(Number(e.target.value))}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded font-mono"
                  />
                </div>
              </div>

              {invoiceType === 'keluaran' && (
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                    <input
                      type="checkbox"
                      checked={invIsWapu}
                      onChange={(e) => setInvIsWapu(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span>Dipungut WAPU (PPh 22 Terpotong oleh BUMN/Instansi)</span>
                  </label>
                  {invIsWapu && (
                    <div className="flex items-center gap-2 pl-6">
                      <label className="text-[11px] font-bold text-slate-700">Tarif PPh 22 (%):</label>
                      <input
                        type="number"
                        step="0.1"
                        value={invPPh22Rate}
                        onChange={(e) => setInvPPh22Rate(Number(e.target.value))}
                        className="w-20 px-2 py-1 border border-slate-300 rounded font-mono text-xs font-bold"
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-0.5">NTPN (Bukti Setor Pajak)</label>
                  <input
                    type="text"
                    placeholder="Opsional (16 Digit)"
                    value={invNTPN}
                    onChange={(e) => setInvNTPN(e.target.value)}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-0.5">Keterangan / Catatan</label>
                  <input
                    type="text"
                    placeholder="Catatan internal..."
                    value={invNotes}
                    onChange={(e) => setInvNotes(e.target.value)}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded"
                  />
                </div>
              </div>

              {/* LIVE REKAP KALKULASI PAJAK */}
              <div className="p-2.5 bg-slate-100 rounded border border-slate-200 space-y-1">
                <div className="text-[10px] font-extrabold uppercase text-slate-600 tracking-wider">
                  Ringkasan Nilai Transaksi:
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>DPP (Dasar Pengenaan Pajak):</span>
                  <span className="font-mono font-semibold">{formatRupiah(invDPP)}</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>PPN {invPPNRate}%:</span>
                  <span className="font-mono font-bold text-blue-900">
                    {formatRupiah(Math.round((invDPP * invPPNRate) / 100))}
                  </span>
                </div>
                {invoiceType === 'keluaran' && invIsWapu && (
                  <div className="flex justify-between text-amber-800">
                    <span>PPh 22 ({invPPh22Rate}% WAPU Dipungut):</span>
                    <span className="font-mono font-semibold">
                      - {formatRupiah(Math.round((invDPP * invPPh22Rate) / 100))}
                    </span>
                  </div>
                )}
                <div className="flex justify-between font-extrabold text-slate-900 border-t border-slate-300 pt-1">
                  <span>Total Faktur + PPN:</span>
                  <span className="font-mono text-emerald-700">
                    {formatRupiah(invDPP + Math.round((invDPP * invPPNRate) / 100))}
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddInvoiceModal(false);
                    setEditingInvoice(null);
                  }}
                  className="px-3 py-1.5 border border-slate-300 rounded text-slate-700 hover:bg-slate-100 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded shadow-2xs cursor-pointer"
                >
                  {editingInvoice ? 'Simpan Perubahan' : 'Simpan Faktur Pajak'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD WITHHOLDING SLIP (E-BUPOT) */}
      {showAddSlipModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl border border-slate-300 w-full max-w-lg overflow-hidden my-6">
            <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between">
              <h3 className="font-bold text-xs">+ Terbitkan Bukti Potong PPh Unifikasi</h3>
              <button
                onClick={() => setShowAddSlipModal(false)}
                className="text-slate-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveWithholdingSlip} className="p-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-0.5">Jenis Pajak Penghasilan *</label>
                  <select
                    value={slipTaxType}
                    onChange={(e) => {
                      const type = e.target.value as any;
                      setSlipTaxType(type);
                      if (type === 'PPh 23') setSlipRate(2.0);
                      else if (type === 'PPh 22') setSlipRate(1.5);
                      else if (type === 'PPh 21') setSlipRate(2.5);
                    }}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded font-bold"
                  >
                    <option value="PPh 23">PPh Pasal 23 (Sewa Alat/Jasa Angkut)</option>
                    <option value="PPh 22">PPh Pasal 22 (Barang Material BUMN)</option>
                    <option value="PPh 21">PPh Pasal 21 (Upah Sopir/Tenaga Kerja)</option>
                    <option value="PPh 4(2)">PPh 4 ayat 2 Final (Konstruksi)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-0.5">Tanggal Bukti Potong *</label>
                  <input
                    type="date"
                    required
                    value={slipDate}
                    onChange={(e) => setSlipDate(e.target.value)}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-0.5">Nama Penerima Penghasilan / Vendor *</label>
                <input
                  type="text"
                  required
                  placeholder="Nama PT / CV / Perorangan"
                  value={slipRecipient}
                  onChange={(e) => setSlipRecipient(e.target.value)}
                  className="w-full px-2 py-1.5 border border-slate-300 rounded font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-0.5">NPWP Penerima</label>
                  <input
                    type="text"
                    placeholder="00.000.000.0-000.000"
                    value={slipNPWP}
                    onChange={(e) => setSlipNPWP(e.target.value)}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-0.5">Tarif Pemotongan (%) *</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={slipRate}
                    onChange={(e) => setSlipRate(Number(e.target.value))}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-0.5">Uraian Objek Transaksi *</label>
                <input
                  type="text"
                  required
                  value={slipObjDesc}
                  onChange={(e) => setSlipObjDesc(e.target.value)}
                  className="w-full px-2 py-1.5 border border-slate-300 rounded"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-0.5">Jumlah Penghasilan Bruto (Rp) *</label>
                <input
                  type="number"
                  required
                  value={slipGross}
                  onChange={(e) => setSlipGross(Number(e.target.value))}
                  className="w-full px-2 py-1.5 border border-slate-300 rounded font-mono font-bold"
                />
              </div>

              <div className="p-2.5 bg-indigo-50 border border-indigo-200 rounded flex justify-between items-center text-xs">
                <span className="font-bold text-indigo-900">Total PPh Yang Dipotong:</span>
                <span className="font-mono font-extrabold text-indigo-950 text-sm">
                  {formatRupiah(Math.round((slipGross * slipRate) / 100))}
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddSlipModal(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded text-slate-700 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded shadow-2xs"
                >
                  Terbitkan Bukti Potong
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
