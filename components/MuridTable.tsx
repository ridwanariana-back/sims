"use client";

import { useState } from "react";
import { 
  Search, Trash2, Edit, ChevronLeft, ChevronRight, Filter, X 
} from "lucide-react";
import Image from "next/image";
import { deleteMurid, updateMurid } from "@/lib/actions";

export default function MuridTable({ initialData }: { initialData: any[] }) {
  // State untuk Filtering dan Pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [filterKelas, setFilterKelas] = useState("Semua");
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);
  
  // State untuk Modal Edit
  const [editingMurid, setEditingMurid] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Logika Filter
  const filteredData = initialData.filter((m) => {
    const matchSearch = m.nama.toLowerCase().includes(searchTerm.toLowerCase()) || m.nisn.includes(searchTerm);
    const matchKelas = filterKelas === "Semua" || m.kelas === filterKelas;
    return matchSearch && matchKelas;
  });

  // Logika Pagination
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const indexOfLastItem = currentPage * rowsPerPage;
  const indexOfFirstItem = indexOfLastItem - rowsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const res = await updateMurid(editingMurid.id, formData);
    if (res.success) {
      setEditingMurid(null);
      alert("Data murid berhasil diperbarui!");
    } else {
      alert(res.error);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      {/* Control Bar */}
      <div className="flex flex-col lg:flex-row justify-between gap-4">
        <div className="flex items-center gap-3">
          <select 
            value={rowsPerPage}
            onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
            className="border p-2 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            {[5, 10, 20, 50].map(n => <option key={n} value={n}>Show {n}</option>)}
          </select>
          <div className="flex items-center gap-2 bg-white border border-gray-200 px-3 py-2 rounded-lg">
            <Filter size={14} className="text-gray-400" />
            <select 
              value={filterKelas}
              onChange={(e) => { setFilterKelas(e.target.value); setCurrentPage(1); }}
              className="text-sm outline-none bg-transparent font-medium text-slate-600"
            >
              <option value="Semua">Semua Kelas</option>
              <option value="X">Kelas X</option>
              <option value="XI">Kelas XI</option>
              <option value="XII">Kelas XII</option>
            </select>
          </div>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input 
            type="text" placeholder="Cari Nama atau NISN..." 
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          />
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center w-24">Foto</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Identitas</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Kelas</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {currentItems.length > 0 ? (
                currentItems.map((m) => (
                  <tr key={m.id} className="hover:bg-blue-50/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="relative h-14 w-12 mx-auto rounded-lg overflow-hidden border border-gray-200 bg-slate-100 shadow-sm">
                        <Image src={`/murid/${m.foto || 'default.png'}`} alt={m.nama} fill className="object-cover" />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-700">{m.nama}</span>
                        <span className="text-[10px] text-slate-400 uppercase font-medium">{m.nisn} | {m.jenis_kelamin}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-md text-[11px] font-bold">{m.kelas}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => setEditingMurid(m)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit size={16} /></button>
                        <button onClick={() => confirm(`Hapus ${m.nama}?`) && deleteMurid(m.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-400 italic text-sm">Data murid tidak ditemukan...</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION BAR (KEMBALI HADIR) */}
        <div className="p-4 bg-slate-50 border-t border-gray-100 flex justify-between items-center text-xs font-medium text-gray-500">
          <span>Halaman <span className="text-slate-800 font-bold">{currentPage}</span> dari {totalPages || 1}</span>
          <div className="flex gap-2">
            <button 
              disabled={currentPage === 1} 
              onClick={() => setCurrentPage(p => p - 1)} 
              className="p-2 border border-gray-200 rounded-lg bg-white disabled:opacity-50 hover:bg-gray-50 transition-all shadow-sm"
            >
              <ChevronLeft size={16} />
            </button>
            <button 
              disabled={currentPage === totalPages || totalPages === 0} 
              onClick={() => setCurrentPage(p => p + 1)} 
              className="p-2 border border-gray-200 rounded-lg bg-white disabled:opacity-50 hover:bg-gray-50 transition-all shadow-sm"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* MODAL EDIT MURID (SCROLLABLE) */}
      {editingMurid && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-2xl relative flex flex-col max-h-[90vh]">
            <div className="p-6 border-b">
              <button onClick={() => setEditingMurid(null)} className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"><X size={20} /></button>
              <h3 className="text-xl font-bold text-slate-800">Edit Data Murid</h3>
              <p className="text-sm text-slate-500">NISN: {editingMurid.nisn}</p>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <form id="edit-form" onSubmit={handleUpdate} className="space-y-4">
                <div className="flex justify-center mb-4">
                   <div className="relative h-28 w-24 rounded-lg overflow-hidden border-2 border-blue-100 shadow-sm">
                      <Image src={`/murid/${editingMurid.foto || 'default.png'}`} alt="Preview" fill className="object-cover" />
                   </div>
                </div>

                <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">NISN (Nomor Induk Siswa Nasional)</label>
                <input 
                    name="nisn" 
                    defaultValue={editingMurid.nisn} 
                    required 
                    className="w-full border p-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-blue-50/50 font-semibold" 
                />
                <p className="text-[10px] text-amber-600 mt-1 italic">*Pastikan NISN benar karena bersifat unik.</p>
                </div>

                <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
                <input 
                    name="nama" 
                    defaultValue={editingMurid.nama} 
                    required 
                    className="w-full border p-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" 
                />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Kelas</label>
                    <select name="kelas" defaultValue={editingMurid.kelas} className="w-full border p-2 rounded-lg bg-white">
                      <option value="X">Kelas X</option>
                      <option value="XI">Kelas XI</option>
                      <option value="XII">Kelas XII</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Agama</label>
                    <select name="agama" defaultValue={editingMurid.agama} className="w-full border p-2 rounded-lg bg-white">
                      <option value="Islam">Islam</option>
                      <option value="Kristen">Kristen</option>
                      <option value="Katolik">Katolik</option>
                      <option value="Hindu">Hindu</option>
                      <option value="Budha">Budha</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Jenis Kelamin</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="jenis_kelamin" value="Laki-laki" defaultChecked={editingMurid.jenis_kelamin === "Laki-laki"} className="w-4 h-4 text-blue-600" />
                      <span className="text-sm text-gray-600">Laki-laki</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="jenis_kelamin" value="Perempuan" defaultChecked={editingMurid.jenis_kelamin === "Perempuan"} className="w-4 h-4 text-blue-600" />
                      <span className="text-sm text-gray-600">Perempuan</span>
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tempat Lahir</label>
                    <input name="tempat_lahir" defaultValue={editingMurid.tempat_lahir} required className="w-full border p-2 rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Lahir</label>
                    <input name="tanggal_lahir" type="date" defaultValue={editingMurid.tanggal_lahir?.toString().split('T')[0]} required className="w-full border p-2 rounded-lg" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Alamat Lengkap</label>
                  <textarea name="alamat" defaultValue={editingMurid.alamat} rows={2} required className="w-full border p-2 rounded-lg"></textarea>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ganti Foto (Opsional)</label>
                  <input name="foto" type="file" accept="image/*" className="w-full text-xs text-gray-500" />
                </div>
              </form>
            </div>

            <div className="p-6 border-t flex gap-2">
              <button onClick={() => setEditingMurid(null)} className="flex-1 bg-gray-100 py-2.5 rounded-lg font-medium">Batal</button>
              <button form="edit-form" type="submit" disabled={loading} className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg font-bold">
                {loading ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}