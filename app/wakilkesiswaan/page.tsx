// app/wakilkesiswaan/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getKepalaSekolahStats } from "@/lib/actions";
import { 
  Users, 
  GraduationCap, 
  LayoutGrid, 
  TrendingUp, 
  Clock, 
  CalendarCheck,
  UserCheck,
  ShieldAlert, 
  X,
  BookOpen 
} from "lucide-react";

export default function WakilKesiswaanPage() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [modal, setModal] = useState<{ open: boolean; title: string; data: string[] }>({
    open: false, title: "", data: []
  });

  useEffect(() => {
    getKepalaSekolahStats().then(setStats);
  }, []);

  if (!stats) return <div className="p-20 text-center font-black animate-pulse text-slate-900">MEMUAT DASHBOARD...</div>;

  const openModal = (title: string, data: string[]) => setModal({ open: true, title, data });

  return (
    <div className="p-4 md:p-8 space-y-10 bg-slate-50 min-h-screen">
      {/* HEADER */}
      <div className="text-center md:text-left">
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 uppercase tracking-tighter">Dashboard Wakil Kesiswaan</h1>
        <p className="text-slate-500 font-bold uppercase text-[9px] md:text-[10px] mt-1 tracking-widest">
          Sistem Informasi Manajemen Sekolah — SMAN 1 Pemulutan Selatan
        </p>
      </div>

      {/* STATS CARDS - Diperbaiki agar responsif & rapi */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* TOTAL MURID */}
        <div 
          onClick={() => router.push("/wakilkesiswaan/datamurid")}
          className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-100 shadow-sm cursor-pointer hover:border-emerald-400 transition-all active:scale-95 flex flex-col items-center justify-center text-center"
        >
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl mb-4">
            <GraduationCap size={24} />
          </div>
          <div className="text-3xl font-black text-slate-900">{stats.counts.total_murid}</div>
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Murid</div>
        </div>

        {/* TOTAL KELAS */}
        <div 
          onClick={() => openModal("Daftar Tingkat Kelas", stats.details.kelas)} 
          className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-100 shadow-sm cursor-pointer hover:border-purple-400 transition-all active:scale-95 flex flex-col items-center justify-center text-center"
        >
          <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl mb-4">
            <LayoutGrid size={24} />
          </div>
          <div className="text-3xl font-black text-slate-900">{stats.counts.total_kelas}</div>
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Kelas</div>
        </div>

        {/* TOTAL ROMBEL */}
        <div 
          onClick={() => openModal("Daftar Rombongan Belajar", stats.details.rombel)} 
          className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-100 shadow-sm cursor-pointer hover:border-rose-400 transition-all active:scale-95 flex flex-col items-center justify-center text-center"
        >
          <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl mb-4">
            <TrendingUp size={24} />
          </div>
          <div className="text-3xl font-black text-slate-900">{stats.counts.total_rombel}</div>
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Rombel</div>
        </div>
      </div>

      {/* MAIN CONTENT - Grid 2 Kolom untuk Monitorings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* KOLOM KIRI: KEHADIRAN & KEDISIPLINAN */}
        <div className="space-y-8">
          {/* CARD KEHADIRAN */}
          <div className="bg-white p-8 rounded-[3rem] border-2 border-slate-100 shadow-sm space-y-6">
            <div className="flex justify-between items-center">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                <UserCheck size={28} />
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kehadiran Hari Ini</p>
                <h3 className="text-2xl font-black text-slate-900 italic uppercase">Monitoring</h3>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-black uppercase italic">
                  <span className="text-slate-500">Siswa Hadir</span>
                  <span className="text-emerald-600">{stats.counts.muridHadir}/{stats.counts.total_murid}</span>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 rounded-full transition-all duration-1000" 
                    style={{ width: `${(stats.counts.muridHadir / stats.counts.total_murid) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            <button 
              onClick={() => router.push('/wakilkesiswaan/kehadiran')}
              className="w-full py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-indigo-600 transition-colors shadow-lg shadow-slate-200"
            >
              Lihat Detail Laporan
            </button>
          </div>

          {/* KEDISIPLINAN */}
          <div 
            onClick={() => router.push("/wakilkesiswaan/kedisiplinan")}
            className="bg-white p-8 rounded-[3rem] border-2 border-slate-100 shadow-sm cursor-pointer hover:border-rose-400 transition-all"
          >
            <h3 className="font-black uppercase text-sm mb-6 flex items-center gap-3 text-slate-900">
              <ShieldAlert className="text-rose-500" size={20} /> Catatan Kedisiplinan
            </h3>
            <div className="space-y-4">
              {stats.disiplin?.map((d: any, i: number) => (
                <div key={i} className="flex justify-between items-center p-4 bg-rose-50/50 rounded-2xl border border-rose-100">
                  <div className="flex flex-col">
                    <span className="text-[11px] font-black text-slate-900 uppercase leading-none">{d.nama}</span>
                    <span className="text-[9px] font-bold text-slate-500 mt-1 uppercase">{d.rombel} • {d.kategori}</span>
                  </div>
                  <div className="text-[8px] font-black text-rose-400 bg-white px-2 py-1 rounded-lg border border-rose-100 uppercase">
                    {new Date(d.tanggal).toLocaleDateString('id-ID')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* KOLOM KANAN: NILAI TERTINGGI */}
        <div className="space-y-8">
          <div 
            onClick={() => router.push("/wakilkesiswaan/rekap-nilai")}
            className="bg-white p-8 rounded-[3rem] border-2 border-slate-100 shadow-sm cursor-pointer hover:border-emerald-400 transition-all h-full"
          >
            <h3 className="font-black uppercase text-sm mb-8 flex items-center gap-3 text-slate-900">
              <TrendingUp className="text-emerald-500" size={20} /> Siswa Nilai Tertinggi
            </h3>
            <div className="space-y-8">
              {stats.topNilai.map((n: any, i: number) => (
                <div key={i} className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex gap-4">
                      <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center text-[10px] font-black shrink-0">
                        {i + 1}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[12px] font-black text-slate-900 uppercase tracking-tight leading-none">{n.nama}</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase mt-1.5">NISN: {n.nisn} • {n.rombel}</span>
                      </div>
                    </div>
                    <div className="text-[11px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                      {n.rerata}
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                    <div 
                      className="bg-emerald-500 h-full rounded-full transition-all duration-1000 shadow-[0_0_12px_rgba(16,185,129,0.3)]" 
                      style={{ width: `${n.rerata}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL SECTION */}
      {modal.open && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 md:p-6 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] border-4 border-slate-900 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-slate-900 p-6 md:p-8 flex justify-between items-center">
              <h2 className="text-white font-black uppercase tracking-widest text-sm md:text-lg">{modal.title}</h2>
              <button onClick={() => setModal({ ...modal, open: false })} className="text-white/50 hover:text-white transition-colors">
                <X size={28} />
              </button>
            </div>
            
            <div className="p-6 md:p-8 max-h-[60vh] overflow-y-auto bg-white">
              <table className="w-full max-w-md mx-auto"> 
                <thead>
                  <tr className="border-b-2 border-slate-100">
                    <th className="py-4 text-[10px] font-black uppercase text-slate-400 w-20 text-center">No</th>
                    <th className="py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">Informasi Nama</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {modal.data.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="py-4 font-black text-slate-400 text-xs text-center">{idx + 1}</td>
                      <td className="py-4 font-black text-slate-900 uppercase text-xs tracking-tight text-center">{item}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-6 md:p-8 bg-slate-50 border-t border-slate-100 text-center">
              <button 
                onClick={() => setModal({ ...modal, open: false })} 
                className="w-full md:w-auto px-8 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-800 transition-all active:scale-95"
              >
                Tutup Detail
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}