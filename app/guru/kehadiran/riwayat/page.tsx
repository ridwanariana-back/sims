"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Search, Calendar, ChevronLeft, ChevronRight, FileText, Download, Loader2 } from "lucide-react";
import { getHistoryKehadiran } from "@/lib/actions";

export default function RiwayatKehadiran() {
  const { data: session } = useSession();
  const today = new Date().toISOString().split('T')[0];
  
  // States
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [currentPage, setCurrentPage] = useState(1);
  const [dataKehadiran, setDataKehadiran] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const itemsPerPage = 10;

  // Fungsi Fetch Data dari Database
  const fetchHistory = useCallback(async () => {
    // Pastikan session memiliki kelasWali dan tahunAjaran agar data tidak tercampur[cite: 2, 5]
    if (!session?.user?.kelasWali || !session?.user?.tahunAjaran) return;
    
    setLoading(true);
    try {
      // Mengirimkan 4 argumen termasuk tahunAjaran terbaru ke server action[cite: 1, 2, 5]
      const res = await getHistoryKehadiran(
        session.user.kelasWali, 
        startDate, 
        endDate, 
        session.user.tahunAjaran // Implementasi Tahun Ajaran
      );
      setDataKehadiran(res);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [session, startDate, endDate]);

  // Trigger fetch data saat komponen dimuat atau filter berubah
  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const filteredData = dataKehadiran.filter(item => 
    item.nama.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-6 p-4">
      {/* HEADER ALA TATA USAHA */}
      <div className="bg-white border-b-4 border-slate-900 p-8 rounded-t-[2.5rem] shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-slate-900 rounded-2xl text-white">
              <FileText size={24} />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">Laporan Kehadiran Siswa</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">
                Kelas: {session?.user?.kelasWali || "-"} | Periode: {session?.user?.tahunAjaran || "-"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Cari Nama Siswa..." 
                className="pl-10 pr-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl text-xs font-bold focus:border-indigo-500 outline-none w-64 transition-all"
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-xl font-black uppercase text-[10px] flex items-center gap-2 transition-all shadow-lg shadow-emerald-100">
              <Download size={14} /> Export PDF
            </button>
          </div>
        </div>

        {/* DATE RANGE FILTER */}
        <div className="flex items-center gap-4 mt-8 pt-6 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-slate-400" />
            <span className="text-[10px] font-black text-slate-500 uppercase">Rentang Laporan:</span>
          </div>
          <input 
            type="date" 
            value={startDate} 
            max={today} 
            onChange={(e) => setStartDate(e.target.value)}
            className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-bold outline-none"
          />
          <span className="text-slate-300">—</span>
          <input 
            type="date" 
            value={endDate} 
            max={today} 
            onChange={(e) => setEndDate(e.target.value)}
            className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-bold outline-none"
          />
          {loading && <Loader2 className="animate-spin text-indigo-500 ml-2" size={16} />}
        </div>
      </div>

      {/* TABLE SECTION */}
      <div className="bg-white rounded-b-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-900">
              <th className="px-6 py-4 text-[10px] font-black text-white uppercase tracking-widest border-r border-white/10">No</th>
              <th className="px-6 py-4 text-[10px] font-black text-white uppercase tracking-widest border-r border-white/10">Data Siswa</th>
              <th className="px-6 py-4 text-[10px] font-black text-white uppercase tracking-widest border-r border-white/10">Tanggal</th>
              <th className="px-6 py-4 text-[10px] font-black text-white uppercase tracking-widest text-center">Keterangan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={4} className="px-6 py-20 text-center text-slate-400 font-bold text-xs uppercase italic">Mengambil data dari database...</td>
              </tr>
            ) : paginatedData.length > 0 ? paginatedData.map((item, index) => (
              <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4 text-xs font-bold text-slate-400">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                <td className="px-6 py-4">
                  <p className="text-xs font-black text-slate-900 uppercase leading-none">{item.nama}</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase mt-2 italic">NISN: {item.nisn} • {item.gender}</p>
                </td>
                <td className="px-6 py-4 text-xs font-bold text-slate-600">
                  {new Date(item.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                </td>
                <td className="px-6 py-4">
                  <div className="flex justify-center">
                    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-tighter ${
                      item.status === 'Hadir' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                      item.status === 'Sakit' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                      item.status === 'Izin' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                      'bg-rose-50 text-rose-600 border border-rose-100'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={4} className="px-6 py-20 text-center text-slate-400 font-bold text-xs uppercase italic">Data tidak ditemukan untuk rentang ini.</td>
              </tr>
            )}
          </tbody>
        </table>

        {/* PAGINATION */}
        <div className="px-8 py-6 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
          <p className="text-[10px] font-bold text-slate-500 uppercase italic">
            Menampilkan {paginatedData.length} dari {filteredData.length} data murid
          </p>
          <div className="flex items-center gap-2">
            <button 
              disabled={currentPage === 1 || loading}
              onClick={() => setCurrentPage(prev => prev - 1)}
              className="p-2 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-indigo-600 disabled:opacity-50 transition-all"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs font-black text-slate-900 px-4">Halaman {currentPage} dari {totalPages || 1}</span>
            <button 
              disabled={currentPage === totalPages || totalPages === 0 || loading}
              onClick={() => setCurrentPage(prev => prev + 1)}
              className="p-2 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-indigo-600 disabled:opacity-50 transition-all"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}