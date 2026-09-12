import React, { useState } from 'react';
import {
  X,
  Edit3,
  Calendar,
  Building2,
  Layers,
  MapPin,
  DollarSign,
  CreditCard,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { ClientSupplier, MaterialItem, PurchaseTransaction } from '../types';
import { formatNumber, formatRupiah, getTodayDateString } from '../utils/formatters';

interface BulkEditPurchasesModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCount: number;
  totalVolume: number;
  totalAmount: number;
  suppliers: ClientSupplier[];
  materials: MaterialItem[];
  onApplyBulkEdit: (updates: Partial<PurchaseTransaction>) => void;
}

export const BulkEditPurchasesModal: React.FC<BulkEditPurchasesModalProps> = ({
  isOpen,
  onClose,
  selectedCount,
  totalVolume,
  totalAmount,
  suppliers,
  materials,
  onApplyBulkEdit,
}) => {
  // Enabled toggles for each field to override
  const [enabledFields, setEnabledFields] = useState<{
    date: boolean;
    deliveryNoteNumber: boolean;
    supplier: boolean;
    item: boolean;
    quarry: boolean;
    destination: boolean;
    price: boolean;
    paymentStatus: boolean;
    notes: boolean;
  }>({
    date: false,
    deliveryNoteNumber: false,
    supplier: false,
    item: false,
    quarry: false,
    destination: false,
    price: false,
    paymentStatus: false,
    notes: false,
  });

  // Form field values
  const [date, setDate] = useState(getTodayDateString());
  const [deliveryNoteNumber, setDeliveryNoteNumber] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [itemId, setItemId] = useState('');
  const [itemName, setItemName] = useState('');
  const [unit, setUnit] = useState('m3');
  const [quarry, setQuarry] = useState('');
  const [destination, setDestination] = useState('');
  const [price, setPrice] = useState<number | ''>('');
  const [paymentStatus, setPaymentStatus] = useState<'Lunas' | 'Belum Lunas'>('Lunas');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const toggleField = (fieldKey: keyof typeof enabledFields) => {
    setEnabledFields((prev) => ({
      ...prev,
      [fieldKey]: !prev[fieldKey],
    }));
  };

  const handleSupplierSelect = (sId: string) => {
    setSupplierId(sId);
    const selected = suppliers.find((s) => s.id === sId);
    if (selected) {
      setSupplierName(selected.name);
      setQuarry(selected.name);
    }
  };

  const handleMaterialSelect = (mId: string) => {
    setItemId(mId);
    const selected = materials.find((m) => m.id === mId);
    if (selected) {
      setItemName(selected.name);
      setUnit(selected.unit);
      if (selected.quarry) setQuarry(selected.quarry);
      if (selected.destination) setDestination(selected.destination);
      if (price === '' || price === 0) setPrice(selected.purchasePrice);
    }
  };

  const activeFieldCount = Object.values(enabledFields).filter(Boolean).length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeFieldCount === 0) return;

    const updates: Partial<PurchaseTransaction> = {};

    if (enabledFields.date && date) {
      updates.date = date;
    }
    if (enabledFields.deliveryNoteNumber) {
      updates.deliveryNoteNumber = deliveryNoteNumber.trim();
    }
    if (enabledFields.supplier && supplierName.trim()) {
      updates.supplierName = supplierName.trim();
      if (supplierId) updates.supplierId = supplierId;
    }
    if (enabledFields.item && itemName.trim()) {
      updates.itemName = itemName.trim();
      if (itemId) updates.itemId = itemId;
      if (unit) updates.unit = unit;
    }
    if (enabledFields.quarry) {
      updates.quarry = quarry.trim();
    }
    if (enabledFields.destination) {
      updates.destination = destination.trim();
    }
    if (enabledFields.price && price !== '' && !isNaN(Number(price))) {
      updates.price = Number(price);
    }
    if (enabledFields.paymentStatus) {
      updates.paymentStatus = paymentStatus;
    }
    if (enabledFields.notes) {
      updates.notes = notes.trim();
    }

    onApplyBulkEdit(updates);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl border border-slate-200 w-full max-w-3xl my-6 flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 rounded-t-lg">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Edit Masal Transaksi Pembelian / HPP Quarry</h3>
              <p className="text-xs text-slate-500">
                Memperbarui <strong>{selectedCount} data pembelian terpilih</strong> sekaligus
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-md hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Highlight Summary Bar */}
        <div className="px-5 py-2.5 bg-emerald-50/70 border-b border-emerald-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-emerald-900">
            <Info className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Centang kotak di samping kolom yang ingin Anda ubah. Kolom yang tidak dicentang akan mempertahankan nilai aslinya.
            </span>
          </div>
          <div className="flex items-center gap-3 text-slate-700 text-[11px] font-mono">
            <span>
              Volume: <strong>{formatNumber(totalVolume)}</strong>
            </span>
            <span>
              Total Nilai: <strong>{formatRupiah(totalAmount)}</strong>
            </span>
          </div>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {/* Row 1: Tanggal & No Surat Jalan */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Tanggal */}
            <div
              className={`p-3 rounded-lg border transition ${
                enabledFields.date ? 'bg-emerald-50/40 border-emerald-300' : 'bg-slate-50/60 border-slate-200 opacity-75'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={enabledFields.date}
                    onChange={() => toggleField('date')}
                    className="w-3.5 h-3.5 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                  />
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" /> Ubah Tanggal Pembelian
                  </span>
                </label>
                {enabledFields.date && <span className="text-[10px] text-emerald-600 font-bold uppercase">Aktif</span>}
              </div>
              <input
                type="date"
                disabled={!enabledFields.date}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={`w-full px-3 py-1.5 rounded border text-xs focus:outline-none transition ${
                  enabledFields.date
                    ? 'bg-white border-slate-300 focus:border-emerald-600 text-slate-800'
                    : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              />
            </div>

            {/* No Surat Jalan / DO */}
            <div
              className={`p-3 rounded-lg border transition ${
                enabledFields.deliveryNoteNumber
                  ? 'bg-emerald-50/40 border-emerald-300'
                  : 'bg-slate-50/60 border-slate-200 opacity-75'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={enabledFields.deliveryNoteNumber}
                    onChange={() => toggleField('deliveryNoteNumber')}
                    className="w-3.5 h-3.5 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                  />
                  <span className="flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-slate-500" /> Ubah No. Surat Jalan / DO
                  </span>
                </label>
                {enabledFields.deliveryNoteNumber && (
                  <span className="text-[10px] text-emerald-600 font-bold uppercase">Aktif</span>
                )}
              </div>
              <input
                type="text"
                disabled={!enabledFields.deliveryNoteNumber}
                placeholder="Contoh: SJ-2026/08/001"
                value={deliveryNoteNumber}
                onChange={(e) => setDeliveryNoteNumber(e.target.value)}
                className={`w-full px-3 py-1.5 rounded border text-xs focus:outline-none transition ${
                  enabledFields.deliveryNoteNumber
                    ? 'bg-white border-slate-300 focus:border-emerald-600 text-slate-800'
                    : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              />
            </div>
          </div>

          {/* Row 2: Supplier / Quarry */}
          <div
            className={`p-3 rounded-lg border transition ${
              enabledFields.supplier ? 'bg-emerald-50/40 border-emerald-300' : 'bg-slate-50/60 border-slate-200 opacity-75'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                <input
                  type="checkbox"
                  checked={enabledFields.supplier}
                  onChange={() => toggleField('supplier')}
                  className="w-3.5 h-3.5 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                />
                <span className="flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-slate-500" /> Ubah Supplier / Quarry
                </span>
              </label>
              {enabledFields.supplier && <span className="text-[10px] text-emerald-600 font-bold uppercase">Aktif</span>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <select
                disabled={!enabledFields.supplier}
                value={supplierId}
                onChange={(e) => handleSupplierSelect(e.target.value)}
                className={`px-3 py-1.5 rounded border text-xs focus:outline-none transition ${
                  enabledFields.supplier
                    ? 'bg-white border-slate-300 focus:border-emerald-600 text-slate-800'
                    : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                }`}
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
                disabled={!enabledFields.supplier}
                placeholder="Atau ketik nama supplier/quarry..."
                value={supplierName}
                onChange={(e) => {
                  setSupplierName(e.target.value);
                  setQuarry(e.target.value);
                  setSupplierId('');
                }}
                className={`px-3 py-1.5 rounded border text-xs focus:outline-none transition ${
                  enabledFields.supplier
                    ? 'bg-white border-slate-300 focus:border-emerald-600 text-slate-800'
                    : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              />
            </div>
          </div>

          {/* Row 3: Barang / Material & Asal Quarry */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Material */}
            <div
              className={`p-3 rounded-lg border transition ${
                enabledFields.item ? 'bg-emerald-50/40 border-emerald-300' : 'bg-slate-50/60 border-slate-200 opacity-75'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={enabledFields.item}
                    onChange={() => toggleField('item')}
                    className="w-3.5 h-3.5 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                  />
                  <span className="flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-slate-500" /> Ubah Barang / Material
                  </span>
                </label>
                {enabledFields.item && <span className="text-[10px] text-emerald-600 font-bold uppercase">Aktif</span>}
              </div>
              <div className="space-y-2">
                <select
                  disabled={!enabledFields.item}
                  value={itemId}
                  onChange={(e) => handleMaterialSelect(e.target.value)}
                  className={`w-full px-3 py-1.5 rounded border text-xs focus:outline-none transition ${
                    enabledFields.item
                      ? 'bg-white border-slate-300 focus:border-emerald-600 text-slate-800'
                      : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <option value="">-- Pilih dari Master Barang --</option>
                  {materials.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.unit}) - {m.quarry}
                    </option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <input
                    type="text"
                    disabled={!enabledFields.item}
                    placeholder="Nama barang..."
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    className={`flex-1 px-3 py-1.5 rounded border text-xs focus:outline-none transition ${
                      enabledFields.item
                        ? 'bg-white border-slate-300 focus:border-emerald-600 text-slate-800'
                        : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  />
                  <select
                    disabled={!enabledFields.item}
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className={`w-24 px-2 py-1.5 rounded border text-xs focus:outline-none transition ${
                      enabledFields.item
                        ? 'bg-white border-slate-300 focus:border-emerald-600 text-slate-800'
                        : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <option value="m3">m3</option>
                    <option value="ton">ton</option>
                    <option value="kg">kg</option>
                    <option value="rit">rit</option>
                    <option value="truk">truk</option>
                    <option value="sak">sak</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Asal Quarry */}
            <div
              className={`p-3 rounded-lg border transition ${
                enabledFields.quarry ? 'bg-emerald-50/40 border-emerald-300' : 'bg-slate-50/60 border-slate-200 opacity-75'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={enabledFields.quarry}
                    onChange={() => toggleField('quarry')}
                    className="w-3.5 h-3.5 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                  />
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" /> Ubah Asal Quarry
                  </span>
                </label>
                {enabledFields.quarry && <span className="text-[10px] text-emerald-600 font-bold uppercase">Aktif</span>}
              </div>
              <input
                type="text"
                disabled={!enabledFields.quarry}
                placeholder="Contoh: Quarry Rumpin / Quarry Merak"
                value={quarry}
                onChange={(e) => setQuarry(e.target.value)}
                className={`w-full px-3 py-1.5 rounded border text-xs focus:outline-none transition ${
                  enabledFields.quarry
                    ? 'bg-white border-slate-300 focus:border-emerald-600 text-slate-800'
                    : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              />
            </div>
          </div>

          {/* Row 4: Tujuan Pengiriman & Harga Beli Satuan */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Tujuan Pengiriman */}
            <div
              className={`p-3 rounded-lg border transition ${
                enabledFields.destination
                  ? 'bg-emerald-50/40 border-emerald-300'
                  : 'bg-slate-50/60 border-slate-200 opacity-75'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={enabledFields.destination}
                    onChange={() => toggleField('destination')}
                    className="w-3.5 h-3.5 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                  />
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" /> Ubah Tujuan Pengiriman
                  </span>
                </label>
                {enabledFields.destination && (
                  <span className="text-[10px] text-emerald-600 font-bold uppercase">Aktif</span>
                )}
              </div>
              <input
                type="text"
                disabled={!enabledFields.destination}
                placeholder="Contoh: Proyek Tol IKN Segmen 3B"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className={`w-full px-3 py-1.5 rounded border text-xs focus:outline-none transition ${
                  enabledFields.destination
                    ? 'bg-white border-slate-300 focus:border-emerald-600 text-slate-800'
                    : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              />
            </div>

            {/* Harga Beli Satuan */}
            <div
              className={`p-3 rounded-lg border transition ${
                enabledFields.price ? 'bg-emerald-50/40 border-emerald-300' : 'bg-slate-50/60 border-slate-200 opacity-75'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={enabledFields.price}
                    onChange={() => toggleField('price')}
                    className="w-3.5 h-3.5 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                  />
                  <span className="flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5 text-slate-500" /> Ubah Harga Beli Satuan (Rp)
                  </span>
                </label>
                {enabledFields.price && <span className="text-[10px] text-emerald-600 font-bold uppercase">Aktif</span>}
              </div>
              <input
                type="number"
                disabled={!enabledFields.price}
                placeholder="Contoh: 125000"
                value={price}
                onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
                className={`w-full px-3 py-1.5 rounded border text-xs focus:outline-none transition ${
                  enabledFields.price
                    ? 'bg-white border-slate-300 focus:border-emerald-600 text-slate-800'
                    : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              />
              {enabledFields.price && price !== '' && (
                <p className="text-[11px] text-emerald-700 font-semibold mt-1">
                  Total Nilai (Rp) setiap baris akan otomatis dihitung ulang: <code>Volume × {formatRupiah(Number(price))}</code>
                </p>
              )}
            </div>
          </div>

          {/* Row 5: Status Pembayaran & Catatan */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Status Pembayaran */}
            <div
              className={`p-3 rounded-lg border transition ${
                enabledFields.paymentStatus
                  ? 'bg-emerald-50/40 border-emerald-300'
                  : 'bg-slate-50/60 border-slate-200 opacity-75'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={enabledFields.paymentStatus}
                    onChange={() => toggleField('paymentStatus')}
                    className="w-3.5 h-3.5 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                  />
                  <span className="flex items-center gap-1">
                    <CreditCard className="w-3.5 h-3.5 text-slate-500" /> Status Bayar
                  </span>
                </label>
                {enabledFields.paymentStatus && (
                  <span className="text-[10px] text-emerald-600 font-bold uppercase">Aktif</span>
                )}
              </div>
              <select
                disabled={!enabledFields.paymentStatus}
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value as 'Lunas' | 'Belum Lunas')}
                className={`w-full px-3 py-1.5 rounded border text-xs font-semibold focus:outline-none transition ${
                  enabledFields.paymentStatus
                    ? 'bg-white border-slate-300 focus:border-emerald-600 text-slate-800'
                    : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <option value="Lunas">Lunas (Selesai Dibayar)</option>
                <option value="Belum Lunas">Belum Lunas (Hutang Usaha)</option>
              </select>
            </div>

            {/* Catatan */}
            <div
              className={`p-3 rounded-lg border transition ${
                enabledFields.notes ? 'bg-emerald-50/40 border-emerald-300' : 'bg-slate-50/60 border-slate-200 opacity-75'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={enabledFields.notes}
                    onChange={() => toggleField('notes')}
                    className="w-3.5 h-3.5 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                  />
                  <span className="flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-slate-500" /> Catatan Pembelian
                  </span>
                </label>
                {enabledFields.notes && <span className="text-[10px] text-emerald-600 font-bold uppercase">Aktif</span>}
              </div>
              <input
                type="text"
                disabled={!enabledFields.notes}
                placeholder="Catatan tambahan untuk transaksi pembelian..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className={`w-full px-3 py-1.5 rounded border text-xs focus:outline-none transition ${
                  enabledFields.notes
                    ? 'bg-white border-slate-300 focus:border-emerald-600 text-slate-800'
                    : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              />
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3 rounded-b-lg">
          <div className="text-xs text-slate-600">
            {activeFieldCount === 0 ? (
              <span className="text-amber-600 font-semibold flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" /> Belum ada kolom yang dipilih untuk diubah.
              </span>
            ) : (
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Siap memperbarui <strong>{activeFieldCount} kolom</strong> pada{' '}
                <strong>{selectedCount} transaksi</strong>.
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 transition"
            >
              Batal
            </button>
            <button
              type="button"
              id="btn-confirm-bulk-edit-purchases"
              disabled={activeFieldCount === 0}
              onClick={handleSubmit}
              className={`flex items-center gap-1.5 px-4 py-2 rounded text-xs font-bold text-white transition shadow-2xs ${
                activeFieldCount === 0
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              <Edit3 className="w-4 h-4" />
              <span>Terapkan Perubahan Masal ({selectedCount})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
