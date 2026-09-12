import React, { useState, useRef, useMemo } from 'react';
import {
  TrendingUp,
  Plus,
  Search,
  FileSpreadsheet,
  Printer,
  Download,
  Trash2,
  Edit2,
  Edit3,
  FileText,
  Truck,
  CheckCircle2,
  AlertCircle,
  X,
  Upload,
  Layers,
  MapPin,
  Calendar,
  Undo2,
  Sliders,
  CheckSquare,
  Square,
} from 'lucide-react';
import {
  ClientSupplier,
  CompanyProfile,
  DateFilterState,
  MaterialItem,
  SaleTransaction,
  SalesPrintOptions,
} from '../types';
import {
  formatDateIndo,
  formatNumber,
  formatRupiah,
  getTodayDateString,
  matchDateFilter,
  compareDateDescending,
  normalizeDateToYMD,
} from '../utils/formatters';
import { DateFilterBar } from './DateFilterBar';
import {
  downloadSalesExcelTemplate,
  exportTableToExcel,
  parseSalesExcelFile,
} from '../utils/excelHelper';
import {
  SalesPrintOptionsModal,
  DEFAULT_SALES_PRINT_OPTIONS,
} from './SalesPrintOptionsModal';
import { BulkEditSalesModal } from './BulkEditSalesModal';

interface SalesListProps {
  sales: SaleTransaction[];
  materials: MaterialItem[];
  clients: ClientSupplier[];
  companyProfile: CompanyProfile;
  filter: DateFilterState;
  onFilterChange: (filter: DateFilterState) => void;
  onAddSale: (sale: Omit<SaleTransaction, 'id' | 'createdAt'>) => void;
  onBulkAddSales: (sales: Omit<SaleTransaction, 'id' | 'createdAt'>[]) => void;
  onUpdateSale: (id: string, sale: Partial<SaleTransaction>) => void;
  onDeleteSale: (id: string) => void;
  onBulkDeleteSales?: (ids: string[]) => void;
  onBulkUpdateSales?: (ids: string[], updates: Partial<SaleTransaction>) => void;
  onOpenPrintModal: (title: string, content: React.ReactNode) => void;
  onUndo?: () => void;
  canUndo?: boolean;
  lastActionDescription?: string;
}

