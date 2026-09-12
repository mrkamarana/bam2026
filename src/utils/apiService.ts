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

export const apiService = {
  /**
   * Fetch all app data from the backend database
   */
  async getDatabaseData(): Promise<any> {
    const res = await fetch('/api/data', {
      headers: {
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error(`Server returned status ${res.status}: ${res.statusText}`);
    }

    const json: SyncResponse = await res.json();
    if (!json.success || !json.data) {
      throw new Error(json.error || 'Data database kosong atau tidak valid');
    }

    return json.data;
  },

  /**
   * Save data payload to backend database
   */
  async saveDatabaseData(
    dataPayload: Record<string, any>,
    options?: { keepalive?: boolean }
  ): Promise<SyncResponse> {
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
      throw new Error(`Gagal menyimpan ke server: status ${res.status}`);
    }

    return await res.json();
  },

  /**
   * Guaranteed exit save using keepalive fetch or sendBeacon
   */
  saveOnExit(dataPayload: Record<string, any>): void {
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
    const res = await fetch('/api/data/reset', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error(`Gagal mereset database: ${res.statusText}`);
    }

    const json = await res.json();
    return json.data;
  },

  /**
   * Wipe transactional records from database
   */
  async wipeDatabase(): Promise<any> {
    const res = await fetch('/api/data/wipe', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error(`Gagal mengosongkan transaksi: ${res.statusText}`);
    }

    const json = await res.json();
    return json.data;
  },
};
