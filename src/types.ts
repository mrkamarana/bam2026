export type ClientSupplierType = 'klien' | 'supplier';

export interface ClientSupplier {
  id: string;
  type: ClientSupplierType;
  name: string;
  address: string;
  npwp?: string;
  isPKP?: boolean;
  phone?: string;
  email?: string;
  contactPerson?: string;
  notes?: string;
}

export type MaterialUnit = 'm3' | 'ton' | 'kg' | 'rit' | 'truk' | 'sak';

export interface MaterialItem {
  id: string;
  name: string;
  quarry: string; // Sumber/Quarry
  unit: MaterialUnit;
  destination: string; // Tujuan Pengiriman default
  purchasePrice: number; // Harga Beli /unit
  sellingPrice: number; // Harga Jual /unit
  description?: string;
}

export type TaxCalculationType = 'exclude' | 'include' | 'non-ppn' | 'wapu';

export interface SaleTransaction {
  id: string;
  date: string; // YYYY-MM-DD
  poNumber: string; // Purchase Order
  deliveryNoteNumber: string; // No Surat Jalan
  clientId?: string;
  clientName: string;
  itemId: string;
  itemName: string;
  quarry: string;
  unit: string;
  volume: number;
  destination: string;
  price: number; // Harga Jual
  totalAmount: number; // volume * price (DPP)
  paymentStatus: 'Lunas' | 'Belum Lunas';
  vehiclePlate?: string;
  driverName?: string;
  notes?: string;
  createdAt: string;
  // Integrated Tax Fields
  taxType?: TaxCalculationType;
  ppnRate?: number; // default 11%
  ppnAmount?: number;
  pph22Rate?: number; // e.g. 1.5% for government / WAPU
  pph22Amount?: number;
  taxInvoiceNumber?: string; // Nomor Seri Faktur Pajak (NSFP)
}

export interface PurchaseTransaction {
  id: string;
  saleId?: string; // Reference to sale if auto-generated
  date: string; // YYYY-MM-DD
  deliveryNoteNumber: string; // No Surat Jalan
  supplierId?: string;
  supplierName: string; // Quarry / Supplier
  itemId: string;
  itemName: string;
  quarry: string;
  unit: string;
  volume: number;
  destination: string;
  price: number; // Harga Beli
  totalAmount: number; // volume * price
  paymentStatus: 'Lunas' | 'Belum Lunas';
  notes?: string;
  createdAt: string;
  // Tax fields for Purchase / Input Tax
  hasInputTax?: boolean;
  inputPPNRate?: number; // 11%
  inputPPNAmount?: number;
  taxInvoiceNumber?: string;
}

export type ExpenseCategory =
  | 'BBM & Armada'
  | 'Gaji & Upah Sopir'
  | 'Gaji & Insentif Karyawan'
  | 'Pengiriman Dokumen Invoice'
  | 'Retribusi & Jalan'
  | 'Maintenance & Perbaikan'
  | 'Operasional Kantor'
  | 'Sewa & Utilitas'
  | 'Lain-lain';

export interface AccountOption {
  code: string;
  name: string;
  category: 'Aset' | 'Kewajiban' | 'Ekuitas' | 'Pendapatan' | 'HPP' | 'Beban';
  normalBalance: 'Debit' | 'Kredit';
  description?: string;
}

export interface OperationalExpense {
  id: string;
  date: string; // Tanggal YYYY-MM-DD
  accountCode: string; // Kode Akun (e.g. '6-101')
  accountName?: string; // Nama Akun (e.g. 'Beban BBM & Armada Solar')
  transactionName: string; // Nama Transaksi
  quantity: number; // Jumlah kuantitas
  unit: string; // Unit (Ls, Bln, Liter, Rim, Pcs, Org, Jam, Trip, dll)
  pricePerUnit: number; // Harga/unit
  amount: number; // Total = quantity * pricePerUnit
  totalAmount?: number; // Alias total
  category: ExpenseCategory | string; // Kategori
  description?: string; // Keterangan tambahan
  paymentMethod?: 'Kas & Bank' | 'Hutang';
  notes?: string;
  // Withholding Tax Info
  withholdingTaxType?: 'PPh 21' | 'PPh 23' | 'PPh 4(2)' | 'None';
  withholdingRate?: number;
  withholdingAmount?: number;
  inputPPNAmount?: number;
  createdAt?: string;
}

