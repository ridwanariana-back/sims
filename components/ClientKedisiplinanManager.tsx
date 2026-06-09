// components/ClientKedisiplinanManager.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Search, Plus, ChevronLeft, ChevronRight, UserX, Calendar, Loader2, X, Pencil, Trash2 
} from "lucide-react";
import { 
  getCatatanKedisiplinanWithSchool,
  saveCatatanKedisiplinanWithSchool,
  getMuridByKelasWithSchool,
  deleteCatatanKedisiplinanWithSchool,
  updateCatatanKedisiplinanWithSchool
} from "@/lib/actions";

interface ClientKedisiplinanProps {
  guruId: number;
  sekolahId: number;
  kelasWali: string;
  tahunAjaran: string;
}

export default function ClientKedisiplinanManager({ guruId, sekolahId, kelasWali, tahunAjaran }: ClientKedisiplinanProps) {
  const [data, setData] = useState<any[]>([]);
  const [listMurid, setListMurid] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [formData, setFormData] = useState({
    murid_id: "",
    kategori: "Kedisiplinan",
    keterangan: ""
  });

  const refreshData = useCallback(async () => {
    setLoading(true);
    try {
      const [resCatatan, resMurid] = await Promise.all([
        getCatatanKedisiplinanWithSchool(guruId, sekolahId),
        getMuridByKelasWithSchool(kelasWali, sekolahId)
      ]);

      if (resCatatan.success && Array.isArray(resCatatan.data)) {
        setData(resCatatan.data);
      } else {
        setData([]);
      }

      if (Array.isArray(resMurid)) {
        setListMurid(resMurid);
      } else {
        setListMurid([]);
      }
    } catch (err) {
      console.error("Gagal memuat data kedisiplinan:", err);
    } finally {
      setLoading(false);
    }
  }, [guruId, sekolahId, kelasWali]);

  useEffect(() => { 
    refreshData(); 
  }, [refreshData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.murid_id || !formData.kategori || !formData.keterangan) {
      return alert("Semua bidang wajib diisi!");
    }

    setSubmitting(true);
    try {
      let res: any;
      if (editId) {
        res = await updateCatatanKedisiplinanWithSchool(editId, sekolahId, {
          kategori: formData.kategori,
          keterangan: formData.keterangan
        });
      } else {
        res = await saveCatatanKedisiplinanWithSchool({
          murid_id: parseInt(formData.murid_id, 10),
          guru_id: guruId,
          sekolah_id: sekolahId,
          kategori: formData.kategori,
          keterangan: formData.keterangan,
          tahun_ajaran: tahunAjaran
        });
      }

      if (res.success) {
        alert(editId ? "Catatan berhasil diperbarui!" : "Catatan berhasil disimpan!");
        setIsModalOpen(false);
        setFormData({ murid_id: "", kategori: "Kedisiplinan", keterangan: "" });
        setEditId(null);
        await refreshData(); 
      } else {
        alert("Gagal menyimpan data: " + res.error);
      }
    } catch (error: any) {
      console.error("Error submitting form:", error);
      alert("Terjadi kesalahan sistem.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (item: any) => {
    setEditId(item.id);
    setFormData({
      murid_id: item.murid_id.toString(),
      kategori: item.kategori,
      keterangan: item.keterangan
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm("Hapus catatan ini?")) {
      const res = await deleteCatatanKedisiplinanWithSchool(id, sekolahId);
      if (res.success) {
        alert("Catatan berhasil dihapus!");
        await refreshData();
      } else {
        alert("Gagal menghapus catatan: " + (res.error || "Terjadi kesalahan"));
      }
    }
  };
  
  const filteredData = data.filter(item => {
    const namaSiswa = item.nama_murid || item.nama || "";
    const ketKasus = item.keterangan || "";
    return (
      namaSiswa.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ketKasus.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-6 text-left">
      {/* FILTER & INTERACTION SECTION */}
      <div className="bg-white border-b-4 border-slate-900 p-8 rounded-t-[2.5rem] shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text" 
            placeholder="Cari nama atau kasus..." 
            className="pl-10 pr-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl text-xs font-bold focus:border-rose-500 outline-none w-full transition-all"
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          />
        </div>
        <button 
          onClick={() => { setEditId(null); setFormData({ murid_id: "", kategori: "Kedisiplinan", keterangan: "" }); setIsModalOpen(true); }}
          className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-black uppercase text-[10px] flex items-center gap-2 transition-all active:scale-95 w-full md:w-auto justify-center shadow-md"
        >
          <Plus size={16} /> Catat Kasus
        </button>
      </div>

      {/* TABLE DATA CONTAINER */}
      <div className="bg-white rounded-b-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
          <select 
            value={itemsPerPage} 
            onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
            className="bg-white border-2 border-slate-200 rounded-lg px-3 py-1 text-[10px] font-black uppercase outline-none focus:border-slate-900"
          >
            <option value={10}>Show 10</option>
            <option value={25}>Show 25</option>
            <option value={50}>Show 50</option>
          </select>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total {filteredData.length} Catatan</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900">
                <th className="px-6 py-4 text-[10px] font-black text-white uppercase tracking-widest border-r border-white/10">Siswa</th>
                <th className="px-6 py-4 text-[10px] font-black text-white uppercase tracking-widest border-r border-white/10 text-center">Tanggal</th>
                <th className="px-6 py-4 text-[10px] font-black text-white uppercase tracking-widest border-r border-white/10">Kategori</th>
                <th className="px-6 py-4 text-[10px] font-black text-white uppercase tracking-widest border-r border-white/10">Keterangan</th>
                <th className="px-6 py-4 text-[10px] font-black text-white uppercase tracking-widest text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                 <tr><td colSpan={5} className="py-20 text-center animate-pulse font-bold text-slate-400 uppercase text-xs">Mengambil Data Pelanggaran...</td></tr>
              ) : paginatedData.length > 0 ? paginatedData.map((item) => (
                <tr key={item.id} className="hover:bg-rose-50/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 group-hover:bg-rose-100 group-hover:text-rose-600 transition-colors border border-transparent group-hover:border-rose-200">
                        <UserX size={14} />
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-900 uppercase leading-none">{item.nama_murid}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase mt-1 italic">NISN: {item.nisn}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-full text-slate-600">
                      <Calendar size={10} />
                      <span className="text-[10px] font-black uppercase">{item.created_at ? new Date(item.created_at).toLocaleDateString('id-ID', {day: '2-digit', month:'short', year:'numeric'}) : "-"}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[10px] font-black uppercase text-rose-600 bg-rose-50 px-3 py-1 rounded-lg border border-rose-100">
                      {item.kategori}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs font-medium text-slate-600 line-clamp-2 max-w-xs italic">"{item.keterangan}"</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button 
                        onClick={() => handleEdit(item)}
                        className="p-2 bg-amber-50 text-amber-600 rounded-lg border border-amber-100 hover:bg-amber-600 hover:text-white transition-all"
                      >
                        <Pencil size={14} />
                      </button>
                      <button 
                        onClick={() => handleDelete(item.id)}
                        className="p-2 bg-rose-50 text-rose-600 rounded-lg border border-rose-100 hover:bg-rose-600 hover:text-white transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                 <tr><td colSpan={5} className="py-20 text-center font-bold text-slate-400 uppercase text-xs italic">Belum ada catatan pelanggaran siswa.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION PANEL */}
        <div className="px-8 py-6 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
          <p className="text-[10px] font-bold text-slate-500 uppercase italic">Halaman {currentPage} dari {totalPages || 1}</p>
          <div className="flex items-center gap-2">
            <button disabled={currentPage === 1 || loading} onClick={() => setCurrentPage(prev => prev - 1)} className="p-2 bg-white border-2 border-slate-200 rounded-lg disabled:opacity-50 hover:text-rose-600 transition-all"><ChevronLeft size={16} /></button>
            <button disabled={currentPage === totalPages || totalPages === 0 || loading} onClick={() => setCurrentPage(prev => prev + 1)} className="p-2 bg-white border-2 border-slate-200 rounded-lg disabled:opacity-50 hover:text-rose-600 transition-all"><ChevronRight size={16} /></button>
          </div>
        </div>
      </div>

      {/* INPUT / EDIT MODAL DOCK */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] border-4 border-slate-900 overflow-hidden animate-in fade-in zoom-in duration-200 my-auto">
            <div className="bg-rose-600 p-6 border-b-4 border-slate-900 flex justify-between items-center">
              <h2 className="text-white font-black uppercase tracking-widest text-lg">{editId ? 'Edit Catatan' : 'Input Catatan'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-white/80 hover:text-white"><X size={24} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Pilih Murid</label>
                <select 
                  required
                  disabled={!!editId}
                  className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl text-xs font-bold focus:border-rose-500 outline-none disabled:opacity-50 appearance-none"
                  value={formData.murid_id}
                  onChange={(e) => setFormData({...formData, murid_id: e.target.value})}
                >
                  <option value="">-- Pilih Nama Murid --</option>
                  {listMurid.map((m: any) => (
                    <option key={m.id} value={m.id}>{m.nama.toUpperCase()}[NISN: {m.nisn}]</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Kategori Masalah</label>
                <div className="grid grid-cols-2 gap-2">
                  {['Kedisiplinan', 'Kerajinan', 'Kebersihan', 'Lainnya'].map((kat) => (
                    <button key={kat} type="button" onClick={() => setFormData({...formData, kategori: kat})}
                      className={`p-3 rounded-xl border-2 text-[10px] font-black uppercase transition-all ${formData.kategori === kat ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-rose-200'}`}>
                      {kat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Detail Keterangan</label>
                <textarea required rows={4} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-xs font-bold focus:border-rose-500 outline-none transition-all resize-none"
                  value={formData.keterangan} onChange={(e) => setFormData({...formData, keterangan: e.target.value})} />
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 bg-slate-100 text-slate-400 rounded-2xl font-black uppercase text-[10px] hover:bg-slate-200 transition-all">Batal</button>
                <button type="submit" disabled={submitting} className="flex-[2] py-4 bg-rose-600 text-white rounded-2xl font-black uppercase text-[10px] border-2 border-slate-900 hover:bg-rose-700 transition-all flex items-center justify-center gap-2">
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : (editId ? 'Simpan Perubahan' : 'Simpan Catatan')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}