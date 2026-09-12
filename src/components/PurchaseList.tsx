import React, { useState, useMemo } from 'react';
import {
  ShoppingCart,
  Plus,
  Search,
  Printer,
  Download,
  Trash2,
  Edit2,
  Edit3,
  FileText,
  Truck,
  CheckCircle2,
  Layers,
  MapPin,
  X,
  Sparkles,
  Link,
  Sliders,
  CheckSquare,
  Square,
  AlertCircle,
  Undo2,
} from 'lucide-react';
import {
  ClientSupplier,
  CompanyProfile,
  DateFilterState,
  MaterialItem,
  PurchaseTransaction,
  PurchasePrintOptions,
} from '../types';
import {
  formatDateIndo,
  formatNumber,
  formatRupiah,
  getTodayDateString,
  matchDateFilter,
  compareDateDescending,
} from '../utils/formatters';
import { DateFilterBar } from './DateFilterBar';
import { exportTableToExcel } from '../utils/excelHelper';
import {
  PurchasePrintOptionsModal,
  DEFAULT_PURCHASE_PRINT_OPTIONS,
} from './PurchasePrintOptionsModal';
import { BulkEditPurchasesModal } from './BulkEditPurchasesModal';

interface PurchaseListProps {
  purchases: PurchaseTransaction[];
  materials: MaterialItem[];
  suppliers: ClientSupplier[];
  companyProfile: CompanyProfile;
  filter: DateFilterState;
  onFilterChange: (filter: DateFilterState) => void;
  onAddPurchase: (purchase: Omit<PurchaseTransaction, 'id' | 'createdAt'>) => void;
  onUpdatePurchase: (id: string, purchase: Partial<PurchaseTransaction>) => void;
  onDeletePurchase: (id: string) => void;
  onBulkDeletePurchases?: (ids: string[]) => void;
  onBulkUpdatePurchases?: (ids: string[], updates: Partial<PurchaseTransaction>) => void;
  onOpenPrintModal: (title: string, content: React.ReactNode) => void;
  onUndo?: () => void;
  canUndo?: boolean;
  lastActionDescription?: string;
}