export type ManualTransaction = OperationalExpense;

export interface TaxProfile {
  isPKP: boolean;
  npwp: string;
  nitku: string;
  klu: string;
  kppName: string;
  pkpDate: string;
  efin: string;
  defaultPPNRate: number; // 11
  defaultPPh22Rate: number; // 1.5
  defaultPPh23Rate: number; // 2
  nsfpPrefix: string; // e.g. 010.000-26.
  lastNsfpIndex: number;
}

export interface TaxInvoiceEntry {
  id: string;
  type: 'keluaran' | 'masukan';
  taxNumber: string; // NSFP: 010.000-26.00000001
  refNumber: string; // No PO / Surat Jalan / Invoice
  date: string; // YYYY-MM-DD
  taxPeriod: string; // YYYY-MM
  counterpartyName: string;
  counterpartyNPWP: string;
  counterpartyAddress: string;
  transactionCode: '01' | '02' | '03' | '04' | '07' | '08';
  dpp: number; // Dasar Pengenaan Pajak
  ppnRate: number;
  ppnAmount: number;
  pph22Rate?: number;
  pph22Amount?: number;
  isWapu: boolean;
  status: 'Approved' | 'Draft' | 'Dibatalkan';
  ntpn?: string; // Nomor Transaksi Penerimaan Negara jika sudah disetor
  notes?: string;
  createdAt: string;
}

export interface WithholdingTaxSlip {
  id: string;
  slipNumber: string; // e.g. BP-2026/08/001
  taxType: 'PPh 22' | 'PPh 23' | 'PPh 4(2)' | 'PPh 21';
  date: string;
  taxPeriod: string; // YYYY-MM
  recipientName: string;
  recipientNPWP: string;
  objectCode: string; // 22-100-01 (Barang/Material), 28-102-01 (Sewa Armada/Alat), 21-100-03 (Upah Tenaga Lepas)
  objectDescription: string;
  grossAmount: number;
  rate: number;
  taxAmount: number;
  ntpn?: string;
  bupotStatus: 'Final' | 'Draft';
  createdAt: string;
}

export interface CompanyProfile {
  name: string;
  tagline: string;
  address: string;
  phone: string;
  email: string;
  npwp: string;
  bankName: string;
  bankAccount: string;
  bankHolder: string;
  signatoryName: string;
  signatoryRole: string;
  logoUrl?: string; // Format PNG (Data URL base64 atau URL gambar)
  director?: string; // Alias backward-compatibility
}

export interface SalesPrintOptions {
  showNo: boolean;
  showDate: boolean;
  showPONumber: boolean;
  showDeliveryNote: boolean;
  showClient: boolean;
  showItemName: boolean;
  showQuarry: boolean;
  showVolume: boolean;
  showDestination: boolean;
  showPrice: boolean;
  showTotalAmount: boolean;
  showPaymentStatus: boolean;
  showVehiclePlate: boolean;
  showDriverName: boolean;
  showNotes: boolean;
  dataScope: 'all' | 'selected_only' | 'lunas_only' | 'belum_lunas_only';
  selectedClient: string;
  selectedItem: string;
  showLetterhead: boolean;
  showLogo: boolean;
  showSummaryStats: boolean;
  showSignatures: boolean;
  signatureTitle1: string;
  signatureTitle2: string;
  customNotes: string;
  density: 'compact' | 'normal';
}

export interface PurchasePrintOptions {
  showNo: boolean;
  showDate: boolean;
  showDeliveryNote: boolean;
  showSupplier: boolean;
  showItemName: boolean;
  showQuarry: boolean;
  showVolume: boolean;
  showDestination: boolean;
  showPrice: boolean;
  showTotalAmount: boolean;
  showPaymentStatus: boolean;
  showNotes: boolean;
  dataScope: 'all' | 'selected_only' | 'lunas_only' | 'belum_lunas_only';
  selectedSupplier: string;
  selectedItem: string;
  showLetterhead: boolean;
  showLogo: boolean;
  showSummaryStats: boolean;
  showSignatures: boolean;
  signatureTitle1: string;
  signatureTitle2: string;
  customNotes: string;
  density: 'compact' | 'normal';
}

