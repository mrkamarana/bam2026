import React, { useState, useMemo, useEffect } from 'react';
import {
  Wallet,
  Zap,
  Plus,
  Search,
  Filter,
  Calendar,
  Layers,
  DollarSign,
  Printer,
  Download,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Users,
  Building2,
  CreditCard,
  FileSpreadsheet,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  Eye,
  Send,
  Sliders,
} from 'lucide-react';
import {
  CompanyProfile,
  Employee,
  IncentiveRecord,
  ItemDestinationIncentiveRate,
  MaterialItem,
  OperationalExpense,
  SalaryRecord,
  SalaryStatus,
  SaleTransaction,
} from '../types';
import {
  compareDateDescending,
  formatDateIndo,
  formatNumber,
  formatRupiah,
  getTodayDateString,
  terbilang,
} from '../utils/formatters';
import { exportTableToExcel } from '../utils/excelHelper';
import { SalarySlipPrintModal } from './SalarySlipPrintModal';
import { QuickIncentiveCalculatorModal } from './QuickIncentiveCalculatorModal';

interface SalaryViewProps {
  employees: Employee[];
  salaries: SalaryRecord[];
  incentives: IncentiveRecord[];
  sales: SaleTransaction[];
  materials: MaterialItem[];
  companyProfile: CompanyProfile;
  onSaveSalary: (salary: SalaryRecord) => void;
  onDeleteSalary: (id: string) => void;
  onSaveEmployee: (employee: Employee) => void;
  onDeleteEmployee: (id: string) => void;
  onNavigateToIncentiveCalculator?: () => void;
  initialIncentiveToLoad?: IncentiveRecord | null;
  onClearInitialIncentive?: () => void;
}

