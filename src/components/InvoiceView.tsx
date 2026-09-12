import React, { useState, useMemo } from 'react';
import {
  FileText,
  Printer,
  Calendar,
  Layers,
  Building2,
  Download,
  CreditCard,
  CheckCircle2,
  Clock,
  Filter,
  Eye,
  ShieldCheck,
  Receipt,
  FileCheck2,
  CalendarDays,
  Truck,
  RotateCcw,
  History,
  Save,
  Plus,
  Search,
  FileSpreadsheet,
  TrendingUp,
  Wallet,
  ChevronRight,
  Trash2,
  Edit,
  AlertCircle,
  Banknote,
  Percent,
} from 'lucide-react';
import {
  ClientSupplier,
  CompanyProfile,
  DateFilterState,
  FilterMode,
  InvoicePaymentStatus,
  InvoiceRecord,
  SaleTransaction,
  TaxCalculationType,
  TaxProfile,
} from '../types';
import {
  formatDateIndo,
  formatNumber,
  formatRupiah,
  getCurrentMonthString,
  getTodayDateString,
  terbilang,
  matchDateFilter,
  compareDateDescending,
} from '../utils/formatters';
import { calculateTransactionTax, formatNPWP } from '../utils/taxHelper';
import { exportInvoiceRecapToExcel, exportInvoiceHistoryToExcel } from '../utils/excelHelper';
import { calculateInvoiceReceivablesSummary } from '../utils/accounting';
import { SaveInvoiceModal } from './SaveInvoiceModal';
import { InvoicePaymentModal } from './InvoicePaymentModal';

interface InvoiceViewProps {
  sales: SaleTransaction[];
  clients?: ClientSupplier[];
  companyProfile: CompanyProfile;
  taxProfile?: TaxProfile;
  invoices?: InvoiceRecord[];
  onAddInvoice?: (invoice: Omit<InvoiceRecord, 'id' | 'createdAt'> & { id?: string; syncSales?: boolean }) => void;
  onUpdateInvoice?: (id: string, invoice: Partial<InvoiceRecord> & { syncSales?: boolean }) => void;
  onDeleteInvoice?: (id: string) => void;
  onRecordPayment?: (
    id: string,
    paymentData: {
      status: InvoicePaymentStatus;
      amountPaid: number;
      paymentDate: string;
      paymentAccountCode?: string;
      paymentReference?: string;
      notes?: string;
      syncSales?: boolean;
    }
  ) => void;
  filter?: DateFilterState;
  onFilterChange?: (filter: DateFilterState) => void;
  onOpenPrintModal: (title: string, content: React.ReactNode) => void;
}