export type FilterMode = 'semua' | 'harian' | 'bulanan' | 'periode';

export interface DateFilterState {
  mode: FilterMode;
  date: string; // YYYY-MM-DD
  month: string; // YYYY-MM
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
}

export interface JournalEntry {
  id: string;
  date: string;
  refNo: string;
  description: string;
  debitAccountCode: string;
  debitAccountName: string;
  creditAccountCode: string;
  creditAccountName: string;
  amount: number;
  sourceType: 'penjualan' | 'pembelian' | 'pengeluaran' | 'modal' | 'pajak' | 'manual' | 'penyesuaian';
  sourceId?: string;
  isCustomOrEdited?: boolean;
}

export interface LedgerAccount {
  code: string;
  name: string;
  category: 'Aset' | 'Kewajiban' | 'Ekuitas' | 'Pendapatan' | 'HPP' | 'Beban';
  normalBalance: 'Debit' | 'Kredit';
  entries: {
    id: string;
    date: string;
    refNo: string;
    description: string;
    debit: number;
    credit: number;
    balance: number;
  }[];
  totalDebit: number;
  totalCredit: number;
  finalBalance: number;
}

export interface TrialBalanceRow {
  code: string;
  name: string;
  category: string;
  debit: number;
  credit: number;
}

export type IncomeTaxScheme = 'pp55_final_0_5' | 'badan_fasilitas_11' | 'badan_normal_22' | 'manual' | 'none';

export interface IncomeTaxDetail {
  scheme: IncomeTaxScheme;
  schemeLabel: string;
  taxableBase: number;
  taxRate: number;
  grossTaxExpense: number;
  prepaidTaxCredit: number;
  netTaxPayable: number;
  effectiveTaxRate: number;
  description?: string;
}

export interface IncomeStatementData {
  totalRevenue: number;
  revenueDetails: { name: string; volume: number; unit: string; amount: number }[];
  totalHPP: number;
  hppDetails: { name: string; volume: number; unit: string; amount: number }[];
  grossProfit: number;
  totalOperatingExpense: number;
  expenseDetails: { category: string; amount: number }[];
  netOperatingProfit?: number;
  netProfitBeforeTax: number;
  // Pajak Penghasilan (PPh)
  incomeTax: IncomeTaxDetail;
  incomeTaxExpense: number;
  // Integrated Tax Details
  totalOutputPPN?: number;
  totalWapuPPN?: number;
  totalInputPPN?: number;
  netPPNPayable?: number;
  totalPrepaidPPh22?: number;
  totalWithholdingPPh23?: number;
  totalWithholdingPPh21?: number;
  estimatedIncomeTax?: number;
  netProfit: number;
}

export interface BalanceSheetData {
  assets: {
    currentAssets: { name: string; code: string; amount: number }[];
    totalCurrentAssets: number;
    totalAssets: number;
  };
  liabilities: {
    currentLiabilities: { name: string; code: string; amount: number }[];
    totalLiabilities: number;
  };
  equity: {
    items: { name: string; code: string; amount: number }[];
    currentPeriodProfit: number;
    totalEquity: number;
  };
  isBalanced: boolean;
  discrepancy: number;
}

export interface POInvoiceSummary {
  poNumber: string;
  clientName: string;
  clientNPWP?: string;
  dateRange: { start: string; end: string };
  itemSummaries: {
    itemName: string;
    unit: string;
    quarry: string;
    destination: string;
    unitPrice: number;
    totalVolume: number;
    totalAmount: number;
  }[];
  deliveryNotes: {
    deliveryNoteNumber: string;
    date: string;
    itemName: string;
    volume: number;
    unit: string;
    vehiclePlate?: string;
    driverName?: string;
  }[];
  grandTotal: number;
  // Tax calculations
  taxType: TaxCalculationType;
  dppAmount: number;
  ppnRate: number;
  ppnAmount: number;
  pph22Rate: number;
  pph22Amount: number;
  totalInvoiceWithTax: number;
  netReceivableAmount: number; // Yang ditransfer pembeli setelah potong PPh 22 jika WAPU
  taxInvoiceNumber?: string;
}

