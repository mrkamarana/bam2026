import * as XLSX from 'xlsx';
import { ClientSupplier, MaterialItem, MaterialUnit, SaleTransaction } from '../types';

export interface ExcelImportResult {
  success: boolean;
  importedSales: Partial<SaleTransaction>[];
  errors: string[];
  warnings: string[];
  totalRows: number;
}

// Download formatted sample template for user
export function downloadSalesExcelTemplate() {
  const templateData = [
    {
      'Tanggal': '2026-08-16',
      'No PO': 'PO-WIKA-2026/08/099',
      'No Surat Jalan': 'SJ-20260816-008',
      'Nama Klien': 'PT Wijaya Karya (Persero) Tbk',
      'Nama Barang': 'Pasir Cor Merapi (Super Bebas Lumpur)',
      'Asal Quarry': 'Quarry Merapi Muntilan',
      'Volume': 24,
      'Satuan': 'm3',
      'Tujuan Pengiriman': 'Proyek Jalan Tol JORR 2 Seksi 4',
      'Harga Jual Satuan': 275000,
      'Status Pembayaran': 'Lunas',
      'No Polisi': 'B 9182 UY',
      'Nama Sopir': 'Suparman',
      'Catatan': 'Dump truck 24 m3',
    },
    {
      'Tanggal': '2026-08-16',
      'No PO': 'PO-ADHI-2026/08/045',
      'No Surat Jalan': 'SJ-20260816-009',
      'Nama Klien': 'PT Adhi Karya Batching Plant Cikarang',
      'Nama Barang': 'Batu Split 1-2 (Andesit Crusher)',
      'Asal Quarry': 'Quarry Rumpin Bogor',
      'Volume': 25,
      'Satuan': 'm3',
      'Tujuan Pengiriman': 'Batching Plant GIIC Cikarang',
      'Harga Jual Satuan': 300000,
      'Status Pembayaran': 'Belum Lunas',
      'No Polisi': 'B 9301 TYA',
      'Nama Sopir': 'Ahmad Fauzi',
      'Catatan': 'Spesifikasi lolos lab',
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(templateData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Template_Penjualan');

  // Auto column widths
  const maxProps = Object.keys(templateData[0]);
  worksheet['!cols'] = maxProps.map((key) => ({ wch: Math.max(key.length + 4, 18) }));

  XLSX.writeFile(workbook, 'Template_Input_Penjualan_Material.xlsx');
}

// Indonesian & Flexible Number Parser
function parseNumberSmart(val: any, defaultValue: number = 0): number {
  if (val === undefined || val === null || val === '') return defaultValue;
  if (typeof val === 'number') return isNaN(val) ? defaultValue : val;

  let s = String(val).trim();
  // Remove "Rp", "IDR", "m3", "Ton", etc.
  s = s.replace(/^(Rp\.?|IDR)\s*/i, '').trim();
  s = s.replace(/\s*(m3|ton|m\^3|rit|kubik)$/i, '').trim();

  // If contains both '.' and ','
  if (s.includes('.') && s.includes(',')) {
    if (s.lastIndexOf(',') > s.lastIndexOf('.')) {
      // Indonesian format: 1.250.000,50
      s = s.replace(/\./g, '').replace(',', '.');
    } else {
      // US format: 1,250,000.50
      s = s.replace(/,/g, '');
    }
  } else if (s.includes('.')) {
    const parts = s.split('.');
    if (parts.length > 2) {
      // e.g. 1.250.000 -> 1250000
      s = s.replace(/\./g, '');
    } else if (parts.length === 2 && parts[1].length === 3 && parseInt(parts[0], 10) >= 1) {
      // Thousand separator with single dot: 275.000 -> 275000
      s = s.replace(/\./g, '');
    }
  } else if (s.includes(',')) {
    const parts = s.split(',');
    if (parts.length > 2) {
      s = s.replace(/,/g, '');
    } else if (parts.length === 2 && parts[1].length === 3 && parseInt(parts[0], 10) >= 1) {
      // e.g. 275,000 -> 275000
      s = s.replace(/,/g, '');
    } else {
      // Decimal comma: 24,5 -> 24.5
      s = s.replace(',', '.');
    }
  }

  // Clean any remaining non-digit characters except dot and minus
  s = s.replace(/[^\d.-]/g, '');
  const num = parseFloat(s);
  return isNaN(num) ? defaultValue : num;
}

// Convert Excel dates, serials, formatted text, and strings to YYYY-MM-DD accurately without timezone shift
function parseDateSmart(rawVal: any, formattedVal?: any): string {
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  // 1. If raw value is an Excel numeric date serial (e.g. 45500 ~ 46500)
  if (typeof rawVal === 'number' && rawVal > 25000 && rawVal < 80000) {
    if (XLSX.SSF && XLSX.SSF.parse_date_code) {
      const parsed = XLSX.SSF.parse_date_code(rawVal);
      if (parsed && parsed.y && parsed.m && parsed.d) {
        return `${parsed.y}-${String(parsed.m).padStart(2, '0')}-${String(parsed.d).padStart(2, '0')}`;
      }
    }
    const wholeDays = Math.floor(rawVal);
    const dateObj = new Date(1899, 11, 30 + wholeDays);
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // 2. If Date object (use local getters, NOT toISOString which has UTC shift)
  if (rawVal instanceof Date && !isNaN(rawVal.getTime())) {
    const y = rawVal.getFullYear();
    const m = String(rawVal.getMonth() + 1).padStart(2, '0');
    const d = String(rawVal.getDate()).padStart(2, '0');
    if (y >= 1970 && y <= 2100) {
      return `${y}-${m}-${d}`;
    }
  }

  // 3. If formatted string or text value
  const valToCheck = formattedVal !== undefined && formattedVal !== null && String(formattedVal).trim() !== ''
    ? formattedVal
    : rawVal;

  if (valToCheck === undefined || valToCheck === null || valToCheck === '') {
    return todayStr;
  }

  // 4. String parsing
  if (typeof valToCheck === 'string') {
    const s = valToCheck.trim();

    // Match YYYY-MM-DD or YYYY/MM/DD or YYYY.MM.DD
    const ymdMatch = s.match(/^(\d{4})[-/. ](\d{1,2})[-/. ](\d{1,2})/);
    if (ymdMatch) {
      const y = ymdMatch[1];
      const m = String(parseInt(ymdMatch[2], 10)).padStart(2, '0');
      const d = String(parseInt(ymdMatch[3], 10)).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }

    // Match DD-MM-YYYY or DD/MM/YYYY or DD.MM.YYYY (Indonesian standard)
    const dmyMatch = s.match(/^(\d{1,2})[-/. ](\d{1,2})[-/. ](\d{4})/);
    if (dmyMatch) {
      const d = String(parseInt(dmyMatch[1], 10)).padStart(2, '0');
      const m = String(parseInt(dmyMatch[2], 10)).padStart(2, '0');
      const y = dmyMatch[3];
      return `${y}-${m}-${d}`;
    }

    // Match Indonesian month names e.g. "16 Agustus 2026", "16-Agu-2026", "16 Aug 2026"
    const monthMap: { [key: string]: string } = {
      jan: '01', januari: '01', january: '01',
      feb: '02', februari: '02', february: '02',
      mar: '03', maret: '03', march: '03',
      apr: '04', april: '04',
      mei: '05', may: '05',
      jun: '06', juni: '06', june: '06',
      jul: '07', juli: '07', july: '07',
      agu: '08', ags: '08', agustus: '08', aug: '08', august: '08',
      sep: '09', september: '09',
      okt: '10', oktober: '10', oct: '10', october: '10',
      nov: '11', november: '11',
      des: '12', desember: '12', dec: '12', december: '12',
    };

    const textMatch = s.match(/^(\d{1,2})[\s\-_/]+([a-zA-Z]+)[\s\-_/]+(\d{2,4})/);
    if (textMatch) {
      const d = String(parseInt(textMatch[1], 10)).padStart(2, '0');
      const monStr = textMatch[2].toLowerCase();
      let m = '01';
      for (const [key, valM] of Object.entries(monthMap)) {
        if (monStr.startsWith(key)) {
          m = valM;
          break;
        }
      }
      let y = textMatch[3];
      if (y.length === 2) {
        y = `20${y}`;
      }
      return `${y}-${m}-${d}`;
    }

    // Match 2-digit year e.g. 16/08/26
    const shortDmyMatch = s.match(/^(\d{1,2})[-/. ](\d{1,2})[-/. ](\d{2})$/);
    if (shortDmyMatch) {
      const d = String(parseInt(shortDmyMatch[1], 10)).padStart(2, '0');
      const m = String(parseInt(shortDmyMatch[2], 10)).padStart(2, '0');
      const y = `20${shortDmyMatch[3]}`;
      return `${y}-${m}-${d}`;
    }
  }

  // 5. If number in string or other format
  const numVal = typeof valToCheck === 'number' ? valToCheck : parseFloat(String(valToCheck));
  if (!isNaN(numVal) && numVal > 25000 && numVal < 80000) {
    if (XLSX.SSF && XLSX.SSF.parse_date_code) {
      const parsed = XLSX.SSF.parse_date_code(numVal);
      if (parsed && parsed.y && parsed.m && parsed.d) {
        return `${parsed.y}-${String(parsed.m).padStart(2, '0')}-${String(parsed.d).padStart(2, '0')}`;
      }
    }
    const wholeDays = Math.floor(numVal);
    const dateObj = new Date(1899, 11, 30 + wholeDays);
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  return todayStr;
}

// Helper to normalize header key for fuzzy matching
function normalizeKey(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function parseSalesExcelFile(
  fileData: ArrayBuffer,
  availableMaterials: MaterialItem[] = [],
  availableClients: ClientSupplier[] = []
): ExcelImportResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const importedSales: Partial<SaleTransaction>[] = [];

  try {
    // Read with cellDates: false to get exact raw values & formatted strings without timezone shifting
    const workbook = XLSX.read(fileData, { type: 'array', cellDates: false });
    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      return {
        success: false,
        importedSales: [],
        errors: ['File Excel tidak memiliki lembar kerja (worksheet).'],
        warnings: [],
        totalRows: 0,
      };
    }

    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];

    // Read both formatted text (raw: false) and raw values (raw: true)
    const formattedRows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false, dateNF: 'yyyy-mm-dd', defval: '' });
    const rawRows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: true, defval: '' });

    if (!formattedRows || formattedRows.length === 0) {
      return {
        success: false,
        importedSales: [],
        errors: ['File Excel kosong atau tidak memiliki data.'],
        warnings: [],
        totalRows: 0,
      };
    }

    // Find the header row by looking for key identifiers
    let headerRowIdx = 0;
    const headerKeywords = ['tanggal', 'po', 'suratjalan', 'sj', 'klien', 'barang', 'material', 'volume', 'qty', 'harga', 'quarry'];

    for (let r = 0; r < Math.min(formattedRows.length, 10); r++) {
      const row = formattedRows[r];
      if (Array.isArray(row)) {
        const matches = row.filter((cell) => {
          const norm = normalizeKey(String(cell));
          return headerKeywords.some((kw) => norm.includes(kw));
        });
        if (matches.length >= 2) {
          headerRowIdx = r;
          break;
        }
      }
    }

    const rawHeaders: string[] = (formattedRows[headerRowIdx] || []).map((h: any) => String(h || '').trim());
    const dataFormattedRows = formattedRows.slice(headerRowIdx + 1);
    const dataRawRows = rawRows.slice(headerRowIdx + 1);

    if (dataFormattedRows.length === 0) {
      return {
        success: false,
        importedSales: [],
        errors: ['Tidak ditemukan baris data di bawah baris judul kolom Excel.'],
        warnings: [],
        totalRows: 0,
      };
    }

    // Map each normalized header to its column index
    const colMap: { [key: string]: number } = {};
    rawHeaders.forEach((h, idx) => {
      const norm = normalizeKey(h);
      if (norm) {
        colMap[norm] = idx;
      }
    });

    // Helper to find column index matching multiple alias patterns
    const findColIdx = (...aliases: string[]): number => {
      for (const alias of aliases) {
        const normAlias = normalizeKey(alias);
        // Direct match
        if (colMap[normAlias] !== undefined) return colMap[normAlias];
        // Partial match
        for (const [key, idx] of Object.entries(colMap)) {
          if (key.includes(normAlias) || normAlias.includes(key)) {
            return idx;
          }
        }
      }
      return -1;
    };

    const dateCol = findColIdx('tanggal', 'tgl', 'date', 'tglkirim', 'waktu');
    const poCol = findColIdx('purchaseorder', 'po', 'ponumber', 'nopo', 'nomorpo', 'refpo', 'referensipo');
    const sjCol = findColIdx('nosuratjalan', 'suratjalan', 'nosj', 'sj', 'deliverynote', 'noresi', 'nomorsuratjalan');
    const clientCol = findColIdx('namaklien', 'klien', 'customer', 'pelanggan', 'pembeli', 'namapembeli', 'perusahaan', 'buyer');
    const itemCol = findColIdx('namabarang', 'barang', 'material', 'jenisbarang', 'item', 'namaitem', 'komoditas', 'produk');
    const quarryCol = findColIdx('quarry', 'asalquarry', 'asaltambang', 'tambang', 'supplier', 'asal', 'sumber', 'lokasitambang', 'quary');
    const volCol = findColIdx('volume', 'vol', 'qty', 'kuantitas', 'jumlah', 'kubikasi', 'tonase', 'm3', 'ton');
    const unitCol = findColIdx('satuan', 'unit', 'uom');
    const destCol = findColIdx('tujuanpengiriman', 'tujuan', 'lokasi', 'alamat', 'proyek', 'site', 'destinasi');
    const priceCol = findColIdx('hargajualsatuan', 'hargasatuan', 'hargajual', 'harga', 'unitprice', 'price', 'tarif', 'hargasatuanjual');
    const statusCol = findColIdx('statuspembayaran', 'status', 'pembayaran', 'statusbayar', 'paymentstatus');
    const plateCol = findColIdx('nopolisi', 'nopol', 'plat', 'platnomor', 'kendaraan', 'nopolisikendaraan');
    const driverCol = findColIdx('namasopir', 'sopir', 'driver', 'namadriver', 'supir');
    const notesCol = findColIdx('catatan', 'keterangan', 'notes', 'ket', 'keteranganlain', 'remark');

    dataFormattedRows.forEach((rowF, index) => {
      const rowR = dataRawRows[index] || [];
      const rowNum = headerRowIdx + index + 2;

      // Extract values by column index
      const getValF = (colIdx: number) => (colIdx >= 0 && rowF[colIdx] !== undefined ? rowF[colIdx] : '');
      const getValR = (colIdx: number) => (colIdx >= 0 && rowR[colIdx] !== undefined ? rowR[colIdx] : '');

      const rawDateFormatted = getValF(dateCol);
      const rawDateRaw = getValR(dateCol);

      const rawPo = getValF(poCol);
      const rawSj = getValF(sjCol);
      const rawClient = getValF(clientCol);
      const rawItem = getValF(itemCol);
      const rawQuarry = getValF(quarryCol);
      const rawVol = getValF(volCol) || getValR(volCol);
      const rawUnit = getValF(unitCol);
      const rawDest = getValF(destCol);
      const rawPrice = getValF(priceCol) || getValR(priceCol);
      const rawStatus = getValF(statusCol);
      const rawPlate = getValF(plateCol);
      const rawDriver = getValF(driverCol);
      const rawNotes = getValF(notesCol);

      // Check if entire row is empty
      const hasAnyValue = rowF.some((c: any) => c !== '' && c !== null && c !== undefined);
      if (!hasAnyValue) {
        return; // skip completely blank row
      }

      // Format Date with high accuracy
      const formattedDate = parseDateSmart(rawDateRaw, rawDateFormatted);

      // Parse Volume
      let volumeNum = parseNumberSmart(rawVol, 0);
      if (volumeNum <= 0) {
        // Fallback default volume
        volumeNum = 1;
        warnings.push(`Baris ${rowNum}: Volume kosong/0, otomatis diset ke 1 m3.`);
      }

      // Check Client with available clients
      const rawClientStr = String(rawClient || '').trim();
      const matchedClient = availableClients.find(
        (c) =>
          c.type === 'klien' &&
          ((rawClientStr && c.name.toLowerCase().trim() === rawClientStr.toLowerCase()) ||
            (rawClientStr && c.name.toLowerCase().includes(rawClientStr.toLowerCase())) ||
            (rawClientStr && rawClientStr.toLowerCase().includes(c.name.toLowerCase())))
      );

      const finalClientName = matchedClient ? matchedClient.name : rawClientStr || 'Pelanggan Umum / Proyek';
      const finalClientId = matchedClient ? matchedClient.id : undefined;

      // Check Item / Material with available materials
      const itemNameStr = String(rawItem || '').trim();
      const matchedMaterial = availableMaterials.find(
        (m) =>
          (itemNameStr && m.name.toLowerCase().trim() === itemNameStr.toLowerCase()) ||
          (itemNameStr && m.name.toLowerCase().includes(itemNameStr.toLowerCase())) ||
          (itemNameStr && itemNameStr.toLowerCase().includes(m.name.toLowerCase()))
      );

      const finalItemName = matchedMaterial
        ? matchedMaterial.name
        : itemNameStr || (availableMaterials[0]?.name ?? 'Pasir Cor Merapi');

      const rawUnitStr = rawUnit ? String(rawUnit).trim().toLowerCase() : '';
      const validUnit = (['m3', 'ton', 'kg', 'rit', 'truk', 'sak'].includes(rawUnitStr)
        ? rawUnitStr
        : matchedMaterial?.unit || 'm3') as MaterialUnit;

      // Quarry / Supplier detection
      let quarryStr = String(rawQuarry || '').trim();
      if (!quarryStr) {
        quarryStr = matchedMaterial?.quarry || 'Quarry Mitra Utama';
      }

      // Destination detection
      let finalDest = rawDest ? String(rawDest).trim() : '';
      if (!finalDest) {
        finalDest = matchedMaterial?.destination || (matchedClient?.address && matchedClient.address !== '-' ? matchedClient.address : 'Lokasi Proyek Klien');
      }

      // Parse Price
      let finalPrice = parseNumberSmart(rawPrice, 0);
      if (finalPrice <= 0) {
        finalPrice = matchedMaterial ? matchedMaterial.sellingPrice : 250000;
        warnings.push(`Baris ${rowNum}: Harga jual kosong/0, otomatis menggunakan Rp ${finalPrice.toLocaleString('id-ID')}.`);
      }

      // Format PO Number
      let poNumber = String(rawPo || '').trim();
      if (!poNumber) {
        poNumber = `PO-${formattedDate.replace(/-/g, '')}`;
      }

      // Format Surat Jalan
      let sjNumber = String(rawSj || '').trim();
      if (!sjNumber) {
        sjNumber = `SJ-${formattedDate.replace(/-/g, '')}-${String(index + 1).padStart(3, '0')}`;
        warnings.push(`Baris ${rowNum}: No Surat Jalan kosong, dibuat otomatis: ${sjNumber}`);
      }

      // Status
      const statusStr = String(rawStatus || '').toLowerCase();
      const isPaid = statusStr.includes('lunas') && !statusStr.includes('belum') && !statusStr.includes('tidak');

      importedSales.push({
        date: formattedDate,
        poNumber: poNumber,
        deliveryNoteNumber: sjNumber,
        clientId: finalClientId,
        clientName: finalClientName,
        itemId: matchedMaterial ? matchedMaterial.id : `mat-excel-${Date.now()}-${index}`,
        itemName: finalItemName,
        quarry: quarryStr,
        unit: validUnit,
        volume: volumeNum,
        destination: finalDest,
        price: finalPrice,
        totalAmount: volumeNum * finalPrice,
        paymentStatus: isPaid ? 'Lunas' : 'Belum Lunas',
        vehiclePlate: rawPlate ? String(rawPlate).trim() : undefined,
        driverName: rawDriver ? String(rawDriver).trim() : undefined,
        notes: rawNotes ? String(rawNotes).trim() : 'Diimpor dari Excel',
      });
    });

    if (importedSales.length === 0) {
      return {
        success: false,
        importedSales: [],
        errors: ['Tidak ada data valid yang dapat diimpor dari file Excel.'],
        warnings,
        totalRows: dataFormattedRows.length,
      };
    }

    return {
      success: true,
      importedSales,
      errors,
      warnings,
      totalRows: dataFormattedRows.length,
    };
  } catch (err: any) {
    return {
      success: false,
      importedSales: [],
      errors: [`Gagal memproses file Excel: ${err?.message || 'Format tidak valid atau file rusak'}`],
      warnings: [],
      totalRows: 0,
    };
  }
}

