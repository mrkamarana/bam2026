import React from 'react';
import {
  LayoutDashboard,
  Building2,
  Users,
  Boxes,
  TrendingUp,
  ShoppingCart,
  FileText,
  PieChart,
  Settings,
  Layers,
  Database,
  Menu,
  X,
  ShieldCheck,
  Award,
  Wallet,
  Zap,
  RefreshCw,
  CheckCircle2,
  Clock,
  Cloud,
  CloudOff,
  AlertCircle,
} from 'lucide-react';
import { CompanyProfile } from '../types';

export type MainTabType =
  | 'dashboard'
  | 'klien-supplier'
  | 'barang'
  | 'penjualan'
  | 'pembelian'
  | 'invoice'
  | 'insentif'
  | 'penggajian'
  | 'perpajakan'
  | 'laporan-keuangan'
  | 'pengaturan';

interface NavbarProps {
  currentTab: MainTabType;
  onSelectTab: (tab: MainTabType) => void;
  companyProfile: CompanyProfile;
  totalSalesCount: number;
  totalPurchasesCount: number;
  totalIncentivesCount?: number;
  totalSalariesCount?: number;
  totalTaxInvoicesCount?: number;
  mobileMenuOpen?: boolean;
  onToggleMobileMenu?: () => void;
  saveStatus?: 'synced' | 'saving' | 'pending' | 'offline' | 'error';
  lastSavedTime?: string;
  onForceSaveAll?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  companyProfile,
  totalSalesCount,
  totalPurchasesCount,
  totalIncentivesCount,
  totalSalariesCount,
  totalTaxInvoicesCount,
  mobileMenuOpen,
  onToggleMobileMenu,
  saveStatus = 'synced',
  lastSavedTime,
  onForceSaveAll,
}) => {
  const navSections = [
    {
      title: 'OVERVIEW & ANALISIS',
      items: [
        {
          id: 'dashboard' as MainTabType,
          label: 'Dashboard Utama',
          icon: <LayoutDashboard className="w-3.5 h-3.5" />,
          description: 'Ringkasan penjualan, laba bersih & grafik tren',
        },
      ],
    },
    {
      title: 'MASTER DATA',
      items: [
        {
          id: 'klien-supplier' as MainTabType,
          label: 'Klien & Supplier',
          icon: <Users className="w-3.5 h-3.5" />,
          description: 'Master data klien proyek & quarry',
        },
        {
          id: 'barang' as MainTabType,
          label: 'Daftar Barang',
          icon: <Boxes className="w-3.5 h-3.5" />,
          description: 'Material, quarry, unit & harga',
        },
      ],
    },
    {
      title: 'TRANSAKSI OPERASIONAL',
      items: [
        {
          id: 'penjualan' as MainTabType,
          label: 'Penjualan (Sales)',
          icon: <TrendingUp className="w-3.5 h-3.5" />,
          badge: totalSalesCount,
          description: 'PO, Surat Jalan, Excel & PDF',
        },
        {
          id: 'pembelian' as MainTabType,
          label: 'Pembelian (PO)',
          icon: <ShoppingCart className="w-3.5 h-3.5" />,
          badge: totalPurchasesCount,
          description: 'Auto-sync mengacu Penjualan',
        },
        {
          id: 'invoice' as MainTabType,
          label: 'Rekap Invoice',
          icon: <FileText className="w-3.5 h-3.5" />,
          description: 'Penagihan rekap per PO proyek',
        },
      ],
    },
    {
      title: 'SDM & PENGGAJIAN',
      items: [
        {
          id: 'insentif' as MainTabType,
          label: 'Insentif Penjualan',
          icon: <Award className="w-3.5 h-3.5" />,
          badge: totalIncentivesCount,
          description: 'Hitung otomatis volume penjualan, barang & tujuan',
        },
        {
          id: 'penggajian' as MainTabType,
          label: 'Form Gaji & Slip',
          icon: <Wallet className="w-3.5 h-3.5" />,
          badge: totalSalariesCount,
          description: 'Penggajian karyawan & slip gaji terintegrasi',
        },
      ],
    },
    {
      title: 'PERPAJAKAN & AKUNTANSI',
      items: [
        {
          id: 'perpajakan' as MainTabType,
          label: 'Perpajakan (e-Faktur)',
          icon: <ShieldCheck className="w-3.5 h-3.5" />,
          badge: totalTaxInvoicesCount,
          description: 'PPN 11%, WAPU BUMN, e-Faktur & e-Bupot DJP',
        },
        {
          id: 'laporan-keuangan' as MainTabType,
          label: 'Laporan Keuangan',
          icon: <PieChart className="w-3.5 h-3.5" />,
          description: 'Jurnal, Buku Besar, Neraca, Laba Rugi',
        },
      ],
    },
    {
      title: 'SISTEM',
      items: [
        {
          id: 'pengaturan' as MainTabType,
          label: 'Pengaturan & DB',
          icon: <Settings className="w-3.5 h-3.5" />,
          description: 'Profil, backup & restore data',
        },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Top Navigation Header */}
      <div id="app-mobile-nav" className="lg:hidden bg-slate-900 border-b border-slate-800 text-white p-3 flex items-center justify-between shrink-0 print:hidden">
        <div className="flex items-center gap-2">
          {companyProfile.logoUrl ? (
            <div className="w-7 h-7 bg-white rounded p-0.5 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
              <img src={companyProfile.logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
            </div>
          ) : (
            <div className="w-7 h-7 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-xs shrink-0">
              {companyProfile.name ? companyProfile.name.charAt(0).toUpperCase() : 'M'}
            </div>
          )}
          <div>
            <div className="font-bold text-xs leading-none truncate max-w-[180px]">
              {companyProfile.name || 'PT MITRA MATERIAL'}
            </div>
            <div className="text-[10px] text-slate-400">Material Construction ERP</div>
          </div>
        </div>
        <button
          onClick={onToggleMobileMenu}
          className="p-1.5 bg-slate-800 rounded text-slate-300 hover:text-white"
        >
          {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>
      </div>

      {/* Sidebar for Desktop & Mobile Overlay */}
      <aside
        id="app-navbar-sidebar"
        className={`${
          mobileMenuOpen ? 'block fixed inset-y-0 left-0 z-50 shadow-2xl' : 'hidden'
        } lg:flex lg:static w-60 bg-slate-900 text-slate-300 flex-col border-r border-slate-800 shrink-0 h-full select-none print:hidden`}
      >
        {/* Brand Header */}
        <div className="p-3.5 border-b border-slate-800 flex items-center gap-2.5">
          {companyProfile.logoUrl ? (
            <div className="w-9 h-9 bg-white rounded-lg p-0.5 flex items-center justify-center overflow-hidden shrink-0 shadow-sm border border-slate-700">
              <img src={companyProfile.logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
            </div>
          ) : (
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm">
              {companyProfile.name ? companyProfile.name.charAt(0).toUpperCase() : 'M'}
            </div>
          )}
          <div className="leading-tight overflow-hidden">
            <div className="text-white font-bold text-xs truncate" title={companyProfile.name}>
              {companyProfile.name || 'PT MITRA MATERIAL'}
            </div>
            <div className="text-[10px] text-slate-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
              <span>High Density ERP</span>
            </div>
          </div>
        </div>

        {/* Navigation Sections */}
        <nav className="flex-1 overflow-y-auto py-2.5 px-2 space-y-3">
          {navSections.map((sec, idx) => (
            <div key={idx}>
              <div className="px-2.5 text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                {sec.title}
              </div>
              <div className="space-y-0.5">
                {sec.items.map((item) => {
                  const isActive = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      id={`nav-tab-${item.id}`}
                      onClick={() => {
                        onSelectTab(item.id);
                        if (mobileMenuOpen && onToggleMobileMenu) onToggleMobileMenu();
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs transition-colors ${
                        isActive
                          ? 'bg-blue-600 text-white font-semibold shadow-xs'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                      title={item.description}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={isActive ? 'text-white' : 'text-slate-400'}>
                          {item.icon}
                        </span>
                        <span className="truncate">{item.label}</span>
                      </div>
                      {item.badge !== undefined && item.badge > 0 && (
                        <span
                          className={`ml-1.5 px-1.5 py-0.2 rounded-full text-[9px] font-bold ${
                            isActive
                              ? 'bg-blue-800 text-white'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Sidebar Footer with Auto-Save Indicator */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/40 text-[10px] text-slate-400 space-y-2">
          <div>
            <div className="font-semibold text-slate-300 truncate">{companyProfile.bankName}</div>
            <div className="text-[9px] text-slate-400 font-mono">{companyProfile.bankAccount}</div>
          </div>

          <div className="pt-2 border-t border-slate-800/80">
            <div className="flex items-center justify-between gap-1 mb-1">
              <span className="text-[9px] uppercase font-bold text-slate-400 flex items-center gap-1">
                <Cloud className="w-3 h-3 text-blue-400" />
                Backend Database
              </span>
              {onForceSaveAll && (
                <button
                  type="button"
                  onClick={onForceSaveAll}
                  className="text-[9px] text-blue-400 hover:text-blue-300 font-semibold cursor-pointer underline"
                  title="Simpan perubahan ke database sekarang"
                >
                  Sinkron
                </button>
              )}
            </div>

            <div className="flex items-center justify-between text-[9px] bg-slate-900/90 px-2 py-1 rounded border border-slate-800">
              {saveStatus === 'saving' && (
                <div className="flex items-center gap-1.5 text-blue-400 font-medium">
                  <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                  <span>Menyimpan...</span>
                </div>
              )}
              {saveStatus === 'pending' && (
                <div className="flex items-center gap-1.5 text-amber-400 font-medium">
                  <Clock className="w-2.5 h-2.5 animate-pulse" />
                  <span>Debounce (menunggu)...</span>
                </div>
              )}
              {saveStatus === 'synced' && (
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                  <CheckCircle2 className="w-2.5 h-2.5" />
                  <span>Tersimpan di Cloud</span>
                </div>
              )}
              {saveStatus === 'offline' && (
                <div className="flex items-center gap-1.5 text-slate-300 font-medium">
                  <CloudOff className="w-2.5 h-2.5 text-slate-400" />
                  <span>Cache Lokal Aktif</span>
                </div>
              )}
              {saveStatus === 'error' && (
                <div className="flex items-center gap-1.5 text-rose-400 font-medium">
                  <AlertCircle className="w-2.5 h-2.5" />
                  <span>Gagal Simpan</span>
                </div>
              )}

              {lastSavedTime && (
                <span className="font-mono text-slate-500 text-[8px]">{lastSavedTime}</span>
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
