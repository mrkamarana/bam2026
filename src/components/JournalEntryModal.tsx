import React, { useState, useEffect } from 'react';
import { X, Save, BookOpen, Scale, AlertCircle } from 'lucide-react';
import { JournalEntry } from '../types';
import { CHART_OF_ACCOUNTS } from '../utils/accounting';
import { formatRupiah, getTodayDateString } from '../utils/formatters';

interface JournalEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (entry: JournalEntry) => void;
  initialData?: JournalEntry | null;
}

export const JournalEntryModal: React.FC<JournalEntryModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const [date, setDate] = useState(getTodayDateString());
  const [refNo, setRefNo] = useState('');
  const [description, setDescription] = useState('');
  const [debitAccountCode, setDebitAccountCode] = useState('6-101');
  const [creditAccountCode, setCreditAccountCode] = useState('1-101');
  const [amount, setAmount] = useState<number>(0);

  useEffect(() => {
    if (initialData) {
      setDate(initialData.date || getTodayDateString());
      setRefNo(initialData.refNo || '');
      setDescription(initialData.description || '');
      setDebitAccountCode(initialData.debitAccountCode || '6-101');
      setCreditAccountCode(initialData.creditAccountCode || '1-101');
      setAmount(initialData.amount || 0);
    } else {
      setDate(getTodayDateString());
      setRefNo(`ADJ-${Date.now().toString().slice(-4)}`);
      setDescription('');
      setDebitAccountCode('6-101');
      setCreditAccountCode('1-101');
      setAmount(0);
    }
  }, [initialData, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      alert('Silakan masukkan Keterangan Transaksi');
      return;
    }
    if (amount <= 0) {
      alert('Nominal ayat jurnal harus lebih dari 0');
      return;
    }
    if (debitAccountCode === creditAccountCode) {
      alert('Akun Debit dan Akun Kredit tidak boleh sama!');
      return;
    }

    const debitAcc = CHART_OF_ACCOUNTS.find((a) => a.code === debitAccountCode);
    const creditAcc = CHART_OF_ACCOUNTS.find((a) => a.code === creditAccountCode);

    const savedEntry: JournalEntry = {
      id: initialData?.id || `jrn-custom-${Date.now()}`,
      date,
      refNo: refNo.trim() || `JRN-${Date.now().toString().slice(-4)}`,
      description: description.trim(),
      debitAccountCode,
      debitAccountName: debitAcc ? debitAcc.name : 'Akun Debit',
      creditAccountCode,
      creditAccountName: creditAcc ? creditAcc.name : 'Akun Kredit',
      amount,
      sourceType: initialData?.sourceType || 'manual',
      sourceId: initialData?.sourceId,
      isCustomOrEdited: true,
    };

    onSave(savedEntry);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white px-5 py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-indigo-400">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide">
                {initialData ? 'Edit Ayat Jurnal Umum' : 'Tambah Ayat Jurnal Penyesuaian'}
              </h2>
              <p className="text-[10px] text-slate-300">
                Pencatatan pembukuan double-entry (Debit & Kredit) terintegrasi ke Buku Besar & Neraca Saldo
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
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs text-slate-700">
          {/* Row 1: Tanggal & No. Bukti */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Tanggal Ayat Jurnal <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 bg-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                No. Bukti / Referensi
              </label>
              <input
                type="text"
                placeholder="Contoh: ADJ-001 / BKK-01"
                value={refNo}
                onChange={(e) => setRefNo(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 bg-white"
              />
            </div>
          </div>

          {/* Row 2: Keterangan */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Keterangan Transaksi / Narasi Jurnal <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={2}
              placeholder="Deskripsikan transaksi secara lengkap..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 bg-white resize-none"
            />
          </div>

          {/* Row 3: Akun Debit & Akun Kredit */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700">
              <Scale className="w-3.5 h-3.5 text-indigo-600" />
              <span>Struktur Pembukuan Double Entry (Debit vs Kredit)</span>
            </div>

            {/* Debit Account */}
            <div>
              <label className="block text-[10px] font-bold text-emerald-800 mb-1">
                (D) Akun DEBIT <span className="text-rose-500">*</span>
              </label>
              <select
                value={debitAccountCode}
                onChange={(e) => setDebitAccountCode(e.target.value)}
                className="w-full px-3 py-2 border border-emerald-300 bg-emerald-50/40 rounded-lg text-xs font-semibold text-emerald-950 focus:ring-2 focus:ring-emerald-500"
              >
                {CHART_OF_ACCOUNTS.map((a) => (
                  <option key={`debit-${a.code}`} value={a.code}>
                    [{a.code}] {a.name} ({a.category})
                  </option>
                ))}
              </select>
            </div>

            {/* Credit Account */}
            <div>
              <label className="block text-[10px] font-bold text-blue-800 mb-1">
                (K) Akun KREDIT <span className="text-rose-500">*</span>
              </label>
              <select
                value={creditAccountCode}
                onChange={(e) => setCreditAccountCode(e.target.value)}
                className="w-full px-3 py-2 border border-blue-300 bg-blue-50/40 rounded-lg text-xs font-semibold text-blue-950 focus:ring-2 focus:ring-blue-500"
              >
                {CHART_OF_ACCOUNTS.map((a) => (
                  <option key={`credit-${a.code}`} value={a.code}>
                    [{a.code}] {a.name} ({a.category})
                  </option>
                ))}
              </select>
            </div>

            {/* Nominal Amount */}
            <div>
              <label className="block text-[10px] font-bold text-slate-700 mb-1">
                Nominal / Jumlah Transaksi (Rp) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  step="any"
                  required
                  value={amount || ''}
                  onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 text-right focus:ring-2 focus:ring-indigo-500 bg-white"
                  placeholder="0"
                />
              </div>
              <p className="text-[10px] text-right font-semibold text-indigo-700 mt-1">
                Terbilang: {formatRupiah(amount)}
              </p>
            </div>
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
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-600/20 active:scale-95 transition-all text-xs"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{initialData ? 'Simpan Perubahan' : 'Simpan Ayat Jurnal'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
