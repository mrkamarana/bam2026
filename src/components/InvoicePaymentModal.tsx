import React, { useState, useEffect } from 'react';
import {
  X,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { InvoicePaymentStatus, InvoiceRecord } from '../types';
import { formatDateIndo, formatRupiah, getTodayDateString, terbilang } from '../utils/formatters';

interface InvoicePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: InvoiceRecord | null;
  onSavePayment: (
    invoiceId: string,
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
}

export const InvoicePaymentModal: React.FC<InvoicePaymentModalProps> = ({
  isOpen,
  onClose,
  invoice,
  onSavePayment,
}) => {
  if (!isOpen || !invoice) return null;

  const targetTotal = invoice.isWapu && invoice.netReceivableAmount ? invoice.netReceivableAmount : invoice.totalAmount;

  const [status, setStatus] = useState<InvoicePaymentStatus>(invoice.status || 'Belum Lunas');
  const [amountPaid, setAmountPaid] = useState<number>(invoice.amountPaid || 0);
  const [paymentDate, setPaymentDate] = useState<string>(invoice.paymentDate || getTodayDateString());
  const [paymentReference, setPaymentReference] = useState<string>(invoice.paymentReference || '');
  const [notes, setNotes] = useState<string>(invoice.notes || '');
  const [syncSales, setSyncSales] = useState<boolean>(true);

  useEffect(() => {
    if (invoice) {
      setStatus(invoice.status || 'Belum Lunas');
      setAmountPaid(invoice.amountPaid || 0);
      setPaymentDate(invoice.paymentDate || getTodayDateString());
      setPaymentReference(invoice.paymentReference || '');
      setNotes(invoice.notes || '');
    }
  }, [invoice]);

  const handleStatusChange = (newStatus: InvoicePaymentStatus) => {
    setStatus(newStatus);
    if (newStatus === 'Lunas') {
      setAmountPaid(targetTotal);
    } else if (newStatus === 'Belum Lunas') {
      setAmountPaid(0);
    } else if (newStatus === 'Sebagian' && (amountPaid === 0 || amountPaid >= targetTotal)) {
      setAmountPaid(Math.round(targetTotal / 2));
    }
  };

  const handleAmountPaidChange = (value: number) => {
    const validValue = Math.max(0, Math.min(value, targetTotal * 2));
    setAmountPaid(validValue);
    if (validValue >= targetTotal && targetTotal > 0) {
      setStatus('Lunas');
    } else if (validValue > 0) {
      setStatus('Sebagian');
    } else {
      setStatus('Belum Lunas');
    }
  };

  const remainingAmount = Math.max(0, targetTotal - amountPaid);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSavePayment(invoice.id, {
      status,
      amountPaid,
      paymentDate: amountPaid > 0 ? paymentDate : getTodayDateString(),
      paymentAccountCode: '1-101',
      paymentReference: paymentReference.trim() || undefined,
      notes: notes.trim() || undefined,
      syncSales,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150">
        {/* Header Modal */}
        <div className="bg-emerald-800 text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-emerald-700 rounded">
              <CreditCard className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider">
                Catat Penerimaan Pembayaran / Pelunasan
              </h3>
              <p className="text-[10px] text-emerald-200">
                Invoice {invoice.invoiceNumber} (PO: {invoice.poNumber})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="text-emerald-300 hover:text-white p-1 rounded-md transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3.5 text-xs">
          {/* Card Info Tagihan */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Klien & Proyek:</span>
                <div className="font-bold text-slate-900">{invoice.clientName}</div>
                <div className="text-[11px] text-slate-600 font-mono">PO: {invoice.poNumber}</div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Total Nilai Tagihan:</span>
                <div className="font-black text-sm text-slate-900 font-mono">
                  {formatRupiah(targetTotal)}
                </div>
                {invoice.isWapu && (
                  <span className="inline-block text-[9px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.2 rounded">
                    Netto WAPU
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Status Selection */}
          <div>
            <label className="block text-slate-700 font-bold text-[11px] mb-1.5">
              Pilih Status Pelunasan:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleStatusChange('Belum Lunas')}
                className={`py-1.5 px-2 rounded text-xs font-bold border transition text-center ${
                  status === 'Belum Lunas'
                    ? 'bg-rose-50 border-rose-400 text-rose-800 shadow-xs ring-1 ring-rose-400'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Belum Lunas
              </button>
              <button
                type="button"
                onClick={() => handleStatusChange('Sebagian')}
                className={`py-1.5 px-2 rounded text-xs font-bold border transition text-center ${
                  status === 'Sebagian'
                    ? 'bg-amber-50 border-amber-400 text-amber-800 shadow-xs ring-1 ring-amber-400'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Sebagian (Cicilan)
              </button>
              <button
                type="button"
                onClick={() => handleStatusChange('Lunas')}
                className={`py-1.5 px-2 rounded text-xs font-bold border transition text-center ${
                  status === 'Lunas'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-xs ring-1 ring-emerald-500'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Lunas (100%)
              </button>
            </div>
          </div>

          {/* Input Jumlah yang Dibayar */}
          <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-lg space-y-2.5">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold text-emerald-950">
                  Jumlah yang Dibayar (Rp) *
                </label>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleAmountPaidChange(0)}
                    className="px-1.5 py-0.2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-[9px] font-semibold"
                  >
                    0%
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAmountPaidChange(Math.round(targetTotal * 0.5))}
                    className="px-1.5 py-0.2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-[9px] font-semibold"
                  >
                    50%
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAmountPaidChange(targetTotal)}
                    className="px-1.5 py-0.2 bg-emerald-200 hover:bg-emerald-300 text-emerald-900 rounded text-[9px] font-bold"
                  >
                    100% Lunas
                  </button>
                </div>
              </div>
              <input
                type="number"
                min="0"
                max={targetTotal * 2}
                required
                value={amountPaid}
                onChange={(e) => handleAmountPaidChange(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 border border-emerald-400 rounded font-mono font-bold text-xs text-slate-900 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              <div className="text-[10px] text-slate-600 mt-0.5 italic">
                Terbilang: {terbilang(amountPaid)} Rupiah
              </div>
            </div>

            {/* Sisa Piutang */}
            <div className="flex items-center justify-between pt-2 border-t border-emerald-200">
              <span className="text-[11px] font-bold text-slate-700">Sisa Piutang Usaha:</span>
              <span className={`font-mono font-black text-xs ${
                remainingAmount === 0 ? 'text-emerald-700' : 'text-rose-700'
              }`}>
                {formatRupiah(remainingAmount)}
              </span>
            </div>
          </div>

          {/* Payment Date & Reference */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-slate-700 font-bold text-[11px] mb-1">
                Tanggal Pembayaran *
              </label>
              <input
                type="date"
                required
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold text-[11px] mb-1">
                No. Bukti / Ref Transfer
              </label>
              <input
                type="text"
                placeholder="Contoh: TRF-BCA-9812"
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Catatan */}
          <div>
            <label className="block text-slate-700 font-bold text-[11px] mb-1">
              Catatan Pelunasan
            </label>
            <input
              type="text"
              placeholder="Keterangan transfer, nomor rekening tujuan, dsb..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Sync Checkbox */}
          <div className="p-2.5 bg-blue-50/60 rounded border border-blue-200 flex items-start gap-2">
            <input
              type="checkbox"
              id="chk-payment-sync-sales"
              checked={syncSales}
              onChange={(e) => setSyncSales(e.target.checked)}
              className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
            />
            <label htmlFor="chk-payment-sync-sales" className="text-[11px] text-slate-700 leading-tight cursor-pointer">
              <strong>Sinkronkan Status Transaksi Penjualan:</strong> Otomatis update status pembayaran transaksi surat jalan terkait di modul Penjualan & Laporan Keuangan.
            </label>
          </div>

          {/* Footer */}
          <div className="pt-2 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded border border-slate-300 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded shadow-xs transition flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Simpan Pembayaran</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
