import React, { useState } from 'react';
import {
  Users,
  Plus,
  Search,
  Edit2,
  Trash2,
  Phone,
  MapPin,
  FileText,
  UserCheck,
  Truck,
  CheckCircle2,
  X,
} from 'lucide-react';
import { ClientSupplier, ClientSupplierType } from '../types';

interface ClientSupplierListProps {
  items: ClientSupplier[];
  onAdd: (item: Omit<ClientSupplier, 'id'>) => void;
  onUpdate: (id: string, item: Partial<ClientSupplier>) => void;
  onDelete: (id: string) => void;
}

export const ClientSupplierList: React.FC<ClientSupplierListProps> = ({
  items,
  onAdd,
  onUpdate,
  onDelete,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | ClientSupplierType>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ClientSupplier | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    type: 'klien' as ClientSupplierType,
    name: '',
    address: '',
    phone: '',
    email: '',
    contactPerson: '',
    notes: '',
  });

  const openAddModal = (defaultType: ClientSupplierType = 'klien') => {
    setEditingItem(null);
    setFormData({
      type: defaultType,
      name: '',
      address: '',
      phone: '',
      email: '',
      contactPerson: '',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: ClientSupplier) => {
    setEditingItem(item);
    setFormData({
      type: item.type,
      name: item.name,
      address: item.address,
      phone: item.phone || '',
      email: item.email || '',
      contactPerson: item.contactPerson || '',
      notes: item.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.address.trim()) {
      alert('Nama dan Alamat wajib diisi!');
      return;
    }

    if (editingItem) {
      onUpdate(editingItem.id, formData);
    } else {
      onAdd(formData);
    }
    setIsModalOpen(false);
  };

  const filteredItems = items.filter((item) => {
    const matchesType = typeFilter === 'all' || item.type === typeFilter;
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.contactPerson && item.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesType && matchesSearch;
  });

  const clientCount = items.filter((i) => i.type === 'klien').length;
  const supplierCount = items.filter((i) => i.type === 'supplier').length;

  return (
    <div className="space-y-3">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white p-3 rounded border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600" />
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-tight">
              Daftar Klien & Supplier
            </h2>
          </div>
          <p className="text-[11px] text-slate-500">
            Master data relasi proyek: Klien (Customer Proyek) dan Supplier (Quarry & Tambang)
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            id="add-client-btn"
            onClick={() => openAddModal('klien')}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded transition shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Klien</span>
          </button>
          <button
            id="add-supplier-btn"
            onClick={() => openAddModal('supplier')}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs rounded transition shadow-2xs"
          >
            <Truck className="w-3.5 h-3.5 text-blue-400" />
            <span>+ Supplier Quarry</span>
          </button>
        </div>
      </div>

      {/* Stats and Filter bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <div
          onClick={() => setTypeFilter('all')}
          className={`cursor-pointer p-2.5 rounded border transition-all ${
            typeFilter === 'all'
              ? 'bg-white border-blue-600 ring-1 ring-blue-600/30 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Entitas</span>
            <Users className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="text-lg font-bold text-slate-900 font-mono mt-0.5">{items.length}</div>
          <div className="text-[10px] text-slate-400">Seluruh Klien & Quarry Terdaftar</div>
        </div>

        <div
          onClick={() => setTypeFilter('klien')}
          className={`cursor-pointer p-2.5 rounded border transition-all ${
            typeFilter === 'klien'
              ? 'bg-white border-emerald-600 ring-1 ring-emerald-600/30 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Klien (Customer)</span>
            <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-lg font-bold text-emerald-700 font-mono mt-0.5">{clientCount}</div>
          <div className="text-[10px] text-slate-400">Kontraktor, BUMN & Proyek</div>
        </div>

        <div
          onClick={() => setTypeFilter('supplier')}
          className={`cursor-pointer p-2.5 rounded border transition-all ${
            typeFilter === 'supplier'
              ? 'bg-white border-blue-600 ring-1 ring-blue-600/30 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">Supplier (Quarry)</span>
            <Truck className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div className="text-lg font-bold text-blue-700 font-mono mt-0.5">{supplierCount}</div>
          <div className="text-[10px] text-slate-400">Tambang Pasir, Crusher & Batu</div>
        </div>
      </div>

      {/* Search and Table */}
      <div className="bg-white border border-slate-200 rounded shadow-2xs overflow-hidden">
        <div className="p-2 sm:p-2.5 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="search-client-supplier"
              type="text"
              placeholder="Cari nama, alamat, kontak..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1 bg-white text-slate-800 text-xs border border-slate-300 rounded focus:outline-none focus:border-blue-600"
            />
          </div>

          <div className="text-[11px] text-slate-500">
            Total: <span className="font-bold text-slate-800 font-mono">{filteredItems.length}</span> entitas
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="px-3 py-2">Tipe</th>
                <th className="px-3 py-2">Nama Perusahaan / Quarry</th>
                <th className="px-3 py-2">Alamat</th>
                <th className="px-3 py-2">Kontak / Telepon</th>
                <th className="px-3 py-2">Catatan</th>
                <th className="px-3 py-2 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-slate-400">
                    Tidak ada data yang cocok dengan pencarian.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-blue-50/50 transition-colors">
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          item.type === 'klien'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}
                      >
                        {item.type === 'klien' ? (
                          <>
                            <UserCheck className="w-3 h-3" /> Klien
                          </>
                        ) : (
                          <>
                            <Truck className="w-3 h-3" /> Supplier
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-semibold text-slate-900">
                      <div>{item.name}</div>
                    </td>
                    <td className="px-3 py-2 text-slate-600 max-w-xs truncate" title={item.address}>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{item.address}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-slate-600 whitespace-nowrap">
                      <div className="text-slate-800 font-medium">{item.contactPerson || '-'}</div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-1 font-mono">
                        {item.phone && <Phone className="w-2.5 h-2.5 text-slate-400" />}
                        {item.phone || '-'}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-slate-500 text-[11px] max-w-xs truncate" title={item.notes}>
                      {item.notes || '-'}
                    </td>
                    <td className="px-3 py-2 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditModal(item)}
                          className="p-1 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded transition"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Hapus data ${item.name}?`)) {
                              onDelete(item.id);
                            }
                          }}
                          className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                          title="Hapus"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-lg max-w-md w-full p-4 shadow-xl text-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="flex items-center gap-1.5 font-bold text-slate-800 text-sm">
                <Users className="w-4 h-4 text-blue-600" />
                <span>{editingItem ? 'Edit Data Entitas' : 'Tambah Klien / Supplier'}</span>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Type toggle */}
              <div>
                <label className="block text-slate-600 font-semibold mb-1 text-[11px]">Tipe Entitas *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'klien' })}
                    className={`py-1.5 px-3 rounded font-semibold text-xs border transition ${
                      formData.type === 'klien'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Klien (Customer)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'supplier' })}
                    className={`py-1.5 px-3 rounded font-semibold text-xs border transition ${
                      formData.type === 'supplier'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Supplier (Quarry)
                  </button>
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-slate-600 font-semibold mb-1 text-[11px]">Nama Perusahaan / Quarry *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: PT Wijaya Karya / Quarry Merapi"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-white text-slate-900 border border-slate-300 rounded focus:outline-none focus:border-blue-600"
                />
              </div>

              {/* Address */}
              <div>
                <label className="block text-slate-600 font-semibold mb-1 text-[11px]">Alamat Lengkap *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Contoh: Proyek Tol JORR 2 Seksi 4 / Kawasan Lereng Merapi Muntilan"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-white text-slate-900 border border-slate-300 rounded focus:outline-none focus:border-blue-600 resize-none"
                />
              </div>

              {/* PIC and Phone */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1 text-[11px]">PIC / Kontak Person</label>
                  <input
                    type="text"
                    placeholder="Contoh: Bpk. Hendra"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white text-slate-900 border border-slate-300 rounded focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1 text-[11px]">No. Telepon / HP</label>
                  <input
                    type="text"
                    placeholder="0812-3456-7890"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white text-slate-900 border border-slate-300 rounded focus:outline-none focus:border-blue-600 font-mono"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-slate-600 font-semibold mb-1 text-[11px]">Catatan Tambahan</label>
                <input
                  type="text"
                  placeholder="Contoh: Term pembayaran 14 hari"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-white text-slate-900 border border-slate-300 rounded focus:outline-none focus:border-blue-600"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded transition shadow-2xs"
                >
                  {editingItem ? 'Simpan Perubahan' : 'Tambah Entitas'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
