"use client";

import { useState } from "react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from "recharts";

// Warna estetik untuk grafik kesiswaan
const COLORS = ["#10B981", "#F59E0B", "#EF4444", "#3B82F6"];
const KATEGORI_COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300"];

interface DashboardProps {
  initialStats: any;
  userSession: any;
  namaSekolah: string;
}

export default function WakilKesiswaanDashboardClient({ initialStats, userSession, namaSekolah }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<"kehadiran" | "kedisiplinan" | "prestasi" | "alumni">("kehadiran");

  if (!initialStats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-500 font-semibold">Gagal memuat data statistik kesiswaan. Silakan coba lagi.</p>
      </div>
    );
  }

  const { cards, charts } = initialStats;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 bg-slate-50 min-h-screen text-slate-800">
      
      {/* HEADER DASHBOARD */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b pb-4 border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard Wakil Kesiswaan & BK</h1>
          <p className="text-sm text-slate-500 font-medium">{namaSekolah} • Sesi: {userSession?.user?.email}</p>
        </div>
        <div className="mt-2 md:mt-0 px-3 py-1.5 bg-indigo-100 text-indigo-700 font-semibold rounded-full text-xs tracking-wider uppercase">
          Murni Hak Akses Kesiswaan
        </div>
      </div>

      {/* EMERGENCY SYSTEM ALERTS (BK / KESISWAAN DETECT) */}
      {charts.dataAlertSistem && charts.dataAlertSistem.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl shadow-sm">
          <div className="flex items-center">
            <span className="text-xl mr-2">⚠️</span>
            <h4 className="font-bold text-red-800 text-sm tracking-wide">PERHATIAN SISTEM BK / KESISWAAN</h4>
          </div>
          {charts.dataAlertSistem.map((alert: any) => (
            <p key={alert.id} className="text-xs text-red-700 mt-1 font-medium">
              • {alert.pesan} <span className="font-bold underline ml-1">({alert.waktu})</span>
            </p>
          ))}
        </div>
      )}

      {/* SUMMARY STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Murid Aktif</div>
          <div className="text-3xl font-extrabold text-slate-900 mt-2">{cards.totalSiswa}</div>
          <div className="text-xs text-slate-400 mt-1">Siswa terdaftar dalam rombel aktif</div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Rata-Rata Absensi Siswa (Bulan Ini)</div>
          <div className="text-3xl font-extrabold text-emerald-600 mt-2">{cards.rataKehadiran}</div>
          <div className="text-xs text-emerald-600 font-medium mt-1">🎯 Target Sekolah Selalu &gt; 95%</div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Pelanggaran (Bulan Ini)</div>
          <div className="text-3xl font-extrabold text-amber-600 mt-2">{cards.totalKasusBulanIni}</div>
          <div className="text-xs text-slate-400 mt-1">Dicatat oleh Tim Tatib / Guru Piket</div>
        </div>
      </div>

      {/* TABS NAVIGATION KESISWAAN - SEKARANG ANTI OFFSIDE */}
<div className="border-b border-slate-200">
  <div className="flex gap-2 overflow-x-auto scrollbar-none snap-x pb-px -mb-px">
    {(["kehadiran", "kedisiplinan", "prestasi", "alumni"] as const).map((tab) => (
      <button
        key={tab}
        onClick={() => setActiveTab(tab)}
        className={`px-4 py-2.5 text-sm font-semibold capitalize border-b-2 transition-all whitespace-nowrap snap-mini snap-start ${
          activeTab === tab
            ? "border-indigo-600 text-indigo-600"
            : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
        }`}
      >
        {tab === "alumni" ? "Tracer Study & Alumni" : tab}
      </button>
    ))}
  </div>
