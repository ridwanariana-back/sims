// app/tatausaha/riwayat-hadir-guru/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Search, ChevronLeft, ChevronRight, History, Loader2 } from "lucide-react";
import { getHistoryKehadiranGuru } from "@/lib/actions";

export default function RiwayatKehadiranGuru() {
  const { data: session } = useSession();
  
  // Ambil sekolah_id aman dari session client-side
  const sId = session?.user?.sekolah_id || (session?.user as any)?.sekolahId;
  const sekolahIdInt = sId ? parseInt(sId.toString()) : null;

  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [currentPage, setCurrentPage] = useState(1);
  const [dataKehadiran, setDataKehadiran] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const itemsPerPage = 10;

  const [tahunAjaran, setTahunAjaran] = useState<string>("");
  const [opsiTahun, setOpsiTahun] = useState<string[]>([]);

  // Generate daftar 10 tahun ajaran ke belakang
  useEffect(() => {
    const generateYears = () => {
      const years = [];
      const sekarang = new Date();
      let tahunIni = sekarang.getFullYear();
      const bulanIni = sekarang.getMonth();

      let startingYear = bulanIni >= 6 ? tahunIni : tahunIni - 1;

      for (let i = 0; i < 10; i++) {
        const yr = startingYear - i;
        years.push(`${yr}/${yr + 1}`);
      }
      setOpsiTahun(years);
      setTahunAjaran(years[0]);
    };

    generateYears();
  }, []);

  // Fungsi Fetch Data dengan pengaman sekolahIdInt
  const fetchHistory = useCallback(async () => {
    if (!tahunAjaran || !sekolahIdInt) return; // Tunggu session dan tahun ajaran siap
    
    setLoading(true);
    try {
      const res = await getHistoryKehadiranGuru(
        startDate, 
        endDate, 
        tahunAjaran,
        sekolahIdInt
      );
      
      setDataKehadiran(Array.isArray(res) ? res : []);
      setCurrentPage(1); // Reset ke halaman 1 setiap kali filter berubah
    } catch (error) {
      console.error("Fetch error:", error);
      setDataKehadiran([]);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, tahunAjaran, sekolahIdInt]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Logic Filter & Pagination
  const filteredData = dataKehadiran.filter(item =>
    item.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.nip && item.nip.includes(searchTerm))
  );

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* HEADER */}
      <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="flex items-center gap-4 md:gap-6">
            <div className="w-14 h-14 md:w-16 md:h-16 bg-slate-900 rounded-3xl flex items-center justify-center text-white shadow-xl flex-shrink-0">
              <History size={28} />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tighter leading-none">
                Laporan Kehadiran Guru
              </h1>
              <p className="text-slate-500 font-bold uppercase tracking-widest text-[9px] mt-2 italic">
                Dashboard Tata Usaha | Unit: Administrasi
              </p>
            </div>
          </div>

          <div className="flex gap-3 w-full lg:flex-1 lg:max-w-2xl justify-end">
            <div className="relative w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Cari Nama Guru atau NIP..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent focus:border-blue-500 rounded-2xl font-bold text-xs outline-none transition-all"
              />
            </div>
          </div>
        </div>

        {/* DROPDOWN TAHUN AJARAN & FILTER TANGGAL */}
        {/* 🔥 PERBAIKAN 1: Menambahkan flex-wrap dan gap yang dinamis agar tidak patah/offside di HP */}
        <div className="flex flex-wrap items-center gap-4 md:gap-6 mt-8 pt-6 border-t border-slate-100">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex-shrink-0">Periode:</span>
            <select 
              value={tahunAjaran}
              onChange={(e) => setTahunAjaran(e.target.value)}
              className="p-3 bg-blue-50 border-2 border-blue-100 rounded-2xl font-black text-[11px] text-blue-600 outline-none focus:border-blue-400 transition-all cursor-pointer"
            >
              {opsiTahun.map((thn) => (
                <option key={thn} value={thn}>{thn}</option>
              ))}
            </select>
          </div>

          <div className="h-8 w-px bg-slate-100 hidden md:block"></div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex-shrink-0">Rentang:</span>
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <input 
                type="date" 
                value={startDate} 
                max={today} 
                onChange={(e) => setStartDate(e.target.value)} 
                className="p-3 bg-slate-50 border-2 border-transparent focus:border-blue-500 rounded-xl font-bold text-[11px] outline-none transition-all flex-1 sm:flex-none" 
              />
              <span className="text-slate-400 font-bold text-xs px-1">sampai</span>
              <input 
                type="date" 
                value={endDate} 
                max={today} 
                onChange={(e) => setEndDate(e.target.value)} 
                className="p-3 bg-slate-50 border-2 border-transparent focus:border-blue-500 rounded-xl font-bold text-[11px] outline-none transition-all flex-1 sm:flex-none" 
              />
            </div>
          </div>
        </div>
      </div>

      {/* TABLE AREA */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
        {/* 🔥 PERBAIKAN 2: Membungkus table dengan overflow-x-auto dan min-w agar tabel bisa digeser halus di HP */}
        <div className="w-full overflow-x-auto scrollbar-thin">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-slate-900">
                <th className="px-6 md:px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-800 w-16">No</th>
                <th className="px-6 md:px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-800">Data Guru</th>
                <th className="px-6 md:px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-800">Tanggal</th>
                <th className="px-6 md:px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={4} className="px-6 py-20 text-center"><Loader2 className="animate-spin mx-auto text-blue-500" size={32} /></td></tr>
              ) : paginatedData.length > 0 ? paginatedData.map((item, index) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 md:px-8 py-5 font-bold text-slate-400 text-xs">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                  <td className="px-6 md:px-8 py-5">
                    <p className="text-sm font-black text-slate-900 uppercase leading-none">{item.nama}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">NIP: {item.nip || "-"}</p>
                  </td>
                  <td className="px-6 md:px-8 py-5 font-bold text-slate-600 text-xs">
                    {new Date(item.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </td>
                  <td className="px-6 md:px-8 py-5">
                    <div className="flex justify-center">
                      <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm ${
                        item.status === 'Hadir' ? 'bg-emerald-100 text-emerald-600' : 
                        item.status === 'Sakit' ? 'bg-amber-100 text-amber-600' : 
                        item.status === 'Izin' ? 'bg-blue-100 text-blue-600' : 'bg-rose-100 text-rose-600'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={4} className="px-6 py-20 text-center text-slate-400 font-bold text-xs uppercase italic">Tidak ada riwayat untuk rentang dan periode ini.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div className="px-6 md:px-8 py-6 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-[10px] font-bold text-slate-500 uppercase italic order-2 sm:order-1">
            Menampilkan {paginatedData.length} data guru
          </p>
          <div className="flex items-center gap-2 order-1 sm:order-2">
            <button 
              disabled={currentPage === 1 || loading} onClick={() => setCurrentPage(prev => prev - 1)}
              className="p-2 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-blue-600 disabled:opacity-50 transition-all"
            ><ChevronLeft size={16} /></button>
            <span className="text-xs font-black text-slate-900 px-4">Hal {currentPage} dari {totalPages || 1}</span>
            <button 
              disabled={currentPage === totalPages || totalPages === 0 || loading} onClick={() => setCurrentPage(prev => prev + 1)}
              className="p-2 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-blue-600 disabled:opacity-50 transition-all"
            ><ChevronRight size={16} /></button>
          </div>
        </div>
      </div>
    </div>
  );
}