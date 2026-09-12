import React from 'react';
import {
  X,
  Printer,
  Sliders,
  CheckSquare,
  Square,
  Building2,
  FileSpreadsheet,
  CheckCircle2,
  RotateCcw,
} from 'lucide-react';
import { ClientSupplier, MaterialItem, SalesPrintOptions } from '../types';

interface SalesPrintOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  options: SalesPrintOptions;
  onChangeOptions: (options: SalesPrintOptions) => void;
  onConfirmPrint: () => void;
  clients: ClientSupplier[];
  materials: MaterialItem[];
  totalAvailableCount: number;
  selectedRowsCount: number;
  previewCount: number;
}

export const DEFAULT_SALES_PRINT_OPTIONS: SalesPrintOptions = {
  showNo: true,
  showDate: true,
  showPONumber: true,
  showDeliveryNote: true,
  showClient: true,
  showItemName: true,
  showQuarry: false,
  showVolume: true,
  showDestination: true,
  showPrice: true,
  showTotalAmount: true,
  showPaymentStatus: true,
  showVehiclePlate: false,
  showDriverName: false,
  showNotes: false,
  dataScope: 'all',
  selectedClient: 'all',
  selectedItem: 'all',
  showLetterhead: true,
  showLogo: true,
  showSummaryStats: true,
  showSignatures: true,
  signatureTitle1: 'Dibuat Oleh (Admin Logistik)',
  signatureTitle2: 'Disetujui Oleh (Keuangan)',
  customNotes: '',
  density: 'compact',
};

export const SalesPrintOptionsModal: React.FC<SalesPrintOptionsModalProps> = ({
  isOpen,
  onClose,
  options,
  onChangeOptions,
  onConfirmPrint,
  clients,
  materials,
  totalAvailableCount,
  selectedRowsCount,
  previewCount,
}) => {
  if (!isOpen) return null;

  const handleToggle = (key: keyof SalesPrintOptions) => {
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
      showPONumber: true,
      showDeliveryNote: true,
      showClient: true,
      showItemName: true,
      showQuarry: true,
      showVolume: true,
      showDestination: true,
      showPrice: true,
      showTotalAmount: true,
      showPaymentStatus: true,
      showVehiclePlate: true,
      showDriverName: true,
      showNotes: true,
    });
  };

  const handleResetDefault = () => {
    onChangeOptions({
      ...DEFAULT_SALES_PRINT_OPTIONS,
    });
  };

  const columnConfig: { key: keyof SalesPrintOptions; label: string; desc: string }[] = [
    { key: 'showNo', label: 'No Urut', desc: 'Nomor 1, 2, 3...' },
    { key: 'showDate', label: 'Tanggal Kirim', desc: 'Format YYYY-MM-DD' },
    { key: 'showPONumber', label: 'No. PO Proyek', desc: 'Purchase Order Klien' },
    { key: 'showDeliveryNote', label: 'No. Surat Jalan', desc: 'Nomor SJ Pengiriman' },
    { key: 'showClient', label: 'Nama Klien / Proyek', desc: 'Nama Pembeli / Kontraktor' },
    { key: 'showItemName', label: 'Nama Barang / Material', desc: 'Jenis Pasir, Batu, dll' },
    { key: 'showQuarry', label: 'Quarry / Asal Tambang', desc: 'Lokasi sumber material' },
    { key: 'showVolume', label: 'Volume & Satuan', desc: 'M3 / Ton / Rit' },
    { key: 'showDestination', label: 'Tujuan Lokasi', desc: 'Alamat / Proyek Tujuan' },
    { key: 'showPrice', label: 'Harga Satuan (Rp)', desc: 'Harga Jual per unit' },
    { key: 'showTotalAmount', label: 'Total Nilai (Rp)', desc: 'Total Nilai Transaksi' },
    { key: 'showPaymentStatus', label: 'Status Pembayaran', desc: 'Lunas / Belum Lunas' },
    { key: 'showVehiclePlate', label: 'Plat Nomor Armada', desc: 'No Polisi Truk' },
    { key: 'showDriverName', label: 'Nama Driver / Sopir', desc: 'Pengemudi Pengiriman' },
    { key: 'showNotes', label: 'Catatan / Keterangan', desc: 'Catatan tambahan pengiriman' },
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
                Opsi & Kustomisasi Rekap Laporan Penjualan
              </h3>
              <p className="text-[10px] text-slate-300">
                Pilih kolom, cakupan data, dan tata letak dokumen yang akan dicetak
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
                <span>1. Cakupan Data Transaksi yang Dicetak</span>
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
                  name="dataScope"
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
                  name="dataScope"
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
                  name="dataScope"
                  checked={options.dataScope === 'lunas_only'}
                  onChange={() => onChangeOptions({ ...options, dataScope: 'lunas_only' })}
                  className="text-blue-600"
                />
                <div>
                  <div className="text-[11px]">Hanya Status Lunas</div>
                  <div className="text-[9px] text-emerald-600 font-normal">Pembayaran Selesai</div>
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
                  name="dataScope"
                  checked={options.dataScope === 'belum_lunas_only'}
                  onChange={() => onChangeOptions({ ...options, dataScope: 'belum_lunas_only' })}
                  className="text-blue-600"
                />
                <div>
                  <div className="text-[11px]">Hanya Belum Lunas</div>
                  <div className="text-[9px] text-amber-600 font-normal">Piutang / Pending</div>
                </div>
              </label>
            </div>

            {/* Filter Klien & Barang Khusus */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <div>
                <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                  Filter Spesifik Klien Proyek:
                </label>
                <select
                  value={options.selectedClient}
                  onChange={(e) => onChangeOptions({ ...options, selectedClient: e.target.value })}
                  className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs focus:outline-none focus:border-blue-600"
                >
                  <option value="all">-- Semua Klien --</option>
                  {clients
                    .filter((c) => c.type === 'klien' || c.type === 'klien_dan_supplier')
                    .map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name} ({c.companyName || 'Proyek'})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                  Filter Spesifik Jenis Material / Barang:
                </label>
                <select
                  value={options.selectedItem}
                  onChange={(e) => onChangeOptions({ ...options, selectedItem: e.target.value })}
                  className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs focus:outline-none focus:border-blue-600"
                >
                  <option value="all">-- Semua Jenis Material --</option>
                  {materials.map((m) => (
                    <option key={m.id} value={m.name}>
                      {m.name} ({m.defaultUnit})
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
                  Catatan Kaki Tambahan Dokumen:
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Rekap ini sah sebagai lampiran tagihan resmi proyek..."
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
              id="btn-confirm-print-sales-rekap"
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
