"use client";

import { useState } from "react";
import { 
  Search, Trash2, Edit, ChevronLeft, ChevronRight, 
  X, Save, Calendar, Fingerprint, BadgeCheck, User2 
} from "lucide-react";
import { DAFTAR_MAPEL } from "./AddGuruModal";
import { deleteGuru, updateGuru } from "@/lib/actions";
import { useRouter } from "next/navigation";

export default function GuruTable({ initialData }: { initialData: any[] }) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // States untuk modal edit
  const [editingGuru, setEditingGuru] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // 1. Filter Data
  const filteredGuru = initialData.filter((guru) =>
    guru.nama.toLowerCase().includes(searchTerm.toLowerCase()) || 
    guru.nip.includes(searchTerm)
  );

  // 2. Pagination Logic
  const totalPages = Math.ceil(filteredGuru.length / rowsPerPage);
  const currentItems = filteredGuru.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  // 3. Fungsi Hapus (Delete Guru + User secara otomatis)
  const handleDelete = async (id: number) => {
    if (confirm("PERHATIAN: Menghapus data ini akan menghapus AKUN LOGIN guru terkait. Lanjutkan?")) {
      setLoading(true);
      const res = await deleteGuru(id);
      if (res.success) {
        alert("Data Guru dan Akun User berhasil dihapus!");
        router.refresh();
      } else {
        alert(res.error);
      }
      setLoading(false);
    }
  };

  // 4. Fungsi Update (Edit)
  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const res = await updateGuru(editingGuru.id, formData);
    
    if (res.success) {
      setEditingGuru(null);
      router.refresh();
    } else {
      alert(res.error);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Search & Rows Per Page */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <select 
            value={rowsPerPage} 
            onChange={(e) => {setRowsPerPage(Number(e.target.value)); setCurrentPage(1)}} 
            className="border-2 rounded-xl p-2 text-sm font-black outline-none focus:border-blue-500 text-slate-900"
          >
            {[5, 10, 20, 50].map((num) => <option key={num} value={num}>Show {num}</option>)}
          </select>
          <div className="text-sm text-slate-900 font-black uppercase tracking-tighter">
            Total <span className="text-blue-600">{filteredGuru.length}</span> Personel
          </div>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
          <input 
            type="text" 
            placeholder="Cari Nama atau NIP..." 
            className="w-full pl-12 pr-4 py-3 border-2 rounded-2xl outline-none focus:border-blue-500 transition-all shadow-sm font-black text-slate-900" 
            value={searchTerm} 
            onChange={(e) => {setSearchTerm(e.target.value); setCurrentPage(1)}} 
          />
        </div>
      </div>

      {/* Table Main Container */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Pendidik</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Identitas Lengkap</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status & Mapel</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Wali Kelas</th>
            </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentItems.map((guru) => (
                <tr key={guru.id} className="hover:bg-slate-50 transition-all group">
                  {/* KOLOM PENDIDIK */}
                  <td className="px-6 py-6 align-top">
                    <div className="font-black text-slate-900 text-sm leading-tight uppercase mb-1">{guru.nama}</div>
                    <div className="inline-block px-2 py-0.5 bg-blue-600 text-white text-[9px] font-black rounded uppercase tracking-tighter shadow-sm shadow-blue-200">
                      {guru.jenis}
                    </div>
                  </td>

                  {/* KOLOM IDENTITAS (Grid) */}
                  <td className="px-6 py-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 min-w-[300px]">
                      <div className="flex items-center gap-2">
                        <Fingerprint size={14} className="text-blue-500" />
                        <span className="text-[11px] font-black text-slate-900 uppercase">NIP: {guru.nip}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <BadgeCheck size={14} className="text-slate-400" />
                        <span className="text-[11px] font-black text-slate-900 uppercase">NIK: {guru.nik || "-"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <BadgeCheck size={14} className="text-slate-400" />
                        <span className="text-[11px] font-black text-slate-900 uppercase">NUPTK: {guru.nuptk || "-"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-slate-400" />
                        <span className="text-[11px] font-black text-slate-900 uppercase">
                          Lahir: {guru.tgl_lahir ? new Date(guru.tgl_lahir).toLocaleDateString('id-ID') : "-"}
                        </span>
                      </div>
                      <div className="col-span-2 mt-1 py-1 px-2 bg-slate-50 rounded-lg border border-slate-100">
                         <span className="text-[10px] font-black text-slate-500 uppercase italic">Sekolah Induk: </span>
                         <span className="text-[10px] font-black text-slate-900 uppercase ml-1">
                           {guru.sekolah_induk === "Ya" ? "YA" : "TIDAK"}
                         </span>
                      </div>
                    </div>
                  </td>

                  {/* KOLOM STATUS */}
                  <td className="px-6 py-6 align-top">
                    <div className="text-sm font-black text-slate-900 uppercase leading-none">{guru.status}</div>
                    <div className="text-[11px] text-blue-800 font-black mt-1 leading-tight">{guru.mapel}</div>
                    <div className="mt-2 flex items-center gap-1 text-[9px] font-black text-slate-400 uppercase tracking-tighter">
                       <User2 size={10} /> {guru.gender}
                    </div>
                  </td>

                  {/* KOLOM WALI KELAS (Read Only) */}
                  <td className="px-6 py-6 align-top">
                    {/* Sekarang membaca field wali_kelas_rombel hasil JOIN */}
                    {guru.wali_kelas_rombel ? (
                      <div className="flex flex-col items-start gap-1">
                        <span className="text-[9px] font-black text-slate-900 uppercase bg-yellow-400 px-1 rounded">
                          Tugas Tambahan
                        </span>
                        <span className="bg-slate-900 text-white px-3 py-1.5 rounded-xl text-xs font-black border-2 border-slate-800 shadow-sm">
                          KELAS {guru.wali_kelas_rombel}
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-300 text-[10px] font-black italic uppercase tracking-widest">
                        Non-Wali
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-6 py-5 bg-slate-50 flex items-center justify-between border-t border-slate-200">
          <div className="text-xs text-slate-900 font-black uppercase tracking-tighter">
            Halaman <span className="text-blue-600">{currentPage}</span> Dari {totalPages || 1}
          </div>
          <div className="flex gap-2">
            <button 
              disabled={currentPage === 1} 
              onClick={() => setCurrentPage(prev => prev - 1)} 
              className="p-2 bg-white border-2 rounded-xl disabled:opacity-30 hover:bg-slate-900 hover:text-white transition-all text-slate-900 font-bold"
            >
              <ChevronLeft size={20} />
            </button>
            <button 
              disabled={currentPage === totalPages || totalPages === 0} 
              onClick={() => setCurrentPage(prev => prev + 1)} 
              className="p-2 bg-white border-2 rounded-xl disabled:opacity-30 hover:bg-slate-900 hover:text-white transition-all text-slate-900 font-bold"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}