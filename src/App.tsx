import React, { useState, useEffect, useCallback } from 'react';
import {
  ClientSupplier,
  CompanyProfile,
  DateFilterState,
  Employee,
  IncentiveRecord,
  InvoicePaymentStatus,
  InvoiceRecord,
  JournalEntry,
  MaterialItem,
  MaterialUnit,
  OperationalExpense,
  PurchaseTransaction,
  SalaryRecord,
  SaleTransaction,
  TaxInvoiceEntry,
  TaxProfile,
  WithholdingTaxSlip,
} from './types';
import {
  INITIAL_CLIENTS_SUPPLIERS,
  INITIAL_COMPANY_PROFILE,
  INITIAL_EMPLOYEES,
  INITIAL_EXPENSES,
  INITIAL_INCENTIVES,
  INITIAL_INVOICES,
  INITIAL_MATERIALS,
  INITIAL_PURCHASES,
  INITIAL_SALARIES,
  INITIAL_SALES,
  INITIAL_TAX_INVOICES,
  INITIAL_TAX_PROFILE,
  INITIAL_WITHHOLDING_SLIPS,
} from './data/initialData';
import { getCurrentMonthString, getTodayDateString } from './utils/formatters';
import { Navbar, MainTabType } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { ClientSupplierList } from './components/ClientSupplierList';
import { MaterialList } from './components/MaterialList';
import { SalesList } from './components/SalesList';
import { PurchaseList } from './components/PurchaseList';
import { InvoiceView } from './components/InvoiceView';
import { IncentiveView } from './components/IncentiveView';
import { SalaryView } from './components/SalaryView';
import { TaxManagementView } from './components/TaxManagementView';
import { FinancialReports } from './components/FinancialReports';
import { SettingsView } from './components/SettingsView';
import { PrintModal } from './components/PrintModal';
import { Undo2, X, CheckCircle2 } from 'lucide-react';
import { useAutoSaveSync } from './hooks/useAutoSaveSync';
import { apiService } from './utils/apiService';

const STORAGE_KEYS = {
  CLIENTS: 'mat_app_clients_v1',
  MATERIALS: 'mat_app_materials_v1',
  SALES: 'mat_app_sales_v1',
  PURCHASES: 'mat_app_purchases_v1',
  EXPENSES: 'mat_app_expenses_v1',
  PROFILE: 'mat_app_profile_v1',
  TAX_PROFILE: 'mat_app_tax_profile_v1',
  TAX_INVOICES: 'mat_app_tax_invoices_v1',
  WITHHOLDING_SLIPS: 'mat_app_withholding_slips_v1',
  INVOICES: 'mat_app_invoices_v1',
  EMPLOYEES: 'mat_app_employees_v1',
  INCENTIVES: 'mat_app_incentives_v1',
  SALARIES: 'mat_app_salaries_v1',
  CUSTOM_JOURNALS: 'mat_app_custom_journals_v1',
  DELETED_JOURNALS: 'mat_app_deleted_journals_v1',
  ACTIVE_TAB: 'mat_app_active_tab_v1',
  DATE_FILTER: 'mat_app_date_filter_v1',
};

interface HistorySnapshot {
  id: string;
  description: string;
  timestamp: string;
  sales: SaleTransaction[];
  purchases: PurchaseTransaction[];
  clients: ClientSupplier[];
  materials: MaterialItem[];
  expenses: OperationalExpense[];
  taxInvoices: TaxInvoiceEntry[];
  withholdingSlips: WithholdingTaxSlip[];
  invoices?: InvoiceRecord[];
  employees?: Employee[];
  incentives?: IncentiveRecord[];
  salaries?: SalaryRecord[];
  customJournals?: JournalEntry[];
  deletedJournalIds?: string[];
}

