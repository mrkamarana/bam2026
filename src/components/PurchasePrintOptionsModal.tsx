import React from 'react';
import {
  X,
  Printer,
  Sliders,
  CheckSquare,
  Square,
  Building2,
  FileSpreadsheet,
  RotateCcw,
} from 'lucide-react';
import { ClientSupplier, MaterialItem, PurchasePrintOptions } from '../types';

interface PurchasePrintOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  options: PurchasePrintOptions;
  onChangeOptions: (options: PurchasePrintOptions) => void;
  onConfirmPrint: () => void;
  suppliers: ClientSupplier[];
  materials: MaterialItem[];
  totalAvailableCount: number;
  selectedRowsCount: number;
  previewCount: number;
}

export const DEFAULT_PURCHASE_PRINT_OPTIONS: PurchasePrintOptions = {
  showNo: true,
  showDate: true,
  showDeliveryNote: true,
  showSupplier: true,
  showItemName: true,
  showQuarry: false,
  showVolume: true,
  showDestination: true,
  showPrice: true,
  showTotalAmount: true,
  showPaymentStatus: true,
  showNotes: false,
  dataScope: 'all',
  selectedSupplier: 'all',
  selectedItem: 'all',
  showLetterhead: true,
  showLogo: true,
  showSummaryStats: true,
  showSignatures: true,
  signatureTitle1: 'Dibuat Oleh (Admin Quarry / Logistik)',
  signatureTitle2: 'Disetujui Oleh (Pimpinan / Direktur)',
  customNotes: 'Keterangan: Biaya pembelian material quarry otomatis dicatat sebagai Beban Pokok Penjualan (HPP).',
  density: 'compact',
};