export const SalaryView: React.FC<SalaryViewProps> = ({
  employees = [],
  salaries = [],
  incentives = [],
  sales = [],
  materials = [],
  companyProfile,
  onSaveSalary,
  onDeleteSalary,
  onSaveEmployee,
  onDeleteEmployee,
  onNavigateToIncentiveCalculator,
  initialIncentiveToLoad,
  onClearInitialIncentive,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'form' | 'rekap' | 'karyawan'>('form');

  const todayStr = getTodayDateString();
  const currentMonthStr = todayStr.slice(0, 7); // YYYY-MM
  const monthStartStr = `${currentMonthStr}-01`;

  // Editing state
  const [editingSalaryId, setEditingSalaryId] = useState<string | null>(null);

  // Form State
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(
    employees.length > 0 ? employees[0].id : ''
  );
  const [periodMonth, setPeriodMonth] = useState<string>(currentMonthStr);
  const [periodStartDate, setPeriodStartDate] = useState<string>(monthStartStr);
  const [periodEndDate, setPeriodEndDate] = useState<string>(todayStr);
  const [paymentDate, setPaymentDate] = useState<string>(todayStr);

  // Earnings
  const [baseSalary, setBaseSalary] = useState<number>(0);
  const [transportAllowance, setTransportAllowance] = useState<number>(0);
  const [mealAllowance, setMealAllowance] = useState<number>(0);
  const [positionAllowance, setPositionAllowance] = useState<number>(0);
  const [attendanceAllowance, setAttendanceAllowance] = useState<number>(0);
  const [overtimeHours, setOvertimeHours] = useState<number>(0);
  const [overtimeRatePerHour, setOvertimeRatePerHour] = useState<number>(25000);
  const [bonusAmount, setBonusAmount] = useState<number>(0);

  // Integrated Incentive State
  const [incentiveCalculationId, setIncentiveCalculationId] = useState<string | undefined>(undefined);
  const [incentiveAmount, setIncentiveAmount] = useState<number>(0);
  const [incentiveSummary, setIncentiveSummary] = useState<{
    startDate: string;
    endDate: string;
    selectedItemNames: string[];
    selectedDestinations: string[];
    totalVolume: number;
    ratePerUnit: number;
    salesCount: number;
  } | undefined>(undefined);

  // Deductions
  const [bpjsKetenagakerjaan, setBpjsKetenagakerjaan] = useState<number>(0);
  const [bpjsKesehatan, setBpjsKesehatan] = useState<number>(0);
  const [pph21Amount, setPph21Amount] = useState<number>(0);
  const [loanDeduction, setLoanDeduction] = useState<number>(0);
  const [lateDeduction, setLateDeduction] = useState<number>(0);
  const [otherDeductions, setOtherDeductions] = useState<number>(0);

  // Status & Notes
  const [salaryStatus, setSalaryStatus] = useState<SalaryStatus>('Draft');
  const [paymentMethod, setPaymentMethod] = useState<'Transfer Bank' | 'Tunai / Kas'>('Transfer Bank');
  const [postToExpense, setPostToExpense] = useState<boolean>(true);
  const [notes, setNotes] = useState<string>('');

  // Quick Incentive Calculator Modal
  const [quickCalcModalOpen, setQuickCalcModalOpen] = useState(false);

  // Print Modal State
  const [selectedSalaryForPrint, setSelectedSalaryForPrint] = useState<SalaryRecord | null>(null);
  const [printModalOpen, setPrintModalOpen] = useState(false);

  // Success message alert
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Rekap Filters
  const [filterRekapMonth, setFilterRekapMonth] = useState<string>('semua');
  const [filterRekapRole, setFilterRekapRole] = useState<string>('semua');
  const [filterRekapStatus, setFilterRekapStatus] = useState<string>('semua');
  const [rekapSearch, setRekapSearch] = useState<string>('');

  // Employee Management Modal
  const [employeeModalOpen, setEmployeeModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [empFormName, setEmpFormName] = useState('');
  const [empFormNik, setEmpFormNik] = useState('');
  const [empFormRole, setEmpFormRole] = useState<Employee['role']>('Sopir / Driver');
  const [empFormPhone, setEmpFormPhone] = useState('');
  const [empFormBaseSalary, setEmpFormBaseSalary] = useState(3000000);
  const [empFormTransport, setEmpFormTransport] = useState(300000);
  const [empFormMeal, setEmpFormMeal] = useState(450000);
  const [empFormPosition, setEmpFormPosition] = useState(0);
  const [empFormAttendance, setEmpFormAttendance] = useState(250000);
  const [empFormBpjsTK, setEmpFormBpjsTK] = useState(85000);
  const [empFormBpjsKes, setEmpFormBpjsKes] = useState(35000);
  const [empFormIncentiveRate, setEmpFormIncentiveRate] = useState(5000);
  const [empFormCustomRates, setEmpFormCustomRates] = useState<ItemDestinationIncentiveRate[]>([]);
  const [newRateItemName, setNewRateItemName] = useState<string>('');
  const [newRateDest, setNewRateDest] = useState<string>('*');
  const [newRateValue, setNewRateValue] = useState<number>(5000);
  const [newRateNotes, setNewRateNotes] = useState<string>('');
  const [empFormBankName, setEmpFormBankName] = useState('BCA');
  const [empFormBankAccount, setEmpFormBankAccount] = useState('');
  const [empFormNotes, setEmpFormNotes] = useState('');

  // Distinct list of destinations from sales
  const allDestinations = useMemo(() => {
    const set = new Set<string>();
    sales.forEach((s) => {
      if (s.destination) set.add(s.destination);
    });
    return Array.from(set);
  }, [sales]);

  // Current selected employee object
  const currentEmployee = useMemo(() => {
    return employees.find((e) => e.id === selectedEmployeeId) || null;
  }, [employees, selectedEmployeeId]);

  // Load employee default values when employee changes (only if not editing existing salary)
  const loadEmployeeDefaults = (emp: Employee) => {
    if (!emp) return;
    setBaseSalary(emp.baseSalary || 0);
    setTransportAllowance(emp.allowances?.transport || 0);
    setMealAllowance(emp.allowances?.meal || 0);
    setPositionAllowance(emp.allowances?.position || 0);
    setAttendanceAllowance(emp.allowances?.attendance || 0);
    setBpjsKetenagakerjaan(emp.bpjsKetenagakerjaan || 0);
    setBpjsKesehatan(emp.bpjsKesehatan || 0);

    // Look for existing saved incentives for this employee in the period
    const matchedIncentive = incentives.find(
      (inc) =>
        inc.employeeId === emp.id &&
        inc.startDate.startsWith(periodMonth)
    );
    if (matchedIncentive) {
      setIncentiveCalculationId(matchedIncentive.id);
      setIncentiveAmount(matchedIncentive.totalIncentiveAmount);
      setIncentiveSummary({
        startDate: matchedIncentive.startDate,
        endDate: matchedIncentive.endDate,
        selectedItemNames: matchedIncentive.selectedItemNames,
        selectedDestinations: matchedIncentive.selectedDestinations,
        totalVolume: matchedIncentive.totalVolume,
        ratePerUnit: matchedIncentive.ratePerUnit,
        salesCount: matchedIncentive.totalMatchedSalesCount,
      });
    } else {
      setIncentiveCalculationId(undefined);
      setIncentiveAmount(0);
      setIncentiveSummary(undefined);
    }
  };

  const handleSelectEmployee = (empId: string) => {
    setSelectedEmployeeId(empId);
    const emp = employees.find((e) => e.id === empId);
    if (emp && !editingSalaryId) {
      loadEmployeeDefaults(emp);
    }
  };

  // Initial load effect
  useEffect(() => {
    if (currentEmployee && !editingSalaryId && baseSalary === 0) {
      loadEmployeeDefaults(currentEmployee);
    }
  }, [currentEmployee]);

  // Handle incoming incentive navigation from IncentiveView
  useEffect(() => {
    if (initialIncentiveToLoad) {
      setActiveSubTab('form');
      // If employee ID matches or employee name matches
      const targetEmp = employees.find(
        (e) =>
          e.id === initialIncentiveToLoad.employeeId ||
          e.name.toLowerCase() === initialIncentiveToLoad.employeeName.toLowerCase()
      );
      if (targetEmp) {
        setSelectedEmployeeId(targetEmp.id);
        loadEmployeeDefaults(targetEmp);
      }
      setIncentiveCalculationId(initialIncentiveToLoad.id);
      setIncentiveAmount(initialIncentiveToLoad.totalIncentiveAmount);
      setIncentiveSummary({
        startDate: initialIncentiveToLoad.startDate,
        endDate: initialIncentiveToLoad.endDate,
        selectedItemNames: initialIncentiveToLoad.selectedItemNames,
        selectedDestinations: initialIncentiveToLoad.selectedDestinations,
        totalVolume: initialIncentiveToLoad.totalVolume,
        ratePerUnit: initialIncentiveToLoad.ratePerUnit,
        salesCount: initialIncentiveToLoad.totalMatchedSalesCount,
      });
      setPeriodStartDate(initialIncentiveToLoad.startDate);
      setPeriodEndDate(initialIncentiveToLoad.endDate);
      setSuccessMessage(
        `Berhasil memuat insentif ${formatRupiah(initialIncentiveToLoad.totalIncentiveAmount)} (${initialIncentiveToLoad.calculationNumber}) ke dalam slip gaji!`
      );
      if (onClearInitialIncentive) onClearInitialIncentive();
    }
  }, [initialIncentiveToLoad]);

  // Calculations
  const totalAllowances = useMemo(() => {
    return (
      (Number(transportAllowance) || 0) +
      (Number(mealAllowance) || 0) +
      (Number(positionAllowance) || 0) +
      (Number(attendanceAllowance) || 0)
    );
  }, [transportAllowance, mealAllowance, positionAllowance, attendanceAllowance]);

  const overtimeAmount = useMemo(() => {
    return (Number(overtimeHours) || 0) * (Number(overtimeRatePerHour) || 0);
  }, [overtimeHours, overtimeRatePerHour]);

  const grossSalary = useMemo(() => {
    return (
      (Number(baseSalary) || 0) +
      totalAllowances +
      overtimeAmount +
      (Number(bonusAmount) || 0) +
      (Number(incentiveAmount) || 0)
    );
  }, [baseSalary, totalAllowances, overtimeAmount, bonusAmount, incentiveAmount]);

  const totalDeductions = useMemo(() => {
    return (
      (Number(bpjsKetenagakerjaan) || 0) +
      (Number(bpjsKesehatan) || 0) +
      (Number(pph21Amount) || 0) +
      (Number(loanDeduction) || 0) +
      (Number(lateDeduction) || 0) +
      (Number(otherDeductions) || 0)
    );
  }, [bpjsKetenagakerjaan, bpjsKesehatan, pph21Amount, loanDeduction, lateDeduction, otherDeductions]);

  const netSalary = useMemo(() => {
    return Math.max(0, grossSalary - totalDeductions);
  }, [grossSalary, totalDeductions]);

  // Save Salary Record
  const handleSaveSalaryRecord = (statusOverride?: SalaryStatus) => {
    if (!currentEmployee) {
      alert('Silakan pilih karyawan terlebih dahulu!');
      return;
    }

    const currentStatus = statusOverride || salaryStatus;

    const slipNumber = editingSalaryId
      ? salaries.find((s) => s.id === editingSalaryId)?.slipNumber || 'SLIP-NEW'
      : `SLIP-${periodMonth.replace('-', '')}-${String(salaries.length + 1).padStart(3, '0')}`;

    const record: SalaryRecord = {
      id: editingSalaryId || `sal-${Date.now()}`,
      slipNumber,
      employeeId: currentEmployee.id,
      employeeName: currentEmployee.name,
      employeeNik: currentEmployee.nik,
      employeeRole: currentEmployee.role,
      periodMonth,
      periodStartDate,
      periodEndDate,
      paymentDate,
      baseSalary: Number(baseSalary) || 0,
      transportAllowance: Number(transportAllowance) || 0,
      mealAllowance: Number(mealAllowance) || 0,
      positionAllowance: Number(positionAllowance) || 0,
      attendanceAllowance: Number(attendanceAllowance) || 0,
      overtimeHours: Number(overtimeHours) || 0,
      overtimeRatePerHour: Number(overtimeRatePerHour) || 0,
      overtimeAmount,
      bonusAmount: Number(bonusAmount) || 0,
      incentiveCalculationId,
      incentiveAmount: Number(incentiveAmount) || 0,
      incentiveSummary,
      bpjsKetenagakerjaan: Number(bpjsKetenagakerjaan) || 0,
      bpjsKesehatan: Number(bpjsKesehatan) || 0,
      pph21Amount: Number(pph21Amount) || 0,
      loanDeduction: Number(loanDeduction) || 0,
      lateDeduction: Number(lateDeduction) || 0,
      otherDeductions: Number(otherDeductions) || 0,
      totalAllowances,
      grossSalary,
      totalDeductions,
      netSalary,
      status: currentStatus,
      paymentMethod,
      bankName: currentEmployee.bankName,
      bankAccount: currentEmployee.bankAccount,
      bankHolder: currentEmployee.bankHolder || currentEmployee.name,
      postToExpense,
      notes: notes || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSaveSalary(record);
    setSuccessMessage(
      `Slip Gaji #${record.slipNumber} untuk ${record.employeeName} berhasil disimpan dengan status "${record.status}"!`
    );
    setTimeout(() => setSuccessMessage(null), 5000);

    // Reset edit state
    setEditingSalaryId(null);
    return record;
  };

  const handleEditSalary = (sal: SalaryRecord) => {
    setEditingSalaryId(sal.id);
    setSelectedEmployeeId(sal.employeeId);
    setPeriodMonth(sal.periodMonth);
    setPeriodStartDate(sal.periodStartDate);
    setPeriodEndDate(sal.periodEndDate);
    setPaymentDate(sal.paymentDate);

    setBaseSalary(sal.baseSalary);
    setTransportAllowance(sal.transportAllowance);
    setMealAllowance(sal.mealAllowance);
    setPositionAllowance(sal.positionAllowance);
    setAttendanceAllowance(sal.attendanceAllowance);
    setOvertimeHours(sal.overtimeHours);
    setOvertimeRatePerHour(sal.overtimeRatePerHour);
    setBonusAmount(sal.bonusAmount);

    setIncentiveCalculationId(sal.incentiveCalculationId);
    setIncentiveAmount(sal.incentiveAmount);
    setIncentiveSummary(sal.incentiveSummary);

    setBpjsKetenagakerjaan(sal.bpjsKetenagakerjaan);
    setBpjsKesehatan(sal.bpjsKesehatan);
    setPph21Amount(sal.pph21Amount);
    setLoanDeduction(sal.loanDeduction);
    setLateDeduction(sal.lateDeduction);
    setOtherDeductions(sal.otherDeductions);

    setSalaryStatus(sal.status);
    setPaymentMethod(sal.paymentMethod);
    setPostToExpense(sal.postToExpense);
    setNotes(sal.notes || '');

    setActiveSubTab('form');
  };

  const handleResetForm = () => {
    setEditingSalaryId(null);
    if (currentEmployee) {
      loadEmployeeDefaults(currentEmployee);
    }
    setOvertimeHours(0);
    setBonusAmount(0);
    setPph21Amount(0);
    setLoanDeduction(0);
    setLateDeduction(0);
    setOtherDeductions(0);
    setSalaryStatus('Draft');
    setNotes('');
  };

  // Filtered Rekap
  const filteredRekapSalaries = useMemo(() => {
    return salaries.filter((sal) => {
      if (filterRekapMonth !== 'semua' && sal.periodMonth !== filterRekapMonth) {
        return false;
      }
      if (filterRekapRole !== 'semua' && sal.employeeRole !== filterRekapRole) {
        return false;
      }
      if (filterRekapStatus !== 'semua' && sal.status !== filterRekapStatus) {
        return false;
      }
      if (rekapSearch) {
        const q = rekapSearch.toLowerCase();
        return (
          sal.slipNumber.toLowerCase().includes(q) ||
          sal.employeeName.toLowerCase().includes(q) ||
          sal.employeeNik.toLowerCase().includes(q) ||
          (sal.notes && sal.notes.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [salaries, filterRekapMonth, filterRekapRole, filterRekapStatus, rekapSearch]);

  // Aggregate Rekap Metrics
  const totalRekapNetSalary = useMemo(() => {
    return filteredRekapSalaries.reduce((sum, s) => sum + s.netSalary, 0);
  }, [filteredRekapSalaries]);

  const totalRekapIncentives = useMemo(() => {
    return filteredRekapSalaries.reduce((sum, s) => sum + s.incentiveAmount, 0);
  }, [filteredRekapSalaries]);

  const totalRekapPaidCount = useMemo(() => {
    return filteredRekapSalaries.filter((s) => s.status === 'Dibayar').length;
  }, [filteredRekapSalaries]);

  // Handle Employee Form Submit
  const handleSaveEmployeeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!empFormName.trim()) {
      alert('Nama karyawan wajib diisi!');
      return;
    }

    const newEmp: Employee = {
      id: editingEmployee ? editingEmployee.id : `emp-${Date.now()}`,
      nik: empFormNik || `EMP-${new Date().getFullYear()}-${String(employees.length + 1).padStart(3, '0')}`,
      name: empFormName.trim(),
      role: empFormRole,
      phone: empFormPhone,
      baseSalary: Number(empFormBaseSalary) || 0,
      allowances: {
        transport: Number(empFormTransport) || 0,
        meal: Number(empFormMeal) || 0,
        position: Number(empFormPosition) || 0,
        attendance: Number(empFormAttendance) || 0,
        other: 0,
      },
      bpjsKetenagakerjaan: Number(empFormBpjsTK) || 0,
      bpjsKesehatan: Number(empFormBpjsKes) || 0,
      defaultIncentiveRate: Number(empFormIncentiveRate) || 0,
      customIncentiveRates: empFormCustomRates,
      bankName: empFormBankName,
      bankAccount: empFormBankAccount,
      bankHolder: empFormName.trim(),
      status: 'Aktif',
      notes: empFormNotes,
    };

    onSaveEmployee(newEmp);
    setEmployeeModalOpen(false);
    setEditingEmployee(null);
  };

  const openNewEmployeeModal = () => {
    setEditingEmployee(null);
    setEmpFormName('');
    setEmpFormNik(`EMP-${new Date().getFullYear()}-${String(employees.length + 1).padStart(3, '0')}`);
    setEmpFormRole('Sopir / Driver');
    setEmpFormPhone('');
    setEmpFormBaseSalary(3000000);
    setEmpFormTransport(300000);
    setEmpFormMeal(450000);
    setEmpFormPosition(0);
    setEmpFormAttendance(250000);
    setEmpFormBpjsTK(85000);
    setEmpFormBpjsKes(35000);
    setEmpFormIncentiveRate(5000);
    setEmpFormCustomRates([]);
    setNewRateItemName('');
    setNewRateDest('*');
    setNewRateValue(5000);
    setNewRateNotes('');
    setEmpFormBankName('BCA');
    setEmpFormBankAccount('');
    setEmpFormNotes('');
    setEmployeeModalOpen(true);
  };

  const openEditEmployeeModal = (emp: Employee) => {
    if (!emp) return;
    setEditingEmployee(emp);
    setEmpFormName(emp.name || '');
    setEmpFormNik(emp.nik || '');
    setEmpFormRole(emp.role || '');
    setEmpFormPhone(emp.phone || '');
    setEmpFormBaseSalary(emp.baseSalary || 0);
    setEmpFormTransport(emp.allowances?.transport || 0);
    setEmpFormMeal(emp.allowances?.meal || 0);
    setEmpFormPosition(emp.allowances?.position || 0);
    setEmpFormAttendance(emp.allowances?.attendance || 0);
    setEmpFormBpjsTK(emp.bpjsKetenagakerjaan || 0);
    setEmpFormBpjsKes(emp.bpjsKesehatan || 0);
    setEmpFormIncentiveRate(emp.defaultIncentiveRate || 0);
    setEmpFormCustomRates(emp.customIncentiveRates ? [...emp.customIncentiveRates] : []);
    setNewRateItemName('');
    setNewRateDest('*');
    setNewRateValue(emp.defaultIncentiveRate || 5000);
    setNewRateNotes('');
    setEmpFormBankName(emp.bankName || 'BCA');
    setEmpFormBankAccount(emp.bankAccount || '');
    setEmpFormNotes(emp.notes || '');
    setEmployeeModalOpen(true);
  };

  // Export Rekap Gaji to Excel
  const handleExportRekapExcel = () => {
    const data = filteredRekapSalaries.map((s, idx) => ({
      No: idx + 1,
      'No Slip': s.slipNumber,
      'Nama Karyawan': s.employeeName,
      NIK: s.employeeNik,
      Jabatan: s.employeeRole,
      Periode: s.periodMonth,
      'Tanggal Bayar': s.paymentDate,
      'Gaji Pokok': s.baseSalary,
      'Total Tunjangan': s.totalAllowances,
      'Insentif Penjualan': s.incentiveAmount,
      Lembur: s.overtimeAmount,
      Bonus: s.bonusAmount,
      'Total Bruto': s.grossSalary,
      'Total Potongan': s.totalDeductions,
      'Gaji Bersih (THP)': s.netSalary,
      Status: s.status,
      'Metode Bayar': s.paymentMethod,
      Rekening: `${s.bankName || '-'} ${s.bankAccount || '-'}`,
    }));

    exportTableToExcel(data, `Rekap_Gaji_${filterRekapMonth}_${companyProfile.name.replace(/\s+/g, '_')}`);
  };

  return (
    <div id="salary-view-root" className="space-y-4 pb-12">
      {/* Top Banner */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-900 leading-none">
                Form Gaji & Penggajian Karyawan
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
                Terintegrasi Insentif
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Slip gaji otomatis lengkap dengan insentif penjualan, tunjangan, potongan & approval
            </p>
          </div>
        </div>

        {/* Sub-tab Navigation */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
          <button
            id="subtab-form-gaji"
            onClick={() => setActiveSubTab('form')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'form'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Formulir Slip Gaji</span>
          </button>
          <button
            id="subtab-rekap-gaji"
            onClick={() => setActiveSubTab('rekap')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'rekap'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Daftar & Rekap Gaji ({salaries.length})</span>
          </button>
          <button
            id="subtab-master-karyawan"
            onClick={() => setActiveSubTab('karyawan')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'karyawan'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Data Karyawan ({employees.length})</span>
          </button>
        </div>
      </div>

      {/* Success Notification Alert */}
      {successMessage && (
        <div className="p-3 bg-blue-50 border border-blue-300 text-blue-900 rounded-lg text-xs flex items-center justify-between shadow-xs animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="font-semibold">{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-blue-700 hover:text-blue-950 text-xs font-bold px-2 py-0.5 rounded"
          >
            Tutup
          </button>
        </div>
      )}

      {/* ==================== SUBTAB 1: FORMULIR INPUT SLIP GAJI ==================== */}
      {activeSubTab === 'form' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Main Form (8 Cols on LG) */}
          <div className="lg:col-span-8 space-y-4">
            {/* Header section of form */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-blue-600" />
                    <span>
                      {editingSalaryId ? 'Edit Data Slip Gaji' : 'Formulir Slip Gaji Karyawan Baru'}
                    </span>
                  </span>
                  <p className="text-[11px] text-slate-500">
                    Isi rincian gaji pokok, tunjangan, dan insentif penjualan yang terhubung otomatis
                  </p>
                </div>

                {editingSalaryId && (
                  <button
                    onClick={handleResetForm}
                    className="px-2.5 py-1 rounded bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200"
                  >
                    Batal Edit (Buat Baru)
                  </button>
                )}
              </div>

              {/* Employee & Period Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Pilih Karyawan:
                  </label>
                  <select
                    value={selectedEmployeeId}
                    onChange={(e) => handleSelectEmployee(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 bg-white"
                  >
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} ({emp.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Periode Bulan:
                  </label>
                  <input
                    type="month"
                    value={periodMonth}
                    onChange={(e) => {
                      setPeriodMonth(e.target.value);
                      setPeriodStartDate(`${e.target.value}-01`);
                    }}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Tanggal Pembayaran:
                  </label>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-800"
                  />
                </div>
              </div>

              {/* Selected Employee Quick Info */}
              {currentEmployee && (
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                      {currentEmployee.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">{currentEmployee.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        NIK: {currentEmployee.nik} | {currentEmployee.role}
                      </div>
                    </div>
                  </div>

                  <div className="text-right text-[11px] text-slate-600">
                    <div>
                      Rekening:{' '}
                      <span className="font-semibold text-slate-900 font-mono">
                        {currentEmployee.bankName} - {currentEmployee.bankAccount}
                      </span>
                    </div>
                    <div>Tarif Insentif Default: {formatRupiah(currentEmployee.defaultIncentiveRate || 0)} / m³</div>
                  </div>
                </div>
              )}
            </div>

            {/* SEKSI INSENTIF PENJUALAN TERINTEGRASI OTOMATIS */}
            <div className="bg-emerald-50/60 p-4 rounded-xl border-2 border-emerald-300 shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-200 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-2xs">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-emerald-950 uppercase tracking-tight">
                      Insentif Penjualan Terintegrasi Otomatis
                    </h3>
                    <p className="text-[11px] text-emerald-800">
                      Nilai insentif dihitung dari volume penjualan pada rentang hari, nama barang & tujuan
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {onNavigateToIncentiveCalculator && (
                    <button
                      type="button"
                      onClick={onNavigateToIncentiveCalculator}
                      className="text-[11px] text-emerald-700 hover:text-emerald-900 underline font-semibold flex items-center gap-1"
                    >
                      <span>Buka Form Insentif Terpisah</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setQuickCalcModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-xs cursor-pointer transition-colors"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>⚡ Tarik & Hitung dari Penjualan</span>
                  </button>
                </div>
              </div>

              {/* Incentive Details Banner */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                <div className="sm:col-span-2 space-y-1">
                  {incentiveSummary ? (
                    <div className="bg-white p-2.5 rounded-lg border border-emerald-300 text-xs space-y-1">
                      <div className="flex items-center justify-between text-emerald-900 font-bold">
                        <span>✓ Terhubung ke Penjualan Riil:</span>
                        <span className="text-[10px] px-1.5 py-0.2 bg-emerald-100 rounded text-emerald-800">
                          {incentiveSummary.salesCount} Surat Jalan
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600">
                        Volume: <strong>{formatNumber(incentiveSummary.totalVolume)} Unit</strong> @ {formatRupiah(incentiveSummary.ratePerUnit)} / unit
                      </p>
                      <p className="text-[10px] text-slate-500">
                        Periode: {formatDateIndo(incentiveSummary.startDate)} s/d {formatDateIndo(incentiveSummary.endDate)}
                      </p>
                    </div>
                  ) : (
                    <div className="bg-white/80 p-2.5 rounded-lg border border-slate-200 text-xs text-slate-600">
                      <span>Belum ada perhitungan insentif terhubung. Klik tombol <strong>"Tarik & Hitung dari Penjualan"</strong> untuk mengambil volume penjualan secara akurat.</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-emerald-900 mb-1">
                    Nilai Insentif Masuk Gaji:
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-emerald-700 text-xs font-bold">
                      Rp
                    </span>
                    <input
                      type="number"
                      value={incentiveAmount}
                      onChange={(e) => setIncentiveAmount(Number(e.target.value))}
                      min={0}
                      className="w-full pl-9 pr-3 py-1.5 bg-white border-2 border-emerald-400 rounded-lg text-sm font-bold text-emerald-800 font-mono focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* SEKSI KOMPONEN PENGHASILAN & POTONGAN */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Earnings Column */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
                <div className="border-b border-slate-100 pb-2 flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900 uppercase tracking-tight flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    <span>Komponen Penghasilan</span>
                  </span>
                  <span className="text-[10px] text-emerald-700 font-bold">Penambahan</span>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 mb-0.5">
                      Gaji Pokok:
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-400 text-xs">
                        Rp
                      </span>
                      <input
                        type="number"
                        value={baseSalary}
                        onChange={(e) => setBaseSalary(Number(e.target.value))}
                        className="w-full pl-8 pr-2.5 py-1.5 border border-slate-300 rounded-md font-semibold text-slate-800"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-medium text-slate-600 mb-0.5">
                        Tunjangan Transport:
                      </label>
                      <input
                        type="number"
                        value={transportAllowance}
                        onChange={(e) => setTransportAllowance(Number(e.target.value))}
                        className="w-full px-2.5 py-1 border border-slate-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-slate-600 mb-0.5">
                        Tunjangan Makan:
                      </label>
                      <input
                        type="number"
                        value={mealAllowance}
                        onChange={(e) => setMealAllowance(Number(e.target.value))}
                        className="w-full px-2.5 py-1 border border-slate-300 rounded-md"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-medium text-slate-600 mb-0.5">
                        Tunjangan Jabatan:
                      </label>
                      <input
                        type="number"
                        value={positionAllowance}
                        onChange={(e) => setPositionAllowance(Number(e.target.value))}
                        className="w-full px-2.5 py-1 border border-slate-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-slate-600 mb-0.5">
                        Tunjangan Kehadiran:
                      </label>
                      <input
                        type="number"
                        value={attendanceAllowance}
                        onChange={(e) => setAttendanceAllowance(Number(e.target.value))}
                        className="w-full px-2.5 py-1 border border-slate-300 rounded-md"
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-medium text-slate-600 mb-0.5">
                        Lembur (Jam):
                      </label>
                      <input
                        type="number"
                        value={overtimeHours}
                        onChange={(e) => setOvertimeHours(Number(e.target.value))}
                        className="w-full px-2.5 py-1 border border-slate-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-slate-600 mb-0.5">
                        Tarif / Jam (Rp):
                      </label>
                      <input
                        type="number"
                        value={overtimeRatePerHour}
                        onChange={(e) => setOvertimeRatePerHour(Number(e.target.value))}
                        className="w-full px-2.5 py-1 border border-slate-300 rounded-md"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 mb-0.5">
                      Bonus Kinerja / THR / Performa:
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-400 text-xs">
                        Rp
                      </span>
                      <input
                        type="number"
                        value={bonusAmount}
                        onChange={(e) => setBonusAmount(Number(e.target.value))}
                        className="w-full pl-8 pr-2.5 py-1.5 border border-slate-300 rounded-md"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Deductions Column */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
                <div className="border-b border-slate-100 pb-2 flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900 uppercase tracking-tight flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-rose-600" />
                    <span>Komponen Potongan</span>
                  </span>
                  <span className="text-[10px] text-rose-700 font-bold">Pengurangan</span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-medium text-slate-600 mb-0.5">
                        BPJS Ketenagakerjaan:
                      </label>
                      <input
                        type="number"
                        value={bpjsKetenagakerjaan}
                        onChange={(e) => setBpjsKetenagakerjaan(Number(e.target.value))}
                        className="w-full px-2.5 py-1 border border-slate-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-slate-600 mb-0.5">
                        BPJS Kesehatan:
                      </label>
                      <input
                        type="number"
                        value={bpjsKesehatan}
                        onChange={(e) => setBpjsKesehatan(Number(e.target.value))}
                        className="w-full px-2.5 py-1 border border-slate-300 rounded-md"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 mb-0.5">
                      Pajak Penghasilan (PPh 21):
                    </label>
                    <input
                      type="number"
                      value={pph21Amount}
                      onChange={(e) => setPph21Amount(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 mb-0.5">
                      Kasbon / Cicilan Pinjaman:
                    </label>
                    <input
                      type="number"
                      value={loanDeduction}
                      onChange={(e) => setLoanDeduction(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-medium text-slate-600 mb-0.5">
                        Potongan Absen / Telat:
                      </label>
                      <input
                        type="number"
                        value={lateDeduction}
                        onChange={(e) => setLateDeduction(Number(e.target.value))}
                        className="w-full px-2.5 py-1 border border-slate-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-slate-600 mb-0.5">
                        Potongan Lainnya:
                      </label>
                      <input
                        type="number"
                        value={otherDeductions}
                        onChange={(e) => setOtherDeductions(Number(e.target.value))}
                        className="w-full px-2.5 py-1 border border-slate-300 rounded-md"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes and Options */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Metode Pembayaran:
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs bg-white"
                  >
                    <option value="Transfer Bank">Transfer Bank ({currentEmployee?.bankName || 'BCA'})</option>
                    <option value="Tunai / Kas">Tunai / Kas</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Status Dokumen Slip Gaji:
                  </label>
                  <select
                    value={salaryStatus}
                    onChange={(e) => setSalaryStatus(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs font-semibold text-slate-800 bg-white"
                  >
                    <option value="Draft">Draft (Belum Disetujui)</option>
                    <option value="Disetujui">Disetujui (Approved)</option>
                    <option value="Dibayar">Dibayar (Lunas Terbayar)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Catatan / Keterangan Slip:
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Gaji bulan Agustus 2026 dan insentif pengiriman pasir proyek tol"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs"
                />
              </div>

              <div className="pt-2 border-t border-slate-100">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={postToExpense}
                    onChange={(e) => setPostToExpense(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                  />
                  <span className="text-xs font-semibold text-slate-800">
                    Posting otomatis ke Beban Operasional & Laporan Keuangan (Akun Beban Gaji 6-103)
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Right Column: Live Summary & Actions (4 Cols on LG) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-4 sticky top-4">
              <div className="border-b border-slate-100 pb-2.5 flex items-center justify-between">
                <span className="font-bold text-xs text-slate-900 uppercase tracking-tight">
                  Ringkasan Slip Gaji
                </span>
                <span className="text-[10px] text-slate-400 font-mono">{periodMonth}</span>
              </div>

              {/* Summary Breakdown */}
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100 text-slate-700">
                  <span>Gaji Pokok:</span>
                  <span className="font-mono font-semibold">{formatRupiah(baseSalary)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 text-slate-700">
                  <span>Total Tunjangan:</span>
                  <span className="font-mono">{formatRupiah(totalAllowances)}</span>
                </div>

                {/* Incentive Line */}
                <div className="flex justify-between py-1 border-b border-slate-100 bg-emerald-50 px-2 rounded text-emerald-900 font-semibold">
                  <span className="flex items-center gap-1">
                    <Zap className="w-3 h-3 text-emerald-600" />
                    <span>Insentif Penjualan:</span>
                  </span>
                  <span className="font-mono">{formatRupiah(incentiveAmount)}</span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-100 text-slate-700">
                  <span>Lembur & Bonus:</span>
                  <span className="font-mono">{formatRupiah(overtimeAmount + (bonusAmount || 0))}</span>
                </div>

                <div className="flex justify-between py-1.5 bg-slate-50 px-2 rounded font-bold text-slate-900">
                  <span>PENGHASILAN BRUTO:</span>
                  <span className="font-mono">{formatRupiah(grossSalary)}</span>
                </div>

                <div className="flex justify-between py-1.5 text-rose-700 px-2">
                  <span>Total Potongan:</span>
                  <span className="font-mono font-bold">- {formatRupiah(totalDeductions)}</span>
                </div>

                {/* Take Home Pay Callout */}
                <div className="p-3 bg-blue-50 border-2 border-blue-400 rounded-xl space-y-1 mt-2">
                  <span className="text-[10px] text-blue-900 font-bold uppercase tracking-wider block">
                    Gaji Bersih (Take Home Pay):
                  </span>
                  <div className="text-xl font-bold text-blue-900 font-mono">
                    {formatRupiah(netSalary)}
                  </div>
                  <p className="text-[10px] italic text-blue-700 leading-tight">
                    "{terbilang(netSalary)}"
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handleSaveSalaryRecord()}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simpan Slip Gaji</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const saved = handleSaveSalaryRecord('Disetujui');
                    if (saved) {
                      setSelectedSalaryForPrint(saved);
                      setPrintModalOpen(true);
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Setujui & Cetak Slip Gaji</span>
                </button>

                <button
                  type="button"
                  onClick={handleResetForm}
                  className="w-full py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
                >
                  Reset Formulir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== SUBTAB 2: DAFTAR & REKAP GAJI KARYAWAN ==================== */}
      {activeSubTab === 'rekap' && (
        <div className="space-y-4">
          {/* Summary KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Total Pengeluaran Gaji</span>
              <div className="text-lg font-bold text-slate-900 mt-1 font-mono">
                {formatRupiah(totalRekapNetSalary)}
              </div>
              <span className="text-[10px] text-slate-400">{filteredRekapSalaries.length} Slip Penggajian</span>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Total Insentif Penjualan</span>
              <div className="text-lg font-bold text-emerald-700 mt-1 font-mono">
                {formatRupiah(totalRekapIncentives)}
              </div>
              <span className="text-[10px] text-slate-400">Dari penjualan lapangan</span>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Slip Terbayar (Lunas)</span>
              <div className="text-lg font-bold text-blue-700 mt-1 font-mono">
                {totalRekapPaidCount} / {filteredRekapSalaries.length} Karyawan
              </div>
              <span className="text-[10px] text-slate-400">Status Pembayaran</span>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Rata-rata Take Home Pay</span>
              <div className="text-lg font-bold text-slate-800 mt-1 font-mono">
                {formatRupiah(
                  filteredRekapSalaries.length > 0 ? totalRekapNetSalary / filteredRekapSalaries.length : 0
                )}
              </div>
              <span className="text-[10px] text-slate-400">Per karyawan</span>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Daftar & Rekapitulasi Slip Gaji Karyawan
                </h2>
                <p className="text-xs text-slate-500">
                  Daftar lengkap penggajian karyawan, upah sopir, staf keuangan dan marketing
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportRekapExcel}
                  className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Excel</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveSubTab('form')}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Buat Slip Gaji Baru</span>
                </button>
              </div>
            </div>

            {/* Filters Row */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari nama, NIK, no slip..."
                  value={rekapSearch}
                  onChange={(e) => setRekapSearch(e.target.value)}
                  className="w-full pl-8 pr-2.5 py-1 border border-slate-300 rounded-lg bg-white"
                />
              </div>

              <div>
                <select
                  value={filterRekapMonth}
                  onChange={(e) => setFilterRekapMonth(e.target.value)}
                  className="w-full px-2.5 py-1 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="semua">Semua Periode Bulan</option>
                  <option value="2026-08">Agustus 2026</option>
                  <option value="2026-07">Juli 2026</option>
                </select>
              </div>

              <div>
                <select
                  value={filterRekapRole}
                  onChange={(e) => setFilterRekapRole(e.target.value)}
                  className="w-full px-2.5 py-1 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="semua">Semua Jabatan</option>
                  <option value="Sopir / Driver">Sopir / Driver</option>
                  <option value="Marketing / Sales">Marketing / Sales</option>
                  <option value="Mandor / Pengawas Lapangan">Mandor / Pengawas</option>
                  <option value="Staf Keuangan & Administrasi">Staf Keuangan</option>
                </select>
              </div>

              <div>
                <select
                  value={filterRekapStatus}
                  onChange={(e) => setFilterRekapStatus(e.target.value)}
                  className="w-full px-2.5 py-1 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="semua">Semua Status Pembayaran</option>
                  <option value="Draft">Draft</option>
                  <option value="Disetujui">Disetujui</option>
                  <option value="Dibayar">Dibayar (Lunas)</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">No Slip</th>
                    <th className="py-2.5 px-3">Karyawan & NIK</th>
                    <th className="py-2.5 px-3">Jabatan</th>
                    <th className="py-2.5 px-3">Periode</th>
                    <th className="py-2.5 px-3 text-right">Gaji Pokok</th>
                    <th className="py-2.5 px-3 text-right">Insentif Penjualan</th>
                    <th className="py-2.5 px-3 text-right">Potongan</th>
                    <th className="py-2.5 px-3 text-right">Gaji Bersih (THP)</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRekapSalaries.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-10 text-center text-slate-400">
                        Tidak ada data slip gaji yang sesuai dengan filter pencarian.
                      </td>
                    </tr>
                  ) : (
                    filteredRekapSalaries.map((sal) => (
                      <tr key={sal.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                          {sal.slipNumber}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-slate-900">{sal.employeeName}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{sal.employeeNik}</div>
                        </td>
                        <td className="py-2.5 px-3 text-slate-700">{sal.employeeRole}</td>
                        <td className="py-2.5 px-3 text-slate-600 font-mono">{sal.periodMonth}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-800">
                          {formatRupiah(sal.baseSalary)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono">
                          {sal.incentiveAmount > 0 ? (
                            <span className="font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                              {formatRupiah(sal.incentiveAmount)}
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-rose-700">
                          {sal.totalDeductions > 0 ? formatRupiah(sal.totalDeductions) : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-blue-700 text-sm">
                          {formatRupiah(sal.netSalary)}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              sal.status === 'Dibayar'
                                ? 'bg-emerald-100 text-emerald-800'
                                : sal.status === 'Disetujui'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {sal.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => {
                                setSelectedSalaryForPrint(sal);
                                setPrintModalOpen(true);
                              }}
                              className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded"
                              title="Cetak Slip Gaji"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleEditSalary(sal)}
                              className="p-1.5 text-slate-600 hover:text-emerald-600 hover:bg-slate-100 rounded"
                              title="Edit Slip Gaji"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Hapus slip gaji ${sal.slipNumber} (${sal.employeeName})?`)) {
                                  onDeleteSalary(sal.id);
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                              title="Hapus Slip Gaji"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {filteredRekapSalaries.length > 0 && (
                  <tfoot className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                    <tr>
                      <td colSpan={5} className="py-2.5 px-3 text-right uppercase tracking-wider text-[11px]">
                        TOTAL REKAP GAJI ({filteredRekapSalaries.length} KARYAWAN):
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-emerald-800">
                        {formatRupiah(totalRekapIncentives)}
                      </td>
                      <td></td>
                      <td className="py-2.5 px-3 text-right font-mono text-blue-900 text-sm">
                        {formatRupiah(totalRekapNetSalary)}
                      </td>
                      <td colSpan={2}></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================== SUBTAB 3: MASTER DATA KARYAWAN ==================== */}
      {activeSubTab === 'karyawan' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden p-4 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Master Data Karyawan, Sopir & Tarif Default
              </h2>
              <p className="text-xs text-slate-500">
                Kelola data profil staf, gaji pokok, tunjangan, dan tarif insentif default
              </p>
            </div>

            <button
              onClick={openNewEmployeeModal}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Karyawan Baru</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">NIK</th>
                  <th className="py-2.5 px-3">Nama Karyawan</th>
                  <th className="py-2.5 px-3">Jabatan</th>
                  <th className="py-2.5 px-3 text-right">Gaji Pokok</th>
                  <th className="py-2.5 px-3 text-right">Tarif Insentif</th>
                  <th className="py-2.5 px-3">Rekening Bank</th>
                  <th className="py-2.5 px-3">No Telepon</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{emp.nik}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">{emp.name}</td>
                    <td className="py-2.5 px-3 text-slate-700">{emp.role}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-800">
                      {formatRupiah(emp.baseSalary)}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="font-mono text-emerald-700 font-semibold">
                        {emp.defaultIncentiveRate && emp.defaultIncentiveRate > 0
                          ? `${formatRupiah(emp.defaultIncentiveRate)} / m³`
                          : '-'}
                      </div>
                      {emp.customIncentiveRates && emp.customIncentiveRates.length > 0 && (
                        <span
                          className="inline-block mt-0.5 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[9px] font-semibold"
                          title={emp.customIncentiveRates
                            .map((c) => `${c.itemName} (${c.destination || 'Semua'}): ${formatRupiah(c.ratePerUnit)}`)
                            .join('\n')}
                        >
                          +{emp.customIncentiveRates.length} Tarif Barang
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-700">
                      {emp.bankName} - {emp.bankAccount || '-'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">{emp.phone || '-'}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {emp.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => openEditEmployeeModal(emp)}
                          className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded"
                          title="Edit Karyawan"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Hapus data karyawan ${emp.name}?`)) {
                              onDeleteEmployee(emp.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                          title="Hapus Karyawan"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Quick Incentive Calculator Modal */}
      <QuickIncentiveCalculatorModal
        isOpen={quickCalcModalOpen}
        onClose={() => setQuickCalcModalOpen(false)}
        employee={currentEmployee}
        sales={sales}
        materials={materials}
        onApplyIncentive={(calc) => {
          setIncentiveAmount(calc.amount);
          setIncentiveSummary(calc.summary);
          setPeriodStartDate(calc.summary.startDate);
          setPeriodEndDate(calc.summary.endDate);
          setSuccessMessage(
            `Insentif berhasil dihitung sebesar ${formatRupiah(calc.amount)} (${calc.summary.salesCount} SJ, ${formatNumber(calc.summary.totalVolume)} Unit) dan dimasukkan ke Slip Gaji!`
          );
        }}
      />

      {/* Employee Add/Edit Modal */}
      {employeeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-3 overflow-y-auto">
          <div className="bg-white border border-slate-300 rounded-xl max-w-2xl w-full p-5 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-sm font-bold text-slate-900">
                {editingEmployee ? 'Edit Data Karyawan' : 'Tambah Karyawan Baru'}
              </h3>
              <button
                onClick={() => setEmployeeModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEmployeeSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    NIK / ID Karyawan:
                  </label>
                  <input
                    type="text"
                    required
                    value={empFormNik}
                    onChange={(e) => setEmpFormNik(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center justify-between">
                    <span>Jabatan / Posisi:</span>
                    <span className="text-[10px] text-blue-600 font-normal">Diisi Manual</span>
                  </label>
                  <input
                    type="text"
                    list="employee-role-suggestions"
                    required
                    placeholder="Ketik jabatan (misal: Sopir Tronton, Marketing, Admin)"
                    value={empFormRole}
                    onChange={(e) => setEmpFormRole(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md bg-white font-semibold text-slate-800 focus:ring-1 focus:ring-blue-500"
                  />
                  <datalist id="employee-role-suggestions">
                    <option value="Sopir / Driver" />
                    <option value="Sopir Dump Truck Tronton" />
                    <option value="Sopir Colt Diesel Engkel" />
                    <option value="Marketing / Sales Proyek" />
                    <option value="Mandor / Pengawas Lapangan" />
                    <option value="Staf Logistik & Timbangan" />
                    <option value="Staf Keuangan & Administrasi" />
                    <option value="Operator Alat Berat / Loader" />
                    <option value="Mekanik / Workshop" />
                    <option value="Manager Operasional" />
                    <option value="Koordinator Quarry" />
                    <option value="Kepala Batching Plant" />
                  </datalist>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Nama Lengkap:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Budi Santoso"
                  value={empFormName}
                  onChange={(e) => setEmpFormName(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Gaji Pokok Default (Rp):
                  </label>
                  <input
                    type="number"
                    value={empFormBaseSalary}
                    onChange={(e) => setEmpFormBaseSalary(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center justify-between">
                    <span>Tarif Insentif Default Umum (Rp/m³):</span>
                    <span className="text-[10px] text-slate-500">Tarif Standar</span>
                  </label>
                  <input
                    type="number"
                    value={empFormIncentiveRate}
                    onChange={(e) => setEmpFormIncentiveRate(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-emerald-700 font-bold"
                  />
                </div>
              </div>

              {/* SECTION: Tarif Insentif Setiap Barang & Tujuan Pengiriman */}
              <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-emerald-200/80 pb-2">
                  <div>
                    <h4 className="font-bold text-xs text-emerald-950 flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-emerald-700" />
                      <span>Tarif Insentif per Barang & Tujuan Pengiriman (Daftar Barang)</span>
                    </h4>
                    <p className="text-[10.5px] text-emerald-800 mt-0.5">
                      Tentukan tarif insentif khusus untuk barang tertentu dari Daftar Barang dan/atau lokasi tujuan pengiriman.
                    </p>
                  </div>
                  {materials.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        const existingItemNames = new Set(empFormCustomRates.map((r) => r.itemName));
                        const additions: ItemDestinationIncentiveRate[] = [];
                        materials.forEach((m) => {
                          if (!existingItemNames.has(m.name)) {
                            additions.push({
                              id: `cr-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
                              itemName: m.name,
                              destination: '*',
                              ratePerUnit: empFormIncentiveRate || 5000,
                              notes: 'Dari Master Daftar Barang',
                            });
                          }
                        });
                        if (additions.length > 0) {
                          setEmpFormCustomRates((prev) => [...prev, ...additions]);
                        } else {
                          alert('Semua barang dari Daftar Barang sudah ada dalam tabel tarif!');
                        }
                      }}
                      className="px-2.5 py-1 rounded bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-semibold flex items-center gap-1 shadow-2xs whitespace-nowrap self-start sm:self-auto"
                    >
                      <Zap className="w-3.5 h-3.5 text-emerald-200" />
                      <span>Muat Seluruh Daftar Barang ({materials.length})</span>
                    </button>
                  )}
                </div>

                {/* Add new rate rule form */}
                <div className="bg-white p-2.5 rounded-lg border border-emerald-200/80 space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">
                    <div className="sm:col-span-4">
                      <label className="block text-[10px] font-semibold text-slate-700 mb-1">
                        Pilih Nama Barang:
                      </label>
                      <input
                        type="text"
                        list="material-item-options"
                        placeholder="Pilih / ketik nama barang"
                        value={newRateItemName}
                        onChange={(e) => setNewRateItemName(e.target.value)}
                        className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs"
                      />
                      <datalist id="material-item-options">
                        <option value="*">Semua Nama Barang (*)</option>
                        {materials.map((m) => (
                          <option key={m.id} value={m.name} />
                        ))}
                      </datalist>
                    </div>

                    <div className="sm:col-span-4">
                      <label className="block text-[10px] font-semibold text-slate-700 mb-1">
                        Tujuan Pengiriman:
                      </label>
                      <input
                        type="text"
                        list="destination-list-options"
                        placeholder="Ketik tujuan atau * untuk semua"
                        value={newRateDest}
                        onChange={(e) => setNewRateDest(e.target.value)}
                        className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs"
                      />
                      <datalist id="destination-list-options">
                        <option value="*">Semua Tujuan Pengiriman (*)</option>
                        {allDestinations.map((d) => (
                          <option key={d} value={d} />
                        ))}
                      </datalist>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-semibold text-slate-700 mb-1">
                        Tarif (Rp/m³):
                      </label>
                      <input
                        type="number"
                        min={0}
                        step={500}
                        value={newRateValue}
                        onChange={(e) => setNewRateValue(Number(e.target.value))}
                        className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs font-bold text-emerald-800"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (!newRateItemName.trim()) {
                            alert('Silakan pilih atau ketik nama barang!');
                            return;
                          }
                          const newRule: ItemDestinationIncentiveRate = {
                            id: `cr-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
                            itemName: newRateItemName.trim(),
                            destination: newRateDest.trim() || '*',
                            ratePerUnit: Number(newRateValue) || 0,
                            notes: newRateNotes.trim() || undefined,
                          };
                          setEmpFormCustomRates((prev) => [...prev, newRule]);
                          setNewRateItemName('');
                          setNewRateDest('*');
                          setNewRateNotes('');
                        }}
                        className="w-full py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded shadow-2xs flex items-center justify-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Tambah</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <input
                      type="text"
                      placeholder="Catatan / keterangan tambahan untuk tarif ini (opsional)"
                      value={newRateNotes}
                      onChange={(e) => setNewRateNotes(e.target.value)}
                      className="w-full px-2 py-1 border border-slate-200 rounded text-[11px] text-slate-600"
                    />
                  </div>
                </div>

                {/* Table of Custom Rates */}
                {empFormCustomRates.length > 0 ? (
                  <div className="max-h-48 overflow-y-auto rounded-lg border border-emerald-200 bg-white">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-emerald-100/60 text-emerald-950 font-semibold sticky top-0 border-b border-emerald-200">
                        <tr>
                          <th className="py-1.5 px-2">Nama Barang</th>
                          <th className="py-1.5 px-2">Tujuan Pengiriman</th>
                          <th className="py-1.5 px-2 text-right">Tarif (Rp/Unit)</th>
                          <th className="py-1.5 px-2 text-center w-10">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {empFormCustomRates.map((rule, idx) => (
                          <tr key={rule.id || idx} className="hover:bg-slate-50">
                            <td className="py-1.5 px-2 font-medium text-slate-900">
                              {rule.itemName === '*' ? (
                                <span className="font-semibold text-blue-700">★ Semua Barang (*)</span>
                              ) : (
                                rule.itemName
                              )}
                              {rule.notes && (
                                <span className="block text-[9.5px] text-slate-400 font-normal">
                                  {rule.notes}
                                </span>
                              )}
                            </td>
                            <td className="py-1.5 px-2 text-slate-700">
                              {rule.destination === '*' ? (
                                <span className="text-slate-500 italic">Semua Tujuan (*)</span>
                              ) : (
                                rule.destination
                              )}
                            </td>
                            <td className="py-1.5 px-2 text-right">
                              <input
                                type="number"
                                min={0}
                                step={500}
                                value={rule.ratePerUnit}
                                onChange={(e) => {
                                  const val = Number(e.target.value) || 0;
                                  setEmpFormCustomRates((prev) =>
                                    prev.map((r, i) => (i === idx ? { ...r, ratePerUnit: val } : r))
                                  );
                                }}
                                className="w-24 px-1.5 py-0.5 border border-slate-300 rounded text-right font-mono font-bold text-emerald-800 text-[11px]"
                              />
                            </td>
                            <td className="py-1.5 px-2 text-center">
                              <button
                                type="button"
                                onClick={() => {
                                  setEmpFormCustomRates((prev) => prev.filter((_, i) => i !== idx));
                                }}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                                title="Hapus Aturan"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-2.5 text-center bg-white rounded-lg border border-dashed border-emerald-300 text-[11px] text-slate-500">
                    Belum ada tarif khusus barang. Karyawan akan menggunakan{' '}
                    <span className="font-semibold text-emerald-700">
                      Tarif Standar ({formatRupiah(empFormIncentiveRate)} / m³)
                    </span>{' '}
                    untuk semua transaksi penjualan.
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Bank:
                  </label>
                  <input
                    type="text"
                    value={empFormBankName}
                    onChange={(e) => setEmpFormBankName(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    No Rekening:
                  </label>
                  <input
                    type="text"
                    value={empFormBankAccount}
                    onChange={(e) => setEmpFormBankAccount(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  No Telepon / WhatsApp:
                </label>
                <input
                  type="text"
                  value={empFormPhone}
                  onChange={(e) => setEmpFormPhone(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Catatan Karyawan (Opsional):
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Rute dump truck quarry Sentul & Cibubur"
                  value={empFormNotes}
                  onChange={(e) => setEmpFormNotes(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-slate-700"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEmployeeModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded-md text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-md shadow-xs"
                >
                  Simpan Karyawan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Salary Slip Printable Modal */}
      <SalarySlipPrintModal
        isOpen={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
        salary={selectedSalaryForPrint}
        companyProfile={companyProfile}
      />
    </div>
  );
};
