"use client";

import { useState } from "react";
import { Search, Trash2, Edit, X, ChevronLeft, ChevronRight } from "lucide-react";
import { deleteGuru, updateGuru } from "@/lib/actions";

const DAFTAR_MAPEL = [
  "Matematika", "Bahasa Indonesia", "Bahasa Inggris", "IPA", "IPS", "PJOK", "Seni Budaya", "Informatika"
];

export default function GuruTable({ initialData }: { initialData: any[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [editingGuru, setEditingGuru] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // --- STATE PAGINATION ---
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5); // Default 5 baris

  // 1. Filter Data
  const filteredGuru = initialData.filter((guru) =>
    guru.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
    guru.nip.includes(searchTerm)
  );

  // 2. Logika Pagination
  const totalPages = Math.ceil(filteredGuru.length / rowsPerPage);
  const indexOfLastItem = currentPage * rowsPerPage;
  const indexOfFirstItem = indexOfLastItem - rowsPerPage;
  const currentItems = filteredGuru.slice(indexOfFirstItem, indexOfLastItem);

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const res = await updateGuru(editingGuru.id, formData);
    if (res.success) setEditingGuru(null);
    else alert(res.error);
    setLoading(false);
  };

  const handleDelete = async (id: number) => {
    if (confirm("Apakah Anda yakin ingin menghapus data guru ini?")) {
      const res = await deleteGuru(id);
      if (!res.success) alert(res.error);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Bar & Show Per Page */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <select 
            value={rowsPerPage}
            onChange={(e) => {
              setRowsPerPage(Number(e.target.value));
              setCurrentPage(1); // Reset ke halaman 1 jika limit berubah
            }}
            className="border border-gray-200 rounded-lg p-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            {[5, 10, 20, 50].map((num) => (
              <option key={num} value={num}>Show {num}</option>
            ))}
          </select>
          <div className="text-sm text-gray-500">
            Total <span className="font-bold text-gray-800">{filteredGuru.length}</span> Guru
          </div>
        </div>
        
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Cari Nama atau NIP..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1); // Reset ke hal 1 saat mengetik
            }}
          />
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">NIP</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Nama Lengkap</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Gender</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Mata Pelajaran</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {currentItems.length > 0 ? (
                currentItems.map((guru) => (
                  <tr key={guru.id} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="px-6 py-4 text-sm font-medium text-slate-700">{guru.nip}</td>
                    <td className="px-6 py-4 text-sm text-slate-600 font-semibold">{guru.nama}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">{guru.gender || "-"}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">
                        {guru.mapel}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => setEditingGuru(guru)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"><Edit size={18} /></button>
                        <button onClick={() => handleDelete(guru.id)} className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"><Trash2 size={18} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-400 italic">Data tidak ditemukan...</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* --- FOOTER PAGINATION --- */}
        <div className="px-6 py-4 bg-slate-50 border-t border-gray-100 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Halaman <span className="font-medium text-gray-800">{currentPage}</span> dari <span className="font-medium text-gray-800">{totalPages || 1}</span>
          </div>
          <div className="flex gap-2">
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => prev - 1)}
              className="p-2 border rounded-lg bg-white hover:bg-gray-50 disabled:opacity-50 transition-all"
            >
              <ChevronLeft size={18} />
            </button>
            <button 
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => setCurrentPage(prev => prev + 1)}
              className="p-2 border rounded-lg bg-white hover:bg-gray-50 disabled:opacity-50 transition-all"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* MODAL EDIT (Tetap Sama Seperti Sebelumnya) */}
      {editingGuru && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl relative">
            <button onClick={() => setEditingGuru(null)} className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"><X size={20} /></button>
            <h3 className="text-xl font-bold mb-4">Edit Data Guru</h3>
            <form onSubmit={handleUpdate} className="space-y-4">
              <input name="nip" defaultValue={editingGuru.nip} required className="w-full border p-2 rounded-lg" />
              <input name="nama" defaultValue={editingGuru.nama} required className="w-full border p-2 rounded-lg" />
              <div className="flex gap-4 p-2 border rounded-lg">
                <label className="text-sm"><input type="radio" name="gender" value="Laki-laki" defaultChecked={editingGuru.gender === "Laki-laki"} /> Laki-laki</label>
                <label className="text-sm"><input type="radio" name="gender" value="Perempuan" defaultChecked={editingGuru.gender === "Perempuan"} /> Perempuan</label>
              </div>
              <select name="mapel" defaultValue={editingGuru.mapel} required className="w-full border p-2 rounded-lg">
                {DAFTAR_MAPEL.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <div className="flex gap-2 pt-4">
                <button type="button" onClick={() => setEditingGuru(null)} className="flex-1 bg-gray-100 py-2 rounded-lg">Batal</button>
                <button type="submit" disabled={loading} className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-bold">
                  {loading ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}