import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  DollarSign,
  Truck,
  Layers,
  Calendar,
  CreditCard,
  Building,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  PieChart as PieChartIcon,
  ShoppingBag,
  FileText,
  Plus,
  Printer,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  ClientSupplier,
  CompanyProfile,
  DateFilterState,
  MaterialItem,
  OperationalExpense,
  PurchaseTransaction,
  SaleTransaction,
} from '../types';
import {
  formatDateIndo,
  formatNumber,
  formatRupiah,
  getTodayDateString,
  getCurrentMonthString,
  matchDateFilter,
} from '../utils/formatters';
import { generateIncomeStatement } from '../utils/accounting';
import { DateFilterBar } from './DateFilterBar';

interface DashboardViewProps {
  sales: SaleTransaction[];
  purchases: PurchaseTransaction[];
  expenses: OperationalExpense[];
  materials: MaterialItem[];
  clients: ClientSupplier[];
  companyProfile: CompanyProfile;
  filter: DateFilterState;
  onFilterChange: (filter: DateFilterState) => void;
  onNavigateToTab: (tab: any) => void;
  onOpenPrintModal: (title: string, content: React.ReactNode) => void;
}

const MATERIAL_COLORS = [
  '#2563eb', // blue-600
  '#059669', // emerald-600
  '#d97706', // amber-600
  '#7c3aed', // violet-600
  '#0891b2', // cyan-600
  '#e11d48', // rose-600
  '#475569', // slate-600
  '#10b981', // emerald-500
];

