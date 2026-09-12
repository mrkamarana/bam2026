import React, { useState } from 'react';
import {
  X,
  Edit3,
  Calendar,
  Building2,
  Layers,
  MapPin,
  Truck,
  User,
  DollarSign,
  CreditCard,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { ClientSupplier, MaterialItem, SaleTransaction } from '../types';
import { formatNumber, formatRupiah, getTodayDateString } from '../utils/formatters';

interface BulkEditSalesModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCount: number;
  totalVolume: number;
  totalAmount: number;
  clients: ClientSupplier[];
  materials: MaterialItem[];
  onApplyBulkEdit: (updates: Partial<SaleTransaction>) => void;
}

export const BulkEditSalesModal: React.FC<BulkEditSalesModalProps> = ({
  isOpen,
  onClose,
  selectedCount,
  totalVolume,
  totalAmount,
  clients,
  materials,
  onApplyBulkEdit,
}) => {
  // Enabled toggles for each field to override
  const [enabledFields, setEnabledFields] = useState<{
    date: boolean;
    poNumber: boolean;
    client: boolean;
    item: boolean;
    quarry: boolean;
    destination: boolean;
    price: boolean;
    paymentStatus: boolean;
    vehiclePlate: boolean;
    driverName: boolean;
    notes: boolean;
  }>({
    date: false,
    poNumber: false,
    client: false,
    item: false,
    quarry: false,
    destination: false,
    price: false,
    paymentStatus: false,
    vehiclePlate: false,
    driverName: false,
    notes: false,
  });

  // Form field values
  const [date, setDate] = useState(getTodayDateString());
  const [poNumber, setPoNumber] = useState('');
  const [clientId, setClientId] = useState('');
  const [clientName, setClientName] = useState('');
  const [itemId, setItemId] = useState('');
  const [itemName, setItemName] = useState('');
  const [unit, setUnit] = useState('m3');
  const [quarry, setQuarry] = useState('');
  const [destination, setDestination] = useState('');
  const [price, setPrice] = useState<number | ''>('');
  const [paymentStatus, setPaymentStatus] = useState<'Lunas' | 'Belum Lunas'>('Lunas');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [driverName, setDriverName] = useState('');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const toggleField = (fieldKey: keyof typeof enabledFields) => {
    setEnabledFields((prev) => ({
      ...prev,
      [fieldKey]: !prev[fieldKey],
    }));
  };

  const handleClientSelect = (cId: string) => {
    setClientId(cId);
    const selected = clients.find((c) => c.id === cId);
    if (selected) {
      setClientName(selected.name);
      if (selected.address && selected.address !== '-') {
        setDestination(selected.address);
      }
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
      if (price === '' || price === 0) setPrice(selected.sellingPrice);
    }
  };

  const activeFieldCount = Object.values(enabledFields).filter(Boolean).length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeFieldCount === 0) return;

    const updates: Partial<SaleTransaction> = {};

    if (enabledFields.date && date) {
      updates.date = date;
    }
    if (enabledFields.poNumber) {
      updates.poNumber = poNumber.trim();
    }
    if (enabledFields.client && clientName.trim()) {
      updates.clientName = clientName.trim();
      if (clientId) updates.clientId = clientId;
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
    if (enabledFields.vehiclePlate) {
      updates.vehiclePlate = vehiclePlate.trim();
    }
    if (enabledFields.driverName) {
      updates.driverName = driverName.trim();
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
            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Edit Masal Transaksi Penjualan</h3>
              <p className="text-xs text-slate-500">
                Memperbarui <strong>{selectedCount} data penjualan terpilih</strong> sekaligus
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
        <div className="px-5 py-2.5 bg-blue-50/70 border-b border-blue-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-blue-900">
            <Info className="w-4 h-4 text-blue-600 shrink-0" />
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
          {/* Row 1: Tanggal & No PO */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Tanggal */}
            <div
              className={`p-3 rounded-lg border transition ${
                enabledFields.date ? 'bg-blue-50/40 border-blue-300' : 'bg-slate-50/60 border-slate-200 opacity-75'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={enabledFields.date}
                    onChange={() => toggleField('date')}
                    className="w-3.5 h-3.5 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                  />
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" /> Ubah Tanggal Transaksi
                  </span>
                </label>
                {enabledFields.date && <span className="text-[10px] text-blue-600 font-bold uppercase">Aktif</span>}
              </div>
              <input
                type="date"
                disabled={!enabledFields.date}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={`w-full px-3 py-1.5 rounded border text-xs focus:outline-none transition ${
                  enabledFields.date
                    ? 'bg-white border-slate-300 focus:border-blue-600 text-slate-800'
                    : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              />
            </div>

            {/* No PO */}
            <div
              className={`p-3 rounded-lg border transition ${
                enabledFields.poNumber ? 'bg-blue-50/40 border-blue-300' : 'bg-slate-50/60 border-slate-200 opacity-75'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={enabledFields.poNumber}
                    onChange={() => toggleField('poNumber')}
                    className="w-3.5 h-3.5 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                  />
                  <span className="flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-slate-500" /> Ubah No. Purchase Order (PO)
                  </span>
                </label>
                {enabledFields.poNumber && <span className="text-[10px] text-blue-600 font-bold uppercase">Aktif</span>}
              </div>
              <input
                type="text"
                disabled={!enabledFields.poNumber}
                placeholder="Contoh: PO-2026/WIKA/008"
                value={poNumber}
                onChange={(e) => setPoNumber(e.target.value)}
                className={`w-full px-3 py-1.5 rounded border text-xs focus:outline-none transition ${
                  enabledFields.poNumber
                    ? 'bg-white border-slate-300 focus:border-blue-600 text-slate-800'
                    : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              />
            </div>
          </div>

          {/* Row 2: Klien / Pelanggan */}
          <div
            className={`p-3 rounded-lg border transition ${
              enabledFields.client ? 'bg-blue-50/40 border-blue-300' : 'bg-slate-50/60 border-slate-200 opacity-75'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                <input
                  type="checkbox"
                  checked={enabledFields.client}
                  onChange={() => toggleField('client')}
                  className="w-3.5 h-3.5 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <span className="flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-slate-500" /> Ubah Klien / Pelanggan
                </span>
              </label>
              {enabledFields.client && <span className="text-[10px] text-blue-600 font-bold uppercase">Aktif</span>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <select
                disabled={!enabledFields.client}
                value={clientId}
                onChange={(e) => handleClientSelect(e.target.value)}
                className={`px-3 py-1.5 rounded border text-xs focus:outline-none transition ${
                  enabledFields.client
                    ? 'bg-white border-slate-300 focus:border-blue-600 text-slate-800'
                    : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <option value="">-- Pilih dari Master Klien --</option>
                {clients
                  .filter((c) => c.type === 'klien')
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.isPKP ? '(WAPU/BUMN)' : ''}
                    </option>
                  ))}
              </select>
              <input
                type="text"
                disabled={!enabledFields.client}
                placeholder="Atau ketik nama klien..."
                value={clientName}
                onChange={(e) => {
                  setClientName(e.target.value);
                  setClientId('');
                }}
                className={`px-3 py-1.5 rounded border text-xs focus:outline-none transition ${
                  enabledFields.client
                    ? 'bg-white border-slate-300 focus:border-blue-600 text-slate-800'
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
                enabledFields.item ? 'bg-blue-50/40 border-blue-300' : 'bg-slate-50/60 border-slate-200 opacity-75'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={enabledFields.item}
                    onChange={() => toggleField('item')}
                    className="w-3.5 h-3.5 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                  />
                  <span className="flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-slate-500" /> Ubah Barang / Material
                  </span>
                </label>
                {enabledFields.item && <span className="text-[10px] text-blue-600 font-bold uppercase">Aktif</span>}
              </div>
              <div className="space-y-2">
                <select
                  disabled={!enabledFields.item}
                  value={itemId}
                  onChange={(e) => handleMaterialSelect(e.target.value)}
                  className={`w-full px-3 py-1.5 rounded border text-xs focus:outline-none transition ${
                    enabledFields.item
                      ? 'bg-white border-slate-300 focus:border-blue-600 text-slate-800'
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
                        ? 'bg-white border-slate-300 focus:border-blue-600 text-slate-800'
                        : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  />
                  <select
                    disabled={!enabledFields.item}
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className={`w-24 px-2 py-1.5 rounded border text-xs focus:outline-none transition ${
                      enabledFields.item
                        ? 'bg-white border-slate-300 focus:border-blue-600 text-slate-800'
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
                enabledFields.quarry ? 'bg-blue-50/40 border-blue-300' : 'bg-slate-50/60 border-slate-200 opacity-75'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={enabledFields.quarry}
                    onChange={() => toggleField('quarry')}
                    className="w-3.5 h-3.5 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                  />
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" /> Ubah Asal Quarry / Supplier
                  </span>
                </label>
                {enabledFields.quarry && <span className="text-[10px] text-blue-600 font-bold uppercase">Aktif</span>}
              </div>
              <input
                type="text"
                disabled={!enabledFields.quarry}
                placeholder="Contoh: Quarry Rumpin / Quarry Merak"
                value={quarry}
                onChange={(e) => setQuarry(e.target.value)}
                className={`w-full px-3 py-1.5 rounded border text-xs focus:outline-none transition ${
                  enabledFields.quarry
                    ? 'bg-white border-slate-300 focus:border-blue-600 text-slate-800'
                    : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              />
            </div>
          </div>

          {/* Row 4: Tujuan Pengiriman & Harga Jual Satuan */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Tujuan Pengiriman */}
            <div
              className={`p-3 rounded-lg border transition ${
                enabledFields.destination ? 'bg-blue-50/40 border-blue-300' : 'bg-slate-50/60 border-slate-200 opacity-75'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={enabledFields.destination}
                    onChange={() => toggleField('destination')}
                    className="w-3.5 h-3.5 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                  />
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" /> Ubah Tujuan Pengiriman / Proyek
                  </span>
                </label>
                {enabledFields.destination && <span className="text-[10px] text-blue-600 font-bold uppercase">Aktif</span>}
              </div>
              <input
                type="text"
                disabled={!enabledFields.destination}
                placeholder="Contoh: Proyek Tol IKN Segmen 3B"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className={`w-full px-3 py-1.5 rounded border text-xs focus:outline-none transition ${
                  enabledFields.destination
                    ? 'bg-white border-slate-300 focus:border-blue-600 text-slate-800'
                    : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              />
            </div>

            {/* Harga Jual Satuan */}
            <div
              className={`p-3 rounded-lg border transition ${
                enabledFields.price ? 'bg-blue-50/40 border-blue-300' : 'bg-slate-50/60 border-slate-200 opacity-75'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={enabledFields.price}
                    onChange={() => toggleField('price')}
                    className="w-3.5 h-3.5 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                  />
                  <span className="flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5 text-slate-500" /> Ubah Harga Jual Satuan (Rp)
                  </span>
                </label>
                {enabledFields.price && <span className="text-[10px] text-blue-600 font-bold uppercase">Aktif</span>}
              </div>
              <input
                type="number"
                disabled={!enabledFields.price}
                placeholder="Contoh: 185000"
                value={price}
                onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
                className={`w-full px-3 py-1.5 rounded border text-xs focus:outline-none transition ${
                  enabledFields.price
                    ? 'bg-white border-slate-300 focus:border-blue-600 text-slate-800'
                    : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              />
              {enabledFields.price && price !== '' && (
                <p className="text-[11px] text-blue-700 font-semibold mt-1">
                  Total Nilai (Rp) setiap baris akan otomatis dihitung ulang: <code>Volume × {formatRupiah(Number(price))}</code>
                </p>
              )}
            </div>
          </div>

          {/* Row 5: Status Pembayaran, Sopir & Plat */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Status Pembayaran */}
            <div
              className={`p-3 rounded-lg border transition ${
                enabledFields.paymentStatus ? 'bg-blue-50/40 border-blue-300' : 'bg-slate-50/60 border-slate-200 opacity-75'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={enabledFields.paymentStatus}
                    onChange={() => toggleField('paymentStatus')}
                    className="w-3.5 h-3.5 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                  />
                  <span className="flex items-center gap-1">
                    <CreditCard className="w-3.5 h-3.5 text-slate-500" /> Status Bayar
                  </span>
                </label>
                {enabledFields.paymentStatus && <span className="text-[10px] text-blue-600 font-bold uppercase">Aktif</span>}
              </div>
              <select
                disabled={!enabledFields.paymentStatus}
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value as 'Lunas' | 'Belum Lunas')}
                className={`w-full px-3 py-1.5 rounded border text-xs font-semibold focus:outline-none transition ${
                  enabledFields.paymentStatus
                    ? 'bg-white border-slate-300 focus:border-blue-600 text-slate-800'
                    : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <option value="Lunas">Lunas (Selesai)</option>
                <option value="Belum Lunas">Belum Lunas (Piutang)</option>
              </select>
            </div>

            {/* Nama Sopir */}
            <div
              className={`p-3 rounded-lg border transition ${
                enabledFields.driverName ? 'bg-blue-50/40 border-blue-300' : 'bg-slate-50/60 border-slate-200 opacity-75'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={enabledFields.driverName}
                    onChange={() => toggleField('driverName')}
                    className="w-3.5 h-3.5 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                  />
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-slate-500" /> Nama Sopir
                  </span>
                </label>
                {enabledFields.driverName && <span className="text-[10px] text-blue-600 font-bold uppercase">Aktif</span>}
              </div>
              <input
                type="text"
                disabled={!enabledFields.driverName}
                placeholder="Nama sopir armada..."
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                className={`w-full px-3 py-1.5 rounded border text-xs focus:outline-none transition ${
                  enabledFields.driverName
                    ? 'bg-white border-slate-300 focus:border-blue-600 text-slate-800'
                    : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              />
            </div>

            {/* No Polisi */}
            <div
              className={`p-3 rounded-lg border transition ${
                enabledFields.vehiclePlate ? 'bg-blue-50/40 border-blue-300' : 'bg-slate-50/60 border-slate-200 opacity-75'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={enabledFields.vehiclePlate}
                    onChange={() => toggleField('vehiclePlate')}
                    className="w-3.5 h-3.5 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                  />
                  <span className="flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5 text-slate-500" /> No. Plat Truk
                  </span>
                </label>
                {enabledFields.vehiclePlate && <span className="text-[10px] text-blue-600 font-bold uppercase">Aktif</span>}
              </div>
              <input
                type="text"
                disabled={!enabledFields.vehiclePlate}
                placeholder="Contoh: B 9123 TYZ"
                value={vehiclePlate}
                onChange={(e) => setVehiclePlate(e.target.value)}
                className={`w-full px-3 py-1.5 rounded border text-xs focus:outline-none transition ${
                  enabledFields.vehiclePlate
                    ? 'bg-white border-slate-300 focus:border-blue-600 text-slate-800'
                    : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              />
            </div>
          </div>

          {/* Row 6: Catatan */}
          <div
            className={`p-3 rounded-lg border transition ${
              enabledFields.notes ? 'bg-blue-50/40 border-blue-300' : 'bg-slate-50/60 border-slate-200 opacity-75'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                <input
                  type="checkbox"
                  checked={enabledFields.notes}
                  onChange={() => toggleField('notes')}
                  className="w-3.5 h-3.5 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <span className="flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-slate-500" /> Catatan Transaksi
                </span>
              </label>
              {enabledFields.notes && <span className="text-[10px] text-blue-600 font-bold uppercase">Aktif</span>}
            </div>
            <input
              type="text"
              disabled={!enabledFields.notes}
              placeholder="Catatan tambahan untuk transaksi penjualan..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={`w-full px-3 py-1.5 rounded border text-xs focus:outline-none transition ${
                enabledFields.notes
                  ? 'bg-white border-slate-300 focus:border-blue-600 text-slate-800'
                  : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            />
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
              id="btn-confirm-bulk-edit-sales"
              disabled={activeFieldCount === 0}
              onClick={handleSubmit}
              className={`flex items-center gap-1.5 px-4 py-2 rounded text-xs font-bold text-white transition shadow-2xs ${
                activeFieldCount === 0
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
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
