// app/kepalasekolah/page.tsx
"use client";

import { useState, useEffect } from "react";
import { getKepalaSekolahStats } from "@/lib/actions";
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
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart,  
  Pie,       
  Cell,
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip 
} from "recharts";

export default function KepalaSekolahPage() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    getKepalaSekolahStats().then(setStats);
  }, []);

  // Data Dummy untuk Visualisasi Grafik Tesis (Bisa diintegrasikan ke backend nantinya)
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
    { rombel: "XII-B", text: 87 },
  ];

  const dataTrenKehadiran = [
    { tgl: "01 Mei", persen: 92 },
    { tgl: "05 Mei", persen: 95 },
    { tgl: "10 Mei", persen: 94 },
    { tgl: "15 Mei", persen: 96 },
    { tgl: "18 Mei", persen: 94 },
  ];

  // 1. TAMBAHKAN DATA DUMMY AKADEMIK INI DI ATAS (Di bawah useEffect / data sebelumnya)
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
  { nama: "Dewi Anwar", kelas: "XI.2", nilai: 88 },
];

// 1. TAMBAHKAN DATA DAN WARNA INI DI ATAS (Di bawah deklarasi data sebelumnya)
const dataPieKehadiran = [
  { name: "Hadir", value: 850 },
  { name: "Izin", value: 64 },
  { name: "Sakit", value: 82 },
  { name: "Alfa", value: 28 },
];

// Palette warna tegas Neo-Brutalisme untuk Pie Chart
const COLORS_KEHADIRAN = ["#10b981", "#f59e0b", "#3b82f6", "#ef4444"]; 
// Hijau (Hadir), Kuning (Izin), Biru (Sakit), Merah (Alfa)

const dataTrenBulananAbsensi = [
  { bulan: "Jan", alfa: 12, sakitIzin: 45 },
  { bulan: "Feb", alfa: 19, sakitIzin: 50 },
  { bulan: "Mar", alfa: 8, sakitIzin: 38 },
  { bulan: "Apr", alfa: 25, sakitIzin: 62 },
  { bulan: "Mei", alfa: 28, sakitIzin: 55 },
];

// 1. TAMBAHKAN DATA DUMMY MONITORING INI DI ATAS (Bersama dengan data dummy lainnya)
const dataSiswaBermasalah = [
  { nama: "Budi Santoso", kelas: "X.1", nilai: 60, absensi: 40 },
  { nama: "Rian Hidayat", kelas: "XI.3", nilai: 64, absensi: 78 },
  { nama: "Siti Rahma", kelas: "XII.1", nilai: 88, absensi: 95 },
  { nama: "Ahmad Fauzi", kelas: "X.2", nilai: 71, absensi: 82 },
  { nama: "Dewi Lestari", kelas: "XI.2", nilai: 55, absensi: 90 },
];

// Fungsi helper untuk menentukan status indikator warna secara dinamis
const getStatusIndicator = (nilai: number, absensi: number) => {
  if (absensi < 75 || nilai < 65) {
    return { icon: "🔴", text: "KRITIS", bgColor: "bg-rose-50 text-rose-700 border-rose-200" };
  }
  if ((absensi >= 75 && absensi <= 85) || (nilai >= 65 && nilai < 75)) {
    return { icon: "🟡", text: "PERHATIAN", bgColor: "bg-amber-50 text-amber-700 border-amber-200" };
  }
  return { icon: "🟢", text: "AMAN", bgColor: "bg-emerald-50 text-emerald-700 border-emerald-200" };
};

// 1. TAMBAHKAN DATA DUMMY PRESTASI INI DI ATAS (Bersama data dummy lainnya)
const dataPrestasiTahunan = [
  { tahun: "2023", emas: 12, perak: 18, perunggu: 25 },
  { tahun: "2024", emas: 16, perak: 22, perunggu: 30 },
  { tahun: "2025", emas: 21, perak: 25, perunggu: 34 },
  { tahun: "2026", emas: 28, perak: 32, perunggu: 40 },
];

