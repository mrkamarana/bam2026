import React, { useState } from 'react';
import {
  Boxes,
  Plus,
  Search,
  Edit2,
  Trash2,
  TrendingUp,
  MapPin,
  Tag,
  Percent,
  X,
  Layers,
} from 'lucide-react';
import { MaterialItem, MaterialUnit } from '../types';
import { formatRupiah } from '../utils/formatters';

interface MaterialListProps {
  materials: MaterialItem[];
  onAdd: (item: Omit<MaterialItem, 'id'>) => void;
  onUpdate: (id: string, item: Partial<MaterialItem>) => void;
  onDelete: (id: string) => void;
}

export const MaterialList: React.FC<MaterialListProps> = ({
  materials,
  onAdd,
  onUpdate,
  onDelete,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MaterialItem | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    quarry: '',
    unit: 'm3' as MaterialUnit,
    destination: '',
    purchasePrice: 0,
    sellingPrice: 0,
    description: '',
  });

  const openAddModal = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      quarry: '',
      unit: 'm3',
      destination: '',
      purchasePrice: 150000,
      sellingPrice: 220000,
      description: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: MaterialItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      quarry: item.quarry,
      unit: item.unit,
      destination: item.destination,
      purchasePrice: item.purchasePrice,
      sellingPrice: item.sellingPrice,
      description: item.description || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.quarry.trim()) {
      alert('Nama Barang dan Sumber/Quarry wajib diisi!');
      return;
    }

    if (formData.sellingPrice <= 0 || formData.purchasePrice <= 0) {
      alert('Harga beli dan harga jual harus lebih besar dari 0!');
      return;
    }

    if (editingItem) {
      onUpdate(editingItem.id, formData);
    } else {
      onAdd(formData);
    }
    setIsModalOpen(false);
  };

  const filteredMaterials = materials.filter(
    (m) =>
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.quarry.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.destination.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-3">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white p-3 rounded border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <Boxes className="w-4 h-4 text-blue-600" />
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-tight">
              Daftar Barang (Material Konstruksi)
            </h2>
          </div>
          <p className="text-[11px] text-slate-500">
            Master material alam, sumber quarry penambangan, satuan unit volume, tujuan pengiriman & margin laba
          </p>
        </div>

        <button
          id="add-material-btn"
          onClick={openAddModal}
          className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded transition shadow-2xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Tambah Barang</span>
        </button>
      </div>

      {/* Table Cards */}
      <div className="bg-white border border-slate-200 rounded shadow-2xs overflow-hidden">
        <div className="p-2 sm:p-2.5 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="search-materials"
              type="text"
              placeholder="Cari nama barang, quarry, tujuan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1 bg-white text-slate-800 text-xs border border-slate-300 rounded focus:outline-none focus:border-blue-600"
            />
          </div>

          <div className="text-[11px] text-slate-500">
            Total Material: <span className="font-bold text-slate-800 font-mono">{filteredMaterials.length}</span> jenis
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="px-3 py-2">Nama Barang</th>
                <th className="px-3 py-2">Sumber / Quarry</th>
                <th className="px-3 py-2">Satuan Unit</th>
                <th className="px-3 py-2">Tujuan Pengiriman</th>
                <th className="px-3 py-2 text-right">Harga Beli / Unit</th>
                <th className="px-3 py-2 text-right">Harga Jual / Unit</th>
                <th className="px-3 py-2 text-right">Margin / Unit</th>
                <th className="px-3 py-2 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMaterials.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-3 py-6 text-center text-slate-400">
                    Belum ada material yang terdaftar.
                  </td>
                </tr>
              ) : (
                filteredMaterials.map((mat) => {
                  const marginRp = mat.sellingPrice - mat.purchasePrice;
                  const marginPct = mat.purchasePrice > 0 ? (marginRp / mat.purchasePrice) * 100 : 0;
                  return (
                    <tr key={mat.id} className="hover:bg-blue-50/50 transition-colors">
                      <td className="px-3 py-2 font-semibold text-slate-900">
                        <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0"></span>
                          <span>{mat.name}</span>
                        </div>
                        {mat.description && (
                          <div className="text-[10px] text-slate-500 font-normal ml-3">
                            {mat.description}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-slate-700">
                          <Layers className="w-3 h-3 text-blue-500" />
                          {mat.quarry}
                        </span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span className="px-1.5 py-0.2 rounded bg-slate-100 border border-slate-200 text-slate-700 font-mono text-[11px] font-bold">
                          {mat.unit}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-slate-600 max-w-xs truncate" title={mat.destination}>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{mat.destination || '-'}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-rose-600 font-medium whitespace-nowrap">
                        {formatRupiah(mat.purchasePrice)}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-emerald-700 font-bold whitespace-nowrap">
                        {formatRupiah(mat.sellingPrice)}
                      </td>
                      <td className="px-3 py-2 text-right whitespace-nowrap">
                        <div className="font-mono text-blue-700 font-bold">
                          +{formatRupiah(marginRp)}
                        </div>
                        <div className="text-[9px] text-slate-500 font-mono">
                          ({marginPct.toFixed(1)}%)
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            id={`edit-material-${mat.id}`}
                            onClick={() => openEditModal(mat)}
                            className="p-1 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded transition"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            id={`delete-material-${mat.id}`}
                            onClick={() => {
                              if (confirm(`Hapus material "${mat.name}"?`)) {
                                onDelete(mat.id);
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
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-lg max-w-lg w-full p-4 shadow-xl text-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="flex items-center gap-1.5 font-bold text-slate-800 text-sm">
                <Boxes className="w-4 h-4 text-blue-600" />
                <span>{editingItem ? 'Edit Barang Material' : 'Tambah Barang Material Baru'}</span>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Name */}
                <div>
                  <label className="block text-slate-600 font-semibold mb-1 text-[11px]">
                    Nama Barang Material *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Pasir Cor Pasang / Batu Split 1-2"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white text-slate-900 border border-slate-300 rounded focus:outline-none focus:border-blue-600"
                  />
                </div>

                {/* Quarry */}
                <div>
                  <label className="block text-slate-600 font-semibold mb-1 text-[11px]">
                    Sumber / Quarry Penambangan *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Quarry Merapi Muntilan / Rumpin"
                    value={formData.quarry}
                    onChange={(e) => setFormData({ ...formData, quarry: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white text-slate-900 border border-slate-300 rounded focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Unit */}
                <div>
                  <label className="block text-slate-600 font-semibold mb-1 text-[11px]">
                    Satuan Unit *
                  </label>
                  <select
                    value={formData.unit}
                    onChange={(e) =>
                      setFormData({ ...formData, unit: e.target.value as MaterialUnit })
                    }
                    className="w-full px-2.5 py-1.5 bg-white text-slate-900 border border-slate-300 rounded focus:outline-none focus:border-blue-600"
                  >
                    <option value="meter kubik">meter kubik (m3)</option>
                    <option value="ton">ton</option>
                    <option value="kilogram">kilogram (kg)</option>
                    <option value="rit / dump truck">rit / dump truck</option>
                  </select>
                </div>

                {/* Destination */}
                <div>
                  <label className="block text-slate-600 font-semibold mb-1 text-[11px]">
                    Tujuan Pengiriman Default
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Batching Plant Sentul / Tol JORR"
                    value={formData.destination}
                    onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white text-slate-900 border border-slate-300 rounded focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              {/* Prices */}
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded space-y-2">
                <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-blue-600" />
                  <span>Struktur Harga Satuan</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1 text-[10px]">
                      Harga Beli / Unit (Rp) *
                    </label>
                    <input
                      type="number"
                      required
                      min={1000}
                      step={1000}
                      value={formData.purchasePrice}
                      onChange={(e) =>
                        setFormData({ ...formData, purchasePrice: Number(e.target.value) })
                      }
                      className="w-full px-2.5 py-1.5 bg-white text-slate-900 font-mono font-bold border border-slate-300 rounded focus:outline-none focus:border-blue-600"
                    />
                    <div className="text-[10px] text-slate-500 mt-0.5 font-mono">
                      {formatRupiah(formData.purchasePrice)}
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1 text-[10px]">
                      Harga Jual / Unit (Rp) *
                    </label>
                    <input
                      type="number"
                      required
                      min={1000}
                      step={1000}
                      value={formData.sellingPrice}
                      onChange={(e) =>
                        setFormData({ ...formData, sellingPrice: Number(e.target.value) })
                      }
                      className="w-full px-2.5 py-1.5 bg-white text-emerald-700 font-mono font-bold border border-slate-300 rounded focus:outline-none focus:border-blue-600"
                    />
                    <div className="text-[10px] text-emerald-600 mt-0.5 font-mono">
                      {formatRupiah(formData.sellingPrice)}
                    </div>
                  </div>
                </div>

                {/* Profit Preview */}
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-600 text-[11px]">Estimasi Margin Bersih per Unit:</span>
                  <span className="font-mono text-blue-700">
                    {formatRupiah(formData.sellingPrice - formData.purchasePrice)} (
                    {formData.purchasePrice > 0
                      ? (
                          ((formData.sellingPrice - formData.purchasePrice) /
                            formData.purchasePrice) *
                          100
                        ).toFixed(1)
                      : 0}
                    %)
                  </span>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-slate-600 font-semibold mb-1 text-[11px]">
                  Spesifikasi Teknis / Keterangan
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Kadar lumpur < 3%, gradasi 1-2 mm tajam"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
                  {editingItem ? 'Simpan Perubahan' : 'Tambah Barang'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
