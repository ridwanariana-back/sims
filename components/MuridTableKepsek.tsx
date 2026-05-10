"use client";

import { useState } from "react";
import { 
  Search, Trash2, Edit, ChevronLeft, ChevronRight, 
  X, Save, Calendar, Fingerprint, BadgeCheck, User2, Heart 
} from "lucide-react";
import { useRouter } from "next/navigation";

const DAFTAR_KELAS = ["X", "XI", "XII"];
const ROMBEL_PER_KELAS: Record<string, string[]> = {
  "X": ["X.1", "X.2", "X.3", "X.4"],
  "XI": ["XI.F1", "XI.F2", "XI.F3", "XI.F4"],
  "XII": ["XII.F1", "XII.F2", "XII.F3", "XII.F4"]
};

export default function MuridTable({ initialData }: { initialData: any[] }) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  const [editingMurid, setEditingMurid] = useState<any>(null); // State untuk Modal Edit
  const [loading, setLoading] = useState(false);
  const [tempKelas, setTempKelas] = useState<string>("");

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

  const handleEditClick = (murid: any) => {
    setEditingMurid(murid);
    setTempKelas(murid.kelas); // Set kelas awal sesuai data murid
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
        
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}