export const SalesList: React.FC<SalesListProps> = ({
  sales,
  materials,
  clients,
  companyProfile,
  filter,
  onFilterChange,
  onAddSale,
  onBulkAddSales,
  onUpdateSale,
  onDeleteSale,
  onBulkDeleteSales,
  onBulkUpdateSales,
  onOpenPrintModal,
  onUndo,
  canUndo,
  lastActionDescription,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<SaleTransaction | null>(null);
  const [lastImportedCount, setLastImportedCount] = useState<number>(0);

  // Row Selection & Print Customization State
  const [selectedSaleIds, setSelectedSaleIds] = useState<string[]>([]);
  const [printOptions, setPrintOptions] = useState<SalesPrintOptions>(DEFAULT_SALES_PRINT_OPTIONS);
  const [isPrintOptionsModalOpen, setIsPrintOptionsModalOpen] = useState(false);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    date: getTodayDateString(),
    poNumber: '',
    deliveryNoteNumber: '',
    clientId: '',
    clientName: '',
    itemId: '',
    itemName: '',
    quarry: '',
    unit: 'm3',
    volume: 24,
    destination: '',
    price: 0,
    paymentStatus: 'Lunas' as 'Lunas' | 'Belum Lunas',
    vehiclePlate: '',
    driverName: '',
    notes: '',
  });

  // Excel Upload States
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [excelPreview, setExcelPreview] = useState<Partial<SaleTransaction>[]>([]);
  const [excelErrors, setExcelErrors] = useState<string[]>([]);
  const [excelWarnings, setExcelWarnings] = useState<string[]>([]);
  const [isProcessingExcel, setIsProcessingExcel] = useState(false);

  // Auto-fill price & unit & destination & quarry when item is selected
  const handleItemSelect = (itemId: string) => {
    const selectedMat = materials.find((m) => m.id === itemId);
    if (selectedMat) {
      setFormData((prev) => ({
        ...prev,
        itemId: selectedMat.id,
        itemName: selectedMat.name,
        quarry: selectedMat.quarry,
        unit: selectedMat.unit,
        destination: selectedMat.destination || prev.destination,
        price: selectedMat.sellingPrice, // otomatis diambil dari Harga Jual Daftar Barang
      }));
    }
  };

  const handleClientSelect = (clientId: string) => {
    const selectedCli = clients.find((c) => c.id === clientId);
    if (selectedCli) {
      setFormData((prev) => ({
        ...prev,
        clientId: selectedCli.id,
        clientName: selectedCli.name,
        destination: prev.destination || selectedCli.address,
      }));
    }
  };

  const openAddModal = () => {
    setEditingSale(null);
    const defaultMat = materials[0];
    const defaultCli = clients.find((c) => c.type === 'klien');

    setFormData({
      date: getTodayDateString(),
      poNumber: `PO-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-001`,
      deliveryNoteNumber: `SJ-${Date.now().toString().slice(-6)}`,
      clientId: defaultCli ? defaultCli.id : '',
      clientName: defaultCli ? defaultCli.name : '',
      itemId: defaultMat ? defaultMat.id : '',
      itemName: defaultMat ? defaultMat.name : '',
      quarry: defaultMat ? defaultMat.quarry : '',
      unit: defaultMat ? defaultMat.unit : 'm3',
      volume: 24,
      destination: defaultMat ? defaultMat.destination : (defaultCli ? defaultCli.address : ''),
      price: defaultMat ? defaultMat.sellingPrice : 220000,
      paymentStatus: 'Lunas',
      vehiclePlate: 'B 9281 UY',
      driverName: 'Sopir Lapangan',
      notes: '',
    });
    setIsAddModalOpen(true);
  };

  const openEditModal = (sale: SaleTransaction) => {
    setEditingSale(sale);
    setFormData({
      date: sale.date,
      poNumber: sale.poNumber,
      deliveryNoteNumber: sale.deliveryNoteNumber,
      clientId: sale.clientId || '',
      clientName: sale.clientName,
      itemId: sale.itemId,
      itemName: sale.itemName,
      quarry: sale.quarry,
      unit: sale.unit,
      volume: sale.volume,
      destination: sale.destination,
      price: sale.price,
      paymentStatus: sale.paymentStatus,
      vehiclePlate: sale.vehiclePlate || '',
      driverName: sale.driverName || '',
      notes: sale.notes || '',
    });
    setIsAddModalOpen(true);
  };

  const handleSubmitSale = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.poNumber.trim() || !formData.deliveryNoteNumber.trim() || !formData.itemName.trim()) {
      alert('PO, No Surat Jalan, dan Nama Barang wajib diisi!');
      return;
    }

    if (formData.volume <= 0 || formData.price <= 0) {
      alert('Volume dan harga jual harus lebih besar dari 0!');
      return;
    }

    const totalAmount = formData.volume * formData.price;

    if (editingSale) {
      onUpdateSale(editingSale.id, {
        ...formData,
        totalAmount,
      });
    } else {
      onAddSale({
        ...formData,
        totalAmount,
      });
    }

    setIsAddModalOpen(false);
  };

  // Filter Sales based on selected DateFilterState (Diurutkan dari Tanggal Terbaru ke Terlama)
  const filteredSales = useMemo(() => {
    const searchLower = (searchTerm || '').trim().toLowerCase();

    return (sales || [])
      .filter((s) => {
        if (!s) return false;

        // 1. Date filter matching with normalization support
        const matchesDate = matchDateFilter(s.date, filter);

        // 2. Search query matching with null safety on all string fields
        const matchesSearch =
          !searchLower ||
          (s.poNumber || '').toLowerCase().includes(searchLower) ||
          (s.deliveryNoteNumber || '').toLowerCase().includes(searchLower) ||
          (s.clientName || '').toLowerCase().includes(searchLower) ||
          (s.itemName || '').toLowerCase().includes(searchLower) ||
          (s.destination || '').toLowerCase().includes(searchLower) ||
          (s.quarry || '').toLowerCase().includes(searchLower) ||
          (s.vehiclePlate || '').toLowerCase().includes(searchLower) ||
          (s.driverName || '').toLowerCase().includes(searchLower) ||
          (s.notes || '').toLowerCase().includes(searchLower);

        return matchesDate && matchesSearch;
      })
      .sort((a, b) => {
        const dateComparison = compareDateDescending(a.date, b.date); // Terbaru ke terlama
        if (dateComparison !== 0) return dateComparison;
        return (b.deliveryNoteNumber || '').localeCompare(a.deliveryNoteNumber || '', undefined, { numeric: true });
      });
  }, [sales, filter, searchTerm]);

  const totalVolumeFiltered = filteredSales.reduce((sum, s) => sum + s.volume, 0);
  const totalRevenueFiltered = filteredSales.reduce((sum, s) => sum + s.totalAmount, 0);

  // Filtered sales specific for printing based on user-selected print options
  const salesToPrint = useMemo(() => {
    return filteredSales.filter((s) => {
      // 1. Data scope
      if (printOptions.dataScope === 'selected_only') {
        if (!selectedSaleIds.includes(s.id)) return false;
      } else if (printOptions.dataScope === 'lunas_only') {
        if (s.paymentStatus !== 'Lunas') return false;
      } else if (printOptions.dataScope === 'belum_lunas_only') {
        if (s.paymentStatus === 'Lunas') return false;
      }

      // 2. Client filter
      if (printOptions.selectedClient && printOptions.selectedClient !== 'all') {
        if (s.clientName !== printOptions.selectedClient) return false;
      }

      // 3. Item filter
      if (printOptions.selectedItem && printOptions.selectedItem !== 'all') {
        if (s.itemName !== printOptions.selectedItem) return false;
      }

      return true;
    });
  }, [filteredSales, printOptions, selectedSaleIds]);

  const totalVolumeToPrint = useMemo(() => {
    return salesToPrint.reduce((sum, s) => sum + s.volume, 0);
  }, [salesToPrint]);

  const totalRevenueToPrint = useMemo(() => {
    return salesToPrint.reduce((sum, s) => sum + s.totalAmount, 0);
  }, [salesToPrint]);

  // Row selection helpers & stats
  const selectedSalesList = useMemo(() => {
    return sales.filter((s) => selectedSaleIds.includes(s.id));
  }, [sales, selectedSaleIds]);

  const selectedSalesVolume = useMemo(() => {
    return selectedSalesList.reduce((sum, s) => sum + s.volume, 0);
  }, [selectedSalesList]);

  const selectedSalesAmount = useMemo(() => {
    return selectedSalesList.reduce((sum, s) => sum + s.totalAmount, 0);
  }, [selectedSalesList]);

  const handleToggleRowSelect = (id: string) => {
    setSelectedSaleIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    if (selectedSaleIds.length === filteredSales.length && filteredSales.length > 0) {
      setSelectedSaleIds([]);
    } else {
      setSelectedSaleIds(filteredSales.map((s) => s.id));
    }
  };

  const handleConfirmBulkDelete = () => {
    if (selectedSaleIds.length === 0) return;
    if (onBulkDeleteSales) {
      onBulkDeleteSales(selectedSaleIds);
    } else {
      selectedSaleIds.forEach((id) => onDeleteSale(id));
    }
    setSelectedSaleIds([]);
    setIsBulkDeleteModalOpen(false);
  };

  const handleApplyBulkEdit = (updates: Partial<SaleTransaction>) => {
    if (selectedSaleIds.length === 0) return;
    if (onBulkUpdateSales) {
      onBulkUpdateSales(selectedSaleIds, updates);
    } else {
      selectedSaleIds.forEach((id) => {
        onUpdateSale(id, updates);
      });
    }
    setIsBulkEditModalOpen(false);
  };

  // Handle Excel Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    setIsProcessingExcel(true);
    setExcelErrors([]);
    setExcelWarnings([]);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const buffer = event.target?.result as ArrayBuffer;
        const result = parseSalesExcelFile(buffer, materials, clients);
        setExcelPreview(result.importedSales);
        setExcelErrors(result.errors);
        setExcelWarnings(result.warnings || []);
      } catch (err: any) {
        setExcelErrors([`Terjadi kesalahan membaca file: ${err?.message || 'Format tidak didukung'}`]);
      } finally {
        setIsProcessingExcel(false);
        // Reset file input so same file can be selected again if modified
        if (e.target) {
          e.target.value = '';
        }
      }
    };
    reader.onerror = () => {
      setExcelErrors(['Gagal membuka dan membaca file dari komputer/perangkat.']);
      setIsProcessingExcel(false);
      if (e.target) {
        e.target.value = '';
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleConfirmImportExcel = () => {
    if (excelPreview.length === 0) return;

    const formattedSales: Omit<SaleTransaction, 'id' | 'createdAt'>[] = excelPreview.map((item, idx) => ({
      date: item.date || getTodayDateString(),
      poNumber: item.poNumber || `PO-${getTodayDateString().replace(/-/g, '')}`,
      deliveryNoteNumber: item.deliveryNoteNumber || `SJ-${getTodayDateString().replace(/-/g, '')}-${String(idx + 1).padStart(3, '0')}`,
      clientId: item.clientId,
      clientName: item.clientName || 'Pelanggan Umum',
      itemId: item.itemId || (materials[0]?.id ?? 'mat-default'),
      itemName: item.itemName || materials[0]?.name || 'Pasir Cor',
      quarry: item.quarry || 'Quarry Mitra',
      unit: item.unit || 'm3',
      volume: item.volume || 1,
      destination: item.destination || 'Lokasi Proyek',
      price: item.price || 0,
      totalAmount: (item.volume || 1) * (item.price || 0),
      paymentStatus: item.paymentStatus || 'Lunas',
      vehiclePlate: item.vehiclePlate,
      driverName: item.driverName,
      notes: item.notes || 'Diimpor dari Excel',
    }));

    onBulkAddSales(formattedSales);
    setIsExcelModalOpen(false);
    setExcelPreview([]);
    setExcelErrors([]);
    setExcelWarnings([]);
    setLastImportedCount(formattedSales.length);
  };

  // Export to Excel
  const handleExportExcel = () => {
    const exportData = filteredSales.map((s, idx) => ({
      'No': idx + 1,
      'Tanggal': s.date,
      'Purchase Order (PO)': s.poNumber,
      'No Surat Jalan': s.deliveryNoteNumber,
      'Klien': s.clientName,
      'Nama Barang': s.itemName,
      'Volume': s.volume,
      'Satuan': s.unit,
      'Tujuan Pengiriman': s.destination,
      'Harga Jual (Rp)': s.price,
      'Total Penjualan (Rp)': s.totalAmount,
      'Status': s.paymentStatus,
      'No Polisi': s.vehiclePlate || '-',
      'Sopir': s.driverName || '-',
      'Catatan': s.notes || '-',
    }));
    exportTableToExcel(exportData, `Rekap_Penjualan_${filter.mode}`, 'Penjualan');
  };

  // Printable Sales Rekap with Dynamic Columns & Filters
  const handlePrintRekap = () => {
    const isCompact = printOptions.density === 'compact';
    const cellPadding = isCompact ? 'p-1 text-[9.5px]' : 'p-1.5 text-[10.5px]';
    const headerPadding = isCompact ? 'p-1 text-[9.5px]' : 'p-1.5 text-[10.5px]';

    const printContent = (
      <div className="p-6 bg-white text-slate-900 text-xs font-sans space-y-4">
        {/* Kop Surat Perusahaan */}
        {printOptions.showLetterhead && (
          <div className="border-b-2 border-slate-900 pb-3 flex justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              {printOptions.showLogo && companyProfile.logoUrl && (
                <img
                  src={companyProfile.logoUrl}
                  alt={companyProfile.name}
                  className="h-16 w-16 object-contain rounded border border-slate-200 p-0.5 bg-white shrink-0"
                  referrerPolicy="no-referrer"
                />
              )}
              <div>
                <h1 className="text-base font-bold tracking-tight text-slate-900">{companyProfile.name}</h1>
                <p className="text-[11px] text-slate-600 font-medium">{companyProfile.tagline}</p>
                <p className="text-[10px] text-slate-500">{companyProfile.address}</p>
                <p className="text-[10px] text-slate-500">
                  Telp: {companyProfile.phone} | Email: {companyProfile.email}
                </p>
              </div>
            </div>

            <div className="text-right shrink-0">
              <h2 className="text-sm font-bold uppercase text-slate-900 tracking-wide">
                REKAP LAPORAN PENJUALAN MATERIAL
              </h2>
              <p className="text-[11px] font-semibold text-slate-700">
                Periode: {filter.mode === 'harian' ? formatDateIndo(filter.date) : filter.mode === 'bulanan' ? filter.month : `${filter.startDate} s/d ${filter.endDate}`}
              </p>
              <p className="text-[10px] text-slate-500">
                Dicetak: {formatDateIndo(getTodayDateString())}
              </p>
              {printOptions.dataScope !== 'all' && (
                <span className="inline-block mt-0.5 text-[9px] px-1.5 py-0.2 bg-blue-50 text-blue-800 border border-blue-200 rounded font-semibold">
                  Filter: {printOptions.dataScope === 'selected_only' ? 'Baris Pilihan' : printOptions.dataScope === 'lunas_only' ? 'Status Lunas' : 'Belum Lunas'}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Summary Stats */}
        {printOptions.showSummaryStats && (
          <div className="grid grid-cols-3 gap-2 bg-slate-100 p-2.5 rounded border border-slate-300">
            <div>
              <span className="text-[10px] text-slate-600 block">Total Transaksi Dicetak:</span>
              <span className="font-bold text-slate-900">{salesToPrint.length} Pengiriman</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-600 block">Total Volume:</span>
              <span className="font-bold text-slate-900">{formatNumber(totalVolumeToPrint)} Satuan</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-600 block">Total Nilai Penjualan:</span>
              <span className="font-bold text-emerald-800 text-sm">{formatRupiah(totalRevenueToPrint)}</span>
            </div>
          </div>
        )}

        {/* Table */}
        <table className="w-full text-left border-collapse border border-slate-300">
          <thead>
            <tr className="bg-slate-200 text-slate-800 font-bold border-b border-slate-300">
              {printOptions.showNo && <th className={`${headerPadding} border border-slate-300 text-center w-8`}>No</th>}
              {printOptions.showDate && <th className={`${headerPadding} border border-slate-300 whitespace-nowrap`}>Tgl</th>}
              {printOptions.showPONumber && <th className={`${headerPadding} border border-slate-300`}>No. PO</th>}
              {printOptions.showDeliveryNote && <th className={`${headerPadding} border border-slate-300`}>No. Surat Jalan</th>}
              {printOptions.showClient && <th className={`${headerPadding} border border-slate-300`}>Klien</th>}
              {printOptions.showItemName && <th className={`${headerPadding} border border-slate-300`}>Nama Barang</th>}
              {printOptions.showQuarry && <th className={`${headerPadding} border border-slate-300`}>Quarry Asal</th>}
              {printOptions.showVolume && <th className={`${headerPadding} border border-slate-300 text-right`}>Volume</th>}
              {printOptions.showDestination && <th className={`${headerPadding} border border-slate-300`}>Tujuan</th>}
              {printOptions.showPrice && <th className={`${headerPadding} border border-slate-300 text-right`}>Harga Jual</th>}
              {printOptions.showTotalAmount && <th className={`${headerPadding} border border-slate-300 text-right`}>Total (Rp)</th>}
              {printOptions.showPaymentStatus && <th className={`${headerPadding} border border-slate-300 text-center`}>Status</th>}
              {printOptions.showVehiclePlate && <th className={`${headerPadding} border border-slate-300`}>No Polisi</th>}
              {printOptions.showDriverName && <th className={`${headerPadding} border border-slate-300`}>Sopir</th>}
              {printOptions.showNotes && <th className={`${headerPadding} border border-slate-300`}>Catatan</th>}
            </tr>
          </thead>
          <tbody>
            {salesToPrint.length === 0 ? (
              <tr>
                <td colSpan={15} className="p-4 text-center text-slate-400">
                  Tidak ada data yang sesuai dengan opsi cetak yang dipilih.
                </td>
              </tr>
            ) : (
              salesToPrint.map((s, idx) => (
                <tr key={s.id} className="border-b border-slate-300">
                  {printOptions.showNo && (
                    <td className={`${cellPadding} border border-slate-300 text-center`}>{idx + 1}</td>
                  )}
                  {printOptions.showDate && (
                    <td className={`${cellPadding} border border-slate-300 whitespace-nowrap`}>{s.date}</td>
                  )}
                  {printOptions.showPONumber && (
                    <td className={`${cellPadding} border border-slate-300 font-semibold`}>{s.poNumber}</td>
                  )}
                  {printOptions.showDeliveryNote && (
                    <td className={`${cellPadding} border border-slate-300 font-mono`}>{s.deliveryNoteNumber}</td>
                  )}
                  {printOptions.showClient && (
                    <td className={`${cellPadding} border border-slate-300`}>{s.clientName}</td>
                  )}
                  {printOptions.showItemName && (
                    <td className={`${cellPadding} border border-slate-300 font-medium`}>{s.itemName}</td>
                  )}
                  {printOptions.showQuarry && (
                    <td className={`${cellPadding} border border-slate-300 text-slate-600`}>{s.quarry}</td>
                  )}
                  {printOptions.showVolume && (
                    <td className={`${cellPadding} border border-slate-300 text-right font-mono font-bold whitespace-nowrap`}>
                      {formatNumber(s.volume)} {s.unit}
                    </td>
                  )}
                  {printOptions.showDestination && (
                    <td className={`${cellPadding} border border-slate-300`}>{s.destination}</td>
                  )}
                  {printOptions.showPrice && (
                    <td className={`${cellPadding} border border-slate-300 text-right font-mono whitespace-nowrap`}>
                      {formatRupiah(s.price)}
                    </td>
                  )}
                  {printOptions.showTotalAmount && (
                    <td className={`${cellPadding} border border-slate-300 text-right font-mono font-bold whitespace-nowrap`}>
                      {formatRupiah(s.totalAmount)}
                    </td>
                  )}
                  {printOptions.showPaymentStatus && (
                    <td className={`${cellPadding} border border-slate-300 text-center font-semibold`}>
                      {s.paymentStatus}
                    </td>
                  )}
                  {printOptions.showVehiclePlate && (
                    <td className={`${cellPadding} border border-slate-300 font-mono text-slate-700`}>
                      {s.vehiclePlate || '-'}
                    </td>
                  )}
                  {printOptions.showDriverName && (
                    <td className={`${cellPadding} border border-slate-300 text-slate-700`}>
                      {s.driverName || '-'}
                    </td>
                  )}
                  {printOptions.showNotes && (
                    <td className={`${cellPadding} border border-slate-300 text-slate-500 italic`}>
                      {s.notes || '-'}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
          <tfoot>
            <tr className="bg-slate-100 font-bold border-t-2 border-slate-400">
              <td
                colSpan={
                  (printOptions.showNo ? 1 : 0) +
                  (printOptions.showDate ? 1 : 0) +
                  (printOptions.showPONumber ? 1 : 0) +
                  (printOptions.showDeliveryNote ? 1 : 0) +
                  (printOptions.showClient ? 1 : 0) +
                  (printOptions.showItemName ? 1 : 0) +
                  (printOptions.showQuarry ? 1 : 0)
                }
                className="p-2 border border-slate-300 text-right"
              >
                TOTAL ({salesToPrint.length} DATA):
              </td>
              {printOptions.showVolume && (
                <td className="p-2 border border-slate-300 text-right font-mono">
                  {formatNumber(totalVolumeToPrint)}
                </td>
              )}
              {printOptions.showDestination && <td className="p-2 border border-slate-300"></td>}
              {printOptions.showPrice && <td className="p-2 border border-slate-300"></td>}
              {printOptions.showTotalAmount && (
                <td className="p-2 border border-slate-300 text-right font-mono text-emerald-800 text-xs">
                  {formatRupiah(totalRevenueToPrint)}
                </td>
              )}
              {printOptions.showPaymentStatus && <td className="p-2 border border-slate-300"></td>}
              {printOptions.showVehiclePlate && <td className="p-2 border border-slate-300"></td>}
              {printOptions.showDriverName && <td className="p-2 border border-slate-300"></td>}
              {printOptions.showNotes && <td className="p-2 border border-slate-300"></td>}
            </tr>
          </tfoot>
        </table>

        {/* Custom Notes */}
        {printOptions.customNotes && (
          <div className="text-[10px] text-slate-600 bg-slate-50 p-2 rounded border border-slate-200 italic">
            {printOptions.customNotes}
          </div>
        )}

        {/* Tanda Tangan */}
        {printOptions.showSignatures && (
          <div className="grid grid-cols-2 pt-4 text-center text-xs">
            <div>
              <p className="text-slate-600 font-medium">
                {printOptions.signatureTitle1 || 'Dibuat Oleh (Admin Logistik):'}
              </p>
              <div className="h-14"></div>
              <p className="font-bold underline text-slate-900">
                {companyProfile.signatoryName || companyProfile.director}
              </p>
              <p className="text-[10px] text-slate-500">{companyProfile.signatoryRole || 'Direktur / Pimpinan'}</p>
            </div>
            <div>
              <p className="text-slate-600 font-medium">
                {printOptions.signatureTitle2 || 'Disetujui Oleh (Keuangan):'}
              </p>
              <div className="h-14"></div>
              <p className="font-bold underline text-slate-900">Bagian Finance & Accounting</p>
              <p className="text-[10px] text-slate-500">Divisi Keuangan Proyek</p>
            </div>
          </div>
        )}
      </div>
    );

    onOpenPrintModal('Rekap Laporan Penjualan Material', printContent);
  };

  return (
    <div className="space-y-3">
      {/* Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2 bg-white p-3 rounded border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-tight">
              Transaksi Penjualan Material
            </h2>
          </div>
          <p className="text-[11px] text-slate-500">
            Form data PO, Surat Jalan, harga otomatis dari Master Barang, filter periode, Excel & PDF
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {canUndo && onUndo && (
            <button
              id="btn-undo-sales-action"
              onClick={() => {
                onUndo();
                setLastImportedCount(0);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs rounded border border-amber-300 transition shadow-2xs cursor-pointer"
              title={lastActionDescription ? `Undo: ${lastActionDescription} (Ctrl+Z)` : 'Undo Aksi Terakhir (Ctrl+Z)'}
            >
              <Undo2 className="w-3.5 h-3.5 text-amber-700" />
              <span>Undo</span>
            </button>
          )}

          <button
            id="btn-add-sale"
            onClick={openAddModal}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded transition shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Catat Penjualan</span>
          </button>

          <button
            id="btn-import-excel"
            onClick={() => setIsExcelModalOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded transition shadow-2xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Input dari Excel</span>
          </button>

          <button
            id="btn-options-sales-print"
            type="button"
            onClick={() => setIsPrintOptionsModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 font-semibold text-xs rounded border border-blue-300 transition shadow-2xs"
            title="Kustomisasi Kolom & Opsi Rekap PDF"
          >
            <Sliders className="w-3.5 h-3.5 text-blue-600" />
            <span>Opsi Cetak PDF</span>
            {printOptions.dataScope !== 'all' && (
              <span className="w-2 h-2 rounded-full bg-blue-600 inline-block"></span>
            )}
          </button>

          <button
            id="btn-print-sales-pdf"
            onClick={handlePrintRekap}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs rounded transition shadow-2xs"
            title="Pratinjau & Cetak Rekap PDF"
          >
            <Printer className="w-3.5 h-3.5 text-blue-400" />
            <span>Cetak PDF</span>
          </button>

          <button
            id="btn-export-sales-excel"
            onClick={handleExportExcel}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded border border-slate-300 transition"
            title="Download Excel"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>Excel</span>
          </button>
        </div>
      </div>

      {/* Undo Alert Banner for Excel Import */}
      {lastImportedCount > 0 && (
        <div className="bg-emerald-50 border border-emerald-300 rounded p-2.5 flex items-center justify-between text-xs text-emerald-950 shadow-2xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Berhasil mengimpor <strong>{lastImportedCount}</strong> data transaksi penjualan dari Excel beserta sinkronisasi data Pembelian Quarry.
            </span>
          </div>
          {onUndo && (
            <button
              onClick={() => {
                onUndo();
                setLastImportedCount(0);
              }}
              className="flex items-center gap-1 text-xs bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-300 px-3 py-1 rounded font-bold transition-colors shrink-0 shadow-2xs"
            >
              <Undo2 className="w-3.5 h-3.5 text-emerald-700" />
              <span>Batalkan Impor Ini (Undo)</span>
            </button>
          )}
        </div>
      )}

      {/* Date Filter Bar */}
      <DateFilterBar
        filter={filter}
        onChange={onFilterChange}
        title="Filter Periode Penjualan"
      />

      {/* 4 High-Density Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        <div className="bg-white border border-slate-200 p-2.5 rounded shadow-2xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total Pengiriman</span>
          <div className="text-base font-bold text-slate-900 font-mono mt-0.5">
            {filteredSales.length}{' '}
            <span className="text-[10px] font-sans font-normal text-slate-500">Surat Jalan</span>
          </div>
          <div className="text-[10px] text-slate-400">Periode terpilih</div>
        </div>

        <div className="bg-white border border-slate-200 p-2.5 rounded shadow-2xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total Volume Terjual</span>
          <div className="text-base font-bold text-blue-700 font-mono mt-0.5">
            {formatNumber(totalVolumeFiltered)}{' '}
            <span className="text-[10px] font-sans font-normal text-slate-500">m³ / Satuan</span>
          </div>
          <div className="text-[10px] text-slate-400">Total muatan armada</div>
        </div>

        <div className="bg-white border border-slate-200 p-2.5 rounded shadow-2xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total Nilai Penjualan</span>
          <div className="text-base font-bold text-emerald-700 font-mono mt-0.5">
            {formatRupiah(totalRevenueFiltered)}
          </div>
          <div className="text-[10px] text-slate-400">Omzet terakumulasi</div>
        </div>

        <div className="bg-white border border-slate-200 p-2.5 rounded shadow-2xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Rata-rata / Pengiriman</span>
          <div className="text-base font-bold text-slate-800 font-mono mt-0.5">
            {filteredSales.length > 0
              ? formatRupiah(totalRevenueFiltered / filteredSales.length)
              : 'Rp 0'}
          </div>
          <div className="text-[10px] text-slate-400">Nilai rata-rata per DO</div>
        </div>
      </div>

      {/* Bulk Action Bar when rows are selected */}
      {selectedSaleIds.length > 0 && (
        <div className="bg-rose-50 border border-rose-300 rounded p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs">
          <div className="flex items-center gap-2">
            <div className="p-1 bg-rose-600 rounded text-white shrink-0">
              <Trash2 className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="text-xs font-bold text-rose-950">
                {selectedSaleIds.length} data transaksi penjualan dipilih
              </span>
              <span className="text-[11px] text-rose-700 ml-2">
                (Total Volume: <strong>{formatNumber(selectedSalesVolume)}</strong> | Total Nilai:{' '}
                <strong>{formatRupiah(selectedSalesAmount)}</strong>)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setSelectedSaleIds([])}
              className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded border border-slate-300 transition"
            >
              Batalkan Pilihan
            </button>
            <button
              type="button"
              id="btn-bulk-edit-sales"
              onClick={() => setIsBulkEditModalOpen(true)}
              className="flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded transition shadow-2xs"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Masal ({selectedSaleIds.length})</span>
            </button>
            <button
              type="button"
              id="btn-bulk-delete-sales"
              onClick={() => setIsBulkDeleteModalOpen(true)}
              className="flex items-center gap-1 px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded transition shadow-2xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus ({selectedSaleIds.length})</span>
            </button>
          </div>
        </div>
      )}

      {/* Sales Table */}
      <div className="bg-white border border-slate-200 rounded shadow-2xs overflow-hidden">
        {/* Search Bar & Batch Selection Status */}
        <div className="p-2 sm:p-2.5 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="relative w-full sm:w-80">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="search-sales"
              type="text"
              placeholder="Cari PO, No SJ, Klien, Barang, Sopir, Plat..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1 bg-white text-slate-800 text-xs border border-slate-300 rounded focus:outline-none focus:border-blue-600"
            />
          </div>

          <div className="flex items-center gap-3 text-[11px] text-slate-500">
            {selectedSaleIds.length > 0 && (
              <span className="font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                {selectedSaleIds.length} data terpilih
              </span>
            )}
            <div>
              Ditemukan: <span className="font-bold text-slate-800 font-mono">{filteredSales.length}</span> transaksi
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="px-2 py-2 text-center w-8">
                  <button
                    type="button"
                    onClick={handleToggleSelectAll}
                    className="text-slate-500 hover:text-blue-600 focus:outline-none"
                    title={selectedSaleIds.length === filteredSales.length && filteredSales.length > 0 ? 'Batalkan Semua' : 'Pilih Semua'}
                  >
                    {filteredSales.length > 0 && selectedSaleIds.length === filteredSales.length ? (
                      <CheckSquare className="w-3.5 h-3.5 text-blue-600" />
                    ) : selectedSaleIds.length > 0 ? (
                      <CheckSquare className="w-3.5 h-3.5 text-blue-400" />
                    ) : (
                      <Square className="w-3.5 h-3.5 text-slate-400" />
                    )}
                  </button>
                </th>
                <th className="px-3 py-2">Tanggal</th>
                <th className="px-3 py-2">Purchase Order (PO)</th>
                <th className="px-3 py-2">No Surat Jalan</th>
                <th className="px-3 py-2">Klien</th>
                <th className="px-3 py-2">Nama Barang</th>
                <th className="px-3 py-2 text-right">Volume</th>
                <th className="px-3 py-2">Tujuan Pengiriman</th>
                <th className="px-3 py-2 text-right">Harga Jual</th>
                <th className="px-3 py-2 text-right">Total (Rp)</th>
                <th className="px-3 py-2 text-center">Status</th>
                <th className="px-3 py-2 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={12} className="px-3 py-8 text-center text-slate-400">
                    <div className="max-w-xs mx-auto space-y-1">
                      <TrendingUp className="w-6 h-6 text-slate-300 mx-auto" />
                      <p className="font-semibold text-slate-600">Tidak ada transaksi penjualan pada periode ini.</p>
                      <p className="text-[10px] text-slate-400">
                        Ubah filter tanggal atau klik "+ Catat Penjualan" / "Input dari Excel".
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredSales.map((s) => {
                  const isSelected = selectedSaleIds.includes(s.id);
                  return (
                    <tr
                      key={s.id}
                      className={`hover:bg-blue-50/50 transition-colors ${
                        isSelected ? 'bg-blue-50/30' : ''
                      }`}
                    >
                      <td className="px-2 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleRowSelect(s.id)}
                          className="text-slate-400 hover:text-blue-600 focus:outline-none"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-3.5 h-3.5 text-blue-600" />
                          ) : (
                            <Square className="w-3.5 h-3.5 text-slate-300" />
                          )}
                        </button>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-slate-600 font-mono text-[11px]">
                        {s.date}
                      </td>
                      <td className="px-3 py-2 font-semibold text-blue-700 whitespace-nowrap">
                        {s.poNumber}
                      </td>
                      <td className="px-3 py-2 font-mono text-slate-900 whitespace-nowrap">
                        <div className="flex items-center gap-1 font-semibold">
                          <FileText className="w-3 h-3 text-slate-400" />
                          <span>{s.deliveryNoteNumber}</span>
                        </div>
                        {s.vehiclePlate && (
                          <div className="text-[9px] text-slate-500 font-sans">
                            {s.vehiclePlate} ({s.driverName || 'Sopir'})
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2 font-medium text-slate-800">
                        {s.clientName}
                      </td>
                      <td className="px-3 py-2">
                        <div className="font-semibold text-slate-900">{s.itemName}</div>
                        <div className="text-[10px] text-slate-500">Quarry: {s.quarry}</div>
                      </td>
                      <td className="px-3 py-2 text-right whitespace-nowrap font-mono font-bold text-slate-900">
                        {formatNumber(s.volume)} {s.unit}
                      </td>
                      <td className="px-3 py-2 max-w-xs">
                        <div className="flex items-start gap-1 text-slate-600 truncate">
                          <MapPin className="w-3 h-3 text-slate-400 mt-0.5 flex-shrink-0" />
                          <span className="truncate">{s.destination}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-slate-600 whitespace-nowrap">
                        {formatRupiah(s.price)}
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-emerald-700 whitespace-nowrap">
                        {formatRupiah(s.totalAmount)}
                      </td>
                      <td className="px-3 py-2 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            s.paymentStatus === 'Lunas'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {s.paymentStatus}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            id={`edit-sale-${s.id}`}
                            onClick={() => openEditModal(s)}
                            className="p-1 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded transition"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            id={`delete-sale-${s.id}`}
                            onClick={() => {
                              if (confirm(`Hapus data penjualan Surat Jalan "${s.deliveryNoteNumber}"?`)) {
                                onDeleteSale(s.id);
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                            title="Hapus"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add / Edit Sale */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-lg max-w-2xl w-full p-4 shadow-xl text-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="flex items-center gap-1.5 font-bold text-slate-800 text-sm">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <span>{editingSale ? 'Edit Data Penjualan' : 'Catat Penjualan Material Baru'}</span>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitSale} className="space-y-3">
              {/* Row 1: Tanggal, PO, No Surat Jalan */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1 text-[11px]">Tanggal Pengiriman *</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white text-slate-900 border border-slate-300 rounded focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1 text-[11px]">Purchase Order (PO) *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: PO-WIKA-2026/08/012"
                    value={formData.poNumber}
                    onChange={(e) => setFormData({ ...formData, poNumber: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white text-blue-700 font-bold border border-slate-300 rounded focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1 text-[11px]">No. Surat Jalan (SJ) *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: SJ-20260815-001"
                    value={formData.deliveryNoteNumber}
                    onChange={(e) => setFormData({ ...formData, deliveryNoteNumber: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white text-slate-900 font-mono font-bold border border-slate-300 rounded focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              {/* Row 2: Klien */}
              <div>
                <label className="block text-slate-600 font-semibold mb-1 text-[11px]">Pilih Klien / Pelanggan *</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <select
                    value={formData.clientId}
                    onChange={(e) => handleClientSelect(e.target.value)}
                    className="px-2.5 py-1.5 bg-white text-slate-900 border border-slate-300 rounded focus:outline-none focus:border-blue-600"
                  >
                    <option value="">-- Pilih dari Master Klien --</option>
                    {clients
                      .filter((c) => c.type === 'klien')
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                  <input
                    type="text"
                    required
                    placeholder="Atau ketik nama klien..."
                    value={formData.clientName}
                    onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                    className="px-2.5 py-1.5 bg-white text-slate-900 border border-slate-300 rounded focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              {/* Row 3: Nama Barang (Terintegrasi dengan Master Barang) */}
              <div className="p-2.5 bg-slate-50 rounded border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-blue-700 font-bold text-[11px] flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-blue-600" />
                    Pilih Barang (Terintegrasi dengan Daftar Barang) *
                  </label>
                  <span className="text-[10px] text-slate-500 font-medium">
                    Harga otomatis terisi dari Master
                  </span>
                </div>

                <select
                  required
                  value={formData.itemId}
                  onChange={(e) => handleItemSelect(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white text-slate-900 font-medium border border-slate-300 rounded focus:outline-none focus:border-blue-600"
                >
                  <option value="">-- Pilih Material dari Daftar Barang --</option>
                  {materials.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.quarry}) - Jual: {formatRupiah(m.sellingPrice)}/{m.unit}
                    </option>
                  ))}
                </select>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-slate-600 text-[10px] mb-0.5">Volume (Qty) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.1"
                      required
                      value={formData.volume}
                      onChange={(e) =>
                        setFormData({ ...formData, volume: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full px-2.5 py-1.5 bg-white text-slate-900 font-mono font-bold border border-slate-300 rounded focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 text-[10px] mb-0.5">Satuan Unit</label>
                    <input
                      type="text"
                      disabled
                      value={formData.unit}
                      className="w-full px-2.5 py-1.5 bg-slate-100 text-slate-700 font-mono border border-slate-200 rounded font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 text-[10px] mb-0.5">
                      Harga Jual / Unit (Rp) *
                    </label>
                    <input
                      type="number"
                      step="1000"
                      min="0"
                      required
                      value={formData.price}
                      onChange={(e) =>
                        setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full px-2.5 py-1.5 bg-white text-emerald-700 font-mono font-bold border border-slate-300 rounded focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-2 bg-white rounded border border-slate-200 text-xs">
                  <span className="text-slate-600 font-medium text-[11px]">Total Nilai Penjualan:</span>
                  <span className="text-sm font-bold text-emerald-700 font-mono">
                    {formatRupiah(formData.volume * formData.price)}
                  </span>
                </div>
              </div>

              {/* Row 4: Tujuan Pengiriman & Status Pembayaran */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-600 font-semibold text-[11px]">Tujuan Pengiriman *</label>
                    <span className="text-[10px] text-blue-600 font-normal">Otomatis dari Master Barang</span>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Proyek Tol JORR 2 Seksi 4"
                    value={formData.destination}
                    onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white text-slate-900 border border-slate-300 rounded focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1 text-[11px]">Status Pembayaran</label>
                  <select
                    value={formData.paymentStatus}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        paymentStatus: e.target.value as 'Lunas' | 'Belum Lunas',
                      })
                    }
                    className="w-full px-2.5 py-1.5 bg-white text-slate-900 border border-slate-300 rounded focus:outline-none focus:border-blue-600"
                  >
                    <option value="Lunas">Lunas (Masuk Kas / Bank)</option>
                    <option value="Belum Lunas">Belum Lunas (Masuk Piutang Usaha)</option>
                  </select>
                </div>
              </div>

              {/* Row 5: Armada & Driver */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1 text-[11px]">No. Polisi Armada</label>
                  <input
                    type="text"
                    placeholder="Contoh: B 9182 UY"
                    value={formData.vehiclePlate}
                    onChange={(e) => setFormData({ ...formData, vehiclePlate: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white text-slate-900 border border-slate-300 rounded focus:outline-none focus:border-blue-600 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1 text-[11px]">Nama Sopir</label>
                  <input
                    type="text"
                    placeholder="Contoh: Suparman"
                    value={formData.driverName}
                    onChange={(e) => setFormData({ ...formData, driverName: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white text-slate-900 border border-slate-300 rounded focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              {/* Info Integration Notification */}
              <div className="flex items-start gap-1.5 p-2 bg-blue-50 border border-blue-200 rounded text-blue-800 text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-blue-600" />
                <span>
                  Sistem otomatis membuat catatan <strong>Pembelian Quarry</strong> (HPP) dan jurnal akuntansi terintegrasi berdasarkan transaksi ini.
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded transition shadow-2xs"
                >
                  {editingSale ? 'Simpan Perubahan' : 'Simpan & Sinkronkan Pembelian'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Import Excel */}
      {isExcelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-lg max-w-3xl w-full p-4 shadow-xl text-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="flex items-center gap-1.5 font-bold text-slate-800 text-sm">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Input Data Penjualan dari File Excel (.xlsx / .csv)</span>
              </div>
              <button
                onClick={() => {
                  setIsExcelModalOpen(false);
                  setExcelPreview([]);
                  setExcelErrors([]);
                }}
                className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Instruction & Template Download */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-2.5 bg-slate-50 rounded border border-slate-200 text-xs">
              <div>
                <p className="text-slate-800 font-semibold">Format template data penjualan:</p>
                <p className="text-[10px] text-slate-500">
                  Kolom: Tanggal, Purchase Order, No Surat Jalan, Nama Barang, Volume, Harga Jual
                </p>
              </div>
              <button
                onClick={downloadSalesExcelTemplate}
                className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold whitespace-nowrap shadow-2xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh Template Excel</span>
              </button>
            </div>

            {/* Upload Area */}
            <div
              onClick={() => !isProcessingExcel && fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-5 text-center cursor-pointer transition space-y-1.5 ${
                isProcessingExcel
                  ? 'border-blue-400 bg-blue-50/50 cursor-wait'
                  : 'border-slate-300 hover:border-blue-500 bg-slate-50 hover:bg-white'
              }`}
            >
              {isProcessingExcel ? (
                <div className="flex flex-col items-center justify-center space-y-1">
                  <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-xs font-bold text-blue-700">Membaca & Memvalidasi File Excel...</p>
                </div>
              ) : (
                <>
                  <Upload className="w-6 h-6 text-slate-400 mx-auto" />
                  <p className="text-xs font-semibold text-slate-800">
                    Klik untuk memilih file Excel (.xlsx, .xls, .csv)
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Data kolom Tanggal, PO, Surat Jalan, Barang, Volume, dan Harga akan dideteksi otomatis
                  </p>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {/* Errors if any */}
            {excelErrors.length > 0 && (
              <div className="p-2.5 bg-red-50 border border-red-200 rounded text-red-800 text-xs space-y-1">
                <div className="font-semibold flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                  <span>Ditemukan kesalahan pada file Excel:</span>
                </div>
                <ul className="list-disc list-inside text-[11px] text-red-700 max-h-24 overflow-y-auto">
                  {excelErrors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Warnings if any */}
            {excelWarnings.length > 0 && (
              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded text-amber-900 text-xs space-y-1">
                <div className="font-semibold flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Catatan penyesuaian otomatis ({excelWarnings.length}):</span>
                </div>
                <ul className="list-disc list-inside text-[10px] text-amber-800 max-h-20 overflow-y-auto">
                  {excelWarnings.slice(0, 5).map((warn, i) => (
                    <li key={i}>{warn}</li>
                  ))}
                  {excelWarnings.length > 5 && (
                    <li className="list-none font-semibold">... dan {excelWarnings.length - 5} baris lainnya disesuaikan otomatis</li>
                  )}
                </ul>
              </div>
            )}

            {/* Preview Table */}
            {excelPreview.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">
                    Preview Data ({excelPreview.length} Baris):
                  </span>
                  <span className="text-emerald-700 font-mono font-bold">
                    Total: {formatRupiah(excelPreview.reduce((sum, r) => sum + (r.totalAmount || 0), 0))}
                  </span>
                </div>

                <div className="max-h-48 overflow-y-auto border border-slate-200 rounded">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-slate-50 text-slate-600 uppercase font-bold sticky top-0 border-b border-slate-200">
                      <tr>
                        <th className="p-1.5">Tgl</th>
                        <th className="p-1.5">PO</th>
                        <th className="p-1.5">No SJ</th>
                        <th className="p-1.5">Klien</th>
                        <th className="p-1.5">Nama Barang</th>
                        <th className="p-1.5 text-right">Volume</th>
                        <th className="p-1.5 text-right">Harga</th>
                        <th className="p-1.5 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {excelPreview.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-1.5 whitespace-nowrap text-slate-600 font-mono">{item.date}</td>
                          <td className="p-1.5 font-semibold text-blue-700">{item.poNumber}</td>
                          <td className="p-1.5 font-mono">{item.deliveryNoteNumber}</td>
                          <td className="p-1.5 text-slate-800">{item.clientName}</td>
                          <td className="p-1.5">{item.itemName}</td>
                          <td className="p-1.5 text-right font-mono font-bold">
                            {item.volume} {item.unit}
                          </td>
                          <td className="p-1.5 text-right font-mono">{formatRupiah(item.price)}</td>
                          <td className="p-1.5 text-right font-mono text-emerald-700 font-bold">
                            {formatRupiah(item.totalAmount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => {
                  setIsExcelModalOpen(false);
                  setExcelPreview([]);
                  setExcelErrors([]);
                }}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition font-medium"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={excelPreview.length === 0}
                onClick={handleConfirmImportExcel}
                className={`px-3.5 py-1.5 font-bold rounded transition flex items-center gap-1 ${
                  excelPreview.length > 0
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Impor {excelPreview.length} Data Sekarang</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {isBulkDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-2xs">
          <div className="bg-white rounded-lg shadow-xl border border-slate-300 max-w-md w-full overflow-hidden">
            <div className="bg-rose-600 text-white px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trash2 className="w-4 h-4" />
                <h3 className="text-xs font-bold uppercase tracking-wider">
                  Konfirmasi Hapus Data Terpilih
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsBulkDeleteModalOpen(false)}
                className="text-rose-100 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3 text-xs text-slate-700">
              <p className="font-semibold text-slate-900 text-sm">
                Apakah Anda yakin ingin menghapus {selectedSaleIds.length} data transaksi penjualan yang dipilih?
              </p>

              <div className="bg-slate-50 border border-slate-200 rounded p-2.5 space-y-1.5 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Jumlah Transaksi:</span>
                  <strong className="text-slate-900 font-bold">{selectedSaleIds.length} Surat Jalan</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Total Volume:</span>
                  <strong className="text-blue-900 font-bold">{formatNumber(selectedSalesVolume)} m³/satuan</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Total Nilai Penjualan:</span>
                  <strong className="text-emerald-900 font-bold">{formatRupiah(selectedSalesAmount)}</strong>
                </div>
              </div>

              <div className="p-2 bg-amber-50 border border-amber-200 rounded text-[11px] text-amber-900 space-y-1">
                <p className="font-bold flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
                  <span>Sinkronisasi Otomatis:</span>
                </p>
                <p>
                  Data pembelian quarry yang terhubung otomatis dengan surat jalan penjualan ini juga akan dibersihkan. Anda dapat membatalkan aksi ini kapan saja dengan tombol <strong>Undo (Ctrl+Z)</strong>.
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setIsBulkDeleteModalOpen(false)}
                className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 font-semibold rounded hover:bg-slate-100 transition"
              >
                Batal
              </button>
              <button
                type="button"
                id="btn-confirm-bulk-delete-sales"
                onClick={handleConfirmBulkDelete}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded shadow-2xs flex items-center gap-1.5 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Ya, Hapus {selectedSaleIds.length} Data</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Edit Sales Modal */}
      <BulkEditSalesModal
        isOpen={isBulkEditModalOpen}
        onClose={() => setIsBulkEditModalOpen(false)}
        selectedCount={selectedSaleIds.length}
        totalVolume={selectedSalesVolume}
        totalAmount={selectedSalesAmount}
        clients={clients}
        materials={materials}
        onApplyBulkEdit={handleApplyBulkEdit}
      />

      {/* Sales Print Options Modal */}
      <SalesPrintOptionsModal
        isOpen={isPrintOptionsModalOpen}
        onClose={() => setIsPrintOptionsModalOpen(false)}
        options={printOptions}
        onChangeOptions={setPrintOptions}
        onConfirmPrint={handlePrintRekap}
        clients={clients}
        materials={materials}
        totalAvailableCount={filteredSales.length}
        selectedRowsCount={selectedSaleIds.length}
        previewCount={salesToPrint.length}
      />
    </div>
  );
};
