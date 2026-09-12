import React, { useState, useEffect } from 'react';
import { X, Save, Calculator, AlertCircle, FileText, Tag, Layers } from 'lucide-react';
import { OperationalExpense } from '../types';
import { CHART_OF_ACCOUNTS } from '../utils/accounting';
import { formatRupiah, getTodayDateString } from '../utils/formatters';

interface ManualTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: Omit<OperationalExpense, 'id'>, editId?: string) => void;
  initialData?: OperationalExpense | null;
}

const COMMON_UNITS = [
  'Ls', 'Bln', 'Liter', 'Rim', 'Pcs', 'Org', 'Jam', 'Trip', 'Hari', 'Unit', 'Sak', 'm3', 'Ton', 'Kg', 'Paket'
];

export const ManualTransactionModal: React.FC<ManualTransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const [date, setDate] = useState(getTodayDateString());
  const [accountCode, setAccountCode] = useState('6-101');
  const [transactionName, setTransactionName] = useState('');
  const [quantity, setQuantity] = useState<number>(1);
  const [unit, setUnit] = useState('Ls');
  const [pricePerUnit, setPricePerUnit] = useState<number>(0);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'Kas & Bank' | 'Hutang'>('Kas & Bank');
  const [category, setCategory] = useState('BBM & Armada');
  const [notes, setNotes] = useState('');
  const [taxType, setTaxType] = useState<'None' | 'PPh 21' | 'PPh 23' | 'PPh 4(2)'>('None');
  const [taxRate, setTaxRate] = useState<number>(0);

  useEffect(() => {
    if (initialData) {
      setDate(initialData.date || getTodayDateString());
      setAccountCode(initialData.accountCode || '6-101');
      setTransactionName(initialData.transactionName || initialData.description || '');
      setQuantity(initialData.quantity || 1);
      setUnit(initialData.unit || 'Ls');
      setPricePerUnit(initialData.pricePerUnit || initialData.amount || 0);
      setTotalAmount(initialData.amount || (initialData.quantity ? initialData.quantity * (initialData.pricePerUnit || 0) : 0));
      setPaymentMethod(initialData.paymentMethod || 'Kas & Bank');
      setCategory(initialData.category || 'BBM & Armada');
      setNotes(initialData.notes || initialData.description || '');
      setTaxType(initialData.withholdingTaxType || 'None');
      setTaxRate(initialData.withholdingRate || 0);
    } else {
      setDate(getTodayDateString());
      setAccountCode('6-101');
      setTransactionName('');
      setQuantity(1);
      setUnit('Ls');
      setPricePerUnit(0);
      setTotalAmount(0);
      setPaymentMethod('Kas & Bank');
      setCategory('BBM & Armada');
      setNotes('');
      setTaxType('None');
      setTaxRate(0);
    }
  }, [initialData, isOpen]);

  // Recalculate total when quantity or pricePerUnit changes
  const handleQuantityChange = (val: number) => {
    setQuantity(val);
    setTotalAmount(Math.round(val * pricePerUnit));
  };

  const handlePriceChange = (val: number) => {
    setPricePerUnit(val);
    setTotalAmount(Math.round(quantity * val));
  };

  const handleAccountChange = (code: string) => {
    setAccountCode(code);
    const selectedAcc = CHART_OF_ACCOUNTS.find((a) => a.code === code);
    if (selectedAcc) {
      // Auto-assign category
      if (selectedAcc.category === 'Beban') {
        setCategory(selectedAcc.name.replace(/^Beban\s+/i, ''));
      } else {
        setCategory(selectedAcc.name);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transactionName.trim()) {
      alert('Silakan masukkan Nama Transaksi');
      return;
    }
    if (totalAmount <= 0) {
      alert('Total nominal transaksi harus lebih dari 0');
      return;
    }

    const selectedAcc = CHART_OF_ACCOUNTS.find((a) => a.code === accountCode);
    const accName = selectedAcc ? selectedAcc.name : 'Beban Operasional';

    let withholdingAmount = 0;
    if (taxType !== 'None' && taxRate > 0) {
      withholdingAmount = Math.round((totalAmount * taxRate) / 100);
    }

    const transactionData: Omit<OperationalExpense, 'id'> = {
      date,
      accountCode,
      accountName: accName,
      transactionName: transactionName.trim(),
      quantity: Number(quantity) || 1,
      unit: unit.trim() || 'Ls',
      pricePerUnit: Number(pricePerUnit) || totalAmount,
      amount: totalAmount,
      totalAmount: totalAmount,
      category,
      description: notes.trim() || transactionName.trim(),
      paymentMethod,
      notes: notes.trim(),
      withholdingTaxType: taxType,
      withholdingRate: taxRate,
      withholdingAmount,
      createdAt: initialData?.createdAt || new Date().toISOString(),
    };

    onSave(transactionData, initialData?.id);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 text-white px-5 py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide">
                {initialData ? 'Edit Rekap Transaksi Manual' : 'Tambah Transaksi Manual (Non-Sales / Pembelian)'}
              </h2>
              <p className="text-[10px] text-slate-300">
                Pencatatan transaksi manual yang terintegrasi otomatis ke Jurnal Umum & Laporan Keuangan
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-700/50 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs text-slate-700">
          {/* Row 1: Tanggal & Kode Akun */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Tanggal Transaksi <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Kode & Nama Akun (COA) <span className="text-rose-500">*</span>
              </label>
              <select
                value={accountCode}
                onChange={(e) => handleAccountChange(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white font-medium"
              >
                <optgroup label="6. Beban Operasional & Lapangan">
                  {CHART_OF_ACCOUNTS.filter((a) => a.code.startsWith('6-')).map((a) => (
                    <option key={a.code} value={a.code}>
                      [{a.code}] {a.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="1. Pembelian Aset / Perlengkapan">
                  {CHART_OF_ACCOUNTS.filter((a) => a.code.startsWith('1-') && a.code !== '1-101' && a.code !== '1-102').map((a) => (
                    <option key={a.code} value={a.code}>
                      [{a.code}] {a.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="4 / 7. Pendapatan Lain / Pemasukan">
                  {CHART_OF_ACCOUNTS.filter((a) => a.code.startsWith('4-') || a.code === '7-101').map((a) => (
                    <option key={a.code} value={a.code}>
                      [{a.code}] {a.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="3. Ekuitas & Prive">
                  {CHART_OF_ACCOUNTS.filter((a) => a.code.startsWith('3-')).map((a) => (
                    <option key={a.code} value={a.code}>
                      [{a.code}] {a.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="2. Pelunasan / Hutang">
                  {CHART_OF_ACCOUNTS.filter((a) => a.code.startsWith('2-')).map((a) => (
                    <option key={a.code} value={a.code}>
                      [{a.code}] {a.name}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>
          </div>

          {/* Row 2: Nama Transaksi */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Nama Transaksi <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Pengisian Solar Dexlite Dump Truck Tronton B 9182 UY"
              value={transactionName}
              onChange={(e) => setTransactionName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white"
            />
          </div>

          {/* Row 3: Rincian Kuantitas, Unit, Harga/Unit, Total */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700">
              <Calculator className="w-3.5 h-3.5 text-amber-600" />
              <span>Rincian Perhitungan (Jumlah x Harga/Unit = Total)</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div>
                <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                  Jumlah (Qty) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="0.01"
                  step="any"
                  required
                  value={quantity || ''}
                  onChange={(e) => handleQuantityChange(parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-right focus:ring-2 focus:ring-amber-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                  Unit / Satuan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Liter, Bln, Ls..."
                  list="unit-suggestions"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-amber-500 bg-white"
                />
                <datalist id="unit-suggestions">
                  {COMMON_UNITS.map((u) => (
                    <option key={u} value={u} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                  Harga / Unit (Rp) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  required
                  value={pricePerUnit || ''}
                  onChange={(e) => handlePriceChange(parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-right focus:ring-2 focus:ring-amber-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                  Total (Rp) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  required
                  value={totalAmount || ''}
                  onChange={(e) => setTotalAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 border border-amber-300 bg-amber-50/50 rounded-lg text-xs font-bold text-amber-950 text-right focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Quick Summary Pill */}
            <div className="flex items-center justify-between bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-[11px]">
              <span className="text-slate-500">Konfirmasi Kalkulasi:</span>
              <span className="font-bold text-slate-800">
                {quantity} {unit} &times; {formatRupiah(pricePerUnit)} ={' '}
                <span className="text-amber-700 font-extrabold">{formatRupiah(totalAmount)}</span>
              </span>
            </div>
          </div>

          {/* Row 4: Metode Pembayaran & Catatan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Metode Pembayaran
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as 'Kas & Bank' | 'Hutang')}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-amber-500 bg-white"
              >
                <option value="Kas & Bank">Kas & Bank (Tunai / Transfer Giro)</option>
                <option value="Hutang">Hutang (Belum Dibayar / Kredit)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Catatan / Keterangan Tambahan
              </label>
              <input
                type="text"
                placeholder="No. Nota / Kwitansi / Keterangan lokasi"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-amber-500 bg-white"
              />
            </div>
          </div>

          {/* Row 5: Pajak Potongan Opsional */}
          <div className="pt-1">
            <details className="border border-slate-200 rounded-lg p-2.5 bg-slate-50/50">
              <summary className="text-[11px] font-bold text-slate-700 cursor-pointer flex items-center justify-between">
                <span>Informasi Pemotongan Pajak PPh (Opsional)</span>
                <span className="text-[10px] text-slate-400 font-normal">Klik untuk buka</span>
              </summary>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2.5 pt-2 border-t border-slate-200">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                    Jenis Pemotongan Pajak
                  </label>
                  <select
                    value={taxType}
                    onChange={(e) => {
                      const t = e.target.value as 'None' | 'PPh 21' | 'PPh 23' | 'PPh 4(2)';
                      setTaxType(t);
                      if (t === 'PPh 21') setTaxRate(2.5);
                      else if (t === 'PPh 23') setTaxRate(2.0);
                      else if (t === 'PPh 4(2)') setTaxRate(1.75);
                      else setTaxRate(0);
                    }}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                  >
                    <option value="None">Tidak Ada Pemotongan (None)</option>
                    <option value="PPh 21">PPh 21 (Upah / Jasa Orang Pribadi / Sopir)</option>
                    <option value="PPh 23">PPh 23 (Jasa Sewa Alat / Service / Perbaikan)</option>
                    <option value="PPh 4(2)">PPh 4(2) (Sewa Tanah / Bangunan / Konstruksi)</option>
                  </select>
                </div>
                {taxType !== 'None' && (
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                      Tarif Pemotongan (%)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.1"
                        value={taxRate}
                        onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                        className="w-24 px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-right bg-white"
                      />
                      <span className="text-[11px] text-slate-500 font-medium">
                        = {formatRupiah(Math.round((totalAmount * taxRate) / 100))}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </details>
          </div>
        </form>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg border border-slate-300 text-slate-600 font-semibold hover:bg-slate-100 transition-colors text-xs"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-md shadow-amber-600/20 active:scale-95 transition-all text-xs"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{initialData ? 'Simpan Perubahan' : 'Simpan Transaksi'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
