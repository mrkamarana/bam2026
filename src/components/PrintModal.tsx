import React from 'react';
import { X, Printer } from 'lucide-react';

interface PrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const PrintModal: React.FC<PrintModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      id="print-modal-root"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static print:overflow-visible"
    >
      <div
        id="print-modal-box"
        className="bg-white border border-slate-300 rounded-lg max-w-5xl w-full max-h-[96vh] flex flex-col shadow-2xl overflow-hidden print:border-none print:shadow-none print:max-w-none print:max-h-none print:rounded-none print:bg-white print:m-0 print:p-0 print:w-full"
      >
        {/* Header (Hidden in Print) */}
        <div className="p-3 bg-slate-900 text-white flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <Printer className="w-4 h-4 text-blue-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-tight">{title} - Pratinjau Dokumen Cetak</h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-trigger-print-action"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded transition shadow-2xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak / Simpan PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 text-slate-300 hover:text-white rounded hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Paper Area */}
        <div
          id="printable-paper-wrapper"
          className="flex-1 overflow-y-auto p-3 sm:p-6 bg-slate-100 print:p-0 print:bg-white print:overflow-visible"
        >
          <div
            id="printable-document"
            className="bg-white rounded shadow-sm border border-slate-200 print:shadow-none print:border-none print:rounded-none print:p-0 print:m-0 print:w-full"
          >
            {children}
          </div>
        </div>

        {/* Footer info (Hidden in Print) */}
        <div className="p-2.5 bg-slate-50 border-t border-slate-200 text-center text-[11px] text-slate-600 print:hidden flex flex-col sm:flex-row items-center justify-between gap-1 px-4">
          <span className="font-medium">💡 Hasil cetak / simpan PDF akan 100% identik dengan tampilan lembar dokumen di atas.</span>
          <span className="text-slate-500">Pilih tujuan <strong>"Save as PDF"</strong> / <strong>"Simpan sebagai PDF"</strong> pada browser.</span>
        </div>
      </div>
    </div>
  );
};