</div>

      {/* TAB CONTENT SPACES */}
      <div className="space-y-6">
        
        {/* TAB 1: KEHADIRAN / ABSENSI */}
        {activeTab === "kehadiran" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 lg:col-span-2">
              <h3 className="text-base font-bold text-slate-900 mb-4">Tren Ketidakhadiran Bulanan (Sakit, Izin, Alfa)</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={charts.dataTrenBulananAbsensi}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="bulan" stroke="#94a3b8" fontSize={12} />
                    <YAxis stroke="#94a3b8" fontSize={12} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="alfa" stroke="#EF4444" strokeWidth={2.5} name="Siswa Alfa" />
                    <Line type="monotone" dataKey="sakitIzin" stroke="#F59E0B" strokeWidth={2} name="Sakit / Izin" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 mb-2">Proporsi Kehadiran Bulan Ini</h3>
                <div className="h-56 flex justify-center items-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={charts.dataPieKehadiran}
                        cx="50%" cy="50%"
                        innerRadius={60} outerRadius={80}
                        paddingAngle={5} dataKey="value"
                      >
                        {charts.dataPieKehadiran.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs font-semibold mt-4">
                {charts.dataPieKehadiran.map((item: any, i: number) => (
                  <div key={item.name} className="flex items-center space-x-1.5">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                    <span className="text-slate-600">{item.name}: {item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* SISWA RISK MONITORING (BK EMERGENCY) */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 lg:col-span-3">
              <h3 className="text-base font-bold text-slate-900 mb-1">🚨 Top 5 Siswa dengan Kehadiran Terendah (Rentan Putus Sekolah)</h3>
              <p className="text-xs text-slate-400 mb-4">Rekomendasi utama untuk segera dipanggil oleh Guru BK atau Wali Kelas.</p>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 text-xs font-bold uppercase tracking-wider">
                      <th className="py-3 px-4">Nama Siswa</th>
                      <th className="py-3 px-4">Kelas / Rombel</th>
                      <th className="py-3 px-4">Persentase Hadir</th>
                      <th className="py-3 px-4">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm font-medium">
  {charts.dataSiswaBermasalah.length === 0 ? (
    <tr>
      <td colSpan={4} className="py-4 text-center text-slate-400">
        🎉 Luar biasa! Tidak ada siswa dengan kehadiran di bawah standar bulan ini.
      </td>
    </tr>
  ) : (
    charts.dataSiswaBermasalah.map((siswa: any, i: number) => (
      <tr key={i} className="hover:bg-slate-50/50">
        <td className="py-3 px-4 text-slate-900">{siswa.nama}</td>
        <td className="py-3 px-4 text-slate-600">{siswa.kelas}</td>
        <td className={`py-3 px-4 font-bold ${siswa.absensi < 75 ? 'text-red-600' : 'text-amber-600'}`}>
          {siswa.absensi}%
        </td>
        <td className="py-3 px-4">
          {/* 🌟 KUNCI: Cek persentase sebelum memberi tindakan */}
          {siswa.absensi < 75 ? (
            <span className="px-2 py-1 bg-red-100 text-red-700 font-semibold rounded text-xs shadow-sm">
              🚨 Panggil Orang Tua / BK
            </span>
          ) : (
            <span className="px-2 py-1 bg-amber-100 text-amber-700 font-semibold rounded text-xs shadow-sm">
              ⚠️ Peringatan / Teguran Wali Kelas
            </span>
          )}
        </td>
      </tr>
    ))
  )}
</tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: KEDISIPLINAN */}
        {activeTab === "kedisiplinan" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 mb-2">Komposisi Kategori Pelanggaran</h3>
                <div className="h-56 flex justify-center items-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={charts.dataPiePelanggaran}
                        cx="50%" cy="50%" labelLine={false}
                        outerRadius={85} fill="#8884d8" dataKey="value"
                      >
                        {charts.dataPiePelanggaran.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={KATEGORI_COLORS[index % KATEGORI_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs font-semibold mt-4">
                {charts.dataPiePelanggaran.map((item: any, i: number) => (
                  <div key={item.name} className="flex items-center space-x-1.5">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: KATEGORI_COLORS[i] }} />
                    <span className="text-slate-600">{item.name}: {item.value} Kasus</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 lg:col-span-2">
              <h3 className="text-base font-bold text-slate-900 mb-1">Top Kelas dengan Kasus Pelanggaran Terbanyak</h3>
              <p className="text-xs text-slate-400 mb-4">Gunakan data ini untuk evaluasi intensif bersama Wali Kelas terkait tata tertib.</p>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 text-xs font-bold uppercase tracking-wider">
                      <th className="py-3 px-4">Kelas</th>
                      <th className="py-3 px-4">Wali Kelas</th>
                      <th className="py-3 px-4 text-center">Total Kasus</th>
                      <th className="py-3 px-4">Trend Ketertiban</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm font-medium">
                    {charts.dataKelasPelanggaranTerbanyak.map((item: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-3 px-4 text-slate-900 font-bold">{item.kelas}</td>
                        <td className="py-3 px-4 text-slate-600">{item.waliKelas}</td>
                        <td className="py-3 px-4 text-center text-amber-600 font-bold">{item.totalKasus}</td>
                        <td className="py-3 px-4 text-xs text-slate-500">{item.statusTrend}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: PRESTASI & LOMBA */}
        {activeTab === "prestasi" && (
          <div className="space-y-6">
            {/* Cards Tingkat Lomba */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {charts.kartuTingkatLomba.map((lomba: any, index: number) => (
                <div key={index} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center space-x-4">
                  <span className={`p-3 rounded-xl ${lomba.color} text-xl shadow-sm`}>{lomba.icon}</span>
                  <div>
                    <h5 className="text-xs text-slate-400 font-bold uppercase tracking-wider">{lomba.tingkat}</h5>
                    <p className="text-lg font-extrabold text-slate-900 mt-0.5">{lomba.jumlah}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Tren Tahunan Perolehan Medali */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
              <h3 className="text-base font-bold text-slate-900 mb-4">Grafik Tren Perolehan Juara Ekstrakurikuler & Lomba</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={charts.dataPrestasiTahunan}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="tahun" stroke="#94a3b8" fontSize={12} />
                    <YAxis stroke="#94a3b8" fontSize={12} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="emas" fill="#FBBF24" name="Juara 1 / Emas" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="perak" fill="#94A3B8" name="Juara 2 / Perak" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="perunggu" fill="#B45309" name="Juara 3 / Perunggu" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: TRACER STUDY & ALUMNI */}
        {activeTab === "alumni" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 lg:col-span-1">
              <h3 className="text-base font-bold text-slate-900 mb-4">Rasio Kelulusan & Lanjut PTN/PTS</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={charts.dataTrenKelulusanAlumni}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="tahun" stroke="#94a3b8" fontSize={12} />
                    <YAxis unit="%" stroke="#94a3b8" fontSize={12} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="kelulusan" stroke="#10B981" strokeWidth={2.5} name="% Kelulusan UN/ASAS" />
                    <Line type="monotone" dataKey="lanjutKuliah" stroke="#3B82F6" strokeWidth={2} name="% Kuliah (Tracer)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 lg:col-span-2">
              <h3 className="text-base font-bold text-slate-900 mb-1">Destinasi Favorit Alumni & Jalur Masuk</h3>
              <p className="text-xs text-slate-400 mb-4">Laporan sebaran alumni (Kuliah, Kerja, Wirausaha) untuk menaikkan nilai akreditasi sekolah.</p>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 text-xs font-bold uppercase tracking-wider">
                      <th className="py-3 px-4">Nama Instansi / Perusahaan</th>
                      <th className="py-3 px-4">Klaster Kategori</th>
                      <th className="py-3 px-4">Jalur Terbanyak</th>
                      <th className="py-3 px-4 text-center">Jumlah Siswa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm font-medium">
                    {charts.dataTabelAlumni.map((alumni: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-50/50">
                        <td className="py-3 px-4 text-slate-900">{alumni.targetTujuan}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                            alumni.kategori === 'KULIAH' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                          }`}>{alumni.kategori}</span>
                        </td>
                        <td className="py-3 px-4 text-slate-600">{alumni.jalurFavorit}</td>
                        <td className="py-3 px-4 text-center text-slate-900 font-bold">{alumni.jumlahSiswa} Orang</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}