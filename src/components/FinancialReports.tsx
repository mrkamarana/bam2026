import React, { useState, useMemo } from 'react';
import {
  PieChart,
  BookOpen,
  Scale,
  Briefcase,
  Printer,
  Calendar,
  Layers,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Edit2,
  TrendingUp,
  CreditCard,
  Building,
  FileText,
  Search,
  Download,
  Filter,
  Check,
  Tag,
  Receipt,
  HelpCircle,
  Percent,
  ShieldCheck,
  Calculator,
  Info,
  Coins,
  Landmark,
  Sparkles,
  Sliders,
} from 'lucide-react';
import {
  BalanceSheetData,
  CompanyProfile,
  DateFilterState,
  IncomeStatementData,
  IncomeTaxScheme,
  InvoiceRecord,
  JournalEntry,
  LedgerAccount,
  OperationalExpense,
  PurchaseTransaction,
  SaleTransaction,
  TaxInvoiceEntry,
  WithholdingTaxSlip,
} from '../types';
import {
  formatDateIndo,
  formatNumber,
  formatRupiah,
  getTodayDateString,
  matchDateFilter,
  compareDateDescending,
} from '../utils/formatters';
import {
  CHART_OF_ACCOUNTS,
  calculateInvoiceReceivablesSummary,
  generateBalanceSheet,
  generateGeneralJournal,
  generateGeneralLedger,
  generateIncomeStatement,
  generateTrialBalance,
} from '../utils/accounting';
import {
  exportJournalEntriesToExcel,
  exportManualTransactionsToExcel,
  exportInvoiceHistoryToExcel,
  exportIncomeStatementToExcel,
} from '../utils/excelHelper';
import { DateFilterBar } from './DateFilterBar';
import { ManualTransactionModal } from './ManualTransactionModal';
import { JournalEntryModal } from './JournalEntryModal';

type ReportSubTab =
  | 'rekap-transaksi'
  | 'laba-rugi'
  | 'neraca'
  | 'piutang-invoice'
  | 'jurnal'
  | 'buku-besar'
  | 'neraca-saldo';

interface FinancialReportsProps {
  sales: SaleTransaction[];
  purchases: PurchaseTransaction[];
  expenses: OperationalExpense[];
  taxInvoices?: TaxInvoiceEntry[];
  withholdingSlips?: WithholdingTaxSlip[];
  customJournals?: JournalEntry[];
  deletedJournalIds?: string[];
  invoices?: InvoiceRecord[];
  companyProfile: CompanyProfile;
  filter: DateFilterState;
  onFilterChange: (filter: DateFilterState) => void;
  onAddExpense: (expense: Omit<OperationalExpense, 'id'>) => void;
  onUpdateExpense?: (id: string, expense: Partial<OperationalExpense>) => void;
  onDeleteExpense: (id: string) => void;
  onAddJournalEntry?: (entry: JournalEntry) => void;
  onUpdateJournalEntry?: (id: string, entry: Partial<JournalEntry>) => void;
  onDeleteJournalEntry?: (id: string) => void;
  onOpenPrintModal: (title: string, content: React.ReactNode) => void;
}

