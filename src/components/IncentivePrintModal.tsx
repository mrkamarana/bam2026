import React from 'react';
import { CompanyProfile, IncentiveRecord } from '../types';
import { formatDateIndo, formatNumber, formatRupiah, terbilang } from '../utils/formatters';
import { PrintModal } from './PrintModal';

interface IncentivePrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  incentive: IncentiveRecord | null;
  companyProfile: CompanyProfile;
}

export const IncentivePrintModal: React.FC<IncentivePrintModalProps> = ({
  isOpen,
  onClose,
  incentive,
  companyProfile,
}) => {
  if (!incentive) return null;

  return (
    <PrintModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Bukti Pembayaran Insentif - ${incentive.calculationNumber}`}
    >
      <div id="incentive-print-sheet" className="p-8 bg-white text-slate-800 font-sans text-xs leading-relaxed max-w-4xl mx-auto">
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
            <span className={`inline-block px-3 py-1 font-bold text-xs rounded tracking-wider border uppercase ${
              incentive.status === 'Dibayar' || incentive.paymentStatus === 'Dibayar'
                ? 'bg-emerald-100 text-emerald-900 border-emerald-400'
                : 'bg-amber-100 text-amber-900 border-amber-400'
            }`}>
              {incentive.status === 'Dibayar' || incentive.paymentStatus === 'Dibayar'
                ? 'BUKTI PEMBAYARAN INSENTIF'
                : 'VOUCHER / PENGAJUAN INSENTIF'}
            </span>
            <p className="text-xs font-mono font-bold text-slate-900 mt-2">{incentive.calculationNumber}</p>
            <p className="text-[11px] text-slate-500">Tgl Hitung: {formatDateIndo(incentive.date)}</p>
            {incentive.paymentDate && (
              <p className="text-[11px] font-semibold text-emerald-800">
                Tgl Bayar: {formatDateIndo(incentive.paymentDate)}
              </p>
            )}
          </div>
        </div>

        {/* Incentive Info Header */}
        <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200 mb-6 text-xs">
          <div className="space-y-1.5">
            <div className="flex">
              <span className="w-32 text-slate-500">Nama Penerima:</span>
              <span className="font-bold text-slate-900">{incentive.employeeName}</span>
            </div>
            <div className="flex">
              <span className="w-32 text-slate-500">Jabatan / Peran:</span>
              <span className="font-semibold text-slate-800">{incentive.employeeRole}</span>
            </div>
            <div className="flex">
              <span className="w-32 text-slate-500">Status Pembayaran:</span>
              <span className={`font-bold ${
                incentive.status === 'Dibayar' || incentive.paymentStatus === 'Dibayar'
                  ? 'text-emerald-700'
                  : 'text-amber-700'
              }`}>
                {incentive.status === 'Dibayar' || incentive.paymentStatus === 'Dibayar'
                  ? 'LUNAS / SUDAH DIBAYAR'
                  : 'BELUM DIBAYAR (MENUNGGU PENCAIRAN)'}
              </span>
            </div>
            {incentive.paymentMethod && (
              <div className="flex">
                <span className="w-32 text-slate-500">Metode Bayar:</span>
                <span className="font-medium text-slate-800">
                  {incentive.paymentMethod}
                  {incentive.bankName ? ` (${incentive.bankName} - ${incentive.bankAccount || ''})` : ''}
                </span>
              </div>
            )}
            {incentive.paymentReference && (
              <div className="flex">
                <span className="w-32 text-slate-500">No Referensi:</span>
                <span className="font-mono text-slate-800">{incentive.paymentReference}</span>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex">
              <span className="w-36 text-slate-500">Periode Penjualan:</span>
              <span className="font-bold text-slate-900">
                {formatDateIndo(incentive.startDate)} s/d {formatDateIndo(incentive.endDate)}
              </span>
            </div>
            <div className="flex">
              <span className="w-36 text-slate-500">Tarif Insentif:</span>
              <span className="font-bold text-blue-700">
                {incentive.rateType === 'per_unit_volume'
                  ? `${formatRupiah(incentive.ratePerUnit)} / unit volume (m³/ton)`
                  : incentive.rateType === 'percentage_sales'
                  ? `${incentive.ratePercentage || 0}% dari Omset Penjualan`
                  : `${formatRupiah(incentive.ratePerTrip || 0)} / trip`}
              </span>
            </div>
            <div className="flex">
              <span className="w-36 text-slate-500">Barang Terpilih:</span>
              <span className="text-slate-700 text-[11px] truncate max-w-xs" title={incentive.selectedItemNames.join(', ')}>
                {incentive.selectedItemNames.length === 0
                  ? 'Semua Jenis Barang'
                  : `${incentive.selectedItemNames.length} jenis barang`}
              </span>
            </div>
            <div className="flex">
              <span className="w-36 text-slate-500">Tujuan Pengiriman:</span>
              <span className="text-slate-700 text-[11px] truncate max-w-xs" title={incentive.selectedDestinations.join(', ')}>
                {incentive.selectedDestinations.length === 0
                  ? 'Semua Lokasi Tujuan'
                  : `${incentive.selectedDestinations.length} lokasi tujuan`}
              </span>
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="mb-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase">
            Rincian Volume Pengiriman & Surat Jalan Terhitung
          </h2>
          <p className="text-[11px] text-slate-500">
            Daftar surat jalan yang menjadi dasar perhitungan insentif pembayaran terpisah:
          </p>
        </div>

        {/* Table of Matched Sales */}
        <div className="border border-slate-300 rounded overflow-hidden mb-6">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold">
                <th className="py-2 px-2.5 text-center w-8">No</th>
                <th className="py-2 px-2.5">Tanggal</th>
                <th className="py-2 px-2.5">No Surat Jalan</th>
                <th className="py-2 px-2.5">Nama Barang</th>
                <th className="py-2 px-2.5">Tujuan Pengiriman</th>
                <th className="py-2 px-2.5">Sopir / Nopol</th>
                <th className="py-2 px-2.5 text-right">Volume</th>
                <th className="py-2 px-2.5 text-right">Tarif</th>
                <th className="py-2 px-2.5 text-right">Nilai Insentif</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {incentive.matchedSales.map((sale, idx) => (
                <tr key={sale.saleId || idx} className="hover:bg-slate-50">
                  <td className="py-2 px-2.5 text-center text-slate-500">{idx + 1}</td>
                  <td className="py-2 px-2.5 whitespace-nowrap">{formatDateIndo(sale.date)}</td>
                  <td className="py-2 px-2.5 font-mono font-medium text-slate-900">{sale.deliveryNoteNumber}</td>
                  <td className="py-2 px-2.5 text-slate-800">{sale.itemName}</td>
                  <td className="py-2 px-2.5 text-slate-600">{sale.destination}</td>
                  <td className="py-2 px-2.5 text-slate-600">
                    {sale.driverName || '-'} {sale.vehiclePlate ? `(${sale.vehiclePlate})` : ''}
                  </td>
                  <td className="py-2 px-2.5 text-right font-bold text-slate-900">
                    {formatNumber(sale.volume)} {sale.unit}
                  </td>
                  <td className="py-2 px-2.5 text-right text-slate-600">
                    {formatRupiah(sale.rateApplied)}
                  </td>
                  <td className="py-2 px-2.5 text-right font-bold text-emerald-700">
                    {formatRupiah(sale.incentiveAmount)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-100 font-bold border-t-2 border-slate-300 text-slate-900">
                <td colSpan={6} className="py-2.5 px-3 text-right uppercase tracking-wider">
                  TOTAL AKUMULASI INSENTIF ({incentive.matchedSales.length} SURAT JALAN):
                </td>
                <td className="py-2.5 px-2.5 text-right text-blue-700 font-mono text-xs">
                  {formatNumber(incentive.totalVolume)} Unit
                </td>
                <td></td>
                <td className="py-2.5 px-2.5 text-right text-emerald-800 text-sm font-mono">
                  {formatRupiah(incentive.totalIncentiveAmount)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Terbilang Box */}
        <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 mb-8 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">
              Terbilang:
            </span>
            <span className="text-xs font-semibold italic text-slate-800">
              "{terbilang(incentive.totalIncentiveAmount)}"
            </span>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">
              Total Insentif Bersih:
            </span>
            <span className="text-base font-bold text-emerald-700 font-mono">
              {formatRupiah(incentive.totalIncentiveAmount)}
            </span>
          </div>
        </div>

        {/* Notes */}
        {incentive.notes && (
          <div className="mb-6 p-3 bg-amber-50 rounded border border-amber-200 text-xs text-amber-900">
            <span className="font-bold">Catatan:</span> {incentive.notes}
          </div>
        )}

        {/* Signatures */}
        <div className="grid grid-cols-4 gap-4 text-center text-xs mt-8 pt-4 border-t border-slate-200">
          <div>
            <p className="text-slate-500 mb-14">Dibuat / Dihitung,</p>
            <p className="font-bold text-slate-900 border-b border-slate-400 inline-block px-3 pb-0.5">
              ( ............................. )
            </p>
            <p className="text-[10px] text-slate-500 mt-1">Admin / Logistik</p>
          </div>

          <div>
            <p className="text-slate-500 mb-14">Disetujui,</p>
            <p className="font-bold text-slate-900 border-b border-slate-400 inline-block px-3 pb-0.5">
              {companyProfile.signatoryName || 'Direktur Utama'}
            </p>
            <p className="text-[10px] text-slate-500 mt-1">{companyProfile.signatoryRole || 'Pimpinan Perusahaan'}</p>
          </div>

          <div>
            <p className="text-slate-500 mb-14">Dibayarkan Oleh,</p>
            <p className="font-bold text-slate-900 border-b border-slate-400 inline-block px-3 pb-0.5">
              ( ............................. )
            </p>
            <p className="text-[10px] text-slate-500 mt-1">Kasir / Keuangan</p>
          </div>

          <div>
            <p className="text-slate-500 mb-14">Diterima Oleh,</p>
            <p className="font-bold text-slate-900 border-b border-slate-400 inline-block px-3 pb-0.5">
              {incentive.employeeName}
            </p>
            <p className="text-[10px] text-slate-500 mt-1">{incentive.employeeRole}</p>
          </div>
        </div>
      </div>
    </PrintModal>
  );
};
