"use client";
import { useState, useEffect } from "react";
import { getJadwalBebanMengajar } from "@/lib/actions";
import { Calendar, Clock, Search, ChevronLeft, ChevronRight, UserCheck } from "lucide-react";
import ExcelJadwal from "@/components/ExcelJadwal";

export default function MonitoringJadwalPage() {
  const [jadwalGuru, setJadwalGuru] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 5;

  useEffect(() => {
    setLoading(true);
    // Debounce: Tunggu user selesai mengetik selama 300ms
    const delayDebounce = setTimeout(() => {
      getJadwalBebanMengajar(search, page, limit).then((res: any) => {
        setJadwalGuru(res || []);
        setLoading(false);
      });
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [search, page]);

  // Menghitung total halaman berdasarkan total_count dari database
  const totalData = jadwalGuru[0]?.total_count || 0;
  const totalPages = Math.ceil(totalData / limit);

  return (
    <div className="p-8 space-y-8 bg-slate-50 min-h-screen">
      {/* HEADER & SEARCH SECTION */}
      <div className="flex flex-wrap justify-between items-end gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">Monitoring Jadwal</h1>
          <p className="text-slate-500 font-bold uppercase text-[10px] mt-1 tracking-widest">Kepala Sekolah Monitoring Mode</p>
        </div>
        <ExcelJadwal/>

        {/* INPUT SEARCH */}
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text"
            placeholder="Cari Nama Guru atau NIP..."
            className="w-full pl-12 pr-4 py-3 bg-white border-2 border-slate-100 rounded-2xl text-[11px] font-bold focus:outline-none focus:border-indigo-500 transition-all shadow-sm"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
      </div>

      {/* LIST DATA GURU */}
      <div className="grid grid-cols-1 gap-6">
        {loading ? (
          <div className="p-20 text-center font-black animate-pulse uppercase text-slate-400">Mencari Data...</div>
        ) : (
          <>
            {jadwalGuru.map((guru) => (
              <div key={guru.id} className="bg-white rounded-[2.5rem] border-2 border-slate-100 overflow-hidden shadow-sm hover:border-indigo-100 transition-all">
                {/* Header Card Guru */}
                <div className="p-6 border-b border-slate-50 flex flex-wrap justify-between items-center gap-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-black ${
                      guru.total_jam_minggu >= 24 ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                    }`}>
                      <span className="text-lg leading-none">{guru.total_jam_minggu}</span>
                      <span className="text-[7px] uppercase mt-1">Jam/Minggu</span>
                    </div>
                    <div className="text-left">
                      <h3 className="font-black text-slate-900 uppercase text-sm tracking-tight">{guru.nama}</h3>
                      <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">NIP: {guru.nip} • Mapel: {guru.mapel_utama}</p>
                    </div>
                  </div>
                  <span className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest ${
                    guru.total_jam_minggu >= 24 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                  }`}>
                    {guru.total_jam_minggu >= 24 ? 'Beban Terpenuhi' : 'Beban Kurang'}
                  </span>
                </div>

                {/* Grid Jadwal Hari */}
                <div className="p-6 bg-slate-50/50">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                    {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'].map((hari) => (
                      <div key={hari} className="bg-white p-4 rounded-2xl border border-slate-100 min-h-[120px]">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-3 border-b pb-2">{hari}</span>
                        <div className="space-y-2">
                          {guru.list_jadwal?.filter((j: any) => j.hari === hari).map((item: any, idx: number) => (
                            <div key={idx} className="p-2 bg-indigo-50 rounded-xl border border-indigo-100">
                              <div className="text-[10px] font-black text-indigo-700 leading-none uppercase">{item.rombel}</div>
                              <div className="text-[8px] font-bold text-indigo-400 uppercase mt-1">{item.mapel}</div>
                              <div className="text-[8px] font-black text-slate-400 mt-2 flex items-center gap-1">
                                <Clock size={10} /> {item.jam_mulai.substring(0, 5)} - {item.jam_selesai.substring(0, 5)}
                              </div>
                            </div>
                          ))}
                          {!guru.list_jadwal?.some((j: any) => j.hari === hari) && (
                            <div className="text-[8px] font-bold text-slate-300 italic mt-4 uppercase text-center">Libur</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}

            {/* Jika hasil search tidak ada */}
            {jadwalGuru.length === 0 && (
              <div className="p-20 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-200">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Guru tidak ditemukan</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* CONTROLS PAGINATION */}
      {!loading && totalPages > 1 && (
        <div className="flex justify-center items-center gap-6 mt-8">
          <button 
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
            className="p-4 bg-white border-2 border-slate-100 rounded-2xl disabled:opacity-20 hover:border-indigo-500 transition-all shadow-sm"
          >
            <ChevronLeft size={20} className="text-slate-900" />
          </button>
          
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-black uppercase text-slate-900 tracking-widest">Halaman {page}</span>
            <span className="text-[8px] font-bold text-slate-400 uppercase">Total {totalPages} Halaman</span>
          </div>

          <button 
            disabled={page === totalPages}
            onClick={() => setPage(p => p + 1)}
            className="p-4 bg-white border-2 border-slate-100 rounded-2xl disabled:opacity-20 hover:border-indigo-500 transition-all shadow-sm"
          >
            <ChevronRight size={20} className="text-slate-900" />
          </button>
        </div>
      )}
    </div>
  );
}