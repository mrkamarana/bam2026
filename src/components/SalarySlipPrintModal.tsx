import React from 'react';
import { CompanyProfile, SalaryRecord } from '../types';
import { formatDateIndo, formatNumber, formatRupiah, terbilang } from '../utils/formatters';
import { PrintModal } from './PrintModal';

interface SalarySlipPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  salary: SalaryRecord | null;
  companyProfile: CompanyProfile;
}

export const SalarySlipPrintModal: React.FC<SalarySlipPrintModalProps> = ({
  isOpen,
  onClose,
  salary,
  companyProfile,
}) => {
  if (!salary) return null;

  return (
    <PrintModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Slip Gaji - ${salary.slipNumber} (${salary.employeeName})`}
    >
      <div id="salary-slip-print-sheet" className="p-8 bg-white text-slate-800 font-sans text-xs leading-relaxed max-w-4xl mx-auto">
        {/* Letterhead */}
        <div className="flex items-start justify-between border-b-2 border-slate-800 pb-4 mb-6">
          <div className="flex items-center gap-4">
            {companyProfile.logoUrl ? (
              <div className="w-16 h-16 rounded overflow-hidden flex items-center justify-center p-1 border border-slate-200">
                <img src={companyProfile.logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
              </div>
            ) : (
              <div className="w-14 h-14 bg-slate-900 text-white font-bold text-xl flex items-center justify-center rounded">
                {companyProfile.name ? companyProfile.name.charAt(0) : 'P'}
              </div>
            )}
            <div>
              <h1 className="text-base font-bold text-slate-900 uppercase tracking-tight">{companyProfile.name}</h1>
              <p className="text-[11px] text-slate-600 max-w-md">{companyProfile.address}</p>
              <p className="text-[10px] text-slate-500">
                Telp: {companyProfile.phone} | Email: {companyProfile.email} | NPWP: {companyProfile.npwp}
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="inline-block px-3 py-1 bg-blue-100 text-blue-900 font-bold text-xs rounded tracking-wider border border-blue-300 uppercase">
              SLIP GAJI KARYAWAN
            </span>
            <p className="text-xs font-mono font-bold text-slate-900 mt-2">{salary.slipNumber}</p>
            <p className="text-[11px] text-slate-500">Periode: {salary.periodMonth}</p>
          </div>
        </div>

        {/* Employee Info Header */}
        <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200 mb-6 text-xs">
          <div className="space-y-1.5">
            <div className="flex">
              <span className="w-32 text-slate-500">Nama Karyawan:</span>
              <span className="font-bold text-slate-900">{salary.employeeName}</span>
            </div>
            <div className="flex">
              <span className="w-32 text-slate-500">NIK / ID Karyawan:</span>
              <span className="font-mono text-slate-800">{salary.employeeNik || '-'}</span>
            </div>
            <div className="flex">
              <span className="w-32 text-slate-500">Jabatan / Posisi:</span>
              <span className="font-semibold text-slate-800">{salary.employeeRole}</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex">
              <span className="w-36 text-slate-500">Rentang Periode:</span>
              <span className="font-medium text-slate-800">
                {formatDateIndo(salary.periodStartDate)} s/d {formatDateIndo(salary.periodEndDate)}
              </span>
            </div>
            <div className="flex">
              <span className="w-36 text-slate-500">Tanggal Pembayaran:</span>
              <span className="font-semibold text-slate-900">{formatDateIndo(salary.paymentDate)}</span>
            </div>
            <div className="flex">
              <span className="w-36 text-slate-500">Metode & Rekening:</span>
              <span className="text-slate-800">
                {salary.paymentMethod} {salary.bankName ? `(${salary.bankName} - ${salary.bankAccount})` : ''}
              </span>
            </div>
          </div>
        </div>

        {/* Earnings and Deductions 2-Column Grid */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* Earnings (Penghasilan) */}
          <div className="border border-slate-300 rounded-lg overflow-hidden flex flex-col justify-between">
            <div>
              <div className="bg-emerald-50 px-3.5 py-2 border-b border-slate-300 flex items-center justify-between">
                <span className="font-bold text-emerald-900 uppercase tracking-tight text-xs">
                  A. PENGHASILAN (EARNINGS)
                </span>
                <span className="text-[10px] text-emerald-700 font-semibold">Komponen Hak</span>
              </div>
              <div className="p-3 space-y-2 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span className="text-slate-700">1. Gaji Pokok</span>
                  <span className="font-mono font-semibold text-slate-900">{formatRupiah(salary.baseSalary)}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span className="text-slate-700">2. Tunjangan Transportasi</span>
                  <span className="font-mono text-slate-800">{formatRupiah(salary.transportAllowance)}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span className="text-slate-700">3. Tunjangan Makan</span>
                  <span className="font-mono text-slate-800">{formatRupiah(salary.mealAllowance)}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span className="text-slate-700">4. Tunjangan Jabatan</span>
                  <span className="font-mono text-slate-800">{formatRupiah(salary.positionAllowance)}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span className="text-slate-700">5. Tunjangan Kehadiran</span>
                  <span className="font-mono text-slate-800">{formatRupiah(salary.attendanceAllowance)}</span>
                </div>

                {/* Integrated Incentive Row (Only shown if paid together) */}
                {salary.incentiveAmount > 0 && (
                  <div className="py-2 px-2 bg-emerald-50/70 rounded border border-emerald-200">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-bold text-emerald-900">6. Insentif Penjualan</span>
                        {salary.incentiveSummary && (
                          <div className="text-[10px] text-emerald-700">
                            Volume: {formatNumber(salary.incentiveSummary.totalVolume)} Unit ({salary.incentiveSummary.salesCount} SJ) @ {formatRupiah(salary.incentiveSummary.ratePerUnit)}
                          </div>
                        )}
                      </div>
                      <span className="font-mono font-bold text-emerald-800 text-xs">
                        {formatRupiah(salary.incentiveAmount)}
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <div>
                    <span className="text-slate-700">Lembur ({salary.overtimeHours || 0} Jam)</span>
                  </div>
                  <span className="font-mono text-slate-800">{formatRupiah(salary.overtimeAmount)}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-700">Bonus / THR / Performa</span>
                  <span className="font-mono text-slate-800">{formatRupiah(salary.bonusAmount)}</span>
                </div>
              </div>
            </div>

            <div className="bg-emerald-100/70 p-2.5 border-t border-emerald-200 flex justify-between items-center font-bold text-xs text-emerald-950">
              <span>TOTAL PENGHASILAN BRUTO</span>
              <span className="font-mono text-sm">{formatRupiah(salary.grossSalary)}</span>
            </div>
          </div>

          {/* Deductions (Potongan) */}
          <div className="border border-slate-300 rounded-lg overflow-hidden flex flex-col justify-between">
            <div>
              <div className="bg-rose-50 px-3.5 py-2 border-b border-slate-300 flex items-center justify-between">
                <span className="font-bold text-rose-900 uppercase tracking-tight text-xs">
                  B. POTONGAN (DEDUCTIONS)
                </span>
                <span className="text-[10px] text-rose-700 font-semibold">Kewajiban / Iuran</span>
              </div>
              <div className="p-3 space-y-2 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span className="text-slate-700">1. BPJS Ketenagakerjaan</span>
                  <span className="font-mono text-slate-800">{formatRupiah(salary.bpjsKetenagakerjaan)}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span className="text-slate-700">2. BPJS Kesehatan</span>
                  <span className="font-mono text-slate-800">{formatRupiah(salary.bpjsKesehatan)}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span className="text-slate-700">3. Pajak Penghasilan (PPh 21)</span>
                  <span className="font-mono text-slate-800">{formatRupiah(salary.pph21Amount)}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span className="text-slate-700">4. Kasbon / Cicilan Pinjaman</span>
                  <span className="font-mono text-slate-800">{formatRupiah(salary.loanDeduction)}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span className="text-slate-700">5. Potongan Absensi / Telat</span>
                  <span className="font-mono text-slate-800">{formatRupiah(salary.lateDeduction)}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-700">6. Potongan Lainnya</span>
                  <span className="font-mono text-slate-800">{formatRupiah(salary.otherDeductions)}</span>
                </div>
              </div>
            </div>

            <div className="bg-rose-100/70 p-2.5 border-t border-rose-200 flex justify-between items-center font-bold text-xs text-rose-950">
              <span>TOTAL POTONGAN</span>
              <span className="font-mono text-sm">{formatRupiah(salary.totalDeductions)}</span>
            </div>
          </div>
        </div>

        {/* Take Home Pay Banner */}
        <div className="bg-blue-50 border-2 border-blue-400 rounded-lg p-4 mb-6 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-xs font-bold text-blue-900 uppercase tracking-wide block">
              GAJI BERSIH DITERIMA (TAKE HOME PAY):
            </span>
            <span className="text-xs italic text-blue-800">
              "{terbilang(salary.netSalary)}"
            </span>
          </div>
          <div className="text-right">
            <span className="text-xl font-bold font-mono text-blue-900">
              {formatRupiah(salary.netSalary)}
            </span>
            <span className="text-[10px] text-blue-700 font-semibold block">
              Status: {salary.status}
            </span>
          </div>
        </div>

        {/* Notes */}
        {salary.notes && (
          <div className="mb-6 p-2.5 bg-slate-50 rounded border border-slate-200 text-[11px] text-slate-600">
            <span className="font-bold text-slate-800">Keterangan:</span> {salary.notes}
          </div>
        )}

        {/* Signatures */}
        <div className="grid grid-cols-2 gap-12 text-center text-xs mt-8 pt-4 border-t border-slate-200">
          <div>
            <p className="text-slate-500 mb-16">Dibuat & Disetujui Oleh,</p>
            <p className="font-bold text-slate-900 border-b border-slate-400 inline-block px-6 pb-0.5">
              {companyProfile.signatoryName || 'H. Bambang Setiawan, S.T.'}
            </p>
            <p className="text-[10px] text-slate-500 mt-1">{companyProfile.signatoryRole || 'Direktur Utama'}</p>
          </div>

          <div>
            <p className="text-slate-500 mb-16">Karyawan Penerima,</p>
            <p className="font-bold text-slate-900 border-b border-slate-400 inline-block px-6 pb-0.5">
              {salary.employeeName}
            </p>
            <p className="text-[10px] text-slate-500 mt-1">{salary.employeeRole}</p>
          </div>
        </div>

        <div className="mt-8 pt-2 text-center text-[10px] text-slate-400 border-t border-dashed border-slate-200">
          Dokumen slip gaji ini dihasilkan secara otomatis oleh Sistem ERP & Keuangan {companyProfile.name}.
        </div>
      </div>
    </PrintModal>
  );
};
