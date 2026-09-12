import React, { useState, useMemo } from 'react';
import {
  Award,
  Zap,
  Plus,
  Search,
  Filter,
  Calendar,
  Layers,
  MapPin,
  Truck,
  DollarSign,
  Download,
  Printer,
  Trash2,
  FileText,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  RefreshCw,
  Sliders,
  CheckSquare,
  Square,
  ArrowRight,
  TrendingUp,
  UserCheck,
  Percent,
  SlidersHorizontal,
  Table,
  X,
} from 'lucide-react';
import {
  CompanyProfile,
  Employee,
  IncentiveRecord,
  IncentiveRateType,
  ItemDestinationIncentiveRate,
  MaterialItem,
  MatchedSaleIncentive,
  SaleTransaction,
} from '../types';
import {
  compareDateDescending,
  formatDateIndo,
  formatNumber,
  formatRupiah,
  getTodayDateString,
  normalizeDateToYMD,
} from '../utils/formatters';
import { exportTableToExcel } from '../utils/excelHelper';
import { IncentivePrintModal } from './IncentivePrintModal';

interface IncentiveViewProps {
  sales: SaleTransaction[];
  materials: MaterialItem[];
  employees: Employee[];
  incentives: IncentiveRecord[];
  companyProfile: CompanyProfile;
  onSaveIncentive: (incentive: IncentiveRecord) => void;
  onDeleteIncentive: (id: string) => void;
  onNavigateToSalaryFormWithIncentive?: (incentive: IncentiveRecord) => void;
  onNavigateToTab?: (tab: string) => void;
}