const kartuTingkatLomba = [
  { tingkat: "Nasional / Internasional", jumlah: "8 Piala", color: "bg-amber-300", icon: "🌐" },
  { tingkat: "Tingkat Provinsi", jumlah: "14 Piala", color: "bg-cyan-300", icon: "🏛️" },
  { tingkat: "Tingkat Kabupaten/Kota", jumlah: "32 Piala", color: "bg-purple-300", icon: "🏆" },
  { tingkat: "Tingkat Kecamatan", jumlah: "41 Piala", color: "bg-emerald-300", icon: "🥇" },
];

// 1. TAMBAHKAN DATA DUMMY GURU INI DI ATAS (Bersama data dummy lainnya)
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

// 1. TAMBAHKAN DATA DAN WARNA INI DI ATAS (Di bawah deklarasi data sebelumnya)
const dataPiePelanggaran = [
  { name: "Keterlambatan", value: 45 },
  { name: "Atribut / Seragam", value: 32 },
  { name: "Kerapian Rambut", value: 18 },
  { name: "Sanksi Berat (Bolos/Merokok)", value: 12 },
];

// Warna kontras tegas untuk jenis pelanggaran
const COLORS_PELANGGARAN = ["#f59e0b", "#3b82f6", "#a855f7", "#ef4444"];
// Kuning (Late), Biru (Uniform), Ungu (Hair), Merah (Heavy)

const dataKelasPelanggaranTerbanyak = [
  { kelas: "X.2", waliKelas: "Siti Aminah, S.Pd", totalKasus: 28, statusTrend: "📈 Naik" },
  { kelas: "XI.1", waliKelas: "Hendra, S.Kom", totalKasus: 22, statusTrend: "📉 Turun" },
  { kelas: "X.1", waliKelas: "Supardi, M.Pd", totalKasus: 19, statusTrend: "➖ Stabil" },
  { kelas: "XII.2", waliKelas: "Bambang, M.Si", totalKasus: 14, statusTrend: "📉 Turun" },
];

// 1. TAMBAHKAN DATA DUMMY ALUMNI INI DI ATAS (Bersama data dummy lainnya)
const dataTrenKelulusanAlumni = [
  { tahun: "2023", kelulusan: 100, lanjutKuliah: 65 },
  { tahun: "2024", kelulusan: 100, lanjutKuliah: 72 },
  { tahun: "2025", kelulusan: 100, lanjutKuliah: 78 },
  { tahun: "2026", kelulusan: 100, lanjutKuliah: 84 },
];

const dataTabelAlumni = [
  { targetTujuan: "Universitas Sriwijaya (UNSRI)", kategori: "PTN Daerah", jumlahSiswa: 45, jalurFavorit: "SNBP / SNBT" },
  { targetTujuan: "UIN Raden Fatah Palembang", kategori: "PTKIN Islam", jumlahSiswa: 28, jalurFavorit: "SPAN-PTKIN" },
  { targetTujuan: "Politeknik Negeri Sriwijaya", kategori: "Vokasi Negeri", jumlahSiswa: 19, jalurFavorit: "Mandiri / SNBP" },
  { targetTujuan: "Langsung Bekerja / Wirausaha", kategori: "Karier & Industri", jumlahSiswa: 15, jalurFavorit: "BKK Sekolah" },
  { targetTujuan: "Universitas Muhammadiyah", kategori: "PTS Swasta", jumlahSiswa: 12, jalurFavorit: "Prestasi" },
];