export const PurchasePrintOptionsModal: React.FC<PurchasePrintOptionsModalProps> = ({
  isOpen,
  onClose,
  options,
  onChangeOptions,
  onConfirmPrint,
  suppliers,
  materials,
  totalAvailableCount,
  selectedRowsCount,
  previewCount,
}) => {
  if (!isOpen) return null;

  const handleToggle = (key: keyof PurchasePrintOptions) => {
    onChangeOptions({
      ...options,
      [key]: !options[key],
    });
  };

  const handleSelectAllColumns = () => {
    onChangeOptions({
      ...options,
      showNo: true,
      showDate: true,
      showDeliveryNote: true,
      showSupplier: true,
      showItemName: true,
      showQuarry: true,
      showVolume: true,
      showDestination: true,
      showPrice: true,
      showTotalAmount: true,
      showPaymentStatus: true,
      showNotes: true,
    });
  };

  const handleResetDefault = () => {
    onChangeOptions({
      ...DEFAULT_PURCHASE_PRINT_OPTIONS,
    });
  };

  const columnConfig: { key: keyof PurchasePrintOptions; label: string; desc: string }[] = [
    { key: 'showNo', label: 'No Urut', desc: 'Nomor 1, 2, 3...' },
    { key: 'showDate', label: 'Tanggal Pembelian', desc: 'Format YYYY-MM-DD' },
    { key: 'showDeliveryNote', label: 'No. Surat Jalan', desc: 'Nomor SJ Supplier / Quarry' },
    { key: 'showSupplier', label: 'Supplier / Quarry Asal', desc: 'Nama Penyedia Material' },
    { key: 'showItemName', label: 'Nama Barang / Material', desc: 'Jenis Pasir, Batu, dll' },
    { key: 'showQuarry', label: 'Lokasi Quarry', desc: 'Lokasi tambang/quarry' },
    { key: 'showVolume', label: 'Volume & Satuan', desc: 'M3 / Ton / Rit' },
    { key: 'showDestination', label: 'Tujuan Pengiriman', desc: 'Lokasi bongkar muatan' },
    { key: 'showPrice', label: 'Harga Beli Satuan (Rp)', desc: 'Harga HPP per satuan' },
    { key: 'showTotalAmount', label: 'Total Biaya (Rp)', desc: 'Total Nilai Pembelian' },
    { key: 'showPaymentStatus', label: 'Status Pembayaran', desc: 'Lunas / Belum Lunas' },
    { key: 'showNotes', label: 'Catatan / Keterangan', desc: 'Keterangan transaksi' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 backdrop-blur-2xs overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl border border-slate-300 w-full max-w-3xl overflow-hidden my-6">
        {/* Header */}
        <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-600 rounded">
              <Sliders className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider">
                Opsi & Kustomisasi Rekap Laporan Pembelian & HPP
              </h3>
              <p className="text-[10px] text-slate-300">
                Sesuaikan kolom dan filter data transaksi pembelian material yang akan dicetak
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
          {/* Section 1: Cakupan Data (Data Scope) */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-2.5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
              <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600" />
                <span>1. Cakupan Data Pembelian yang Dicetak</span>
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-800 border border-blue-200 rounded">
                Akan Dicetak: {previewCount} dari {totalAvailableCount} Data
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              <label
                className={`p-2 rounded border cursor-pointer flex items-center gap-2 transition ${
                  options.dataScope === 'all'
                    ? 'bg-blue-50 border-blue-500 text-blue-900 font-semibold'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="purchaseDataScope"
                  checked={options.dataScope === 'all'}
                  onChange={() => onChangeOptions({ ...options, dataScope: 'all' })}
                  className="text-blue-600"
                />
                <div>
                  <div className="text-[11px]">Semua Data Terfilter</div>
                  <div className="text-[9px] text-slate-500 font-normal">({totalAvailableCount} transaksi)</div>
                </div>
              </label>

              <label
                className={`p-2 rounded border cursor-pointer flex items-center gap-2 transition ${
                  options.dataScope === 'selected_only'
                    ? 'bg-blue-50 border-blue-500 text-blue-900 font-semibold'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="purchaseDataScope"
                  checked={options.dataScope === 'selected_only'}
                  onChange={() => onChangeOptions({ ...options, dataScope: 'selected_only' })}
                  className="text-blue-600"
                />
                <div>
                  <div className="text-[11px]">Hanya yang Dicentang</div>
                  <div className="text-[9px] text-slate-500 font-normal">({selectedRowsCount} baris terpilih)</div>
                </div>
              </label>

              <label
                className={`p-2 rounded border cursor-pointer flex items-center gap-2 transition ${
                  options.dataScope === 'lunas_only'
                    ? 'bg-blue-50 border-blue-500 text-blue-900 font-semibold'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="purchaseDataScope"
                  checked={options.dataScope === 'lunas_only'}
                  onChange={() => onChangeOptions({ ...options, dataScope: 'lunas_only' })}
                  className="text-blue-600"
                />
                <div>
                  <div className="text-[11px]">Hanya Status Lunas</div>
                  <div className="text-[9px] text-emerald-600 font-normal">Sudah Dibayar</div>
                </div>
              </label>

              <label
                className={`p-2 rounded border cursor-pointer flex items-center gap-2 transition ${
                  options.dataScope === 'belum_lunas_only'
                    ? 'bg-blue-50 border-blue-500 text-blue-900 font-semibold'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="purchaseDataScope"
                  checked={options.dataScope === 'belum_lunas_only'}
                  onChange={() => onChangeOptions({ ...options, dataScope: 'belum_lunas_only' })}
                  className="text-blue-600"
                />
                <div>
                  <div className="text-[11px]">Hanya Belum Lunas</div>
                  <div className="text-[9px] text-amber-600 font-normal">Hutang Usaha</div>
                </div>
              </label>
            </div>

            {/* Filter Supplier & Barang Khusus */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <div>
                <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                  Filter Spesifik Supplier / Quarry:
                </label>
                <select
                  value={options.selectedSupplier}
                  onChange={(e) => onChangeOptions({ ...options, selectedSupplier: e.target.value })}
                  className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs focus:outline-none focus:border-blue-600"
                >
                  <option value="all">-- Semua Supplier / Quarry --</option>
                  {suppliers
                    .filter((s) => s.type === 'supplier')
                    .map((s) => (
                      <option key={s.id} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                  Filter Spesifik Jenis Material:
                </label>
                <select
                  value={options.selectedItem}
                  onChange={(e) => onChangeOptions({ ...options, selectedItem: e.target.value })}
                  className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs focus:outline-none focus:border-blue-600"
                >
                  <option value="all">-- Semua Jenis Material --</option>
                  {materials.map((m) => (
                    <option key={m.id} value={m.name}>
                      {m.name} ({m.unit})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Pilihan Kolom Tabel */}
          <div className="p-3 bg-white border border-slate-200 rounded space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-1.5">
              <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-blue-600" />
                <span>2. Pilih Kolom Tabel yang Dicetak</span>
              </span>
              <div className="flex items-center gap-2 text-[10px]">
                <button
                  type="button"
                  onClick={handleSelectAllColumns}
                  className="text-blue-600 hover:underline font-semibold"
                >
                  Pilih Semua Kolom
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={handleResetDefault}
                  className="text-slate-600 hover:underline flex items-center gap-0.5"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                  <span>Reset Default</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {columnConfig.map((col) => {
                const isChecked = !!options[col.key];
                return (
                  <button
                    type="button"
                    key={col.key}
                    onClick={() => handleToggle(col.key)}
                    className={`flex items-start gap-2 p-2 rounded border text-left transition ${
                      isChecked
                        ? 'bg-blue-50/70 border-blue-300 text-slate-900'
                        : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100'
                    }`}
                  >
                    <span className="mt-0.5">
                      {isChecked ? (
                        <CheckSquare className="w-3.5 h-3.5 text-blue-600" />
                      ) : (
                        <Square className="w-3.5 h-3.5 text-slate-300" />
                      )}
                    </span>
                    <div className="min-w-0">
                      <div className={`text-[11px] font-semibold ${isChecked ? 'text-slate-900' : 'text-slate-500'}`}>
                        {col.label}
                      </div>
                      <div className="text-[9px] text-slate-400 truncate">{col.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Tata Letak & Elemen Dokumen */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-2.5">
            <div className="border-b border-slate-200 pb-1.5">
              <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-blue-600" />
                <span>3. Elemen Format & Tata Letak Dokumen</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
              <label className="flex items-center gap-2 p-2 bg-white rounded border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.showLetterhead}
                  onChange={() => handleToggle('showLetterhead')}
                  className="rounded text-blue-600"
                />
                <span className="text-[11px] font-medium text-slate-700">Kop Surat Perusahaan</span>
              </label>

              <label className="flex items-center gap-2 p-2 bg-white rounded border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.showLogo}
                  disabled={!options.showLetterhead}
                  onChange={() => handleToggle('showLogo')}
                  className="rounded text-blue-600 disabled:opacity-50"
                />
                <span className="text-[11px] font-medium text-slate-700">Tampilkan Logo .PNG</span>
              </label>

              <label className="flex items-center gap-2 p-2 bg-white rounded border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.showSummaryStats}
                  onChange={() => handleToggle('showSummaryStats')}
                  className="rounded text-blue-600"
                />
                <span className="text-[11px] font-medium text-slate-700">Statistik Ringkasan Atas</span>
              </label>

              <label className="flex items-center gap-2 p-2 bg-white rounded border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.showSignatures}
                  onChange={() => handleToggle('showSignatures')}
                  className="rounded text-blue-600"
                />
                <span className="text-[11px] font-medium text-slate-700">Kolom Tanda Tangan</span>
              </label>
            </div>

            {/* Custom Notes & Density */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                  Catatan Kaki Dokumen:
                </label>
                <input
                  type="text"
                  placeholder="Keterangan dokumen pembelian..."
                  value={options.customNotes}
                  onChange={(e) => onChangeOptions({ ...options, customNotes: e.target.value })}
                  className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                  Kerapatan Baris Cetak:
                </label>
                <select
                  value={options.density}
                  onChange={(e) => onChangeOptions({ ...options, density: e.target.value as 'compact' | 'normal' })}
                  className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs focus:outline-none focus:border-blue-600 font-medium"
                >
                  <option value="compact">Kompak (Hemat Halaman)</option>
                  <option value="normal">Normal (Standar)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-4 py-3 bg-slate-100 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div className="text-[11px] text-slate-600">
            <span className="font-semibold text-slate-900">{previewCount} transaksi</span> akan tercantum pada dokumen cetak PDF.
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 bg-white hover:bg-slate-200 text-slate-700 rounded border border-slate-300 font-semibold text-xs transition"
            >
              Batal
            </button>

            <button
              type="button"
              id="btn-confirm-print-purchases-rekap"
              onClick={() => {
                onClose();
                onConfirmPrint();
              }}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded text-xs transition shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Pratinjau & Cetak Rekap PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