export const IncentiveView: React.FC<IncentiveViewProps> = ({
  sales = [],
  materials = [],
  employees = [],
  incentives = [],
  companyProfile,
  onSaveIncentive,
  onDeleteIncentive,
  onNavigateToSalaryFormWithIncentive,
  onNavigateToTab,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'kalkulator' | 'riwayat'>('kalkulator');

  // Form State for Calculation
  const todayStr = getTodayDateString();
  const monthStartStr = `${todayStr.slice(0, 7)}-01`;

  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(
    employees.length > 0 ? employees[0].id : ''
  );
  const [customEmployeeName, setCustomEmployeeName] = useState<string>('');
  const [customEmployeeRole, setCustomEmployeeRole] = useState<string>('Sopir / Driver');

  const [startDate, setStartDate] = useState<string>(monthStartStr);
  const [endDate, setEndDate] = useState<string>(todayStr);

  const [selectedItemNames, setSelectedItemNames] = useState<string[]>([]);
  const [selectedDestinations, setSelectedDestinations] = useState<string[]>([]);

  const [rateType, setRateType] = useState<IncentiveRateType>('per_unit_volume');
  const [ratePerUnit, setRatePerUnit] = useState<number>(5000);
  const [ratePercentage, setRatePercentage] = useState<number>(1.5);
  const [ratePerTrip, setRatePerTrip] = useState<number>(50000);

  // Granular variable rates state: item & destination specific rates
  const [useVariableRates, setUseVariableRates] = useState<boolean>(true);
  const [customRateMap, setCustomRateMap] = useState<Record<string, number>>({});
  const [manualCustomRules, setManualCustomRules] = useState<ItemDestinationIncentiveRate[]>(
    employees.length > 0 && employees[0].customIncentiveRates
      ? [...employees[0].customIncentiveRates]
      : []
  );
  const [showAddRuleModal, setShowAddRuleModal] = useState<boolean>(false);
  const [newRuleItem, setNewRuleItem] = useState<string>('');
  const [newRuleDest, setNewRuleDest] = useState<string>('');
  const [newRuleRate, setNewRuleRate] = useState<number>(6000);

  const [notes, setNotes] = useState<string>('');
  const [searchTableQuery, setSearchTableQuery] = useState<string>('');

  // History Search & Filter State
  const [historySearch, setHistorySearch] = useState<string>('');
  const [historyMonthFilter, setHistoryMonthFilter] = useState<string>('semua');
  const [historyStatusFilter, setHistoryStatusFilter] = useState<'semua' | 'belum_dibayar' | 'sudah_dibayar'>('semua');

  // Payment Modal State for Separate Payout
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);
  const [targetIncentiveForPayment, setTargetIncentiveForPayment] = useState<IncentiveRecord | null>(null);
  const [payFormDate, setPayFormDate] = useState<string>(getTodayDateString());
  const [payFormMethod, setPayFormMethod] = useState<'Transfer Bank' | 'Tunai / Kas' | 'Kas Kecil'>('Transfer Bank');
  const [payFormBankName, setPayFormBankName] = useState<string>('');
  const [payFormBankAccount, setPayFormBankAccount] = useState<string>('');
  const [payFormBankHolder, setPayFormBankHolder] = useState<string>('');
  const [payFormReference, setPayFormReference] = useState<string>('');
  const [payFormPostToExpense, setPayFormPostToExpense] = useState<boolean>(true);
  const [payFormNotes, setPayFormNotes] = useState<string>('');

  // Print Modal State
  const [selectedIncentiveForPrint, setSelectedIncentiveForPrint] = useState<IncentiveRecord | null>(null);
  const [printModalOpen, setPrintModalOpen] = useState(false);

  // Success feedback state
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Current selected employee object
  const currentEmployee = useMemo(() => {
    return employees.find((e) => e.id === selectedEmployeeId) || null;
  }, [employees, selectedEmployeeId]);

  // When selected employee changes, update default rate and load employee's custom item rates
  const handleEmployeeChange = (empId: string) => {
    setSelectedEmployeeId(empId);
    const emp = employees.find((e) => e.id === empId);
    if (emp) {
      if (emp.defaultIncentiveRate && emp.defaultIncentiveRate > 0) {
        setRatePerUnit(emp.defaultIncentiveRate);
      }
      if (emp.customIncentiveRates && emp.customIncentiveRates.length > 0) {
        setManualCustomRules([...emp.customIncentiveRates]);
      } else {
        setManualCustomRules([]);
      }
      setCustomRateMap({});
    }
  };

  // Distinct list of material items
  const allMaterialNames = useMemo(() => {
    const set = new Set<string>();
    materials.forEach((m) => set.add(m.name));
    sales.forEach((s) => set.add(s.itemName));
    return Array.from(set);
  }, [materials, sales]);

  // Distinct list of destinations
  const allDestinations = useMemo(() => {
    const set = new Set<string>();
    sales.forEach((s) => {
      if (s.destination) set.add(s.destination);
    });
    return Array.from(set);
  }, [sales]);

  // Toggle item selection
  const toggleItem = (name: string) => {
    setSelectedItemNames((prev) =>
      prev.includes(name) ? prev.filter((i) => i !== name) : [...prev, name]
    );
  };

  // Toggle destination selection
  const toggleDestination = (dest: string) => {
    setSelectedDestinations((prev) =>
      prev.includes(dest) ? prev.filter((d) => d !== dest) : [...prev, dest]
    );
  };

  // Target employee name and role for filtering
  const targetEmployeeName = currentEmployee ? currentEmployee.name : customEmployeeName || 'Karyawan';
  const targetEmployeeRole = currentEmployee ? currentEmployee.role : customEmployeeRole;

  // Detect distinct Item × Destination combinations from active criteria
  const activeItemDestinationPairs = useMemo(() => {
    const startYMD = normalizeDateToYMD(startDate);
    const endYMD = normalizeDateToYMD(endDate);
    const pairMap = new Map<
      string,
      { itemName: string; destination: string; volume: number; count: number; sampleSJ: string }
    >();

    sales.forEach((s) => {
      const sDate = normalizeDateToYMD(s.date);
      if (startYMD && sDate < startYMD) return;
      if (endYMD && sDate > endYMD) return;
      if (selectedItemNames.length > 0 && !selectedItemNames.includes(s.itemName)) return;
      if (selectedDestinations.length > 0 && !selectedDestinations.includes(s.destination)) return;

      const key = `${s.itemName}:::${s.destination}`;
      const vol = Number(s.volume) || 0;
      const existing = pairMap.get(key);
      if (existing) {
        existing.volume += vol;
        existing.count += 1;
      } else {
        pairMap.set(key, {
          itemName: s.itemName,
          destination: s.destination,
          volume: vol,
          count: 1,
          sampleSJ: s.deliveryNoteNumber,
        });
      }
    });

    return Array.from(pairMap.values());
  }, [
    sales,
    startDate,
    endDate,
    selectedItemNames,
    selectedDestinations,
  ]);

  // Rate Resolver per Item & Destination
  const resolveRate = (itemName: string, destination: string): { rate: number; isCustom: boolean } => {
    if (rateType !== 'per_unit_volume') {
      if (rateType === 'percentage_sales') return { rate: ratePercentage, isCustom: false };
      return { rate: ratePerTrip, isCustom: false };
    }
    if (!useVariableRates) {
      return { rate: ratePerUnit, isCustom: false };
    }
    const key = `${itemName}:::${destination}`;
    if (customRateMap[key] !== undefined && customRateMap[key] !== null) {
      return { rate: Number(customRateMap[key]), isCustom: true };
    }
    // Check manual / employee custom rules
    const exactRule = manualCustomRules.find(
      (r) =>
        r.itemName.trim().toLowerCase() === itemName.trim().toLowerCase() &&
        r.destination.trim().toLowerCase() === destination.trim().toLowerCase()
    );
    if (exactRule) {
      return { rate: exactRule.ratePerUnit, isCustom: true };
    }
    const itemOnlyRule = manualCustomRules.find(
      (r) =>
        r.itemName.trim().toLowerCase() === itemName.trim().toLowerCase() &&
        (r.destination === '*' || !r.destination || r.destination.trim() === '')
    );
    if (itemOnlyRule) {
      return { rate: itemOnlyRule.ratePerUnit, isCustom: true };
    }
    const destOnlyRule = manualCustomRules.find(
      (r) =>
        (r.itemName === '*' || !r.itemName || r.itemName.trim() === '') &&
        r.destination.trim().toLowerCase() === destination.trim().toLowerCase()
    );
    if (destOnlyRule) {
      return { rate: destOnlyRule.ratePerUnit, isCustom: true };
    }

    return { rate: ratePerUnit, isCustom: false };
  };

  // Helper to set rate for a specific (Item, Destination) pair
  const setRateForPair = (itemName: string, destination: string, rate: number) => {
    const key = `${itemName}:::${destination}`;
    setCustomRateMap((prev) => ({
      ...prev,
      [key]: rate,
    }));
  };

  // Real-time calculation of matched sales
  const matchedSales = useMemo<MatchedSaleIncentive[]>(() => {
    const startYMD = normalizeDateToYMD(startDate);
    const endYMD = normalizeDateToYMD(endDate);

    const results: MatchedSaleIncentive[] = [];

    sales.forEach((s) => {
      const sDate = normalizeDateToYMD(s.date);
      if (startYMD && sDate < startYMD) return;
      if (endYMD && sDate > endYMD) return;

      // Filter Item Names (if any selected)
      if (selectedItemNames.length > 0 && !selectedItemNames.includes(s.itemName)) {
        return;
      }

      // Filter Destinations (if any selected)
      if (selectedDestinations.length > 0 && !selectedDestinations.includes(s.destination)) {
        return;
      }

      // Calculate incentive for this specific transaction using its resolved rate
      const { rate, isCustom } = resolveRate(s.itemName, s.destination);
      let itemIncentive = 0;

      if (rateType === 'per_unit_volume') {
        itemIncentive = (Number(s.volume) || 0) * rate;
      } else if (rateType === 'percentage_sales') {
        itemIncentive = (Number(s.totalAmount) || 0) * (rate / 100);
      } else if (rateType === 'fixed_trip') {
        itemIncentive = rate;
      }

      results.push({
        saleId: s.id,
        date: s.date,
        deliveryNoteNumber: s.deliveryNoteNumber,
        poNumber: s.poNumber,
        clientId: s.clientId,
        clientName: s.clientName,
        itemId: s.itemId,
        itemName: s.itemName,
        quarry: s.quarry,
        destination: s.destination,
        volume: Number(s.volume) || 0,
        unit: s.unit || 'm3',
        price: Number(s.price) || 0,
        totalAmount: Number(s.totalAmount) || 0,
        driverName: s.driverName,
        vehiclePlate: s.vehiclePlate,
        rateApplied: rate,
        isCustomRate: isCustom,
        incentiveAmount: itemIncentive,
      });
    });

    return results.sort((a, b) => compareDateDescending(a.date, b.date));
  }, [
    sales,
    startDate,
    endDate,
    selectedItemNames,
    selectedDestinations,
    rateType,
    ratePerUnit,
    ratePercentage,
    ratePerTrip,
    useVariableRates,
    customRateMap,
    manualCustomRules,
  ]);

  // Aggregated totals
  const totalVolume = useMemo(() => {
    return matchedSales.reduce((sum, s) => sum + s.volume, 0);
  }, [matchedSales]);

  const totalSalesAmount = useMemo(() => {
    return matchedSales.reduce((sum, s) => sum + s.totalAmount, 0);
  }, [matchedSales]);

  const totalIncentiveAmount = useMemo(() => {
    return matchedSales.reduce((sum, s) => sum + s.incentiveAmount, 0);
  }, [matchedSales]);

  // Count custom rate variations
  const customRatesCount = useMemo(() => {
    return Object.keys(customRateMap).length + manualCustomRules.length;
  }, [customRateMap, manualCustomRules]);

  // Filtered list for display in table
  const filteredSalesForTable = useMemo(() => {
    if (!searchTableQuery) return matchedSales;
    const q = searchTableQuery.toLowerCase();
    return matchedSales.filter(
      (s) =>
        s.deliveryNoteNumber.toLowerCase().includes(q) ||
        s.itemName.toLowerCase().includes(q) ||
        s.destination.toLowerCase().includes(q) ||
        s.clientName.toLowerCase().includes(q) ||
        (s.driverName && s.driverName.toLowerCase().includes(q)) ||
        (s.vehiclePlate && s.vehiclePlate.toLowerCase().includes(q))
    );
  }, [matchedSales, searchTableQuery]);

  // Save Incentive Calculation
  const handleSaveCalculation = () => {
    const newCalculationNumber = `INS-${new Date().getFullYear()}${String(
      new Date().getMonth() + 1
    ).padStart(2, '0')}-${String(incentives.length + 1).padStart(3, '0')}`;

    // Collect all applied custom rates
    const exportCustomRates: ItemDestinationIncentiveRate[] = [];
    Object.entries(customRateMap).forEach(([key, val]) => {
      const [item, dest] = key.split(':::');
      exportCustomRates.push({
        id: `cr-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        itemName: item,
        destination: dest,
        ratePerUnit: Number(val),
      });
    });
    manualCustomRules.forEach((r) => {
      if (!exportCustomRates.some((x) => x.itemName === r.itemName && x.destination === r.destination)) {
        exportCustomRates.push(r);
      }
    });

    const newRecord: IncentiveRecord = {
      id: `ins-${Date.now()}`,
      calculationNumber: newCalculationNumber,
      date: getTodayDateString(),
      title: `Insentif ${targetEmployeeName} (${startDate} s/d ${endDate})`,
      employeeId: currentEmployee ? currentEmployee.id : undefined,
      employeeName: targetEmployeeName,
      employeeRole: targetEmployeeRole,
      startDate,
      endDate,
      selectedItemNames,
      selectedDestinations,
      rateType,
      ratePerUnit,
      ratePercentage,
      ratePerTrip,
      customRates: exportCustomRates,
      useVariableRates,
      matchedSales,
      totalMatchedSalesCount: matchedSales.length,
      totalVolume,
      totalSalesAmount,
      totalIncentiveAmount,
      status: 'Divalidasi',
      paymentStatus: 'Belum Dibayar',
      notes: notes || undefined,
      createdAt: new Date().toISOString(),
    };

    onSaveIncentive(newRecord);
    setSuccessMessage(`Berhasil menyimpan dokumen perhitungan insentif #${newCalculationNumber}`);
    setTimeout(() => setSuccessMessage(null), 4000);
    return newRecord;
  };

  // Open Payment / Disbursement Modal for an Incentive Record
  const handleOpenPaymentModal = (record: IncentiveRecord) => {
    setTargetIncentiveForPayment(record);
    setPayFormDate(record.paymentDate || getTodayDateString());
    setPayFormMethod(record.paymentMethod || 'Transfer Bank');
    
    // Auto-fill bank details from employee profile if available
    const emp = employees.find(
      (e) => e.id === record.employeeId || e.name.toLowerCase() === record.employeeName.toLowerCase()
    );
    setPayFormBankName(record.bankName || (emp ? emp.bankName || 'BCA' : 'BCA'));
    setPayFormBankAccount(record.bankAccount || (emp ? emp.bankAccount || '' : ''));
    setPayFormBankHolder(record.bankHolder || (emp ? emp.name : record.employeeName));
    setPayFormReference(record.paymentReference || `TRF-INS-${Date.now().toString().slice(-6)}`);
    setPayFormPostToExpense(record.postToExpense !== false);
    setPayFormNotes(record.notes || '');
    setIsPaymentModalOpen(true);
  };

  // Save / Confirm Payment Execution
  const handleConfirmPayment = () => {
    if (!targetIncentiveForPayment) return;

    const updated: IncentiveRecord = {
      ...targetIncentiveForPayment,
      status: 'Dibayar',
      paymentStatus: 'Dibayar',
      paymentDate: payFormDate,
      paymentMethod: payFormMethod,
      bankName: payFormMethod === 'Transfer Bank' ? payFormBankName : undefined,
      bankAccount: payFormMethod === 'Transfer Bank' ? payFormBankAccount : undefined,
      bankHolder: payFormMethod === 'Transfer Bank' ? payFormBankHolder : undefined,
      paymentReference: payFormReference || undefined,
      postToExpense: payFormPostToExpense,
      notes: payFormNotes || targetIncentiveForPayment.notes,
      updatedAt: new Date().toISOString(),
    };

    onSaveIncentive(updated);
    setIsPaymentModalOpen(false);
    setTargetIncentiveForPayment(null);
    setSuccessMessage(
      `Pembayaran Insentif #${updated.calculationNumber} (${formatRupiah(updated.totalIncentiveAmount)}) Berhasil Disimpan & Dicairkan!`
    );
    setTimeout(() => setSuccessMessage(null), 5000);
  };

  // Revert payment status back to Draft / Belum Dibayar
  const handleRevertPayment = (record: IncentiveRecord) => {
    if (!confirm(`Batalkan status pembayaran untuk insentif #${record.calculationNumber}?`)) return;
    const reverted: IncentiveRecord = {
      ...record,
      status: 'Divalidasi',
      paymentStatus: 'Belum Dibayar',
      paymentDate: undefined,
      paymentReference: undefined,
      updatedAt: new Date().toISOString(),
    };
    onSaveIncentive(reverted);
    setSuccessMessage(`Status pembayaran insentif #${record.calculationNumber} dikembalikan ke Belum Dibayar.`);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  // Calculate and directly open payment modal
  const handleCalculateAndPayDirectly = () => {
    const saved = handleSaveCalculation();
    if (saved) {
      handleOpenPaymentModal(saved);
    }
  };

  // Push directly to salary form (optional legacy integration)
  const handlePushToSalary = () => {
    const saved = handleSaveCalculation();
    if (onNavigateToSalaryFormWithIncentive && saved) {
      onNavigateToSalaryFormWithIncentive(saved);
    }
  };

  // Export table to Excel
  const handleExportExcel = () => {
    const data = matchedSales.map((s, idx) => ({
      No: idx + 1,
      Tanggal: s.date,
      'No Surat Jalan': s.deliveryNoteNumber,
      'No PO': s.poNumber,
      Klien: s.clientName,
      'Nama Barang': s.itemName,
      Quarry: s.quarry,
      'Tujuan Pengiriman': s.destination,
      Sopir: s.driverName || '-',
      'No Polisi': s.vehiclePlate || '-',
      Volume: s.volume,
      Satuan: s.unit,
      'Harga Jual': s.price,
      'Total DPP Penjualan': s.totalAmount,
      'Tarif Insentif': s.rateApplied,
      'Status Tarif': s.isCustomRate ? 'Tarif Khusus' : 'Tarif Dasar',
      'Nilai Insentif': s.incentiveAmount,
    }));

    exportTableToExcel(data, `Rekap_Insentif_${targetEmployeeName.replace(/\s+/g, '_')}_${startDate}_${endDate}`);
  };

  // History KPIs & Counts
  const historyStats = useMemo(() => {
    let totalAmount = 0;
    let paidAmount = 0;
    let pendingAmount = 0;
    let totalVol = 0;
    let paidCount = 0;
    let pendingCount = 0;

    incentives.forEach((inc) => {
      totalAmount += inc.totalIncentiveAmount || 0;
      totalVol += inc.totalVolume || 0;
      const isPaid = inc.status === 'Dibayar' || inc.paymentStatus === 'Dibayar';
      if (isPaid) {
        paidAmount += inc.totalIncentiveAmount || 0;
        paidCount++;
      } else {
        pendingAmount += inc.totalIncentiveAmount || 0;
        pendingCount++;
      }
    });

    return {
      totalAmount,
      paidAmount,
      pendingAmount,
      totalVol,
      paidCount,
      pendingCount,
      totalCount: incentives.length,
    };
  }, [incentives]);

  // Filtered History Records
  const filteredHistory = useMemo(() => {
    return incentives.filter((rec) => {
      // Month filter
      if (historyMonthFilter !== 'semua') {
        if (!rec.date.startsWith(historyMonthFilter)) return false;
      }

      // Payment Status filter
      const isPaid = rec.status === 'Dibayar' || rec.paymentStatus === 'Dibayar';
      if (historyStatusFilter === 'belum_dibayar' && isPaid) return false;
      if (historyStatusFilter === 'sudah_dibayar' && !isPaid) return false;

      // Search Query
      if (historySearch) {
        const q = historySearch.toLowerCase();
        return (
          rec.calculationNumber.toLowerCase().includes(q) ||
          rec.employeeName.toLowerCase().includes(q) ||
          rec.title.toLowerCase().includes(q) ||
          (rec.paymentReference && rec.paymentReference.toLowerCase().includes(q)) ||
          (rec.notes && rec.notes.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [incentives, historySearch, historyMonthFilter, historyStatusFilter]);

  return (
    <div id="incentive-view-root" className="space-y-4 pb-12">
      {/* Top Banner & Tab Controls */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-900 leading-none">
                Kalkulator & Form Insentif Penjualan
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                Terintegrasi Otomatis
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Perhitungan insentif otomatis berdasarkan volume penjualan pada rentang hari, nama barang & tujuan pengiriman
            </p>
          </div>
        </div>

        {/* Sub-tab switcher */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
          <button
            id="subtab-kalkulator"
            onClick={() => setActiveSubTab('kalkulator')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'kalkulator'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Form & Kalkulator Insentif</span>
          </button>
          <button
            id="subtab-riwayat"
            onClick={() => setActiveSubTab('riwayat')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'riwayat'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Riwayat & Dokumen ({incentives.length})</span>
          </button>
        </div>
      </div>

      {/* Success Notification Alert */}
      {successMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-lg text-xs flex items-center justify-between shadow-xs animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-700 hover:text-emerald-950 text-xs font-bold px-2 py-0.5 rounded"
          >
            Tutup
          </button>
        </div>
      )}

      {activeSubTab === 'kalkulator' ? (
        /* ==================== TAB 1: FORMULIR & KALKULATOR INSENTIF ==================== */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left Column: Calculation Parameters (4 cols on lg) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <div className="border-b border-slate-100 pb-2.5 flex items-center justify-between">
                <span className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-blue-600" />
                  <span>1. Karyawan & Rentang Hari</span>
                </span>
                <span className="text-[10px] text-slate-400">Parameter Filter</span>
              </div>

              {/* Employee Selector */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Pilih Karyawan / Penerima Insentif:
                </label>
                <select
                  value={selectedEmployeeId}
                  onChange={(e) => handleEmployeeChange(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 bg-white focus:ring-1 focus:ring-emerald-500"
                >
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.role}) - NIK: {emp.nik}
                    </option>
                  ))}
                </select>
              </div>

              {/* Role badge */}
              {currentEmployee && (
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Jabatan & Bank:</span>
                    <span className="font-semibold text-slate-800">{currentEmployee.role}</span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-600">
                    {currentEmployee.bankName} - {currentEmployee.bankAccount}
                  </span>
                </div>
              )}

              {/* Date Range Controls */}
              <div className="space-y-2">
                <label className="block text-[11px] font-semibold text-slate-700">
                  Rentang Hari Penjualan:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-slate-500 block mb-0.5">Dari Tanggal:</span>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs font-medium text-slate-800"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block mb-0.5">Sampai Tanggal:</span>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs font-medium text-slate-800"
                    />
                  </div>
                </div>

                {/* Quick Date Presets */}
                <div className="flex flex-wrap gap-1 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setStartDate(todayStr);
                      setEndDate(todayStr);
                    }}
                    className="px-2 py-0.5 rounded text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                  >
                    Hari Ini
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date();
                      d.setDate(d.getDate() - 7);
                      const y = d.getFullYear();
                      const m = String(d.getMonth() + 1).padStart(2, '0');
                      const day = String(d.getDate()).padStart(2, '0');
                      setStartDate(`${y}-${m}-${day}`);
                      setEndDate(todayStr);
                    }}
                    className="px-2 py-0.5 rounded text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                  >
                    7 Hari Terakhir
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setStartDate(monthStartStr);
                      setEndDate(todayStr);
                    }}
                    className="px-2 py-0.5 rounded text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                  >
                    Bulan Ini ({todayStr.slice(0, 7)})
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setStartDate('2026-08-01');
                      setEndDate('2026-08-31');
                    }}
                    className="px-2 py-0.5 rounded text-[10px] bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold border border-emerald-200"
                  >
                    Agustus 2026
                  </button>
                </div>
              </div>

              {/* Employee Custom Rates Information Banner */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-start gap-2 p-2.5 bg-emerald-50/70 rounded-lg border border-emerald-200/80">
                  <Sliders className="w-4 h-4 text-emerald-700 mt-0.5 shrink-0" />
                  <div className="text-xs">
                    <span className="font-bold text-emerald-950 block">
                      Tarif Terhubung dengan Form Data Karyawan
                    </span>
                    <p className="text-[10.5px] text-emerald-800 mt-0.5">
                      Perhitungan otomatis merujuk pada tarif dasar & tarif khusus per barang/tujuan yang telah diatur pada data <strong>{targetEmployeeName}</strong>.
                    </p>
                    {currentEmployee?.customIncentiveRates && currentEmployee.customIncentiveRates.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-300 text-[9.5px] font-semibold">
                          ✓ {currentEmployee.customIncentiveRates.length} Tarif Barang Khusus Aktif dari Master Data
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Criteria 2: Nama Barang (Material Filter) */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-emerald-600" />
                  <span>2. Filter Beberapa Nama Barang</span>
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedItemNames([])}
                    className="text-[10px] text-blue-600 hover:underline"
                  >
                    Semua ({allMaterialNames.length})
                  </button>
                  {selectedItemNames.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedItemNames([])}
                      className="text-[10px] text-rose-600 hover:underline"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1 bg-slate-50 rounded-lg border border-slate-200">
                {allMaterialNames.map((name) => {
                  const isSelected = selectedItemNames.includes(name);
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
                {selectedItemNames.length === 0
                  ? '✓ Semua jenis material dimasukkan ke dalam perhitungan insentif.'
                  : `✓ ${selectedItemNames.length} jenis material terpilih.`}
              </p>
            </div>

            {/* Criteria 3: Tujuan Pengiriman Filter */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-amber-600" />
                  <span>3. Filter Tujuan Pengiriman</span>
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedDestinations([])}
                    className="text-[10px] text-blue-600 hover:underline"
                  >
                    Semua ({allDestinations.length})
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

              <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1 bg-slate-50 rounded-lg border border-slate-200">
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
                  ? '✓ Semua lokasi tujuan proyek dimasukkan ke dalam perhitungan insentif.'
                  : `✓ ${selectedDestinations.length} lokasi tujuan terpilih.`}
              </p>
            </div>

            {/* Criteria 4: Tarif Insentif & Pengaturan Beda per Barang & Tujuan */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <div className="border-b border-slate-100 pb-2 flex items-center justify-between">
                <span className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  <span>4. Model & Nilai Tarif Insentif</span>
                </span>
              </div>

              <div className="space-y-3">
                {/* Rate Type Switcher */}
                <div className="grid grid-cols-3 gap-1.5 text-center text-xs">
                  <button
                    type="button"
                    onClick={() => setRateType('per_unit_volume')}
                    className={`p-2 rounded-lg border font-semibold text-[11px] transition-colors ${
                      rateType === 'per_unit_volume'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Rp / Unit Volume
                  </button>
                  <button
                    type="button"
                    onClick={() => setRateType('percentage_sales')}
                    className={`p-2 rounded-lg border font-semibold text-[11px] transition-colors ${
                      rateType === 'percentage_sales'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    % Omset Penjualan
                  </button>
                  <button
                    type="button"
                    onClick={() => setRateType('fixed_trip')}
                    className={`p-2 rounded-lg border font-semibold text-[11px] transition-colors ${
                      rateType === 'fixed_trip'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Rp / Rit (Trip)
                  </button>
                </div>

                {rateType === 'per_unit_volume' && (
                  <div className="space-y-3">
                    {/* Toggle: Variable Rate per Item & Destination */}
                    <div className="p-2.5 bg-emerald-50/80 rounded-lg border border-emerald-200 space-y-1.5">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={useVariableRates}
                          onChange={(e) => setUseVariableRates(e.target.checked)}
                          className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                        />
                        <span className="text-xs font-bold text-emerald-950">
                          Tarif Berbeda per Barang & Tujuan Pengiriman
                        </span>
                      </label>
                      <p className="text-[10px] text-emerald-800 leading-tight">
                        {useVariableRates
                          ? '✓ Tarif dapat diatur spesifik untuk setiap kombinasi nama barang dan lokasi tujuan di bawah ini.'
                          : 'Mode tarif flat aktif. Seluruh material dan tujuan menggunakan tarif dasar yang sama.'}
                      </p>
                    </div>

                    {/* Base Rate Default */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center justify-between">
                        <span>{useVariableRates ? 'Tarif Dasar Default (Rp / Unit):' : 'Tarif per Unit Volume (m³ / ton):'}</span>
                        {useVariableRates && <span className="text-[10px] text-slate-500">Tarif standar</span>}
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-xs">
                          Rp
                        </span>
                        <input
                          type="number"
                          value={ratePerUnit}
                          onChange={(e) => setRatePerUnit(Number(e.target.value))}
                          min={0}
                          step={500}
                          className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-sm font-bold text-emerald-700 bg-white"
                        />
                      </div>
                      {/* Quick rate pills */}
                      <div className="flex gap-1.5 mt-1.5">
                        {[3000, 5000, 7500, 10000].map((rate) => (
                          <button
                            key={rate}
                            type="button"
                            onClick={() => setRatePerUnit(rate)}
                            className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] rounded border border-slate-200"
                          >
                            {formatRupiah(rate)}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Specific Rates Matrix / List */}
                    {useVariableRates && (
                      <div className="space-y-2 pt-2 border-t border-slate-200">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                            <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />
                            <span>Tarif Khusus per Rute & Material:</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => setShowAddRuleModal(true)}
                            className="text-[10px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-0.5"
                          >
                            <Plus className="w-3 h-3" />
                            <span>+ Aturan Khusus</span>
                          </button>
                        </div>

                        {activeItemDestinationPairs.length === 0 ? (
                          <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-center text-slate-500 text-[11px]">
                            Belum ada kombinasi transaksi pada filter saat ini.
                          </div>
                        ) : (
                          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                            {activeItemDestinationPairs.map((pair) => {
                              const key = `${pair.itemName}:::${pair.destination}`;
                              const currentRate =
                                customRateMap[key] !== undefined
                                  ? customRateMap[key]
                                  : ratePerUnit;
                              const isCustom = customRateMap[key] !== undefined;

                              return (
                                <div
                                  key={key}
                                  className={`p-2.5 rounded-lg border text-xs transition-colors ${
                                    isCustom
                                      ? 'bg-blue-50/60 border-blue-200 shadow-2xs'
                                      : 'bg-slate-50/80 border-slate-200'
                                  }`}
                                >
                                  <div className="flex items-start justify-between gap-1 mb-1">
                                    <div>
                                      <div className="font-bold text-slate-900 leading-tight">
                                        {pair.itemName}
                                      </div>
                                      <div className="text-[11px] text-slate-600 flex items-center gap-1">
                                        <MapPin className="w-3 h-3 text-amber-600 shrink-0" />
                                        <span>{pair.destination}</span>
                                      </div>
                                      <div className="text-[10px] text-slate-400">
                                        Volume: <span className="font-mono font-bold text-slate-700">{formatNumber(pair.volume)} m³</span> ({pair.count} SJ)
                                      </div>
                                    </div>

                                    {isCustom && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const next = { ...customRateMap };
                                          delete next[key];
                                          setCustomRateMap(next);
                                        }}
                                        className="text-[10px] text-rose-600 hover:underline shrink-0"
                                        title="Kembalikan ke tarif default"
                                      >
                                        Reset
                                      </button>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-2 mt-1">
                                    <div className="relative flex-1">
                                      <span className="absolute inset-y-0 left-0 pl-2 flex items-center text-slate-400 text-[11px]">
                                        Rp
                                      </span>
                                      <input
                                        type="number"
                                        value={currentRate}
                                        onChange={(e) =>
                                          setRateForPair(pair.itemName, pair.destination, Number(e.target.value))
                                        }
                                        step={500}
                                        min={0}
                                        className={`w-full pl-7 pr-2 py-1 border rounded-md text-xs font-mono font-bold ${
                                          isCustom
                                            ? 'border-blue-400 bg-white text-blue-900'
                                            : 'border-slate-300 bg-white text-slate-800'
                                        }`}
                                      />
                                    </div>
                                    <div className="text-right font-mono text-[11px] shrink-0">
                                      <span className="font-bold text-emerald-800">
                                        {formatRupiah(pair.volume * currentRate)}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Quick Rate Pills */}
                                  <div className="flex gap-1 mt-1.5">
                                    {[3500, 5000, 6000, 7500, 10000].map((pr) => (
                                      <button
                                        key={pr}
                                        type="button"
                                        onClick={() => setRateForPair(pair.itemName, pair.destination, pr)}
                                        className={`px-1.5 py-0.5 rounded text-[9px] font-medium border ${
                                          currentRate === pr
                                            ? 'bg-blue-600 text-white border-blue-600'
                                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                                        }`}
                                      >
                                        {formatRupiah(pr)}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Additional Manual Custom Rules */}
                        {manualCustomRules.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-slate-200">
                            <span className="text-[10px] font-bold text-slate-700 block mb-1">
                              Aturan Khusus Lainnya ({manualCustomRules.length}):
                            </span>
                            <div className="space-y-1">
                              {manualCustomRules.map((rule, idx) => (
                                <div
                                  key={rule.id || idx}
                                  className="flex items-center justify-between p-1.5 bg-slate-50 rounded border border-slate-200 text-[10px]"
                                >
                                  <div>
                                    <span className="font-bold text-slate-800">{rule.itemName}</span>
                                    <span className="text-slate-400"> → </span>
                                    <span className="text-slate-600">{rule.destination}</span>
                                    <span className="text-emerald-700 font-mono font-bold ml-1.5">
                                      {formatRupiah(rule.ratePerUnit)}
                                    </span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setManualCustomRules((prev) => prev.filter((_, i) => i !== idx))
                                    }
                                    className="text-rose-600 hover:text-rose-800"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {rateType === 'percentage_sales' && (
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Persentase dari Nilai DPP Penjualan:
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={ratePercentage}
                        onChange={(e) => setRatePercentage(Number(e.target.value))}
                        min={0}
                        max={100}
                        step={0.1}
                        className="w-full pr-8 pl-3 py-1.5 border border-slate-300 rounded-lg text-sm font-bold text-emerald-700"
                      />
                      <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 text-xs font-bold">
                        %
                      </span>
                    </div>
                  </div>
                )}

                {rateType === 'fixed_trip' && (
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Tarif Tetap per Rit / Trip Surat Jalan:
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-xs">
                        Rp
                      </span>
                      <input
                        type="number"
                        value={ratePerTrip}
                        onChange={(e) => setRatePerTrip(Number(e.target.value))}
                        min={0}
                        step={5000}
                        className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-sm font-bold text-emerald-700"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Catatan / Keterangan Dokumen:
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Insentif ritase proyek jalan tol periode 1-15 Agustus"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs text-slate-800"
                />
              </div>
            </div>
          </div>

          {/* Right Column: Live Calculation Summary & Matched Delivery Notes (8 cols on lg) */}
          <div className="lg:col-span-8 space-y-4">
            {/* Live KPI Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[10px] uppercase font-bold tracking-wider">Surat Jalan Cocok</span>
                  <Truck className="w-4 h-4 text-blue-500" />
                </div>
                <div className="text-lg font-bold text-slate-900 mt-1">
                  {matchedSales.length} <span className="text-xs font-normal text-slate-500">SJ</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Sesuai rentang & kriteria</div>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[10px] uppercase font-bold tracking-wider">Total Volume</span>
                  <Layers className="w-4 h-4 text-indigo-500" />
                </div>
                <div className="text-lg font-bold text-blue-700 mt-1 font-mono">
                  {formatNumber(totalVolume)} <span className="text-xs font-normal text-slate-500">m³/ton</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {activeItemDestinationPairs.length} kombinasi rute
                </div>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[10px] uppercase font-bold tracking-wider">Omset Penjualan</span>
                  <TrendingUp className="w-4 h-4 text-amber-500" />
                </div>
                <div className="text-sm font-bold text-slate-800 mt-1.5 font-mono">
                  {formatRupiah(totalSalesAmount)}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Dasar DPP Penjualan</div>
              </div>

              <div className="bg-emerald-50 p-3.5 rounded-xl border-2 border-emerald-300 shadow-xs">
                <div className="flex items-center justify-between text-emerald-800">
                  <span className="text-[10px] uppercase font-bold tracking-wider">TOTAL INSENTIF</span>
                  <Zap className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-xl font-bold text-emerald-800 mt-0.5 font-mono">
                  {formatRupiah(totalIncentiveAmount)}
                </div>
                <div className="text-[10px] text-emerald-700 font-medium mt-0.5 flex items-center justify-between">
                  <span>Siap terintegrasi ke Gaji</span>
                  {useVariableRates && customRatesCount > 0 && (
                    <span className="font-bold text-[9px] bg-emerald-200 text-emerald-900 px-1 py-0.5 rounded">
                      {customRatesCount} Khusus
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs">
                <span className="font-bold text-slate-800">Penerima:</span>
                <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-semibold">
                  {targetEmployeeName} ({targetEmployeeRole})
                </span>
                <span className="text-slate-400">|</span>
                <span className="text-slate-600">
                  {formatDateIndo(startDate)} s/d {formatDateIndo(endDate)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportExcel}
                  disabled={matchedSales.length === 0}
                  className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                  title="Export rincian ke Excel"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Excel</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const tempRec: IncentiveRecord = {
                      id: 'preview',
                      calculationNumber: 'PREVIEW-INSENTIF',
                      date: getTodayDateString(),
                      title: `Insentif ${targetEmployeeName}`,
                      employeeName: targetEmployeeName,
                      employeeRole: targetEmployeeRole,
                      startDate,
                      endDate,
                      selectedItemNames,
                      selectedDestinations,
                      rateType,
                      ratePerUnit,
                      ratePercentage,
                      ratePerTrip,
                      matchedSales,
                      totalMatchedSalesCount: matchedSales.length,
                      totalVolume,
                      totalSalesAmount,
                      totalIncentiveAmount,
                      useVariableRates,
                      customRates: Object.entries(customRateMap).map(([key, val]) => {
                        const [item, dest] = key.split(':::');
                        return {
                          id: `cr-${key}`,
                          itemName: item,
                          destination: dest,
                          ratePerUnit: Number(val),
                        };
                      }),
                      status: 'Divalidasi',
                      notes,
                      createdAt: new Date().toISOString(),
                    };
                    setSelectedIncentiveForPrint(tempRec);
                    setPrintModalOpen(true);
                  }}
                  disabled={matchedSales.length === 0}
                  className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveCalculation}
                  disabled={matchedSales.length === 0}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                  title="Simpan dokumen perhitungan insentif sebagai arsip"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Simpan Dokumen</span>
                </button>

                <button
                  type="button"
                  onClick={handleCalculateAndPayDirectly}
                  disabled={matchedSales.length === 0}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                  title="Simpan dan buka form pencairan / pembayaran insentif terpisah"
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>Bayar & Cairkan Insentif (Terpisah)</span>
                </button>

                <button
                  type="button"
                  onClick={handlePushToSalary}
                  disabled={matchedSales.length === 0}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-blue-600 hover:bg-blue-50 border border-blue-200 font-semibold text-xs rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                  title="Opsi jika ingin digabungkan ke Form Slip Gaji Bulanan"
                >
                  <Zap className="w-3 h-3" />
                  <span className="text-[11px]">Ke Form Gaji</span>
                </button>
              </div>
            </div>

            {/* Matched Sales Detail Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-emerald-600" />
                    <span>Rincian Surat Jalan Penjualan yang Terhitung ({matchedSales.length} Transaksi)</span>
                  </span>
                  <p className="text-[11px] text-slate-500">
                    Daftar pengiriman riil dengan tarif insentif otomatis sesuai barang & rute tujuan
                  </p>
                </div>

                <div className="w-full sm:w-64 relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari SJ, barang, tujuan, sopir..."
                    value={searchTableQuery}
                    onChange={(e) => setSearchTableQuery(e.target.value)}
                    className="w-full pl-8 pr-2.5 py-1 text-xs border border-slate-300 rounded-lg bg-white focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="overflow-x-auto max-h-96 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-700 font-semibold sticky top-0 border-b border-slate-200 z-10">
                    <tr>
                      <th className="py-2 px-3 text-center w-8">No</th>
                      <th className="py-2 px-3">Tanggal</th>
                      <th className="py-2 px-3">No Surat Jalan</th>
                      <th className="py-2 px-3">Nama Barang</th>
                      <th className="py-2 px-3">Tujuan Pengiriman</th>
                      <th className="py-2 px-3">Sopir / Nopol</th>
                      <th className="py-2 px-3 text-right">Volume</th>
                      <th className="py-2 px-3 text-right">Tarif Diterapkan</th>
                      <th className="py-2 px-3 text-right">Nilai Insentif</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredSalesForTable.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-10 text-center text-slate-400">
                          <div className="max-w-md mx-auto space-y-1">
                            <AlertCircle className="w-7 h-7 mx-auto text-slate-300" />
                            <p className="font-semibold text-slate-600">Tidak ada surat jalan yang cocok</p>
                            <p className="text-[11px] text-slate-400">
                              Coba sesuaikan rentang tanggal atau pilih jenis barang/tujuan lainnya.
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredSalesForTable.map((s, idx) => (
                        <tr key={s.saleId} className="hover:bg-slate-50 transition-colors">
                          <td className="py-2 px-3 text-center text-slate-400">{idx + 1}</td>
                          <td className="py-2 px-3 whitespace-nowrap text-slate-700">{formatDateIndo(s.date)}</td>
                          <td className="py-2 px-3 font-mono font-medium text-slate-900">{s.deliveryNoteNumber}</td>
                          <td className="py-2 px-3 text-slate-800 font-medium">{s.itemName}</td>
                          <td className="py-2 px-3 text-slate-600">{s.destination}</td>
                          <td className="py-2 px-3 text-slate-600">
                            <span className="font-medium text-slate-800">{s.driverName || '-'}</span>{' '}
                            {s.vehiclePlate && <span className="text-[10px] text-slate-400 font-mono">({s.vehiclePlate})</span>}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                            {formatNumber(s.volume)} {s.unit}
                          </td>
                          <td className="py-2 px-3 text-right text-slate-700 font-mono whitespace-nowrap">
                            <span className="font-bold text-slate-900">
                              {rateType === 'per_unit_volume'
                                ? formatRupiah(s.rateApplied)
                                : rateType === 'percentage_sales'
                                ? `${s.rateApplied}%`
                                : formatRupiah(s.rateApplied)}
                            </span>
                            {s.isCustomRate && (
                              <span className="ml-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                                Khusus
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700">
                            {formatRupiah(s.incentiveAmount)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {filteredSalesForTable.length > 0 && (
                    <tfoot className="bg-slate-100 border-t-2 border-slate-300 font-bold text-slate-900 sticky bottom-0">
                      <tr>
                        <td colSpan={6} className="py-2.5 px-3 text-right uppercase tracking-wider text-[11px]">
                          TOTAL ({filteredSalesForTable.length} SURAT JALAN):
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-blue-700">
                          {formatNumber(totalVolume)} Unit
                        </td>
                        <td></td>
                        <td className="py-2.5 px-3 text-right font-mono text-emerald-800 text-sm">
                          {formatRupiah(totalIncentiveAmount)}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ==================== TAB 2: RIWAYAT & PEMBAYARAN INSENTIF TERPISAH ==================== */
        <div className="space-y-4">
          {/* Top KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[10px] uppercase font-bold tracking-wider">Total Nilai Insentif</span>
                <Award className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-lg font-bold text-slate-900 mt-1 font-mono">
                {formatRupiah(historyStats.totalAmount)}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                {historyStats.totalCount} dokumen terhitung
              </div>
            </div>

            <div className="bg-emerald-50 p-3.5 rounded-xl border border-emerald-200 shadow-xs">
              <div className="flex items-center justify-between text-emerald-700">
                <span className="text-[10px] uppercase font-bold tracking-wider">Sudah Dibayar / Cair</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-lg font-bold text-emerald-900 mt-1 font-mono">
                {formatRupiah(historyStats.paidAmount)}
              </div>
              <div className="text-[10px] text-emerald-700 mt-0.5">
                {historyStats.paidCount} pembayaran lunas
              </div>
            </div>

            <div className="bg-amber-50 p-3.5 rounded-xl border border-amber-200 shadow-xs">
              <div className="flex items-center justify-between text-amber-700">
                <span className="text-[10px] uppercase font-bold tracking-wider">Menunggu Pembayaran</span>
                <AlertCircle className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-lg font-bold text-amber-900 mt-1 font-mono">
                {formatRupiah(historyStats.pendingAmount)}
              </div>
              <div className="text-[10px] text-amber-700 mt-0.5">
                {historyStats.pendingCount} voucher belum dicairkan
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[10px] uppercase font-bold tracking-wider">Total Volume Pengiriman</span>
                <Layers className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-lg font-bold text-indigo-900 mt-1 font-mono">
                {formatNumber(historyStats.totalVol)} <span className="text-xs font-normal text-slate-500">m³</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                Akumulasi seluruh dokumen
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden space-y-4 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span>Riwayat & Pembayaran Insentif Terpisah</span>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                    Mandiri & Terpisah dari Gaji
                  </span>
                </h2>
                <p className="text-xs text-slate-500">
                  Kelola dokumen insentif pengiriman, lakukan pembayaran/pencairan langsung, cetak bukti voucher, dan catat ke beban operasional
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-52 relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari no insentif, nama..."
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    className="w-full pl-8 pr-2.5 py-1 text-xs border border-slate-300 rounded-lg bg-white"
                  />
                </div>

                <button
                  onClick={() => setActiveSubTab('kalkulator')}
                  className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Hitung Baru</span>
                </button>
              </div>
            </div>

            {/* Status Filter Tabs & Month Filter */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
                <button
                  type="button"
                  onClick={() => setHistoryStatusFilter('semua')}
                  className={`px-3 py-1 rounded font-semibold transition-all ${
                    historyStatusFilter === 'semua'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Semua ({historyStats.totalCount})
                </button>
                <button
                  type="button"
                  onClick={() => setHistoryStatusFilter('belum_dibayar')}
                  className={`px-3 py-1 rounded font-semibold transition-all flex items-center gap-1.5 ${
                    historyStatusFilter === 'belum_dibayar'
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'text-amber-800 hover:text-amber-950'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-amber-300"></span>
                  <span>Belum Dibayar ({historyStats.pendingCount})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setHistoryStatusFilter('sudah_dibayar')}
                  className={`px-3 py-1 rounded font-semibold transition-all flex items-center gap-1.5 ${
                    historyStatusFilter === 'sudah_dibayar'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-emerald-800 hover:text-emerald-950'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-300"></span>
                  <span>Sudah Dibayar ({historyStats.paidCount})</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-500 text-[11px]">Bulan:</span>
                <input
                  type="month"
                  value={historyMonthFilter === 'semua' ? '' : historyMonthFilter}
                  onChange={(e) => setHistoryMonthFilter(e.target.value || 'semua')}
                  className="px-2 py-1 border border-slate-300 rounded text-xs text-slate-800 bg-white"
                />
                {historyMonthFilter !== 'semua' && (
                  <button
                    type="button"
                    onClick={() => setHistoryMonthFilter('semua')}
                    className="text-[11px] text-blue-600 hover:underline font-semibold"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>

            {/* History Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">No Dokumen</th>
                    <th className="py-2.5 px-3">Tanggal Hitung & Bayar</th>
                    <th className="py-2.5 px-3">Penerima & Jabatan</th>
                    <th className="py-2.5 px-3">Periode & Volume</th>
                    <th className="py-2.5 px-3 text-right">Tarif</th>
                    <th className="py-2.5 px-3 text-right">Total Insentif</th>
                    <th className="py-2.5 px-3 text-center">Status Pembayaran</th>
                    <th className="py-2.5 px-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredHistory.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        Tidak ada dokumen insentif yang sesuai dengan filter.
                      </td>
                    </tr>
                  ) : (
                    filteredHistory.map((rec) => {
                      const isPaid = rec.status === 'Dibayar' || rec.paymentStatus === 'Dibayar';
                      return (
                        <tr key={rec.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-2.5 px-3">
                            <div className="font-mono font-bold text-slate-900">{rec.calculationNumber}</div>
                            {rec.paymentReference && (
                              <div className="text-[10px] font-mono text-slate-500">Ref: {rec.paymentReference}</div>
                            )}
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="text-slate-800">{formatDateIndo(rec.date)}</div>
                            {isPaid && rec.paymentDate && (
                              <div className="text-[10px] text-emerald-700 font-semibold">
                                Bayar: {formatDateIndo(rec.paymentDate)}
                              </div>
                            )}
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="font-semibold text-slate-900">{rec.employeeName}</div>
                            <div className="text-[10px] text-slate-500">
                              {rec.employeeRole} {rec.bankName ? `(${rec.bankName})` : ''}
                            </div>
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="text-slate-700">
                              {formatDateIndo(rec.startDate)} s/d {formatDateIndo(rec.endDate)}
                            </div>
                            <div className="text-[10px] font-mono font-bold text-blue-700">
                              {formatNumber(rec.totalVolume)} Unit ({rec.totalMatchedSalesCount} SJ)
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-600 font-mono">
                            {rec.rateType === 'per_unit_volume'
                              ? formatRupiah(rec.ratePerUnit)
                              : rec.rateType === 'percentage_sales'
                              ? `${rec.ratePercentage}%`
                              : formatRupiah(rec.ratePerTrip || 0)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700 text-sm">
                            {formatRupiah(rec.totalIncentiveAmount)}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {isPaid ? (
                              <span className="inline-flex flex-col items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                <span>✓ SUDAH DIBAYAR</span>
                                {rec.paymentMethod && (
                                  <span className="text-[9px] font-normal text-emerald-700">
                                    {rec.paymentMethod}
                                  </span>
                                )}
                              </span>
                            ) : (
                              <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                ⏳ BELUM DIBAYAR
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {!isPaid ? (
                                <button
                                  type="button"
                                  onClick={() => handleOpenPaymentModal(rec)}
                                  className="flex items-center gap-1 px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded shadow-xs transition-colors"
                                  title="Bayar & Cairkan Insentif Ini Sekarang"
                                >
                                  <DollarSign className="w-3.5 h-3.5" />
                                  <span>Bayar</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleRevertPayment(rec)}
                                  className="p-1.5 text-slate-500 hover:text-amber-700 hover:bg-amber-50 rounded"
                                  title="Batalkan Status Pembayaran (Ubah ke Belum Dibayar)"
                                >
                                  <RefreshCw className="w-3.5 h-3.5" />
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedIncentiveForPrint(rec);
                                  setPrintModalOpen(true);
                                }}
                                className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded"
                                title="Cetak Bukti Pembayaran / Voucher Insentif"
                              >
                                <Printer className="w-4 h-4" />
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(`Hapus dokumen insentif #${rec.calculationNumber}?`)) {
                                    onDeleteIncentive(rec.id);
                                  }
                                }}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                                title="Hapus Dokumen"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Payment / Disbursement Modal */}
      {isPaymentModalOpen && targetIncentiveForPayment && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-5 shadow-2xl border border-slate-200 space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    Proses Pembayaran Insentif Terpisah
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono">
                    #{targetIncentiveForPayment.calculationNumber}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsPaymentModalOpen(false);
                  setTargetIncentiveForPayment(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Recipient & Amount Summary Banner */}
            <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-emerald-700 uppercase font-bold tracking-wider block">
                  Penerima Insentif:
                </span>
                <span className="text-sm font-bold text-emerald-950">
                  {targetIncentiveForPayment.employeeName}
                </span>
                <span className="text-xs text-emerald-800 block">
                  {targetIncentiveForPayment.employeeRole} | {targetIncentiveForPayment.totalMatchedSalesCount} SJ ({formatNumber(targetIncentiveForPayment.totalVolume)} Unit)
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-emerald-700 uppercase font-bold tracking-wider block">
                  Total Dana Dicairkan:
                </span>
                <span className="text-lg font-bold text-emerald-800 font-mono">
                  {formatRupiah(targetIncentiveForPayment.totalIncentiveAmount)}
                </span>
              </div>
            </div>

            {/* Payment Details Form */}
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tanggal Pembayaran:</label>
                  <input
                    type="date"
                    value={payFormDate}
                    onChange={(e) => setPayFormDate(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-slate-900 bg-white focus:ring-1 focus:ring-emerald-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Metode Pembayaran:</label>
                  <select
                    value={payFormMethod}
                    onChange={(e) => setPayFormMethod(e.target.value as any)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-slate-900 bg-white focus:ring-1 focus:ring-emerald-500 font-semibold"
                  >
                    <option value="Transfer Bank">Transfer Bank</option>
                    <option value="Tunai / Kas">Tunai / Kas Perusahaan</option>
                    <option value="Kas Kecil">Kas Kecil (Petty Cash)</option>
                  </select>
                </div>
              </div>

              {payFormMethod === 'Transfer Bank' && (
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2.5">
                  <span className="text-[11px] font-bold text-slate-800 block">Informasi Rekening Penerima:</span>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-0.5">Nama Bank:</label>
                      <input
                        type="text"
                        value={payFormBankName}
                        onChange={(e) => setPayFormBankName(e.target.value)}
                        placeholder="Contoh: BCA / Mandiri"
                        className="w-full px-2.5 py-1 border border-slate-300 rounded text-slate-900 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-0.5">No. Rekening:</label>
                      <input
                        type="text"
                        value={payFormBankAccount}
                        onChange={(e) => setPayFormBankAccount(e.target.value)}
                        placeholder="1234567890"
                        className="w-full px-2.5 py-1 border border-slate-300 rounded text-slate-900 font-mono bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-0.5">Atas Nama:</label>
                      <input
                        type="text"
                        value={payFormBankHolder}
                        onChange={(e) => setPayFormBankHolder(e.target.value)}
                        placeholder="Nama Pemilik Rekening"
                        className="w-full px-2.5 py-1 border border-slate-300 rounded text-slate-900 bg-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nomor Bukti Transfer / Kuitansi (Opsional):
                </label>
                <input
                  type="text"
                  value={payFormReference}
                  onChange={(e) => setPayFormReference(e.target.value)}
                  placeholder="Contoh: TRF-20260829-001"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-slate-900 font-mono bg-white focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Catatan Pembayaran:</label>
                <input
                  type="text"
                  value={payFormNotes}
                  onChange={(e) => setPayFormNotes(e.target.value)}
                  placeholder="Contoh: Pembayaran insentif ritase disetujui Direktur"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-slate-900 bg-white"
                />
              </div>

              <div className="p-3 bg-blue-50/70 rounded-lg border border-blue-200 flex items-start gap-2">
                <input
                  type="checkbox"
                  id="pay-post-to-expense"
                  checked={payFormPostToExpense}
                  onChange={(e) => setPayFormPostToExpense(e.target.checked)}
                  className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <label htmlFor="pay-post-to-expense" className="text-[11px] text-blue-900 font-medium cursor-pointer">
                  Posting otomatis ke Laporan Pengeluaran Beban Operasional Keuangan (Akun 6-104: Beban Insentif Pengiriman Karyawan)
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setIsPaymentModalOpen(false);
                  setTargetIncentiveForPayment(null);
                }}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmPayment}
                className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Konfirmasi & Bayar Insentif</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printable Modal */}
      <IncentivePrintModal
        isOpen={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
        incentive={selectedIncentiveForPrint}
        companyProfile={companyProfile}
      />

      {/* Add Custom Rate Rule Modal */}
      {showAddRuleModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-emerald-600" />
                <span>Tambah Aturan Tarif Khusus Barang & Tujuan</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddRuleModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Barang / Material:</label>
                <input
                  list="modal-material-options"
                  type="text"
                  placeholder="Pilih atau ketik nama barang..."
                  value={newRuleItem}
                  onChange={(e) => setNewRuleItem(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 bg-white focus:ring-1 focus:ring-emerald-500"
                />
                <datalist id="modal-material-options">
                  {allMaterialNames.map((m) => (
                    <option key={m} value={m} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tujuan Pengiriman / Proyek:</label>
                <input
                  list="modal-dest-options"
                  type="text"
                  placeholder="Pilih atau ketik tujuan (atau '*' untuk semua)..."
                  value={newRuleDest}
                  onChange={(e) => setNewRuleDest(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 bg-white focus:ring-1 focus:ring-emerald-500"
                />
                <datalist id="modal-dest-options">
                  <option value="*" label="* (Semua Tujuan untuk Barang ini)" />
                  {allDestinations.map((d) => (
                    <option key={d} value={d} />
                  ))}
                </datalist>
                <p className="text-[10px] text-slate-400 mt-1">
                  Ketik nama tujuan spesifik, atau tanda <span className="font-mono font-bold">*</span> jika berlaku untuk seluruh tujuan barang ini.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tarif Insentif Khusus (Rp / Unit Volume):</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 font-bold">Rp</span>
                  <input
                    type="number"
                    value={newRuleRate}
                    onChange={(e) => setNewRuleRate(Number(e.target.value))}
                    min={0}
                    step={500}
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-emerald-800 font-bold font-mono text-sm bg-white focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAddRuleModal(false)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!newRuleItem.trim()) {
                    alert('Silakan tentukan nama barang terlebih dahulu.');
                    return;
                  }
                  const item = newRuleItem.trim();
                  const dest = newRuleDest.trim() || '*';
                  const rate = newRuleRate || 0;

                  if (dest !== '*') {
                    // Direct key mapping
                    const key = `${item}:::${dest}`;
                    setCustomRateMap((prev) => ({ ...prev, [key]: rate }));
                  } else {
                    // Manual custom rule item-only
                    setManualCustomRules((prev) => [
                      ...prev,
                      {
                        id: `rule-${Date.now()}`,
                        itemName: item,
                        destination: '*',
                        ratePerUnit: rate,
                      },
                    ]);
                  }

                  setShowAddRuleModal(false);
                  setNewRuleItem('');
                  setNewRuleDest('');
                }}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Simpan Aturan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