// 1. TAMBAHKAN DATA DUMMY NOTIFIKASI INI DI ATAS (Bersama data dummy lainnya)
const dataAlertSistem = [
  { 
    id: 1, 
    tipe: "CRITICAL", 
    pesan: "5 siswa memiliki persentase absensi di bawah 70%", 
    kategori: "Kesiswaan / BK",
    waktu: "Baru saja" 
  },
  { 
    id: 2, 
    tipe: "WARNING", 
    pesan: "Rata-rata nilai akhir ujian Matematika menurun sebesar 15% di tingkat kelas X", 
    kategori: "Kurikulum",
    waktu: "2 jam yang lalu" 
  },
  { 
    id: 3, 
    tipe: "WARNING", 
    pesan: "3 guru mata pelajaran belum menyelesaikan input nilai raport semester ganjil", 
    kategori: "Administrasi",
    waktu: "Hari ini" 
  },
];

  if (!stats) {
    return (
      <div className="p-20 text-center font-black tracking-widest text-slate-900 animate-pulse uppercase text-sm">
        ▓▒░ MEMUAT DASHBOARD RINGKASAN SEKOLAH... ░▒▓
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-10 space-y-10 bg-slate-50 min-h-screen selection:bg-indigo-500 selection:text-white">
      
      {/* HEADER UTAMA */}
      <div className="bg-white p-8 rounded-[2rem] border-4 border-slate-900 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="bg-indigo-100 text-indigo-700 text-[10px] font-black uppercase px-3 py-1 rounded-full border border-indigo-300 tracking-wider">
            Executive Information System (EIS)
          </span>
          <h1 className="text-3xl lg:text-4xl font-black text-slate-900 uppercase tracking-tighter mt-2">
            Ringkasan Kondisi Sekolah
          </h1>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
            Panel Pemantauan Umum Kepala Sekolah dalam Satu Layar
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tahun Ajaran Aktif</p>
          <p className="text-sm font-black text-slate-900 bg-amber-300 border-2 border-slate-900 px-4 py-1.5 rounded-xl mt-1 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
            2025/2026
          </p>
        </div>
      </div>

      {/* BAGIAN ATAS: SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: "Total Siswa", value: "1,024", subtitle: "Siswa Terdaftar", icon: <Users size={22} />, color: "bg-blue-400" },
          { title: "Total Guru", value: "68", subtitle: "Tenga Pendidik", icon: <GraduationCap size={22} />, color: "bg-purple-400" },
          { title: "Rata Kehadiran", value: "94%", subtitle: "Bulan Berjalan", icon: <CalendarCheck size={22} />, color: "bg-emerald-400" },
          { title: "Ketuntasan KKM", value: "87%", subtitle: "Target Kurikulum", icon: <CheckCircle2 size={22} />, color: "bg-rose-400" },
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

      {/* DI BAWAHNYA: PANEL GRAFIK UTAMA */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* 1. Grafik Perkembangan Sekolah */}
        <div className="bg-white p-6 rounded-[2rem] border-4 border-slate-900 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-blue-100 border border-blue-400 rounded-lg text-blue-600"><TrendingUp size={16} /></div>
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Perkembangan Sekolah (Siswa)</h3>
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
          <p className="text-[9px] font-bold text-slate-400 uppercase mt-4 border-t pt-3 italic">Menampilkan tren penambahan kuota murid 4 tahun terakhir.</p>
        </div>

        {/* 2. Grafik Nilai Akademik */}
        <div className="bg-white p-6 rounded-[2rem] border-4 border-slate-900 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-purple-100 border border-purple-400 rounded-lg text-purple-600"><BarChart3 size={16} /></div>
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Rata-Rata Nilai Rombel</h3>
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
          <p className="text-[9px] font-bold text-slate-400 uppercase mt-4 border-t pt-3 italic">Perbandingan nilai rata-rata kognitif siswa lintas kelas.</p>
        </div>

        {/* 3. Grafik Kehadiran Murid */}
        <div className="bg-white p-6 rounded-[2rem] border-4 border-slate-900 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-emerald-100 border border-emerald-400 rounded-lg text-emerald-600"><LineIcon size={16} /></div>
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Tren Kehadiran Bulanan</h3>
            </div>
            <div className="w-full h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dataTrenKehadiran} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="tgl" tick={{ fill: "#64748b", fontSize: 10, fontWeight: "bold" }} axisLine={false} tickLine={false} />
                  <YAxis domain={[80, 100]} tick={{ fill: "#64748b", fontSize: 10, fontWeight: "bold" }} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="persen" stroke="#10b981" strokeWidth={4} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <p className="text-[9px] font-bold text-slate-400 uppercase mt-4 border-t pt-3 italic">Kurva absensi harian untuk memonitor tingkat kedisiplinan massal.</p>
        </div>

        

      </div>

{/* POIN 2: DASHBOARD AKADEMIK SISWA */}
<div className="space-y-6 pt-6 border-t-4 border-dashed border-slate-200">
  <div>
    <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
      <span>🎓</span>Analisis Akademik Siswa
    </h2>
    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
      Monitoring prestasi, perbandingan rombel kelas, dan capaian ranking sekolah
    </p>
  </div>

  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
    
    {/* Grafik Batang: Rata-Rata Nilai Per Kelas */}
    <div className="bg-white p-6 rounded-[2rem] border-4 border-slate-900 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)]">
      <div className="mb-4">
        <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">
          📊 Rata-Rata Nilai Per Kelas
        </h3>
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

    {/* Grafik Garis: Perkembangan Nilai Semester */}
    <div className="bg-white p-6 rounded-[2rem] border-4 border-slate-900 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)]">
      <div className="mb-4">
        <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">
          📈 Tren Nilai Lintas Semester
        </h3>
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

    {/* Tabel Ranking: Top Prestasi Siswa */}
    <div className="bg-white p-6 rounded-[2rem] border-4 border-slate-900 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] flex flex-col justify-between">
      <div>
        <div className="mb-4">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">
            🏆 Tabel Ranking Pararel Teratas
          </h3>
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
        Menampilkan 5 besar nilai raport tertinggi pararel.
      </p>
    </div>

  </div>
</div>

{/* POIN 3: DASHBOARD KEHADIRAN SISWA */}
<div className="space-y-6 pt-6 border-t-4 border-dashed border-slate-200">
  <div>
    <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
      <span>📅</span>Dashboard Kehadiran Siswa
    </h2>
    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
      Monitoring tingkat disiplin siswa melalui proporsi harian dan grafik tren bulanan
    </p>
  </div>

  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
    
    {/* Pie Chart: Proporsi Status Kehadiran */}
    <div className="bg-white p-6 rounded-[2rem] border-4 border-slate-900 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] flex flex-col justify-between lg:col-span-1">
      <div>
        <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-4">
          🍕 Proporsi Kehadiran Hari Ini
        </h3>
        <div className="w-full h-[200px] flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={dataPieKehadiran}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={4}
                dataKey="value"
              >
                {dataPieKehadiran.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS_KEHADIRAN[index % COLORS_KEHADIRAN.length]} stroke="#0f172a" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* Legend Custom dengan Style Kotak Grid SIMS */}
      <div className="grid grid-cols-2 gap-2 pt-4 border-t border-slate-100">
        {dataPieKehadiran.map((item, idx) => (
          <div key={idx} className="flex items-center gap-2 bg-slate-50 border-2 border-slate-200 p-2 rounded-xl">
            <div className="w-3 h-3 rounded-md border border-slate-900" style={{ backgroundColor: COLORS_KEHADIRAN[idx] }} />
            <div className="leading-tight">
              <p className="text-[10px] font-black text-slate-900 uppercase tracking-tight">{item.name}</p>
              <p className="text-[10px] font-bold text-slate-400">{item.value} Siswa</p>
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Grafik Garis: Tren Absensi Tiap Bulan */}
    <div className="bg-white p-6 rounded-[2rem] border-4 border-slate-900 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] lg:col-span-2 flex flex-col justify-between">
      <div>
        <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-4">
          📈 Tren Kasus Tidak Hadir (Bulanan)
        </h3>
        <div className="w-full h-[230px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dataTrenBulananAbsensi} margin={{ top: 10, right: 20, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="bulan" tick={{ fill: "#64748b", fontSize: 10, fontWeight: "bold" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748b", fontSize: 10, fontWeight: "bold" }} axisLine={false} tickLine={false} />
              <Tooltip />
              {/* Garis Merah untuk Tren Murid Alfa/Bolos */}
              <Line type="monotone" dataKey="alfa" stroke="#ef4444" strokeWidth={4} name="Alfa (Bolos)" dot={{ r: 4 }} activeDot={{ r: 6 }} />
              {/* Garis Biru untuk Tren Murid Sakit/Izin */}
              <Line type="monotone" dataKey="sakitIzin" stroke="#3b82f6" strokeWidth={3} strokeDasharray="5 5" name="Sakit & Izin" dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-dashed text-[9px] font-bold text-slate-400 uppercase italic">
        <span>⚠️</span> Perhatian: Garis merah solid menunjukkan akumulasi siswa yang mangkir tanpa keterangan (Alfa).
      </div>
    </div>

  </div>
</div>

{/* POIN 4: DASHBOARD MONITORING SISWA BERMASALAH */}
<div className="space-y-6 pt-6 border-t-4 border-dashed border-slate-200">
  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
    <div>
      <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
        <span>🕵️‍♂️</span>Monitoring & Deteksi Dini Siswa
      </h2>
      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
        Analisis komprehensif indikator nilai dan absensi untuk pencegahan siswa bermasalah
      </p>
    </div>
    
    {/* Keterangan Warna Panel */}
    <div className="flex gap-3 bg-white px-4 py-2 rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] text-[9px] font-black uppercase">
      <div className="flex items-center gap-1"><span>🔴</span> Kritis</div>
      <div className="flex items-center gap-1"><span>🟡</span> Perhatian</div>
      <div className="flex items-center gap-1"><span>🟢</span> Aman</div>
    </div>
  </div>

  {/* Tabel Analytics Utama */}
  <div className="bg-white rounded-[2rem] border-4 border-slate-900 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] overflow-hidden">
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-wider">
            <th className="p-4 rounded-tl-[1.5rem]">Nama Siswa</th>
            <th className="p-4 text-center">Kelas</th>
            <th className="p-4 text-center">Rata-Rata Nilai</th>
            <th className="p-4 text-center">Persentase Absensi</th>
            <th className="p-4 text-center rounded-tr-[1.5rem] w-36">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y-2 divide-slate-100 text-xs font-bold">
          {dataSiswaBermasalah.map((siswa, idx) => {
            const status = getStatusIndicator(siswa.nilai, siswa.absensi);
            return (
              <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                <td className="p-4 text-slate-900 uppercase tracking-tight font-black">
                  {siswa.nama}
                </td>
                <td className="p-4 text-center text-slate-500 font-mono">{siswa.kelas}</td>
                <td className="p-4 text-center">
                  <span className={`px-3 py-1 rounded-lg font-black ${siswa.nilai < 65 ? 'text-rose-600 bg-rose-50' : 'text-slate-700'}`}>
                    {siswa.nilai}
                  </span>
                </td>
                <td className="p-4 text-center">
                  <span className={`px-3 py-1 rounded-lg font-black ${siswa.absensi < 75 ? 'text-rose-600 bg-rose-50' : 'text-slate-700'}`}>
                    {siswa.absensi}%
                  </span>
                </td>
                <td className="p-4 text-center">
                  <div className={`py-1.5 px-3 rounded-xl border-2 font-black text-[9px] tracking-widest flex items-center justify-center gap-1.5 shadow-[2px_2px_0px_0px_rgba(15,23,42,0.05)] ${status.bgColor}`}>
                    <span>{status.icon}</span>
                    <span>{status.text}</span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  </div>
  
  <p className="text-[9px] font-bold text-slate-400 uppercase italic flex items-center gap-1.5">
    <span>💡</span> Otomatisasi Sistem: Status diturunkan ke "Kritis" atau "Perhatian" jika salah satu parameter melewati ambang batas minimal KKM sekolah.
  </p>
</div>

{/* POIN 5: DASHBOARD KINERJA GURU */}
<div className="space-y-6 pt-6 border-t-4 border-dashed border-slate-200">
  <div>
    <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
      <span>👩‍🏫</span>Evaluasi Kinerja Guru
    </h2>
    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
      Panel pemantauan kehadiran mengajar, beban jam kerja, dan ketepatan pemenuhan nilai administrasi
    </p>
  </div>

  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
    
    {/* Grafik Batang: Beban Jam Mengajar */}
    <div className="bg-white p-6 rounded-[2rem] border-4 border-slate-900 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] lg:col-span-1">
      <div className="mb-4">
        <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">
          📊 Total Jam Mengajar / Minggu
        </h3>
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

    {/* Tabel Pemantauan Administrasi & Kehadiran Guru */}
    <div className="bg-white p-6 rounded-[2rem] border-4 border-slate-900 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] lg:col-span-2 flex flex-col justify-between">
      <div>
        <div className="mb-4">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">
            📋 Rekapitulasi Kehadiran & Status Administrasi
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b-2 border-slate-900 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                <th className="pb-3">Nama Guru / Mapel</th>
                <th className="pb-3 text-center">Kehadiran</th>
                <th className="pb-3 text-right">Input Nilai</th>
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
        *Standar pemenuhan jam mengajar wajib adalah 24 jam per minggu berdasarkan regulasi dapodik sekolah.
      </p>
    </div>

  </div>
</div>

{/* POIN 6: DASHBOARD PRESTASI SEKOLAH */}
<div className="space-y-6 pt-6 border-t-4 border-dashed border-slate-200">
  <div>
    <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
      <span>🏆</span>Monitoring Prestasi Sekolah
    </h2>
    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
      Rekam jejak perolehan juara siswa, pemetaan skala tingkatan lomba, dan statistik grafik tahunan
    </p>
  </div>

  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
    
    {/* Kartu Prestasi Berdasarkan Tingkat Lomba */}
    <div className="lg:col-span-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
      {kartuTingkatLomba.map((item, idx) => (
        <div 
          key={idx} 
          className="bg-white p-5 rounded-2xl border-4 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] flex items-center justify-between group hover:-translate-y-0.5 transition-transform"
        >
          <div className="space-y-1">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">{item.tingkat}</p>
            <h4 className="text-xl font-black text-slate-900 mt-1 uppercase tracking-tight">{item.jumlah}</h4>
          </div>
          <div className={`w-10 h-10 rounded-xl border-2 border-slate-900 flex items-center justify-center text-lg shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] ${item.color}`}>
            {item.icon}
          </div>
        </div>
      ))}
    </div>

    {/* Grafik Batang: Akumulasi Perolehan Medali Tahunan */}
    <div className="bg-white p-6 rounded-[2rem] border-4 border-slate-900 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] lg:col-span-2 flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">
            📊 Grafik Tren Perolehan Juara Tahunan
          </h3>
          {/* Custom Legends */}
          <div className="flex gap-3 text-[9px] font-black uppercase">
            <div className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-amber-400 border border-slate-900"></span> Emas</div>
            <div className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-slate-400 border border-slate-900"></span> Perak</div>
            <div className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-amber-600 border border-slate-900"></span> Perunggu</div>
          </div>
        </div>
        
        <div className="w-full h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dataPrestasiTahunan} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="tahun" tick={{ fill: "#64748b", fontSize: 10, fontWeight: "bold" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748b", fontSize: 10, fontWeight: "bold" }} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: '#f8fafc' }} />
              {/* Stacked Bar atau Grouped Bar agar membedakan jenis medali */}
              <Bar dataKey="emas" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={14} />
              <Bar dataKey="perak" fill="#94a3b8" radius={[4, 4, 0, 0]} barSize={14} />
              <Bar dataKey="perunggu" fill="#b45309" radius={[4, 4, 0, 0]} barSize={14} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <p className="text-[9px] font-bold text-slate-400 uppercase mt-2 pt-2 border-t border-dashed italic">
        *Data dihitung berdasarkan laporan kemenangan kompetisi resmi yang divalidasi kesiswaan.
      </p>
    </div>

  </div>
</div>

{/* POIN 7: DASHBOARD PELANGGARAN SISWA */}
<div className="space-y-6 pt-6 border-t-4 border-dashed border-slate-200">
  <div>
    <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
      <span>🛡️</span>Evaluasi Pelanggaran & Kedisiplinan
    </h2>
    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
      Analisis rekam kasus ketertiban berdasarkan jenis pelanggaran dan pemetaan kerawanan kelas
    </p>
  </div>

  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
    
    {/* Pie Chart: Komposisi Jenis Pelanggaran */}
    <div className="bg-white p-6 rounded-[2rem] border-4 border-slate-900 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] flex flex-col justify-between">
      <div>
        <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-2">
          🍕 Komposisi Jenis Pelanggaran
        </h3>
        <div className="w-full h-[180px] flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={dataPiePelanggaran}
                cx="50%"
                cy="50%"
                innerRadius={0} // Full pie chart sesuai spesifikasi request
                outerRadius={75}
                dataKey="value"
              >
                {dataPiePelanggaran.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS_PELANGGARAN[index % COLORS_PELANGGARAN.length]} stroke="#0f172a" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Legend Custom List */}
      <div className="space-y-1.5 pt-3 border-t border-slate-100">
        {dataPiePelanggaran.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between bg-slate-50 border-2 border-slate-200 p-1.5 rounded-xl px-3">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-md border border-slate-900" style={{ backgroundColor: COLORS_PELANGGARAN[idx] }} />
              <p className="text-[10px] font-black text-slate-900 uppercase tracking-tight">{item.name}</p>
            </div>
            <p className="text-[10px] font-black text-indigo-600 font-mono">{item.value} Kasus</p>
          </div>
        ))}
      </div>
    </div>

    {/* Tabel Analisis: Kelas Terbanyak Pelanggaran */}
    <div className="bg-white p-6 rounded-[2rem] border-4 border-slate-900 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] lg:col-span-2 flex flex-col justify-between">
      <div>
        <div className="mb-4">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">
            🚨 Pemetaan Kelas Terbanyak Kasus Pelanggaran
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b-2 border-slate-900 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                <th className="pb-3 w-24">Kelas</th>
                <th className="pb-3">Wali Kelas</th>
                <th className="pb-3 text-center w-28">Total Kasus</th>
                <th className="pb-3 text-right w-24">Tren</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-bold">
              {dataKelasPelanggaranTerbanyak.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/60">
                  <td className="py-3.5">
                    <span className="bg-rose-50 border-2 border-rose-200 text-rose-700 px-3 py-1 rounded-xl text-xs font-black font-mono">
                      {item.kelas}
                    </span>
                  </td>
                  <td className="py-3.5 text-slate-900 uppercase tracking-tight font-black">
                    {item.waliKelas}
                  </td>
                  <td className="py-3.5 text-center font-mono font-black text-slate-900">
                    {item.totalKasus} Kasus
                  </td>
                  <td className="py-3.5 text-right font-black text-[10px] uppercase tracking-tighter">
                    <span className={`px-2 py-0.5 rounded-md ${
                      item.statusTrend.includes("Naik") ? "text-rose-600 bg-rose-50" : 
                      item.statusTrend.includes("Turun") ? "text-emerald-600 bg-emerald-50" : "text-slate-500 bg-slate-100"
                    }`}>
                      {item.statusTrend}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-[9px] font-bold text-slate-400 uppercase mt-4 pt-2 border-t border-dashed italic">
        *Data ini terhubung langsung dengan buku kendali poin kedisiplinan siswa yang diinput oleh Guru Piket/BK.
      </p>
    </div>

  </div>
</div>

{/* POIN 8: DASHBOARD KELULUSAN DAN ALUMNI */}
<div className="space-y-6 pt-6 border-t-4 border-dashed border-slate-200">
  <div>
    <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
      <span>🎓</span>Kualitas Lulusan & Statistik Alumni
    </h2>
    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
      Analisis efisiensi kelulusan tahunan dan pelacakan (*tracer study*) sebaran perguruan tinggi alumni
    </p>
  </div>

  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
    
    {/* Grafik Batang & Garis: Tren Kelulusan vs Kuliah */}
    <div className="bg-white p-6 rounded-[2rem] border-4 border-slate-900 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] lg:col-span-1 flex flex-col justify-between">
      <div>
        <div className="mb-4">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">
            📊 % Kelulusan vs Tembus Kuliah
          </h3>
          <div className="flex gap-3 text-[9px] font-black uppercase mt-1">
            <div className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-indigo-600"></span> % Lulus</div>
            <div className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-pink-500"></span> % Kuliah</div>
          </div>
        </div>
        
        <div className="w-full h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dataTrenKelulusanAlumni} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="tahun" tick={{ fill: "#64748b", fontSize: 10, fontWeight: "bold" }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 10, fontWeight: "bold" }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Bar dataKey="kelulusan" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={16} name="% Kelulusan Resmi" />
              <Bar dataKey="lanjutKuliah" fill="#ec4899" radius={[4, 4, 0, 0]} barSize={16} name="% Lanjut Kuliah" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <p className="text-[9px] font-bold text-slate-400 uppercase border-t pt-2 border-dashed italic">
        Grafik menunjukkan rasio serapan lulusan yang berhasil menembus pendidikan tinggi.
      </p>
    </div>

    {/* Tabel Rekapitulasi Destinasi Alumni */}
    <div className="bg-white p-6 rounded-[2rem] border-4 border-slate-900 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] lg:col-span-2 flex flex-col justify-between">
      <div>
        <div className="mb-4">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">
            📋 Pemetaan Destinasi Utama Lulusan Akhir
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b-2 border-slate-900 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                <th className="pb-3">Instansi Tujuan / Kampus</th>
                <th className="pb-3 text-center">Klaster</th>
                <th className="pb-3 text-center">Jalur Terbanyak</th>
                <th className="pb-3 text-right">Jumlah</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-bold">
              {dataTabelAlumni.map((alumni, idx) => (
                <tr key={idx} className="hover:bg-slate-50/60">
                  <td className="py-3 text-slate-900 uppercase tracking-tight font-black">
                    {alumni.targetTujuan}
                  </td>
                  <td className="py-3 text-center text-[10px]">
                    <span className="bg-slate-100 border border-slate-300 text-slate-600 px-2 py-0.5 rounded-md uppercase font-black">
                      {alumni.kategori}
                    </span>
                  </td>
                  <td className="py-3 text-center text-slate-500 font-medium">
                    {alumni.jalurFavorit}
                  </td>
                  <td className="py-3 text-right font-mono font-black text-indigo-600">
                    {alumni.jumlahSiswa} Orang
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-[9px] font-bold text-slate-400 uppercase mt-4 pt-2 border-t border-dashed italic">
        *Statistik dihimpun secara real-time berdasarkan instrumen pelacakan angket pasca kelulusan siswa kelas XII.
      </p>
    </div>

  </div>
</div>

{/* POIN 9: DASHBOARD NOTIFIKASI DAN PERINGATAN */}
<div className="space-y-6 pt-6 border-t-4 border-dashed border-slate-200">
  <div>
    <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
      <span>🚨</span>Dashboard Notifikasi & Peringatan Otomatis
    </h2>
    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
      Panel instruksi kilat (*Early Warning System*) berbasis anomali data kesiswaan, kurikulum, dan administrasi
    </p>
  </div>

  {/* Panel Grid Peringatan Otomatis */}
  <div className="bg-white p-6 lg:p-8 rounded-[2rem] border-4 border-slate-900 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] space-y-4">
    <div className="flex justify-between items-center border-b-2 border-slate-900 pb-3">
      <div className="flex items-center gap-2">
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500 border border-slate-900"></span>
        </span>
        <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">
          Anomali Sistem Aktif ({dataAlertSistem.length} Temuan Kasus)
        </h3>
      </div>
      <span className="text-[9px] font-black uppercase text-slate-400 bg-slate-100 border border-slate-300 px-2 py-0.5 rounded">
        Real-time Engine
      </span>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {dataAlertSistem.map((alert) => (
        <div 
          key={alert.id} 
          className={`p-5 rounded-2xl border-4 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] flex flex-col justify-between transition-transform hover:-translate-y-0.5 ${
            alert.tipe === "CRITICAL" 
              ? "bg-rose-50/50 border-rose-950 shadow-[4px_4px_0px_0px_#ef4444]" 
              : "bg-amber-50/50 border-amber-950 shadow-[4px_4px_0px_0px_#f59e0b]"
          }`}
        >
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className={`px-2.5 py-0.5 rounded-md text-[9px] font-black uppercase border-2 border-slate-900 ${
                alert.tipe === "CRITICAL" ? "bg-rose-400 text-slate-950" : "bg-amber-400 text-slate-950"
              }`}>
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
            <span>Status: Butuh Tindakan</span>
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