export const FinancialReports: React.FC<FinancialReportsProps> = ({
  sales,
  purchases,
  expenses,
  taxInvoices = [],
  withholdingSlips = [],
  customJournals = [],
  deletedJournalIds = [],
  invoices = [],
  companyProfile,
  filter,
  onFilterChange,
  onAddExpense,
  onUpdateExpense,
  onDeleteExpense,
  onAddJournalEntry,
  onUpdateJournalEntry,
  onDeleteJournalEntry,
  onOpenPrintModal,
}) => {
  const [subTab, setSubTab] = useState<ReportSubTab>('rekap-transaksi');

  // Modals for Manual Transactions (Rekap Transaksi)
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<OperationalExpense | null>(null);
  const [manualSearchQuery, setManualSearchQuery] = useState('');
  const [selectedAccountFilter, setSelectedAccountFilter] = useState('ALL');

  // Modals for General Journal (Jurnal Umum)
  const [isJournalModalOpen, setIsJournalModalOpen] = useState(false);
  const [editingJournal, setEditingJournal] = useState<JournalEntry | null>(null);
  const [journalSearchQuery, setJournalSearchQuery] = useState('');

  // Income Tax Scheme States for Financial Reports
  const [taxScheme, setTaxScheme] = useState<IncomeTaxScheme>('pp55_final_0_5');
  const [manualTaxAmount, setManualTaxAmount] = useState<number>(0);
  const [isCustomTaxModalOpen, setIsCustomTaxModalOpen] = useState(false);

  // Filter Sales, Purchases, Expenses based on date filter state
  const filteredSales = useMemo(() => {
    return (sales || []).filter((s) => s && matchDateFilter(s.date, filter));
  }, [sales, filter]);

  const filteredPurchases = useMemo(() => {
    return (purchases || []).filter((p) => p && matchDateFilter(p.date, filter));
  }, [purchases, filter]);

  const filteredExpenses = useMemo(() => {
    return (expenses || [])
      .filter((e) => e && matchDateFilter(e.date, filter))
      .sort((a, b) => compareDateDescending(a.date, b.date));
  }, [expenses, filter]);

  const filteredTaxInvoices = useMemo(() => {
    return (taxInvoices || []).filter((t) => t && matchDateFilter(t.date, filter));
  }, [taxInvoices, filter]);

  const filteredWithholdingSlips = useMemo(() => {
    return (withholdingSlips || []).filter((w) => w && matchDateFilter(w.date, filter));
  }, [withholdingSlips, filter]);

  // Compute accounting structures (Integrating Sales, Purchases, Expenses, Tax Invoices, Withholding Slips, Custom Journals)
  const journalEntries = useMemo(() => {
    return generateGeneralJournal(
      filteredSales,
      filteredPurchases,
      filteredExpenses,
      filteredTaxInvoices,
      filteredWithholdingSlips,
      customJournals,
      deletedJournalIds
    );
  }, [
    filteredSales,
    filteredPurchases,
    filteredExpenses,
    filteredTaxInvoices,
    filteredWithholdingSlips,
    customJournals,
    deletedJournalIds,
  ]);

  const ledger = useMemo(() => {
    return generateGeneralLedger(journalEntries);
  }, [journalEntries]);

  const trialBalance = useMemo(() => {
    return generateTrialBalance(ledger);
  }, [ledger]);

  const incomeStatement = useMemo(() => {
    return generateIncomeStatement(
      filteredSales,
      filteredPurchases,
      filteredExpenses,
      filteredTaxInvoices,
      filteredWithholdingSlips,
      taxScheme,
      manualTaxAmount
    );
  }, [
    filteredSales,
    filteredPurchases,
    filteredExpenses,
    filteredTaxInvoices,
    filteredWithholdingSlips,
    taxScheme,
    manualTaxAmount,
  ]);

  const balanceSheet = useMemo(() => {
    return generateBalanceSheet(ledger, incomeStatement.netProfit);
  }, [ledger, incomeStatement.netProfit]);

  // Searched Rekap Transaksi
  const searchedExpenses = useMemo(() => {
    return filteredExpenses.filter((e) => {
      const matchQuery =
        !manualSearchQuery.trim() ||
        (e.transactionName || '').toLowerCase().includes(manualSearchQuery.toLowerCase()) ||
        (e.description || '').toLowerCase().includes(manualSearchQuery.toLowerCase()) ||
        (e.accountCode || '').toLowerCase().includes(manualSearchQuery.toLowerCase()) ||
        (e.accountName || '').toLowerCase().includes(manualSearchQuery.toLowerCase()) ||
        (e.category || '').toLowerCase().includes(manualSearchQuery.toLowerCase());

      const matchAccount =
        selectedAccountFilter === 'ALL' || e.accountCode === selectedAccountFilter;

      return matchQuery && matchAccount;
    });
  }, [filteredExpenses, manualSearchQuery, selectedAccountFilter]);

  // Searched Journal Entries
  const searchedJournals = useMemo(() => {
    if (!journalSearchQuery.trim()) return journalEntries;
    const q = journalSearchQuery.toLowerCase();
    return journalEntries.filter(
      (j) =>
        (j.refNo || '').toLowerCase().includes(q) ||
        (j.description || '').toLowerCase().includes(q) ||
        (j.debitAccountName || '').toLowerCase().includes(q) ||
        (j.debitAccountCode || '').toLowerCase().includes(q) ||
        (j.creditAccountName || '').toLowerCase().includes(q) ||
        (j.creditAccountCode || '').toLowerCase().includes(q)
    );
  }, [journalEntries, journalSearchQuery]);

  // Manual Transaction Handlers
  const handleOpenAddManual = () => {
    setEditingExpense(null);
    setIsManualModalOpen(true);
  };

  const handleOpenEditManual = (expense: OperationalExpense) => {
    setEditingExpense(expense);
    setIsManualModalOpen(true);
  };

  const handleSaveManualTransaction = (
    data: Omit<OperationalExpense, 'id'>,
    editId?: string
  ) => {
    if (editId && onUpdateExpense) {
      onUpdateExpense(editId, data);
    } else {
      onAddExpense(data);
    }
    setIsManualModalOpen(false);
    setEditingExpense(null);
  };

  const handleDeleteManual = (id: string, name: string) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus transaksi manual "${name}"?`)) {
      onDeleteExpense(id);
    }
  };

  // Journal Entry Handlers
  const handleOpenAddJournal = () => {
    setEditingJournal(null);
    setIsJournalModalOpen(true);
  };

  const handleOpenEditJournal = (entry: JournalEntry) => {
    setEditingJournal(entry);
    setIsJournalModalOpen(true);
  };

  const handleSaveJournalEntry = (entry: JournalEntry) => {
    if (editingJournal && onUpdateJournalEntry) {
      onUpdateJournalEntry(editingJournal.id, entry);
    } else if (onAddJournalEntry) {
      onAddJournalEntry(entry);
    }
    setIsJournalModalOpen(false);
    setEditingJournal(null);
  };

  const handleDeleteJournal = (id: string, refNo: string, desc: string) => {
    if (window.confirm(`Hapus ayat jurnal [${refNo}] "${desc}"? Perubahan akan langsung disinkronkan ke seluruh laporan.`)) {
      if (onDeleteJournalEntry) {
        onDeleteJournalEntry(id);
      }
    }
  };

  // Total Summary for Rekap Transaksi
  const totalRekapAmount = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  }, [filteredExpenses]);

  const totalRekapWithholding = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + (e.withholdingAmount || 0), 0);
  }, [filteredExpenses]);

  // Printable Financial Reports
  const handlePrintCurrentReport = () => {
    let title = '';
    let reportContent: React.ReactNode = null;

    const printHeader = (reportTitle: string) => (
      <div className="border-b-2 border-slate-900 pb-3 flex justify-between items-start mb-4">
        <div className="flex items-start gap-3">
          {companyProfile.logoUrl && (
            <div className="w-14 h-14 rounded p-1 flex items-center justify-center shrink-0 border border-slate-200">
              <img
                src={companyProfile.logoUrl}
                alt="Logo"
                className="max-w-full max-h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
          )}
          <div>
            <h1 className="text-base font-bold text-slate-900 leading-tight">
              {companyProfile.name}
            </h1>
            <p className="text-[11px] text-slate-600">{companyProfile.tagline}</p>
            <p className="text-[10px] text-slate-500">{companyProfile.address}</p>
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-sm font-bold uppercase text-slate-800">{reportTitle}</h2>
          <p className="text-[11px] font-semibold text-slate-700">
            Periode:{' '}
            {filter.mode === 'harian'
              ? formatDateIndo(filter.date)
              : filter.mode === 'bulanan'
              ? filter.month
              : `${filter.startDate} s/d ${filter.endDate}`}
          </p>
          <p className="text-[10px] text-slate-400">
            Dicetak: {formatDateIndo(getTodayDateString())}
          </p>
        </div>
      </div>
    );

    const printSignature = () => (
      <div className="pt-6 flex justify-between items-end text-[10px]">
        <div>
          <p className="text-slate-500">
            Keterangan: Laporan keuangan ini terhitung otomatis berdasarkan sistem akuntansi ganda.
          </p>
        </div>
        <div className="text-center w-48">
          <p className="text-slate-600">Disetujui Oleh,</p>
          <div className="h-14"></div>
          <p className="font-bold underline text-slate-900">{companyProfile.signatoryName}</p>
          <p className="text-slate-600">{companyProfile.signatoryRole}</p>
        </div>
      </div>
    );

    if (subTab === 'rekap-transaksi') {
      title = 'Rekap Transaksi Manual';
      reportContent = (
        <div className="p-6 bg-white text-slate-900 text-xs font-sans space-y-4">
          {printHeader('REKAPITULASI TRANSAKSI MANUAL (NON-PENJUALAN & PEMBELIAN)')}
          <table className="w-full text-left border-collapse border border-slate-300 text-[10px]">
            <thead>
              <tr className="bg-slate-200 text-slate-800 font-bold border-b border-slate-300">
                <th className="p-1.5 border border-slate-300 text-center w-8">No</th>
                <th className="p-1.5 border border-slate-300">Tanggal</th>
                <th className="p-1.5 border border-slate-300">Kode & Nama Akun</th>
                <th className="p-1.5 border border-slate-300">Nama Transaksi</th>
                <th className="p-1.5 border border-slate-300 text-right">Jumlah</th>
                <th className="p-1.5 border border-slate-300 text-center">Unit</th>
                <th className="p-1.5 border border-slate-300 text-right">Harga/Unit (Rp)</th>
                <th className="p-1.5 border border-slate-300 text-right">Total (Rp)</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.map((e, idx) => (
                <tr key={e.id} className="border-t border-slate-200">
                  <td className="p-1.5 border border-slate-300 text-center">{idx + 1}</td>
                  <td className="p-1.5 border border-slate-300 whitespace-nowrap">{e.date}</td>
                  <td className="p-1.5 border border-slate-300">
                    <span className="font-mono font-semibold">[{e.accountCode || '6-101'}]</span>{' '}
                    {e.accountName || e.category}
                  </td>
                  <td className="p-1.5 border border-slate-300 font-medium">
                    {e.transactionName || e.description || e.category}
                  </td>
                  <td className="p-1.5 border border-slate-300 text-right font-mono">
                    {formatNumber(e.quantity || 1)}
                  </td>
                  <td className="p-1.5 border border-slate-300 text-center">{e.unit || 'Ls'}</td>
                  <td className="p-1.5 border border-slate-300 text-right font-mono">
                    {formatRupiah(e.pricePerUnit || e.amount)}
                  </td>
                  <td className="p-1.5 border border-slate-300 text-right font-mono font-bold">
                    {formatRupiah(e.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-100 font-bold border-t-2 border-slate-400">
                <td colSpan={7} className="p-2 border border-slate-300 text-right uppercase">
                  TOTAL REKAPITULASI BIAYA:
                </td>
                <td className="p-2 border border-slate-300 text-right font-mono text-xs">
                  {formatRupiah(totalRekapAmount)}
                </td>
              </tr>
            </tfoot>
          </table>
          {printSignature()}
        </div>
      );
    } else if (subTab === 'jurnal') {
      title = 'Jurnal Umum Keuangan';
      reportContent = (
        <div className="p-6 bg-white text-slate-900 text-xs font-sans space-y-4">
          {printHeader('JURNAL UMUM (GENERAL JOURNAL)')}
          <table className="w-full text-left border-collapse border border-slate-300 text-[10px]">
            <thead>
              <tr className="bg-slate-200 text-slate-800 font-bold border-b border-slate-300">
                <th className="p-1.5 border border-slate-300">Tanggal</th>
                <th className="p-1.5 border border-slate-300">Ref / Bukti</th>
                <th className="p-1.5 border border-slate-300">Keterangan Akun</th>
                <th className="p-1.5 border border-slate-300 text-right">Debit (Rp)</th>
                <th className="p-1.5 border border-slate-300 text-right">Kredit (Rp)</th>
              </tr>
            </thead>
            <tbody>
              {journalEntries.map((j) => (
                <React.Fragment key={j.id}>
                  <tr className="border-t border-slate-200">
                    <td className="p-1.5 border border-slate-300 whitespace-nowrap">{j.date}</td>
                    <td className="p-1.5 border border-slate-300 font-mono font-semibold">{j.refNo}</td>
                    <td className="p-1.5 border border-slate-300">
                      <span className="font-bold">{j.debitAccountName}</span>{' '}
                      <span className="text-[9px] text-slate-500 font-mono">({j.debitAccountCode})</span>
                      <div className="text-[9px] text-slate-500">{j.description}</div>
                    </td>
                    <td className="p-1.5 border border-slate-300 text-right font-mono font-bold">
                      {formatRupiah(j.amount)}
                    </td>
                    <td className="p-1.5 border border-slate-300 text-right font-mono text-slate-400">-</td>
                  </tr>
                  <tr className="border-b border-slate-200 bg-slate-50/60">
                    <td className="p-1 border border-slate-300"></td>
                    <td className="p-1 border border-slate-300"></td>
                    <td className="p-1 border border-slate-300 pl-6 italic">
                      {j.creditAccountName}{' '}
                      <span className="text-[9px] text-slate-400 font-mono">({j.creditAccountCode})</span>
                    </td>
                    <td className="p-1 border border-slate-300 text-right font-mono text-slate-400">-</td>
                    <td className="p-1 border border-slate-300 text-right font-mono font-bold">
                      {formatRupiah(j.amount)}
                    </td>
                  </tr>
                </React.Fragment>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-100 font-bold border-t-2 border-slate-400">
                <td colSpan={3} className="p-2 border border-slate-300 text-right uppercase">
                  TOTAL KESEIMBANGAN JURNAL:
                </td>
                <td className="p-2 border border-slate-300 text-right font-mono">
                  {formatRupiah(journalEntries.reduce((s, j) => s + j.amount, 0))}
                </td>
                <td className="p-2 border border-slate-300 text-right font-mono">
                  {formatRupiah(journalEntries.reduce((s, j) => s + j.amount, 0))}
                </td>
              </tr>
            </tfoot>
          </table>
          {printSignature()}
        </div>
      );
    } else if (subTab === 'laba-rugi') {
      title = 'Laporan Laba Rugi Komprehensif';
      reportContent = (
        <div className="p-6 bg-white text-slate-900 text-xs font-sans space-y-4">
          {printHeader('LAPORAN LABA RUGI KOMPREHENSIF')}
          <div className="space-y-3">
            <div className="border border-slate-300 rounded p-3">
              <h3 className="font-bold uppercase text-slate-800 mb-2">1. Pendapatan Penjualan Material</h3>
              {incomeStatement.revenueDetails.map((r, i) => (
                <div key={i} className="flex justify-between py-1 border-b border-slate-100 text-[11px]">
                  <span>
                    • {r.name} ({formatNumber(r.volume)} {r.unit})
                  </span>
                  <span className="font-mono font-bold">{formatRupiah(r.amount)}</span>
                </div>
              ))}
              <div className="flex justify-between pt-2 font-bold text-xs text-slate-900 border-t border-slate-300">
                <span>TOTAL PENDAPATAN:</span>
                <span className="font-mono text-emerald-700">{formatRupiah(incomeStatement.totalRevenue)}</span>
              </div>
            </div>

            <div className="border border-slate-300 rounded p-3">
              <h3 className="font-bold uppercase text-slate-800 mb-2">2. Beban Pokok Penjualan (HPP)</h3>
              {incomeStatement.hppDetails.map((h, i) => (
                <div key={i} className="flex justify-between py-1 border-b border-slate-100 text-[11px]">
                  <span>
                    • {h.name} ({formatNumber(h.volume)} {h.unit})
                  </span>
                  <span className="font-mono font-bold">{formatRupiah(h.amount)}</span>
                </div>
              ))}
              <div className="flex justify-between pt-2 font-bold text-xs text-slate-900 border-t border-slate-300">
                <span>TOTAL HPP MATERIAL:</span>
                <span className="font-mono text-rose-700">({formatRupiah(incomeStatement.totalHPP)})</span>
              </div>
            </div>

            <div className="p-2.5 bg-slate-100 border border-slate-300 rounded flex justify-between font-bold text-xs">
              <span>LABA KOTOR USAHA (GROSS PROFIT):</span>
              <span className="font-mono text-blue-800">{formatRupiah(incomeStatement.grossProfit)}</span>
            </div>

            <div className="border border-slate-300 rounded p-3">
              <h3 className="font-bold uppercase text-slate-800 mb-2">3. Beban Operasional & Lapangan (Rekap Transaksi)</h3>
              {incomeStatement.expenseDetails.map((e, i) => (
                <div key={i} className="flex justify-between py-1 border-b border-slate-100 text-[11px]">
                  <span>• {e.category}</span>
                  <span className="font-mono font-bold">{formatRupiah(e.amount)}</span>
                </div>
              ))}
              <div className="flex justify-between pt-2 font-bold text-xs text-slate-900 border-t border-slate-300">
                <span>TOTAL BEBAN OPERASIONAL:</span>
                <span className="font-mono text-rose-700">({formatRupiah(incomeStatement.totalOperatingExpense)})</span>
              </div>
            </div>

            <div className="p-2.5 bg-blue-50 border border-blue-200 rounded flex justify-between font-bold text-xs">
              <span className="uppercase text-blue-950">LABA SEBELUM PAJAK PENGHASILAN (EBIT / EBT):</span>
              <span className="font-mono text-blue-800 font-bold">{formatRupiah(incomeStatement.netProfitBeforeTax)}</span>
            </div>

            {/* 4. Pajak Penghasilan */}
            <div className="border border-slate-300 rounded p-3 bg-amber-50/30">
              <div className="flex justify-between items-center mb-1.5">
                <h3 className="font-bold uppercase text-amber-900 text-xs">4. Beban Pajak Penghasilan (PPh)</h3>
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-100 font-semibold text-amber-800 border border-amber-300">
                  {incomeStatement.incomeTax.schemeLabel}
                </span>
              </div>
              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between py-0.5 border-b border-slate-100">
                  <span className="text-slate-600">• Dasar Pengenaan Pajak (DPP / Laba Kena Pajak)</span>
                  <span className="font-mono font-medium">{formatRupiah(incomeStatement.incomeTax.taxableBase)}</span>
                </div>
                <div className="flex justify-between py-0.5 border-b border-slate-100">
                  <span className="text-slate-600">• Tarif Pajak Penghasilan</span>
                  <span className="font-mono font-medium">{incomeStatement.incomeTax.taxRate}%</span>
                </div>
                {incomeStatement.incomeTax.prepaidTaxCredit > 0 && (
                  <>
                    <div className="flex justify-between py-0.5 border-b border-slate-100 text-emerald-700">
                      <span>• Kredit Pajak Dibayar di Muka (PPh 22 WAPU / PPh 23)</span>
                      <span className="font-mono font-medium">{formatRupiah(incomeStatement.incomeTax.prepaidTaxCredit)}</span>
                    </div>
                    <div className="flex justify-between py-0.5 border-b border-slate-100 text-amber-800 font-semibold">
                      <span>• Sisa PPh Kurang / (Lebih) Bayar Terutang</span>
                      <span className="font-mono font-bold">{formatRupiah(incomeStatement.incomeTax.netTaxPayable)}</span>
                    </div>
                  </>
                )}
              </div>
              <div className="flex justify-between pt-2 font-bold text-xs text-amber-950 border-t border-slate-300 mt-1">
                <span>TOTAL BEBAN PAJAK PENGHASILAN:</span>
                <span className="font-mono text-amber-900">({formatRupiah(incomeStatement.incomeTaxExpense)})</span>
              </div>
            </div>

            <div className="p-3 bg-emerald-50 border-2 border-emerald-300 rounded flex justify-between font-bold text-sm">
              <span className="text-emerald-950 uppercase">LABA BERSIH SETELAH PAJAK PENGHASILAN (NET PROFIT):</span>
              <span className="font-mono text-emerald-800 text-base">{formatRupiah(incomeStatement.netProfit)}</span>
            </div>
          </div>
          {printSignature()}
        </div>
      );
    } else if (subTab === 'neraca') {
      title = 'Laporan Neraca Keuangan';
      reportContent = (
        <div className="p-6 bg-white text-slate-900 text-xs font-sans space-y-4">
          {printHeader('LAPORAN POSISI KEUANGAN (NERACA / BALANCE SHEET)')}
          <div className="grid grid-cols-2 gap-4">
            <div className="border border-slate-300 rounded p-3">
              <h3 className="font-bold uppercase text-slate-800 border-b border-slate-300 pb-1 mb-2">
                AKTIVA (ASET)
              </h3>
              <div className="space-y-1.5 text-[11px]">
                {balanceSheet.assets.currentAssets.map((a, i) => (
                  <div key={i} className="flex justify-between">
                    <span>
                      {a.name} <span className="font-mono text-[9px]">({a.code})</span>
                    </span>
                    <span className="font-mono font-bold">{formatRupiah(a.amount)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-2 border-t-2 border-slate-300 flex justify-between font-bold text-xs">
                <span>TOTAL AKTIVA:</span>
                <span className="font-mono text-emerald-700">{formatRupiah(balanceSheet.assets.totalAssets)}</span>
              </div>
            </div>

            <div className="border border-slate-300 rounded p-3">
              <h3 className="font-bold uppercase text-slate-800 border-b border-slate-300 pb-1 mb-2">
                PASIVA (KEWAJIBAN & EKUITAS)
              </h3>
              <div className="space-y-2 text-[11px]">
                <p className="font-bold text-slate-600 uppercase text-[9px]">Kewajiban / Hutang:</p>
                {balanceSheet.liabilities.currentLiabilities.map((l, i) => (
                  <div key={i} className="flex justify-between pl-2">
                    <span>
                      {l.name} <span className="font-mono text-[9px]">({l.code})</span>
                    </span>
                    <span className="font-mono font-bold text-rose-600">{formatRupiah(l.amount)}</span>
                  </div>
                ))}

                <p className="font-bold text-slate-600 uppercase text-[9px] pt-2">Ekuitas / Modal:</p>
                {balanceSheet.equity.items.map((e, i) => (
                  <div key={i} className="flex justify-between pl-2">
                    <span>
                      {e.name} <span className="font-mono text-[9px]">({e.code})</span>
                    </span>
                    <span className="font-mono font-bold">{formatRupiah(e.amount)}</span>
                  </div>
                ))}
                <div className="flex justify-between pl-2">
                  <span>Laba Periode Berjalan</span>
                  <span className="font-mono font-bold text-emerald-700">
                    {formatRupiah(balanceSheet.equity.currentPeriodProfit)}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-2 border-t-2 border-slate-300 flex justify-between font-bold text-xs">
                <span>TOTAL PASIVA & EKUITAS:</span>
                <span className="font-mono text-blue-800">
                  {formatRupiah(balanceSheet.liabilities.totalLiabilities + balanceSheet.equity.totalEquity)}
                </span>
              </div>
            </div>
          </div>
          {printSignature()}
        </div>
      );
    } else if (subTab === 'neraca-saldo') {
      title = 'Neraca Saldo';
      reportContent = (
        <div className="p-6 bg-white text-slate-900 text-xs font-sans space-y-4">
          {printHeader('NERACA SALDO (TRIAL BALANCE)')}
          <table className="w-full text-left border-collapse border border-slate-300 text-[10px]">
            <thead>
              <tr className="bg-slate-200 text-slate-800 font-bold border-b border-slate-300">
                <th className="p-1.5 border border-slate-300">Kode Akun</th>
                <th className="p-1.5 border border-slate-300">Nama Akun</th>
                <th className="p-1.5 border border-slate-300">Kategori</th>
                <th className="p-1.5 border border-slate-300 text-right">Debit (Rp)</th>
                <th className="p-1.5 border border-slate-300 text-right">Kredit (Rp)</th>
              </tr>
            </thead>
            <tbody>
              {trialBalance.rows.map((r) => (
                <tr key={r.code} className="border-t border-slate-200">
                  <td className="p-1.5 border border-slate-300 font-mono font-bold">{r.code}</td>
                  <td className="p-1.5 border border-slate-300 font-medium">{r.name}</td>
                  <td className="p-1.5 border border-slate-300">{r.category}</td>
                  <td className="p-1.5 border border-slate-300 text-right font-mono">
                    {r.debit > 0 ? formatRupiah(r.debit) : '-'}
                  </td>
                  <td className="p-1.5 border border-slate-300 text-right font-mono">
                    {r.credit > 0 ? formatRupiah(r.credit) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-100 font-bold border-t-2 border-slate-400">
                <td colSpan={3} className="p-2 border border-slate-300 text-right uppercase">
                  TOTAL KESELURUHAN:
                </td>
                <td className="p-2 border border-slate-300 text-right font-mono text-emerald-700">
                  {formatRupiah(trialBalance.totalDebit)}
                </td>
                <td className="p-2 border border-slate-300 text-right font-mono text-emerald-700">
                  {formatRupiah(trialBalance.totalCredit)}
                </td>
              </tr>
            </tfoot>
          </table>
          {printSignature()}
        </div>
      );
    } else {
      title = 'Buku Besar Akuntansi';
      reportContent = (
        <div className="p-6 bg-white text-slate-900 text-xs font-sans space-y-4">
          {printHeader('BUKU BESAR UTAMA (GENERAL LEDGER)')}
          {ledger.map((acc) => (
            <div key={acc.code} className="border border-slate-300 rounded mb-4 overflow-hidden">
              <div className="bg-slate-100 p-2 border-b border-slate-300 flex justify-between font-bold text-[11px]">
                <span>
                  [{acc.code}] {acc.name} ({acc.category})
                </span>
                <span className="font-mono text-emerald-800">Saldo Akhir: {formatRupiah(acc.finalBalance)}</span>
              </div>
              <table className="w-full text-left border-collapse text-[9px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="p-1">Tanggal</th>
                    <th className="p-1">Ref</th>
                    <th className="p-1">Keterangan</th>
                    <th className="p-1 text-right">Debit</th>
                    <th className="p-1 text-right">Kredit</th>
                    <th className="p-1 text-right">Saldo</th>
                  </tr>
                </thead>
                <tbody>
                  {acc.entries.map((e) => (
                    <tr key={e.id} className="border-t border-slate-100">
                      <td className="p-1 whitespace-nowrap">{e.date}</td>
                      <td className="p-1 font-mono">{e.refNo}</td>
                      <td className="p-1">{e.description}</td>
                      <td className="p-1 text-right font-mono">{e.debit > 0 ? formatRupiah(e.debit) : '-'}</td>
                      <td className="p-1 text-right font-mono">{e.credit > 0 ? formatRupiah(e.credit) : '-'}</td>
                      <td className="p-1 text-right font-mono font-bold">{formatRupiah(e.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
          {printSignature()}
        </div>
      );
    }

    onOpenPrintModal(title, reportContent);
  };

  return (
    <div className="space-y-3">
      {/* Top Header Card */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <PieChart className="w-4 h-4 text-blue-600" />
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-tight">
              6. Laporan Keuangan & Akuntansi Terintegrasi
            </h2>
          </div>
          <p className="text-[11px] text-slate-500">
            Rekap transaksi manual (non-penjualan & non-pembelian), pembukuan double-entry, jurnal umum dengan fitur Edit & Delete, buku besar, laba rugi, dan neraca
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            id="btn-add-manual-transaction"
            onClick={handleOpenAddManual}
            className="flex items-center gap-1 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded text-xs transition shadow-2xs active:scale-95"
            title="Tambah Transaksi Manual (BBM, Gaji, Sewa, ATK, dll)"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Rekap Transaksi</span>
          </button>

          <button
            id="btn-print-financial-report"
            onClick={handlePrintCurrentReport}
            className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded text-xs transition shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak PDF</span>
          </button>
        </div>
      </div>

      {/* Date Filter Bar */}
      <DateFilterBar filter={filter} onChange={onFilterChange} title="Filter Periode Pembukuan" />

      {/* Sub-Nav Segmented Tabs */}
      <div className="flex items-center gap-1 bg-slate-200/90 p-1 rounded-lg border border-slate-300 overflow-x-auto">
        <button
          id="tab-rekap-transaksi"
          onClick={() => setSubTab('rekap-transaksi')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition whitespace-nowrap ${
            subTab === 'rekap-transaksi'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>1. Rekap Transaksi</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
            subTab === 'rekap-transaksi' ? 'bg-amber-700 text-white' : 'bg-slate-300 text-slate-700'
          }`}>
            {filteredExpenses.length}
          </span>
        </button>

        <button
          id="tab-laba-rugi"
          onClick={() => setSubTab('laba-rugi')}
          className={`flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-md transition whitespace-nowrap ${
            subTab === 'laba-rugi'
              ? 'bg-white text-blue-700 shadow-xs'
              : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>2. Laba Rugi</span>
        </button>

        <button
          id="tab-neraca"
          onClick={() => setSubTab('neraca')}
          className={`flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-md transition whitespace-nowrap ${
            subTab === 'neraca'
              ? 'bg-white text-blue-700 shadow-xs'
              : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100'
          }`}
        >
          <Scale className="w-3.5 h-3.5" />
          <span>3. Neraca (Balance Sheet)</span>
        </button>

        <button
          id="tab-piutang-invoice"
          onClick={() => setSubTab('piutang-invoice')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition whitespace-nowrap ${
            subTab === 'piutang-invoice'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100'
          }`}
        >
          <Receipt className="w-3.5 h-3.5" />
          <span>Piutang & Invoice</span>
          {invoices.length > 0 && (
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
              subTab === 'piutang-invoice' ? 'bg-blue-800 text-white' : 'bg-blue-100 text-blue-800'
            }`}>
              {invoices.length}
            </span>
          )}
        </button>

        <button
          id="tab-jurnal"
          onClick={() => setSubTab('jurnal')}
          className={`flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-md transition whitespace-nowrap ${
            subTab === 'jurnal'
              ? 'bg-white text-indigo-700 shadow-xs'
              : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>4. Jurnal Umum</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
            subTab === 'jurnal' ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-300 text-slate-700'
          }`}>
            {journalEntries.length}
          </span>
        </button>

        <button
          id="tab-buku-besar"
          onClick={() => setSubTab('buku-besar')}
          className={`flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-md transition whitespace-nowrap ${
            subTab === 'buku-besar'
              ? 'bg-white text-blue-700 shadow-xs'
              : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>5. Buku Besar</span>
        </button>

        <button
          id="tab-neraca-saldo"
          onClick={() => setSubTab('neraca-saldo')}
          className={`flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-md transition whitespace-nowrap ${
            subTab === 'neraca-saldo'
              ? 'bg-white text-blue-700 shadow-xs'
              : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100'
          }`}
        >
          <Briefcase className="w-3.5 h-3.5" />
          <span>6. Neraca Saldo</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SUB-VIEW 1: REKAP TRANSAKSI (MANUAL INPUT NON-SALES/PURCHASES) */}
      {/* ========================================================================= */}
      {subTab === 'rekap-transaksi' && (
        <div className="space-y-3">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            <div className="bg-white border border-amber-200 p-3 rounded-lg shadow-2xs bg-amber-50/30">
              <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
                Total Biaya & Transaksi Manual
              </span>
              <div className="text-base font-bold text-amber-900 font-mono mt-0.5">
                {formatRupiah(totalRekapAmount)}
              </div>
              <div className="text-[10px] text-amber-700 mt-0.5 font-medium">
                {filteredExpenses.length} Transaksi Tercatat
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-3 rounded-lg shadow-2xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Metode Kas & Bank (Tunai)
              </span>
              <div className="text-base font-bold text-slate-900 font-mono mt-0.5">
                {formatRupiah(
                  filteredExpenses
                    .filter((e) => e.paymentMethod !== 'Hutang')
                    .reduce((sum, e) => sum + e.amount, 0)
                )}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Pengeluaran kas tunai / transfer</div>
            </div>

            <div className="bg-white border border-slate-200 p-3 rounded-lg shadow-2xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Kewajiban / Hutang Belum Lunas
              </span>
              <div className="text-base font-bold text-rose-600 font-mono mt-0.5">
                {formatRupiah(
                  filteredExpenses
                    .filter((e) => e.paymentMethod === 'Hutang')
                    .reduce((sum, e) => sum + e.amount, 0)
                )}
              </div>
              <div className="text-[10px] text-rose-500 mt-0.5">Masuk ke Neraca (Hutang Biaya)</div>
            </div>

            <div className="bg-white border border-slate-200 p-3 rounded-lg shadow-2xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Potongan PPh Terutang
              </span>
              <div className="text-base font-bold text-blue-700 font-mono mt-0.5">
                {formatRupiah(totalRekapWithholding)}
              </div>
              <div className="text-[10px] text-blue-600 mt-0.5">PPh 21 / 23 / 4(2) dipotong</div>
            </div>
          </div>

          {/* Search, Filter, & Actions Toolbar */}
          <div className="bg-white border border-slate-200 rounded-lg p-2.5 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari transaksi, akun, uraian..."
                  value={manualSearchQuery}
                  onChange={(e) => setManualSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded text-xs focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white"
                />
              </div>

              <select
                value={selectedAccountFilter}
                onChange={(e) => setSelectedAccountFilter(e.target.value)}
                className="px-2.5 py-1.5 border border-slate-300 rounded text-xs focus:ring-2 focus:ring-amber-500 bg-white"
              >
                <option value="ALL">Semua Kode Akun</option>
                {CHART_OF_ACCOUNTS.map((a) => (
                  <option key={a.code} value={a.code}>
                    [{a.code}] {a.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 w-full md:w-auto justify-end">
              <button
                onClick={() =>
                  exportManualTransactionsToExcel(
                    searchedExpenses,
                    filter.mode === 'bulanan' ? filter.month : filter.date
                  )
                }
                className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 border border-emerald-300 hover:bg-emerald-100 text-emerald-800 font-bold rounded text-xs transition"
                title="Ekspor ke Excel"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Excel</span>
              </button>

              <button
                onClick={handleOpenAddManual}
                className="flex items-center gap-1 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded text-xs transition shadow-xs active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Tambah Transaksi</span>
              </button>
            </div>
          </div>

          {/* Table View of Rekap Transaksi */}
          <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
            <div className="p-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-tight">
                  Tabel Rekapitulasi Transaksi Manual
                </h3>
                <p className="text-[10px] text-slate-500">
                  Data transaksi diinput manual dengan rincian Jumlah, Unit, Harga/unit, dan Total
                </p>
              </div>
              <div className="text-[11px] text-slate-600 font-medium">
                Menampilkan: <strong className="font-mono text-slate-900">{searchedExpenses.length}</strong> transaksi
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100/80 text-slate-700 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="px-3 py-2 text-center w-8">No</th>
                    <th className="px-3 py-2">Tanggal</th>
                    <th className="px-3 py-2">Kode Akun</th>
                    <th className="px-3 py-2">Nama Transaksi</th>
                    <th className="px-3 py-2 text-right">Jumlah</th>
                    <th className="px-3 py-2 text-center">Unit</th>
                    <th className="px-3 py-2 text-right">Harga/unit</th>
                    <th className="px-3 py-2 text-right">Total (Rp)</th>
                    <th className="px-3 py-2">Metode</th>
                    <th className="px-3 py-2 text-center w-20">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {searchedExpenses.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-4 py-8 text-center text-slate-400 text-xs">
                        <FileText className="w-8 h-8 mx-auto text-slate-300 mb-1" />
                        Belum ada transaksi manual pada periode terpilih. Klik{' '}
                        <strong className="text-amber-700 cursor-pointer" onClick={handleOpenAddManual}>
                          + Tambah Transaksi
                        </strong>{' '}
                        untuk menambahkan.
                      </td>
                    </tr>
                  ) : (
                    searchedExpenses.map((exp, idx) => (
                      <tr key={exp.id} className="hover:bg-amber-50/30 transition-colors">
                        <td className="px-3 py-2 text-center text-slate-400 font-mono text-[11px]">
                          {idx + 1}
                        </td>
                        <td className="px-3 py-2 text-slate-700 whitespace-nowrap font-mono text-[11px]">
                          {exp.date}
                        </td>
                        <td className="px-3 py-2">
                          <span className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded font-mono font-bold text-slate-800 text-[10px]">
                            {exp.accountCode || '6-101'}
                          </span>
                          <span className="text-[10px] text-slate-500 ml-1.5">
                            {exp.accountName || exp.category}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <div className="font-semibold text-slate-900">
                            {exp.transactionName || exp.description || exp.category}
                          </div>
                          {exp.notes && exp.notes !== exp.transactionName && (
                            <div className="text-[10px] text-slate-500 italic">{exp.notes}</div>
                          )}
                          {exp.withholdingTaxType && exp.withholdingTaxType !== 'None' && (
                            <span className="inline-block mt-0.5 text-[9px] px-1.5 py-0.2 bg-blue-50 text-blue-700 border border-blue-200 rounded">
                              Pot. {exp.withholdingTaxType} ({exp.withholdingRate}%) ={' '}
                              {formatRupiah(exp.withholdingAmount || 0)}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-right font-mono font-medium text-slate-800">
                          {formatNumber(exp.quantity || 1)}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] font-semibold text-slate-700">
                            {exp.unit || 'Ls'}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-slate-700">
                          {formatRupiah(exp.pricePerUnit || exp.amount)}
                        </td>
                        <td className="px-3 py-2 text-right font-mono font-bold text-amber-950">
                          {formatRupiah(exp.amount)}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              exp.paymentMethod === 'Hutang'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            {exp.paymentMethod || 'Kas & Bank'}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleOpenEditManual(exp)}
                              className="p-1 text-slate-500 hover:text-amber-700 hover:bg-amber-50 rounded transition"
                              title="Edit Transaksi Manual"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() =>
                                handleDeleteManual(
                                  exp.id,
                                  exp.transactionName || exp.description || exp.category
                                )
                              }
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                              title="Hapus Transaksi"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {searchedExpenses.length > 0 && (
                  <tfoot className="bg-slate-50 font-bold border-t-2 border-slate-300">
                    <tr>
                      <td colSpan={7} className="px-3 py-2 text-right uppercase text-slate-700 text-[11px]">
                        TOTAL TRANSAKSI MANUAL:
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-amber-950 text-xs font-extrabold">
                        {formatRupiah(
                          searchedExpenses.reduce((sum, e) => sum + (e.amount || 0), 0)
                        )}
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

      {/* ========================================================================= */}
      {/* SUB-VIEW 2: LABA RUGI (INCOME STATEMENT WITH INCOME TAX) */}
      {/* ========================================================================= */}
      {subTab === 'laba-rugi' && (
        <div className="space-y-3">
          {/* Header Action & Scheme Selector Card */}
          <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <Coins className="w-4 h-4 text-amber-600" />
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-tight">
                    Pengaturan Pajak Penghasilan (PPh) Laporan Laba Rugi
                  </h3>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Pilih regulasi perpajakan yang berlaku untuk menghitung beban pajak penghasilan periode berjalan.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const periodText =
                      filter.mode === 'harian'
                        ? formatDateIndo(filter.date)
                        : filter.mode === 'bulanan'
                        ? filter.month
                        : `${filter.startDate} s/d ${filter.endDate}`;
                    exportIncomeStatementToExcel(incomeStatement, periodText, companyProfile.name);
                  }}
                  className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
                  title="Unduh laporan laba rugi dalam format Microsoft Excel"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Excel Laba Rugi</span>
                </button>
                <button
                  type="button"
                  onClick={handlePrintCurrentReport}
                  className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak PDF</span>
                </button>
              </div>
            </div>

            {/* Scheme Selector Pills */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Pilih Skema Perhitungan PPh:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => setTaxScheme('pp55_final_0_5')}
                  className={`p-2.5 rounded-lg border text-left transition-all ${
                    taxScheme === 'pp55_final_0_5'
                      ? 'bg-amber-50/80 border-amber-400 ring-1 ring-amber-400 shadow-2xs'
                      : 'bg-slate-50/70 border-slate-200 hover:bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-800">PPh Final UMKM (0.5%)</span>
                    {taxScheme === 'pp55_final_0_5' && (
                      <Check className="w-3.5 h-3.5 text-amber-600 font-bold" />
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-0.5">PP No. 55 Tahun 2022</span>
                  <span className="text-[10px] font-medium text-amber-800 block mt-1">
                    0.5% × Omzet ({formatRupiah(incomeStatement.totalRevenue)})
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setTaxScheme('badan_fasilitas_11')}
                  className={`p-2.5 rounded-lg border text-left transition-all ${
                    taxScheme === 'badan_fasilitas_11'
                      ? 'bg-blue-50/80 border-blue-400 ring-1 ring-blue-400 shadow-2xs'
                      : 'bg-slate-50/70 border-slate-200 hover:bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-800">PPh Badan Ps. 31E (11%)</span>
                    {taxScheme === 'badan_fasilitas_11' && (
                      <Check className="w-3.5 h-3.5 text-blue-600 font-bold" />
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-0.5">Fasilitas Tarif 50% UU HPP</span>
                  <span className="text-[10px] font-medium text-blue-800 block mt-1">
                    11% × Laba Kena Pajak ({formatRupiah(Math.max(0, incomeStatement.netProfitBeforeTax))})
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setTaxScheme('badan_normal_22')}
                  className={`p-2.5 rounded-lg border text-left transition-all ${
                    taxScheme === 'badan_normal_22'
                      ? 'bg-indigo-50/80 border-indigo-400 ring-1 ring-indigo-400 shadow-2xs'
                      : 'bg-slate-50/70 border-slate-200 hover:bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-800">PPh Badan Normal (22%)</span>
                    {taxScheme === 'badan_normal_22' && (
                      <Check className="w-3.5 h-3.5 text-indigo-600 font-bold" />
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-0.5">Tarif Umum UU No. 7/2021</span>
                  <span className="text-[10px] font-medium text-indigo-800 block mt-1">
                    22% × Laba Kena Pajak ({formatRupiah(Math.max(0, incomeStatement.netProfitBeforeTax))})
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTaxScheme('manual');
                    setIsCustomTaxModalOpen(true);
                  }}
                  className={`p-2.5 rounded-lg border text-left transition-all ${
                    taxScheme === 'manual'
                      ? 'bg-purple-50/80 border-purple-400 ring-1 ring-purple-400 shadow-2xs'
                      : 'bg-slate-50/70 border-slate-200 hover:bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-800">Kustom / Penyesuaian</span>
                    <Sliders className="w-3.5 h-3.5 text-purple-600" />
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-0.5">Input Nominal Pajak Bebas</span>
                  <span className="text-[10px] font-medium text-purple-800 block mt-1 font-mono">
                    {formatRupiah(incomeStatement.incomeTaxExpense)}
                  </span>
                </button>
              </div>

              {/* Inline Custom Input when scheme is manual */}
              {taxScheme === 'manual' && (
                <div className="p-3 bg-purple-50/60 border border-purple-200 rounded-lg flex flex-wrap items-center gap-3 text-xs">
                  <span className="font-semibold text-purple-900">Masukkan Nominal Beban PPh Manual:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 font-mono">Rp</span>
                    <input
                      type="number"
                      min={0}
                      value={manualTaxAmount}
                      onChange={(e) => setManualTaxAmount(Math.max(0, Number(e.target.value) || 0))}
                      className="px-2.5 py-1 text-xs border border-purple-300 rounded font-mono font-bold text-purple-950 w-44 bg-white focus:outline-hidden focus:ring-1 focus:ring-purple-500"
                      placeholder="0"
                    />
                  </div>
                  <span className="text-[11px] text-purple-700">
                    Nilai ini akan langsung menjadi pengurang pada Laba Bersih Setelah Pajak.
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Top KPI row (5 High Clarity Cards) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
            <div className="bg-white border border-slate-200 p-2.5 rounded shadow-2xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Total Pendapatan
              </span>
              <div className="text-base font-bold text-emerald-700 font-mono mt-0.5">
                {formatRupiah(incomeStatement.totalRevenue)}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {filteredSales.length} Transaksi Terkirim
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-2.5 rounded shadow-2xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Beban Pokok (HPP)
              </span>
              <div className="text-base font-bold text-rose-600 font-mono mt-0.5">
                {formatRupiah(incomeStatement.totalHPP)}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Pembelian dari Quarry</div>
            </div>

            <div className="bg-white border border-slate-200 p-2.5 rounded shadow-2xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Laba Kotor Usaha
              </span>
              <div className="text-base font-bold text-blue-700 font-mono mt-0.5">
                {formatRupiah(incomeStatement.grossProfit)}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                Margin:{' '}
                {incomeStatement.totalRevenue > 0
                  ? ((incomeStatement.grossProfit / incomeStatement.totalRevenue) * 100).toFixed(1)
                  : 0}
                %
              </div>
            </div>

            <div className="bg-white border border-amber-200 p-2.5 rounded shadow-2xs bg-amber-50/40">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
                  Beban Pajak (PPh)
                </span>
                <span className="text-[9px] px-1.5 py-0.2 bg-amber-200/80 text-amber-900 rounded font-semibold">
                  {incomeStatement.incomeTax.taxRate}%
                </span>
              </div>
              <div className="text-base font-bold text-amber-900 font-mono mt-0.5">
                {formatRupiah(incomeStatement.incomeTaxExpense)}
              </div>
              <div className="text-[10px] text-amber-700 truncate mt-0.5" title={incomeStatement.incomeTax.schemeLabel}>
                {incomeStatement.incomeTax.schemeLabel}
              </div>
            </div>

            <div className="bg-white border border-emerald-300 p-2.5 rounded shadow-2xs bg-emerald-50/60 ring-1 ring-emerald-200">
              <span className="text-[10px] font-bold text-emerald-900 uppercase tracking-wider block">
                Laba Bersih Setelah Pajak
              </span>
              <div className="text-base font-extrabold text-emerald-800 font-mono mt-0.5">
                {formatRupiah(incomeStatement.netProfit)}
              </div>
              <div className="text-[10px] text-emerald-700 mt-0.5 font-medium">
                Net Margin:{' '}
                {incomeStatement.totalRevenue > 0
                  ? ((incomeStatement.netProfit / incomeStatement.totalRevenue) * 100).toFixed(1)
                  : 0}
                %
              </div>
            </div>
          </div>

          {/* Detailed Statement Breakdown */}
          <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-600" />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-tight">
                  Rincian Laporan Laba Rugi Komprehensif
                </h3>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">Mata Uang: IDR (Rupiah)</span>
            </div>

            {/* 1. Pendapatan Penjualan */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] font-bold text-emerald-800 uppercase tracking-wider bg-emerald-50/60 p-2 rounded border border-emerald-100">
                <span>1. Pendapatan Penjualan Material Konstruksi</span>
                <span className="font-mono text-xs">{formatRupiah(incomeStatement.totalRevenue)}</span>
              </div>
              <div className="pl-3 space-y-1 text-xs">
                {incomeStatement.revenueDetails.length === 0 ? (
                  <p className="text-slate-400 py-1 text-[11px]">Tidak ada transaksi penjualan.</p>
                ) : (
                  incomeStatement.revenueDetails.map((r, i) => (
                    <div
                      key={i}
                      className="flex justify-between py-0.5 border-b border-slate-100 text-slate-700"
                    >
                      <span>
                        • {r.name} ({formatNumber(r.volume)} {r.unit})
                      </span>
                      <span className="font-mono font-medium">{formatRupiah(r.amount)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 2. HPP */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] font-bold text-rose-800 uppercase tracking-wider bg-rose-50/60 p-2 rounded border border-rose-100">
                <span>2. Beban Pokok Penjualan (HPP Pembelian Material Quarry)</span>
                <span className="font-mono text-xs">({formatRupiah(incomeStatement.totalHPP)})</span>
              </div>
              <div className="pl-3 space-y-1 text-xs">
                {incomeStatement.hppDetails.length === 0 ? (
                  <p className="text-slate-400 py-1 text-[11px]">Tidak ada transaksi pembelian material.</p>
                ) : (
                  incomeStatement.hppDetails.map((h, i) => (
                    <div
                      key={i}
                      className="flex justify-between py-0.5 border-b border-slate-100 text-slate-700"
                    >
                      <span>
                        • {h.name} ({formatNumber(h.volume)} {h.unit})
                      </span>
                      <span className="font-mono font-medium">{formatRupiah(h.amount)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Laba Kotor */}
            <div className="flex items-center justify-between text-xs font-bold text-blue-900 bg-blue-50/70 p-2.5 rounded border border-blue-200">
              <span className="uppercase">LABA KOTOR USAHA (GROSS PROFIT):</span>
              <span className="font-mono text-sm">{formatRupiah(incomeStatement.grossProfit)}</span>
            </div>

            {/* 3. Beban Operasional & Rekap Transaksi */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] font-bold text-rose-800 uppercase tracking-wider bg-rose-50/60 p-2 rounded border border-rose-100">
                <span>3. Beban Operasional & Rekap Transaksi Lapangan</span>
                <span className="font-mono text-xs">
                  ({formatRupiah(incomeStatement.totalOperatingExpense)})
                </span>
              </div>
              <div className="pl-3 space-y-1 text-xs">
                {incomeStatement.expenseDetails.length === 0 ? (
                  <p className="text-slate-400 py-1 text-[11px]">Belum ada catatan biaya operasional.</p>
                ) : (
                  incomeStatement.expenseDetails.map((e, i) => (
                    <div
                      key={i}
                      className="flex justify-between py-0.5 border-b border-slate-100 text-slate-700"
                    >
                      <span>• {e.category}</span>
                      <span className="font-mono font-medium">{formatRupiah(e.amount)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Laba Sebelum Pajak */}
            <div className="flex items-center justify-between text-xs font-bold text-slate-900 bg-slate-100 p-2.5 rounded border border-slate-300">
              <span className="uppercase">LABA USAHA SEBELUM PAJAK PENGHASILAN (EBIT / EBT):</span>
              <span className="font-mono text-sm font-bold text-slate-900">
                {formatRupiah(incomeStatement.netProfitBeforeTax)}
              </span>
            </div>

            {/* 4. Pajak Penghasilan (PPh) */}
            <div className="space-y-1.5 p-3 bg-amber-50/50 border border-amber-200 rounded-lg">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] font-bold text-amber-900 uppercase tracking-wider pb-1 border-b border-amber-200">
                <div className="flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5 text-amber-700" />
                  <span>4. Beban Pajak Penghasilan (PPh)</span>
                </div>
                <div className="flex items-center gap-1.5 font-normal">
                  <span className="text-[10px] px-2 py-0.5 bg-amber-100 border border-amber-300 rounded font-semibold text-amber-800">
                    {incomeStatement.incomeTax.schemeLabel}
                  </span>
                  <span className="font-mono font-bold text-xs text-amber-950">
                    ({formatRupiah(incomeStatement.incomeTaxExpense)})
                  </span>
                </div>
              </div>

              <div className="pl-3 space-y-1.5 text-xs">
                <div className="flex justify-between py-0.5 border-b border-amber-100 text-slate-700">
                  <span>• Dasar Pengenaan Pajak (DPP / Laba Kena Pajak)</span>
                  <span className="font-mono font-medium">{formatRupiah(incomeStatement.incomeTax.taxableBase)}</span>
                </div>
                <div className="flex justify-between py-0.5 border-b border-amber-100 text-slate-700">
                  <span>• Tarif Pajak Penghasilan Efektif</span>
                  <span className="font-mono font-medium">{incomeStatement.incomeTax.taxRate}%</span>
                </div>
                <div className="flex justify-between py-0.5 border-b border-amber-100 text-amber-900 font-semibold">
                  <span>• Beban Pajak Penghasilan Terutang</span>
                  <span className="font-mono font-bold">{formatRupiah(incomeStatement.incomeTax.grossTaxExpense)}</span>
                </div>

                {incomeStatement.incomeTax.prepaidTaxCredit > 0 && (
                  <>
                    <div className="flex justify-between py-0.5 border-b border-amber-100 text-emerald-700 font-medium">
                      <span>• Kredit Pajak Dibayar di Muka (Uang Muka PPh 22 WAPU + PPh 23)</span>
                      <span className="font-mono">({formatRupiah(incomeStatement.incomeTax.prepaidTaxCredit)})</span>
                    </div>
                    <div className="flex justify-between py-0.5 border-b border-amber-100 text-amber-900 font-bold bg-amber-100/60 px-1.5 py-1 rounded">
                      <span>• Sisa PPh Kurang / (Lebih) Bayar yang Harus Disetor</span>
                      <span className="font-mono">{formatRupiah(incomeStatement.incomeTax.netTaxPayable)}</span>
                    </div>
                  </>
                )}

                <p className="text-[10px] text-slate-500 italic pt-1">
                  Catatan: {incomeStatement.incomeTax.description}
                </p>
              </div>
            </div>

            {/* Laba Bersih Setelah Pajak */}
            <div className="flex items-center justify-between text-xs font-bold text-emerald-950 bg-emerald-100/80 p-3 rounded-lg border-2 border-emerald-300 shadow-2xs">
              <div>
                <span className="uppercase text-sm block">LABA BERSIH SETELAH PAJAK PENGHASILAN (NET PROFIT AFTER TAX):</span>
                <span className="text-[10px] text-emerald-700 font-normal">
                  Laba bersih final periode berjalan yang ditransfer ke akun Ekuitas Laba Ditahan di Neraca.
                </span>
              </div>
              <span className="font-mono text-lg font-extrabold text-emerald-800">
                {formatRupiah(incomeStatement.netProfit)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-VIEW 3: NERACA (BALANCE SHEET) */}
      {/* ========================================================================= */}
      {subTab === 'neraca' && (
        <div className="space-y-3">
          {/* Balance Indicator */}
          <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-[11px]">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Status Neraca: Seimbang (Total Aktiva = Total Pasiva + Ekuitas)</span>
            </div>
            <span className="font-mono text-slate-600 text-xs">
              Total Neraca:{' '}
              <strong className="text-slate-900">{formatRupiah(balanceSheet.assets.totalAssets)}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* AKTIVA / ASET */}
            <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-blue-600" />
                  <span>AKTIVA / ASET</span>
                </h3>
                <span className="text-xs font-mono font-bold text-emerald-700">
                  {formatRupiah(balanceSheet.assets.totalAssets)}
                </span>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Aset Lancar (Current Assets):
                </span>
                <div className="space-y-1 text-xs">
                  {balanceSheet.assets.currentAssets.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded"
                    >
                      <div>
                        <div className="font-semibold text-slate-800">{item.name}</div>
                        <div className="text-[9px] text-slate-500 font-mono">Kode: {item.code}</div>
                      </div>
                      <div className="font-mono font-bold text-slate-900">{formatRupiah(item.amount)}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-between text-xs font-bold text-slate-800">
                <span className="uppercase text-[11px]">TOTAL AKTIVA (ASET):</span>
                <span className="font-mono text-sm text-emerald-700">
                  {formatRupiah(balanceSheet.assets.totalAssets)}
                </span>
              </div>
            </div>

            {/* PASIVA & EKUITAS */}
            <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-blue-600" />
                  <span>PASIVA (KEWAJIBAN & EKUITAS)</span>
                </h3>
                <span className="text-xs font-mono font-bold text-blue-700">
                  {formatRupiah(
                    balanceSheet.liabilities.totalLiabilities + balanceSheet.equity.totalEquity
                  )}
                </span>
              </div>

              {/* Kewajiban */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider block">
                  Kewajiban Jangka Pendek (Hutang):
                </span>
                <div className="space-y-1 text-xs">
                  {balanceSheet.liabilities.currentLiabilities.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded"
                    >
                      <div>
                        <div className="font-semibold text-slate-800">{item.name}</div>
                        <div className="text-[9px] text-slate-500 font-mono">Kode: {item.code}</div>
                      </div>
                      <div className="font-mono font-bold text-rose-600">{formatRupiah(item.amount)}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ekuitas */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block">
                  Ekuitas / Modal Pemilik:
                </span>
                <div className="space-y-1 text-xs">
                  {balanceSheet.equity.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded"
                    >
                      <div>
                        <div className="font-semibold text-slate-800">{item.name}</div>
                        <div className="text-[9px] text-slate-500 font-mono">Kode: {item.code}</div>
                      </div>
                      <div className="font-mono font-bold text-slate-900">{formatRupiah(item.amount)}</div>
                    </div>
                  ))}

                  <div className="flex items-center justify-between p-2 bg-emerald-50 border border-emerald-200 rounded">
                    <div>
                      <div className="font-semibold text-emerald-800">Laba Periode Berjalan</div>
                      <div className="text-[9px] text-emerald-600">Dari Laporan Laba Rugi</div>
                    </div>
                    <div className="font-mono font-bold text-emerald-700">
                      {formatRupiah(balanceSheet.equity.currentPeriodProfit)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-between text-xs font-bold text-slate-800">
                <span className="uppercase text-[11px]">TOTAL PASIVA & EKUITAS:</span>
                <span className="font-mono text-sm text-blue-700">
                  {formatRupiah(
                    balanceSheet.liabilities.totalLiabilities + balanceSheet.equity.totalEquity
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-VIEW 4: JURNAL UMUM (DILENGKAPI EDIT & DELETE) */}
      {/* ========================================================================= */}
      {subTab === 'jurnal' && (
        <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden space-y-0">
          {/* Header toolbar */}
          <div className="p-3 border-b border-slate-200 bg-slate-50 flex flex-col md:flex-row items-center justify-between gap-2.5">
            <div>
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-tight">
                  Buku Jurnal Umum (General Journal)
                </h3>
              </div>
              <p className="text-[10px] text-slate-500">
                Pencatatan ganda debit & kredit dari setiap transaksi. Tersedia fitur Edit & Delete ayat jurnal.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto justify-end">
              <div className="relative flex-1 sm:w-56">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari Ref, Akun, Narasi..."
                  value={journalSearchQuery}
                  onChange={(e) => setJournalSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded text-xs focus:ring-2 focus:ring-indigo-500 bg-white"
                />
              </div>

              <button
                onClick={() =>
                  exportJournalEntriesToExcel(
                    searchedJournals,
                    filter.mode === 'bulanan' ? filter.month : filter.date
                  )
                }
                className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 border border-emerald-300 hover:bg-emerald-100 text-emerald-800 font-bold rounded text-xs transition"
                title="Ekspor Jurnal ke Excel"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Excel</span>
              </button>

              <button
                id="btn-add-journal-adjustment"
                onClick={handleOpenAddJournal}
                className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded text-xs transition shadow-xs active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Jurnal Penyesuaian</span>
              </button>
            </div>
          </div>

          {/* Table of Journal Entries with Edit & Delete */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100/90 text-slate-700 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="px-3 py-2">Tanggal</th>
                  <th className="px-3 py-2">No. Ref</th>
                  <th className="px-3 py-2">Akun & Keterangan</th>
                  <th className="px-3 py-2 text-right">Debit (Rp)</th>
                  <th className="px-3 py-2 text-right">Kredit (Rp)</th>
                  <th className="px-3 py-2 text-center w-24">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {searchedJournals.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-400 text-xs">
                      <BookOpen className="w-8 h-8 mx-auto text-slate-300 mb-1" />
                      Tidak ada ayat jurnal yang cocok dengan filter atau pencarian.
                    </td>
                  </tr>
                ) : (
                  searchedJournals.map((j) => (
                    <React.Fragment key={j.id}>
                      {/* Row 1: Debit */}
                      <tr className="hover:bg-indigo-50/40 transition-colors">
                        <td className="px-3 py-1.5 text-slate-600 whitespace-nowrap font-mono text-[11px] align-top">
                          {j.date}
                        </td>
                        <td className="px-3 py-1.5 font-mono text-indigo-700 font-bold whitespace-nowrap align-top">
                          {j.refNo}
                          {j.isCustomOrEdited && (
                            <span className="ml-1 text-[8px] bg-indigo-100 text-indigo-800 px-1 py-0.2 rounded font-sans font-semibold">
                              Manual/Edit
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-1.5 align-top">
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <span>{j.debitAccountName}</span>
                            <span className="text-[10px] text-slate-500 font-mono font-normal">
                              ({j.debitAccountCode})
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">{j.description}</div>
                        </td>
                        <td className="px-3 py-1.5 text-right font-mono font-bold text-emerald-800 whitespace-nowrap align-top">
                          {formatRupiah(j.amount)}
                        </td>
                        <td className="px-3 py-1.5 text-right font-mono text-slate-300 align-top">-</td>
                        <td rowSpan={2} className="px-3 py-1.5 text-center border-l border-slate-100 align-middle bg-slate-50/50">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleOpenEditJournal(j)}
                              className="p-1 text-slate-500 hover:text-indigo-700 hover:bg-indigo-100 rounded transition"
                              title="Edit Ayat Jurnal"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteJournal(j.id, j.refNo, j.description)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-100 rounded transition"
                              title="Hapus Ayat Jurnal"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {/* Row 2: Credit (Indented) */}
                      <tr className="bg-slate-50/30 hover:bg-indigo-50/40 transition-colors">
                        <td className="px-3 py-1"></td>
                        <td className="px-3 py-1"></td>
                        <td className="px-3 py-1 pl-6 text-slate-700 italic">
                          {j.creditAccountName}{' '}
                          <span className="text-[10px] text-slate-400 font-mono not-italic">
                            ({j.creditAccountCode})
                          </span>
                        </td>
                        <td className="px-3 py-1 text-right font-mono text-slate-300">-</td>
                        <td className="px-3 py-1 text-right font-mono font-bold text-indigo-900 whitespace-nowrap">
                          {formatRupiah(j.amount)}
                        </td>
                      </tr>
                    </React.Fragment>
                  ))
                )}
              </tbody>
              {searchedJournals.length > 0 && (
                <tfoot className="bg-slate-100/80 font-bold border-t-2 border-slate-300">
                  <tr>
                    <td colSpan={3} className="px-3 py-2 text-right uppercase text-slate-700 text-[11px]">
                      TOTAL KESEIMBANGAN JURNAL:
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-emerald-800 text-xs">
                      {formatRupiah(searchedJournals.reduce((s, j) => s + j.amount, 0))}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-indigo-900 text-xs">
                      {formatRupiah(searchedJournals.reduce((s, j) => s + j.amount, 0))}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-VIEW 5: BUKU BESAR */}
      {/* ========================================================================= */}
      {subTab === 'buku-besar' && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-3">
            {ledger.map((acc) => (
              <div
                key={acc.code}
                className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden"
              >
                {/* Account Header */}
                <div className="p-2.5 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 gap-1.5">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-blue-50 border border-blue-200 text-blue-700 font-mono font-bold text-xs rounded">
                      {acc.code}
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">{acc.name}</h4>
                      <p className="text-[10px] text-slate-500">
                        Kategori: {acc.category} | Saldo Normal: {acc.normalBalance}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 block">Saldo Akhir:</span>
                    <span className="text-xs font-bold font-mono text-emerald-700">
                      {formatRupiah(acc.finalBalance)}
                    </span>
                  </div>
                </div>

                {/* Entries Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider text-[9px] border-b border-slate-200">
                      <tr>
                        <th className="px-3 py-1.5">Tanggal</th>
                        <th className="px-3 py-1.5">Ref / Bukti</th>
                        <th className="px-3 py-1.5">Keterangan</th>
                        <th className="px-3 py-1.5 text-right">Debit</th>
                        <th className="px-3 py-1.5 text-right">Kredit</th>
                        <th className="px-3 py-1.5 text-right">Saldo Berjalan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {acc.entries.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-3 py-3 text-center text-slate-400 text-[11px]">
                            Tidak ada mutasi pada akun ini pada periode terpilih.
                          </td>
                        </tr>
                      ) : (
                        acc.entries.map((entry) => (
                          <tr key={entry.id} className="hover:bg-blue-50/50">
                            <td className="px-3 py-1.5 text-slate-600 whitespace-nowrap font-mono text-[11px]">
                              {entry.date}
                            </td>
                            <td className="px-3 py-1.5 font-mono text-blue-700 font-semibold">
                              {entry.refNo}
                            </td>
                            <td className="px-3 py-1.5 text-slate-700 max-w-md truncate text-[11px]">
                              {entry.description}
                            </td>
                            <td className="px-3 py-1.5 text-right font-mono text-slate-800">
                              {entry.debit > 0 ? formatRupiah(entry.debit) : '-'}
                            </td>
                            <td className="px-3 py-1.5 text-right font-mono text-slate-800">
                              {entry.credit > 0 ? formatRupiah(entry.credit) : '-'}
                            </td>
                            <td className="px-3 py-1.5 text-right font-mono font-bold text-slate-900">
                              {formatRupiah(entry.balance)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-VIEW 6: NERACA SALDO */}
      {/* ========================================================================= */}
      {subTab === 'neraca-saldo' && (
        <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
          <div className="p-2.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-tight">
                Neraca Saldo (Trial Balance)
              </h3>
              <p className="text-[10px] text-slate-500">
                Pemeriksaan keseimbangan total debit dan kredit dari semua akun buku besar
              </p>
            </div>

            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold ${
                trialBalance.isBalanced
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              {trialBalance.isBalanced ? 'Seimbang (Balance)' : 'Tidak Seimbang'}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="px-3 py-2">Kode Akun</th>
                  <th className="px-3 py-2">Nama Akun</th>
                  <th className="px-3 py-2">Kategori</th>
                  <th className="px-3 py-2 text-right">Debit (Rp)</th>
                  <th className="px-3 py-2 text-right">Kredit (Rp)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {trialBalance.rows.map((row) => (
                  <tr key={row.code} className="hover:bg-blue-50/50">
                    <td className="px-3 py-1.5 font-mono font-bold text-blue-700">{row.code}</td>
                    <td className="px-3 py-1.5 font-semibold text-slate-900">{row.name}</td>
                    <td className="px-3 py-1.5 text-slate-500">{row.category}</td>
                    <td className="px-3 py-1.5 text-right font-mono font-medium text-slate-900">
                      {row.debit > 0 ? formatRupiah(row.debit) : '-'}
                    </td>
                    <td className="px-3 py-1.5 text-right font-mono font-medium text-slate-900">
                      {row.credit > 0 ? formatRupiah(row.credit) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 font-bold border-t-2 border-slate-300">
                <tr>
                  <td colSpan={3} className="px-3 py-2 text-right uppercase text-slate-700 text-[11px]">
                    TOTAL KESELURUHAN:
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-emerald-700 text-xs">
                    {formatRupiah(trialBalance.totalDebit)}
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-emerald-700 text-xs">
                    {formatRupiah(trialBalance.totalCredit)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-VIEW 7: PIUTANG & STATUS INVOICE                                      */}
      {/* ========================================================================= */}
      {subTab === 'piutang-invoice' && (
        <div className="space-y-3">
          {/* Receivables KPI Summary */}
          {(() => {
            const recSummary = calculateInvoiceReceivablesSummary(invoices);
            const filteredInvs = invoices
              .filter((inv) => matchDateFilter(inv.invoiceDate, filter))
              .sort((a, b) => compareDateDescending(a.invoiceDate, b.invoiceDate));

            return (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      Total Nilai Invoice Terbit
                    </span>
                    <div className="text-base font-black text-slate-900 font-mono mt-0.5">
                      {formatRupiah(recSummary.totalInvoiced)}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5 flex justify-between">
                      <span>{recSummary.totalCount} Faktur</span>
                      <span>Netto: {formatRupiah(recSummary.totalNetReceivable)}</span>
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-emerald-200 shadow-2xs bg-emerald-50/20">
                    <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                      Kas Diterima (Lunas)
                    </span>
                    <div className="text-base font-black text-emerald-800 font-mono mt-0.5">
                      {formatRupiah(recSummary.totalPaid)}
                    </div>
                    <div className="text-[10px] text-emerald-700 mt-0.5 flex justify-between font-medium">
                      <span>{recSummary.countLunas} Lunas</span>
                      <span>{recSummary.collectionRate.toFixed(1)}% Terkumpul</span>
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-rose-200 shadow-2xs bg-rose-50/20">
                    <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider block">
                      Sisa Piutang Usaha
                    </span>
                    <div className="text-base font-black text-rose-800 font-mono mt-0.5">
                      {formatRupiah(recSummary.totalRemaining)}
                    </div>
                    <div className="text-[10px] text-rose-700 mt-0.5 flex justify-between font-medium">
                      <span>{recSummary.countBelumLunas + recSummary.countSebagian} Belum/Cicil</span>
                      <span>Akun 1-102</span>
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs flex flex-col justify-between">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Rasio Penagihan
                      </span>
                      <span className="text-xs font-black text-blue-700 font-mono">
                        {recSummary.collectionRate.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 my-1 overflow-hidden flex">
                      <div
                        className="bg-emerald-500 h-full"
                        style={{ width: `${Math.min(100, recSummary.collectionRate)}%` }}
                      ></div>
                    </div>
                    <div className="text-[10px] text-slate-500 flex justify-between">
                      <span className="text-emerald-700 font-bold">{recSummary.countLunas} Lunas</span>
                      <span className="text-amber-700 font-bold">{recSummary.countSebagian} Cicil</span>
                      <span className="text-rose-700 font-bold">{recSummary.countBelumLunas} Belum</span>
                    </div>
                  </div>
                </div>

                {/* Table of Invoices */}
                <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
                  <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Receipt className="w-4 h-4 text-blue-600" />
                      <h3 className="text-xs font-bold text-slate-800 uppercase tracking-tight">
                        Daftar Piutang & Rekap Invoice Periode Ini
                      </h3>
                    </div>
                    <button
                      onClick={() => exportInvoiceHistoryToExcel(filteredInvs)}
                      disabled={filteredInvs.length === 0}
                      className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded shadow-2xs transition"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Ekspor Excel</span>
                    </button>
                  </div>

                  {filteredInvs.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-slate-50 text-slate-700 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                          <tr>
                            <th className="px-3 py-2 text-center w-8">No</th>
                            <th className="px-3 py-2">No. Invoice & Tanggal</th>
                            <th className="px-3 py-2">No. PO & Klien</th>
                            <th className="px-3 py-2">Lokasi / Periode</th>
                            <th className="px-3 py-2 text-right">Nilai Tagihan</th>
                            <th className="px-3 py-2 text-center">Status</th>
                            <th className="px-3 py-2 text-right">Jumlah Dibayar</th>
                            <th className="px-3 py-2 text-right">Sisa Piutang</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredInvs.map((inv, idx) => {
                            const net = inv.isWapu && inv.netReceivableAmount ? inv.netReceivableAmount : inv.totalAmount;
                            const paid = inv.amountPaid || 0;
                            const remaining = Math.max(0, net - paid);

                            return (
                              <tr key={inv.id} className="hover:bg-slate-50">
                                <td className="px-3 py-2 text-center text-slate-400 font-mono">{idx + 1}</td>
                                <td className="px-3 py-2">
                                  <div className="font-mono font-bold text-blue-900">{inv.invoiceNumber}</div>
                                  <div className="text-[10px] text-slate-500">{formatDateIndo(inv.invoiceDate)}</div>
                                </td>
                                <td className="px-3 py-2">
                                  <div className="font-mono text-xs font-semibold text-slate-800">{inv.poNumber}</div>
                                  <div className="text-[11px] text-slate-900 font-bold">{inv.clientName}</div>
                                </td>
                                <td className="px-3 py-2 text-[11px]">
                                  <div className="text-slate-800">{inv.destination}</div>
                                  <div className="text-[10px] text-slate-500 font-mono">{inv.periodDescription}</div>
                                </td>
                                <td className="px-3 py-2 text-right font-mono font-bold text-slate-900">
                                  {formatRupiah(inv.totalAmount)}
                                </td>
                                <td className="px-3 py-2 text-center">
                                  {inv.status === 'Lunas' ? (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                      Lunas
                                    </span>
                                  ) : inv.status === 'Sebagian' ? (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                      Sebagian
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                      Belum Lunas
                                    </span>
                                  )}
                                </td>
                                <td className="px-3 py-2 text-right font-mono font-bold text-emerald-800">
                                  {formatRupiah(paid)}
                                </td>
                                <td className="px-3 py-2 text-right font-mono font-black text-rose-700">
                                  {formatRupiah(remaining)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
                          <tr>
                            <td colSpan={4} className="px-3 py-2 text-right uppercase text-[11px] text-slate-700">
                              TOTAL PERIODE TERPILIH:
                            </td>
                            <td className="px-3 py-2 text-right font-mono text-xs font-black text-slate-900">
                              {formatRupiah(filteredInvs.reduce((s, i) => s + i.totalAmount, 0))}
                            </td>
                            <td></td>
                            <td className="px-3 py-2 text-right font-mono text-xs font-black text-emerald-800">
                              {formatRupiah(filteredInvs.reduce((s, i) => s + (i.amountPaid || 0), 0))}
                            </td>
                            <td className="px-3 py-2 text-right font-mono text-xs font-black text-rose-800">
                              {formatRupiah(
                                filteredInvs.reduce((s, i) => {
                                  const n = i.isWapu && i.netReceivableAmount ? i.netReceivableAmount : i.totalAmount;
                                  return s + Math.max(0, n - (i.amountPaid || 0));
                                }, 0)
                              )}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  ) : (
                    <div className="p-6 text-center text-slate-400 text-xs">
                      Tidak ada data invoice tersimpan pada periode ini.
                    </div>
                  )}
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* Manual Transaction Modal (Add / Edit) */}
      <ManualTransactionModal
        isOpen={isManualModalOpen}
        onClose={() => {
          setIsManualModalOpen(false);
          setEditingExpense(null);
        }}
        onSave={handleSaveManualTransaction}
        initialData={editingExpense}
      />

      {/* General Journal Entry Modal (Add Adjustment / Edit) */}
      <JournalEntryModal
        isOpen={isJournalModalOpen}
        onClose={() => {
          setIsJournalModalOpen(false);
          setEditingJournal(null);
        }}
        onSave={handleSaveJournalEntry}
        initialData={editingJournal}
      />
    </div>
  );
};