export const PurchaseList: React.FC<PurchaseListProps> = ({
  purchases,
  materials,
  suppliers,
  companyProfile,
  filter,
  onFilterChange,
  onAddPurchase,
  onUpdatePurchase,
  onDeletePurchase,
  onBulkDeletePurchases,
  onBulkUpdatePurchases,
  onOpenPrintModal,
  onUndo,
  canUndo,
  lastActionDescription,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<PurchaseTransaction | null>(null);

  // Row Selection & Print Customization State
  const [selectedPurchaseIds, setSelectedPurchaseIds] = useState<string[]>([]);
  const [printOptions, setPrintOptions] = useState<PurchasePrintOptions>(DEFAULT_PURCHASE_PRINT_OPTIONS);
  const [isPrintOptionsModalOpen, setIsPrintOptionsModalOpen] = useState(false);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    date: getTodayDateString(),
    deliveryNoteNumber: '',
    supplierId: '',
    supplierName: '',
    itemId: '',
    itemName: '',
    quarry: '',
    unit: 'm3',
    volume: 24,
    destination: '',
    price: 0,
    paymentStatus: 'Lunas' as 'Lunas' | 'Belum Lunas',
    notes: '',
  });

  const handleItemSelect = (itemId: string) => {
    const selectedMat = materials.find((m) => m.id === itemId);
    if (selectedMat) {
      setFormData((prev) => ({
        ...prev,
        itemId: selectedMat.id,
        itemName: selectedMat.name,
        quarry: selectedMat.quarry,
        supplierName: selectedMat.quarry || prev.supplierName,
        unit: selectedMat.unit,
        destination: selectedMat.destination || prev.destination,
        price: selectedMat.purchasePrice, // diambil dari Harga Beli Daftar Barang
      }));
    }
  };

  const handleSupplierSelect = (supplierId: string) => {
    const selectedSup = suppliers.find((s) => s.id === supplierId);
    if (selectedSup) {
      setFormData((prev) => ({
        ...prev,
        supplierId: selectedSup.id,
        supplierName: selectedSup.name,
      }));
    }
  };

  const openAddModal = () => {
    setEditingPurchase(null);
    const defaultMat = materials[0];
    const defaultSup = suppliers.find((s) => s.type === 'supplier') || suppliers[0];
    const today = getTodayDateString();
    const autoSJ = `SJ-${today.replace(/-/g, '')}-${String(purchases.length + 1).padStart(3, '0')}`;

    setFormData({
      date: today,
      deliveryNoteNumber: autoSJ,
      supplierId: defaultSup?.id || '',
      supplierName: defaultSup?.name || defaultMat?.quarry || 'Quarry Mitra',
      itemId: defaultMat?.id || '',
      itemName: defaultMat?.name || '',
      quarry: defaultMat?.quarry || '',
      unit: defaultMat?.unit || 'm3',
      volume: 24,
      destination: defaultMat?.destination || 'Lokasi Proyek',
      price: defaultMat?.purchasePrice || 170000,
      paymentStatus: 'Lunas',
      notes: 'Pembelian Langsung',
    });
    setIsAddModalOpen(true);
  };

  const openEditModal = (p: PurchaseTransaction) => {
    setEditingPurchase(p);
    setFormData({
      date: p.date,
      deliveryNoteNumber: p.deliveryNoteNumber,
      supplierId: p.supplierId || '',
      supplierName: p.supplierName,
      itemId: p.itemId,
      itemName: p.itemName,
      quarry: p.quarry,
      unit: p.unit,
      volume: p.volume,
      destination: p.destination,
      price: p.price,
      paymentStatus: p.paymentStatus,
      notes: p.notes || '',
    });
    setIsAddModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.deliveryNoteNumber.trim() || !formData.itemName) {
      alert('Nomor Surat Jalan dan Nama Barang wajib diisi!');
      return;
    }
    if (formData.volume <= 0 || formData.price <= 0) {
      alert('Volume dan harga beli harus lebih besar dari 0!');
      return;
    }

    const totalAmount = formData.volume * formData.price;

    if (editingPurchase) {
      onUpdatePurchase(editingPurchase.id, {
        ...formData,
        totalAmount,
      });
    } else {
      onAddPurchase({
        ...formData,
        totalAmount,
      });
    }

    setIsAddModalOpen(false);
  };

  // Filter based on selected DateFilterState (Diurutkan dari Tanggal Terbaru ke Terlama)
  const filteredPurchases = useMemo(() => {
    const searchLower = (searchTerm || '').trim().toLowerCase();

    return (purchases || [])
      .filter((p) => {
        if (!p) return false;

        const matchesDate = matchDateFilter(p.date, filter);

        const matchesSearch =
          !searchLower ||
          (p.deliveryNoteNumber || '').toLowerCase().includes(searchLower) ||
          (p.supplierName || '').toLowerCase().includes(searchLower) ||
          (p.itemName || '').toLowerCase().includes(searchLower) ||
          (p.destination || '').toLowerCase().includes(searchLower) ||
          (p.quarry || '').toLowerCase().includes(searchLower) ||
          (p.notes || '').toLowerCase().includes(searchLower);

        return matchesDate && matchesSearch;
      })
      .sort((a, b) => {
        const dateComparison = compareDateDescending(a.date, b.date); // Terbaru ke terlama
        if (dateComparison !== 0) return dateComparison;
        return (b.deliveryNoteNumber || '').localeCompare(a.deliveryNoteNumber || '', undefined, { numeric: true });
      });
  }, [purchases, filter, searchTerm]);

  // Selection handlers & stats
  const selectedPurchasesList = useMemo(() => {
    return purchases.filter((p) => selectedPurchaseIds.includes(p.id));
  }, [purchases, selectedPurchaseIds]);

  const selectedPurchasesVolume = useMemo(() => {
    return selectedPurchasesList.reduce((sum, p) => sum + p.volume, 0);
  }, [selectedPurchasesList]);

  const selectedPurchasesAmount = useMemo(() => {
    return selectedPurchasesList.reduce((sum, p) => sum + p.totalAmount, 0);
  }, [selectedPurchasesList]);

  const handleToggleSelectAll = () => {
    if (selectedPurchaseIds.length === filteredPurchases.length && filteredPurchases.length > 0) {
      setSelectedPurchaseIds([]);
    } else {
      setSelectedPurchaseIds(filteredPurchases.map((p) => p.id));
    }
  };

  const handleToggleRowSelect = (id: string) => {
    setSelectedPurchaseIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleConfirmBulkDelete = () => {
    if (selectedPurchaseIds.length === 0) return;
    if (onBulkDeletePurchases) {
      onBulkDeletePurchases(selectedPurchaseIds);
    } else {
      selectedPurchaseIds.forEach((id) => onDeletePurchase(id));
    }
    setSelectedPurchaseIds([]);
    setIsBulkDeleteModalOpen(false);
  };

  const handleApplyBulkEdit = (updates: Partial<PurchaseTransaction>) => {
    if (selectedPurchaseIds.length === 0) return;
    if (onBulkUpdatePurchases) {
      onBulkUpdatePurchases(selectedPurchaseIds, updates);
    } else {
      selectedPurchaseIds.forEach((id) => {
        onUpdatePurchase(id, updates);
      });
    }
    setIsBulkEditModalOpen(false);
  };

  // Purchases to print filtered based on custom print options
  const purchasesToPrint = useMemo(() => {
    return filteredPurchases.filter((p) => {
      // Scope filter
      if (printOptions.dataScope === 'selected_only') {
        if (!selectedPurchaseIds.includes(p.id)) return false;
      } else if (printOptions.dataScope === 'lunas_only') {
        if (p.paymentStatus !== 'Lunas') return false;
      } else if (printOptions.dataScope === 'belum_lunas_only') {
        if (p.paymentStatus === 'Lunas') return false;
      }

      // Supplier / Quarry filter
      if (printOptions.selectedSupplier && printOptions.selectedSupplier.toLowerCase() !== 'all') {
        if (p.supplierName !== printOptions.selectedSupplier && p.quarry !== printOptions.selectedSupplier) {
          return false;
        }
      }

      // Material filter
      if (printOptions.selectedItem && printOptions.selectedItem.toLowerCase() !== 'all') {
        if (p.itemName !== printOptions.selectedItem) {
          return false;
        }
      }

      return true;
    });
  }, [filteredPurchases, printOptions, selectedPurchaseIds]);

  const totalVolumeToPrint = purchasesToPrint.reduce((sum, p) => sum + p.volume, 0);
  const totalCostToPrint = purchasesToPrint.reduce((sum, p) => sum + p.totalAmount, 0);

  const totalVolumeFiltered = filteredPurchases.reduce((sum, p) => sum + p.volume, 0);
  const totalCostFiltered = filteredPurchases.reduce((sum, p) => sum + p.totalAmount, 0);
  const autoLinkedCount = filteredPurchases.filter((p) => !!p.saleId).length;

  const handleExportExcel = () => {
    const exportData = filteredPurchases.map((p, idx) => ({
      'No': idx + 1,
      'Tanggal': p.date,
      'No Surat Jalan': p.deliveryNoteNumber,
      'Supplier / Quarry': p.supplierName,
      'Nama Barang': p.itemName,
      'Volume': p.volume,
      'Satuan': p.unit,
      'Tujuan Pengiriman': p.destination,
      'Harga Beli Satuan (Rp)': p.price,
      'Total Pembelian / HPP (Rp)': p.totalAmount,
      'Status': p.paymentStatus,
      'Sumber Entri': p.saleId ? 'Otomatis dari Penjualan' : 'Manual',
      'Catatan': p.notes || '-',
    }));
    exportTableToExcel(exportData, `Rekap_Pembelian_${filter.mode}`, 'Pembelian');
  };

  const handlePrintRekap = () => {
    const densityClass =
      printOptions.density === 'compact'
        ? 'text-[9px]'
        : 'text-[10px]';

    const cellPadding =
      printOptions.density === 'compact'
        ? 'p-1'
        : 'p-1.5';

    const printContent = (
      <div className="p-6 bg-white text-slate-900 text-xs font-sans space-y-4">
        {/* Header Kop Surat with Optional PNG Logo */}
        {printOptions.showLetterhead && (
          <div className="border-b-2 border-slate-900 pb-3 flex justify-between items-start gap-4">
            <div className="flex items-start gap-3">
              {printOptions.showLogo && companyProfile.logoUrl && (
                <img
                  src={companyProfile.logoUrl}
                  alt="Logo Perusahaan"
                  className="w-14 h-14 object-contain shrink-0 rounded border border-slate-200 p-0.5"
                  referrerPolicy="no-referrer"
                />
              )}
              <div>
                <h1 className="text-base font-bold tracking-tight text-slate-950 uppercase">{companyProfile.name}</h1>
                <p className="text-[11px] text-slate-600 font-medium">{companyProfile.tagline}</p>
                <p className="text-[10px] text-slate-500 max-w-md">{companyProfile.address}</p>
                <p className="text-[10px] text-slate-500">
                  Telp: {companyProfile.phone} | Email: {companyProfile.email}
                </p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <h2 className="text-sm font-bold uppercase text-slate-900">
                REKAP PEMBELIAN MATERIAL (HPP)
              </h2>
              <p className="text-[11px] font-semibold text-slate-700">
                Periode: {filter.mode === 'harian' ? formatDateIndo(filter.date) : filter.mode === 'bulanan' ? filter.month : filter.mode === 'periode' ? `${formatDateIndo(filter.startDate)} s/d ${formatDateIndo(filter.endDate)}` : 'Semua Periode'}
              </p>
              <p className="text-[10px] text-slate-400">Dicetak: {formatDateIndo(getTodayDateString())}</p>
              {printOptions.dataScope === 'selected_only' && (
                <p className="text-[9px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded inline-block mt-0.5 border border-blue-200">
                  (Filter: Baris Terpilih - {purchasesToPrint.length} Data)
                </p>
              )}
              {printOptions.dataScope === 'lunas_only' && (
                <p className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded inline-block mt-0.5 border border-emerald-200">
                  (Status: Hanya Lunas)
                </p>
              )}
              {printOptions.dataScope === 'belum_lunas_only' && (
                <p className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded inline-block mt-0.5 border border-amber-200">
                  (Status: Hanya Belum Lunas / Hutang)
                </p>
              )}
              {printOptions.selectedSupplier && printOptions.selectedSupplier.toLowerCase() !== 'all' && (
                <p className="text-[9px] font-bold text-slate-600">
                  Supplier/Quarry: {printOptions.selectedSupplier}
                </p>
              )}
              {printOptions.selectedItem && printOptions.selectedItem.toLowerCase() !== 'all' && (
                <p className="text-[9px] font-bold text-slate-600">
                  Barang: {printOptions.selectedItem}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Stats Summary */}
        {printOptions.showSummaryStats && (
          <div className="grid grid-cols-3 gap-2 bg-slate-100 p-2.5 rounded border border-slate-300">
            <div>
              <span className="text-[10px] text-slate-600 block">Total Transaksi Pengadaan:</span>
              <span className="font-bold text-slate-900">{purchasesToPrint.length} Surat Jalan</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-600 block">Total Volume:</span>
              <span className="font-bold text-slate-900">{formatNumber(totalVolumeToPrint)} Satuan</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-600 block">Total Biaya Pokok (HPP):</span>
              <span className="font-bold text-rose-800 text-sm">{formatRupiah(totalCostToPrint)}</span>
            </div>
          </div>
        )}

        {/* Table Content */}
        <table className={`w-full text-left border-collapse border border-slate-300 ${densityClass}`}>
          <thead>
            <tr className="bg-slate-200 text-slate-800 font-bold border-b border-slate-300">
              {printOptions.showNo && <th className={`${cellPadding} border border-slate-300 text-center w-8`}>No</th>}
              {printOptions.showDate && <th className={`${cellPadding} border border-slate-300`}>Tgl</th>}
              {printOptions.showDeliveryNote && <th className={`${cellPadding} border border-slate-300`}>No Surat Jalan</th>}
              {printOptions.showSupplier && <th className={`${cellPadding} border border-slate-300`}>Supplier / Quarry</th>}
              {printOptions.showItemName && <th className={`${cellPadding} border border-slate-300`}>Nama Barang</th>}
              {printOptions.showQuarry && <th className={`${cellPadding} border border-slate-300`}>Quarry</th>}
              {printOptions.showVolume && <th className={`${cellPadding} border border-slate-300 text-right`}>Volume</th>}
              {printOptions.showDestination && <th className={`${cellPadding} border border-slate-300`}>Tujuan Pengiriman</th>}
              {printOptions.showPrice && <th className={`${cellPadding} border border-slate-300 text-right`}>Harga Beli</th>}
              {printOptions.showTotalAmount && <th className={`${cellPadding} border border-slate-300 text-right`}>Total HPP (Rp)</th>}
              {printOptions.showPaymentStatus && <th className={`${cellPadding} border border-slate-300 text-center`}>Status</th>}
              {printOptions.showNotes && <th className={`${cellPadding} border border-slate-300`}>Catatan</th>}
            </tr>
          </thead>
          <tbody>
            {purchasesToPrint.length === 0 ? (
              <tr>
                <td colSpan={12} className="p-4 text-center text-slate-400 italic border border-slate-300">
                  Tidak ada data pembelian yang sesuai dengan opsi filter cetak.
                </td>
              </tr>
            ) : (
              purchasesToPrint.map((p, idx) => (
                <tr key={p.id} className={idx % 2 === 1 ? 'bg-slate-50' : 'bg-white'}>
                  {printOptions.showNo && (
                    <td className={`${cellPadding} border border-slate-300 text-center text-slate-500 font-mono`}>
                      {idx + 1}
                    </td>
                  )}
                  {printOptions.showDate && (
                    <td className={`${cellPadding} border border-slate-300 whitespace-nowrap font-mono`}>
                      {p.date}
                    </td>
                  )}
                  {printOptions.showDeliveryNote && (
                    <td className={`${cellPadding} border border-slate-300 font-mono font-medium`}>
                      {p.deliveryNoteNumber}
                    </td>
                  )}
                  {printOptions.showSupplier && (
                    <td className={`${cellPadding} border border-slate-300 font-medium`}>
                      {p.supplierName}
                    </td>
                  )}
                  {printOptions.showItemName && (
                    <td className={`${cellPadding} border border-slate-300`}>
                      {p.itemName}
                    </td>
                  )}
                  {printOptions.showQuarry && (
                    <td className={`${cellPadding} border border-slate-300 text-slate-600`}>
                      {p.quarry}
                    </td>
                  )}
                  {printOptions.showVolume && (
                    <td className={`${cellPadding} border border-slate-300 text-right font-mono font-bold whitespace-nowrap`}>
                      {formatNumber(p.volume)} {p.unit}
                    </td>
                  )}
                  {printOptions.showDestination && (
                    <td className={`${cellPadding} border border-slate-300 text-slate-700`}>
                      {p.destination}
                    </td>
                  )}
                  {printOptions.showPrice && (
                    <td className={`${cellPadding} border border-slate-300 text-right font-mono whitespace-nowrap`}>
                      {formatRupiah(p.price)}
                    </td>
                  )}
                  {printOptions.showTotalAmount && (
                    <td className={`${cellPadding} border border-slate-300 text-right font-mono font-bold text-rose-900 whitespace-nowrap`}>
                      {formatRupiah(p.totalAmount)}
                    </td>
                  )}
                  {printOptions.showPaymentStatus && (
                    <td className={`${cellPadding} border border-slate-300 text-center font-semibold`}>
                      {p.paymentStatus}
                    </td>
                  )}
                  {printOptions.showNotes && (
                    <td className={`${cellPadding} border border-slate-300 text-slate-500 italic`}>
                      {p.notes || '-'}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
          <tfoot>
            <tr className="bg-slate-200 font-bold border-t-2 border-slate-400">
              <td
                colSpan={
                  (printOptions.showNo ? 1 : 0) +
                  (printOptions.showDate ? 1 : 0) +
                  (printOptions.showDeliveryNote ? 1 : 0) +
                  (printOptions.showSupplier ? 1 : 0) +
                  (printOptions.showItemName ? 1 : 0) +
                  (printOptions.showQuarry ? 1 : 0)
                }
                className="p-1.5 text-right border border-slate-300 uppercase"
              >
                TOTAL ({purchasesToPrint.length} DATA):
              </td>
              {printOptions.showVolume && (
                <td className="p-1.5 text-right border border-slate-300 font-mono">
                  {formatNumber(totalVolumeToPrint)}
                </td>
              )}
              {printOptions.showDestination && <td className="p-1.5 border border-slate-300"></td>}
              {printOptions.showPrice && <td className="p-1.5 border border-slate-300"></td>}
              {printOptions.showTotalAmount && (
                <td className="p-1.5 text-right border border-slate-300 font-mono text-rose-900 font-bold">
                  {formatRupiah(totalCostToPrint)}
                </td>
              )}
              {printOptions.showPaymentStatus && <td className="p-1.5 border border-slate-300"></td>}
              {printOptions.showNotes && <td className="p-1.5 border border-slate-300"></td>}
            </tr>
          </tfoot>
        </table>

        {/* Custom Notes */}
        {printOptions.customNotes && (
          <div className="text-[10px] text-slate-600 bg-slate-50 p-2 rounded border border-slate-200 italic">
            {printOptions.customNotes}
          </div>
        )}

        {/* Signatures */}
        {printOptions.showSignatures && (
          <div className="grid grid-cols-2 pt-4 text-center text-xs">
            <div>
              <p className="text-slate-600 font-medium">
                {printOptions.signatureTitle1 || 'Dibuat Oleh (Admin Gudang/Quarry):'}
              </p>
              <div className="h-14"></div>
              <p className="font-bold underline text-slate-900">Bagian Operasional Lapangan</p>
              <p className="text-[10px] text-slate-500">Divisi Pengadaan & Logistik</p>
            </div>
            <div>
              <p className="text-slate-600 font-medium">
                {printOptions.signatureTitle2 || 'Disetujui Oleh (Pimpinan):'}
              </p>
              <div className="h-14"></div>
              <p className="font-bold underline text-slate-900">
                {companyProfile.signatoryName || companyProfile.director}
              </p>
              <p className="text-[10px] text-slate-500">{companyProfile.signatoryRole || 'Direktur / Pimpinan'}</p>
            </div>
          </div>
        )}
      </div>
    );

    onOpenPrintModal('Rekap Laporan Pembelian Material & HPP', printContent);
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2 bg-white p-3 rounded border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-blue-600" />
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-tight">
              Pembelian Material & Quarry (HPP Terintegrasi)
            </h2>
            <span className="px-1.5 py-0.5 text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" /> Auto-Sync Penjualan
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            Diisi otomatis mengacu pada Surat Jalan Penjualan dengan harga beli dari Master Barang
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            id="btn-add-purchase"
            onClick={openAddModal}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded text-xs transition shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Pembelian Langsung</span>
          </button>

          <button
            id="btn-options-purchases-print"
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
            id="btn-print-purchases-rekap"
            onClick={handlePrintRekap}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded text-xs font-semibold transition shadow-2xs"
            title="Pratinjau & Cetak Rekap PDF"
          >
            <Printer className="w-3.5 h-3.5 text-blue-400" />
            <span>Cetak PDF</span>
          </button>

          <button
            id="btn-export-purchases-excel"
            onClick={handleExportExcel}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 rounded text-xs border border-slate-300 transition"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>Excel</span>
          </button>
        </div>
      </div>

      {/* Date Filter Bar */}
      <DateFilterBar filter={filter} onChange={onFilterChange} title="Filter Pembelian" />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <div className="bg-white border border-slate-200 p-2.5 rounded shadow-2xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total Pengadaan</span>
          <div className="text-base font-bold text-slate-900 font-mono mt-0.5">
            {filteredPurchases.length}{' '}
            <span className="text-[10px] font-sans font-normal text-slate-500">Surat Jalan</span>
          </div>
          <div className="text-[10px] text-emerald-700 mt-0.5 flex items-center gap-1 font-medium">
            <Link className="w-3 h-3 text-emerald-600" /> {autoLinkedCount} otomatis tersinkron dari Penjualan
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-2.5 rounded shadow-2xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total Volume Pembelian</span>
          <div className="text-base font-bold text-blue-700 font-mono mt-0.5">
            {formatNumber(totalVolumeFiltered)}{' '}
            <span className="text-[10px] font-sans font-normal text-slate-500">m³ / Ton</span>
          </div>
          <div className="text-[10px] text-slate-400">Muatan dipasok dari Quarry</div>
        </div>

        <div className="bg-white border border-slate-200 p-2.5 rounded shadow-2xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total Beban Pokok (HPP)</span>
          <div className="text-base font-bold text-rose-600 font-mono mt-0.5">
            {formatRupiah(totalCostFiltered)}
          </div>
          <div className="text-[10px] text-slate-400">Tercatat ke Beban Pokok Penjualan</div>
        </div>
      </div>

      {/* Bulk Action Bar when rows are selected */}
      {selectedPurchaseIds.length > 0 && (
        <div className="bg-rose-50 border border-rose-300 rounded p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs">
          <div className="flex items-center gap-2">
            <div className="p-1 bg-rose-600 rounded text-white shrink-0">
              <Trash2 className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="text-xs font-bold text-rose-950">
                {selectedPurchaseIds.length} data pembelian terpilih
              </span>
              <span className="text-[11px] text-rose-700 ml-2">
                (Total Volume: <strong>{formatNumber(selectedPurchasesVolume)}</strong> | Total Beban HPP:{' '}
                <strong>{formatRupiah(selectedPurchasesAmount)}</strong>)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setSelectedPurchaseIds([])}
              className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded border border-slate-300 transition"
            >
              Batalkan Pilihan
            </button>
            <button
              type="button"
              id="btn-bulk-edit-purchases"
              onClick={() => setIsBulkEditModalOpen(true)}
              className="flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded transition shadow-2xs"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Masal ({selectedPurchaseIds.length})</span>
            </button>
            <button
              type="button"
              id="btn-bulk-delete-purchases"
              onClick={() => setIsBulkDeleteModalOpen(true)}
              className="flex items-center gap-1 px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded transition shadow-2xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus ({selectedPurchaseIds.length})</span>
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded shadow-2xs overflow-hidden">
        <div className="p-2 sm:p-2.5 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="relative w-full sm:w-80">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="search-purchases"
              type="text"
              placeholder="Cari No Surat Jalan, Quarry, Barang, Tujuan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1 bg-white text-slate-800 text-xs border border-slate-300 rounded focus:outline-none focus:border-blue-600"
            />
          </div>

          <div className="flex items-center gap-3 text-[11px] text-slate-500">
            {selectedPurchaseIds.length > 0 && (
              <span className="font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                {selectedPurchaseIds.length} data terpilih
              </span>
            )}
            <div>
              Menampilkan: <span className="font-bold text-slate-800 font-mono">{filteredPurchases.length}</span> transaksi
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="px-2 py-2 text-center w-8">
                  <button
                    type="button"
                    onClick={handleToggleSelectAll}
                    className="text-slate-500 hover:text-blue-600 focus:outline-none"
                    title={selectedPurchaseIds.length === filteredPurchases.length && filteredPurchases.length > 0 ? 'Batalkan Semua' : 'Pilih Semua'}
                  >
                    {filteredPurchases.length > 0 && selectedPurchaseIds.length === filteredPurchases.length ? (
                      <CheckSquare className="w-3.5 h-3.5 text-blue-600" />
                    ) : selectedPurchaseIds.length > 0 ? (
                      <CheckSquare className="w-3.5 h-3.5 text-blue-400" />
                    ) : (
                      <Square className="w-3.5 h-3.5 text-slate-400" />
                    )}
                  </button>
                </th>
                <th className="px-3 py-2">Tanggal</th>
                <th className="px-3 py-2">No. Surat Jalan</th>
                <th className="px-3 py-2">Supplier / Quarry</th>
                <th className="px-3 py-2">Nama Barang</th>
                <th className="px-3 py-2 text-right">Volume</th>
                <th className="px-3 py-2">Tujuan Pengiriman</th>
                <th className="px-3 py-2 text-right">Harga Beli (Master)</th>
                <th className="px-3 py-2 text-right">Total HPP (Rp)</th>
                <th className="px-3 py-2 text-center">Status</th>
                <th className="px-3 py-2 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-3 py-8 text-center text-slate-400">
                    <div className="max-w-xs mx-auto space-y-1">
                      <ShoppingCart className="w-6 h-6 text-slate-300 mx-auto" />
                      <p className="font-semibold text-slate-600">Belum ada data pembelian.</p>
                      <p className="text-[10px] text-slate-400">
                        Pencatatan Penjualan otomatis menambahkan entri pembelian ke tabel ini.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredPurchases.map((p) => {
                  const isSelected = selectedPurchaseIds.includes(p.id);
                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-blue-50/50 transition-colors ${
                        isSelected ? 'bg-blue-50/30' : ''
                      }`}
                    >
                      <td className="px-2 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleRowSelect(p.id)}
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
                        {p.date}
                      </td>
                      <td className="px-3 py-2 font-mono text-slate-900 whitespace-nowrap">
                        <div className="flex items-center gap-1 font-semibold">
                          <FileText className="w-3 h-3 text-slate-400" />
                          <span>{p.deliveryNoteNumber}</span>
                          {p.saleId && (
                            <span
                              className="px-1 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-bold font-sans"
                              title="Otomatis terhubung dengan Penjualan"
                            >
                              Auto
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2 font-medium text-slate-800">
                        <div className="flex items-center gap-1">
                          <Truck className="w-3 h-3 text-blue-600 shrink-0" />
                          <span>{p.supplierName}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="font-semibold text-slate-900">{p.itemName}</div>
                        <div className="text-[10px] text-slate-500">Sumber: {p.quarry}</div>
                      </td>
                      <td className="px-3 py-2 text-right whitespace-nowrap font-mono font-bold text-slate-900">
                        {formatNumber(p.volume)} {p.unit}
                      </td>
                      <td className="px-3 py-2 max-w-xs truncate">
                        <div className="flex items-start gap-1 text-slate-600 truncate">
                          <MapPin className="w-3 h-3 text-slate-400 mt-0.5 flex-shrink-0" />
                          <span className="truncate">{p.destination}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-slate-600 whitespace-nowrap">
                        {formatRupiah(p.price)}
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-rose-600 whitespace-nowrap">
                        {formatRupiah(p.totalAmount)}
                      </td>
                      <td className="px-3 py-2 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            p.paymentStatus === 'Lunas'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {p.paymentStatus}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            id={`edit-purchase-${p.id}`}
                            onClick={() => openEditModal(p)}
                            className="p-1 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded transition"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            id={`delete-purchase-${p.id}`}
                            onClick={() => {
                              if (confirm(`Hapus data pembelian "${p.deliveryNoteNumber}"?`)) {
                                onDeletePurchase(p.id);
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

      {/* Modal Add / Edit Purchase */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-lg max-w-2xl w-full p-4 shadow-xl text-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="flex items-center gap-1.5 font-bold text-slate-800 text-sm">
                <ShoppingCart className="w-4 h-4 text-blue-600" />
                <span>{editingPurchase ? 'Edit Pembelian Material' : 'Tambah Pembelian Material'}</span>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1 text-[11px]">Tanggal *</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white text-slate-900 border border-slate-300 rounded focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1 text-[11px]">No. Surat Jalan *</label>
                  <input
                    type="text"
                    required
                    value={formData.deliveryNoteNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, deliveryNoteNumber: e.target.value })
                    }
                    className="w-full px-2.5 py-1.5 bg-white text-slate-900 font-mono font-bold border border-slate-300 rounded focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              {/* Supplier / Quarry */}
              <div>
                <label className="block text-slate-600 font-semibold mb-1 text-[11px]">Supplier / Quarry *</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <select
                    value={formData.supplierId}
                    onChange={(e) => handleSupplierSelect(e.target.value)}
                    className="px-2.5 py-1.5 bg-white text-slate-900 border border-slate-300 rounded focus:outline-none focus:border-blue-600"
                  >
                    <option value="">-- Pilih dari Master Supplier --</option>
                    {suppliers
                      .filter((s) => s.type === 'supplier')
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                  </select>
                  <input
                    type="text"
                    required
                    placeholder="Atau nama quarry / supplier..."
                    value={formData.supplierName}
                    onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
                    className="px-2.5 py-1.5 bg-white text-slate-900 border border-slate-300 rounded focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              {/* Material Item Selection */}
              <div className="p-2.5 bg-slate-50 rounded border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-blue-700 font-bold text-[11px] flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-blue-600" />
                    Pilih Barang (Harga Beli otomatis dari Master) *
                  </label>
                </div>

                <select
                  required
                  value={formData.itemId}
                  onChange={(e) => handleItemSelect(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white text-slate-900 font-medium border border-slate-300 rounded focus:outline-none focus:border-blue-600"
                >
                  <option value="">-- Pilih Barang dari Master --</option>
                  {materials.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.quarry}) - Harga Beli: {formatRupiah(m.purchasePrice)}/{m.unit}
                    </option>
                  ))}
                </select>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-slate-600 text-[10px] mb-0.5">Volume *</label>
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
                      Harga Beli / Unit (Rp) *
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
                      className="w-full px-2.5 py-1.5 bg-white text-rose-600 font-mono font-bold border border-slate-300 rounded focus:outline-none focus:border-rose-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-2 bg-white rounded border border-slate-200 text-xs">
                  <span className="text-slate-600 font-medium text-[11px]">Total Nilai Pembelian (HPP):</span>
                  <span className="text-sm font-bold text-rose-600 font-mono">
                    {formatRupiah(formData.volume * formData.price)}
                  </span>
                </div>
              </div>

              {/* Destination & Payment */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-600 font-semibold text-[11px]">Tujuan Pengiriman *</label>
                    <span className="text-[10px] text-blue-600 font-normal">Otomatis dari Master Barang</span>
                  </div>
                  <input
                    type="text"
                    required
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
                    <option value="Lunas">Lunas (Kas Keluar)</option>
                    <option value="Belum Lunas">Belum Lunas (Masuk Hutang Usaha)</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-slate-600 font-semibold mb-1 text-[11px]">Catatan</label>
                <input
                  type="text"
                  placeholder="Catatan tambahan..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-white text-slate-900 border border-slate-300 rounded focus:outline-none focus:border-blue-600"
                />
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
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded transition shadow-2xs"
                >
                  {editingPurchase ? 'Simpan Perubahan' : 'Simpan Pembelian'}
                </button>
              </div>
            </form>
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
                Apakah Anda yakin ingin menghapus {selectedPurchaseIds.length} data transaksi pembelian yang dipilih?
              </p>

              <div className="bg-slate-50 border border-slate-200 rounded p-2.5 space-y-1.5 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Jumlah Transaksi:</span>
                  <strong className="text-slate-900 font-bold">{selectedPurchaseIds.length} Surat Jalan / DO</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Total Volume:</span>
                  <strong className="text-blue-900 font-bold">{formatNumber(selectedPurchasesVolume)} m³/satuan</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Total Beban Pokok (HPP):</span>
                  <strong className="text-rose-700 font-bold">{formatRupiah(selectedPurchasesAmount)}</strong>
                </div>
              </div>

              <div className="p-2 bg-amber-50 border border-amber-200 rounded text-[11px] text-amber-900 space-y-1">
                <p className="font-bold flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
                  <span>Informasi:</span>
                </p>
                <p>
                  Data pembelian yang dihapus akan memperbarui akumulasi Beban Pokok Penjualan (HPP) pada Laporan Laba Rugi. Anda dapat membatalkan aksi ini kapan saja dengan tombol <strong>Undo (Ctrl+Z)</strong>.
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
                id="btn-confirm-bulk-delete-purchases"
                onClick={handleConfirmBulkDelete}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded shadow-2xs flex items-center gap-1.5 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Ya, Hapus {selectedPurchaseIds.length} Data</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Edit Purchases Modal */}
      <BulkEditPurchasesModal
        isOpen={isBulkEditModalOpen}
        onClose={() => setIsBulkEditModalOpen(false)}
        selectedCount={selectedPurchaseIds.length}
        totalVolume={selectedPurchasesVolume}
        totalAmount={selectedPurchasesAmount}
        suppliers={suppliers}
        materials={materials}
        onApplyBulkEdit={handleApplyBulkEdit}
      />

      {/* Purchase Print Options Modal */}
      <PurchasePrintOptionsModal
        isOpen={isPrintOptionsModalOpen}
        onClose={() => setIsPrintOptionsModalOpen(false)}
        options={printOptions}
        onChangeOptions={setPrintOptions}
        onConfirmPrint={handlePrintRekap}
        suppliers={suppliers}
        materials={materials}
        totalAvailableCount={filteredPurchases.length}
        selectedRowsCount={selectedPurchaseIds.length}
        previewCount={purchasesToPrint.length}
      />
    </div>
  );
};
