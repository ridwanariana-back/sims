"use client";

import { useState } from "react";
import { 
  Search, Trash2, Edit, ChevronLeft, ChevronRight, 
  X, Save, Calendar, Fingerprint, BadgeCheck, User2, Heart 
} from "lucide-react";
import { useRouter } from "next/navigation";

const DAFTAR_KELAS = ["X", "XI", "XII"];
const DAFTAR_ROMBEL = [
  "X.1", "X.2", "X.3", "X.4", "XI.F1", "XI.F2", "XI.F3", "XI.F4", "XII.F1", "XII.F2", "XII.F3", "XII.F4"
];

export default function MuridTable({ initialData }: { initialData: any[] }) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  const [editingMurid, setEditingMurid] = useState<any>(null); // State untuk Modal Edit
  const [loading, setLoading] = useState(false);

  const filteredMurid = initialData.filter((m) =>
    m.nama.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.nisn.includes(searchTerm)
  );

  const totalPages = Math.ceil(filteredMurid.length / rowsPerPage);
  const currentItems = filteredMurid.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  // --- FUNGSI HAPUS ---
  const handleDelete = async (id: number) => {
    if (confirm("Apakah Anda yakin ingin menghapus data murid ini secara permanen?")) {
      setLoading(true);
      const res = await fetch(`/api/murid?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        router.refresh();
      } else {
        alert("Gagal menghapus data");
      }
      setLoading(false);
    }
  };

  // --- FUNGSI SIMPAN EDIT ---
  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    const res = await fetch(`/api/murid`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: editingMurid.id, ...data }),
    });

    if (res.ok) {
      setEditingMurid(null);
      router.refresh();
    } else {
      alert("Gagal memperbarui data");
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Search & Rows Per Page (Sesuai Gambar) */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <select 
            value={rowsPerPage} 
            onChange={(e) => {setRowsPerPage(Number(e.target.value)); setCurrentPage(1)}} 
            className="border-2 rounded-xl p-2 text-sm font-black text-slate-900 outline-none"
          >
            {[10, 20, 50].map((num) => <option key={num} value={num}>Show {num}</option>)}
          </select>
          <div className="text-sm text-slate-900 font-black uppercase tracking-tighter">
            Total <span className="text-blue-600">{filteredMurid.length}</span> Siswa
          </div>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
          <input 
            type="text" 
            placeholder="Cari Nama atau NISN..." 
            className="w-full pl-12 pr-4 py-3 border-2 rounded-2xl outline-none font-black text-slate-900" 
            value={searchTerm} 
            onChange={(e) => {setSearchTerm(e.target.value); setCurrentPage(1)}} 
          />
        </div>
      </div>

      {/* Tabel */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Identitas Siswa</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Detail Administrasi</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Keluarga & Lahir</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Kelas / Rombel</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentItems.map((murid) => (
                <tr key={murid.id} className="hover:bg-slate-50 transition-all">
                  <td className="px-6 py-6 align-top">
                    <div className="font-black text-slate-900 text-sm leading-tight uppercase mb-1">{murid.nama}</div>
                    <div className="flex items-center gap-1 text-[10px] font-black text-slate-400 uppercase">
                      <User2 size={12} /> {murid.gender}
                    </div>
                  </td>
                  <td className="px-6 py-6 align-top">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-[11px] font-black text-slate-900 uppercase">
                        <Fingerprint size={14} className="text-blue-500" /> NISN: {murid.nisn}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] font-black text-slate-900 uppercase">
                        <BadgeCheck size={14} className="text-slate-400" /> NIK: {murid.nik || "-"}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-6 align-top text-[11px] font-black uppercase text-slate-900">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-slate-400">IBU:</span> {murid.nama_ibu}
                    </div>
                    <div className="flex items-center gap-2 text-slate-500">
                      <Calendar size={14} /> {new Date(murid.tanggal_lahir).toLocaleDateString('id-ID')}
                    </div>
                  </td>
                  <td className="px-6 py-6 text-center align-top">
                    <div className="inline-flex flex-col items-center">
                       <div className="text-[9px] font-black text-slate-900 bg-blue-100 px-2 rounded mb-1 uppercase">Kelas {murid.kelas}</div>
                       <div className="bg-slate-900 text-white px-4 py-1.5 rounded-xl text-xs font-black border-2 border-slate-800 uppercase">{murid.rombel}</div>
                    </div>
                  </td>
                  <td className="px-6 py-6 text-center align-top">
                    <div className="flex justify-center gap-2">
                      <button 
                        onClick={() => setEditingMurid(murid)}
                        className="p-2.5 bg-white border-2 border-slate-100 text-amber-600 hover:border-amber-600 rounded-xl transition-all"
                      >
                        <Edit size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(murid.id)}
                        className="p-2.5 bg-white border-2 border-slate-100 text-red-600 hover:border-red-600 rounded-xl transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- MODAL EDIT (Muncul saat tombol pensil diklik) --- */}
      {editingMurid && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 text-left">
          <div className="bg-white rounded-3xl p-8 w-full max-w-2xl shadow-2xl relative max-h-[90vh] overflow-y-auto border-4 border-white">
            <button onClick={() => setEditingMurid(null)} className="absolute right-6 top-6 text-gray-400"><X size={24} /></button>
            <div className="mb-8">
              <h3 className="text-2xl font-black text-slate-900 uppercase flex items-center gap-3">
                <Edit className="text-amber-600" size={28} /> Edit Data Murid
              </h3>
            </div>
            <form onSubmit={handleEditSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2 space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase">Nama Lengkap</label>
                <input name="nama" defaultValue={editingMurid.nama} required className="w-full border-2 p-3.5 rounded-xl font-black text-slate-900 uppercase bg-slate-50" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase">NISN</label>
                <input name="nisn" defaultValue={editingMurid.nisn} required className="w-full border-2 p-3.5 rounded-xl font-black text-slate-900 bg-slate-50" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase">NIK</label>
                <input name="nik" defaultValue={editingMurid.nik} className="w-full border-2 p-3.5 rounded-xl font-black text-slate-900 bg-slate-50" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase">Gender</label>
                <select name="gender" defaultValue={editingMurid.gender} className="w-full border-2 p-3.5 rounded-xl font-black bg-white">
                  <option value="LAKI-LAKI">LAKI-LAKI</option>
                  <option value="PEREMPUAN">PEREMPUAN</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase">Tgl Lahir</label>
                <input 
                name="tanggal_lahir" 
                type="date" 
                defaultValue={
                  editingMurid.tanggal_lahir 
                    ? new Date(editingMurid.tanggal_lahir).toISOString().split('T')[0] 
                    : ""
                } 
                required 
                className="w-full border-2 p-3.5 rounded-xl font-black outline-none focus:border-amber-600 transition-all" 
              />
              </div>
              <div className="md:col-span-2 space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase">Nama Ibu</label>
                <input name="nama_ibu" defaultValue={editingMurid.nama_ibu} required className="w-full border-2 p-3.5 rounded-xl font-black uppercase bg-slate-50" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase">Kelas</label>
                <select name="kelas" defaultValue={editingMurid.kelas} className="w-full border-2 p-3.5 rounded-xl font-black">
                  {DAFTAR_KELAS.map(k => <option key={k} value={k}>{k}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase">Rombel</label>
                <select name="rombel" defaultValue={editingMurid.rombel} className="w-full border-2 p-3.5 rounded-xl font-black">
                  {DAFTAR_ROMBEL.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="flex gap-4 pt-6 md:col-span-2">
                <button type="button" onClick={() => setEditingMurid(null)} className="flex-1 bg-slate-100 py-4 rounded-2xl font-black text-slate-600 uppercase text-xs">Batal</button>
                <button type="submit" disabled={loading} className="flex-[2] bg-amber-600 text-white py-4 rounded-2xl font-black hover:bg-amber-700 flex items-center justify-center gap-2 uppercase text-xs">
                  <Save size={18} /> {loading ? "Menyimpan..." : "Update Data"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}