export type InvoicePaymentStatus = 'Lunas' | 'Belum Lunas' | 'Sebagian';

export interface InvoiceItemDetail {
  itemName: string;
  unit: string;
  quarry: string;
  destination: string;
  unitPrice: number;
  totalVolume: number;
  totalAmount: number;
}

export interface InvoiceDeliveryNoteDetail {
  deliveryNoteNumber: string;
  date: string;
  itemName: string;
  volume: number;
  unit: string;
  vehiclePlate?: string;
  driverName?: string;
}

export interface InvoiceRecord {
  id: string;
  invoiceNumber: string;
  invoiceDate: string; // YYYY-MM-DD
  dueDate?: string; // YYYY-MM-DD
  poNumber: string;
  clientId?: string;
  clientName: string;
  clientAddress?: string;
  clientNPWP?: string;
  destination: string;
  periodDescription: string;
  
  // Tax & Amounts
  subtotal: number;
  taxType: TaxCalculationType;
  dppAmount: number;
  ppnRate: number;
  ppnAmount: number;
  pph22Rate: number;
  pph22Amount: number;
  isWapu: boolean;
  totalAmount: number; // Total Tagihan Bruto
  netReceivableAmount: number; // Netto wajib dibayar pembeli (setelah PPh 22 jika WAPU)
  
  // Status & Payment Tracking
  status: InvoicePaymentStatus; // 'Lunas' | 'Belum Lunas' | 'Sebagian'
  amountPaid: number; // Jumlah yang sudah dibayar (Rp)
  remainingAmount: number; // Sisa tagihan / piutang usaha (Rp)
  paymentDate?: string; // Tanggal lunas / bayar
  paymentAccountCode?: string; // e.g. '1-101'
  paymentAccountName?: string; // 'Kas & Bank'
  paymentReference?: string; // No Ref / Bukti Transfer
  notes?: string;
  
  // Breakdown for reprint and archival
  itemSummaries: InvoiceItemDetail[];
  deliveryNotes: InvoiceDeliveryNoteDetail[];
  saleIds?: string[];
  
  createdAt: string;
  updatedAt?: string;
}

export type EmployeeRole = string;

export interface Employee {
  id: string;
  nik: string;
  name: string;
  role: string; // Jabatan diisi manual (bebas / custom)
  phone?: string;
  baseSalary: number;
  allowances: {
    transport: number;
    meal: number;
    position: number;
    attendance: number;
    other: number;
  };
  bpjsKetenagakerjaan: number;
  bpjsKesehatan: number;
  defaultIncentiveRate?: number; // Default Rp / m3 atau ton
  customIncentiveRates?: ItemDestinationIncentiveRate[]; // Konfigurasi tarif insentif per barang & tujuan pengiriman
  bankName?: string;
  bankAccount?: string;
  bankHolder?: string;
  status: 'Aktif' | 'Nonaktif';
  notes?: string;
}

export interface ItemDestinationIncentiveRate {
  id: string;
  itemName: string; // Nama material (e.g. "Pasir Cor Merapi", atau "*" untuk semua)
  destination: string; // Lokasi tujuan (e.g. "Proyek Jalan Tol JORR 2", atau "*" untuk semua)
  ratePerUnit: number; // Nilai tarif Rp / m3 atau Rp / ton untuk kombinasi ini
  notes?: string;
}

export interface MatchedSaleIncentive {
  saleId: string;
  date: string;
  deliveryNoteNumber: string;
  poNumber: string;
  clientId?: string;
  clientName: string;
  itemId: string;
  itemName: string;
  quarry: string;
  destination: string;
  volume: number;
  unit: string;
  price: number;
  totalAmount: number;
  driverName?: string;
  vehiclePlate?: string;
  rateApplied: number;
  isCustomRate?: boolean;
  incentiveAmount: number;
}

export type IncentiveRateType = 'per_unit_volume' | 'percentage_sales' | 'fixed_trip';

export type IncentiveStatus = 'Draft' | 'Divalidasi' | 'Disetujui' | 'Dibayar' | 'Sudah Masuk Slip Gaji';