export function exportTableToExcel(data: any[], fileName: string, sheetName: string = 'Sheet1') {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
}

export function exportManualTransactionsToExcel(expenses: any[], periodTitle: string = 'Rekap_Transaksi') {
  const data = expenses.map((e, idx) => ({
    'No': idx + 1,
    'Tanggal': e.date,
    'Kode Akun': e.accountCode || '6-101',
    'Nama Akun': e.accountName || e.category,
    'Nama Transaksi': e.transactionName || e.description || e.category,
    'Jumlah': e.quantity || 1,
    'Unit': e.unit || 'Ls',
    'Harga/Unit (Rp)': e.pricePerUnit || e.amount,
    'Total (Rp)': e.amount,
    'Metode Pembayaran': e.paymentMethod || 'Kas & Bank',
    'Keterangan / Catatan': e.notes || e.description || '-',
    'Potongan Pajak PPh': e.withholdingTaxType && e.withholdingTaxType !== 'None' ? `${e.withholdingTaxType} (${e.withholdingRate}%) - Rp ${(e.withholdingAmount || 0).toLocaleString('id-ID')}` : '-',
  }));
  exportTableToExcel(data, `Rekap_Transaksi_Manual_${periodTitle.replace(/\s+/g, '_')}`, 'Rekap_Transaksi');
}

