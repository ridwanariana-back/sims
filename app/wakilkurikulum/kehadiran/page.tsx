"use client";
import { useState, useEffect } from "react";
import { getMonitoringKehadiran } from "@/lib/actions";
import { 
  Search, 
  Calendar, 
  UserCheck, 
  Users, 
  Clock, 
  Filter,
  ArrowRightLeft
} from "lucide-react";
import ExcelDaftarHadirGuru from "@/components/ExcelDaftarHadirGuru";

export default function KehadiranPage() {
  const [activeTab, setActiveTab] = useState("guru");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ guru: [], murid: [] });
  const [search, setSearch] = useState("");
  
  // Default Range: Hari ini
  const today = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);

  useEffect(() => {
    setLoading(true);
    getMonitoringKehadiran(startDate, endDate, search).then((res) => {
      setData(res);
      setLoading(false);
    });
  }, [startDate, endDate, search]);

  // Hitung Ringkasan Sederhana
  const currentList = activeTab === "guru" ? data.guru : data.murid;
  const totalHadir = currentList.filter((item: any) => item.status === 'Hadir').length;
  const totalTidakHadir = currentList.length - totalHadir;

  return (
    <div className="p-8 space-y-8 bg-slate-50 min-h-screen">
      {/* HEADER & FILTER SECTION */}
      <div className="flex flex-wrap justify-between items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter italic">
            Monitoring Kehadiran
          </h1>
          <p className="text-slate-500 font-bold uppercase text-[10px] mt-1 tracking-widest flex items-center gap-2">
            <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
            Laporan Real-time Unit Pendidikan
          </p>
        </div>
        <ExcelDaftarHadirGuru/>

        <div className="flex flex-wrap gap-3 items-center bg-white p-3 rounded-[2.5rem] border-2 border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-2xl border border-slate-100">
            <Calendar size={14} className="text-slate-400" />
            <input 
              type="date" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)} 
              className="bg-transparent text-[10px] font-black uppercase outline-none cursor-pointer"
            />
            <ArrowRightLeft size={12} className="text-slate-300" />
            <input 
              type="date" 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)} 
              className="bg-transparent text-[10px] font-black uppercase outline-none cursor-pointer"
            />
          </div>
          
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input 
              type="text" 
              placeholder="Cari nama atau NIP/NISN..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-3 bg-slate-50 rounded-2xl text-[11px] font-bold focus:outline-none border-2 border-transparent focus:border-indigo-500 transition-all w-64"
            />
          </div>
        </div>
      </div>

      {/* STATS SUMMARY BUBBLES */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[2.5rem] border-2 border-slate-100 flex items-center gap-6 shadow-sm">
          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
             <Users size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Data</p>
            <p className="text-2xl font-black text-slate-900 leading-none">{currentList.length}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2.5rem] border-2 border-slate-100 flex items-center gap-6 shadow-sm">
          <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
             <UserCheck size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-emerald-500">Hadir</p>
            <p className="text-2xl font-black text-slate-900 leading-none">{totalHadir}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2.5rem] border-2 border-slate-100 flex items-center gap-6 shadow-sm">
          <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center">
             <Clock size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-rose-500">Tidak Hadir</p>
            <p className="text-2xl font-black text-slate-900 leading-none">{totalTidakHadir}</p>
          </div>
        </div>
      </div>

      {/* TABS SELECTOR */}
      <div className="flex gap-2 p-1.5 bg-slate-200/50 w-fit rounded-[2rem] border border-slate-200">
        <button 
          onClick={() => setActiveTab("guru")}
          className={`flex items-center gap-3 px-10 py-3.5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'guru' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <UserCheck size={14} /> Monitoring Guru
        </button>
      </div>

      {/* DATA TABLE */}
      <div className="bg-white rounded-[3.5rem] border-2 border-slate-100 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-32 text-center">
            <div className="inline-block w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="font-black text-slate-400 uppercase text-xs tracking-[0.3em]">Memproses Database...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50/50 border-b-2 border-slate-50">
                  <th className="p-8 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Informasi Personal</th>
                  <th className="p-8 text-center text-[10px] font-black uppercase text-slate-400 tracking-widest">Waktu & Tanggal</th>
                  <th className="p-8 text-center text-[10px] font-black uppercase text-slate-400 tracking-widest">{activeTab === 'guru' ? 'Mapel' : 'Rombel'}</th>
                  <th className="p-8 text-center text-[10px] font-black uppercase text-slate-400 tracking-widest">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {currentList.map((item: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-all group">
                    <td className="p-8">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center font-black text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                          {item.nama.charAt(0)}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[13px] font-black text-slate-900 uppercase leading-none mb-1">{item.nama}</span>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                            {activeTab === 'guru' ? `NIP: ${item.nip}` : `NISN: ${item.nisn} • ${item.gender}`}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="p-8 text-center">
                      <div className="inline-flex flex-col items-center p-3 bg-slate-50 rounded-2xl border border-slate-100 min-w-[100px]">
                        <span className="text-[10px] font-black text-slate-900 leading-none">{item.tanggal}</span>
                        <span className="text-[8px] font-bold text-slate-400 uppercase mt-1">Tgl Laporan</span>
                      </div>
                    </td>
                    <td className="p-8 text-center font-black text-slate-900 text-xs uppercase tracking-tighter">
                      {activeTab === 'guru' ? (item.mapel || '-') : item.rombel}
                    </td>
                    <td className="p-8">
                      <div className="flex justify-center">
                        <span className={`px-6 py-2 rounded-2xl text-[9px] font-black uppercase tracking-[0.1em] border-2 shadow-sm ${
                          item.status === 'Hadir' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                          item.status === 'Izin' || item.status === 'Sakit' ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                          'bg-rose-50 text-rose-600 border-rose-100'
                        }`}>
                          {item.status || 'Alfa'}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
                {currentList.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-32 text-center">
                       <p className="text-xs font-black text-slate-300 uppercase tracking-[0.4em]">Data Tidak Ditemukan</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}