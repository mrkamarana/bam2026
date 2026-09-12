import React, { useState, useEffect } from 'react';
import {
  X,
  FileCheck2,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Building,
  Calendar,
  Layers,
  HelpCircle,
} from 'lucide-react';
import {
  InvoicePaymentStatus,
  InvoiceRecord,
  TaxCalculationType,
} from '../types';
import {
  formatDateIndo,
  formatRupiah,
  getTodayDateString,
  terbilang,
} from '../utils/formatters';

interface SaveInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (invoice: Omit<InvoiceRecord, 'id' | 'createdAt'> & { id?: string; syncSales?: boolean }) => void;
  initialData?: Partial<InvoiceRecord>;
  defaultPoNumber: string;
  defaultClientName: string;
  defaultClientAddress?: string;
  defaultClientNPWP?: string;
  defaultDestination: string;
  defaultPeriodDescription: string;
  subtotal: number;
  taxType: TaxCalculationType;
  dppAmount: number;
  ppnRate: number;
  ppnAmount: number;
  pph22Rate: number;
  pph22Amount: number;
  isWapu: boolean;
  totalAmount: number;
  netReceivableAmount: number;
  itemSummaries: InvoiceRecord['itemSummaries'];
  deliveryNotes: InvoiceRecord['deliveryNotes'];
  saleIds?: string[];
  existingInvoiceId?: string;
}

