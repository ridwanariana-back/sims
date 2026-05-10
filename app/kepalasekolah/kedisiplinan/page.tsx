// app/kepalasekolah/kedisiplinan/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  ShieldAlert, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  UserX,
  Calendar
} from "lucide-react";
import { getKepalaSekolahStats } from "@/lib/actions";
import ExcelKedisiplinan from "@/components/ExcelKedisiplinan";

export default function KedisiplinanKepalaSekolahPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const refreshData = useCallback(async () => {
    setLoading(true);
    const stats = await getKepalaSekolahStats();
    if (stats && stats.disiplin) {
      setData(stats.disiplin);
    }
    setLoading(false);
  }, []);

  useEffect(() => { refreshData(); }, [refreshData]);

  const filteredData = data.filter(item => 
    item.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.keterangan.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.rombel.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.nama_wali?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
      {/* HEADER */}
      <div className="bg-white border-b-4 border-slate-900 p-8 rounded-t-[2.5rem] flex flex-col md:flex-row justify-between items-center gap-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-rose-600 rounded-2xl text-white border-2 border-slate-900 shadow-lg shadow-rose-100">
            <ShieldAlert size={28} />
          </div>
          <div className="text-left">
            <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">Monitoring Kedisiplinan Siswa</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic text-left">
              Laporan Seluruh Catatan Pelanggaran & Kedisiplinan
            </p>
          </div>
        </div>
        <ExcelKedisiplinan/>

        <div className="relative w-full md:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text" 
            placeholder="Cari nama, kelas, atau wali kelas..." 
            className="pl-10 pr-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl text-xs font-bold focus:border-rose-500 outline-none w-full md:w-80 transition-all"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* TABLE AREA */}
      <div className="bg-white rounded-b-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
            <select 
                value={itemsPerPage} 
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="bg-white border-2 border-slate-200 rounded-lg px-3 py-1 text-[10px] font-black uppercase outline-none focus:border-slate-900"
            >
                <option value={10}>Show 10</option>
                <option value={25}>Show 25</option>
                <option value={50}>Show 50</option>
            </select>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total {filteredData.length} Catatan Ditemukan</span>
        </div>

        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-900">
              <th className="px-6 py-4 text-[10px] font-black text-white uppercase tracking-widest border-r border-white/10">Siswa & Kelas</th>
              {/* PENAMBAHAN FIELD WALI KELAS */}
              <th className="px-6 py-4 text-[10px] font-black text-white uppercase tracking-widest border-r border-white/10">Wali Kelas & NIP</th>
              <th className="px-6 py-4 text-[10px] font-black text-white uppercase tracking-widest border-r border-white/10 text-center">Tanggal</th>
              <th className="px-6 py-4 text-[10px] font-black text-white uppercase tracking-widest border-r border-white/10">Kategori</th>
              <th className="px-6 py-4 text-[10px] font-black text-white uppercase tracking-widest">Keterangan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
               <tr><td colSpan={5} className="py-20 text-center animate-pulse font-bold text-slate-400 uppercase text-xs">Mengambil Data...</td></tr>
            ) : paginatedData.length > 0 ? paginatedData.map((item, i) => (
              <tr key={i} className="hover:bg-rose-50/30 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 group-hover:bg-rose-100 group-hover:text-rose-600 transition-colors border border-transparent group-hover:border-rose-200 shrink-0">
                        <UserX size={14} />
                    </div>
                    <div className="text-left min-w-0">
                        <p className="text-xs font-black text-slate-900 uppercase leading-none truncate">{item.nama}</p>
                        <p className="text-[9px] font-bold text-rose-600 uppercase mt-1 italic tracking-tighter">Kelas: {item.rombel}</p>
                    </div>
                  </div>
                </td>
                {/* DATA WALI KELAS */}
                <td className="px-6 py-4">
                    <div className="text-left">
                        <p className="text-[10px] font-black text-slate-700 uppercase leading-none">{item.nama_wali || "N/A"}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">NIP: {item.nip_wali || "-"}</p>
                    </div>
                </td>
                <td className="px-6 py-4 text-center">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-full text-slate-600">
                        <Calendar size={10} />
                        <span className="text-[10px] font-black uppercase">{new Date(item.tanggal).toLocaleDateString('id-ID')}</span>
                    </div>
                </td>
                <td className="px-6 py-4">
                    <span className="text-[10px] font-black uppercase text-rose-600 bg-rose-50 px-3 py-1 rounded-lg border border-rose-100">
                        {item.kategori}
                    </span>
                </td>
                <td className="px-6 py-4 text-left">
                  <p className="text-xs font-medium text-slate-600 italic">"{item.keterangan}"</p>
                </td>
              </tr>
            )) : (
                <tr><td colSpan={5} className="py-20 text-center font-bold text-slate-400 uppercase text-xs italic">Belum ada catatan kedisiplinan.</td></tr>
            )}
          </tbody>
        </table>

        {/* PAGINATION */}
        <div className="px-8 py-6 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
          <p className="text-[10px] font-bold text-slate-500 uppercase italic">Halaman {currentPage} / {totalPages || 1}</p>
          <div className="flex items-center gap-2">
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)} className="p-2 bg-white border-2 border-slate-200 rounded-lg disabled:opacity-50 hover:text-rose-600 transition-all shadow-sm"><ChevronLeft size={16} /></button>
            <button disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(prev => prev + 1)} className="p-2 bg-white border-2 border-slate-200 rounded-lg disabled:opacity-50 hover:text-rose-600 transition-all shadow-sm"><ChevronRight size={16} /></button>
          </div>
        </div>
      </div>
    </div>
  );
}