import React, { useState, useRef, useEffect } from 'react';
import {
  Settings,
  Building2,
  Database,
  Download,
  Upload,
  Trash2,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Save,
  ShieldAlert,
  Image as ImageIcon,
  Sparkles,
  HardDrive,
  Check,
  RotateCcw,
  FileCode,
  Layers,
} from 'lucide-react';
import { CompanyProfile } from '../types';
import { processImageFileToPNG, createDefaultCompanyLogoPNG } from '../utils/logoHelper';

interface SettingsViewProps {
  companyProfile: CompanyProfile;
  onUpdateCompanyProfile: (profile: CompanyProfile) => void;
  onExportAllData: () => void;
  onImportAllData: (jsonData: string) => boolean;
  onWipeData: () => void;
  onResetToDemoData: () => void;
  clientsCount?: number;
  materialsCount?: number;
  salesCount?: number;
  purchasesCount?: number;
  expensesCount?: number;
  taxInvoicesCount?: number;
  withholdingSlipsCount?: number;
  invoicesCount?: number;
  customJournalsCount?: number;
  employeesCount?: number;
  incentivesCount?: number;
  salariesCount?: number;
  lastSavedTime?: string;
  onForceSaveAll?: () => void;
  saveStatus?: 'synced' | 'saving' | 'pending' | 'offline' | 'error';
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  companyProfile,
  onUpdateCompanyProfile,
  onExportAllData,
  onImportAllData,
  onWipeData,
  onResetToDemoData,
  clientsCount = 0,
  materialsCount = 0,
  salesCount = 0,
  purchasesCount = 0,
  expensesCount = 0,
  taxInvoicesCount = 0,
  withholdingSlipsCount = 0,
  invoicesCount = 0,
  customJournalsCount = 0,
  employeesCount = 0,
  incentivesCount = 0,
  salariesCount = 0,
  lastSavedTime,
  onForceSaveAll,
  saveStatus = 'synced',
}) => {
  const [formData, setFormData] = useState<CompanyProfile>({ ...companyProfile });
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [forceSavedSuccess, setForceSavedSuccess] = useState(false);
  const [storageUsageBytes, setStorageUsageBytes] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const formDataRef = useRef<CompanyProfile>(formData);
  formDataRef.current = formData;

  // Keep in sync with incoming companyProfile from backend or parent
  useEffect(() => {
    setFormData({ ...companyProfile });
  }, [companyProfile]);

  // Clean unmount flush
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        onUpdateCompanyProfile(formDataRef.current);
      }
    };
  }, [onUpdateCompanyProfile]);

  const handleFieldChange = (key: keyof CompanyProfile, value: string) => {
    const updated = {
      ...formDataRef.current,
      [key]: value,
    };
    setFormData(updated);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      onUpdateCompanyProfile(updated);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
      debounceTimerRef.current = null;
    }, 600);
  };

  const handleFieldBlur = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    onUpdateCompanyProfile(formDataRef.current);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  // Calculate approximate storage usage
  useEffect(() => {
    try {
      let total = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('mat_app_')) {
          const val = localStorage.getItem(key) || '';
          total += (key.length + val.length) * 2; // UTF-16 bytes approx
        }
      }
      setStorageUsageBytes(total);
    } catch {
      setStorageUsageBytes(0);
    }
  }, [salesCount, purchasesCount, expensesCount, clientsCount, materialsCount, taxInvoicesCount, invoicesCount, forceSavedSuccess]);

  const handleManualForceSave = () => {
    if (onForceSaveAll) {
      onForceSaveAll();
      setForceSavedSuccess(true);
      setTimeout(() => setForceSavedSuccess(false), 3000);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateCompanyProfile(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleLogoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLogoUploading(true);
    setLogoError(null);
    try {
      const pngDataUrl = await processImageFileToPNG(file);
      setFormData((prev) => ({
        ...prev,
        logoUrl: pngDataUrl,
      }));
    } catch (err: any) {
      setLogoError(err?.message || 'Gagal memproses gambar logo');
    } finally {
      setLogoUploading(false);
      if (e.target) {
        e.target.value = '';
      }
    }
  };

  const handleResetToDefaultLogo = () => {
    const defaultLogo = createDefaultCompanyLogoPNG(formData.name || 'PT BERKAH ALAM MULIA');
    setFormData((prev) => ({
      ...prev,
      logoUrl: defaultLogo,
    }));
    setLogoError(null);
  };

  const handleRemoveLogo = () => {
    setFormData((prev) => ({
      ...prev,
      logoUrl: '',
    }));
    setLogoError(null);
  };

  const handleFileRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = onImportAllData(content);
      if (success) {
        alert('Data berhasil dipulihkan (Restore) secara lengkap!');
      } else {
        alert('File backup JSON tidak valid atau rusak!');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-3 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white p-3 rounded border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-blue-600" />
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-tight">
              Pengaturan Sistem & Manajemen Data
            </h2>
          </div>
          <p className="text-[11px] text-slate-500">
            Kelola profil kop surat perusahaan, rekening penagihan, serta fasilitas Backup, Restore, dan Wipe database
          </p>
        </div>
      </div>

      {/* 1. Profil Perusahaan */}
      <div className="bg-white border border-slate-200 rounded p-3.5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs uppercase">
            <Building2 className="w-4 h-4 text-blue-600" />
            <span>Profil Perusahaan & Kop Surat Invoice</span>
          </div>
          {savedSuccess && (
            <span className="flex items-center gap-1 text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              <CheckCircle2 className="w-3 h-3" /> Tersimpan!
            </span>
          )}
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-3 text-xs">
          {/* Logo Perusahaan (.PNG) Section */}
          <div className="p-3 bg-slate-50 rounded border border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start sm:items-center gap-3">
                {/* Logo Preview Container */}
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 bg-white border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center p-1.5 shrink-0 shadow-2xs overflow-hidden group">
                  {formData.logoUrl ? (
                    <img
                      src={formData.logoUrl}
                      alt="Logo Perusahaan"
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <div className="text-center text-slate-400">
                      <ImageIcon className="w-6 h-6 mx-auto mb-0.5" />
                      <span className="text-[9px] block font-semibold leading-none">No Logo</span>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-800 text-xs">Logo Perusahaan (Format .PNG)</span>
                    <span className="px-1.5 py-0.5 text-[9px] font-bold bg-blue-100 text-blue-800 rounded">
                      PNG Recommended
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 max-w-md">
                    Logo ditampilkan pada Kop Surat Invoice Resmi, Rekap Laporan Penjualan, Rekap Pembelian, dan Navigasi Sistem.
                  </p>
                  {logoError && (
                    <div className="text-[10px] text-rose-600 font-semibold">{logoError}</div>
                  )}
                </div>
              </div>

              {/* Upload and Reset Buttons */}
              <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleLogoFileChange}
                  className="hidden"
                />

                <button
                  type="button"
                  id="btn-upload-logo"
                  onClick={() => logoInputRef.current?.click()}
                  disabled={logoUploading}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded text-xs transition shadow-2xs disabled:opacity-50"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{logoUploading ? 'Memproses...' : 'Upload Logo (.PNG)'}</span>
                </button>

                <button
                  type="button"
                  id="btn-default-logo"
                  onClick={handleResetToDefaultLogo}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-semibold rounded text-xs transition"
                  title="Gunakan logo standar resmi BAM Material"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Default Logo</span>
                </button>

                {formData.logoUrl && (
                  <button
                    type="button"
                    id="btn-remove-logo"
                    onClick={handleRemoveLogo}
                    className="flex items-center gap-1 px-2 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded text-xs transition"
                    title="Hapus Logo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-slate-600 font-semibold mb-1 text-[11px]">
                Nama Perusahaan / Supplier Material *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => handleFieldChange('name', e.target.value)}
                onBlur={handleFieldBlur}
                className="w-full px-2.5 py-1.5 bg-white text-slate-900 border border-slate-300 rounded focus:outline-none focus:border-blue-600 font-semibold"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1 text-[11px]">Tagline / Sub-Judul</label>
              <input
                type="text"
                value={formData.tagline}
                onChange={(e) => handleFieldChange('tagline', e.target.value)}
                onBlur={handleFieldBlur}
                className="w-full px-2.5 py-1.5 bg-white text-slate-900 border border-slate-300 rounded focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-600 font-semibold mb-1 text-[11px]">Alamat Kantor / Operasional *</label>
            <textarea
              required
              rows={2}
              value={formData.address}
              onChange={(e) => handleFieldChange('address', e.target.value)}
              onBlur={handleFieldBlur}
              className="w-full px-2.5 py-1.5 bg-white text-slate-900 border border-slate-300 rounded focus:outline-none focus:border-blue-600 resize-none text-xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div>
              <label className="block text-slate-600 font-semibold mb-1 text-[11px]">No. Telepon / Hotline</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => handleFieldChange('phone', e.target.value)}
                onBlur={handleFieldBlur}
                className="w-full px-2.5 py-1.5 bg-white text-slate-900 border border-slate-300 rounded focus:outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1 text-[11px]">Email Perusahaan</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleFieldChange('email', e.target.value)}
                onBlur={handleFieldBlur}
                className="w-full px-2.5 py-1.5 bg-white text-slate-900 border border-slate-300 rounded focus:outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1 text-[11px]">NPWP Perusahaan</label>
              <input
                type="text"
                value={formData.npwp}
                onChange={(e) => handleFieldChange('npwp', e.target.value)}
                onBlur={handleFieldBlur}
                className="w-full px-2.5 py-1.5 bg-white text-slate-900 border border-slate-300 rounded focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>

          {/* Rekening Bank Penagihan */}
          <div className="p-3 bg-slate-50 rounded border border-slate-200 space-y-2">
            <h4 className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">
              Rekening Bank Tujuan Transfer (Untuk Dicantumkan pada Invoice)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className="block text-slate-600 text-[10px] mb-0.5">Nama Bank *</label>
                <input
                  type="text"
                  required
                  placeholder="Bank Central Asia (BCA)"
                  value={formData.bankName}
                  onChange={(e) => handleFieldChange('bankName', e.target.value)}
                  onBlur={handleFieldBlur}
                  className="w-full px-2.5 py-1.5 bg-white text-slate-900 border border-slate-300 rounded focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-slate-600 text-[10px] mb-0.5">Nomor Rekening *</label>
                <input
                  type="text"
                  required
                  placeholder="8830-1928-33"
                  value={formData.bankAccount}
                  onChange={(e) => handleFieldChange('bankAccount', e.target.value)}
                  onBlur={handleFieldBlur}
                  className="w-full px-2.5 py-1.5 bg-white text-emerald-700 font-mono font-bold border border-slate-300 rounded focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-slate-600 text-[10px] mb-0.5">Atas Nama (A/N) *</label>
                <input
                  type="text"
                  required
                  placeholder="PT MITRA MATERIAL KONSTRUKSI"
                  value={formData.bankHolder}
                  onChange={(e) => handleFieldChange('bankHolder', e.target.value)}
                  onBlur={handleFieldBlur}
                  className="w-full px-2.5 py-1.5 bg-white text-slate-900 border border-slate-300 rounded focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>
          </div>

          {/* Penandatangan Invoice */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-slate-600 font-semibold mb-1 text-[11px]">
                Nama Pimpinan / Penandatangan Invoice *
              </label>
              <input
                type="text"
                required
                placeholder="H. Bambang Setiawan, S.T."
                value={formData.signatoryName}
                onChange={(e) => handleFieldChange('signatoryName', e.target.value)}
                onBlur={handleFieldBlur}
                className="w-full px-2.5 py-1.5 bg-white text-slate-900 border border-slate-300 rounded focus:outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1 text-[11px]">Jabatan Penandatangan *</label>
              <input
                type="text"
                required
                placeholder="Direktur Utama"
                value={formData.signatoryRole}
                onChange={(e) => handleFieldChange('signatoryRole', e.target.value)}
                onBlur={handleFieldBlur}
                className="w-full px-2.5 py-1.5 bg-white text-slate-900 border border-slate-300 rounded focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Perubahan otomatis disimpan saat selesai mengisi (Debounced 600ms / onBlur)</span>
            </div>
            <button
              id="save-company-profile-btn"
              type="submit"
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded transition shadow-2xs cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Simpan Sekarang (Manual)</span>
            </button>
          </div>
        </form>
      </div>

      {/* 2. Status Penyimpanan Database Server & LocalStorage Browser */}
      <div className="bg-white border border-emerald-200 rounded p-3.5 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-100 pb-2">
          <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs uppercase">
            <HardDrive className="w-4 h-4 text-emerald-600" />
            <span>Penyimpanan Database Backend & Cache Lokal (Auto-Save Aktif)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-[10px] text-emerald-800 font-bold bg-emerald-100/80 px-2 py-0.5 rounded border border-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Database Backend: AKTIF
            </span>
            {lastSavedTime && (
              <span className="text-[10px] text-slate-500 font-mono">
                Tersimpan: {lastSavedTime}
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] text-slate-600">
          <div className="p-2.5 bg-blue-50/60 border border-blue-200 rounded">
            <div className="font-bold text-blue-900 mb-1 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-blue-600" />
              Penyimpanan Utama (Database Server via API)
            </div>
            <p>
              Setiap kali selesai mengisi field, data dikirim secara otomatis ke database server <code>/api/data</code> dengan mekanisme <strong>debounce (700ms)</strong> untuk efisiensi jaringan.
            </p>
          </div>
          <div className="p-2.5 bg-emerald-50/60 border border-emerald-200 rounded">
            <div className="font-bold text-emerald-900 mb-1 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Cache Sementara & Proteksi Exit (BeforeUnload)
            </div>
            <p>
              Data juga segera disimpan ke <strong>LocalStorage cache</strong>. Saat menutup tab atau keluar aplikasi, data terakhir langsung diproses dan dikirim via <code>keepalive</code> API.
            </p>
          </div>
        </div>

        {/* Storage Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 text-center text-xs">
          <div className="p-2 bg-slate-50 border border-slate-200 rounded">
            <div className="text-[10px] text-slate-500 font-semibold">Klien & Vendor</div>
            <div className="text-sm font-bold text-slate-800 font-mono mt-0.5">{clientsCount}</div>
          </div>
          <div className="p-2 bg-slate-50 border border-slate-200 rounded">
            <div className="text-[10px] text-slate-500 font-semibold">Master Barang</div>
            <div className="text-sm font-bold text-slate-800 font-mono mt-0.5">{materialsCount}</div>
          </div>
          <div className="p-2 bg-slate-50 border border-slate-200 rounded">
            <div className="text-[10px] text-slate-500 font-semibold">Penjualan (Sales)</div>
            <div className="text-sm font-bold text-emerald-700 font-mono mt-0.5">{salesCount}</div>
          </div>
          <div className="p-2 bg-slate-50 border border-slate-200 rounded">
            <div className="text-[10px] text-slate-500 font-semibold">Pembelian (PO)</div>
            <div className="text-sm font-bold text-blue-700 font-mono mt-0.5">{purchasesCount}</div>
          </div>
          <div className="p-2 bg-slate-50 border border-slate-200 rounded">
            <div className="text-[10px] text-slate-500 font-semibold">Beban Ops</div>
            <div className="text-sm font-bold text-amber-700 font-mono mt-0.5">{expensesCount}</div>
          </div>
          <div className="p-2 bg-slate-50 border border-slate-200 rounded">
            <div className="text-[10px] text-slate-500 font-semibold">Rekap Invoice</div>
            <div className="text-sm font-bold text-indigo-700 font-mono mt-0.5">{invoicesCount}</div>
          </div>
          <div className="p-2 bg-slate-50 border border-slate-200 rounded">
            <div className="text-[10px] text-slate-500 font-semibold">Data Karyawan</div>
            <div className="text-sm font-bold text-slate-800 font-mono mt-0.5">{employeesCount}</div>
          </div>
          <div className="p-2 bg-emerald-50 border border-emerald-200 rounded">
            <div className="text-[10px] text-emerald-800 font-semibold">Dokumen Insentif</div>
            <div className="text-sm font-bold text-emerald-800 font-mono mt-0.5">{incentivesCount}</div>
          </div>
          <div className="p-2 bg-blue-50 border border-blue-200 rounded">
            <div className="text-[10px] text-blue-800 font-semibold">Slip Penggajian</div>
            <div className="text-sm font-bold text-blue-800 font-mono mt-0.5">{salariesCount}</div>
          </div>
          <div className="p-2 bg-slate-50 border border-slate-200 rounded">
            <div className="text-[10px] text-slate-500 font-semibold">Faktur Pajak</div>
            <div className="text-sm font-bold text-purple-700 font-mono mt-0.5">{taxInvoicesCount}</div>
          </div>
          <div className="p-2 bg-slate-50 border border-slate-200 rounded col-span-2">
            <div className="text-[10px] text-slate-500 font-semibold">Ukuran Data di LocalStorage</div>
            <div className="text-sm font-bold text-slate-800 font-mono mt-0.5">
              {(storageUsageBytes / 1024).toFixed(1)} KB
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Penyimpanan tersinkronisasi otomatis dengan standar kunci <code>mat_app_*</code></span>
          </div>

          <div className="flex items-center gap-2">
            {forceSavedSuccess && (
              <span className="flex items-center gap-1 text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-1 rounded border border-emerald-200 animate-in fade-in">
                <Check className="w-3 h-3" /> Berhasil Disimpan & Diverifikasi!
              </span>
            )}
            <button
              id="btn-force-save-localstorage"
              type="button"
              onClick={handleManualForceSave}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded transition shadow-2xs cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Simpan & Sinkronkan Sekarang</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Backup & Restore Data */}
      <div className="bg-white border border-slate-200 rounded p-3.5 shadow-2xs space-y-3">
        <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2 text-slate-800 font-bold text-xs uppercase">
          <Database className="w-4 h-4 text-emerald-600" />
          <span>Backup & Restore Database</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Backup */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-2">
            <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-xs">
              <Download className="w-3.5 h-3.5" />
              <span>Backup Data (Export JSON)</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Unduh seluruh data (Klien, Supplier, Daftar Barang, Penjualan, Pembelian, Beban, Profil) ke dalam 1 file cadangan JSON yang aman.
            </p>
            <button
              id="btn-backup-data"
              onClick={onExportAllData}
              className="w-full py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded flex items-center justify-center gap-1.5 transition shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh Cadangan Data (JSON)</span>
            </button>
          </div>

          {/* Restore */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-2">
            <div className="flex items-center gap-1.5 text-blue-700 font-bold text-xs">
              <Upload className="w-3.5 h-3.5" />
              <span>Restore Data (Import JSON)</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Pulihkan seluruh data dari file backup JSON sebelumnya. Data yang ada saat ini akan digantikan dengan data cadangan.
            </p>
            <button
              id="btn-restore-data"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded flex items-center justify-center gap-1.5 transition shadow-2xs"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Pilih File Backup JSON</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileRestore}
              className="hidden"
            />
          </div>
        </div>
      </div>

      {/* 3. Wipe Data & Reset */}
      <div className="bg-white border border-rose-200 rounded p-3.5 shadow-2xs space-y-3">
        <div className="flex items-center gap-1.5 border-b border-rose-100 pb-2 text-rose-700 font-bold text-xs uppercase">
          <ShieldAlert className="w-4 h-4" />
          <span>Wipe Data & Reset Demo</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {/* Wipe */}
          <div className="p-3 bg-rose-50/50 border border-rose-200 rounded space-y-2">
            <h4 className="font-bold text-rose-800 flex items-center gap-1 text-[11px]">
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>Wipe Data (Hapus Bersih Semua Data)</span>
            </h4>
            <p className="text-[11px] text-slate-600">
              Menghapus dan mengosongkan seluruh data (Master Klien & Supplier, Master Barang, Penjualan, Pembelian, Pengeluaran, dan Faktur Pajak) untuk memulai sistem dari awal yang kosong.
            </p>
            <button
              id="btn-wipe-data"
              onClick={() => {
                if (
                  confirm(
                    'PERINGATAN: Anda akan menghapus dan mengosongkan seluruh data (Klien, Supplier, Barang, Penjualan, Pembelian, Pengeluaran & Pajak). Pastikan sudah melakukan backup jika diperlukan! Lanjutkan?'
                  )
                ) {
                  onWipeData();
                  alert('Semua data berhasil dibersihkan dan dikosongkan!');
                }
              }}
              className="w-full py-1.5 px-3 bg-white hover:bg-rose-600 text-rose-700 hover:text-white font-bold rounded border border-rose-300 transition shadow-2xs"
            >
              Wipe Semua Data
            </button>
          </div>

          {/* Reset to Demo */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-2">
            <h4 className="font-bold text-slate-800 flex items-center gap-1 text-[11px]">
              <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
              <span>Muat Ulang Data Contoh (Demo Material)</span>
            </h4>
            <p className="text-[11px] text-slate-600">
              Mengisi kembali aplikasi dengan data master material lengkap, klien BUMN/proyek tol, quarry, surat jalan, dan PO contoh.
            </p>
            <button
              id="btn-reset-demo"
              onClick={() => {
                if (confirm('Muat ulang dataset contoh material konstruksi & proyek tol?')) {
                  onResetToDemoData();
                  alert('Dataset demo material konstruksi berhasil dimuat!');
                }
              }}
              className="w-full py-1.5 px-3 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded transition shadow-2xs"
            >
              Muat Dataset Contoh (Demo)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