export const DashboardView: React.FC<DashboardViewProps> = ({
  sales = [],
  purchases = [],
  expenses = [],
  materials = [],
  clients = [],
  companyProfile,
  filter,
  onFilterChange,
  onNavigateToTab,
  onOpenPrintModal,
}) => {
  const [chartMetric, setChartMetric] = useState<'omset' | 'volume' | 'profit'>('omset');
  const [chartTimeframe, setChartTimeframe] = useState<'daily' | 'monthly'>('daily');

  // Filtered transactions based on current filter state
  const filteredSales = useMemo(() => {
    return (sales || []).filter((s) => s && matchDateFilter(s.date, filter));
  }, [sales, filter]);

  const filteredPurchases = useMemo(() => {
    return (purchases || []).filter((p) => p && matchDateFilter(p.date, filter));
  }, [purchases, filter]);

  const filteredExpenses = useMemo(() => {
    return (expenses || []).filter((e) => e && matchDateFilter(e.date, filter));
  }, [expenses, filter]);

  // Income Statement calculations
  const incomeStatement = useMemo(() => {
    return generateIncomeStatement(filteredSales, filteredPurchases, filteredExpenses);
  }, [filteredSales, filteredPurchases, filteredExpenses]);

  // Volume calculations
  const volumeSummary = useMemo(() => {
    let totalM3 = 0;
    let totalTon = 0;
    let totalRitase = filteredSales.length;

    filteredSales.forEach((s) => {
      if (s.unit.toLowerCase().includes('ton')) {
        totalTon += s.volume;
      } else {
        totalM3 += s.volume;
      }
    });

    return { totalM3, totalTon, totalRitase };
  }, [filteredSales]);

  // Payment status breakdown
  const paymentBreakdown = useMemo(() => {
    let paidAmount = 0;
    let unpaidAmount = 0;
    let paidCount = 0;
    let unpaidCount = 0;

    filteredSales.forEach((s) => {
      if (s.paymentStatus === 'Lunas') {
        paidAmount += s.totalAmount;
        paidCount++;
      } else {
        unpaidAmount += s.totalAmount;
        unpaidCount++;
      }
    });

    return { paidAmount, unpaidAmount, paidCount, unpaidCount };
  }, [filteredSales]);

  // Daily Trend Chart Data
  const dailyTrendData = useMemo(() => {
    const map = new Map<
      string,
      { date: string; displayDate: string; omset: number; hpp: number; profit: number; volumeM3: number; volumeTon: number; count: number }
    >();

    // Sort sales ascending by date
    const sortedSales = [...sales].sort((a, b) => a.date.localeCompare(b.date));

    // If filtered by monthly, filter for that month, otherwise get recent 14-30 dates
    const relevantSales = filter.mode === 'bulanan'
      ? sortedSales.filter((s) => s.date.startsWith(filter.month))
      : sortedSales;

    relevantSales.forEach((s) => {
      const current = map.get(s.date) || {
        date: s.date,
        displayDate: s.date.split('-').slice(1).join('/'),
        omset: 0,
        hpp: 0,
        profit: 0,
        volumeM3: 0,
        volumeTon: 0,
        count: 0,
      };

      const matchedPurchase = purchases.find((p) => p.saleId === s.id);
      const hpp = matchedPurchase ? matchedPurchase.totalAmount : s.totalAmount * 0.7;

      current.omset += s.totalAmount;
      current.hpp += hpp;
      current.profit += s.totalAmount - hpp;
      if (s.unit.toLowerCase().includes('ton')) {
        current.volumeTon += s.volume;
      } else {
        current.volumeM3 += s.volume;
      }
      current.count += 1;

      map.set(s.date, current);
    });

    // Convert map to array and sort chronologically
    return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [sales, purchases, filter]);

  // Monthly Trend Chart Data (Last 6-12 Months)
  const monthlyTrendData = useMemo(() => {
    const map = new Map<
      string,
      { month: string; displayMonth: string; omset: number; hpp: number; expenses: number; profit: number; volumeM3: number; volumeTon: number; count: number }
    >();

    sales.forEach((s) => {
      const monthKey = s.date.substring(0, 7); // YYYY-MM
      const current = map.get(monthKey) || {
        month: monthKey,
        displayMonth: monthKey,
        omset: 0,
        hpp: 0,
        expenses: 0,
        profit: 0,
        volumeM3: 0,
        volumeTon: 0,
        count: 0,
      };

      const matchedPurchase = purchases.find((p) => p.saleId === s.id);
      const hpp = matchedPurchase ? matchedPurchase.totalAmount : s.totalAmount * 0.7;

      current.omset += s.totalAmount;
      current.hpp += hpp;
      current.profit += (s.totalAmount - hpp);
      if (s.unit.toLowerCase().includes('ton')) {
        current.volumeTon += s.volume;
      } else {
        current.volumeM3 += s.volume;
      }
      current.count += 1;

      map.set(monthKey, current);
    });

    // Add operational expenses by month
    expenses.forEach((e) => {
      const monthKey = e.date.substring(0, 7);
      const current = map.get(monthKey);
      if (current) {
        current.expenses += e.amount;
        current.profit -= e.amount;
      }
    });

    return Array.from(map.values()).sort((a, b) => a.month.localeCompare(b.month));
  }, [sales, purchases, expenses]);

  // Material Distribution Chart Data
  const materialDistributionData = useMemo(() => {
    const map = new Map<string, { name: string; volume: number; unit: string; omset: number; count: number }>();

    filteredSales.forEach((s) => {
      const current = map.get(s.itemName) || {
        name: s.itemName,
        volume: 0,
        unit: s.unit,
        omset: 0,
        count: 0,
      };
      current.volume += s.volume;
      current.omset += s.totalAmount;
      current.count += 1;
      map.set(s.itemName, current);
    });

    return Array.from(map.values()).sort((a, b) => b.omset - a.omset);
  }, [filteredSales]);

  // Client Performance Chart Data
  const clientPerformanceData = useMemo(() => {
    const map = new Map<string, { name: string; omset: number; volumeM3: number; volumeTon: number; count: number }>();

    filteredSales.forEach((s) => {
      const current = map.get(s.clientName) || {
        name: s.clientName,
        omset: 0,
        volumeM3: 0,
        volumeTon: 0,
        count: 0,
      };
      current.omset += s.totalAmount;
      if (s.unit.toLowerCase().includes('ton')) {
        current.volumeTon += s.volume;
      } else {
        current.volumeM3 += s.volume;
      }
      current.count += 1;
      map.set(s.clientName, current);
    });

    return Array.from(map.values()).sort((a, b) => b.omset - a.omset);
  }, [filteredSales]);

  // Quarry Distribution Data
  const quarryDistributionData = useMemo(() => {
    const map = new Map<string, { name: string; volume: number; amount: number; count: number }>();

    filteredPurchases.forEach((p) => {
      const quarryName = p.quarry || p.supplierName || 'Quarry Mitra';
      const current = map.get(quarryName) || {
        name: quarryName,
        volume: 0,
        amount: 0,
        count: 0,
      };
      current.volume += p.volume;
      current.amount += p.totalAmount;
      current.count += 1;
      map.set(quarryName, current);
    });

    return Array.from(map.values()).sort((a, b) => b.amount - a.amount);
  }, [filteredPurchases]);

  // Recent 5 sales
  const recentSales = useMemo(() => {
    return [...sales]
      .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))
      .slice(0, 5);
  }, [sales]);

  // Printable Dashboard Report
  const handlePrintDashboard = () => {
    const printContent = (
      <div className="p-6 bg-white text-slate-900 text-xs font-sans space-y-4">
        <div className="border-b-2 border-slate-900 pb-3 flex justify-between items-start">
          <div>
            <h1 className="text-base font-bold text-slate-900">{companyProfile.name}</h1>
            <p className="text-[11px] text-slate-600">{companyProfile.tagline}</p>
            <p className="text-[10px] text-slate-500">{companyProfile.address}</p>
          </div>
          <div className="text-right">
            <h2 className="text-sm font-bold uppercase text-slate-800">RINGKASAN EKSEKUTIF & PERFORMA</h2>
            <p className="text-[11px] font-semibold text-slate-700">
              Periode: {filter.mode === 'harian' ? formatDateIndo(filter.date) : filter.mode === 'bulanan' ? filter.month : `${filter.startDate} s/d ${filter.endDate}`}
            </p>
            <p className="text-[10px] text-slate-400">Dicetak: {formatDateIndo(getTodayDateString())}</p>
          </div>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-4 gap-3">
          <div className="border border-slate-300 p-2 rounded">
            <span className="text-[9px] text-slate-500 font-bold uppercase">Total Penjualan</span>
            <div className="text-sm font-bold font-mono text-emerald-700">{formatRupiah(incomeStatement.totalRevenue)}</div>
          </div>
          <div className="border border-slate-300 p-2 rounded">
            <span className="text-[9px] text-slate-500 font-bold uppercase">Total HPP Quarry</span>
            <div className="text-sm font-bold font-mono text-rose-700">{formatRupiah(incomeStatement.totalHPP)}</div>
          </div>
          <div className="border border-slate-300 p-2 rounded">
            <span className="text-[9px] text-slate-500 font-bold uppercase">Beban Operasional</span>
            <div className="text-sm font-bold font-mono text-slate-700">{formatRupiah(incomeStatement.totalOperatingExpense)}</div>
          </div>
          <div className="border border-emerald-400 bg-emerald-50 p-2 rounded">
            <span className="text-[9px] text-emerald-800 font-bold uppercase">Laba Bersih</span>
            <div className="text-sm font-bold font-mono text-emerald-800">{formatRupiah(incomeStatement.netProfit)}</div>
          </div>
        </div>

        {/* Breakdown Material */}
        <div>
          <h3 className="font-bold text-xs uppercase text-slate-800 mb-2 border-b border-slate-300 pb-1">
            Volume & Penjualan Per Material
          </h3>
          <table className="w-full text-left border-collapse border border-slate-300 text-[10px]">
            <thead className="bg-slate-100 font-bold">
              <tr>
                <th className="p-1.5 border border-slate-300">Material</th>
                <th className="p-1.5 border border-slate-300 text-right">Volume</th>
                <th className="p-1.5 border border-slate-300 text-right">Ritase</th>
                <th className="p-1.5 border border-slate-300 text-right">Total Penjualan</th>
              </tr>
            </thead>
            <tbody>
              {materialDistributionData.map((m, i) => (
                <tr key={i}>
                  <td className="p-1.5 border border-slate-300 font-medium">{m.name}</td>
                  <td className="p-1.5 border border-slate-300 text-right font-mono">{formatNumber(m.volume)} {m.unit}</td>
                  <td className="p-1.5 border border-slate-300 text-right font-mono">{m.count} DO</td>
                  <td className="p-1.5 border border-slate-300 text-right font-mono font-bold">{formatRupiah(m.omset)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Client breakdown */}
        <div>
          <h3 className="font-bold text-xs uppercase text-slate-800 mb-2 border-b border-slate-300 pb-1">
            Penjualan Per Klien / Kontraktor
          </h3>
          <table className="w-full text-left border-collapse border border-slate-300 text-[10px]">
            <thead className="bg-slate-100 font-bold">
              <tr>
                <th className="p-1.5 border border-slate-300">Klien / Proyek</th>
                <th className="p-1.5 border border-slate-300 text-right">Ritase DO</th>
                <th className="p-1.5 border border-slate-300 text-right">Volume (m3 / Ton)</th>
                <th className="p-1.5 border border-slate-300 text-right">Nilai Transaksi</th>
              </tr>
            </thead>
            <tbody>
              {clientPerformanceData.map((c, i) => (
                <tr key={i}>
                  <td className="p-1.5 border border-slate-300 font-medium">{c.name}</td>
                  <td className="p-1.5 border border-slate-300 text-right font-mono">{c.count} DO</td>
                  <td className="p-1.5 border border-slate-300 text-right font-mono">
                    {c.volumeM3 > 0 ? `${formatNumber(c.volumeM3)} m3` : ''}
                    {c.volumeM3 > 0 && c.volumeTon > 0 ? ' + ' : ''}
                    {c.volumeTon > 0 ? `${formatNumber(c.volumeTon)} ton` : ''}
                  </td>
                  <td className="p-1.5 border border-slate-300 text-right font-mono font-bold">{formatRupiah(c.omset)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pt-6 flex justify-between items-end text-[10px]">
          <div>
            <p className="text-slate-500">Laporan ringkasan eksekutif ini terhitung otomatis oleh sistem.</p>
          </div>
          <div className="text-center w-48">
            <p className="text-slate-600">Disetujui Oleh,</p>
            <div className="h-12"></div>
            <p className="font-bold underline text-slate-900">{companyProfile.signatoryName}</p>
            <p className="text-slate-600">{companyProfile.signatoryRole}</p>
          </div>
        </div>
      </div>
    );

    onOpenPrintModal('Ringkasan Eksekutif & Dashboard Performa', printContent);
  };

  const profitMargin = incomeStatement.totalRevenue > 0
    ? ((incomeStatement.netProfit / incomeStatement.totalRevenue) * 100).toFixed(1)
    : '0';

  const grossMargin = incomeStatement.totalRevenue > 0
    ? ((incomeStatement.grossProfit / incomeStatement.totalRevenue) * 100).toFixed(1)
    : '0';

  return (
    <div className="space-y-3">
      {/* Top Header Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2 bg-white p-3 rounded border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-600" />
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-tight">
              Dashboard Utama & Analisis Performa Penjualan
            </h2>
          </div>
          <p className="text-[11px] text-slate-500">
            Monitoring performa pendapatan material, laba bersih, efisiensi quarry, dan tren ritase pengiriman
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            id="btn-quick-new-sale"
            onClick={() => onNavigateToTab('penjualan')}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded text-xs transition shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Catat Surat Jalan (Penjualan)</span>
          </button>

          <button
            id="btn-print-dashboard"
            onClick={handlePrintDashboard}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded text-xs border border-slate-300 transition shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>Cetak PDF Ringkasan</span>
          </button>
        </div>
      </div>

      {/* Date Filter Bar */}
      <DateFilterBar filter={filter} onChange={onFilterChange} title="Filter Periode Data Dashboard" />

      {/* 1. EXECUTIVE KPI SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {/* Total Penjualan */}
        <div className="bg-white border border-slate-200 p-3 rounded shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Total Penjualan Material
            </span>
            <div className="w-6 h-6 rounded bg-blue-50 text-blue-600 flex items-center justify-center">
              <DollarSign className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-base font-bold text-slate-900 font-mono mt-1">
            {formatRupiah(incomeStatement.totalRevenue)}
          </div>
          <div className="flex items-center justify-between text-[10px] mt-1 pt-1 border-t border-slate-100 text-slate-500">
            <span>{filteredSales.length} Ritase / Surat Jalan</span>
            <span className="text-blue-700 font-semibold">Margin Kotor: {grossMargin}%</span>
          </div>
        </div>

        {/* Beban Pokok Quarry (HPP) */}
        <div className="bg-white border border-slate-200 p-3 rounded shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              HPP Pembelian Quarry
            </span>
            <div className="w-6 h-6 rounded bg-rose-50 text-rose-600 flex items-center justify-center">
              <ShoppingBag className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-base font-bold text-rose-700 font-mono mt-1">
            {formatRupiah(incomeStatement.totalHPP)}
          </div>
          <div className="flex items-center justify-between text-[10px] mt-1 pt-1 border-t border-slate-100 text-slate-500">
            <span>{filteredPurchases.length} DO Tambang</span>
            <span className="text-slate-400">
              {incomeStatement.totalRevenue > 0
                ? ((incomeStatement.totalHPP / incomeStatement.totalRevenue) * 100).toFixed(0)
                : 0}
              % dari Omset
            </span>
          </div>
        </div>

        {/* Laba Bersih */}
        <div className="bg-emerald-50/40 border border-emerald-200 p-3 rounded shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
              Laba Bersih Berjalan
            </span>
            <div className="w-6 h-6 rounded bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-base font-bold text-emerald-800 font-mono mt-1">
            {formatRupiah(incomeStatement.netProfit)}
          </div>
          <div className="flex items-center justify-between text-[10px] mt-1 pt-1 border-t border-emerald-100 text-emerald-700">
            <span>Net Profit Margin: <strong>{profitMargin}%</strong></span>
            <span className="text-[9px] bg-emerald-100 px-1 py-0.2 rounded font-bold">Laba Bersih</span>
          </div>
        </div>

        {/* Volume Pengiriman */}
        <div className="bg-white border border-slate-200 p-3 rounded shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Total Volume Material
            </span>
            <div className="w-6 h-6 rounded bg-amber-50 text-amber-600 flex items-center justify-center">
              <Truck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-sm font-bold text-slate-900 font-mono mt-1 flex items-baseline gap-1">
            <span>{formatNumber(volumeSummary.totalM3)} <small className="text-[10px] text-slate-500 font-sans">m³</small></span>
            {volumeSummary.totalTon > 0 && (
              <span className="text-slate-400 font-normal text-xs">
                + {formatNumber(volumeSummary.totalTon)} <small className="text-[10px] text-slate-500 font-sans">ton</small>
              </span>
            )}
          </div>
          <div className="flex items-center justify-between text-[10px] mt-1 pt-1 border-t border-slate-100 text-slate-500">
            <span>{volumeSummary.totalRitase} Trip Armada</span>
            <span className="text-amber-700 font-semibold">{materials.length} Jenis Material</span>
          </div>
        </div>
      </div>

      {/* 2. MAIN CHARTS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Left Column: Delivery & Revenue Trend (2 cols wide on large screens) */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded p-3 shadow-2xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-tight flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
                <span>Grafik Tren Penjualan & Pengiriman Material</span>
              </h3>
              <p className="text-[10px] text-slate-500">
                Visualisasi dinamika transaksi harian dan akumulasi pergerakan omset
              </p>
            </div>

            {/* Metric & Timeframe Controls */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <div className="flex items-center bg-slate-100 p-0.5 rounded border border-slate-200 text-[10px]">
                <button
                  onClick={() => setChartMetric('omset')}
                  className={`px-2 py-0.5 rounded font-semibold transition ${
                    chartMetric === 'omset' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Penjualan (Rp)
                </button>
                <button
                  onClick={() => setChartMetric('volume')}
                  className={`px-2 py-0.5 rounded font-semibold transition ${
                    chartMetric === 'volume' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Volume (m³)
                </button>
                <button
                  onClick={() => setChartMetric('profit')}
                  className={`px-2 py-0.5 rounded font-semibold transition ${
                    chartMetric === 'profit' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Laba (Rp)
                </button>
              </div>

              <div className="flex items-center bg-slate-100 p-0.5 rounded border border-slate-200 text-[10px]">
                <button
                  onClick={() => setChartTimeframe('daily')}
                  className={`px-2 py-0.5 rounded font-semibold transition ${
                    chartTimeframe === 'daily' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Harian
                </button>
                <button
                  onClick={() => setChartTimeframe('monthly')}
                  className={`px-2 py-0.5 rounded font-semibold transition ${
                    chartTimeframe === 'monthly' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Bulanan
                </button>
              </div>
            </div>
          </div>

          {/* Render Active Chart */}
          <div className="h-64 w-full pt-1">
            {chartTimeframe === 'daily' ? (
              dailyTrendData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                  Belum ada data transaksi pada periode ini.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  {chartMetric === 'omset' ? (
                    <AreaChart data={dailyTrendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorOmset" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorHpp" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#e11d48" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#e11d48" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="displayDate" tick={{ fontSize: 10, fill: '#64748b' }} />
                      <YAxis
                        tick={{ fontSize: 10, fill: '#64748b' }}
                        tickFormatter={(v) => `${(v / 1000000).toFixed(1)}jt`}
                      />
                      <Tooltip
                        formatter={(value: any, name: any) => [
                          formatRupiah(Number(value)),
                          name === 'omset' ? 'Nilai Penjualan' : 'HPP Quarry',
                        ]}
                        labelFormatter={(label) => `Tanggal: ${label}`}
                        contentStyle={{ backgroundColor: '#ffffff', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '11px' }}
                      />
                      <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '4px' }} />
                      <Area
                        type="monotone"
                        dataKey="omset"
                        name="Penjualan (Omset)"
                        stroke="#2563eb"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorOmset)"
                      />
                      <Area
                        type="monotone"
                        dataKey="hpp"
                        name="HPP Quarry"
                        stroke="#e11d48"
                        strokeWidth={1.5}
                        strokeDasharray="4 4"
                        fillOpacity={1}
                        fill="url(#colorHpp)"
                      />
                    </AreaChart>
                  ) : chartMetric === 'volume' ? (
                    <BarChart data={dailyTrendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="displayDate" tick={{ fontSize: 10, fill: '#64748b' }} />
                      <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(v) => `${v} m³`} />
                      <Tooltip
                        formatter={(value: any, name: any) => [
                          `${formatNumber(Number(value))} ${name === 'volumeM3' ? 'm³' : 'ton'}`,
                          name === 'volumeM3' ? 'Volume (m³)' : 'Volume (Ton)',
                        ]}
                        contentStyle={{ backgroundColor: '#ffffff', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '11px' }}
                      />
                      <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '4px' }} />
                      <Bar dataKey="volumeM3" name="Volume (m³)" fill="#0284c7" radius={[2, 2, 0, 0]} />
                      <Bar dataKey="volumeTon" name="Volume (Ton)" fill="#d97706" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  ) : (
                    <AreaChart data={dailyTrendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#059669" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="displayDate" tick={{ fontSize: 10, fill: '#64748b' }} />
                      <YAxis
                        tick={{ fontSize: 10, fill: '#64748b' }}
                        tickFormatter={(v) => `${(v / 1000000).toFixed(1)}jt`}
                      />
                      <Tooltip
                        formatter={(value: any) => [formatRupiah(Number(value)), 'Laba Kotor Transaksi']}
                        contentStyle={{ backgroundColor: '#ffffff', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '11px' }}
                      />
                      <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '4px' }} />
                      <Area
                        type="monotone"
                        dataKey="profit"
                        name="Laba Transaksi (Rp)"
                        stroke="#059669"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorProfit)"
                      />
                    </AreaChart>
                  )}
                </ResponsiveContainer>
              )
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyTrendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="displayMonth" tick={{ fontSize: 10, fill: '#64748b' }} />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    tickFormatter={(v) => `${(v / 1000000).toFixed(0)}jt`}
                  />
                  <Tooltip
                    formatter={(value: any, name: any) => [
                      formatRupiah(Number(value)),
                      name === 'omset' ? 'Pendapatan' : name === 'hpp' ? 'HPP Quarry' : name === 'expenses' ? 'Beban Operasional' : 'Laba Bersih',
                    ]}
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '11px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '4px' }} />
                  <Bar dataKey="omset" name="Pendapatan Penjualan" fill="#2563eb" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="hpp" name="HPP Quarry" fill="#e11d48" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="profit" name="Laba Bersih" fill="#059669" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Right Column: Material Composition Pie Chart */}
        <div className="bg-white border border-slate-200 rounded p-3 shadow-2xs space-y-2 flex flex-col justify-between">
          <div className="border-b border-slate-200 pb-2">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-tight flex items-center gap-1.5">
              <PieChartIcon className="w-3.5 h-3.5 text-blue-600" />
              <span>Komposisi Penjualan Material</span>
            </h3>
            <p className="text-[10px] text-slate-500">Porsi omset berdasarkan komoditas material</p>
          </div>

          <div className="h-44 w-full">
            {materialDistributionData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                Tidak ada data.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={materialDistributionData}
                    dataKey="omset"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={38}
                    outerRadius={65}
                    paddingAngle={3}
                  >
                    {materialDistributionData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={MATERIAL_COLORS[index % MATERIAL_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any, name: any) => [formatRupiah(Number(value)), name]}
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '11px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Material Legend list */}
          <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
            {materialDistributionData.slice(0, 5).map((m, idx) => {
              const pct = incomeStatement.totalRevenue > 0
                ? ((m.omset / incomeStatement.totalRevenue) * 100).toFixed(1)
                : 0;
              return (
                <div key={idx} className="flex items-center justify-between text-[10px]">
                  <div className="flex items-center gap-1.5 truncate max-w-[170px]">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: MATERIAL_COLORS[idx % MATERIAL_COLORS.length] }}
                    ></span>
                    <span className="truncate text-slate-700" title={m.name}>{m.name}</span>
                  </div>
                  <div className="font-mono font-semibold text-slate-900 shrink-0">
                    {pct}%
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. SECOND ROW: CLIENT PROJECT PERFORMANCE & QUARRY REKAP */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Client / Project Distribution */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded p-3 shadow-2xs space-y-2.5">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-tight flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-blue-600" />
                <span>Performa Penjualan Berdasarkan Klien / Proyek</span>
              </h3>
              <p className="text-[10px] text-slate-500">
                Peringkat omset per kontraktor, BUMN & batching plant
              </p>
            </div>
            <button
              onClick={() => onNavigateToTab('penjualan')}
              className="text-[10px] text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-0.5"
            >
              <span>Lihat Semua DO</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[9px] border-b border-slate-200">
                <tr>
                  <th className="px-2.5 py-1.5">Nama Klien / Kontraktor</th>
                  <th className="px-2.5 py-1.5 text-center">Ritase (DO)</th>
                  <th className="px-2.5 py-1.5 text-right">Volume</th>
                  <th className="px-2.5 py-1.5 text-right">Total Transaksi</th>
                  <th className="px-2.5 py-1.5 text-right">Porsi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {clientPerformanceData.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-4 text-slate-400 text-[11px]">
                      Belum ada transaksi penjualan pada filter ini.
                    </td>
                  </tr>
                ) : (
                  clientPerformanceData.slice(0, 5).map((cli, i) => {
                    const pct = incomeStatement.totalRevenue > 0
                      ? ((cli.omset / incomeStatement.totalRevenue) * 100).toFixed(1)
                      : 0;
                    return (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="px-2.5 py-1.5 font-semibold text-slate-800 max-w-xs truncate">
                          {cli.name}
                        </td>
                        <td className="px-2.5 py-1.5 text-center font-mono text-slate-600">
                          {cli.count} DO
                        </td>
                        <td className="px-2.5 py-1.5 text-right font-mono text-slate-700">
                          {cli.volumeM3 > 0 ? `${formatNumber(cli.volumeM3)} m³` : ''}
                          {cli.volumeM3 > 0 && cli.volumeTon > 0 ? ' ' : ''}
                          {cli.volumeTon > 0 ? `${formatNumber(cli.volumeTon)} ton` : ''}
                        </td>
                        <td className="px-2.5 py-1.5 text-right font-mono font-bold text-slate-900">
                          {formatRupiah(cli.omset)}
                        </td>
                        <td className="px-2.5 py-1.5 text-right">
                          <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-[9px] font-mono font-bold border border-blue-100">
                            {pct}%
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payment & Cash Flow Status Card */}
        <div className="bg-white border border-slate-200 rounded p-3 shadow-2xs space-y-3 flex flex-col justify-between">
          <div className="border-b border-slate-200 pb-2">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-tight flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-blue-600" />
              <span>Status Pembayaran & Piutang</span>
            </h3>
            <p className="text-[10px] text-slate-500">Kondisi likuiditas penagihan invoice proyek</p>
          </div>

          <div className="space-y-2">
            {/* Lunas */}
            <div className="p-2.5 bg-emerald-50/70 border border-emerald-200 rounded">
              <div className="flex items-center justify-between text-emerald-800 font-bold text-[11px]">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Terbayar (Lunas)</span>
                </span>
                <span className="font-mono">{formatRupiah(paymentBreakdown.paidAmount)}</span>
              </div>
              <div className="text-[10px] text-emerald-600 mt-0.5 flex justify-between">
                <span>{paymentBreakdown.paidCount} Transaksi Selesai</span>
                <span>
                  {incomeStatement.totalRevenue > 0
                    ? ((paymentBreakdown.paidAmount / incomeStatement.totalRevenue) * 100).toFixed(0)
                    : 0}
                  %
                </span>
              </div>
            </div>

            {/* Belum Lunas */}
            <div className="p-2.5 bg-amber-50/70 border border-amber-200 rounded">
              <div className="flex items-center justify-between text-amber-800 font-bold text-[11px]">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>Piutang Belum Lunas</span>
                </span>
                <span className="font-mono">{formatRupiah(paymentBreakdown.unpaidAmount)}</span>
              </div>
              <div className="text-[10px] text-amber-600 mt-0.5 flex justify-between">
                <span>{paymentBreakdown.unpaidCount} Transaksi Berjalan</span>
                <span>
                  {incomeStatement.totalRevenue > 0
                    ? ((paymentBreakdown.unpaidAmount / incomeStatement.totalRevenue) * 100).toFixed(0)
                    : 0}
                  %
                </span>
              </div>
            </div>
          </div>

          {/* Shortcut to Invoicing */}
          <div className="pt-2 border-t border-slate-100">
            <button
              onClick={() => onNavigateToTab('invoice')}
              className="w-full py-1.5 px-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded text-xs flex items-center justify-center gap-1.5 transition shadow-2xs"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Buka Rekap Invoice Per PO</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. RECENT SURAT JALAN / DELIVERY TRANSACTIONS */}
      <div className="bg-white border border-slate-200 rounded p-3 shadow-2xs space-y-2">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-tight flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-blue-600" />
              <span>5 Pengiriman Surat Jalan (DO) Terkini</span>
            </h3>
            <p className="text-[10px] text-slate-500">Riwayat pengiriman armada terbaru ke lokasi proyek</p>
          </div>
          <button
            onClick={() => onNavigateToTab('penjualan')}
            className="text-[10px] text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-0.5"
          >
            <span>Kelola Semua Penjualan</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[9px] border-b border-slate-200">
              <tr>
                <th className="px-2.5 py-1.5">Tanggal</th>
                <th className="px-2.5 py-1.5">No. Surat Jalan</th>
                <th className="px-2.5 py-1.5">Klien Proyek</th>
                <th className="px-2.5 py-1.5">Material</th>
                <th className="px-2.5 py-1.5 text-right">Volume</th>
                <th className="px-2.5 py-1.5">Armada & Sopir</th>
                <th className="px-2.5 py-1.5 text-right">Total Nilai</th>
                <th className="px-2.5 py-1.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentSales.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="px-2.5 py-1.5 font-mono text-slate-600 whitespace-nowrap text-[11px]">
                    {s.date}
                  </td>
                  <td className="px-2.5 py-1.5 font-mono font-bold text-blue-700 whitespace-nowrap">
                    {s.deliveryNoteNumber}
                  </td>
                  <td className="px-2.5 py-1.5 font-medium text-slate-800 max-w-xs truncate">
                    {s.clientName}
                  </td>
                  <td className="px-2.5 py-1.5 text-slate-700 truncate max-w-[180px]">
                    {s.itemName}
                  </td>
                  <td className="px-2.5 py-1.5 text-right font-mono font-semibold text-slate-800">
                    {formatNumber(s.volume)} {s.unit}
                  </td>
                  <td className="px-2.5 py-1.5 text-slate-600 text-[11px] whitespace-nowrap">
                    <span className="font-mono font-semibold text-slate-700">{s.vehiclePlate || '-'}</span>
                    {s.driverName && <span className="text-slate-400"> ({s.driverName})</span>}
                  </td>
                  <td className="px-2.5 py-1.5 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                    {formatRupiah(s.totalAmount)}
                  </td>
                  <td className="px-2.5 py-1.5 text-center">
                    <span
                      className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-bold ${
                        s.paymentStatus === 'Lunas'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {s.paymentStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