export const InvoiceView: React.FC<InvoiceViewProps> = ({
  sales = [],
  clients = [],
  companyProfile,
  taxProfile,
  invoices = [],
  onAddInvoice,
  onUpdateInvoice,
  onDeleteInvoice,
  onRecordPayment,
  filter: parentFilter,
  onFilterChange: parentOnFilterChange,
  onOpenPrintModal,
}) => {
  // Main Sub-Tab State: 'create' (Buat & Rekap Baru) | 'history' (Riwayat Invoice Tersimpan & Pembayaran)
  const [activeTab, setActiveTab] = useState<'create' | 'history'>('create');

  // Local Date / Day Filter State for Rekap Invoice Generator
  const [localFilter, setLocalFilter] = useState<DateFilterState>({
    mode: 'semua',
    date: getTodayDateString(),
    month: getCurrentMonthString(),
    startDate: getTodayDateString(),
    endDate: getTodayDateString(),
  });

  const activeDateFilter = parentFilter || localFilter;
  const handleDateFilterChange = (newFilter: DateFilterState) => {
    if (parentOnFilterChange) {
      parentOnFilterChange(newFilter);
    }
    setLocalFilter(newFilter);
  };

  // Modals state
  const [isSaveModalOpen, setIsSaveModalOpen] = useState<boolean>(false);
  const [editingInvoice, setEditingInvoice] = useState<InvoiceRecord | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<InvoiceRecord | null>(null);
  const [detailModalInvoice, setDetailModalInvoice] = useState<InvoiceRecord | null>(null);

  // History Tab Filters & Search
  const [historySearch, setHistorySearch] = useState<string>('');
  const [historyStatusFilter, setHistoryStatusFilter] = useState<string>('all');
  const [historyClientFilter, setHistoryClientFilter] = useState<string>('all');

  // Extract distinct PO list from sales, diurutkan berdasarkan tanggal PO terbaru
  const distinctPOs = useMemo(() => {
    const poLatestDateMap = new Map<string, string>();
    sales.forEach((s) => {
      if (!s.poNumber) return;
      const cur = poLatestDateMap.get(s.poNumber);
      if (!cur || s.date > cur) {
        poLatestDateMap.set(s.poNumber, s.date);
      }
    });

    return Array.from(poLatestDateMap.keys()).sort((a, b) => {
      const dateA = poLatestDateMap.get(a) || '';
      const dateB = poLatestDateMap.get(b) || '';
      const dateDiff = dateB.localeCompare(dateA); // Terbaru ke terlama
      if (dateDiff !== 0) return dateDiff;
      return b.localeCompare(a, undefined, { numeric: true });
    });
  }, [sales]);

  const [selectedPO, setSelectedPO] = useState<string>('');
  const [invoiceDate, setInvoiceDate] = useState<string>(getTodayDateString());
  const [invoiceNo, setInvoiceNo] = useState<string>(
    `INV-${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${String(
      Math.floor(Math.random() * 900) + 100
    )}`
  );

  const activePO = selectedPO || (distinctPOs.length > 0 ? distinctPOs[0] : '');

  // Filter sales for the selected PO and apply date filter
  const poSales = useMemo(() => {
    if (!activePO) return [];
    return sales
      .filter((s) => s.poNumber === activePO && matchDateFilter(s.date, activeDateFilter))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [sales, activePO, activeDateFilter]);

  // Check if active PO has saved invoices in history
  const savedInvoicesForActivePO = useMemo(() => {
    if (!activePO) return [];
    return invoices.filter((inv) => inv.poNumber === activePO);
  }, [invoices, activePO]);

  // Quick info
  const clientName = poSales[0]?.clientName || 'Klien / Buyer';
  const destination = poSales[0]?.destination || 'Lokasi Proyek';

  const clientDetail = useMemo(() => {
    if (!clientName) return null;
    return clients.find((c) => c.name.toLowerCase() === clientName.toLowerCase()) || null;
  }, [clients, clientName]);

  const clientAddress = clientDetail?.address || '';
  const clientNPWP = clientDetail?.npwp || '';

  // Project type detection
  const isWapuProject = useMemo(() => {
    const lowerName = clientName.toLowerCase();
    const isWapuClient =
      lowerName.includes('wijaya karya') ||
      lowerName.includes('wika') ||
      lowerName.includes('adhi karya') ||
      lowerName.includes('adhikarya') ||
      lowerName.includes('pp (persero)') ||
      lowerName.includes('pembina') ||
      lowerName.includes('bumn') ||
      lowerName.includes('wapu') ||
      lowerName.includes('dinas') ||
      lowerName.includes('kementerian') ||
      lowerName.includes('pupr');
    return isWapuClient;
  }, [clientName]);

  const [customTaxType, setCustomTaxType] = useState<TaxCalculationType | null>(null);
  const invoiceTaxType: TaxCalculationType =
    customTaxType || (isWapuProject ? 'wapu' : 'exclude');

  // Aggregated Item Summaries
  const itemSummaries = useMemo(() => {
    const map = new Map<
      string,
      {
        itemName: string;
        unit: string;
        quarry: string;
        destination: string;
        unitPrice: number;
        totalVolume: number;
        totalAmount: number;
      }
    >();

    poSales.forEach((s) => {
      const key = `${s.itemName}__${s.unit}__${s.price}`;
      const existing = map.get(key);
      if (existing) {
        existing.totalVolume += s.volume;
        existing.totalAmount += s.totalAmount;
      } else {
        map.set(key, {
          itemName: s.itemName,
          unit: s.unit,
          quarry: s.quarry,
          destination: s.destination,
          unitPrice: s.price,
          totalVolume: s.volume,
          totalAmount: s.totalAmount,
        });
      }
    });

    return Array.from(map.values());
  }, [poSales]);

  // Overall totals
  const totalOverallVolume = itemSummaries.reduce((sum, item) => sum + item.totalVolume, 0);
  const rawSubtotal = itemSummaries.reduce((sum, item) => sum + item.totalAmount, 0);

  const ppnRate = taxProfile?.defaultPpnRate || 11;
  const pph22Rate = taxProfile?.defaultPph22Rate || 1.5;

  const taxBreakdown = useMemo(() => {
    return calculateTransactionTax(
      rawSubtotal,
      invoiceTaxType,
      ppnRate,
      pph22Rate,
      isWapuProject
    );
  }, [rawSubtotal, invoiceTaxType, ppnRate, pph22Rate, isWapuProject]);

  // Period description helper
  const periodDescriptionText = useMemo(() => {
    if (activeDateFilter.mode === 'semua') {
      if (poSales.length === 0) return 'Semua Pengiriman';
      const dates = poSales.map((s) => s.date).sort();
      const firstDate = dates[0];
      const lastDate = dates[dates.length - 1];
      if (firstDate === lastDate) return formatDateIndo(firstDate);
      return `${formatDateIndo(firstDate)} s/d ${formatDateIndo(lastDate)}`;
    }
    if (activeDateFilter.mode === 'harian' && activeDateFilter.date) {
      return formatDateIndo(activeDateFilter.date);
    }
    if (activeDateFilter.mode === 'bulanan' && activeDateFilter.month) {
      const [y, m] = activeDateFilter.month.split('-');
      const monthNames = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
      ];
      return `Bulan ${monthNames[parseInt(m, 10) - 1]} ${y}`;
    }
    if (activeDateFilter.mode === 'periode' && activeDateFilter.startDate && activeDateFilter.endDate) {
      return `${formatDateIndo(activeDateFilter.startDate)} s/d ${formatDateIndo(activeDateFilter.endDate)}`;
    }
    return 'Periode Terpilih';
  }, [activeDateFilter, poSales]);

  const resetAllDays = () => {
    handleDateFilterChange({
      ...activeDateFilter,
      mode: 'semua',
    });
  };

  // Delivery Notes array for invoice archiving
  const invoiceDeliveryNotes = useMemo(() => {
    return poSales.map((s) => ({
      deliveryNoteNumber: s.deliveryNoteNumber,
      date: s.date,
      itemName: s.itemName,
      volume: s.volume,
      unit: s.unit,
      vehiclePlate: s.vehiclePlate,
      driverName: s.driverName,
    }));
  }, [poSales]);

  const invoiceSaleIds = useMemo(() => {
    return poSales.map((s) => s.id);
  }, [poSales]);

  // History Statistics & Summaries
  const receivablesSummary = useMemo(() => {
    return calculateInvoiceReceivablesSummary(invoices);
  }, [invoices]);

  // Filtered Invoices in History Tab
  const filteredInvoices = useMemo(() => {
    return invoices
      .filter((inv) => {
        // Search
        if (historySearch.trim()) {
          const q = historySearch.toLowerCase();
          const matchSearch =
            inv.invoiceNumber.toLowerCase().includes(q) ||
            inv.poNumber.toLowerCase().includes(q) ||
            inv.clientName.toLowerCase().includes(q) ||
            inv.destination.toLowerCase().includes(q) ||
            (inv.paymentReference && inv.paymentReference.toLowerCase().includes(q));
          if (!matchSearch) return false;
        }

        // Status
        if (historyStatusFilter !== 'all') {
          if (inv.status !== historyStatusFilter) return false;
        }

        // Client
        if (historyClientFilter !== 'all') {
          if (inv.clientName !== historyClientFilter) return false;
        }

        return true;
      })
      .sort((a, b) => b.invoiceDate.localeCompare(a.invoiceDate));
  }, [invoices, historySearch, historyStatusFilter, historyClientFilter]);

  // Distinct clients in history for filter
  const distinctHistoryClients = useMemo(() => {
    const set = new Set<string>();
    invoices.forEach((inv) => set.add(inv.clientName));
    return Array.from(set).sort();
  }, [invoices]);

  // Print Official Commercial Invoice from Active State
  const handlePrintOfficialInvoice = () => {
    const printContent = (
      <div className="p-8 bg-white text-slate-900 text-xs font-sans space-y-5 max-w-4xl mx-auto">
        {/* Kop Surat Perusahaan */}
        <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-start">
          <div className="flex items-start gap-3.5">
            {companyProfile.logoUrl && (
              <div className="w-16 h-16 rounded p-1 flex items-center justify-center shrink-0 border border-slate-200">
                <img
                  src={companyProfile.logoUrl}
                  alt="Logo"
                  className="max-w-full max-h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
            )}
            <div className="space-y-0.5">
              <h1 className="text-lg font-extrabold tracking-tight text-slate-900 leading-tight">
                {companyProfile.name}
              </h1>
              <p className="text-xs text-slate-700 font-medium">{companyProfile.tagline}</p>
              <p className="text-[11px] text-slate-600 max-w-md">{companyProfile.address}</p>
              <p className="text-[11px] text-slate-600">
                Telp: {companyProfile.phone} | Email: {companyProfile.email}
              </p>
              <p className="text-[11px] text-slate-600 font-mono">
                NPWP: {formatNPWP(companyProfile.npwp)}
              </p>
            </div>
          </div>

          <div className="text-right space-y-1">
            <div className="inline-block px-3 py-1 bg-slate-900 text-white font-extrabold text-base uppercase tracking-wider rounded">
              FAKTUR / INVOICE
            </div>
            <p className="text-xs font-mono font-bold text-slate-900 mt-2">
              No: <span className="underline">{invoiceNo}</span>
            </p>
            <p className="text-[11px] text-slate-700">Tanggal Invoice: {formatDateIndo(invoiceDate)}</p>
          </div>
        </div>

        {/* Info Penagihan & Purchase Order */}
        <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 border border-slate-300 rounded">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              TAGIHAN KEPADA (BUYER):
            </span>
            <p className="text-xs font-bold text-slate-900">{clientName}</p>
            {clientAddress ? (
              <p className="text-[11px] text-slate-700">
                <span className="text-slate-500 font-semibold">Alamat:</span> {clientAddress}
              </p>
            ) : (
              <p className="text-[11px] text-slate-400 italic">Alamat: -</p>
            )}
            {clientNPWP && (
              <p className="text-[10px] text-slate-600 font-mono">NPWP: {formatNPWP(clientNPWP)}</p>
            )}
            <p className="text-[11px] text-slate-600">Lokasi / Proyek: {destination}</p>
            {isWapuProject && (
              <span className="inline-block bg-blue-100 text-blue-800 text-[9px] font-bold px-2 py-0.5 rounded border border-blue-200">
                PROYEK WAPU / BUMN
              </span>
            )}
          </div>

          <div className="space-y-1 text-right">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block -mr-[1px]">
              REFERENSI PURCHASE ORDER & PERIODE HARI:
            </span>
            <p className="text-xs font-bold text-blue-900">{activePO}</p>
            <div className="p-1.5 bg-blue-50/80 border border-blue-200 rounded mt-1 inline-block text-left">
              <span className="text-[9px] font-bold text-blue-800 uppercase block">
                Periode Hari Pengiriman:
              </span>
              <span className="text-[11px] font-bold text-blue-950 font-mono">
                {periodDescriptionText}
              </span>
              <div className="text-[9px] text-blue-700 mt-0.5">
                Total Surat Jalan: <strong>{poSales.length} SJ</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Tabel Rekap Rincian Material */}
        <div className="border border-slate-300 rounded overflow-hidden">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-slate-200 text-slate-800 font-bold border-b border-slate-300">
                <th className="p-2 text-center w-8 border-r border-slate-300">No</th>
                <th className="p-2 text-left border-r border-slate-300">Uraian / Jenis Material Konstruksi</th>
                <th className="p-2 text-right border-r border-slate-300 w-24">Total Volume</th>
                <th className="p-2 text-center border-r border-slate-300 w-16">Satuan</th>
                <th className="p-2 text-right border-r border-slate-300 w-28">Harga Satuan</th>
                <th className="p-2 text-right w-36">Jumlah (Rp)</th>
              </tr>
            </thead>
            <tbody>
              {itemSummaries.map((item, idx) => (
                <tr key={idx} className="border-b border-slate-200">
                  <td className="p-2 text-center border-r border-slate-200">{idx + 1}</td>
                  <td className="p-2 border-r border-slate-200">
                    <div className="font-bold text-slate-900">{item.itemName}</div>
                  </td>
                  <td className="p-2 text-right font-mono font-bold border-r border-slate-200">
                    {formatNumber(item.totalVolume)}
                  </td>
                  <td className="p-2 text-center font-mono border-r border-slate-200">{item.unit}</td>
                  <td className="p-2 text-right font-mono border-r border-slate-200">
                    {formatRupiah(item.unitPrice)}
                  </td>
                  <td className="p-2 text-right font-mono font-bold text-slate-900">
                    {formatRupiah(item.totalAmount)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-50 font-bold">
              <tr className="border-t border-slate-300">
                <td colSpan={2} className="p-2 text-right border-r border-slate-300 uppercase text-slate-700">
                  Total Dasar Pengenaan Pajak (DPP):
                </td>
                <td className="p-2 text-right border-r border-slate-300 font-mono">
                  {formatNumber(totalOverallVolume)}
                </td>
                <td colSpan={2} className="p-2 border-r border-slate-300"></td>
                <td className="p-2 text-right font-mono text-slate-900">{formatRupiah(taxBreakdown.dpp)}</td>
              </tr>

              {invoiceTaxType !== 'non-ppn' && (
                <tr className="border-t border-slate-200">
                  <td colSpan={5} className="p-2 text-right border-r border-slate-300 uppercase text-slate-700">
                    PPN ({ppnRate}%):
                  </td>
                  <td className="p-2 text-right font-mono text-blue-900">{formatRupiah(taxBreakdown.ppnAmount)}</td>
                </tr>
              )}

              <tr className="bg-slate-200 font-extrabold border-t-2 border-slate-400">
                <td colSpan={5} className="p-2 text-right border-r border-slate-300 uppercase">
                  TOTAL NILAI INVOICE (TAGIHAN BRUTO):
                </td>
                <td className="p-2 text-right font-mono text-sm text-slate-950">
                  {formatRupiah(taxBreakdown.totalWithTax)}
                </td>
              </tr>

              {isWapuProject && taxBreakdown.pph22Amount ? (
                <>
                  <tr className="border-t border-slate-300 text-slate-600">
                    <td colSpan={5} className="p-2 text-right border-r border-slate-300 uppercase text-[11px]">
                      Potongan PPh Pasal 22 Dipungut Instansi ({pph22Rate}%):
                    </td>
                    <td className="p-2 text-right font-mono text-rose-700 font-bold">
                      ({formatRupiah(taxBreakdown.pph22Amount)})
                    </td>
                  </tr>
                  <tr className="bg-emerald-100 font-black border-t-2 border-emerald-500 text-emerald-950">
                    <td colSpan={5} className="p-2 text-right border-r border-emerald-300 uppercase text-xs">
                      NETTO DITERIMA PENYEDIA (KAS MASUK):
                    </td>
                    <td className="p-2 text-right font-mono text-sm text-emerald-900">
                      {formatRupiah(taxBreakdown.netReceivableAmount)}
                    </td>
                  </tr>
                </>
              ) : null}
            </tfoot>
          </table>
        </div>

        {/* Terbilang Box */}
        <div className="p-3 bg-slate-100 border border-slate-300 rounded">
          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">
            TERBILANG:
          </span>
          <p className="text-xs font-bold text-slate-900 italic mt-0.5">
            # {terbilang(isWapuProject ? taxBreakdown.netReceivableAmount : taxBreakdown.totalWithTax)} Rupiah #
          </p>
        </div>

        {/* Info Pembayaran & Tanda Tangan */}
        <div className="grid grid-cols-2 gap-4 pt-3 items-end">
          <div className="space-y-1.5 p-3 border border-slate-200 rounded bg-slate-50 text-[11px]">
            <p className="font-bold text-slate-800">Pembayaran Ditransfer Melalui Rekening:</p>
            <div>
              Bank: <strong>{companyProfile.bankName}</strong>
            </div>
            <div>
              No. Rekening: <strong className="font-mono">{companyProfile.bankAccount}</strong>
            </div>
            <div>
              a.n. <strong>{companyProfile.bankHolder}</strong>
            </div>
          </div>

          <div className="text-right space-y-1">
            <p className="text-slate-700 font-medium">Hormat Kami,</p>
            <p className="font-bold text-slate-900">{companyProfile.name}</p>
            <div className="h-[calc(4rem+5mm)]"></div>
            <p className="font-bold underline text-slate-900 text-xs">
              {companyProfile.signatoryName}
            </p>
            <p className="text-[11px] text-slate-600">{companyProfile.signatoryRole}</p>
          </div>
        </div>
      </div>
    );

    onOpenPrintModal(`Faktur Tagihan PO ${activePO}`, printContent);
  };

  // Print Saved Invoice from History Record
  const handlePrintSavedInvoice = (inv: InvoiceRecord) => {
    const isWapu = inv.isWapu;
    const printContent = (
      <div className="p-8 bg-white text-slate-900 text-xs font-sans space-y-5 max-w-4xl mx-auto">
        {/* Kop Surat Perusahaan */}
        <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-start">
          <div className="flex items-start gap-3.5">
            {companyProfile.logoUrl && (
              <div className="w-16 h-16 rounded p-1 flex items-center justify-center shrink-0 border border-slate-200">
                <img
                  src={companyProfile.logoUrl}
                  alt="Logo"
                  className="max-w-full max-h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
            )}
            <div className="space-y-0.5">
              <h1 className="text-lg font-extrabold tracking-tight text-slate-900 leading-tight">
                {companyProfile.name}
              </h1>
              <p className="text-xs text-slate-700 font-medium">{companyProfile.tagline}</p>
              <p className="text-[11px] text-slate-600 max-w-md">{companyProfile.address}</p>
              <p className="text-[11px] text-slate-600">
                Telp: {companyProfile.phone} | Email: {companyProfile.email}
              </p>
              <p className="text-[11px] text-slate-600 font-mono">
                NPWP: {formatNPWP(companyProfile.npwp)}
              </p>
            </div>
          </div>

          <div className="text-right space-y-1">
            <div className="inline-block px-3 py-1 bg-slate-900 text-white font-extrabold text-base uppercase tracking-wider rounded">
              FAKTUR / INVOICE
            </div>
            <p className="text-xs font-mono font-bold text-slate-900 mt-2">
              No: <span className="underline">{inv.invoiceNumber}</span>
            </p>
            <p className="text-[11px] text-slate-700">Tanggal Invoice: {formatDateIndo(inv.invoiceDate)}</p>
            {inv.dueDate && (
              <p className="text-[10px] text-slate-500">Jatuh Tempo: {formatDateIndo(inv.dueDate)}</p>
            )}
          </div>
        </div>

        {/* Info Penagihan & Purchase Order */}
        <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 border border-slate-300 rounded">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              TAGIHAN KEPADA (BUYER):
            </span>
            <p className="text-xs font-bold text-slate-900">{inv.clientName}</p>
            {inv.clientAddress && (
              <p className="text-[11px] text-slate-700">
                <span className="text-slate-500 font-semibold">Alamat:</span> {inv.clientAddress}
              </p>
            )}
            {inv.clientNPWP && (
              <p className="text-[10px] text-slate-600 font-mono">NPWP: {formatNPWP(inv.clientNPWP)}</p>
            )}
            <p className="text-[11px] text-slate-600">Lokasi / Proyek: {inv.destination}</p>
            {isWapu && (
              <span className="inline-block bg-blue-100 text-blue-800 text-[9px] font-bold px-2 py-0.5 rounded border border-blue-200">
                PROYEK WAPU / BUMN
              </span>
            )}
          </div>

          <div className="space-y-1 text-right">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block -mr-[1px]">
              REFERENSI PURCHASE ORDER & PERIODE:
            </span>
            <p className="text-xs font-bold text-blue-900">{inv.poNumber}</p>
            <div className="p-1.5 bg-blue-50/80 border border-blue-200 rounded mt-1 inline-block text-left">
              <span className="text-[9px] font-bold text-blue-800 uppercase block">
                Periode Hari Pengiriman:
              </span>
              <span className="text-[11px] font-bold text-blue-950 font-mono">
                {inv.periodDescription}
              </span>
              <div className="text-[9px] text-blue-700 mt-0.5">
                Total Surat Jalan: <strong>{inv.deliveryNotes?.length || 0} SJ</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Tabel Rekap Rincian Material */}
        <div className="border border-slate-300 rounded overflow-hidden">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-slate-200 text-slate-800 font-bold border-b border-slate-300">
                <th className="p-2 text-center w-8 border-r border-slate-300">No</th>
                <th className="p-2 text-left border-r border-slate-300">Uraian / Jenis Material Konstruksi</th>
                <th className="p-2 text-right border-r border-slate-300 w-24">Total Volume</th>
                <th className="p-2 text-center border-r border-slate-300 w-16">Satuan</th>
                <th className="p-2 text-right border-r border-slate-300 w-28">Harga Satuan</th>
                <th className="p-2 text-right w-36">Jumlah (Rp)</th>
              </tr>
            </thead>
            <tbody>
              {inv.itemSummaries?.map((item, idx) => (
                <tr key={idx} className="border-b border-slate-200">
                  <td className="p-2 text-center border-r border-slate-200">{idx + 1}</td>
                  <td className="p-2 border-r border-slate-200">
                    <div className="font-bold text-slate-900">{item.itemName}</div>
                  </td>
                  <td className="p-2 text-right font-mono font-bold border-r border-slate-200">
                    {formatNumber(item.totalVolume)}
                  </td>
                  <td className="p-2 text-center font-mono border-r border-slate-200">{item.unit}</td>
                  <td className="p-2 text-right font-mono border-r border-slate-200">
                    {formatRupiah(item.unitPrice)}
                  </td>
                  <td className="p-2 text-right font-mono font-bold text-slate-900">
                    {formatRupiah(item.totalAmount)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-50 font-bold">
              <tr className="border-t border-slate-300">
                <td colSpan={2} className="p-2 text-right border-r border-slate-300 uppercase text-slate-700">
                  Total Dasar Pengenaan Pajak (DPP):
                </td>
                <td className="p-2 text-right border-r border-slate-300 font-mono">
                  {formatNumber(inv.itemSummaries?.reduce((s, i) => s + i.totalVolume, 0) || 0)}
                </td>
                <td colSpan={2} className="p-2 border-r border-slate-300"></td>
                <td className="p-2 text-right font-mono text-slate-900">{formatRupiah(inv.dppAmount)}</td>
              </tr>

              {inv.taxType !== 'non-ppn' && inv.ppnAmount > 0 && (
                <tr className="border-t border-slate-200">
                  <td colSpan={5} className="p-2 text-right border-r border-slate-300 uppercase text-slate-700">
                    PPN ({inv.ppnRate}%):
                  </td>
                  <td className="p-2 text-right font-mono text-blue-900">{formatRupiah(inv.ppnAmount)}</td>
                </tr>
              )}

              <tr className="bg-slate-200 font-extrabold border-t-2 border-slate-400">
                <td colSpan={5} className="p-2 text-right border-r border-slate-300 uppercase">
                  TOTAL NILAI INVOICE (TAGIHAN BRUTO):
                </td>
                <td className="p-2 text-right font-mono text-sm text-slate-950">
                  {formatRupiah(inv.totalAmount)}
                </td>
              </tr>

              {isWapu && inv.pph22Amount ? (
                <>
                  <tr className="border-t border-slate-300 text-slate-600">
                    <td colSpan={5} className="p-2 text-right border-r border-slate-300 uppercase text-[11px]">
                      Potongan PPh Pasal 22 Dipungut Instansi ({inv.pph22Rate}%):
                    </td>
                    <td className="p-2 text-right font-mono text-rose-700 font-bold">
                      ({formatRupiah(inv.pph22Amount)})
                    </td>
                  </tr>
                  <tr className="bg-emerald-100 font-black border-t-2 border-emerald-500 text-emerald-950">
                    <td colSpan={5} className="p-2 text-right border-r border-emerald-300 uppercase text-xs">
                      NETTO DITERIMA PENYEDIA (KAS MASUK):
                    </td>
                    <td className="p-2 text-right font-mono text-sm text-emerald-900">
                      {formatRupiah(inv.netReceivableAmount)}
                    </td>
                  </tr>
                </>
              ) : null}
            </tfoot>
          </table>
        </div>

        {/* Terbilang Box */}
        <div className="p-3 bg-slate-100 border border-slate-300 rounded">
          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">
            TERBILANG:
          </span>
          <p className="text-xs font-bold text-slate-900 italic mt-0.5">
            # {terbilang(isWapu ? inv.netReceivableAmount : inv.totalAmount)} Rupiah #
          </p>
        </div>

        {/* Info Pembayaran & Tanda Tangan */}
        <div className="grid grid-cols-2 gap-4 pt-3 items-end">
          <div className="space-y-1.5 p-3 border border-slate-200 rounded bg-slate-50 text-[11px]">
            <p className="font-bold text-slate-800">Pembayaran Ditransfer Melalui Rekening:</p>
            <div>
              Bank: <strong>{companyProfile.bankName}</strong>
            </div>
            <div>
              No. Rekening: <strong className="font-mono">{companyProfile.bankAccount}</strong>
            </div>
            <div>
              a.n. <strong>{companyProfile.bankHolder}</strong>
            </div>
            {inv.status === 'Lunas' && (
              <div className="mt-2 inline-block px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold rounded text-[10px]">
                STATUS: LUNAS ({formatDateIndo(inv.paymentDate || inv.invoiceDate)})
              </div>
            )}
          </div>

          <div className="text-right space-y-1">
            <p className="text-slate-700 font-medium">Hormat Kami,</p>
            <p className="font-bold text-slate-900">{companyProfile.name}</p>
            <div className="h-[calc(4rem+5mm)]"></div>
            <p className="font-bold underline text-slate-900 text-xs">
              {companyProfile.signatoryName}
            </p>
            <p className="text-[11px] text-slate-600">{companyProfile.signatoryRole}</p>
          </div>
        </div>
      </div>
    );

    onOpenPrintModal(`Faktur Tagihan ${inv.invoiceNumber}`, printContent);
  };

  // Print Daily Delivery Notes Breakdown from Saved Invoice Record
  const handlePrintSavedDeliveryBreakdown = (inv: InvoiceRecord) => {
    const totalVol = inv.deliveryNotes?.reduce((sum, s) => sum + s.volume, 0) || 0;
    const printContent = (
      <div className="p-8 bg-white text-slate-900 text-xs font-sans space-y-4 max-w-4xl mx-auto">
        {/* Kop Surat */}
        <div className="border-b-2 border-slate-900 pb-3 flex justify-between items-start">
          <div className="flex items-start gap-3">
            {companyProfile.logoUrl && (
              <div className="w-14 h-14 rounded p-1 flex items-center justify-center shrink-0 border border-slate-200">
                <img
                  src={companyProfile.logoUrl}
                  alt="Logo"
                  className="max-w-full max-h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
            )}
            <div>
              <h1 className="text-base font-bold text-slate-900 leading-tight">
                {companyProfile.name}
              </h1>
              <p className="text-[11px] text-slate-600">{companyProfile.tagline}</p>
              <p className="text-[10px] text-slate-500">{companyProfile.address}</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-sm font-bold uppercase text-slate-900">
              LAMPIRAN REKAP PENGIRIMAN SURAT JALAN
            </h2>
            <p className="text-xs font-mono font-bold text-blue-900">Invoice: {inv.invoiceNumber}</p>
            <p className="text-xs font-mono text-slate-700">PO: {inv.poNumber}</p>
            <p className="text-[11px] font-semibold text-slate-700">
              Periode: {inv.periodDescription}
            </p>
          </div>
        </div>

        {/* Info Box */}
        <div className="flex justify-between p-2.5 bg-slate-100 border border-slate-300 rounded text-[11px]">
          <div>
            <span className="text-slate-500 font-medium">Klien / Buyer:</span>{' '}
            <strong className="text-slate-900">{inv.clientName}</strong>
            <div className="text-slate-600">Lokasi / Proyek: {inv.destination}</div>
          </div>
          <div className="text-right">
            <span className="text-slate-500 font-medium">Total Surat Jalan:</span>{' '}
            <strong className="text-slate-900 font-mono">{inv.deliveryNotes?.length || 0} SJ</strong>
            <div className="text-slate-600 font-mono">
              Total Volume:{' '}
              <strong className="text-slate-900">{formatNumber(totalVol)}</strong>
            </div>
          </div>
        </div>

        {/* Tabel Rincian per Surat Jalan */}
        <table className="w-full text-left border-collapse border border-slate-300 text-[10px]">
          <thead>
            <tr className="bg-slate-200 text-slate-800 font-bold border-b border-slate-300">
              <th className="p-1.5 border border-slate-300 text-center w-7">No</th>
              <th className="p-1.5 border border-slate-300">Tanggal Kirim</th>
              <th className="p-1.5 border border-slate-300">No. Surat Jalan</th>
              <th className="p-1.5 border border-slate-300">Armada & Sopir</th>
              <th className="p-1.5 border border-slate-300">Nama Barang</th>
              <th className="p-1.5 border border-slate-300 text-right">Volume</th>
              <th className="p-1.5 border border-slate-300 text-center">Unit</th>
            </tr>
          </thead>
          <tbody>
            {inv.deliveryNotes?.map((s, idx) => (
              <tr key={idx} className="border-t border-slate-200">
                <td className="p-1.5 border border-slate-300 text-center font-mono">{idx + 1}</td>
                <td className="p-1.5 border border-slate-300 whitespace-nowrap font-mono">{s.date}</td>
                <td className="p-1.5 border border-slate-300 font-mono font-bold">{s.deliveryNoteNumber}</td>
                <td className="p-1.5 border border-slate-300">
                  <div className="font-semibold">{s.vehiclePlate || '-'}</div>
                  <div className="text-[9px] text-slate-500">{s.driverName || '-'}</div>
                </td>
                <td className="p-1.5 border border-slate-300 font-medium">{s.itemName}</td>
                <td className="p-1.5 border border-slate-300 text-right font-mono font-bold">
                  {formatNumber(s.volume)}
                </td>
                <td className="p-1.5 border border-slate-300 text-center">{s.unit}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-slate-100 font-bold border-t-2 border-slate-400">
              <td colSpan={5} className="p-2 border border-slate-300 text-right uppercase">
                TOTAL KESELURUHAN VOLUME:
              </td>
              <td className="p-2 border border-slate-300 text-right font-mono text-xs">
                {formatNumber(totalVol)}
              </td>
              <td className="p-2 border border-slate-300 text-center"></td>
            </tr>
          </tfoot>
        </table>
      </div>
    );

    onOpenPrintModal(`Lampiran Surat Jalan Invoice ${inv.invoiceNumber}`, printContent);
  };

  // Print Daily Delivery Notes Breakdown from Active Generator
  const handlePrintDailyDeliveryBreakdown = () => {
    const printContent = (
      <div className="p-8 bg-white text-slate-900 text-xs font-sans space-y-4 max-w-4xl mx-auto">
        {/* Kop Surat */}
        <div className="border-b-2 border-slate-900 pb-3 flex justify-between items-start">
          <div className="flex items-start gap-3">
            {companyProfile.logoUrl && (
              <div className="w-14 h-14 rounded p-1 flex items-center justify-center shrink-0 border border-slate-200">
                <img
                  src={companyProfile.logoUrl}
                  alt="Logo"
                  className="max-w-full max-h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
            )}
            <div>
              <h1 className="text-base font-bold text-slate-900 leading-tight">
                {companyProfile.name}
              </h1>
              <p className="text-[11px] text-slate-600">{companyProfile.tagline}</p>
              <p className="text-[10px] text-slate-500">{companyProfile.address}</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-sm font-bold uppercase text-slate-900">
              LAMPIRAN REKAP PENGIRIMAN SURAT JALAN HARIAN
            </h2>
            <p className="text-xs font-mono font-bold text-blue-900">No. PO: {activePO}</p>
            <p className="text-[11px] font-semibold text-slate-700">
              Periode Hari: {periodDescriptionText}
            </p>
          </div>
        </div>

        {/* Info Box */}
        <div className="flex justify-between p-2.5 bg-slate-100 border border-slate-300 rounded text-[11px]">
          <div>
            <span className="text-slate-500 font-medium">Klien / Buyer:</span>{' '}
            <strong className="text-slate-900">{clientName}</strong>
            <div className="text-slate-600">Lokasi / Proyek: {destination}</div>
          </div>
          <div className="text-right">
            <span className="text-slate-500 font-medium">Total Surat Jalan:</span>{' '}
            <strong className="text-slate-900 font-mono">{poSales.length} SJ</strong>
            <div className="text-slate-600 font-mono">
              Total Volume:{' '}
              <strong className="text-slate-900">{formatNumber(totalOverallVolume)}</strong>
            </div>
          </div>
        </div>

        {/* Tabel Rincian per Surat Jalan */}
        <table className="w-full text-left border-collapse border border-slate-300 text-[10px]">
          <thead>
            <tr className="bg-slate-200 text-slate-800 font-bold border-b border-slate-300">
              <th className="p-1.5 border border-slate-300 text-center w-7">No</th>
              <th className="p-1.5 border border-slate-300">Tanggal Kirim</th>
              <th className="p-1.5 border border-slate-300">No. Surat Jalan</th>
              <th className="p-1.5 border border-slate-300">Armada & Sopir</th>
              <th className="p-1.5 border border-slate-300">Nama Barang</th>
              <th className="p-1.5 border border-slate-300 text-right">Volume</th>
              <th className="p-1.5 border border-slate-300 text-center">Unit</th>
              <th className="p-1.5 border border-slate-300 text-right">Harga (Rp)</th>
              <th className="p-1.5 border border-slate-300 text-right">Total DPP (Rp)</th>
            </tr>
          </thead>
          <tbody>
            {poSales.map((s, idx) => (
              <tr key={s.id} className="border-t border-slate-200">
                <td className="p-1.5 border border-slate-300 text-center font-mono">{idx + 1}</td>
                <td className="p-1.5 border border-slate-300 whitespace-nowrap font-mono">{s.date}</td>
                <td className="p-1.5 border border-slate-300 font-mono font-bold">{s.deliveryNoteNumber}</td>
                <td className="p-1.5 border border-slate-300">
                  <div className="font-semibold">{s.vehiclePlate || '-'}</div>
                  <div className="text-[9px] text-slate-500">{s.driverName || '-'}</div>
                </td>
                <td className="p-1.5 border border-slate-300 font-medium">{s.itemName}</td>
                <td className="p-1.5 border border-slate-300 text-right font-mono font-bold">
                  {formatNumber(s.volume)}
                </td>
                <td className="p-1.5 border border-slate-300 text-center">{s.unit}</td>
                <td className="p-1.5 border border-slate-300 text-right font-mono">
                  {formatRupiah(s.price)}
                </td>
                <td className="p-1.5 border border-slate-300 text-right font-mono font-bold">
                  {formatRupiah(s.totalAmount)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-slate-100 font-bold border-t-2 border-slate-400">
              <td colSpan={5} className="p-2 border border-slate-300 text-right uppercase">
                TOTAL KESELURUHAN PENGIRIMAN:
              </td>
              <td className="p-2 border border-slate-300 text-right font-mono text-xs">
                {formatNumber(totalOverallVolume)}
              </td>
              <td className="p-2 border border-slate-300 text-center"></td>
              <td className="p-2 border border-slate-300"></td>
              <td className="p-2 border border-slate-300 text-right font-mono text-xs font-extrabold text-blue-950">
                {formatRupiah(rawSubtotal)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    );

    onOpenPrintModal(`Lampiran Rekap Pengiriman PO ${activePO}`, printContent);
  };

  const handleSaveInvoiceFromGenerator = () => {
    setEditingInvoice(null);
    setIsSaveModalOpen(true);
  };

  const handleSaveInvoiceSubmit = (
    invData: Omit<InvoiceRecord, 'id' | 'createdAt'> & { id?: string; syncSales?: boolean }
  ) => {
    if (invData.id && onUpdateInvoice) {
      onUpdateInvoice(invData.id, invData);
    } else if (onAddInvoice) {
      onAddInvoice(invData);
    }
  };

  const handleDeleteInvoiceConfirm = (inv: InvoiceRecord) => {
    if (
      window.confirm(
        `Apakah Anda yakin ingin menghapus arsip Invoice ${inv.invoiceNumber} (PO: ${inv.poNumber})?\nData pembayaran dan history invoice ini akan dihapus dari sistem.`
      )
    ) {
      if (onDeleteInvoice) {
        onDeleteInvoice(inv.id);
      }
    }
  };

  const handleOpenPaymentModal = (inv: InvoiceRecord) => {
    setSelectedInvoiceForPayment(inv);
    setIsPaymentModalOpen(true);
  };

  return (
    <div className="space-y-3">
      {/* Modals */}
      <SaveInvoiceModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        onSave={handleSaveInvoiceSubmit}
        initialData={editingInvoice || { invoiceNumber: invoiceNo, invoiceDate: invoiceDate }}
        defaultPoNumber={editingInvoice?.poNumber || activePO}
        defaultClientName={editingInvoice?.clientName || clientName}
        defaultClientAddress={editingInvoice?.clientAddress || clientAddress}
        defaultClientNPWP={editingInvoice?.clientNPWP || clientNPWP}
        defaultDestination={editingInvoice?.destination || destination}
        defaultPeriodDescription={editingInvoice?.periodDescription || periodDescriptionText}
        subtotal={editingInvoice?.subtotal || rawSubtotal}
        taxType={editingInvoice?.taxType || invoiceTaxType}
        dppAmount={editingInvoice?.dppAmount || taxBreakdown.dpp}
        ppnRate={editingInvoice?.ppnRate || ppnRate}
        ppnAmount={editingInvoice?.ppnAmount || taxBreakdown.ppnAmount}
        pph22Rate={editingInvoice?.pph22Rate || pph22Rate}
        pph22Amount={editingInvoice?.pph22Amount || (taxBreakdown.pph22Amount || 0)}
        isWapu={editingInvoice?.isWapu !== undefined ? editingInvoice.isWapu : isWapuProject}
        totalAmount={editingInvoice?.totalAmount || taxBreakdown.totalWithTax}
        netReceivableAmount={
          editingInvoice?.netReceivableAmount ||
          (isWapuProject ? taxBreakdown.netReceivableAmount || taxBreakdown.totalWithTax : taxBreakdown.totalWithTax)
        }
        itemSummaries={editingInvoice?.itemSummaries || itemSummaries}
        deliveryNotes={editingInvoice?.deliveryNotes || invoiceDeliveryNotes}
        saleIds={editingInvoice?.saleIds || invoiceSaleIds}
        existingInvoiceId={editingInvoice?.id}
      />

      <InvoicePaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        invoice={selectedInvoiceForPayment}
        onSavePayment={(invId, paymentData) => {
          if (onRecordPayment) {
            onRecordPayment(invId, paymentData);
          }
        }}
      />

      {/* Main Top Header with Sub-Tab Switcher */}
      <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-600 rounded-lg text-white">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-tight">
                Rekap Invoice & Manajemen Piutang Usaha
              </h2>
              <p className="text-xs text-slate-500">
                Penerbitan faktur tagihan PO, pencatatan status pelunasan Lunas / Sebagian, dan integrasi Laporan Keuangan
              </p>
            </div>
          </div>

          {/* Sub-tab Navigation */}
          <div className="inline-flex p-1 bg-slate-100 rounded-lg border border-slate-200 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setActiveTab('create')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition ${
                activeTab === 'create'
                  ? 'bg-white text-blue-800 shadow-xs ring-1 ring-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Buat / Rekap Baru</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition ${
                activeTab === 'history'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Riwayat Invoice Tersimpan</span>
              {invoices.length > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  activeTab === 'history' ? 'bg-blue-800 text-white' : 'bg-blue-100 text-blue-800'
                }`}>
                  {invoices.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: GENERATOR BUAT / REKAP INVOICE BARU                                */}
      {/* ========================================================================= */}
      {activeTab === 'create' && (
        <div className="space-y-3">
          {/* Action Bar for Generator */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">Aksi Dokumen:</span>
              {savedInvoicesForActivePO.length > 0 && (
                <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>PO ini memiliki {savedInvoicesForActivePO.length} invoice tersimpan</span>
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() =>
                  exportInvoiceRecapToExcel(
                    activePO,
                    clientName,
                    periodDescriptionText,
                    poSales,
                    itemSummaries,
                    taxBreakdown
                  )
                }
                disabled={!activePO || poSales.length === 0}
                className={`flex items-center gap-1 px-2.5 py-1.5 font-bold text-xs rounded transition border ${
                  activePO && poSales.length > 0
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100'
                    : 'bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed'
                }`}
                title="Ekspor Rekap Invoice & Surat Jalan ke Excel"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Excel</span>
              </button>

              <button
                onClick={handlePrintDailyDeliveryBreakdown}
                disabled={!activePO || poSales.length === 0}
                className={`flex items-center gap-1 px-3 py-1.5 font-bold text-xs rounded transition border shadow-2xs ${
                  activePO && poSales.length > 0
                    ? 'bg-slate-100 border-slate-300 text-slate-800 hover:bg-slate-200'
                    : 'bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed'
                }`}
                title="Cetak Lampiran Rincian Surat Jalan Per Hari"
              >
                <Truck className="w-3.5 h-3.5 text-blue-600" />
                <span>Cetak Rekap SJ</span>
              </button>

              <button
                id="btn-print-official-invoice"
                disabled={!activePO || poSales.length === 0}
                onClick={handlePrintOfficialInvoice}
                className={`flex items-center gap-1 px-3 py-1.5 font-bold text-xs rounded transition border border-blue-700 shadow-2xs ${
                  activePO && poSales.length > 0
                    ? 'bg-blue-50 text-blue-800 hover:bg-blue-100'
                    : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                }`}
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Invoice</span>
              </button>

              <button
                id="btn-save-to-invoice-history"
                disabled={!activePO || poSales.length === 0}
                onClick={handleSaveInvoiceFromGenerator}
                className={`flex items-center gap-1 px-3.5 py-1.5 font-bold text-xs rounded transition shadow-2xs ${
                  activePO && poSales.length > 0
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                }`}
              >
                <FileCheck2 className="w-3.5 h-3.5" />
                <span>Simpan ke Riwayat Invoice</span>
              </button>
            </div>
          </div>

          {/* FILTER PERIODE HARI (Khusus Rekap Invoice) */}
          <div className="bg-white border border-blue-200 rounded-lg p-2.5 shadow-2xs space-y-2 bg-gradient-to-r from-blue-50/50 via-white to-indigo-50/40">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
              {/* Mode Switcher */}
              <div className="flex flex-wrap items-center gap-1.5">
                <div className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-blue-900 mr-1">
                  <CalendarDays className="w-3.5 h-3.5 text-blue-600" />
                  <span>Periode Hari Rekap:</span>
                </div>

                <div className="inline-flex p-0.5 bg-white rounded border border-blue-200 shadow-2xs">
                  <button
                    type="button"
                    onClick={resetAllDays}
                    className={`px-2.5 py-1 text-xs font-semibold rounded transition ${
                      activeDateFilter.mode === 'semua'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-blue-700 hover:bg-blue-50'
                    }`}
                  >
                    Semua Hari
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleDateFilterChange({ ...activeDateFilter, mode: 'harian' })
                    }
                    className={`px-2.5 py-1 text-xs font-semibold rounded transition ${
                      activeDateFilter.mode === 'harian'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-blue-700 hover:bg-blue-50'
                    }`}
                  >
                    Harian (1 Hari)
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleDateFilterChange({ ...activeDateFilter, mode: 'periode' })
                    }
                    className={`px-2.5 py-1 text-xs font-semibold rounded transition ${
                      activeDateFilter.mode === 'periode'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-blue-700 hover:bg-blue-50'
                    }`}
                  >
                    Rentang Hari
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleDateFilterChange({ ...activeDateFilter, mode: 'bulanan' })
                    }
                    className={`px-2.5 py-1 text-xs font-semibold rounded transition ${
                      activeDateFilter.mode === 'bulanan'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-blue-700 hover:bg-blue-50'
                    }`}
                  >
                    Bulanan
                  </button>
                </div>
              </div>

              {/* Status Display */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-500">Filter Aktif:</span>
                <span className="text-xs font-bold text-blue-900 bg-white px-2 py-0.5 rounded border border-blue-200 font-mono shadow-2xs">
                  {periodDescriptionText}
                </span>
                {activeDateFilter.mode !== 'semua' && (
                  <button
                    onClick={resetAllDays}
                    className="text-[11px] text-rose-600 hover:text-rose-800 font-bold flex items-center gap-0.5"
                    title="Reset ke Semua Hari"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset</span>
                  </button>
                )}
              </div>
            </div>

            {/* Inputs based on Mode */}
            {activeDateFilter.mode === 'harian' && (
              <div className="pt-2 border-t border-blue-100 flex flex-wrap items-center gap-2">
                <label className="text-[11px] font-bold text-slate-700">Pilih Tanggal Pengiriman:</label>
                <input
                  type="date"
                  value={activeDateFilter.date || getTodayDateString()}
                  onChange={(e) =>
                    handleDateFilterChange({
                      ...activeDateFilter,
                      date: e.target.value,
                    })
                  }
                  className="px-2.5 py-1 bg-white border border-blue-300 rounded text-xs text-slate-800 focus:ring-1 focus:ring-blue-500 font-mono"
                />
              </div>
            )}

            {activeDateFilter.mode === 'periode' && (
              <div className="pt-2 border-t border-blue-100 flex flex-wrap items-center gap-2">
                <label className="text-[11px] font-bold text-slate-700">Dari Tanggal:</label>
                <input
                  type="date"
                  value={activeDateFilter.startDate || getTodayDateString()}
                  onChange={(e) =>
                    handleDateFilterChange({
                      ...activeDateFilter,
                      startDate: e.target.value,
                    })
                  }
                  className="px-2 py-1 bg-white border border-blue-300 rounded text-xs text-slate-800 focus:ring-1 focus:ring-blue-500 font-mono"
                />
                <span className="text-slate-400 text-xs font-bold">s/d</span>
                <label className="text-[11px] font-bold text-slate-700">Sampai Tanggal:</label>
                <input
                  type="date"
                  value={activeDateFilter.endDate || getTodayDateString()}
                  onChange={(e) =>
                    handleDateFilterChange({
                      ...activeDateFilter,
                      endDate: e.target.value,
                    })
                  }
                  className="px-2 py-1 bg-white border border-blue-300 rounded text-xs text-slate-800 focus:ring-1 focus:ring-blue-500 font-mono"
                />
              </div>
            )}

            {activeDateFilter.mode === 'bulanan' && (
              <div className="pt-2 border-t border-blue-100 flex flex-wrap items-center gap-2">
                <label className="text-[11px] font-bold text-slate-700">Pilih Bulan & Tahun:</label>
                <input
                  type="month"
                  value={activeDateFilter.month || getCurrentMonthString()}
                  onChange={(e) =>
                    handleDateFilterChange({
                      ...activeDateFilter,
                      month: e.target.value,
                    })
                  }
                  className="px-2.5 py-1 bg-white border border-blue-300 rounded text-xs text-slate-800 focus:ring-1 focus:ring-blue-500 font-mono"
                />
              </div>
            )}
          </div>

          {/* Form Filter PO & Parameter Invoice */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5 bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Pilih Purchase Order (PO) *
              </label>
              <select
                value={activePO}
                onChange={(e) => setSelectedPO(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs font-mono font-bold text-blue-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {distinctPOs.length === 0 ? (
                  <option value="">(Tidak ada data PO pada penjualan)</option>
                ) : (
                  distinctPOs.map((po) => (
                    <option key={po} value={po}>
                      {po}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Nomor Invoice / Faktur
              </label>
              <input
                type="text"
                value={invoiceNo}
                onChange={(e) => setInvoiceNo(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs font-mono text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Tanggal Terbit Invoice
              </label>
              <input
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Skema Perpajakan
              </label>
              <select
                value={invoiceTaxType}
                onChange={(e) => setCustomTaxType(e.target.value as TaxCalculationType)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="wapu">WAPU BUMN / Pemerintah (PPN 11% + PPh 22 1.5%)</option>
                <option value="exclude">PPN 11% Ditambahkan (Exclude)</option>
                <option value="include">PPN 11% Termasuk dalam Harga (Include)</option>
                <option value="non-ppn">Non-PPN (0% Bebas Pajak)</option>
              </select>
            </div>
          </div>

          {/* Result Card: Aggregation & Breakdown Tables */}
          {poSales.length > 0 ? (
            <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-2xs space-y-4">
              {/* Header Info Banner */}
              <div className="p-3 bg-blue-50/60 rounded-lg border border-blue-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wide block">
                    Klien & Lokasi Proyek:
                  </span>
                  <h3 className="text-sm font-bold text-slate-900">{clientName}</h3>
                  <p className="text-xs text-slate-600">
                    Lokasi: <span className="font-semibold text-slate-800">{destination}</span>
                    {clientNPWP && (
                      <span className="ml-2 font-mono text-[10px] text-slate-500">
                        (NPWP: {formatNPWP(clientNPWP)})
                      </span>
                    )}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="px-3 py-1.5 bg-white rounded border border-blue-200 text-right shadow-2xs">
                    <span className="text-[10px] text-slate-500 font-bold block">TOTAL DPP:</span>
                    <span className="text-xs font-bold text-slate-900 font-mono">
                      {formatRupiah(taxBreakdown.dpp)}
                    </span>
                  </div>
                  <div className="px-3 py-1.5 bg-white rounded border border-blue-200 text-right shadow-2xs">
                    <span className="text-[10px] text-slate-500 font-bold block">PPN {ppnRate}%:</span>
                    <span className="text-xs font-bold text-blue-900 font-mono">
                      {formatRupiah(taxBreakdown.ppnAmount)}
                    </span>
                  </div>
                  <div className="px-3 py-1.5 bg-blue-900 text-white rounded text-right shadow-2xs">
                    <span className="text-[10px] text-blue-200 font-bold block">
                      TOTAL {isWapuProject ? 'NETTO MASUK' : 'TAGIHAN'}:
                    </span>
                    <span className="text-xs font-black font-mono">
                      {formatRupiah(
                        isWapuProject ? taxBreakdown.netReceivableAmount : taxBreakdown.totalWithTax
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 1: Aggregated Summary Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-blue-600" />
                    <span>1. Rekap Agregasi Volume Material (Invoice Summary)</span>
                  </h4>
                  <span className="text-[10px] text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 font-semibold">
                    Periode: <strong>{periodDescriptionText}</strong> ({poSales.length} SJ)
                  </span>
                </div>

                <div className="border border-slate-200 rounded overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                      <tr>
                        <th className="px-3 py-2 text-center w-10">No</th>
                        <th className="px-3 py-2">Nama Barang Material</th>
                        <th className="px-3 py-2 text-right">Total Volume</th>
                        <th className="px-3 py-2 text-center">Satuan</th>
                        <th className="px-3 py-2 text-right">Harga Jual Satuan</th>
                        <th className="px-3 py-2 text-right">Dasar Pengenaan Pajak (DPP)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {itemSummaries.map((item, idx) => (
                        <tr key={idx} className="hover:bg-blue-50/50">
                          <td className="px-3 py-2 text-slate-500 font-mono text-center">{idx + 1}</td>
                          <td className="px-3 py-2 font-semibold text-slate-900">
                            <div>{item.itemName}</div>
                          </td>
                          <td className="px-3 py-2 text-right font-mono font-bold text-slate-900">
                            {formatNumber(item.totalVolume)}
                          </td>
                          <td className="px-3 py-2 text-center font-mono">
                            <span className="px-1.5 py-0.2 rounded bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-bold">
                              {item.unit}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-right font-mono text-slate-600">
                            {formatRupiah(item.unitPrice)}
                          </td>
                          <td className="px-3 py-2 text-right font-mono font-bold text-slate-900">
                            {formatRupiah(item.totalAmount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
                      <tr>
                        <td colSpan={2} className="px-3 py-2 text-right uppercase text-slate-700 text-[11px]">
                          Dasar Pengenaan Pajak (DPP):
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-slate-900">
                          {formatNumber(totalOverallVolume)}
                        </td>
                        <td colSpan={2}></td>
                        <td className="px-3 py-2 text-right font-mono text-sm font-bold text-slate-900">
                          {formatRupiah(taxBreakdown.dpp)}
                        </td>
                      </tr>
                      {invoiceTaxType !== 'non-ppn' && (
                        <tr className="border-t border-slate-200">
                          <td colSpan={5} className="px-3 py-1.5 text-right uppercase text-slate-600 text-[10px]">
                            PPN ({ppnRate}%):
                          </td>
                          <td className="px-3 py-1.5 text-right font-mono font-bold text-blue-900">
                            {formatRupiah(taxBreakdown.ppnAmount)}
                          </td>
                        </tr>
                      )}
                      <tr className="bg-slate-100 border-t-2 border-slate-300">
                        <td colSpan={5} className="px-3 py-2 text-right uppercase text-slate-900 text-[11px] font-extrabold">
                          Total Nilai Tagihan Faktur (Bruto):
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-sm font-extrabold text-blue-950">
                          {formatRupiah(taxBreakdown.totalWithTax)}
                        </td>
                      </tr>
                      {isWapuProject && (
                        <tr className="bg-emerald-50 border-t border-emerald-300 text-emerald-950">
                          <td colSpan={5} className="px-3 py-2 text-right uppercase text-[11px] font-bold">
                            Netto Masuk Rekening (Setelah Potongan WAPU):
                          </td>
                          <td className="px-3 py-2 text-right font-mono text-sm font-black text-emerald-700">
                            {formatRupiah(taxBreakdown.netReceivableAmount)}
                          </td>
                        </tr>
                      )}
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Section 2: Daily Delivery Notes Breakdown Table */}
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5 text-blue-600" />
                    <span>2. Rincian Surat Jalan Pengiriman Harian (Lampiran Tagihan)</span>
                  </h4>
                  <button
                    onClick={handlePrintDailyDeliveryBreakdown}
                    className="text-[11px] text-blue-700 hover:text-blue-900 font-bold flex items-center gap-1"
                  >
                    <Printer className="w-3 h-3" />
                    <span>Cetak Rincian Harian</span>
                  </button>
                </div>

                <div className="border border-slate-200 rounded overflow-x-auto max-h-80 overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200 sticky top-0 bg-slate-100">
                      <tr>
                        <th className="px-3 py-1.5 text-center w-8">No</th>
                        <th className="px-3 py-1.5">Tanggal</th>
                        <th className="px-3 py-1.5">No. Surat Jalan</th>
                        <th className="px-3 py-1.5">Armada & Sopir</th>
                        <th className="px-3 py-1.5">Nama Barang</th>
                        <th className="px-3 py-1.5 text-right">Volume</th>
                        <th className="px-3 py-1.5 text-center">Unit</th>
                        <th className="px-3 py-1.5 text-right">Harga</th>
                        <th className="px-3 py-1.5 text-right">Total (Rp)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {poSales.map((s, idx) => (
                        <tr key={s.id} className="hover:bg-slate-50">
                          <td className="px-3 py-1.5 text-slate-400 font-mono text-center text-[11px]">
                            {idx + 1}
                          </td>
                          <td className="px-3 py-1.5 whitespace-nowrap font-mono text-slate-700 text-[11px]">
                            {s.date}
                          </td>
                          <td className="px-3 py-1.5 font-mono font-bold text-blue-700 text-[11px]">
                            {s.deliveryNoteNumber}
                          </td>
                          <td className="px-3 py-1.5 text-[11px]">
                            <span className="font-semibold text-slate-800">{s.vehiclePlate || '-'}</span>{' '}
                            <span className="text-slate-400">({s.driverName || '-'})</span>
                          </td>
                          <td className="px-3 py-1.5 text-slate-900 font-medium text-[11px]">
                            {s.itemName}
                          </td>
                          <td className="px-3 py-1.5 text-right font-mono font-bold text-slate-900 text-[11px]">
                            {formatNumber(s.volume)}
                          </td>
                          <td className="px-3 py-1.5 text-center font-mono text-slate-600 text-[11px]">
                            {s.unit}
                          </td>
                          <td className="px-3 py-1.5 text-right font-mono text-slate-700 text-[11px]">
                            {formatRupiah(s.price)}
                          </td>
                          <td className="px-3 py-1.5 text-right font-mono font-bold text-slate-900 text-[11px]">
                            {formatRupiah(s.totalAmount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Terbilang Box */}
              <div className="p-2.5 bg-slate-50 rounded border border-slate-200 text-xs">
                <span className="text-slate-500 text-[10px] block font-semibold">Terbilang (Rupiah):</span>
                <span className="text-slate-800 font-medium italic text-[11px]">
                  # {terbilang(isWapuProject ? taxBreakdown.netReceivableAmount : taxBreakdown.totalWithTax)} #
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded p-8 text-center text-slate-400">
              <FileText className="w-8 h-8 text-slate-300 mx-auto mb-1.5" />
              <p className="font-semibold text-slate-700 text-xs">
                Tidak ada data pengiriman untuk PO & Periode Hari yang dipilih.
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Coba ubah filter Periode Hari ke &quot;Semua Hari&quot; atau pilih PO lainnya di atas.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: RIWAYAT INVOICE TERSIMPAN & STATUS PEMBAYARAN                      */}
      {/* ========================================================================= */}
      {activeTab === 'history' && (
        <div className="space-y-3 animate-in fade-in duration-150">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {/* Total Invoiced */}
            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Total Tagihan Faktur
                </span>
                <div className="p-1 bg-blue-50 text-blue-600 rounded">
                  <Receipt className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="text-base font-black text-slate-900 font-mono mt-1">
                {formatRupiah(receivablesSummary.totalInvoiced)}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5 flex items-center justify-between">
                <span>{receivablesSummary.totalCount} Faktur Terbit</span>
                <span>Netto: {formatRupiah(receivablesSummary.totalNetReceivable)}</span>
              </div>
            </div>

            {/* Total Paid (Kas Masuk) */}
            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                  Total Kas Diterima (Lunas)
                </span>
                <div className="p-1 bg-emerald-50 text-emerald-600 rounded">
                  <Wallet className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="text-base font-black text-emerald-700 font-mono mt-1">
                {formatRupiah(receivablesSummary.totalPaid)}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5 flex items-center justify-between">
                <span>{receivablesSummary.countLunas} Faktur Lunas</span>
                <span className="font-bold text-emerald-700">
                  {receivablesSummary.collectionRate.toFixed(1)}% Terkumpul
                </span>
              </div>
            </div>

            {/* Total Remaining Receivables */}
            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider">
                  Sisa Piutang Usaha
                </span>
                <div className="p-1 bg-rose-50 text-rose-600 rounded">
                  <Clock className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="text-base font-black text-rose-700 font-mono mt-1">
                {formatRupiah(receivablesSummary.totalRemaining)}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5 flex items-center justify-between">
                <span>{receivablesSummary.countBelumLunas + receivablesSummary.countSebagian} Belum/Cicil</span>
                <span className="text-rose-600 font-medium">Akun 1-102 Neraca</span>
              </div>
            </div>

            {/* Status Breakdown & Progress */}
            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Status Pelunasan
                </span>
                <span className="text-[10px] font-bold text-blue-700">
                  {receivablesSummary.collectionRate.toFixed(0)}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-100 rounded-full h-2 my-1.5 overflow-hidden flex">
                <div
                  className="bg-emerald-500 h-full transition-all duration-300"
                  style={{ width: `${Math.min(100, receivablesSummary.collectionRate)}%` }}
                  title={`Lunas: ${receivablesSummary.collectionRate.toFixed(1)}%`}
                ></div>
                <div
                  className="bg-amber-400 h-full transition-all duration-300"
                  style={{
                    width: `${
                      receivablesSummary.totalNetReceivable > 0
                        ? ((receivablesSummary.totalRemaining / receivablesSummary.totalNetReceivable) * 100)
                        : 0
                    }%`,
                  }}
                  title="Sisa Piutang"
                ></div>
              </div>

              <div className="flex items-center justify-between text-[10px] font-semibold text-slate-600">
                <span className="text-emerald-700">Lunas: {receivablesSummary.countLunas}</span>
                <span className="text-amber-700">Sebagian: {receivablesSummary.countSebagian}</span>
                <span className="text-rose-700">Belum: {receivablesSummary.countBelumLunas}</span>
              </div>
            </div>
          </div>

          {/* History Filters & Actions */}
          <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2 flex-1">
              {/* Search Box */}
              <div className="relative flex-1 min-w-[180px] max-w-xs">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari No. Invoice, PO, Klien..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  className="w-full pl-8 pr-2.5 py-1 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1">
                <span className="text-[11px] font-bold text-slate-600">Status:</span>
                <select
                  value={historyStatusFilter}
                  onChange={(e) => setHistoryStatusFilter(e.target.value)}
                  className="px-2 py-1 text-xs bg-white border border-slate-300 rounded font-semibold text-slate-800"
                >
                  <option value="all">Semua Status ({invoices.length})</option>
                  <option value="Lunas">Lunas ({receivablesSummary.countLunas})</option>
                  <option value="Sebagian">Sebagian ({receivablesSummary.countSebagian})</option>
                  <option value="Belum Lunas">Belum Lunas ({receivablesSummary.countBelumLunas})</option>
                </select>
              </div>

              {/* Client Filter */}
              {distinctHistoryClients.length > 0 && (
                <div className="flex items-center gap-1">
                  <span className="text-[11px] font-bold text-slate-600">Klien:</span>
                  <select
                    value={historyClientFilter}
                    onChange={(e) => setHistoryClientFilter(e.target.value)}
                    className="px-2 py-1 text-xs bg-white border border-slate-300 rounded text-slate-800 max-w-[160px] truncate"
                  >
                    <option value="all">Semua Klien</option>
                    {distinctHistoryClients.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Right Action Buttons */}
            <div className="flex items-center gap-1.5 self-end md:self-auto">
              <button
                onClick={() => exportInvoiceHistoryToExcel(filteredInvoices)}
                disabled={filteredInvoices.length === 0}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded shadow-2xs transition"
                title="Ekspor Riwayat Invoice ke Excel"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Ekspor Excel</span>
              </button>

              <button
                onClick={() => setActiveTab('create')}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded shadow-2xs transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Buat Baru</span>
              </button>
            </div>
          </div>

          {/* History Invoices Table */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
            {filteredInvoices.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 text-slate-700 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="px-3 py-2.5 text-center w-10">No</th>
                      <th className="px-3 py-2.5">No. Invoice & Tanggal</th>
                      <th className="px-3 py-2.5">No. PO & Klien</th>
                      <th className="px-3 py-2.5">Lokasi / Periode</th>
                      <th className="px-3 py-2.5 text-right">Nilai Tagihan</th>
                      <th className="px-3 py-2.5 text-center">Status</th>
                      <th className="px-3 py-2.5 text-right">Jumlah Dibayar</th>
                      <th className="px-3 py-2.5 text-right">Sisa Piutang</th>
                      <th className="px-3 py-2.5 text-center w-36">Aksi & Dokumen</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredInvoices.map((inv, idx) => {
                      const netAmount = inv.isWapu && inv.netReceivableAmount ? inv.netReceivableAmount : inv.totalAmount;
                      const paid = inv.amountPaid || 0;
                      const remaining = Math.max(0, netAmount - paid);
                      const isFullyPaid = inv.status === 'Lunas' || remaining === 0;
                      const isPartial = inv.status === 'Sebagian' || (paid > 0 && paid < netAmount);

                      return (
                        <tr key={inv.id} className="hover:bg-blue-50/40 transition">
                          {/* 1. Index */}
                          <td className="px-3 py-2.5 text-center text-slate-400 font-mono">
                            {idx + 1}
                          </td>

                          {/* 2. No. Invoice & Dates */}
                          <td className="px-3 py-2.5">
                            <div className="font-mono font-bold text-blue-900">{inv.invoiceNumber}</div>
                            <div className="text-[10px] text-slate-500">
                              Tgl: {formatDateIndo(inv.invoiceDate)}
                            </div>
                            {inv.dueDate && (
                              <div className="text-[9px] text-slate-400">
                                Tempo: {formatDateIndo(inv.dueDate)}
                              </div>
                            )}
                          </td>

                          {/* 3. PO & Client */}
                          <td className="px-3 py-2.5">
                            <div className="font-mono text-xs font-semibold text-slate-800">{inv.poNumber}</div>
                            <div className="text-[11px] text-slate-900 font-bold">{inv.clientName}</div>
                            {inv.isWapu && (
                              <span className="inline-block mt-0.5 text-[9px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.2 rounded">
                                WAPU BUMN
                              </span>
                            )}
                          </td>

                          {/* 4. Location & Period */}
                          <td className="px-3 py-2.5 text-[11px]">
                            <div className="text-slate-800 truncate max-w-[140px]" title={inv.destination}>
                              {inv.destination}
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono">
                              {inv.periodDescription} ({inv.deliveryNotes?.length || 0} SJ)
                            </div>
                          </td>

                          {/* 5. Total Tagihan */}
                          <td className="px-3 py-2.5 text-right font-mono">
                            <div className="font-bold text-slate-900">{formatRupiah(inv.totalAmount)}</div>
                            {inv.isWapu && inv.netReceivableAmount && (
                              <div className="text-[10px] text-emerald-700 font-semibold" title="Netto setelah PPh 22">
                                Netto: {formatRupiah(inv.netReceivableAmount)}
                              </div>
                            )}
                          </td>

                          {/* 6. Status Badge */}
                          <td className="px-3 py-2.5 text-center">
                            {isFullyPaid ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Lunas</span>
                              </span>
                            ) : isPartial ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200">
                                <Clock className="w-3 h-3" />
                                <span>Sebagian</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-200">
                                <AlertCircle className="w-3 h-3" />
                                <span>Belum Lunas</span>
                              </span>
                            )}

                            {inv.paymentDate && paid > 0 && (
                              <div className="text-[9px] text-slate-500 mt-0.5">
                                {formatDateIndo(inv.paymentDate)}
                              </div>
                            )}
                          </td>

                          {/* 7. Amount Paid */}
                          <td className="px-3 py-2.5 text-right font-mono font-bold text-emerald-800">
                            <div>{formatRupiah(paid)}</div>
                            {inv.paymentReference && (
                              <div className="text-[9px] text-slate-400 font-normal truncate max-w-[100px]" title={inv.paymentReference}>
                                Ref: {inv.paymentReference}
                              </div>
                            )}
                          </td>

                          {/* 8. Remaining Balance */}
                          <td className="px-3 py-2.5 text-right font-mono font-black">
                            <span className={remaining === 0 ? 'text-slate-400 font-normal' : 'text-rose-700'}>
                              {formatRupiah(remaining)}
                            </span>
                          </td>

                          {/* 9. Actions */}
                          <td className="px-3 py-2.5 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {/* Catat Pembayaran Button */}
                              <button
                                onClick={() => handleOpenPaymentModal(inv)}
                                className="p-1.5 text-emerald-700 hover:text-white hover:bg-emerald-600 rounded border border-emerald-300 transition"
                                title="Catat / Update Penerimaan Pembayaran"
                              >
                                <CreditCard className="w-3.5 h-3.5" />
                              </button>

                              {/* Cetak Faktur */}
                              <button
                                onClick={() => handlePrintSavedInvoice(inv)}
                                className="p-1.5 text-blue-700 hover:text-white hover:bg-blue-600 rounded border border-blue-300 transition"
                                title="Cetak Faktur / Invoice Resmi"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>

                              {/* Cetak Lampiran SJ */}
                              <button
                                onClick={() => handlePrintSavedDeliveryBreakdown(inv)}
                                className="p-1.5 text-slate-700 hover:text-white hover:bg-slate-700 rounded border border-slate-300 transition"
                                title="Cetak Lampiran Rekap Surat Jalan"
                              >
                                <Truck className="w-3.5 h-3.5" />
                              </button>

                              {/* Edit Modal */}
                              <button
                                onClick={() => {
                                  setEditingInvoice(inv);
                                  setIsSaveModalOpen(true);
                                }}
                                className="p-1.5 text-amber-700 hover:text-white hover:bg-amber-600 rounded border border-amber-300 transition"
                                title="Edit Rincian Invoice"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>

                              {/* Hapus */}
                              <button
                                onClick={() => handleDeleteInvoiceConfirm(inv)}
                                className="p-1.5 text-rose-700 hover:text-white hover:bg-rose-600 rounded border border-rose-300 transition"
                                title="Hapus dari Riwayat"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
                    <tr>
                      <td colSpan={4} className="px-3 py-2 text-right uppercase text-[11px] text-slate-700">
                        TOTAL KESELURUHAN RIWAYAT:
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-xs font-black text-slate-900">
                        {formatRupiah(filteredInvoices.reduce((s, i) => s + i.totalAmount, 0))}
                      </td>
                      <td></td>
                      <td className="px-3 py-2 text-right font-mono text-xs font-black text-emerald-800">
                        {formatRupiah(filteredInvoices.reduce((s, i) => s + (i.amountPaid || 0), 0))}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-xs font-black text-rose-800">
                        {formatRupiah(
                          filteredInvoices.reduce((s, i) => {
                            const net = i.isWapu && i.netReceivableAmount ? i.netReceivableAmount : i.totalAmount;
                            return s + Math.max(0, net - (i.amountPaid || 0));
                          }, 0)
                        )}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400">
                <Receipt className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="font-semibold text-slate-700 text-xs">
                  Belum ada riwayat invoice yang tersimpan.
                </p>
                <p className="text-[11px] text-slate-500 mt-1 max-w-sm mx-auto">
                  Gunakan tab &quot;Buat / Rekap Baru&quot; di atas untuk memilih PO & Periode Hari pengiriman, lalu klik tombol &quot;Simpan ke Riwayat Invoice&quot;.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('create')}
                  className="mt-3 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold transition inline-flex items-center gap-1 shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Buat Invoice Sekarang</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
