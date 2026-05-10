"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { getRiwayatInputNilai } from "@/lib/actions";
import { 
  NotebookText, Search, BookOpen, User, 
  ChevronRight, ChevronLeft, ClipboardCheck 
} from "lucide-react";

export default function RiwayatNilaiPage() {
  const { data: session } = useSession();
  const [riwayat, setRiwayat] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  
  // STATE PAGINATION
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5; // Kamu bisa ubah limit per page di sini

  useEffect(() => {
    if (session?.user?.id) {
      getRiwayatInputNilai(Number(session.user.id)).then(setRiwayat);
    }
  }, [session]);

  // Reset ke halaman 1 jika user mencari sesuatu
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const filteredData = riwayat.filter(item => 
    item.nama_murid.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.mapel.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // LOGIKA PAGINATION
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  return (
    <div className="space-y-6 p-2">
      {/* HEADER SECTION (Tetap Sama) */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-indigo-600 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-indigo-100">
            <NotebookText size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none">Riwayat Input Nilai</h1>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-2 italic">Arsip seluruh nilai yang pernah Anda berikan</p>
          </div>
        </div>
        
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Cari Nama Murid atau Mapel..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 pr-6 py-4 bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl w-full md:w-80 outline-none font-bold text-sm transition-all"
          />
        </div>
      </div>

      {/* STATS */}
      <div className="flex items-center gap-4 px-4">
        <div className="bg-white border border-slate-200 px-6 py-3 rounded-2xl flex items-center gap-3 shadow-sm">
          <ClipboardCheck size={16} className="text-emerald-500" />
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Total Record:</span>
          <span className="text-sm font-black text-slate-900">{filteredData.length} Entry</span>
        </div>
      </div>

      {/* TABLE SECTION */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-slate-100">
                <th className="px-8 py-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Siswa & Periode</th>
                <th className="px-8 py-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Mata Pelajaran</th>
                <th className="px-8 py-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Proses (H / M / U)</th>
                <th className="px-8 py-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Nilai Akhir</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {currentItems.length > 0 ? (
                currentItems.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-colors">
                          <User size={20} />
                        </div>
                        <div>
                          <p className="text-base font-black text-slate-900 uppercase leading-none">{item.nama_murid}</p>
                          <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase">NISN: {item.nisn} • {item.tahun_ajaran}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <BookOpen size={16} className="text-slate-400" />
                        <p className="text-[11px] font-black text-slate-700 uppercase tracking-tight">{item.mapel}</p>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex justify-center items-center gap-4">
                        <div className="text-center">
                          <p className="text-[8px] font-black text-slate-300 uppercase mb-1">Harian</p>
                          <p className="text-xs font-black text-slate-600 bg-slate-50 px-3 py-1 rounded-lg border border-slate-100">{item.nilai_harian || '0'}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-[8px] font-black text-slate-300 uppercase mb-1">MID</p>
                          <p className="text-xs font-black text-slate-600 bg-slate-50 px-3 py-1 rounded-lg border border-slate-100">{item.nilai_mid || '0'}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-[8px] font-black text-slate-300 uppercase mb-1">UAS</p>
                          <p className="text-xs font-black text-slate-600 bg-slate-50 px-3 py-1 rounded-lg border border-slate-100">{item.nilai_uas || '0'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <div className={`inline-block px-6 py-3 rounded-2xl font-black text-lg shadow-sm border-2 ${
                        Number(item.nilai_angka) >= 75 ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-rose-50 border-rose-100 text-rose-600'
                      }`}>
                        {item.nilai_angka}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-8 py-24 text-center">
                    <p className="font-black uppercase tracking-widest text-slate-300">Data tidak ditemukan</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION NAVIGATION */}
        {totalPages > 1 && (
          <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Halaman <span className="text-indigo-600">{currentPage}</span> dari {totalPages}
            </p>
            <div className="flex gap-2">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-900 hover:text-white disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-slate-400 transition-all shadow-sm"
              >
                <ChevronLeft size={20} />
              </button>
              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-900 hover:text-white disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-slate-400 transition-all shadow-sm"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}