export function exportJournalEntriesToExcel(entries: any[], periodTitle: string = 'Jurnal_Umum') {
  const data = entries.map((j, idx) => ({
    'No': idx + 1,
    'Tanggal': j.date,
    'No. Referensi': j.refNo,
    'Keterangan': j.description,
    'Kode Debit': j.debitAccountCode,
    'Akun Debit': j.debitAccountName,
    'Kode Kredit': j.creditAccountCode,
    'Akun Kredit': j.creditAccountName,
    'Debit (Rp)': j.amount,
    'Kredit (Rp)': j.amount,
    'Tipe Sumber': j.sourceType,
  }));
  exportTableToExcel(data, `Jurnal_Umum_${periodTitle.replace(/\s+/g, '_')}`, 'Jurnal_Umum');
}

export function exportInvoiceRecapToExcel(
  poNumber: string,
  clientName: string,
  periodText: string,
  dailySales: SaleTransaction[],
  itemSummaries: any[],
  taxBreakdown: any
) {
  // Sheet 1: Rincian Surat Jalan Per Hari
  const deliveryData = dailySales.map((s, idx) => ({
    'No': idx + 1,
    'Tanggal Kirim': s.date,
    'No. Surat Jalan': s.deliveryNoteNumber,
    'No. PO': s.poNumber,
    'Klien': s.clientName,
    'Nama Barang': s.itemName,
    'Quarry': s.quarry,
    'Volume': s.volume,
    'Satuan': s.unit,
    'Harga Satuan (Rp)': s.price,
    'Total DPP (Rp)': s.totalAmount,
    'Tujuan Lokasi': s.destination,
    'No. Polisi': s.vehiclePlate || '-',
    'Sopir': s.driverName || '-',
    'Status Pembayaran': s.paymentStatus,
  }));

  // Sheet 2: Ringkasan Rekap Item
  const summaryData = itemSummaries.map((item, idx) => ({
    'No': idx + 1,
    'Nama Barang': item.itemName,
    'Total Volume': item.totalVolume,
    'Satuan': item.unit,
    'Harga Satuan (Rp)': item.unitPrice,
    'Total DPP (Rp)': item.totalAmount,
  }));

  summaryData.push({
    'No': '',
    'Nama Barang': 'TOTAL DPP',
    'Total Volume': itemSummaries.reduce((sum, i) => sum + i.totalVolume, 0),
    'Satuan': '',
    'Harga Satuan (Rp)': '',
    'Total DPP (Rp)': taxBreakdown.dpp,
  } as any);

  if (taxBreakdown.ppnAmount > 0) {
    summaryData.push({
      'No': '',
      'Nama Barang': `PPN (${taxBreakdown.ppnRate || 11}%)`,
      'Total Volume': '',
      'Satuan': '',
      'Harga Satuan (Rp)': '',
      'Total DPP (Rp)': taxBreakdown.ppnAmount,
    } as any);
  }

  summaryData.push({
    'No': '',
    'Nama Barang': 'TOTAL INVOICE (BRUTO)',
    'Total Volume': '',
    'Satuan': '',
    'Harga Satuan (Rp)': '',
    'Total DPP (Rp)': taxBreakdown.totalWithTax,
  } as any);

  const workbook = XLSX.utils.book_new();
  const ws1 = XLSX.utils.json_to_sheet(deliveryData);
  const ws2 = XLSX.utils.json_to_sheet(summaryData);

  XLSX.utils.book_append_sheet(workbook, ws1, 'Rekap_Surat_Jalan_Harian');
  XLSX.utils.book_append_sheet(workbook, ws2, 'Ringkasan_Invoice');

  const safePO = (poNumber || 'INV').replace(/[/\\?%*:|"<>]/g, '_');
  XLSX.writeFile(workbook, `Rekap_Invoice_${safePO}_${periodText.replace(/\s+/g, '_')}.xlsx`);
}

export function exportInvoiceHistoryToExcel(invoices: any[]) {
  const data = invoices.map((inv, idx) => ({
    'No': idx + 1,
    'No. Invoice': inv.invoiceNumber,
    'Tanggal Invoice': inv.invoiceDate,
    'Jatuh Tempo': inv.dueDate || '-',
    'No. PO': inv.poNumber,
    'Klien': inv.clientName,
    'Tujuan / Lokasi': inv.destination,
    'Periode Pengiriman': inv.periodDescription,
    'Dasar Pengenaan Pajak (Rp)': inv.dppAmount,
    'PPN (Rp)': inv.ppnAmount,
    'PPh 22 (Rp)': inv.pph22Amount || 0,
    'Total Tagihan Bruto (Rp)': inv.totalAmount,
    'Netto Tagihan (Rp)': inv.netReceivableAmount || inv.totalAmount,
    'Status Pembayaran': inv.status,
    'Jumlah yang Dibayar (Rp)': inv.amountPaid || 0,
    'Sisa Piutang Usaha (Rp)': inv.remainingAmount || 0,
    'Tanggal Pembayaran': inv.paymentDate || '-',
    'Ref Pembayaran / Bukti': inv.paymentReference || '-',
    'Catatan': inv.notes || '-',
  }));

  const workbook = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(workbook, ws, 'Riwayat_Invoice');
  XLSX.writeFile(workbook, `Riwayat_Invoice_dan_Piutang_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export function exportIncomeStatementToExcel(
  statement: any,
  periodText: string,
  companyName: string = 'CV. VARIA USAHA'
) {
  const rows: any[] = [];

  rows.push({ 'Pos Akun': `LAPORAN LABA RUGI KOMPREHENSIF - ${companyName.toUpperCase()}`, 'Kategori / Uraian': `Periode: ${periodText}`, 'Volume': '', 'Satuan': '', 'Nominal (Rp)': '' });
  rows.push({ 'Pos Akun': '', 'Kategori / Uraian': '', 'Volume': '', 'Satuan': '', 'Nominal (Rp)': '' });

  // 1. PENDAPATAN
  rows.push({ 'Pos Akun': '1. PENDAPATAN USAHA (REVENUE)', 'Kategori / Uraian': '', 'Volume': '', 'Satuan': '', 'Nominal (Rp)': statement.totalRevenue });
  statement.revenueDetails.forEach((r: any) => {
    rows.push({
      'Pos Akun': '',
      'Kategori / Uraian': `Penjualan Material: ${r.name}`,
      'Volume': r.volume,
      'Satuan': r.unit,
      'Nominal (Rp)': r.amount,
    });
  });

  rows.push({ 'Pos Akun': '', 'Kategori / Uraian': '', 'Volume': '', 'Satuan': '', 'Nominal (Rp)': '' });

  // 2. HPP
  rows.push({ 'Pos Akun': '2. BEBAN POKOK PENJUALAN (HPP)', 'Kategori / Uraian': '', 'Volume': '', 'Satuan': '', 'Nominal (Rp)': -statement.totalHPP });
  statement.hppDetails.forEach((h: any) => {
    rows.push({
      'Pos Akun': '',
      'Kategori / Uraian': `Pembelian Quarry: ${h.name}`,
      'Volume': h.volume,
      'Satuan': h.unit,
      'Nominal (Rp)': -h.amount,
    });
  });

  rows.push({ 'Pos Akun': '', 'Kategori / Uraian': '', 'Volume': '', 'Satuan': '', 'Nominal (Rp)': '' });

  // LABA KOTOR
  rows.push({ 'Pos Akun': 'LABA KOTOR USAHA (GROSS PROFIT)', 'Kategori / Uraian': '', 'Volume': '', 'Satuan': '', 'Nominal (Rp)': statement.grossProfit });
  rows.push({ 'Pos Akun': '', 'Kategori / Uraian': '', 'Volume': '', 'Satuan': '', 'Nominal (Rp)': '' });

  // 3. BEBAN OPERASIONAL
  rows.push({ 'Pos Akun': '3. BEBAN OPERASIONAL & LAPANGAN', 'Kategori / Uraian': '', 'Volume': '', 'Satuan': '', 'Nominal (Rp)': -statement.totalOperatingExpense });
  statement.expenseDetails.forEach((e: any) => {
    rows.push({
      'Pos Akun': '',
      'Kategori / Uraian': e.category,
      'Volume': '',
      'Satuan': '',
      'Nominal (Rp)': -e.amount,
    });
  });

  rows.push({ 'Pos Akun': '', 'Kategori / Uraian': '', 'Volume': '', 'Satuan': '', 'Nominal (Rp)': '' });

  // LABA SEBELUM PAJAK
  rows.push({ 'Pos Akun': 'LABA SEBELUM PAJAK PENGHASILAN (EBT)', 'Kategori / Uraian': '', 'Volume': '', 'Satuan': '', 'Nominal (Rp)': statement.netProfitBeforeTax });
  rows.push({ 'Pos Akun': '', 'Kategori / Uraian': '', 'Volume': '', 'Satuan': '', 'Nominal (Rp)': '' });

  // 4. PAJAK PENGHASILAN
  const tax = statement.incomeTax || {};
  rows.push({
    'Pos Akun': '4. BEBAN PAJAK PENGHASILAN (PPH)',
    'Kategori / Uraian': tax.schemeLabel || 'Pajak Penghasilan',
    'Volume': '',
    'Satuan': `Tarif ${tax.taxRate}%`,
    'Nominal (Rp)': -statement.incomeTaxExpense,
  });
  rows.push({
    'Pos Akun': '',
    'Kategori / Uraian': `Dasar Pengenaan Pajak (DPP / Penghasilan Kena Pajak)`,
    'Volume': '',
    'Satuan': '',
    'Nominal (Rp)': tax.taxableBase || 0,
  });
  if (tax.prepaidTaxCredit > 0) {
    rows.push({
      'Pos Akun': '',
      'Kategori / Uraian': `Kredit Pajak Dibayar di Muka (PPh 22 WAPU / PPh 23)`,
      'Volume': '',
      'Satuan': '',
      'Nominal (Rp)': tax.prepaidTaxCredit,
    });
    rows.push({
      'Pos Akun': '',
      'Kategori / Uraian': `Sisa PPh Kurang / (Lebih) Bayar`,
      'Volume': '',
      'Satuan': '',
      'Nominal (Rp)': tax.netTaxPayable,
    });
  }

  rows.push({ 'Pos Akun': '', 'Kategori / Uraian': '', 'Volume': '', 'Satuan': '', 'Nominal (Rp)': '' });

  // LABA BERSIH SETELAH PAJAK
  rows.push({ 'Pos Akun': 'LABA BERSIH SETELAH PAJAK PENGHASILAN (NET PROFIT)', 'Kategori / Uraian': '', 'Volume': '', 'Satuan': '', 'Nominal (Rp)': statement.netProfit });

  const workbook = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = [
    { wch: 45 },
    { wch: 40 },
    { wch: 12 },
    { wch: 15 },
    { wch: 22 },
  ];

  XLSX.utils.book_append_sheet(workbook, ws, 'Laba_Rugi_Komprehensif');
  XLSX.writeFile(workbook, `Laporan_Laba_Rugi_${periodText.replace(/\s+/g, '_')}.xlsx`);
}

