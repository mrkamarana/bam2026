import { DateFilterState } from '../types';

/**
 * Utility formatters for Indonesian Construction Accounting
 */

export function formatRupiah(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(num: number | undefined | null, decimals = 2): string {
  if (num === undefined || num === null || isNaN(num)) return '0';
  // If whole number, no decimals
  if (Number.isInteger(num)) {
    return new Intl.NumberFormat('id-ID').format(num);
  }
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(num);
}

/**
 * Normalizes any date string (YYYY-MM-DD, DD/MM/YYYY, DD-MM-YYYY, ISO date, etc.) to standard YYYY-MM-DD
 */
export function normalizeDateToYMD(dateStr: string | undefined | null): string {
  if (!dateStr) return '';
  const s = String(dateStr).trim();

  // 1. Check YYYY-MM-DD or YYYY/MM/DD
  const ymdMatch = s.match(/^(\d{4})[-/. ](\d{1,2})[-/. ](\d{1,2})/);
  if (ymdMatch) {
    const y = ymdMatch[1];
    const m = String(parseInt(ymdMatch[2], 10)).padStart(2, '0');
    const d = String(parseInt(ymdMatch[3], 10)).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // 2. Check DD-MM-YYYY or DD/MM/YYYY
  const dmyMatch = s.match(/^(\d{1,2})[-/. ](\d{1,2})[-/. ](\d{4})/);
  if (dmyMatch) {
    const d = String(parseInt(dmyMatch[1], 10)).padStart(2, '0');
    const m = String(parseInt(dmyMatch[2], 10)).padStart(2, '0');
    const y = dmyMatch[3];
    return `${y}-${m}-${d}`;
  }

  // 3. Fallback standard Date parsing
  try {
    const d = new Date(s);
    if (!isNaN(d.getTime())) {
      const year = d.getFullYear();
      if (year >= 1970 && year <= 2100) {
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
    }
  } catch {
    // Ignore
  }

  return s;
}

/**
 * Checks if a transaction date matches the DateFilterState
 */
export function matchDateFilter(
  dateStr: string | undefined | null,
  filter: DateFilterState | undefined | null
): boolean {
  if (!filter || !filter.mode || filter.mode === 'semua') return true;

  const normDate = normalizeDateToYMD(dateStr);
  if (!normDate) return false;

  if (filter.mode === 'harian') {
    if (!filter.date) return true;
    const targetDate = normalizeDateToYMD(filter.date);
    return normDate === targetDate;
  }

  if (filter.mode === 'bulanan') {
    if (!filter.month) return true;
    // filter.month format is YYYY-MM
    return normDate.startsWith(filter.month);
  }

  if (filter.mode === 'periode') {
    const start = filter.startDate ? normalizeDateToYMD(filter.startDate) : '';
    const end = filter.endDate ? normalizeDateToYMD(filter.endDate) : '';

    if (start && end) {
      const actualStart = start <= end ? start : end;
      const actualEnd = start <= end ? end : start;
      return normDate >= actualStart && normDate <= actualEnd;
    } else if (start) {
      return normDate >= start;
    } else if (end) {
      return normDate <= end;
    }
    return true;
  }

  return true;
}

/**
 * Safe comparator to sort dates descending (newest to oldest)
 */
export function compareDateDescending(
  dateA: string | undefined | null,
  dateB: string | undefined | null
): number {
  const normA = normalizeDateToYMD(dateA);
  const normB = normalizeDateToYMD(dateB);
  return normB.localeCompare(normA);
}

/**
 * Safe comparator to sort dates ascending (oldest to newest)
 */
export function compareDateAscending(
  dateA: string | undefined | null,
  dateB: string | undefined | null
): number {
  const normA = normalizeDateToYMD(dateA);
  const normB = normalizeDateToYMD(dateB);
  return normA.localeCompare(normB);
}

export function formatDateIndo(dateStr: string | undefined | null): string {
  if (!dateStr) return '-';
  try {
    const norm = normalizeDateToYMD(dateStr);
    const parts = norm.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const date = new Date(year, month, day);
      return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(date);
    }
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(d);
  } catch {
    return dateStr;
  }
}

export function formatShortDate(dateStr: string | undefined | null): string {
  if (!dateStr) return '-';
  try {
    const norm = normalizeDateToYMD(dateStr);
    const parts = norm.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  } catch {
    return dateStr;
  }
}

export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getCurrentMonthString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Terbilang function in Indonesian for Invoices and Receipts
 */
export function terbilang(n: number): string {
  if (isNaN(n) || n === 0) return 'Nol Rupiah';
  const angka = Math.floor(Math.abs(n));

  const bilangan = [
    '',
    'Satu',
    'Dua',
    'Tiga',
    'Empat',
    'Lima',
    'Enam',
    'Tujuh',
    'Delapan',
    'Sembilan',
    'Sepuluh',
    'Sebelas',
  ];

  function konversi(num: number): string {
    if (num < 12) {
      return bilangan[num];
    } else if (num < 20) {
      return konversi(num - 10) + ' Belas';
    } else if (num < 100) {
      return konversi(Math.floor(num / 10)) + ' Puluh ' + konversi(num % 10);
    } else if (num < 200) {
      return 'Seratus ' + konversi(num - 100);
    } else if (num < 1000) {
      return konversi(Math.floor(num / 100)) + ' Ratus ' + konversi(num % 100);
    } else if (num < 2000) {
      return 'Seribu ' + konversi(num - 1000);
    } else if (num < 1000000) {
      return konversi(Math.floor(num / 1000)) + ' Ribu ' + konversi(num % 1000);
    } else if (num < 1000000000) {
      return konversi(Math.floor(num / 1000000)) + ' Juta ' + konversi(num % 1000000);
    } else if (num < 1000000000000) {
      return konversi(Math.floor(num / 1000000000)) + ' Milyar ' + konversi(num % 1000000000);
    } else {
      return konversi(Math.floor(num / 1000000000000)) + ' Triliun ' + konversi(num % 1000000000000);
    }
  }

  const result = konversi(angka).replace(/\s+/g, ' ').trim();
  return result ? `${result} Rupiah` : 'Nol Rupiah';
}
