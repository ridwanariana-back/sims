// app/wakakurikulum/page.tsx
"use client";

import { useState, useEffect } from "react";
import { getKepalaSekolahStats } from "@/lib/actions"; // Menggunakan action yang sama atau disesuaikan
import { 
  Users, 
  GraduationCap, 
  CheckCircle2, 
  TrendingUp, 
  BarChart3, 
  BookOpen 
} from "lucide-react";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip 
} from "recharts";

export default function WakaKurikulumPage() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    getKepalaSekolahStats().then(setStats);
  }, []);

  // Data Visualisasi Akademik & Kurikulum
  const dataPerkembanganSekolah = [
    { tahun: "2023", siswa: 850 },
    { tahun: "2024", siswa: 920 },
    { tahun: "2025", siswa: 980 },
    { tahun: "2026", siswa: 1024 },
  ];

  const dataNilaiRombel = [
    { rombel: "X-A", nilai: 78 },
    { rombel: "X-B", nilai: 82 },
    { rombel: "XI-A", nilai: 85 },
    { rombel: "XI-B", nilai: 80 },
    { rombel: "XII-A", nilai: 89 },
    { rombel: "XII-B", nilai: 87 },
  ];

  const dataRataNilaiPerKelas = [
    { kelas: "X.1", rataRata: 84 },
    { kelas: "X.2", rataRata: 79 },
    { kelas: "XI.1", rataRata: 88 },
    { kelas: "XI.2", rataRata: 82 },
    { kelas: "XII.1", rataRata: 91 },
    { kelas: "XII.2", rataRata: 85 },
  ];

  const dataPerkembanganSemester = [
    { semester: "2024 Ganjil", rataNilai: 78 },
    { semester: "2024 Genap", rataNilai: 81 },
    { semester: "2025 Ganjil", rataNilai: 83 },
    { semester: "2025 Genap", rataNilai: 86 },
  ];

  const dataTabelRanking = [
    { nama: "Andi Wijaya", kelas: "XII.1", nilai: 94 },
    { nama: "Siti Rahma", kelas: "XI.1", nilai: 92 },
    { nama: "Budi Santoso", kelas: "XII.1", nilai: 90 },
    { nama: "Citra Lestari", kelas: "X.1", nilai: 89 },
    { nama: "Dewi Anwar", kelas: "XI.2", text: 88 },
  ];

  const dataJamMengajarGuru = [
    { nama: "Supardi, M.Pd", jam: 24 },
    { nama: "Siti Aminah, S.Pd", jam: 28 },
    { nama: "Hendra, S.Kom", jam: 18 },
    { nama: "Rinaawati, S.Si", jam: 22 },
    { nama: "Bambang, M.Si", jam: 26 },
  ];

  const dataTabelKinerjaGuru = [
    { nama: "Supardi, M.Pd", mapel: "Matematika", kehadiran: 98, inputNilai: "Lengkap" },
    { nama: "Siti Aminah, S.Pd", mapel: "Bahasa Inggris", kehadiran: 95, inputNilai: "Lengkap" },
    { nama: "Hendra, S.Kom", mapel: "Informatika", kehadiran: 92, inputNilai: "Belum Lengkap" },
    { nama: "Rinaawati, S.Si", mapel: "Biologi", kehadiran: 100, inputNilai: "Lengkap" },
    { nama: "Bambang, M.Si", mapel: "Fisika", kehadiran: 89, inputNilai: "Belum Lengkap" },
  ];

  // Alert Khusus disaring hanya untuk ranah Kurikulum & Administrasi Mengajar
  const dataAlertSistem = [
    { 
      id: 1, 
      tipe: "WARNING", 
      pesan: "Rata-rata nilai akhir ujian Matematika menurun sebesar 15% di tingkat kelas X", 
      kategori: "Kurikulum",
      waktu: "2 jam yang lalu" 
    },
    { 
      id: 2, 
      tipe: "WARNING", 
      pesan: "3 guru mata pelajaran belum menyelesaikan input nilai raport semester ganjil", 
      kategori: "Administrasi",
      waktu: "Hari ini" 
    },
  ];

  if (!stats) {
    return (
      <div className="p-20 text-center font-black tracking-widest text-slate-900 animate-pulse uppercase text-sm">
        ▓▒░ MEMUAT PANEL KEDEPANAN KURIKULUM... ░▒▓
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-10 space-y-10 bg-slate-50 min-h-screen selection:bg-indigo-500 selection:text-white">
      
      {/* HEADER UTAMA WAKA KURIKULUM */}
      <div className="bg-white p-8 rounded-[2rem] border-4 border-slate-900 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase px-3 py-1 rounded-full border border-emerald-300 tracking-wider">
            Bidang Akademik & Pengajaran
          </span>
          <h1 className="text-3xl lg:text-4xl font-black text-slate-900 uppercase tracking-tighter mt-2">
            Dashboard Wakil Kurikulum
          </h1>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
            Panel Pemantauan Mutu Pembelajaran, Capaian Target KKM, dan Administrasi Guru
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tahun Ajaran Aktif</p>
          <p className="text-sm font-black text-slate-900 bg-amber-300 border-2 border-slate-900 px-4 py-1.5 rounded-xl mt-1 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
            2025/2026
          </p>
        </div>
      </div>

      {/* SUMMARY CARDS KONTROL KURIKULUM */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: "Total Siswa", value: "1,024", subtitle: "Target Evaluasi", icon: <Users size={22} />, color: "bg-blue-400" },
          { title: "Total Guru", value: "68", subtitle: "Pendidik Aktif", icon: <GraduationCap size={22} />, color: "bg-purple-400" },
          { title: "Ketuntasan KKM", value: "87%", subtitle: "Rerata Sekolah", icon: <CheckCircle2 size={22} />, color: "bg-rose-400" },
          { title: "Beban Jam Kerja", value: "100%", subtitle: "Sesuai Dapodik", icon: <BookOpen size={22} />, color: "bg-cyan-400" },
        ].map((card, idx) => (
          <div 
            key={idx} 
            className="bg-white p-6 rounded-2xl border-4 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] flex items-center justify-between group hover:-translate-y-1 transition-all duration-200"
          >
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{card.title}</p>
              <h3 className="text-3xl font-black text-slate-900 tracking-tight">{card.value}</h3>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">{card.subtitle}</p>
            </div>
            <div className={`p-3.5 rounded-xl text-slate-950 border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] ${card.color}`}>
              {card.icon}
            </div>
          </div>
        ))}
      </div>

      {/* PANEL GRAFIK INDUK AKADEMIK */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* 1. Grafik Perkembangan Jumlah Siswa (Kebutuhan Perhitungan Rombel) */}
        <div className="bg-white p-6 rounded-[2rem] border-4 border-slate-900 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-blue-100 border border-blue-400 rounded-lg text-blue-600"><TrendingUp size={16} /></div>
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Tren Pertumbuhan Pengisi Rombel</h3>
            </div>
            <div className="w-full h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dataPerkembanganSekolah} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="tahun" tick={{ fill: "#64748b", fontSize: 10, fontWeight: "bold" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#64748b", fontSize: 10, fontWeight: "bold" }} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Area type="monotone" dataKey="siswa" stroke="#2563eb" strokeWidth={3} fill="rgba(59, 130, 246, 0.1)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <p className="text-[9px] font-bold text-slate-400 uppercase mt-4 border-t pt-3 italic">Acuan alokasi distribusi rombongan belajar baru tahun ajaran mendatang.</p>
        </div>

        {/* 2. Grafik Nilai Rerata Tingkat Rombel */}
        <div className="bg-white p-6 rounded-[2rem] border-4 border-slate-900 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-purple-100 border border-purple-400 rounded-lg text-purple-600"><BarChart3 size={16} /></div>
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Rata-Rata Nilai Kognitif Rombel</h3>
            </div>
            <div className="w-full h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dataNilaiRombel} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="rombel" tick={{ fill: "#64748b", fontSize: 10, fontWeight: "bold" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#64748b", fontSize: 10, fontWeight: "bold" }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} />
                  <Bar dataKey="nilai" fill="#7c3aed" radius={[6, 6, 0, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <p className="text-[9px] font-bold text-slate-400 uppercase mt-4 border-t pt-3 italic">Perbandingan pencapaian serapan materi kurikulum lintas rombel.</p>
        </div>

      </div>

      {/* SECTION ANALISIS AKADEMIK MENDALAM */}
      <div className="space-y-6 pt-6 border-t-4 border-dashed border-slate-200">
        <div>
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
            <span>📊</span>Analisis Capaian & Hasil Belajar Siswa
          </h2>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
            Pemantauan berkala rata-rata nilai per kelas, grafik evaluasi lintasan semester, dan peringkat pararel
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Rata-Rata Nilai Per Kelas */}
          <div className="bg-white p-6 rounded-[2rem] border-4 border-slate-900 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)]">
            <div className="mb-4">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Rata-Rata Nilai Per Kelas</h3>
            </div>
            <div className="w-full h-[230px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dataRataNilaiPerKelas} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="kelas" tick={{ fill: "#64748b", fontSize: 10, fontWeight: "bold" }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 10, fontWeight: "bold" }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} />
                  <Bar dataKey="rataRata" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={26} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Tren Nilai Lintas Semester */}
          <div className="bg-white p-6 rounded-[2rem] border-4 border-slate-900 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)]">
            <div className="mb-4">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">📈 Tren Nilai Lintas Semester</h3>
            </div>
            <div className="w-full h-[230px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dataPerkembanganSemester} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="semester" tick={{ fill: "#64748b", fontSize: 10, fontWeight: "bold" }} axisLine={false} tickLine={false} />
                  <YAxis domain={[50, 100]} tick={{ fill: "#64748b", fontSize: 10, fontWeight: "bold" }} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="rataNilai" stroke="#ec4899" strokeWidth={4} dot={{ r: 5, strokeWidth: 2 }} activeDot={{ r: 7 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Tabel Ranking Pararel Teratas */}
          <div className="bg-white p-6 rounded-[2rem] border-4 border-slate-900 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] flex flex-col justify-between">
            <div>
              <div className="mb-4">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">🏆 Tabel Ranking Pararel Teratas</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b-2 border-slate-900 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                      <th className="pb-2">Nama</th>
                      <th className="pb-2 text-center">Kelas</th>
                      <th className="pb-2 text-right">Nilai</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-bold">
                    {dataTabelRanking.map((siswa, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="py-2.5 text-slate-900 uppercase tracking-tight flex items-center gap-1.5">
                          <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black ${i === 0 ? 'bg-amber-300 border border-slate-900' : 'bg-slate-100'}`}>
                            {i + 1}
                          </span>
                          {siswa.nama}
                        </td>
                        <td className="py-2.5 text-center text-slate-500">{siswa.kelas}</td>
                        <td className="py-2.5 text-right font-black text-indigo-600">{siswa.nilai}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <p className="text-[9px] font-bold text-slate-400 uppercase mt-2 pt-2 border-t border-dashed italic">
              Menampilkan acuan data 5 besar capaian nilai raport tertinggi pararel sekolah.
            </p>
          </div>

        </div>
      </div>

      {/* SECTION EVALUASI BEBAN & KINERJA MENGAJAR GURU */}
      <div className="space-y-6 pt-6 border-t-4 border-dashed border-slate-200">
        <div>
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
            <span>👩‍🏫</span>Beban Jam Kurikulum & Administrasi Guru
          </h2>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
            Validasi kecukupan alokasi jam mengajar serta ketepatan pelaporan nilai perangkat mengajar guru
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Grafik Batang Alokasi Jam Mengajar */}
          <div className="bg-white p-6 rounded-[2rem] border-4 border-slate-900 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] lg:col-span-1">
            <div className="mb-4">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">📊 Total Jam Mengajar / Minggu</h3>
            </div>
            <div className="w-full h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dataJamMengajarGuru} layout="vertical" margin={{ top: 10, right: 10, left: 20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" tick={{ fill: "#64748b", fontSize: 10, fontWeight: "bold" }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="nama" type="category" tick={{ fill: "#0f172a", fontSize: 9, fontWeight: "black" }} axisLine={false} tickLine={false} width={90} />
                  <Tooltip />
                  <Bar dataKey="jam" fill="#7c3aed" radius={[0, 6, 6, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Tabel Status Administrasi Raport & Kehadiran Mengajar */}
          <div className="bg-white p-6 rounded-[2rem] border-4 border-slate-900 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] lg:col-span-2 flex flex-col justify-between">
            <div>
              <div className="mb-4">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">📋 Rekapitulasi Kehadiran Kelas & Status Input Nilai</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b-2 border-slate-900 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                      <th className="pb-3">Nama Guru / Mapel</th>
                      <th className="pb-3 text-center">Presensi KBM</th>
                      <th className="pb-3 text-right">Kelengkapan Nilai</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-bold">
                    {dataTabelKinerjaGuru.map((guru, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-3">
                          <p className="text-slate-900 uppercase tracking-tight font-black">{guru.nama}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">{guru.mapel}</p>
                        </td>
                        <td className="py-3 text-center">
                          <span className={`px-2.5 py-1 rounded-lg font-black font-mono ${guru.kehadiran < 90 ? 'text-amber-600 bg-amber-50' : 'text-emerald-600 bg-emerald-50'}`}>
                            {guru.kehadiran}%
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <span className={`inline-block px-3 py-1 rounded-xl text-[9px] font-black uppercase border-2 tracking-wider ${
                            guru.inputNilai === "Lengkap" 
                              ? "bg-emerald-50 border-emerald-200 text-emerald-700 shadow-[2px_2px_0px_0px_rgba(16,185,129,0.1)]" 
                              : "bg-rose-50 border-rose-200 text-rose-700 shadow-[2px_2px_0px_0px_rgba(244,63,94,0.1)]"
                          }`}>
                            {guru.inputNilai}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <p className="text-[9px] font-bold text-slate-400 uppercase mt-4 pt-2 border-t border-dashed italic">
              *Beban mengajar formil dipantau agar memenuhi batas minimal sertifikasi pengajaran Dapodik (24 Jam/Minggu).
            </p>
          </div>

        </div>
      </div>

      {/* SECTION ANOMALI & NOTIFIKASI KHUSUS KURIKULUM */}
      <div className="space-y-6 pt-6 border-t-4 border-dashed border-slate-200">
        <div>
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
            <span>🚨</span>Instruksi Kilat & Peringatan Akademik
          </h2>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
            Sistem deteksi dini otomatis (*Early Warning*) untuk anomali capaian KKM dan keterlambatan administrasi pengajaran
          </p>
        </div>

        <div className="bg-white p-6 lg:p-8 rounded-[2rem] border-4 border-slate-900 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] space-y-4">
          <div className="flex justify-between items-center border-b-2 border-slate-900 pb-3">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500 border border-slate-900"></span>
              </span>
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">
                Anomali Kurikulum Aktif ({dataAlertSistem.length} Temuan Kasus)
              </h3>
            </div>
            <span className="text-[9px] font-black uppercase text-slate-400 bg-slate-100 border border-slate-300 px-2 py-0.5 rounded">
              Academic Engine
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dataAlertSistem.map((alert) => (
              <div 
                key={alert.id} 
                className="p-5 rounded-2xl border-4 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] flex flex-col justify-between transition-transform hover:-translate-y-0.5 bg-amber-50/50 border-amber-950 shadow-[4px_4px_0px_0px_#f59e0b]"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="px-2.5 py-0.5 rounded-md text-[9px] font-black uppercase border-2 border-slate-900 bg-amber-400 text-slate-950">
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
                  <span>Status: Evaluasi Rapat Kurikulum</span>
                  <span className="font-mono">{alert.waktu}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}