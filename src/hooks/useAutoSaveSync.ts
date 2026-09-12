import { useState, useEffect, useRef, useCallback } from 'react';
import { apiService } from '../utils/apiService';

export type SaveStatus = 'synced' | 'saving' | 'pending' | 'offline' | 'error';

interface AutoSaveStatePayload {
  clients: any[];
  materials: any[];
  sales: any[];
  purchases: any[];
  expenses: any[];
  companyProfile: any;
  taxProfile: any;
  taxInvoices: any[];
  withholdingSlips: any[];
  invoices: any[];
  employees: any[];
  incentives: any[];
  salaries: any[];
  customJournals: any[];
  deletedJournalIds: string[];
}

interface UseAutoSaveSyncOptions {
  debounceMs?: number;
  storageKeys: Record<string, string>;
  onServerLoaded?: (data: Partial<AutoSaveStatePayload>) => void;
}

export function useAutoSaveSync(
  currentData: AutoSaveStatePayload,
  options: UseAutoSaveSyncOptions
) {
  const { debounceMs = 700, storageKeys, onServerLoaded } = options;

  const [saveStatus, setSaveStatus] = useState<SaveStatus>('synced');
  const [lastSavedTime, setLastSavedTime] = useState<string>(() =>
    new Date().toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Keep latest data in a ref to safely access in timers and unload handlers
  const latestDataRef = useRef<AutoSaveStatePayload>(currentData);
  latestDataRef.current = currentData;

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isPendingSaveRef = useRef<boolean>(false);
  const isInitialMountRef = useRef<boolean>(true);
  const hasLoadedFromServerRef = useRef<boolean>(false);

  // Helper to save to local storage cache immediately
  const saveToLocalCache = useCallback((data: AutoSaveStatePayload) => {
    try {
      localStorage.setItem(storageKeys.CLIENTS, JSON.stringify(data.clients));
      localStorage.setItem(storageKeys.MATERIALS, JSON.stringify(data.materials));
      localStorage.setItem(storageKeys.SALES, JSON.stringify(data.sales));
      localStorage.setItem(storageKeys.PURCHASES, JSON.stringify(data.purchases));
      localStorage.setItem(storageKeys.EXPENSES, JSON.stringify(data.expenses));
      localStorage.setItem(storageKeys.PROFILE, JSON.stringify(data.companyProfile));
      localStorage.setItem(storageKeys.TAX_PROFILE, JSON.stringify(data.taxProfile));
      localStorage.setItem(storageKeys.TAX_INVOICES, JSON.stringify(data.taxInvoices));
      localStorage.setItem(storageKeys.WITHHOLDING_SLIPS, JSON.stringify(data.withholdingSlips));
      localStorage.setItem(storageKeys.INVOICES, JSON.stringify(data.invoices));
      localStorage.setItem(storageKeys.EMPLOYEES, JSON.stringify(data.employees));
      localStorage.setItem(storageKeys.INCENTIVES, JSON.stringify(data.incentives));
      localStorage.setItem(storageKeys.SALARIES, JSON.stringify(data.salaries));
      localStorage.setItem(storageKeys.CUSTOM_JOURNALS, JSON.stringify(data.customJournals));
      localStorage.setItem(storageKeys.DELETED_JOURNALS, JSON.stringify(data.deletedJournalIds));
    } catch (e) {
      console.warn('LocalStorage cache write error:', e);
    }
  }, [storageKeys]);

  // Execute immediate backend save
  const executeSaveToBackend = useCallback(async (dataToSave: AutoSaveStatePayload, options?: { keepalive?: boolean }) => {
    try {
      setSaveStatus('saving');
      setErrorMessage(null);

      // Always update local cache alongside backend
      saveToLocalCache(dataToSave);

      const res = await apiService.saveDatabaseData(dataToSave, options);

      if (res.success) {
        const timeNow = new Date().toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        });
        setLastSavedTime(timeNow);
        setSaveStatus('synced');
        isPendingSaveRef.current = false;
      } else {
        setSaveStatus('error');
        setErrorMessage(res.error || 'Gagal menyimpan');
      }
    } catch (err: any) {
      console.warn('Backend save encountered error, saved to local cache:', err);
      setSaveStatus('offline');
      setErrorMessage(err?.message || 'Koneksi database offline (tersimpan di cache lokal)');
      // Data is still safely preserved in localStorage cache
    }
  }, [saveToLocalCache]);

  // Flush pending changes immediately (e.g. on modal close, navigation, blur)
  const flushNow = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    if (isPendingSaveRef.current) {
      executeSaveToBackend(latestDataRef.current);
    }
  }, [executeSaveToBackend]);

  // Load from backend on initial mount
  useEffect(() => {
    let isSubscribed = true;

    async function loadInitialDatabase() {
      try {
        const serverData = await apiService.getDatabaseData();
        if (isSubscribed && serverData && typeof serverData === 'object') {
          hasLoadedFromServerRef.current = true;
          // Synchronize local cache with server data
          saveToLocalCache({
            clients: serverData.clients || currentData.clients,
            materials: serverData.materials || currentData.materials,
            sales: serverData.sales || currentData.sales,
            purchases: serverData.purchases || currentData.purchases,
            expenses: serverData.expenses || currentData.expenses,
            companyProfile: serverData.companyProfile || currentData.companyProfile,
            taxProfile: serverData.taxProfile || currentData.taxProfile,
            taxInvoices: serverData.taxInvoices || currentData.taxInvoices,
            withholdingSlips: serverData.withholdingSlips || currentData.withholdingSlips,
            invoices: serverData.invoices || currentData.invoices,
            employees: serverData.employees || currentData.employees,
            incentives: serverData.incentives || currentData.incentives,
            salaries: serverData.salaries || currentData.salaries,
            customJournals: serverData.customJournals || currentData.customJournals,
            deletedJournalIds: serverData.deletedJournalIds || currentData.deletedJournalIds,
          });

          if (onServerLoaded) {
            onServerLoaded(serverData);
          }
          setSaveStatus('synced');
          if (serverData.updatedAt) {
            const d = new Date(serverData.updatedAt);
            if (!isNaN(d.getTime())) {
              setLastSavedTime(d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
            }
          }
        }
      } catch (err) {
        console.warn('Backend database not reachable initially, using local cache:', err);
        setSaveStatus('offline');
      }
    }

    loadInitialDatabase();

    return () => {
      isSubscribed = false;
    };
  }, []); // Run once on mount

  // Watch data changes and apply DEBOUNCE
  useEffect(() => {
    // Skip debounce on the very first mount render to avoid redundant initial save
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      return;
    }

    // Mark pending save
    isPendingSaveRef.current = true;
    setSaveStatus('pending');

    // Also immediately update local storage cache so no data is lost on unexpected tab kill
    saveToLocalCache(currentData);

    // Clear previous debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Schedule debounced backend save
    debounceTimerRef.current = setTimeout(() => {
      debounceTimerRef.current = null;
      executeSaveToBackend(latestDataRef.current);
    }, debounceMs);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [currentData, debounceMs, executeSaveToBackend, saveToLocalCache]);

  // Window exit / tab close / visibility change handler (guarantees last changed data is saved)
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isPendingSaveRef.current) {
        // Save to local cache synchronously
        saveToLocalCache(latestDataRef.current);
        // Dispatch keepalive fetch or sendBeacon to backend
        apiService.saveOnExit(latestDataRef.current);
      }
    };

    const handlePageHide = () => {
      if (isPendingSaveRef.current) {
        saveToLocalCache(latestDataRef.current);
        apiService.saveOnExit(latestDataRef.current);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && isPendingSaveRef.current) {
        // When tab is hidden or user switches away, flush immediately
        flushNow();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handlePageHide);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handlePageHide);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [flushNow, saveToLocalCache]);

  return {
    saveStatus,
    lastSavedTime,
    errorMessage,
    flushNow,
    forceSaveAll: () => executeSaveToBackend(latestDataRef.current),
  };
}
