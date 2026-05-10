// app/wakilkurikulum/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getKepalaSekolahStats } from "@/lib/actions";
import { 
  Users, 
  LayoutGrid, 
  TrendingUp, 
  Clock, 
  UserCheck,
  X,
  BookOpen 
} from "lucide-react";

export default function WakilKurikulumPage() {
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
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 uppercase tracking-tighter">Dashboard Wakil Kurikulum</h1>
        <p className="text-slate-500 font-bold uppercase text-[9px] md:text-[10px] mt-1 tracking-widest">
          Sistem Informasi Manajemen Sekolah — SMAN 1 Pemulutan Selatan
        </p>
      </div>

      {/* STATS CARDS - Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div 
          onClick={() => router.push("/wakilkurikulum/dataguru")}
          className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-100 shadow-sm cursor-pointer hover:border-blue-400 transition-all active:scale-95 flex flex-col items-center justify-center text-center"
        >
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl mb-4"><Users size={24} /></div>
          <div className="text-3xl font-black text-slate-900">{stats.counts.total_guru}</div>
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Guru</div>
        </div>

        <div onClick={() => openModal("Daftar Tingkat Kelas", stats.details.kelas)} className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-100 shadow-sm cursor-pointer hover:border-purple-400 transition-all active:scale-95 flex flex-col items-center justify-center text-center">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl mb-4"><LayoutGrid size={24} /></div>
          <div className="text-3xl font-black text-slate-900">{stats.counts.total_kelas}</div>
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Kelas</div>
        </div>

        <div onClick={() => openModal("Daftar Rombongan Belajar", stats.details.rombel)} className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-100 shadow-sm cursor-pointer hover:border-rose-400 transition-all active:scale-95 flex flex-col items-center justify-center text-center">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl mb-4"><TrendingUp size={24} /></div>
          <div className="text-3xl font-black text-slate-900">{stats.counts.total_rombel}</div>
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Rombel</div>
        </div>

        <div onClick={() => openModal("Daftar Mata Pelajaran", stats.details.mapel)} className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-100 shadow-sm cursor-pointer hover:border-orange-400 transition-all active:scale-95 flex flex-col items-center justify-center text-center">
          <div className="p-3 bg-orange-50 text-orange-600 rounded-2xl mb-4"><BookOpen size={24} /></div>
          <div className="text-3xl font-black text-slate-900">{stats.counts.total_mapel}</div>
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Mapel</div>
        </div>
      </div>

      {/* DAFTAR WALI KELAS */}
      <div 
          onClick={() => router.push("/wakilkurikulum/dataguru")}
          className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-100 shadow-sm cursor-pointer hover:border-purple-400 transition-all active:scale-95 flex flex-col items-center justify-center text-center"
        >
      <div className="bg-white p-8 rounded-[3rem] border-2 border-slate-100 shadow-sm">
        <h3 className="font-black uppercase text-sm mb-6 flex items-center gap-3 text-slate-900">
          <UserCheck className="text-indigo-500" size={20} /> Daftar Wali Kelas
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.waliKelas?.map((wk: any, i: number) => (
            <div key={i} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-4 hover:bg-white hover:border-indigo-200 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-xs shrink-0">{wk.rombel}</div>
              <div className="flex flex-col min-w-0">
                <span className="text-[11px] font-black text-slate-900 uppercase leading-none truncate">{wk.nama_guru}</span>
                <span className="text-[9px] font-bold text-slate-400 mt-1 uppercase">NIP: {wk.nip}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      </div>

      {/* MONITORING SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* JAM MENGAJAR */}
        <div 
          onClick={() => router.push("/wakilkurikulum/jadwal")}
          className="bg-white p-8 rounded-[3rem] border-2 border-slate-100 shadow-sm cursor-pointer hover:border-rose-400 transition-all"
        >
          <div className="flex justify-between items-center mb-8">
            <div className="w-14 h-14 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center"><Clock size={28} /></div>
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Jadwal Pelajaran</p>
              <h3 className="text-2xl font-black text-slate-900 italic uppercase">Jam Mengajar</h3>
            </div>
          </div>
          <div className="space-y-4">
            {stats.jamMengajar.map((item: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-transparent">
                <div className="flex flex-col min-w-0">
                  <span className="text-[11px] font-black text-slate-900 uppercase tracking-tighter truncate">{item.mapel}</span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest truncate">{item.daftar_guru || "Belum Ada Guru"}</span>
                </div>
                <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 text-[10px] font-black text-slate-900 shrink-0 ml-4">{item.total_jam} JP</div>
              </div>
            ))}
          </div>
          <div className="mt-6 pt-6 border-t border-slate-50 flex justify-center">
            <p className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em]">Lihat Semua Jadwal &rarr;</p>
          </div>
        </div>

        {/* KEHADIRAN & NILAI */}
        <div className="flex flex-col gap-8">
          <div className="bg-white p-8 rounded-[3rem] border-2 border-slate-100 shadow-sm space-y-6">
            <div className="flex justify-between items-center">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center"><UserCheck size={28} /></div>
              <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kehadiran Hari Ini</p>
                <h3 className="text-2xl font-black text-slate-900 italic uppercase">Monitoring</h3>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-black uppercase italic">
                <span className="text-slate-500">Guru Terabsen</span>
                <span className="text-indigo-600">{stats.counts.guruHadir}/{stats.counts.total_guru}</span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${(stats.counts.guruHadir / stats.counts.total_guru) * 100}%` }} />
              </div>
            </div>
            <button onClick={() => router.push('/kepalasekolah/kehadiran')} className="w-full py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-lg">Lihat Detail Laporan</button>
          </div>

          <div onClick={() => router.push("/wakilkurikulum/rekap-nilai")} className="bg-white p-8 rounded-[3rem] border-2 border-slate-100 shadow-sm cursor-pointer hover:border-emerald-400 transition-all flex-1">
            <h3 className="font-black uppercase text-sm mb-8 flex items-center gap-3 text-slate-900"><TrendingUp className="text-emerald-500" size={20} /> Siswa Nilai Tertinggi</h3>
            <div className="space-y-6">
              {stats.topNilai.map((n: any, i: number) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between items-start">
                    <div className="flex gap-3 min-w-0">
                      <div className="w-6 h-6 rounded-lg bg-slate-900 text-white flex items-center justify-center text-[10px] font-black shrink-0">{i + 1}</div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[11px] font-black text-slate-900 uppercase leading-none truncate">{n.nama}</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase mt-1 truncate">NISN: {n.nisn} • {n.rombel}</span>
                      </div>
                    </div>
                    <div className="text-[11px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md shrink-0">{n.rerata}</div>
                  </div>
                  <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full shadow-[0_0_12px_rgba(16,185,129,0.3)]" style={{ width: `${n.rerata}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL */}
      {modal.open && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] border-4 border-slate-900 shadow-2xl overflow-hidden">
            <div className="bg-slate-900 p-6 flex justify-between items-center text-white">
              <h2 className="font-black uppercase tracking-widest text-sm">{modal.title}</h2>
              <button onClick={() => setModal({ ...modal, open: false })} className="opacity-50 hover:opacity-100"><X size={28} /></button>
            </div>
            <div className="p-8 max-h-[60vh] overflow-y-auto">
              <table className="w-full max-w-md mx-auto text-center"> 
                <thead>
                  <tr className="border-b-2 border-slate-100">
                    <th className="py-4 text-[10px] font-black uppercase text-slate-400 w-20">No</th>
                    <th className="py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Nama</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {modal.data.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-4 font-black text-slate-400 text-xs">{idx + 1}</td>
                      <td className="py-4 font-black text-slate-900 uppercase text-xs">{item}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-6 bg-slate-50 text-center border-t border-slate-100">
              <button onClick={() => setModal({ ...modal, open: false })} className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest">Tutup</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}