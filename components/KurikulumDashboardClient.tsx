"use client";

import { useState, useEffect } from "react";
import { 
  Users, 
  GraduationCap, 
  CalendarCheck, 
  CheckCircle2, 
  TrendingUp, 
  BarChart3, 
  LineChart as LineIcon 
} from "lucide-react";
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip,
  LineChart,
  Line,
  AreaChart,
  Area
} from "recharts";

interface ClientProps {
  initialStats: any;
  userSession: any;
  namaSekolah: string;
}

export default function KurikulumDashboardClient({ initialStats, userSession, namaSekolah }: ClientProps) {
  const [activeTab, setActiveTab] = useState("akademik");
  const [stats, setStats] = useState(initialStats);

  if (!stats) {
    return (
      <div className="p-8 text-center font-black text-rose-500 uppercase border-4 border-rose-900 bg-rose-50 rounded-2xl">
        🚨 Gagal memuat data statistik kurikulum!
      </div>
    );
  }

  const dataAlertSistem = stats.charts?.dataAlertSistem || [];

  return (
    <div className="space-y-6 text-slate-900 pb-12">
      {/* HEADER SECTION */}
      <div className="bg-amber-300 border-4 border-slate-900 p-6 rounded-2xl shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl md:text-3xl font-black uppercase tracking-tight text-slate-950">
            📊 DASHBOARD WAKIL KURIKULUM
          </h1>
          <p className="text-xs md:text-sm font-black uppercase tracking-wide text-slate-800 mt-1">
            🏫 {namaSekolah}
          </p>
        </div>
        <div className="bg-slate-900 text-amber-300 px-4 py-2 rounded-xl border-2 border-slate-900 font-black text-xs md:text-sm uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(251,191,36,1)]">
          Role: {userSession?.user?.role || "WAKIL KURIKULUM"}
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CARD 1 */}
        <div className="bg-white border-4 border-slate-900 p-4 rounded-2xl shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] flex items-center gap-4">
          <div className="p-3 rounded-xl bg-indigo-100 border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] text-indigo-600">
            <Users className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Total Siswa Aktif</p>
            <h3 className="text-2xl font-black tracking-tight mt-0.5">{stats.cards?.totalSiswa}</h3>
          </div>
        </div>

        {/* CARD 2 */}
        <div className="bg-white border-4 border-slate-900 p-4 rounded-2xl shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-100 border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] text-emerald-600">
            <GraduationCap className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Tenaga Pendidik</p>
            <h3 className="text-2xl font-black tracking-tight mt-0.5">{stats.cards?.totalGuru} Guru</h3>
          </div>
        </div>

        {/* CARD 3 */}
        <div className="bg-white border-4 border-slate-900 p-4 rounded-2xl shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] flex items-center gap-4">
          <div className="p-3 rounded-xl bg-amber-100 border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] text-amber-600">
            <CalendarCheck className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Kehadiran Bulan Ini</p>
            <h3 className="text-2xl font-black tracking-tight mt-0.5">{stats.cards?.rataKehadiran}</h3>
          </div>
        </div>

        {/* CARD 4 */}
        <div className="bg-white border-4 border-slate-900 p-4 rounded-2xl shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] flex items-center gap-4">
          <div className="p-3 rounded-xl bg-rose-100 border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] text-rose-600">
            <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Ketuntasan KKM ({">=75"})</p>
            <h3 className="text-2xl font-black tracking-tight mt-0.5">{stats.cards?.dashKKM}</h3>
          </div>
        </div>
      </div>

      {/* NAVIGATION TABS */}
      <div className="flex border-4 border-slate-900 rounded-2xl p-1.5 bg-slate-100 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] overflow-x-auto gap-2">
        <button
          onClick={() => setActiveTab("akademik")}
          className={`flex-1 py-3 px-4 rounded-xl text-xs md:text-sm font-black uppercase tracking-wider transition-all border-2 whitespace-nowrap ${
            activeTab === "akademik"
              ? "bg-slate-950 text-white border-slate-950 shadow-[2px_2px_0px_0px_rgba(251,191,36,1)]"
              : "bg-transparent text-slate-600 border-transparent hover:bg-slate-200"
          }`}
        >
          📚 Akademik & Raport
        </button>
        <button
          onClick={() => setActiveTab("guru")}
          className={`flex-1 py-3 px-4 rounded-xl text-xs md:text-sm font-black uppercase tracking-wider transition-all border-2 whitespace-nowrap ${
            activeTab === "guru"
              ? "bg-slate-950 text-white border-slate-950 shadow-[2px_2px_0px_0px_rgba(251,191,36,1)]"
              : "bg-transparent text-slate-600 border-transparent hover:bg-slate-200"
          }`}
        >
          👨‍🏫 Kinerja & Jam Guru
        </button>
      </div>

      {/* TAB CONTENT */}
      <div className="mt-6">
        {/* TAB 1: AKADEMIK */}
        {activeTab === "akademik" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Rombel Bar Chart */}
            <div className="lg:col-span-2 bg-white border-4 border-slate-900 p-4 md:p-6 rounded-2xl shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-md md:text-lg font-black uppercase tracking-tight">Rata-Rata Nilai Rombel</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">Komparasi capaian nilai lintas rombongan belajar aktif</p>
                </div>
                <div className="p-2 bg-indigo-100 border-2 border-slate-900 rounded-xl text-indigo-600 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
                  <BarChart3 className="w-5 h-5 stroke-[2.5]" />
                </div>
              </div>
              <div className="h-64 md:h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.charts?.dataNilaiRombel} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="rombel" stroke="#0f172a" tick={{ fontSize: 10, fontWeight: 900 }} />
                    <YAxis stroke="#0f172a" domain={[0, 100]} tick={{ fontSize: 10, fontWeight: 900 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff' }} />
                    <Bar dataKey="nilai" fill="#818cf8" stroke="#0f172a" strokeWidth={3} radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Parallel Ranking Table */}
            <div className="bg-white border-4 border-slate-900 p-4 md:p-6 rounded-2xl shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-md md:text-lg font-black uppercase tracking-tight">Ranking Paralel Teratas</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">5 Besar murid nilai tertinggi gabungan</p>
                </div>
                <div className="p-2 bg-amber-100 border-2 border-slate-900 rounded-xl text-amber-600 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
                  <TrendingUp className="w-5 h-5 stroke-[2.5]" />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b-4 border-slate-900 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                      <th className="pb-3">Nama Siswa</th>
                      <th className="pb-3 text-center">Rombel</th>
                      <th className="pb-3 text-right">Rata2</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-slate-100">
  {stats.charts?.dataTabelRanking?.map((item: any, idx: number) => (
    <tr key={idx} className="hover:bg-slate-50">
      <td className="py-3 text-xs font-mono font-black text-center text-slate-400">
        #{item.rank}
      </td>
      <td className="py-3 text-xs font-black uppercase tracking-tight">
        {item.nama}
        {/* 🌟 Tampilkan NISN di bawah nama siswa dengan warna abu-abu pro */}
        <span className="block text-[9px] font-bold text-slate-400 tracking-wide normal-case mt-0.5">
          {item.nisn ? `NISN: ${item.nisn}` : "NISN: -"}
        </span>
      </td>
      <td className="py-3 text-xs font-black text-center text-indigo-600 uppercase tracking-tight">
        {item.rombel}
      </td>
      <td className="py-3 text-xs font-mono font-black text-right text-emerald-600">
        {item.nilai}
      </td>
    </tr>
  ))}
</tbody>
                </table>
              </div>
            </div>

            {/* Semester Line Chart */}
            <div className="lg:col-span-3 bg-white border-4 border-slate-900 p-4 md:p-6 rounded-2xl shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-md md:text-lg font-black uppercase tracking-tight">Tren Capaian Semester</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">Fluktuasi grafik rata-rata nilai mutu raport dari waktu ke waktu</p>
                </div>
                <div className="p-2 bg-teal-100 border-2 border-slate-900 rounded-xl text-teal-600 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
                  <LineIcon className="w-5 h-5 stroke-[2.5]" />
                </div>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats.charts?.dataPerkembanganSemester} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="semester" stroke="#0f172a" tick={{ fontSize: 10, fontWeight: 900 }} />
                    <YAxis stroke="#0f172a" domain={[60, 100]} tick={{ fontSize: 10, fontWeight: 900 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff' }} />
                    <Line type="monotone" dataKey="rataNilai" stroke="#0d9488" strokeWidth={4} activeDot={{ r: 8 }} dot={{ stroke: '#0f172a', strokeWidth: 3, r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: KINERJA GURU */}
        {activeTab === "guru" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Beban Jam Mengajar Chart */}
            <div className="lg:col-span-2 bg-white border-4 border-slate-900 p-4 md:p-6 rounded-2xl shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-md md:text-lg font-black uppercase tracking-tight">Distribusi Beban Mengajar (JPM)</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">Perhitungan akumulasi alokasi beban mengajar per pekan</p>
                </div>
              </div>
              <div className="h-64 md:h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.charts?.dataJamMengajarGuru} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis type="number" stroke="#0f172a" tick={{ fontSize: 10, fontWeight: 900 }} />
                    <YAxis type="category" dataKey="nama" stroke="#0f172a" tick={{ fontSize: 9, fontWeight: 900 }} width={80} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff' }} />
                    <Bar dataKey="jam" fill="#ec4899" stroke="#0f172a" strokeWidth={3} radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Kinerja Guru Table */}
            <div className="bg-white border-4 border-slate-900 p-4 md:p-6 rounded-2xl shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
              <div className="mb-4">
                <h3 className="text-md md:text-lg font-black uppercase tracking-tight">Status Kelengkapan Nilai</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">Monitoring tertib administrasi nilai raport pendidik</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b-4 border-slate-900 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                      <th className="pb-3">Nama</th>
                      <th className="pb-3 text-center">Absensi</th>
                      <th className="pb-3 text-right">Nilai</th>
                    </tr>
                  </thead>
        <tbody className="divide-y-2 divide-slate-100">
  {stats.charts?.dataTabelKinerjaGuru?.map((item: any, idx: number) => (
    <tr key={idx} className="hover:bg-slate-50">
      <td className="py-3 text-xs font-black uppercase tracking-tight">
        {item.nama}
        {/* 🌟 Menampilkan sub-text NIP asli dari database */}
        <span className="block text-[9px] font-bold text-indigo-600 tracking-wide mt-0.5">
          {item.nip ? `NIP. ${item.nip}` : "NIP: -"}
        </span>
        <span className="block text-[8px] font-bold text-slate-400 mt-0.5">
          {item.mapel}
        </span>
      </td>
      <td className="py-3 text-xs font-mono font-black text-center text-emerald-600">
        {item.kehadiran}%
      </td>
      <td className="py-3 text-right">
        <span className={`px-2 py-0.5 rounded border text-[9px] font-black uppercase ${
          item.inputNilai === 'Lengkap' 
            ? 'bg-emerald-100 border-emerald-400 text-emerald-700' 
            : 'bg-rose-100 border-rose-400 text-rose-700'
        }`}>
          {item.inputNilai}
        </span>
      </td>
    </tr>
  ))}
</tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SYSTEM ALERTS SECTION */}
      <div className="mt-8">
        <div className="mb-4">
          <h2 className="text-lg font-black uppercase tracking-tight">⚠️ PEMBERITAHUAN ADMINISTRASI AKADEMIK</h2>
          <p className="text-xs font-bold text-slate-400 uppercase mt-0.5">Indikator anomali rekap nilai dan log kurikulum sistem</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {dataAlertSistem.map((alert: any) => (
            <div key={alert.id} className="bg-amber-50 border-4 border-slate-900 p-5 rounded-2xl shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <span className="bg-amber-400 text-slate-950 px-2 py-0.5 rounded text-[9px] font-black border-2 border-slate-900 uppercase">
                    ⚠ {alert.tipe}
                  </span>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-tight">
                    {alert.kategori}
                  </span>
                </div>
                <p className="text-xs font-black text-slate-900 leading-relaxed uppercase tracking-tight">
                  {alert.pesan}
                </p>
              </div>
              <div className="mt-4 pt-2 border-t border-slate-900/10 flex justify-between items-center text-[9px] font-bold text-slate-400 uppercase">
                <span>Waktu: {alert.waktu}</span>
              </div>
            </div>
          ))}
          {dataAlertSistem.length === 0 && (
            <div className="col-span-1 md:col-span-3 bg-emerald-50 border-4 border-emerald-900 p-8 rounded-2xl text-center shadow-[4px_4px_0px_0px_#10b981]">
              <p className="text-sm font-black text-emerald-900 uppercase tracking-wider">
                🎉 Administrasi Nilai & Kurikulum Berjalan Sempurna!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}