export const SaveInvoiceModal: React.FC<SaveInvoiceModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  defaultPoNumber,
  defaultClientName,
  defaultClientAddress = '',
  defaultClientNPWP = '',
  defaultDestination,
  defaultPeriodDescription,
  subtotal,
  taxType,
  dppAmount,
  ppnRate,
  ppnAmount,
  pph22Rate,
  pph22Amount,
  isWapu,
  totalAmount,
  netReceivableAmount,
  itemSummaries,
  deliveryNotes,
  saleIds = [],
  existingInvoiceId,
}) => {
  const targetTotal = isWapu && netReceivableAmount ? netReceivableAmount : totalAmount;

  const [invoiceNumber, setInvoiceNumber] = useState(
    initialData?.invoiceNumber || `INV-${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${String(Math.floor(Math.random() * 900) + 100)}`
  );
  const [invoiceDate, setInvoiceDate] = useState(initialData?.invoiceDate || getTodayDateString());
  
  // Calculate 30 days due date default
  const defaultDueDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  const [dueDate, setDueDate] = useState(initialData?.dueDate || defaultDueDate());
  
  const [status, setStatus] = useState<InvoicePaymentStatus>(initialData?.status || 'Belum Lunas');
  const [amountPaid, setAmountPaid] = useState<number>(initialData?.amountPaid || 0);
  const [paymentDate, setPaymentDate] = useState<string>(initialData?.paymentDate || getTodayDateString());
  const [paymentAccountCode, setPaymentAccountCode] = useState<string>(initialData?.paymentAccountCode || '1-101');
  const [paymentReference, setPaymentReference] = useState<string>(initialData?.paymentReference || '');
  const [notes, setNotes] = useState<string>(initialData?.notes || '');
  const [syncSales, setSyncSales] = useState<boolean>(true);

  // Synchronize status with amount paid changes
  useEffect(() => {
    if (initialData) {
      if (initialData.invoiceNumber) setInvoiceNumber(initialData.invoiceNumber);
      if (initialData.invoiceDate) setInvoiceDate(initialData.invoiceDate);
      if (initialData.dueDate) setDueDate(initialData.dueDate);
      if (initialData.status) setStatus(initialData.status);
      if (initialData.amountPaid !== undefined) setAmountPaid(initialData.amountPaid);
      if (initialData.paymentDate) setPaymentDate(initialData.paymentDate);
      if (initialData.paymentReference) setPaymentReference(initialData.paymentReference);
      if (initialData.notes) setNotes(initialData.notes);
    }
  }, [initialData]);

  if (!isOpen) return null;

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

    onSave({
      ...(existingInvoiceId ? { id: existingInvoiceId } : {}),
      invoiceNumber: invoiceNumber.trim(),
      invoiceDate,
      dueDate,
      poNumber: defaultPoNumber,
      clientName: defaultClientName,
      clientAddress: defaultClientAddress,
      clientNPWP: defaultClientNPWP,
      destination: defaultDestination,
      periodDescription: defaultPeriodDescription,
      subtotal,
      taxType,
      dppAmount,
      ppnRate,
      ppnAmount,
      pph22Rate,
      pph22Amount,
      isWapu,
      totalAmount,
      netReceivableAmount,
      status,
      amountPaid,
      remainingAmount,
      paymentDate: amountPaid > 0 ? paymentDate : undefined,
      paymentAccountCode: '1-101',
      paymentAccountName: 'Kas & Bank',
      paymentReference: paymentReference.trim() || undefined,
      notes: notes.trim() || undefined,
      itemSummaries,
      deliveryNotes,
      saleIds,
      syncSales,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150">
        {/* Header Modal */}
        <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-600 rounded">
              <FileCheck2 className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider">
                {existingInvoiceId ? 'Perbarui Riwayat Invoice & Pembayaran' : 'Simpan Faktur Tagihan ke Riwayat Invoice'}
              </h3>
              <p className="text-[10px] text-slate-300">
                Terintegrasi langsung dengan Rekap Piutang Usaha & Laporan Keuangan
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="text-slate-400 hover:text-white p-1 rounded-md transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3.5 text-xs">
          {/* Info Ringkasan Tagihan */}
          <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div>
              <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wide block">
                Purchase Order & Klien:
              </span>
              <p className="text-xs font-bold text-slate-900 font-mono">{defaultPoNumber}</p>
              <p className="text-[11px] text-slate-700 font-medium">{defaultClientName}</p>
              <div className="text-[10px] text-slate-500 mt-0.5">
                Periode: {defaultPeriodDescription} ({deliveryNotes.length} Surat Jalan)
              </div>
            </div>

            <div className="text-left sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-blue-200">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">
                Total Tagihan {isWapu ? '(Netto WAPU)' : '(Bruto)'}:
              </span>
              <div className="text-base font-black text-blue-950 font-mono">
                {formatRupiah(targetTotal)}
              </div>
              {isWapu && (
                <div className="text-[10px] text-blue-700 font-medium">
                  Bruto: {formatRupiah(totalAmount)} (Potong PPh 22: {formatRupiah(pph22Amount)})
                </div>
              )}
            </div>
          </div>

          {/* Section 1: Nomor & Tanggal */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div>
              <label className="block text-slate-700 font-bold text-[11px] mb-1">
                Nomor Invoice / Faktur *
              </label>
              <input
                type="text"
                required
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono font-bold text-xs text-blue-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold text-[11px] mb-1">
                Tanggal Terbit Invoice *
              </label>
              <input
                type="date"
                required
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold text-[11px] mb-1">
                Tanggal Jatuh Tempo
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Section 2: Status Pelunasan & Pembayaran (Highlight) */}
          <div className="p-3 bg-slate-50 border border-slate-300 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                <span>Status Pembayaran & Jumlah yang Dibayar:</span>
              </span>
              <span className="text-[10px] text-slate-500 italic">
                Terhubung ke Kas & Bank (1-101) dan Piutang (1-102)
              </span>
            </div>

            {/* Status Selector Buttons */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleStatusChange('Belum Lunas')}
                className={`py-2 px-3 rounded-md text-xs font-bold border transition text-center flex flex-col items-center justify-center gap-0.5 ${
                  status === 'Belum Lunas'
                    ? 'bg-rose-50 border-rose-400 text-rose-800 shadow-xs ring-1 ring-rose-400'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span>Belum Lunas</span>
                <span className="text-[9px] font-normal opacity-80">(0% Dibayar)</span>
              </button>

              <button
                type="button"
                onClick={() => handleStatusChange('Sebagian')}
                className={`py-2 px-3 rounded-md text-xs font-bold border transition text-center flex flex-col items-center justify-center gap-0.5 ${
                  status === 'Sebagian'
                    ? 'bg-amber-50 border-amber-400 text-amber-800 shadow-xs ring-1 ring-amber-400'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span>Sebagian (DP / Cicilan)</span>
                <span className="text-[9px] font-normal opacity-80">(Parsial)</span>
              </button>

              <button
                type="button"
                onClick={() => handleStatusChange('Lunas')}
                className={`py-2 px-3 rounded-md text-xs font-bold border transition text-center flex flex-col items-center justify-center gap-0.5 ${
                  status === 'Lunas'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-xs ring-1 ring-emerald-500'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Lunas Penuh</span>
                </div>
                <span className="text-[9px] font-normal opacity-80">(100% Lunas)</span>
              </button>
            </div>

            {/* Input Nominal yang Dibayar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-slate-700">
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
                      className="px-1.5 py-0.2 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded text-[9px] font-semibold"
                    >
                      100%
                    </button>
                  </div>
                </div>
                <input
                  type="number"
                  min="0"
                  max={targetTotal * 2}
                  value={amountPaid}
                  onChange={(e) => handleAmountPaidChange(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono font-bold text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <div className="text-[10px] text-slate-500 mt-0.5">
                  Terbilang: <span className="italic font-medium">{terbilang(amountPaid)} Rupiah</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Sisa Piutang Belum Terbayar (Rp)
                </label>
                <div className={`px-2.5 py-1.5 rounded border font-mono font-black text-xs ${
                  remainingAmount === 0
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border-rose-200'
                }`}>
                  {formatRupiah(remainingAmount)}
                  {remainingAmount === 0 && <span className="ml-2 text-[10px] font-bold text-emerald-600">(LUNAS)</span>}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  Tercatat sebagai saldo Piutang Usaha di Neraca
                </div>
              </div>
            </div>

            {/* Payment Details if amountPaid > 0 */}
            {amountPaid > 0 && (
              <div className="pt-2 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-emerald-50/50 p-2.5 rounded border border-emerald-100">
                <div>
                  <label className="block text-[10px] font-bold text-emerald-900 mb-1">
                    Tanggal Penerimaan Pembayaran *
                  </label>
                  <input
                    type="date"
                    required
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full px-2 py-1 bg-white border border-emerald-300 rounded text-xs text-slate-800 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-emerald-900 mb-1">
                    No. Bukti Transfer / Giro / Ref Bank
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: TRF-BCA-8921 / BILYET GIRO"
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    className="w-full px-2 py-1 bg-white border border-emerald-300 rounded text-xs text-slate-800 placeholder:text-slate-400 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Catatan Tambahan */}
          <div>
            <label className="block text-slate-700 font-bold text-[11px] mb-1">
              Catatan / Keterangan Tagihan
            </label>
            <input
              type="text"
              placeholder="Catatan penagihan, nomor rekening pembayaran, atau perjanjian termin..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Sync Checkbox */}
          <div className="p-2.5 bg-blue-50/50 rounded border border-blue-200 flex items-start gap-2">
            <input
              type="checkbox"
              id="chk-sync-sales"
              checked={syncSales}
              onChange={(e) => setSyncSales(e.target.checked)}
              className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
            />
            <label htmlFor="chk-sync-sales" className="text-[11px] text-slate-700 leading-tight cursor-pointer">
              <strong>Sinkronkan Status Lunas pada Surat Jalan Penjualan:</strong> Jika invoice berstatus Lunas, seluruh transaksi surat jalan pada invoice ini akan otomatis diperbarui menjadi &quot;Lunas&quot; di daftar Penjualan & Laporan Keuangan.
            </label>
          </div>

          {/* Footer Buttons */}
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
              className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded shadow-xs transition flex items-center gap-1.5"
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              <span>{existingInvoiceId ? 'Simpan Perubahan' : 'Simpan ke Riwayat Invoice'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
