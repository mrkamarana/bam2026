/**
 * API Service for PT Berkah Alam Mulia
 * Manages backend communication for database persistence, auto-saving, and offline fallbacks.
 */

export interface SyncResponse {
  success: boolean;
  message?: string;
  data?: any;
  lastSaved?: string;
  error?: string;
}

// Check if running on static hosting environments like GitHub Pages
const isStaticHost =
  typeof window !== 'undefined' &&
  (window.location.hostname.endsWith('github.io') ||
    window.location.hostname.endsWith('surge.sh') ||
    window.location.hostname.endsWith('gitlab.io') ||
    window.location.hostname.endsWith('web.app') ||
    window.location.protocol === 'file:');

let backendAvailable = !isStaticHost;

export const apiService = {
  isStaticMode(): boolean {
    return !backendAvailable;
  },

  /**
   * Fetch all app data from the backend database
   */
  async getDatabaseData(): Promise<any> {
    if (!backendAvailable) {
      return null;
    }

    try {
      const res = await fetch('/api/data', {
        headers: {
          Accept: 'application/json',
        },
      });

      if (!res.ok) {
        if (res.status === 404 || res.status === 502) {
          backendAvailable = false;
        }
        throw new Error(`Server returned status ${res.status}: ${res.statusText}`);
      }

      const json: SyncResponse = await res.json();
      if (!json.success || !json.data) {
        throw new Error(json.error || 'Data database kosong atau tidak valid');
      }

      return json.data;
    } catch (e) {
      backendAvailable = false;
      throw e;
    }
  },

  /**
   * Save data payload to backend database
   */
  async saveDatabaseData(
    dataPayload: Record<string, any>,
    options?: { keepalive?: boolean }
  ): Promise<SyncResponse> {
    if (!backendAvailable) {
      return {
        success: true,
        message: 'Tersimpan otomatis ke penyimpanan lokal browser (Mode Statis / GitHub Pages)',
        lastSaved: new Date().toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
      };
    }

    try {
      const res = await fetch('/api/data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ data: dataPayload }),
        keepalive: options?.keepalive ?? false,
      });

      if (!res.ok) {
        if (res.status === 404 || res.status === 502) {
          backendAvailable = false;
        }
        throw new Error(`Gagal menyimpan ke server: status ${res.status}`);
      }

      return await res.json();
    } catch (e) {
      backendAvailable = false;
      throw e;
    }
  },

  /**
   * Guaranteed exit save using keepalive fetch or sendBeacon
   */
  saveOnExit(dataPayload: Record<string, any>): void {
    if (!backendAvailable) {
      return;
    }

    try {
      const payloadString = JSON.stringify({ data: dataPayload });

      // Prefer modern fetch with keepalive: true (supports JSON body and headers)
      if (typeof fetch === 'function') {
        fetch('/api/data', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: payloadString,
          keepalive: true,
        }).catch((err) => console.warn('Exit fetch keepalive warning:', err));
        return;
      }

      // Fallback to navigator.sendBeacon
      if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
        const blob = new Blob([payloadString], { type: 'application/json' });
        navigator.sendBeacon('/api/data/beacon', blob);
      }
    } catch (e) {
      console.error('Error during exit save:', e);
    }
  },

  /**
   * Reset backend database to default demo data
   */
  async resetDatabase(): Promise<any> {
    if (!backendAvailable) {
      return null;
    }

    try {
      const res = await fetch('/api/data/reset', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
        },
      });

      if (!res.ok) {
        return null;
      }

      const json = await res.json();
      return json.data;
    } catch {
      return null;
    }
  },

  /**
   * Wipe transactional records from database
   */
  async wipeDatabase(): Promise<any> {
    if (!backendAvailable) {
      return null;
    }

    try {
      const res = await fetch('/api/data/wipe', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
        },
      });

      if (!res.ok) {
        return null;
      }

      const json = await res.json();
      return json.data;
    } catch {
      return null;
    }
  },
};