export interface IncentiveRecord {
  id: string;
  calculationNumber: string; // e.g. INS-202608-001
  date: string; // YYYY-MM-DD
  title: string;
  employeeId?: string;
  employeeName: string;
  employeeRole: string; // Jabatan karyawan
  driverFilter?: string; // Optional filter if specific driver in delivery note
  
  // Criteria filters
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  selectedItemNames: string[]; // List of material names
  selectedDestinations: string[]; // List of shipping destinations
  
  // Rate configuration
  rateType: IncentiveRateType;
  ratePerUnit: number; // Base default rate (Rp / m3 atau ton)
  ratePercentage?: number; // e.g. 2%
  ratePerTrip?: number; // e.g. Rp 50.000 / trip
  customRates?: ItemDestinationIncentiveRate[]; // Aturan tarif khusus per kombinasi Barang & Tujuan
  useVariableRates?: boolean; // Apakah menggunakan tarif bervariasi per barang/tujuan
  
  // Calculation outputs
  matchedSales: MatchedSaleIncentive[];
  totalMatchedSalesCount: number;
  totalVolume: number;
  totalSalesAmount: number;
  totalIncentiveAmount: number;
  
  // Status & Separate Payment Tracking
  status: IncentiveStatus;
  paymentStatus?: 'Belum Dibayar' | 'Dibayar';
  paymentDate?: string; // YYYY-MM-DD
  paymentMethod?: 'Transfer Bank' | 'Tunai / Kas' | 'Kas Kecil';
  bankName?: string;
  bankAccount?: string;
  bankHolder?: string;
  paymentReference?: string; // No Bukti Transfer / Kuitansi
  postToExpense?: boolean; // Posting terpisah ke Beban Operasional Insentif
  expenseId?: string;
  
  linkedSalarySlipId?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export type SalaryStatus = 'Draft' | 'Disetujui' | 'Dibayar';

export interface SalaryRecord {
  id: string;
  slipNumber: string; // e.g. SLIP-2026/08/001
  employeeId: string;
  employeeName: string;
  employeeNik: string;
  employeeRole: string;
  periodMonth: string; // e.g. 2026-08
  periodStartDate: string; // YYYY-MM-DD
  periodEndDate: string; // YYYY-MM-DD
  paymentDate: string; // YYYY-MM-DD
  
  // Earnings (Penghasilan)
  baseSalary: number; // Gaji Pokok
  transportAllowance: number; // Tunjangan Transport
  mealAllowance: number; // Tunjangan Makan
  positionAllowance: number; // Tunjangan Jabatan
  attendanceAllowance: number; // Tunjangan Kehadiran
  overtimeHours: number;
  overtimeRatePerHour: number;
  overtimeAmount: number; // Lembur = jam * tarif
  bonusAmount: number; // Bonus / THR / Performa
  
  // Integrated Incentive (Insentif Terintegrasi Otomatis)
  incentiveCalculationId?: string; // Reference to IncentiveRecord if connected
  incentiveAmount: number; // Nilai Insentif Otomatis
  incentiveSummary?: {
    startDate: string;
    endDate: string;
    selectedItemNames: string[];
    selectedDestinations: string[];
    totalVolume: number;
    ratePerUnit: number;
    customRatesCount?: number;
    hasVariedRates?: boolean;
    salesCount: number;
  };
  
  // Deductions (Potongan)
  bpjsKetenagakerjaan: number;
  bpjsKesehatan: number;
  pph21Amount: number; // Pajak PPh 21
  loanDeduction: number; // Kasbon / Pinjaman
  lateDeduction: number; // Potongan Keterlambatan / Absen
  otherDeductions: number; // Potongan Lainnya
  
  // Computed Summaries
  totalAllowances: number; // Total Tunjangan
  grossSalary: number; // Total Penghasilan Kotor
  totalDeductions: number; // Total Potongan
  netSalary: number; // Gaji Bersih (Take Home Pay)
  
  // Status, Payment & Financial Integration
  status: SalaryStatus;
  paymentMethod: 'Transfer Bank' | 'Tunai / Kas';
  bankName?: string;
  bankAccount?: string;
  bankHolder?: string;
  postToExpense: boolean; // Auto-posting to OperationalExpense
  expenseId?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

