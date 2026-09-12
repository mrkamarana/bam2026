import React, { useState, useMemo } from 'react';
import {
  X,
  Zap,
  Filter,
  CheckCircle2,
  Calendar,
  Layers,
  MapPin,
  Truck,
  DollarSign,
  Search,
  CheckSquare,
  Square,
  Sliders,
} from 'lucide-react';
import {
  Employee,
  MaterialItem,
  SaleTransaction,
} from '../types';
import {
  formatDateIndo,
  formatNumber,
  formatRupiah,
  getTodayDateString,
  normalizeDateToYMD,
} from '../utils/formatters';

interface QuickIncentiveCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
  sales: SaleTransaction[];
  materials: MaterialItem[];
  onApplyIncentive: (calculated: {
    amount: number;
    summary: {
      startDate: string;
      endDate: string;
      selectedItemNames: string[];
      selectedDestinations: string[];
      totalVolume: number;
      ratePerUnit: number;
      salesCount: number;
    };
  }) => void;
}

export const QuickIncentiveCalculatorModal: React.FC<QuickIncentiveCalculatorModalProps> = ({
  isOpen,
  onClose,
  employee,
  sales = [],
  materials = [],
  onApplyIncentive,
}) => {
  if (!isOpen || !employee) return null;

  // Derive initial dates (first day of month to today)
  const todayStr = getTodayDateString();
  const monthStartStr = `${todayStr.slice(0, 7)}-01`;

  const [startDate, setStartDate] = useState(monthStartStr);
  const [endDate, setEndDate] = useState(todayStr);

  // Available item names and destinations
  const allMaterialNames = useMemo(() => {
    const set = new Set<string>();
    materials.forEach((m) => set.add(m.name));
    sales.forEach((s) => set.add(s.itemName));
    return Array.from(set);
  }, [materials, sales]);

  const allDestinations = useMemo(() => {
    const set = new Set<string>();
    sales.forEach((s) => {
      if (s.destination) set.add(s.destination);
    });
    return Array.from(set);
  }, [sales]);

  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [selectedDestinations, setSelectedDestinations] = useState<string[]>([]);

  const [ratePerUnit, setRatePerUnit] = useState<number>(
    employee.defaultIncentiveRate && employee.defaultIncentiveRate > 0 ? employee.defaultIncentiveRate : 5000
  );

  const [searchSJ, setSearchSJ] = useState('');

  // Rate Resolver per Item & Destination based on Employee's custom rates
  const resolveRateForSale = (itemName: string, destination: string): { rate: number; isCustom: boolean } => {
    if (employee.customIncentiveRates && employee.customIncentiveRates.length > 0) {
      const exact = employee.customIncentiveRates.find(
        (r) =>
          r.itemName.trim().toLowerCase() === itemName.trim().toLowerCase() &&
          r.destination.trim().toLowerCase() === destination.trim().toLowerCase()
      );
      if (exact) return { rate: exact.ratePerUnit, isCustom: true };

      const itemOnly = employee.customIncentiveRates.find(
        (r) =>
          r.itemName.trim().toLowerCase() === itemName.trim().toLowerCase() &&
          (r.destination === '*' || !r.destination || r.destination.trim() === '')
      );
      if (itemOnly) return { rate: itemOnly.ratePerUnit, isCustom: true };

      const destOnly = employee.customIncentiveRates.find(
        (r) =>
          (r.itemName === '*' || !r.itemName || r.itemName.trim() === '') &&
          r.destination.trim().toLowerCase() === destination.trim().toLowerCase()
      );
      if (destOnly) return { rate: destOnly.ratePerUnit, isCustom: true };
    }
    return { rate: ratePerUnit, isCustom: false };
  };

  // Matched sales calculation
  const matchedSales = useMemo(() => {
    const startYMD = normalizeDateToYMD(startDate);
    const endYMD = normalizeDateToYMD(endDate);

    const list = sales.filter((s) => {
      const sDate = normalizeDateToYMD(s.date);
      if (startYMD && sDate < startYMD) return false;
      if (endYMD && sDate > endYMD) return false;

      // Filter Item Names
      if (selectedItems.length > 0 && !selectedItems.includes(s.itemName)) {
        return false;
      }

      // Filter Destinations
      if (selectedDestinations.length > 0 && !selectedDestinations.includes(s.destination)) {
        return false;
      }

      return true;
    });

    return list.map((s) => {
      const { rate, isCustom } = resolveRateForSale(s.itemName, s.destination);
      const volume = Number(s.volume) || 0;
      const incentive = volume * rate;
      return {
        ...s,
        resolvedRate: rate,
        isCustomRate: isCustom,
        incentiveAmount: incentive,
      };
    });
  }, [sales, startDate, endDate, selectedItems, selectedDestinations, employee.customIncentiveRates, ratePerUnit]);

  const filteredSalesForTable = useMemo(() => {
    if (!searchSJ) return matchedSales;
    const q = searchSJ.toLowerCase();
    return matchedSales.filter(
      (s) =>
        s.deliveryNoteNumber.toLowerCase().includes(q) ||
        s.itemName.toLowerCase().includes(q) ||
        s.destination.toLowerCase().includes(q) ||
        s.clientName.toLowerCase().includes(q) ||
        (s.driverName && s.driverName.toLowerCase().includes(q))
    );
  }, [matchedSales, searchSJ]);

  const totalVolume = useMemo(() => {
    return matchedSales.reduce((sum, s) => sum + (Number(s.volume) || 0), 0);
  }, [matchedSales]);

  const totalSalesAmount = useMemo(() => {
    return matchedSales.reduce((sum, s) => sum + (Number(s.totalAmount) || 0), 0);
  }, [matchedSales]);

  const totalCalculatedIncentive = useMemo(() => {
    return matchedSales.reduce((sum, s) => sum + s.incentiveAmount, 0);
  }, [matchedSales]);

  // Toggle item selection
  const toggleItem = (name: string) => {
    setSelectedItems((prev) =>
      prev.includes(name) ? prev.filter((i) => i !== name) : [...prev, name]
    );
  };

  const toggleDestination = (dest: string) => {
    setSelectedDestinations((prev) =>
      prev.includes(dest) ? prev.filter((d) => d !== dest) : [...prev, dest]
    );
  };

  const handleApply = () => {
    onApplyIncentive({
      amount: totalCalculatedIncentive,
      summary: {
        startDate,
        endDate,
        selectedItemNames: selectedItems,
        selectedDestinations,
        totalVolume,
        ratePerUnit,
        salesCount: matchedSales.length,
      },
    });
    onClose();
  };

  return (
    <div
      id="quick-incentive-modal-root"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto"
    >
      <div className="bg-white border border-slate-300 rounded-xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Kalkulator Insentif Otomatis dari Penjualan</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-blue-600/60 text-blue-200 border border-blue-400/30 font-normal">
                  {employee.name} ({employee.role})
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Hitung otomatis insentif berdasarkan volume penjualan pada rentang hari, nama barang & tujuan pengiriman
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs bg-slate-50">
          {/* Controls Grid */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Date Start */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  📅 Tanggal Mulai Penjualan
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs font-medium text-slate-800 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Date End */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  📅 Tanggal Akhir Penjualan
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs font-medium text-slate-800 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Rate per Unit */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  💰 Tarif Insentif per Unit (Rp/m³ atau ton)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-400 text-xs">
                    Rp
                  </span>
                  <input
                    type="number"
                    value={ratePerUnit}
                    onChange={(e) => setRatePerUnit(Number(e.target.value))}
                    min={0}
                    step={500}
                    className="w-full pl-8 pr-2.5 py-1.5 border border-slate-300 rounded-md text-xs font-bold text-blue-700 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
              <span className="text-slate-500">Preset Tanggal:</span>
              <button
                type="button"
                onClick={() => {
                  setStartDate(todayStr);
                  setEndDate(todayStr);
                }}
                className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
              >
                Hari Ini
              </button>
              <button
                type="button"
                onClick={() => {
                  setStartDate(monthStartStr);
                  setEndDate(todayStr);
                }}
                className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
              >
                Bulan Ini ({todayStr.slice(0, 7)})
              </button>
              <button
                type="button"
                onClick={() => {
                  setStartDate('2026-08-01');
                  setEndDate('2026-08-31');
                }}
                className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
              >
                Agustus 2026
              </button>
            </div>

            {/* Employee Custom Rates Badge / Information */}
            <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 bg-emerald-50/70 rounded-lg border border-emerald-200/80">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-700" />
                <span className="text-xs font-semibold text-emerald-950">
                  Tarif Insentif merujuk pada Master Data Karyawan (<strong>{employee.name}</strong>)
                </span>
              </div>
              {employee.customIncentiveRates && employee.customIncentiveRates.length > 0 ? (
                <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                  ✓ {employee.customIncentiveRates.length} Tarif Barang Khusus Aktif
                </span>
              ) : (
                <span className="text-[10px] text-slate-500">
                  Menggunakan tarif dasar standar
                </span>
              )}
            </div>

            {/* Filter Items (Multi-select) */}
            <div className="pt-2 border-t border-slate-100 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-slate-500" />
                  <span>Filter Berdasarkan Nama Barang (Material):</span>
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedItems([])}
                    className="text-[10px] text-blue-600 hover:underline"
                  >
                    Pilih Semua ({allMaterialNames.length})
                  </button>
                  {selectedItems.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedItems([])}
                      className="text-[10px] text-rose-600 hover:underline"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1.5 bg-slate-50 rounded-lg border border-slate-200">
                {allMaterialNames.map((name) => {
                  const isSelected = selectedItems.includes(name);
                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => toggleItem(name)}
                      className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors flex items-center gap-1 border ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      {isSelected ? (
                        <CheckSquare className="w-3 h-3 text-white" />
                      ) : (
                        <Square className="w-3 h-3 text-slate-400" />
                      )}
                      <span>{name}</span>
                    </button>
                  );
                })}
              </div>
              <p className="text-[10px] text-slate-500 italic">
                {selectedItems.length === 0
                  ? '✓ Semua barang material dimasukkan ke dalam perhitungan insentif.'
                  : `✓ ${selectedItems.length} jenis barang spesifik dipilih.`}
              </p>
            </div>

            {/* Filter Destinations (Multi-select) */}
            <div className="pt-2 border-t border-slate-100 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  <span>Filter Berdasarkan Tujuan Pengiriman:</span>
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedDestinations([])}
                    className="text-[10px] text-blue-600 hover:underline"
                  >
                    Pilih Semua ({allDestinations.length})
                  </button>
                  {selectedDestinations.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedDestinations([])}
                      className="text-[10px] text-rose-600 hover:underline"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1.5 bg-slate-50 rounded-lg border border-slate-200">
                {allDestinations.map((dest) => {
                  const isSelected = selectedDestinations.includes(dest);
                  return (
                    <button
                      key={dest}
                      type="button"
                      onClick={() => toggleDestination(dest)}
                      className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors flex items-center gap-1 border ${
                        isSelected
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      {isSelected ? (
                        <CheckSquare className="w-3 h-3 text-white" />
                      ) : (
                        <Square className="w-3 h-3 text-slate-400" />
                      )}
                      <span>{dest}</span>
                    </button>
                  );
                })}
              </div>
              <p className="text-[10px] text-slate-500 italic">
                {selectedDestinations.length === 0
                  ? '✓ Semua lokasi proyek tujuan dimasukkan ke dalam perhitungan insentif.'
                  : `✓ ${selectedDestinations.length} lokasi tujuan spesifik dipilih.`}
              </p>
            </div>
          </div>

          {/* Real-Time Live Calculation Output */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
              <span className="text-[10px] text-slate-500 uppercase font-semibold">Surat Jalan Cocok</span>
              <div className="text-base font-bold text-slate-900 mt-0.5">{matchedSales.length} Dokumen</div>
              <span className="text-[10px] text-slate-400">Pengiriman terverifikasi</span>
            </div>

            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
              <span className="text-[10px] text-slate-500 uppercase font-semibold">Total Volume Penjualan</span>
              <div className="text-base font-bold text-blue-700 mt-0.5 font-mono">
                {formatNumber(totalVolume)} Unit (m³/ton)
              </div>
              <span className="text-[10px] text-slate-400">Dasar kali insentif</span>
            </div>

            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
              <span className="text-[10px] text-slate-500 uppercase font-semibold">Nilai Omzet Penjualan</span>
              <div className="text-base font-bold text-slate-800 mt-0.5 font-mono">
                {formatRupiah(totalSalesAmount)}
              </div>
              <span className="text-[10px] text-slate-400">DPP Material</span>
            </div>

            <div className="bg-emerald-50 p-3 rounded-lg border-2 border-emerald-300 shadow-2xs">
              <span className="text-[10px] text-emerald-800 uppercase font-bold">TOTAL NILAI INSENTIF</span>
              <div className="text-lg font-bold text-emerald-800 mt-0.5 font-mono">
                {formatRupiah(totalCalculatedIncentive)}
              </div>
              <span className="text-[10px] text-emerald-700 font-semibold">
                {employee.customIncentiveRates && employee.customIncentiveRates.length > 0
                  ? 'Kombinasi tarif barang khusus & dasar'
                  : `= ${formatNumber(totalVolume)} m³ × ${formatRupiah(ratePerUnit)}`}
              </span>
            </div>
          </div>

          {/* Table of Matched Sales */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="p-2.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-blue-600" />
                <span>Rincian Surat Jalan ({matchedSales.length} Transaksi)</span>
              </span>
              <div className="w-56 relative">
                <Search className="w-3.5 h-3.5 absolute left-2 top-2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari SJ, barang, tujuan..."
                  value={searchSJ}
                  onChange={(e) => setSearchSJ(e.target.value)}
                  className="w-full pl-7 pr-2 py-1 bg-white border border-slate-300 rounded text-xs"
                />
              </div>
            </div>

            <div className="max-h-52 overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-600 font-semibold sticky top-0 border-b border-slate-200">
                  <tr>
                    <th className="py-1.5 px-2.5">No SJ</th>
                    <th className="py-1.5 px-2.5">Tanggal</th>
                    <th className="py-1.5 px-2.5">Nama Barang</th>
                    <th className="py-1.5 px-2.5">Tujuan Pengiriman</th>
                    <th className="py-1.5 px-2.5">Sopir</th>
                    <th className="py-1.5 px-2.5 text-right">Volume</th>
                    <th className="py-1.5 px-2.5 text-right">Tarif</th>
                    <th className="py-1.5 px-2.5 text-right">Subtotal Insentif</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSalesForTable.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-6 text-center text-slate-400">
                        Tidak ada surat jalan yang sesuai dengan rentang tanggal, barang, atau tujuan terpilih.
                      </td>
                    </tr>
                  ) : (
                    filteredSalesForTable.map((sale) => (
                      <tr key={sale.id} className="hover:bg-slate-50">
                        <td className="py-1.5 px-2.5 font-mono font-medium text-slate-900">
                          {sale.deliveryNoteNumber}
                        </td>
                        <td className="py-1.5 px-2.5 whitespace-nowrap">{formatDateIndo(sale.date)}</td>
                        <td className="py-1.5 px-2.5 text-slate-800">{sale.itemName}</td>
                        <td className="py-1.5 px-2.5 text-slate-600">{sale.destination}</td>
                        <td className="py-1.5 px-2.5 text-slate-600">{sale.driverName || '-'}</td>
                        <td className="py-1.5 px-2.5 text-right font-bold text-slate-900 font-mono">
                          {formatNumber(sale.volume)} {sale.unit}
                        </td>
                        <td className="py-1.5 px-2.5 text-right font-mono text-slate-700">
                          <span className="font-semibold">{formatRupiah(sale.resolvedRate)}</span>
                          {sale.isCustomRate && (
                            <span className="ml-1 px-1 py-0.2 rounded text-[9px] font-bold bg-blue-100 text-blue-800">
                              Khusus
                            </span>
                          )}
                        </td>
                        <td className="py-1.5 px-2.5 text-right font-bold text-emerald-700 font-mono">
                          {formatRupiah(sale.incentiveAmount)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-white border-t border-slate-200 flex items-center justify-between gap-3">
          <div className="text-xs text-slate-600 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>
              Insentif Dihitung:{' '}
              <strong className="text-emerald-700 font-mono text-sm">
                {formatRupiah(totalCalculatedIncentive)}
              </strong>{' '}
              ({formatNumber(totalVolume)} Unit dari {matchedSales.length} SJ)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-semibold"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm cursor-pointer transition-colors"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Terapkan Insentif ke Slip Gaji</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