export default function App() {
  const [currentTab, setCurrentTab] = useState<MainTabType>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ACTIVE_TAB);
      return (saved as MainTabType) || 'dashboard';
    } catch {
      return 'dashboard';
    }
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Local state initialized from LocalStorage or Initial Mock Data
  const [clients, setClients] = useState<ClientSupplier[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CLIENTS);
      return saved ? JSON.parse(saved) : INITIAL_CLIENTS_SUPPLIERS;
    } catch {
      return INITIAL_CLIENTS_SUPPLIERS;
    }
  });

  const [materials, setMaterials] = useState<MaterialItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.MATERIALS);
      return saved ? JSON.parse(saved) : INITIAL_MATERIALS;
    } catch {
      return INITIAL_MATERIALS;
    }
  });

  const [sales, setSales] = useState<SaleTransaction[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SALES);
      return saved ? JSON.parse(saved) : INITIAL_SALES;
    } catch {
      return INITIAL_SALES;
    }
  });

  const [purchases, setPurchases] = useState<PurchaseTransaction[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PURCHASES);
      return saved ? JSON.parse(saved) : INITIAL_PURCHASES;
    } catch {
      return INITIAL_PURCHASES;
    }
  });

  const [expenses, setExpenses] = useState<OperationalExpense[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.EXPENSES);
      return saved ? JSON.parse(saved) : INITIAL_EXPENSES;
    } catch {
      return INITIAL_EXPENSES;
    }
  });

  const [companyProfile, setCompanyProfile] = useState<CompanyProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PROFILE);
      return saved ? JSON.parse(saved) : INITIAL_COMPANY_PROFILE;
    } catch {
      return INITIAL_COMPANY_PROFILE;
    }
  });

  const [taxProfile, setTaxProfile] = useState<TaxProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TAX_PROFILE);
      return saved ? JSON.parse(saved) : INITIAL_TAX_PROFILE;
    } catch {
      return INITIAL_TAX_PROFILE;
    }
  });

  const [taxInvoices, setTaxInvoices] = useState<TaxInvoiceEntry[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TAX_INVOICES);
      return saved ? JSON.parse(saved) : INITIAL_TAX_INVOICES;
    } catch {
      return INITIAL_TAX_INVOICES;
    }
  });

  const [withholdingSlips, setWithholdingSlips] = useState<WithholdingTaxSlip[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.WITHHOLDING_SLIPS);
      return saved ? JSON.parse(saved) : INITIAL_WITHHOLDING_SLIPS;
    } catch {
      return INITIAL_WITHHOLDING_SLIPS;
    }
  });

  const [invoices, setInvoices] = useState<InvoiceRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.INVOICES);
      return saved ? JSON.parse(saved) : INITIAL_INVOICES;
    } catch {
      return INITIAL_INVOICES;
    }
  });

  const [employees, setEmployees] = useState<Employee[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.EMPLOYEES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map((emp: any) => ({
            ...emp,
            baseSalary: Number(emp.baseSalary) || 0,
            allowances: {
              transport: Number(emp.allowances?.transport) || 0,
              meal: Number(emp.allowances?.meal) || 0,
              position: Number(emp.allowances?.position) || 0,
              attendance: Number(emp.allowances?.attendance) || 0,
            },
          }));
        }
      }
      return INITIAL_EMPLOYEES;
    } catch {
      return INITIAL_EMPLOYEES;
    }
  });

  const [incentives, setIncentives] = useState<IncentiveRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.INCENTIVES);
      return saved ? JSON.parse(saved) : INITIAL_INCENTIVES;
    } catch {
      return INITIAL_INCENTIVES;
    }
  });

  const [salaries, setSalaries] = useState<SalaryRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SALARIES);
      return saved ? JSON.parse(saved) : INITIAL_SALARIES;
    } catch {
      return INITIAL_SALARIES;
    }
  });

  // State to bridge 1-click incentive to salary form
  const [pendingIncentiveForSalary, setPendingIncentiveForSalary] = useState<IncentiveRecord | null>(null);

  const [customJournals, setCustomJournals] = useState<JournalEntry[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CUSTOM_JOURNALS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [deletedJournalIds, setDeletedJournalIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.DELETED_JOURNALS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Global Date Filter State
  const [dateFilter, setDateFilter] = useState<DateFilterState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.DATE_FILTER);
      return saved
        ? JSON.parse(saved)
        : {
            mode: 'semua',
            date: getTodayDateString(),
            month: getCurrentMonthString(),
            startDate: getTodayDateString(),
            endDate: getTodayDateString(),
          };
    } catch {
      return {
        mode: 'semua',
        date: getTodayDateString(),
        month: getCurrentMonthString(),
        startDate: getTodayDateString(),
        endDate: getTodayDateString(),
      };
    }
  });

  // Print Modal State
  const [printModal, setPrintModal] = useState<{
    isOpen: boolean;
    title: string;
    content: React.ReactNode;
  }>({
    isOpen: false,
    title: '',
    content: null,
  });

  // --- UNDO HISTORY SYSTEM ---
  const [historyStack, setHistoryStack] = useState<HistorySnapshot[]>([]);
  const [undoToast, setUndoToast] = useState<{
    show: boolean;
    message: string;
    subtext?: string;
  }>({
    show: false,
    message: '',
  });

  // Push current state to undo history before any mutation
  const pushHistory = useCallback((description: string) => {
    setHistoryStack((prev) => [
      {
        id: `hist-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        description,
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        sales,
        purchases,
        clients,
        materials,
        expenses,
        taxInvoices,
        withholdingSlips,
        invoices,
        employees,
        incentives,
        salaries,
        customJournals,
        deletedJournalIds,
      },
      ...prev.slice(0, 29), // Store up to 30 past steps
    ]);
  }, [sales, purchases, clients, materials, expenses, taxInvoices, withholdingSlips, invoices, employees, incentives, salaries, customJournals, deletedJournalIds]);

  // Execute Undo
  const handleUndo = useCallback(() => {
    if (historyStack.length === 0) return;
    const [snapshotToRestore, ...remainingStack] = historyStack;

    setSales(snapshotToRestore.sales);
    setPurchases(snapshotToRestore.purchases);
    setClients(snapshotToRestore.clients);
    setMaterials(snapshotToRestore.materials);
    setExpenses(snapshotToRestore.expenses);
    setTaxInvoices(snapshotToRestore.taxInvoices);
    setWithholdingSlips(snapshotToRestore.withholdingSlips);
    if (snapshotToRestore.invoices) setInvoices(snapshotToRestore.invoices);
    if (snapshotToRestore.employees) setEmployees(snapshotToRestore.employees);
    if (snapshotToRestore.incentives) setIncentives(snapshotToRestore.incentives);
    if (snapshotToRestore.salaries) setSalaries(snapshotToRestore.salaries);
    if (snapshotToRestore.customJournals) setCustomJournals(snapshotToRestore.customJournals);
    if (snapshotToRestore.deletedJournalIds) setDeletedJournalIds(snapshotToRestore.deletedJournalIds);
    setHistoryStack(remainingStack);

    setUndoToast({
      show: true,
      message: `Undo Berhasil: "${snapshotToRestore.description}"`,
      subtext: `Data telah dikembalikan ke kondisi sebelumnya (${snapshotToRestore.timestamp})`,
    });
  }, [historyStack]);

  // Keyboard shortcut Ctrl+Z / Cmd+Z for instant undo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        const activeTag = document.activeElement?.tagName.toLowerCase();
        if (activeTag === 'input' || activeTag === 'textarea' || (document.activeElement as HTMLElement)?.isContentEditable) {
          return; // Let standard input undo handle inside text inputs
        }
        e.preventDefault();
        if (historyStack.length > 0) {
          handleUndo();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [historyStack, handleUndo]);

  // Auto-dismiss undo toast after 6 seconds
  useEffect(() => {
    if (undoToast.show) {
      const timer = setTimeout(() => {
        setUndoToast((prev) => ({ ...prev, show: false }));
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [undoToast.show]);

  // Centralized Auto-Save with Debounce (700ms), API Database (Primary), and LocalStorage (Cache & Exit Protection)
  const {
    saveStatus,
    lastSavedTime,
    flushNow,
    forceSaveAll,
  } = useAutoSaveSync(
    {
      clients,
      materials,
      sales,
      purchases,
      expenses,
      companyProfile,
      taxProfile,
      taxInvoices,
      withholdingSlips,
      invoices,
      employees,
      incentives,
      salaries,
      customJournals,
      deletedJournalIds,
    },
    {
      debounceMs: 700,
      storageKeys: STORAGE_KEYS,
      onServerLoaded: (serverData) => {
        if (serverData.clients && Array.isArray(serverData.clients)) setClients(serverData.clients);
        if (serverData.materials && Array.isArray(serverData.materials)) setMaterials(serverData.materials);
        if (serverData.sales && Array.isArray(serverData.sales)) setSales(serverData.sales);
        if (serverData.purchases && Array.isArray(serverData.purchases)) setPurchases(serverData.purchases);
        if (serverData.expenses && Array.isArray(serverData.expenses)) setExpenses(serverData.expenses);
        if (serverData.companyProfile) setCompanyProfile(serverData.companyProfile);
        if (serverData.taxProfile) setTaxProfile(serverData.taxProfile);
        if (serverData.taxInvoices && Array.isArray(serverData.taxInvoices)) setTaxInvoices(serverData.taxInvoices);
        if (serverData.withholdingSlips && Array.isArray(serverData.withholdingSlips)) setWithholdingSlips(serverData.withholdingSlips);
        if (serverData.invoices && Array.isArray(serverData.invoices)) setInvoices(serverData.invoices);
        if (serverData.employees && Array.isArray(serverData.employees)) {
          setEmployees(
            serverData.employees.map((emp: any) => ({
              ...emp,
              baseSalary: Number(emp.baseSalary) || 0,
              allowances: {
                transport: Number(emp.allowances?.transport) || 0,
                meal: Number(emp.allowances?.meal) || 0,
                position: Number(emp.allowances?.position) || 0,
                attendance: Number(emp.allowances?.attendance) || 0,
              },
            }))
          );
        }
        if (serverData.incentives && Array.isArray(serverData.incentives)) setIncentives(serverData.incentives);
        if (serverData.salaries && Array.isArray(serverData.salaries)) setSalaries(serverData.salaries);
        if (serverData.customJournals && Array.isArray(serverData.customJournals)) setCustomJournals(serverData.customJournals);
        if (serverData.deletedJournalIds && Array.isArray(serverData.deletedJournalIds)) setDeletedJournalIds(serverData.deletedJournalIds);
      },
    }
  );

  // Tab change flush & persistence
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_TAB, currentTab);
      // Flush any pending auto-save immediately on tab switch
      flushNow();
    } catch (e) {
      console.error('Error saving active tab', e);
    }
  }, [currentTab, flushNow]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.DATE_FILTER, JSON.stringify(dateFilter));
    } catch (e) {
      console.error('Error saving date filter', e);
    }
  }, [dateFilter]);

  // Open Print Modal Helper
  const openPrintModal = (title: string, content: React.ReactNode) => {
    setPrintModal({
      isOpen: true,
      title,
      content,
    });
  };

  const closePrintModal = () => {
    setPrintModal((prev) => ({ ...prev, isOpen: false }));
  };

  // --- CRUD CLIENTS & SUPPLIERS ---
  const handleAddClientSupplier = (item: Omit<ClientSupplier, 'id'>) => {
    pushHistory(`Tambah Klien/Supplier: ${item.name}`);
    const newItem: ClientSupplier = {
      ...item,
      id: `${item.type}-${Date.now()}`,
    };
    setClients((prev) => [newItem, ...prev]);
  };

  const handleUpdateClientSupplier = (id: string, updated: Partial<ClientSupplier>) => {
    pushHistory(`Edit Klien/Supplier`);
    setClients((prev) => prev.map((c) => (c.id === id ? { ...c, ...updated } : c)));
  };

  const handleDeleteClientSupplier = (id: string) => {
    const item = clients.find((c) => c.id === id);
    pushHistory(`Hapus Klien/Supplier: ${item?.name || ''}`);
    setClients((prev) => prev.filter((c) => c.id !== id));
  };

  // --- CRUD MATERIALS ---
  const handleAddMaterial = (item: Omit<MaterialItem, 'id'>) => {
    pushHistory(`Tambah Material: ${item.name}`);
    const newItem: MaterialItem = {
      ...item,
      id: `mat-${Date.now()}`,
    };
    setMaterials((prev) => [newItem, ...prev]);
  };

  const handleUpdateMaterial = (id: string, updated: Partial<MaterialItem>) => {
    pushHistory(`Edit Material`);
    setMaterials((prev) => prev.map((m) => (m.id === id ? { ...m, ...updated } : m)));
  };

  const handleDeleteMaterial = (id: string) => {
    const mat = materials.find((m) => m.id === id);
    pushHistory(`Hapus Material: ${mat?.name || ''}`);
    setMaterials((prev) => prev.filter((m) => m.id !== id));
  };

  // --- CRUD SALES (DENGAN AUTO-SYNC PEMBELIAN) ---
  const handleAddSale = (saleData: Omit<SaleTransaction, 'id' | 'createdAt'>) => {
    pushHistory(`Tambah Penjualan SJ: ${saleData.deliveryNoteNumber} (${saleData.clientName})`);
    const saleId = `sale-${Date.now()}`;
    const newSale: SaleTransaction = {
      ...saleData,
      id: saleId,
      createdAt: new Date().toISOString(),
    };

    setSales((prev) => [newSale, ...prev]);

    // Temukan base purchase price dari material
    const matchedMat = materials.find(
      (m) =>
        m.name.toLowerCase() === saleData.itemName.toLowerCase() &&
        m.quarry.toLowerCase() === saleData.quarry.toLowerCase()
    );

    const purchaseUnitPrice = matchedMat ? matchedMat.purchasePrice : Math.round(saleData.price * 0.75);

    // AUTO-CREATE MATCHING PURCHASE (QUARRY ENTRY)
    const autoPurchase: PurchaseTransaction = {
      id: `pur-auto-${Date.now()}`,
      date: saleData.date,
      deliveryNoteNumber: saleData.deliveryNoteNumber,
      supplierName: saleData.quarry,
      itemId: matchedMat ? matchedMat.id : 'mat-1',
      itemName: saleData.itemName,
      quarry: saleData.quarry,
      volume: saleData.volume,
      unit: saleData.unit,
      price: purchaseUnitPrice,
      totalAmount: saleData.volume * purchaseUnitPrice,
      paymentStatus: 'Belum Lunas',
      notes: `Auto-generated dari Penjualan SJ: ${saleData.deliveryNoteNumber} (${saleData.clientName})`,
      destination: saleData.destination,
      saleId: saleId,
      createdAt: new Date().toISOString(),
    };

    setPurchases((prev) => [autoPurchase, ...prev]);
  };

  const handleBulkAddSales = (newSalesList: Omit<SaleTransaction, 'id' | 'createdAt'>[]) => {
    if (newSalesList.length === 0) return;
    pushHistory(`Impor ${newSalesList.length} Transaksi Penjualan dari Excel`);

    const timeNow = Date.now();
    const createdSales: SaleTransaction[] = [];
    const createdPurchases: PurchaseTransaction[] = [];

    const newClientsToAdd: ClientSupplier[] = [];
    const newSuppliersToAdd: ClientSupplier[] = [];
    const newMaterialsToAdd: MaterialItem[] = [];

    // Helper map of existing clients and materials
    const clientNameMap = new Map<string, ClientSupplier>();
    clients.forEach((c) => {
      if (c.type === 'klien') clientNameMap.set(c.name.trim().toLowerCase(), c);
    });

    const supplierNameMap = new Map<string, ClientSupplier>();
    clients.forEach((c) => {
      if (c.type === 'supplier') supplierNameMap.set(c.name.trim().toLowerCase(), c);
    });

    const materialNameMap = new Map<string, MaterialItem>();
    materials.forEach((m) => {
      materialNameMap.set(m.name.trim().toLowerCase(), m);
    });

    newSalesList.forEach((s, idx) => {
      const saleId = `sale-${timeNow}-${idx}`;
      const cNameKey = (s.clientName || '').trim().toLowerCase();
      const qNameKey = (s.quarry || '').trim().toLowerCase();
      const mNameKey = (s.itemName || '').trim().toLowerCase();

      // 1. Synchronize Client
      let resolvedClientId = s.clientId;
      if (cNameKey) {
        let existingClient = clientNameMap.get(cNameKey);
        if (!existingClient) {
          const isWapu = /wika|adhi|ptpp|hutama|waskita|nindya|brantas|bumn|kemenpupr|semen/i.test(s.clientName);
          const newClient: ClientSupplier = {
            id: `client-auto-${timeNow}-${idx}`,
            type: 'klien',
            name: s.clientName,
            address: s.destination || '-',
            isPKP: isWapu,
            contactPerson: 'Bagian Logistik / Proyek',
            phone: '-',
            notes: isWapu ? 'Klien BUMN / WAPU (Import Excel)' : 'Klien Reguler (Import Excel)',
          };
          newClientsToAdd.push(newClient);
          clientNameMap.set(cNameKey, newClient);
          resolvedClientId = newClient.id;
        } else {
          resolvedClientId = existingClient.id;
        }
      }

      // 2. Synchronize Quarry / Supplier
      if (qNameKey && !supplierNameMap.has(qNameKey)) {
        const newSup: ClientSupplier = {
          id: `sup-auto-${timeNow}-${idx}`,
          type: 'supplier',
          name: s.quarry,
          address: 'Lokasi Tambang / Quarry',
          contactPerson: 'Operasional Quarry',
          phone: '-',
          notes: 'Supplier Quarry (Import Excel)',
        };
        newSuppliersToAdd.push(newSup);
        supplierNameMap.set(qNameKey, newSup);
      }

      // 3. Synchronize Material
      let resolvedItemId = s.itemId;
      let matchedMat = materialNameMap.get(mNameKey);
      if (!matchedMat && mNameKey) {
        const estHpp = Math.round(s.price * 0.75);
        const validUnit = (['m3', 'ton', 'kg', 'rit', 'truk', 'sak'].includes(s.unit) ? s.unit : 'm3') as MaterialUnit;
        matchedMat = {
          id: `mat-auto-${timeNow}-${idx}`,
          name: s.itemName,
          unit: validUnit,
          purchasePrice: estHpp,
          sellingPrice: s.price,
          quarry: s.quarry || 'Quarry Mitra Utama',
          destination: s.destination || 'Lokasi Proyek',
          description: 'Auto-sync Master Barang dari Excel',
        };
        newMaterialsToAdd.push(matchedMat);
        materialNameMap.set(mNameKey, matchedMat);
        resolvedItemId = matchedMat.id;
      } else if (matchedMat) {
        resolvedItemId = matchedMat.id;
      }

      // 4. Create Sale
      const saleObj: SaleTransaction = {
        ...s,
        id: saleId,
        clientId: resolvedClientId,
        itemId: resolvedItemId || 'mat-1',
        createdAt: new Date().toISOString(),
      };
      createdSales.push(saleObj);

      // 5. Synchronize Purchase (HPP Quarry)
      const purchaseUnitPrice = matchedMat ? matchedMat.purchasePrice : Math.round(s.price * 0.75);

      const purchaseObj: PurchaseTransaction = {
        id: `pur-auto-${timeNow}-${idx}`,
        date: s.date,
        deliveryNoteNumber: s.deliveryNoteNumber,
        supplierName: s.quarry,
        itemId: resolvedItemId || 'mat-1',
        itemName: s.itemName,
        quarry: s.quarry,
        volume: s.volume,
        unit: s.unit,
        price: purchaseUnitPrice,
        totalAmount: s.volume * purchaseUnitPrice,
        paymentStatus: 'Belum Lunas',
        notes: `Import Excel SJ: ${s.deliveryNoteNumber} (${s.clientName})`,
        destination: s.destination,
        saleId: saleId,
        createdAt: new Date().toISOString(),
      };
      createdPurchases.push(purchaseObj);
    });

    if (newClientsToAdd.length > 0 || newSuppliersToAdd.length > 0) {
      setClients((prev) => [...newClientsToAdd, ...newSuppliersToAdd, ...prev]);
    }
    if (newMaterialsToAdd.length > 0) {
      setMaterials((prev) => [...newMaterialsToAdd, ...prev]);
    }

    setSales((prev) => [...createdSales, ...prev]);
    setPurchases((prev) => [...createdPurchases, ...prev]);

    setUndoToast({
      show: true,
      message: `Berhasil mengimpor ${newSalesList.length} transaksi dari Excel!`,
      subtext: `Data pembelian quarry & master klien otomatis disinkronkan. Tekan Ctrl+Z untuk Undo.`,
    });
  };

  const handleUpdateSale = (id: string, updated: Partial<SaleTransaction>) => {
    pushHistory(`Edit Penjualan`);
    setSales((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          const merged = { ...s, ...updated };
          return merged;
        }
        return s;
      })
    );

    // Also update linked purchase if present
    setPurchases((prev) =>
      prev.map((p) => {
        if (p.saleId === id) {
          const newVol = updated.volume !== undefined ? updated.volume : p.volume;
          const newPrice = p.price;
          return {
            ...p,
            date: updated.date || p.date,
            deliveryNoteNumber: updated.deliveryNoteNumber || p.deliveryNoteNumber,
            itemName: updated.itemName || p.itemName,
            volume: newVol,
            destination: updated.destination || p.destination,
            totalAmount: newVol * newPrice,
          };
        }
        return p;
      })
    );
  };

  const handleDeleteSale = (id: string) => {
    const item = sales.find((s) => s.id === id);
    pushHistory(`Hapus Penjualan SJ: ${item?.deliveryNoteNumber || ''}`);
    setSales((prev) => prev.filter((s) => s.id !== id));
    // Also remove the auto-generated purchase associated with this sale
    setPurchases((prev) => prev.filter((p) => p.saleId !== id));
  };

  const handleBulkDeleteSales = (ids: string[]) => {
    if (!ids || ids.length === 0) return;
    pushHistory(`Hapus ${ids.length} Transaksi Penjualan`);
    const idSet = new Set(ids);
    setSales((prev) => prev.filter((s) => !idSet.has(s.id)));
    // Also remove any linked purchases
    setPurchases((prev) => prev.filter((p) => !p.saleId || !idSet.has(p.saleId)));
    setUndoToast({
      show: true,
      message: `Berhasil menghapus ${ids.length} data penjualan terpilih.`,
      subtext: `Sinkronisasi HPP Quarry terkait ikut dibersihkan. Tekan Ctrl+Z untuk Undo.`,
    });
  };

  const handleBulkUpdateSales = (ids: string[], updates: Partial<SaleTransaction>) => {
    if (!ids || ids.length === 0 || Object.keys(updates).length === 0) return;
    pushHistory(`Edit Masal ${ids.length} Transaksi Penjualan`);
    const idSet = new Set(ids);

    setSales((prev) =>
      prev.map((s) => {
        if (idSet.has(s.id)) {
          const newVol = updates.volume !== undefined ? updates.volume : s.volume;
          const newPrice = updates.price !== undefined ? updates.price : s.price;
          const newTotal = newVol * newPrice;

          return {
            ...s,
            ...updates,
            volume: newVol,
            price: newPrice,
            totalAmount: newTotal,
          };
        }
        return s;
      })
    );

    // Also update linked purchases if relevant fields changed
    if (
      updates.date ||
      updates.deliveryNoteNumber ||
      updates.itemName ||
      updates.quarry ||
      updates.destination ||
      updates.volume !== undefined
    ) {
      setPurchases((prev) =>
        prev.map((p) => {
          if (p.saleId && idSet.has(p.saleId)) {
            const newVol = updates.volume !== undefined ? updates.volume : p.volume;
            return {
              ...p,
              date: updates.date || p.date,
              deliveryNoteNumber: updates.deliveryNoteNumber || p.deliveryNoteNumber,
              itemName: updates.itemName || p.itemName,
              quarry: updates.quarry || p.quarry,
              supplierName: updates.quarry || p.supplierName,
              destination: updates.destination || p.destination,
              volume: newVol,
              totalAmount: newVol * p.price,
            };
          }
          return p;
        })
      );
    }

    setUndoToast({
      show: true,
      message: `Berhasil memperbarui ${ids.length} transaksi penjualan secara masal!`,
      subtext: `Sinkronisasi HPP Quarry terkait ikut diperbarui. Tekan Ctrl+Z untuk Undo.`,
    });
  };

  // --- CRUD PURCHASES ---
  const handleAddPurchase = (purchaseData: Omit<PurchaseTransaction, 'id' | 'createdAt'>) => {
    pushHistory(`Tambah Pembelian DO: ${purchaseData.deliveryNoteNumber}`);
    const newPurchase: PurchaseTransaction = {
      ...purchaseData,
      id: `pur-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setPurchases((prev) => [newPurchase, ...prev]);
  };

  const handleUpdatePurchase = (id: string, updated: Partial<PurchaseTransaction>) => {
    pushHistory(`Edit Pembelian`);
    setPurchases((prev) => prev.map((p) => (p.id === id ? { ...p, ...updated } : p)));
  };

  const handleDeletePurchase = (id: string) => {
    const item = purchases.find((p) => p.id === id);
    pushHistory(`Hapus Pembelian DO: ${item?.deliveryNoteNumber || ''}`);
    setPurchases((prev) => prev.filter((p) => p.id !== id));
  };

  const handleBulkDeletePurchases = (ids: string[]) => {
    if (!ids || ids.length === 0) return;
    pushHistory(`Hapus ${ids.length} Transaksi Pembelian`);
    const idSet = new Set(ids);
    setPurchases((prev) => prev.filter((p) => !idSet.has(p.id)));
    setUndoToast({
      show: true,
      message: `Berhasil menghapus ${ids.length} data pembelian terpilih.`,
      subtext: `Tekan Ctrl+Z atau tombol Undo jika ingin membatalkan.`,
    });
  };

  const handleBulkUpdatePurchases = (ids: string[], updates: Partial<PurchaseTransaction>) => {
    if (!ids || ids.length === 0 || Object.keys(updates).length === 0) return;
    pushHistory(`Edit Masal ${ids.length} Transaksi Pembelian`);
    const idSet = new Set(ids);

    setPurchases((prev) =>
      prev.map((p) => {
        if (idSet.has(p.id)) {
          const newVol = updates.volume !== undefined ? updates.volume : p.volume;
          const newPrice = updates.price !== undefined ? updates.price : p.price;
          const newTotal = newVol * newPrice;

          return {
            ...p,
            ...updates,
            volume: newVol,
            price: newPrice,
            totalAmount: newTotal,
          };
        }
        return p;
      })
    );

    setUndoToast({
      show: true,
      message: `Berhasil memperbarui ${ids.length} transaksi pembelian secara masal!`,
      subtext: `Tekan Ctrl+Z atau tombol Undo jika ingin membatalkan.`,
    });
  };

  // --- EXPENSES & MANUAL TRANSACTIONS ---
  const handleAddExpense = (expense: Omit<OperationalExpense, 'id'>) => {
    pushHistory(`Tambah Transaksi Manual: ${expense.transactionName || expense.category}`);
    const newExp: OperationalExpense = {
      ...expense,
      id: `exp-${Date.now()}`,
    };
    setExpenses((prev) => [newExp, ...prev]);
  };

  const handleUpdateExpense = (id: string, updated: Partial<OperationalExpense>) => {
    pushHistory(`Edit Transaksi Manual`);
    setExpenses((prev) => prev.map((e) => (e.id === id ? { ...e, ...updated } : e)));
  };

  const handleDeleteExpense = (id: string) => {
    const item = expenses.find((e) => e.id === id);
    pushHistory(`Hapus Transaksi Manual: ${item?.transactionName || item?.category || ''}`);
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  };

  // --- GENERAL JOURNAL CUSTOM ENTRIES & OVERRIDES ---
  const handleAddJournalEntry = (entry: JournalEntry) => {
    pushHistory(`Tambah Jurnal Penyesuaian: ${entry.refNo}`);
    setCustomJournals((prev) => [entry, ...prev]);
  };

  const handleUpdateJournalEntry = (id: string, updated: Partial<JournalEntry>) => {
    pushHistory(`Edit Jurnal: ${updated.refNo || id}`);
    setCustomJournals((prev) => {
      const exists = prev.some((j) => j.id === id);
      if (exists) {
        return prev.map((j) => (j.id === id ? { ...j, ...updated, isCustomOrEdited: true } : j));
      } else {
        // If it was an auto-generated journal entry being edited, save as custom journal entry
        return [{ id, ...updated, isCustomOrEdited: true } as JournalEntry, ...prev];
      }
    });
  };

  const handleDeleteJournalEntry = (id: string) => {
    pushHistory(`Hapus Ayat Jurnal`);
    setDeletedJournalIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    setCustomJournals((prev) => prev.filter((j) => j.id !== id));
    // Also remove from expenses if it originated from manual transaction
    setExpenses((prev) => prev.filter((e) => e.id !== id && `jrn-${e.id}` !== id));
  };

  // --- TAX MANAGEMENT CRUD ---
  const handleAddTaxInvoice = (entry: Omit<TaxInvoiceEntry, 'id'>) => {
    pushHistory(`Tambah Faktur Pajak: ${entry.taxNumber}`);
    const newTaxInvoice: TaxInvoiceEntry = {
      ...entry,
      id: `tx-${Date.now()}`,
    };
    setTaxInvoices((prev) => [newTaxInvoice, ...prev]);

    // Auto increment NSFP index if it was Keluaran
    if (entry.type === 'keluaran') {
      setTaxProfile((prev) => ({
        ...prev,
        lastNsfpIndex: prev.lastNsfpIndex + 1,
      }));
    }
  };

  const handleUpdateTaxInvoice = (updated: TaxInvoiceEntry) => {
    pushHistory(`Update Faktur Pajak: ${updated.taxNumber}`);
    setTaxInvoices((prev) =>
      prev.map((t) => (t.id === updated.id ? updated : t))
    );
  };

  const handleDeleteTaxInvoice = (id: string) => {
    pushHistory(`Hapus Faktur Pajak`);
    setTaxInvoices((prev) => prev.filter((t) => t.id !== id));
  };

  const handleAddWithholdingSlip = (slip: Omit<WithholdingTaxSlip, 'id'>) => {
    pushHistory(`Tambah Bukti Potong Pajak`);
    const newSlip: WithholdingTaxSlip = {
      ...slip,
      id: `bupot-${Date.now()}`,
    };
    setWithholdingSlips((prev) => [newSlip, ...prev]);
  };

  const handleDeleteWithholdingSlip = (id: string) => {
    pushHistory(`Hapus Bukti Potong Pajak`);
    setWithholdingSlips((prev) => prev.filter((w) => w.id !== id));
  };

  // --- INVOICE HISTORY & PAYMENT HANDLERS ---
  const handleAddInvoice = (
    invData: Omit<InvoiceRecord, 'id' | 'createdAt'> & { id?: string; syncSales?: boolean }
  ) => {
    pushHistory(`Simpan Invoice ${invData.invoiceNumber}`);
    const newInvoice: InvoiceRecord = {
      ...invData,
      id: invData.id || `inv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      createdAt: new Date().toISOString(),
    };

    setInvoices((prev) => [newInvoice, ...prev.filter((i) => i.id !== newInvoice.id)]);

    // Synchronize sales transactions if requested
    if (invData.syncSales && invData.saleIds && invData.saleIds.length > 0) {
      const saleIdSet = new Set(invData.saleIds);
      setSales((prev) =>
        prev.map((s) => {
          if (saleIdSet.has(s.id)) {
            const isLunas = invData.status === 'Lunas';
            return {
              ...s,
              paymentStatus: isLunas ? 'lunas' : s.paymentStatus,
              amountPaid: isLunas ? s.totalAmount : s.amountPaid,
            };
          }
          return s;
        })
      );
    }

    setUndoToast({
      show: true,
      message: `Invoice ${newInvoice.invoiceNumber} Berhasil Disimpan`,
      subtext: `Status: ${newInvoice.status} | Nilai: Rp ${newInvoice.totalAmount.toLocaleString('id-ID')}`,
    });
  };

  const handleUpdateInvoice = (
    id: string,
    updatedData: Partial<InvoiceRecord> & { syncSales?: boolean }
  ) => {
    pushHistory(`Update Invoice`);
    setInvoices((prev) =>
      prev.map((inv) => (inv.id === id ? { ...inv, ...updatedData } : inv))
    );

    if (updatedData.syncSales && updatedData.saleIds && updatedData.saleIds.length > 0) {
      const saleIdSet = new Set(updatedData.saleIds);
      setSales((prev) =>
        prev.map((s) => {
          if (saleIdSet.has(s.id)) {
            const isLunas = updatedData.status === 'Lunas';
            return {
              ...s,
              paymentStatus: isLunas ? 'lunas' : s.paymentStatus,
              amountPaid: isLunas ? s.totalAmount : s.amountPaid,
            };
          }
          return s;
        })
      );
    }
  };

  const handleDeleteInvoice = (id: string) => {
    const target = invoices.find((i) => i.id === id);
    pushHistory(`Hapus Invoice ${target?.invoiceNumber || ''}`);
    setInvoices((prev) => prev.filter((inv) => inv.id !== id));
  };

  const handleRecordInvoicePayment = (
    id: string,
    paymentData: {
      status: InvoicePaymentStatus;
      amountPaid: number;
      paymentDate: string;
      paymentAccountCode?: string;
      paymentReference?: string;
      notes?: string;
      syncSales?: boolean;
    }
  ) => {
    const target = invoices.find((i) => i.id === id);
    pushHistory(`Catat Pembayaran Invoice ${target?.invoiceNumber || ''}`);

    setInvoices((prev) =>
      prev.map((inv) => {
        if (inv.id === id) {
          return {
            ...inv,
            status: paymentData.status,
            amountPaid: paymentData.amountPaid,
            paymentDate: paymentData.paymentDate,
            paymentAccountCode: paymentData.paymentAccountCode || inv.paymentAccountCode,
            paymentReference: paymentData.paymentReference || inv.paymentReference,
            notes: paymentData.notes !== undefined ? paymentData.notes : inv.notes,
          };
        }
        return inv;
      })
    );

    // Synchronize linked sales transactions to update their payment status
    if (target && paymentData.syncSales !== false) {
      const saleIds = target.saleIds || [];
      if (saleIds.length > 0) {
        const saleIdSet = new Set(saleIds);
        setSales((prev) =>
          prev.map((s) => {
            if (saleIdSet.has(s.id)) {
              const isFull = paymentData.status === 'Lunas';
              return {
                ...s,
                paymentStatus: isFull ? 'lunas' : s.paymentStatus,
                amountPaid: isFull ? s.totalAmount : s.amountPaid,
                paymentDate: isFull ? paymentData.paymentDate : s.paymentDate,
              };
            }
            return s;
          })
        );
      }
    }

    setUndoToast({
      show: true,
      message: `Pembayaran Invoice ${target?.invoiceNumber || ''} Tercatat`,
      subtext: `Status: ${paymentData.status} | Kas Masuk: Rp ${paymentData.amountPaid.toLocaleString('id-ID')}`,
    });
  };

  // --- EMPLOYEE, INCENTIVE & SALARY HANDLERS ---
  const handleSaveEmployee = (emp: Employee) => {
    pushHistory(`Simpan Data Karyawan ${emp.name}`);
    setEmployees((prev) => {
      const idx = prev.findIndex((e) => e.id === emp.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = emp;
        return next;
      }
      return [emp, ...prev];
    });
    setUndoToast({
      show: true,
      message: `Data Karyawan Tersimpan`,
      subtext: `${emp.name} (${emp.role})`,
    });
  };

  const handleDeleteEmployee = (id: string) => {
    const target = employees.find((e) => e.id === id);
    pushHistory(`Hapus Data Karyawan ${target?.name || ''}`);
    setEmployees((prev) => prev.filter((e) => e.id !== id));
  };

  const handleSaveIncentive = (inc: IncentiveRecord) => {
    pushHistory(`Simpan Dokumen Insentif ${inc.calculationNumber}`);
    setIncentives((prev) => {
      const idx = prev.findIndex((i) => i.id === inc.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = inc;
        return next;
      }
      return [inc, ...prev];
    });

    // If paid and postToExpense enabled, synchronize into OperationalExpense
    const isPaid = inc.status === 'Dibayar' || inc.paymentStatus === 'Dibayar';
    if (isPaid && inc.postToExpense !== false) {
      const expenseDesc = `Beban Insentif Pengiriman #${inc.calculationNumber} - ${inc.employeeName} (${inc.totalMatchedSalesCount} SJ, ${inc.totalVolume} m³) [${inc.startDate} s/d ${inc.endDate}]`;
      setExpenses((prev) => {
        const existingIdx = prev.findIndex((e) => e.notes === `REF_INCENTIVE_${inc.id}` || e.description === expenseDesc);
        const expenseItem: OperationalExpense = {
          id: existingIdx >= 0 ? prev[existingIdx].id : `exp-inc-${inc.id}`,
          date: inc.paymentDate || inc.date || getTodayDateString(),
          accountCode: '6-104',
          accountName: 'Beban Insentif Pengiriman Karyawan',
          transactionName: `Insentif Pengiriman - ${inc.employeeName}`,
          quantity: 1,
          unit: 'Trans',
          pricePerUnit: inc.totalIncentiveAmount,
          amount: inc.totalIncentiveAmount,
          totalAmount: inc.totalIncentiveAmount,
          category: 'Gaji & Insentif Karyawan',
          description: expenseDesc,
          paymentMethod: 'Kas & Bank',
          notes: `REF_INCENTIVE_${inc.id}`,
          createdAt: new Date().toISOString(),
        };
        if (existingIdx >= 0) {
          const updated = [...prev];
          updated[existingIdx] = expenseItem;
          return updated;
        }
        return [expenseItem, ...prev];
      });
    } else {
      // If no longer paid, clean up any linked expense
      setExpenses((prev) => prev.filter((e) => e.notes !== `REF_INCENTIVE_${inc.id}`));
    }

    setUndoToast({
      show: true,
      message: isPaid ? `Pembayaran Insentif #${inc.calculationNumber} Berhasil Tercatat` : `Dokumen Insentif Tersimpan`,
      subtext: `${inc.calculationNumber} - ${inc.employeeName} (${isPaid ? 'Lunas: ' : ''}Rp ${inc.totalIncentiveAmount.toLocaleString('id-ID')})`,
    });
  };

  const handleDeleteIncentive = (id: string) => {
    const target = incentives.find((i) => i.id === id);
    pushHistory(`Hapus Insentif ${target?.calculationNumber || ''}`);
    setIncentives((prev) => prev.filter((i) => i.id !== id));
    // Clean up linked expense if any
    setExpenses((prev) => prev.filter((e) => e.notes !== `REF_INCENTIVE_${id}`));
  };

  const handleSaveSalary = (sal: SalaryRecord) => {
    pushHistory(`Simpan Slip Gaji ${sal.slipNumber}`);
    setSalaries((prev) => {
      const idx = prev.findIndex((s) => s.id === sal.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = sal;
        return next;
      }
      return [sal, ...prev];
    });

    // If marked as post to expense, automatically sync into OperationalExpense
    if (sal.postToExpense) {
      const expenseDesc = `Beban Gaji & Insentif #${sal.slipNumber} - ${sal.employeeName} (${sal.periodMonth})`;
      setExpenses((prev) => {
        const existingIdx = prev.findIndex((e) => e.notes === `REF_SALARY_${sal.id}` || e.description === expenseDesc);
        const expenseItem: OperationalExpense = {
          id: existingIdx >= 0 ? prev[existingIdx].id : `exp-sal-${sal.id}`,
          date: sal.paymentDate || getTodayDateString(),
          accountCode: '6-103',
          accountName: 'Beban Gaji & Insentif Karyawan',
          transactionName: `Gaji & Insentif - ${sal.employeeName}`,
          quantity: 1,
          unit: 'Bln',
          pricePerUnit: sal.netSalary,
          amount: sal.netSalary,
          totalAmount: sal.netSalary,
          category: 'Gaji & Insentif Karyawan',
          description: expenseDesc,
          paymentMethod: 'Kas & Bank',
          notes: `REF_SALARY_${sal.id}`,
          createdAt: new Date().toISOString(),
        };
        if (existingIdx >= 0) {
          const updated = [...prev];
          updated[existingIdx] = expenseItem;
          return updated;
        }
        return [expenseItem, ...prev];
      });
    }

    setUndoToast({
      show: true,
      message: `Slip Gaji ${sal.slipNumber} Tersimpan`,
      subtext: `${sal.employeeName} (${sal.periodMonth}) | Take Home Pay: Rp ${sal.netSalary.toLocaleString('id-ID')}`,
    });
  };

  const handleDeleteSalary = (id: string) => {
    const target = salaries.find((s) => s.id === id);
    pushHistory(`Hapus Slip Gaji ${target?.slipNumber || ''}`);
    setSalaries((prev) => prev.filter((s) => s.id !== id));
    // Clean up linked expense if any
    setExpenses((prev) => prev.filter((e) => e.notes !== `REF_SALARY_${id}`));
  };

  const handleNavigateToSalaryWithIncentive = (incentive: IncentiveRecord) => {
    setPendingIncentiveForSalary(incentive);
    setCurrentTab('penggajian');
  };

  // --- BACKUP & RESTORE & WIPE ---
  const handleForceSaveAll = async () => {
    try {
      await forceSaveAll();
      const nowStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setUndoToast({
        show: true,
        message: 'Data Tersimpan ke Database Server & Cache',
        subtext: `Status: 100% Tersinkronisasi | Waktu: ${nowStr}`,
      });
    } catch (e) {
      console.error('Error saving data', e);
    }
  };

  const handleExportAllData = () => {
    const fullBackup = {
      version: '1.2.0-tax-hr',
      exportedAt: new Date().toISOString(),
      companyProfile,
      taxProfile,
      clients,
      materials,
      sales,
      purchases,
      expenses,
      taxInvoices,
      withholdingSlips,
      invoices,
      employees,
      incentives,
      salaries,
      customJournals,
      deletedJournalIds,
    };
    const jsonStr = JSON.stringify(fullBackup, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Backup_Keuangan_Pajak_Payroll_Material_${getTodayDateString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportAllData = (jsonData: string): boolean => {
    try {
      pushHistory(`Restore Database dari File JSON`);
      const data = JSON.parse(jsonData);
      if (data.companyProfile) setCompanyProfile(data.companyProfile);
      if (data.taxProfile) setTaxProfile(data.taxProfile);
      if (Array.isArray(data.clients)) setClients(data.clients);
      if (Array.isArray(data.materials)) setMaterials(data.materials);
      if (Array.isArray(data.sales)) setSales(data.sales);
      if (Array.isArray(data.purchases)) setPurchases(data.purchases);
      if (Array.isArray(data.expenses)) setExpenses(data.expenses);
      if (Array.isArray(data.taxInvoices)) setTaxInvoices(data.taxInvoices);
      if (Array.isArray(data.withholdingSlips)) setWithholdingSlips(data.withholdingSlips);
      if (Array.isArray(data.invoices)) setInvoices(data.invoices);
      if (Array.isArray(data.employees)) {
        setEmployees(
          data.employees.map((emp: any) => ({
            ...emp,
            baseSalary: Number(emp.baseSalary) || 0,
            allowances: {
              transport: Number(emp.allowances?.transport) || 0,
              meal: Number(emp.allowances?.meal) || 0,
              position: Number(emp.allowances?.position) || 0,
              attendance: Number(emp.allowances?.attendance) || 0,
            },
          }))
        );
      }
      if (Array.isArray(data.incentives)) setIncentives(data.incentives);
      if (Array.isArray(data.salaries)) setSalaries(data.salaries);
      if (Array.isArray(data.customJournals)) setCustomJournals(data.customJournals);
      if (Array.isArray(data.deletedJournalIds)) setDeletedJournalIds(data.deletedJournalIds);
      setTimeout(() => flushNow(), 100);
      return true;
    } catch {
      return false;
    }
  };

  const handleWipeData = async () => {
    pushHistory(`Kosongkan Seluruh Data`);
    setClients([]);
    setMaterials([]);
    setSales([]);
    setPurchases([]);
    setExpenses([]);
    setTaxInvoices([]);
    setWithholdingSlips([]);
    setInvoices([]);
    setEmployees([]);
    setIncentives([]);
    setSalaries([]);
    setCustomJournals([]);
    setDeletedJournalIds([]);
    await apiService.wipeDatabase();
  };

  const handleResetToDemoData = async () => {
    pushHistory(`Reset ke Data Demo Awal`);
    setCompanyProfile(INITIAL_COMPANY_PROFILE);
    setTaxProfile(INITIAL_TAX_PROFILE);
    setClients(INITIAL_CLIENTS_SUPPLIERS);
    setMaterials(INITIAL_MATERIALS);
    setSales(INITIAL_SALES);
    setPurchases(INITIAL_PURCHASES);
    setExpenses(INITIAL_EXPENSES);
    setTaxInvoices(INITIAL_TAX_INVOICES);
    setWithholdingSlips(INITIAL_WITHHOLDING_SLIPS);
    setInvoices(INITIAL_INVOICES);
    setEmployees(INITIAL_EMPLOYEES);
    setIncentives(INITIAL_INCENTIVES);
    setSalaries(INITIAL_SALARIES);
    setCustomJournals([]);
    setDeletedJournalIds([]);
    await apiService.resetDatabase();
  };

  return (
    <div
      id="app-root-container"
      className="flex flex-col lg:flex-row h-screen w-full bg-slate-100 font-sans text-xs text-slate-800 overflow-hidden print:h-auto print:overflow-visible print:bg-white"
    >
      {/* High Density Navigation Sidebar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        companyProfile={companyProfile}
        totalSalesCount={sales.length}
        totalPurchasesCount={purchases.length}
        totalIncentivesCount={incentives.length}
        totalSalariesCount={salaries.length}
        totalTaxInvoicesCount={taxInvoices.length}
        mobileMenuOpen={mobileMenuOpen}
        onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
        saveStatus={saveStatus}
        lastSavedTime={lastSavedTime}
        onForceSaveAll={handleForceSaveAll}
      />

      {/* Main High Density Workspace Area */}
      <div id="app-workspace" className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-slate-100 print:hidden">
        {/* Workspace Top Header Bar */}
        <header className="h-10 bg-white border-b border-slate-200 flex items-center justify-between px-3 sm:px-4 shrink-0 shadow-2xs z-10 print:hidden">
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-tight truncate">
              {currentTab === 'dashboard' && 'Executive Dashboard & Analisis Performa'}
              {currentTab === 'klien-supplier' && 'Data Klien & Supplier'}
              {currentTab === 'barang' && 'Master Daftar Barang'}
              {currentTab === 'penjualan' && 'Transaksi Penjualan Material'}
              {currentTab === 'pembelian' && 'Pembelian & Rekap Quarry'}
              {currentTab === 'invoice' && 'Rekap Invoice Proyek (PO)'}
              {currentTab === 'insentif' && 'Form & Perhitungan Insentif Penjualan Otomatis'}
              {currentTab === 'penggajian' && 'Form Gaji Karyawan & Cetak Slip Terintegrasi'}
              {currentTab === 'perpajakan' && 'Perpajakan Terintegrasi & e-Faktur DJP'}
              {currentTab === 'laporan-keuangan' && 'Laporan Keuangan & Akuntansi'}
              {currentTab === 'pengaturan' && 'Pengaturan Sistem & Database'}
            </span>
            <span className="hidden sm:inline-block px-1.5 py-0.5 text-[9px] font-semibold bg-slate-100 text-slate-500 rounded border border-slate-200">
              {companyProfile.name}
            </span>
          </div>

          <div className="flex items-center gap-2 text-[10px] text-slate-500">
            {/* Global Undo Button */}
            <button
              id="global-undo-btn"
              onClick={handleUndo}
              disabled={historyStack.length === 0}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-semibold border transition-all ${
                historyStack.length > 0
                  ? 'bg-amber-50 hover:bg-amber-100 text-amber-950 border-amber-300 shadow-2xs cursor-pointer active:scale-95'
                  : 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed opacity-50'
              }`}
              title={
                historyStack.length > 0
                  ? `Batalkan aksi: "${historyStack[0]?.description}" (Pintasan: Ctrl+Z)`
                  : 'Tidak ada riwayat untuk di-Undo (Ctrl+Z)'
              }
            >
              <Undo2 className={`w-3.5 h-3.5 ${historyStack.length > 0 ? 'text-amber-700' : 'text-slate-400'}`} />
              <span>Undo</span>
              {historyStack.length > 0 && (
                <span className="bg-amber-200 text-amber-900 font-bold px-1.5 py-0.2 rounded-full text-[9px]">
                  {historyStack.length}
                </span>
              )}
            </button>

            <div className="hidden md:flex items-center gap-2 border-l border-slate-200 pl-3">
              <span className="text-slate-400">Total Penjualan:</span>
              <span className="font-mono font-bold text-slate-700">{sales.length} DO</span>
            </div>
            <div className="hidden md:flex items-center gap-2 border-l border-slate-200 pl-3">
              <span className="text-slate-400">Total Pembelian:</span>
              <span className="font-mono font-bold text-slate-700">{purchases.length} DO</span>
            </div>
            <div className="flex items-center gap-1.5 border-l border-slate-200 pl-3">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="text-slate-600 font-medium">Pajak Aktif (PPN 11%)</span>
            </div>
          </div>
        </header>

        {/* Scrollable Content Workspace */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
          {currentTab === 'dashboard' && (
            <DashboardView
              sales={sales}
              purchases={purchases}
              expenses={expenses}
              materials={materials}
              clients={clients}
              companyProfile={companyProfile}
              filter={dateFilter}
              onFilterChange={setDateFilter}
              onNavigateToTab={setCurrentTab}
              onOpenPrintModal={openPrintModal}
            />
          )}

          {currentTab === 'klien-supplier' && (
            <ClientSupplierList
              items={clients}
              onAdd={handleAddClientSupplier}
              onUpdate={handleUpdateClientSupplier}
              onDelete={handleDeleteClientSupplier}
            />
          )}

          {currentTab === 'barang' && (
            <MaterialList
              materials={materials}
              onAdd={handleAddMaterial}
              onUpdate={handleUpdateMaterial}
              onDelete={handleDeleteMaterial}
            />
          )}

          {currentTab === 'penjualan' && (
            <SalesList
              sales={sales}
              materials={materials}
              clients={clients}
              companyProfile={companyProfile}
              filter={dateFilter}
              onFilterChange={setDateFilter}
              onAddSale={handleAddSale}
              onBulkAddSales={handleBulkAddSales}
              onUpdateSale={handleUpdateSale}
              onDeleteSale={handleDeleteSale}
              onBulkDeleteSales={handleBulkDeleteSales}
              onBulkUpdateSales={handleBulkUpdateSales}
              onOpenPrintModal={openPrintModal}
              onUndo={handleUndo}
              canUndo={historyStack.length > 0}
              lastActionDescription={historyStack[0]?.description}
            />
          )}

          {currentTab === 'pembelian' && (
            <PurchaseList
              purchases={purchases}
              materials={materials}
              suppliers={clients}
              companyProfile={companyProfile}
              filter={dateFilter}
              onFilterChange={setDateFilter}
              onAddPurchase={handleAddPurchase}
              onUpdatePurchase={handleUpdatePurchase}
              onDeletePurchase={handleDeletePurchase}
              onBulkDeletePurchases={handleBulkDeletePurchases}
              onBulkUpdatePurchases={handleBulkUpdatePurchases}
              onOpenPrintModal={openPrintModal}
              onUndo={handleUndo}
              canUndo={historyStack.length > 0}
              lastActionDescription={historyStack[0]?.description}
            />
          )}

          {currentTab === 'invoice' && (
            <InvoiceView
              sales={sales}
              clients={clients}
              companyProfile={companyProfile}
              taxProfile={taxProfile}
              invoices={invoices}
              onAddInvoice={handleAddInvoice}
              onUpdateInvoice={handleUpdateInvoice}
              onDeleteInvoice={handleDeleteInvoice}
              onRecordPayment={handleRecordInvoicePayment}
              filter={dateFilter}
              onFilterChange={setDateFilter}
              onOpenPrintModal={openPrintModal}
            />
          )}

          {currentTab === 'insentif' && (
            <IncentiveView
              sales={sales}
              materials={materials}
              employees={employees}
              incentives={incentives}
              companyProfile={companyProfile}
              filter={dateFilter}
              onFilterChange={setDateFilter}
              onSaveIncentive={handleSaveIncentive}
              onDeleteIncentive={handleDeleteIncentive}
              onNavigateToSalaryFormWithIncentive={handleNavigateToSalaryWithIncentive}
              onOpenPrintModal={openPrintModal}
            />
          )}

          {currentTab === 'penggajian' && (
            <SalaryView
              employees={employees}
              salaries={salaries}
              incentives={incentives}
              sales={sales}
              materials={materials}
              companyProfile={companyProfile}
              onSaveSalary={handleSaveSalary}
              onDeleteSalary={handleDeleteSalary}
              onSaveEmployee={handleSaveEmployee}
              onDeleteEmployee={handleDeleteEmployee}
              onNavigateToIncentiveCalculator={() => setCurrentTab('insentif')}
              initialIncentiveToLoad={pendingIncentiveForSalary}
              onClearInitialIncentive={() => setPendingIncentiveForSalary(null)}
            />
          )}

          {currentTab === 'perpajakan' && (
            <TaxManagementView
              sales={sales}
              purchases={purchases}
              taxInvoices={taxInvoices}
              withholdingSlips={withholdingSlips}
              taxProfile={taxProfile}
              companyProfile={companyProfile}
              filter={dateFilter}
              onFilterChange={setDateFilter}
              onAddTaxInvoice={handleAddTaxInvoice}
              onUpdateTaxInvoice={handleUpdateTaxInvoice}
              onDeleteTaxInvoice={handleDeleteTaxInvoice}
              onAddWithholdingSlip={handleAddWithholdingSlip}
              onDeleteWithholdingSlip={handleDeleteWithholdingSlip}
              onUpdateTaxProfile={setTaxProfile}
              onOpenPrintModal={openPrintModal}
            />
          )}

          {currentTab === 'laporan-keuangan' && (
            <FinancialReports
              sales={sales}
              purchases={purchases}
              expenses={expenses}
              taxInvoices={taxInvoices}
              withholdingSlips={withholdingSlips}
              customJournals={customJournals}
              deletedJournalIds={deletedJournalIds}
              invoices={invoices}
              companyProfile={companyProfile}
              filter={dateFilter}
              onFilterChange={setDateFilter}
              onAddExpense={handleAddExpense}
              onUpdateExpense={handleUpdateExpense}
              onDeleteExpense={handleDeleteExpense}
              onAddJournalEntry={handleAddJournalEntry}
              onUpdateJournalEntry={handleUpdateJournalEntry}
              onDeleteJournalEntry={handleDeleteJournalEntry}
              onOpenPrintModal={openPrintModal}
            />
          )}

          {currentTab === 'pengaturan' && (
            <SettingsView
              companyProfile={companyProfile}
              onUpdateCompanyProfile={setCompanyProfile}
              onExportAllData={handleExportAllData}
              onImportAllData={handleImportAllData}
              onWipeData={handleWipeData}
              onResetToDemoData={handleResetToDemoData}
              clientsCount={clients.length}
              materialsCount={materials.length}
              salesCount={sales.length}
              purchasesCount={purchases.length}
              expensesCount={expenses.length}
              taxInvoicesCount={taxInvoices.length}
              withholdingSlipsCount={withholdingSlips.length}
              invoicesCount={invoices.length}
              customJournalsCount={customJournals.length}
              employeesCount={employees.length}
              incentivesCount={incentives.length}
              salariesCount={salaries.length}
              lastSavedTime={lastSavedTime}
              onForceSaveAll={handleForceSaveAll}
              saveStatus={saveStatus}
            />
          )}
        </main>

        {/* High Density Bottom Status Bar */}
        <footer id="app-footer-bar" className="h-6 bg-slate-900 text-slate-400 flex items-center px-3 sm:px-4 justify-between shrink-0 text-[9px] border-t border-slate-800 select-none print:hidden">
          <div className="flex items-center gap-2 truncate">
            <span>&copy; {new Date().getFullYear()} {companyProfile.name}</span>
            <span className="text-slate-600">|</span>
            <span className="hidden sm:inline">Sistem ERP & Perpajakan Terintegrasi</span>
          </div>
          <div className="flex items-center gap-2.5 text-slate-400 shrink-0">
            <span className="flex items-center gap-1.5 font-semibold">
              {saveStatus === 'saving' && (
                <span className="flex items-center gap-1 text-blue-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping"></span>
                  Database: Menyimpan...
                </span>
              )}
              {saveStatus === 'pending' && (
                <span className="flex items-center gap-1 text-amber-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                  Auto-Save: Menunggu Jeda...
                </span>
              )}
              {saveStatus === 'synced' && (
                <span className="flex items-center gap-1 text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  Database & Cache: Tersinkron ({lastSavedTime})
                </span>
              )}
              {saveStatus === 'offline' && (
                <span className="flex items-center gap-1 text-slate-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                  Cache Lokal: Offline
                </span>
              )}
              {saveStatus === 'error' && (
                <span className="flex items-center gap-1 text-rose-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                  Fallback Cache
                </span>
              )}
            </span>
            <span className="text-slate-600">|</span>
            <span className="hidden sm:inline">Pintasan Undo: <kbd className="px-1 py-0.2 bg-slate-800 text-slate-300 rounded font-mono text-[8px] border border-slate-700">Ctrl+Z</kbd></span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-300 font-mono">v1.2-TAX</span>
          </div>
        </footer>
      </div>

      {/* Floating Undo Toast Notification */}
      {undoToast.show && (
        <div
          id="undo-toast-notification"
          className="fixed bottom-8 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-lg shadow-2xl border border-slate-700 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3 duration-200 max-w-md"
        >
          <div className="w-6 h-6 rounded-full bg-emerald-600/30 text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="flex-1 text-xs min-w-0">
            <p className="font-bold text-slate-100 truncate">{undoToast.message}</p>
            {undoToast.subtext && <p className="text-[10px] text-slate-400 mt-0.5">{undoToast.subtext}</p>}
          </div>
          {historyStack.length > 0 && (
            <button
              onClick={() => {
                handleUndo();
                setUndoToast((prev) => ({ ...prev, show: false }));
              }}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-2.5 py-1 rounded text-xs shrink-0 flex items-center gap-1 transition shadow-xs"
              title="Undo aksi ini (Ctrl+Z)"
            >
              <Undo2 className="w-3.5 h-3.5" />
              <span>Undo</span>
            </button>
          )}
          <button
            onClick={() => setUndoToast((prev) => ({ ...prev, show: false }))}
            className="text-slate-400 hover:text-white p-1 rounded"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Global Printable PDF Modal */}
      <PrintModal
        isOpen={printModal.isOpen}
        onClose={closePrintModal}
        title={printModal.title}
      >
        {printModal.content}
      </PrintModal>
    </div>
  );
}
