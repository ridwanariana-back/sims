// app/wakakesiswaan/page.tsx
"use client";

import { useState, useEffect } from "react";
import { getKepalaSekolahStats } from "@/lib/actions";
import { 
  Users, 
  Trophy, 
  AlertTriangle, 
  TrendingUp, 
  PieChart as PieIcon, 
  ShieldAlert,
  CalendarCheck
} from "lucide-react";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip,
  PieChart,
  Cell,
  Pie
} from "recharts";

export default function WakaKesiswaanPage() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    getKepalaSekolahStats().then(setStats);
  }, []);

  // Data Kehadiran / Absensi Bulanan Murid
  const dataAbsensiBulanan = [
    { bulan: "Jan", hadir: 94, izin: 3, sakit: 2, alfa: 1 },
    { bulan: "Feb", hadir: 92, izin: 4, sakit: 3, alfa: 1 },
    { bulan: "Mar", hadir: 95, izin: 2, sakit: 2, alfa: 1 },
    { bulan: "Apr", hadir: 96, izin: 2, sakit: 1, alfa: 1 },
    { bulan: "Mei", hadir: 97, izin: 1, sakit: 2, alfa: 0 },
  ];

  // Data Ranah Pelanggaran / Peta Kerawanan Siswa
  const dataKategoriPelanggaran = [
    { name: "Kerapian/Atribut", value: 45, color: "#3b82f6" },
    { name: "Keterlambatan", value: 55, color: "#f59e0b" },
    { name: "Etika/Sikap", value: 12, color: "#7c3aed" },
    { name: "Bolos KBM", value: 24, color: "#ef4444" },
  ];

  // Data Capaian Prestasi Kompetisi Siswa
  const dataPrestasiSiswa = [
    { name: "Kabupaten", medali: 12 },
    { name: "Provinsi", medali: 6 },
    { name: "Nasional", medali: 2 },
  ];

  // Log Tabel Pelanggaran Disiplin Terkini (Buku Kasus Kesiswaan)
  const dataTabelKasus = [
    { nama: "Roni Setiawan", kelas: "XI.3", kasus: "Terlambat > 15 Menit", poin: 5, tindakan: "Teguran & Pembersihan Lapangan" },
    { nama: "Dinda Lestari", kelas: "X.2", kasus: "Atribut Seragam Tidak Lengkap", poin: 2, tindakan: "Peringatan Lisan" },
    { nama: "M. Rafli", kelas: "XII.1", kasus: "Melompati Pagar / Bolos", poin: 15, tindakan: "Pemanggilan Orang Tua" },
    { nama: "Siti Rahma", kelas: "XI.1", kasus: "Membawa HP saat Ujian", poin: 10, tindakan: "Penahanan HP 3 Hari" },
  ];

  // Alert Sistem Otomatis khusus Kesiswaan & Kedisiplinan
  const dataAlertSistem = [
    { 
      id: 1, 
      tipe: "DANGER", 
      pesan: "Siswa atas nama M. Rafli (XII.1) mencapai akumulasi 75 poin pelanggaran. Segera terbitkan SP-2!", 
      kategori: "Kedisiplinan",
      waktu: "10 mnt yang lalu" 
    },
    { 
      id: 2, 
      tipe: "WARNING", 
      pesan: "Grafik keterlambatan siswa meningkat 12% pada hari Senin pasca libur nasional", 
      kategori: "Ketertiban",
      waktu: "1 jam yang lalu" 
    },
  ];

  if (!stats) {
    return (
      <div className="p-20 text-center font-black tracking-widest text-slate-900 animate-pulse uppercase text-sm">
        ▓▒░ MEMUAT PANEL PEMBINAAN KESISWAAN... ░▒▓
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-10 space-y-10 bg-slate-50 min-h-screen selection:bg-blue-600 selection:text-white">
      
      {/* HEADER UTAMA WAKA KESISWAAN */}
      <div className="bg-white p-8 rounded-[2rem] border-4 border-slate-900 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="bg-blue-100 text-blue-700 text-[10px] font-black uppercase px-3 py-1 rounded-full border border-blue-300 tracking-wider">
            Bidang Kesiswaan & Karakter
          </span>
          <h1 className="text-3xl lg:text-4xl font-black text-slate-900 uppercase tracking-tighter mt-2">
            Dashboard Wakil Kesiswaan
          </h1>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
            Panel Pemantauan Tata Tertib, Grafik Ketidakhadiran, Konseling, dan Etalase Prestasi Siswa
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tahun Pelajaran</p>
          <p className="text-sm font-black text-slate-900 bg-blue-400 border-2 border-slate-900 px-4 py-1.5 rounded-xl mt-1 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] text-white">
            2025/2026
          </p>
        </div>
      </div>

      {/* SUMMARY CARDS KESISWAAN */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: "Rasio Kehadiran", value: "95.4%", subtitle: "Rerata Bulan Ini", icon: <CalendarCheck size={22} />, color: "bg-emerald-400" },
          { title: "Total Pelanggaran", value: "136", subtitle: "Kasus Bulan Ini", icon: <AlertTriangle size={22} />, color: "bg-amber-400" },
          { title: "Siswa Kena Sanksi", value: "3 Siswa", subtitle: "Butuh Tindakan SP", icon: <ShieldAlert size={22} />, color: "bg-rose-400" },
          { title: "Medali Juara", value: "20 Piala", subtitle: "Akademik & Ekskul", icon: <Trophy size={22} />, color: "bg-yellow-400" },
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

      {/* PANEL UTAMA: ABSENSI & PROPORSI KERAWANAN KASUS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* 1. Tren Absensi/Ketidakhadiran Bulanan */}
        <div className="bg-white p-6 rounded-[2rem] border-4 border-slate-900 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-emerald-100 border border-emerald-400 rounded-lg text-emerald-600"><TrendingUp size={16} /></div>
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Rasio Absensi & Ketidakhadiran Siswa</h3>
            </div>
            <div className="w-full h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dataAbsensiBulanan} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="bulan" tick={{ fill: "#64748b", fontSize: 10, fontWeight: "bold" }} axisLine={false} tickLine={false} />
                  <YAxis domain={[80, 100]} tick={{ fill: "#64748b", fontSize: 10, fontWeight: "bold" }} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Area type="monotone" dataKey="hadir" name="Kehadiran (%)" stroke="#10b981" strokeWidth={3} fill="rgba(16, 185, 129, 0.08)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <p className="text-[9px] font-bold text-slate-400 uppercase mt-4 border-t pt-3 italic">Monitor titik kritis penurunan kehadiran kelas menjelang pekan ujian sekolah.</p>
        </div>

        {/* 2. Peta Distribusi Pelanggaran (Pie Chart) */}
        <div className="bg-white p-6 rounded-[2rem] border-4 border-slate-900 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-amber-100 border border-amber-400 rounded-lg text-amber-600"><PieIcon size={16} /></div>
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Proporsi Jenis Pelanggaran</h3>
            </div>
            <div className="w-full h-[200px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={dataKategoriPelanggaran} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={4} dataKey="value">
                    {dataKategoriPelanggaran.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="#0f172a" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Legend Kustom */}
            <div className="grid grid-cols-2 gap-2 text-[10px] font-black uppercase text-slate-600 mt-2">
              {dataKategoriPelanggaran.map((entry, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm border border-slate-900" style={{ backgroundColor: entry.color }}></span>
                  <span className="truncate">{entry.name} ({entry.value})</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* SECTION: BUKU KASUS DISIPLIN & PRESTASI */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-6 border-t-4 border-dashed border-slate-200">
        
        {/* Tabel Log Kasus Pelanggaran Siswa */}
        <div className="bg-white p-6 rounded-[2rem] border-4 border-slate-900 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="mb-4">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">📝 Log Penegakan Disiplin Siswa Terkini</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b-2 border-slate-900 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    <th className="pb-3">Siswa</th>
                    <th className="pb-3">Kasus / Pelanggaran</th>
                    <th className="pb-3 text-center">Bobot</th>
                    <th className="pb-3 text-right">Tindakan Pembinaan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-bold">
                  {dataTabelKasus.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60">
                      <td className="py-3">
                        <p className="text-slate-900 uppercase font-black">{item.nama}</p>
                        <p className="text-[10px] text-slate-400 font-mono font-bold">{item.kelas}</p>
                      </td>
                      <td className="py-3 text-amber-700 uppercase tracking-tight">{item.kasus}</td>
                      <td className="py-3 text-center">
                        <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-600 border border-rose-200 font-mono font-black">
                          +{item.poin} Poin
                        </span>
                      </td>
                      <td className="py-3 text-right text-slate-600 text-[11px]">{item.tindakan}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <p className="text-[9px] font-bold text-slate-400 uppercase mt-4 pt-2 border-t border-dashed italic">
            *Setiap input poin pelanggaran terintegrasi otomatis dengan akumulasi database rapor kedisiplinan BK.
          </p>
        </div>

        {/* Grafik Grafik Prestasi Tingkat Perlombaan */}
        <div className="bg-white p-6 rounded-[2rem] border-4 border-slate-900 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] lg:col-span-1 flex flex-col justify-between">
          <div>
            <div className="mb-4">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">🏆 Grafik Raihan Medali Kompetisi Siswa</h3>
            </div>
            <div className="w-full h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dataPrestasiSiswa} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fill: "#0f172a", fontSize: 10, fontWeight: "black" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#64748b", fontSize: 10, fontWeight: "bold" }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} />
                  <Bar dataKey="medali" fill="#f59e0b" radius={[6, 6, 0, 0]} barSize={35} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight border-t pt-2 italic">
            Rekap sumbangsih poin portofolio prestasi sekolah dari ekstrakurikuler & olimpiade sains.
          </p>
        </div>

      </div>

      {/* SECTION: RADAR PERINGATAN KESISWAAN */}
      <div className="space-y-6 pt-6 border-t-4 border-dashed border-slate-200">
        <div>
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
            <span>🚨</span>Sistem Deteksi Amalan & Kasus Kritis Siswa
          </h2>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
            Notifikasi waktu nyata (Real-time) tindakan pelanggaran berat atau siswa yang menyentuh batas skorsing
          </p>
        </div>

        <div className="bg-white p-6 lg:p-8 rounded-[2rem] border-4 border-slate-900 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] space-y-4">
          <div className="flex justify-between items-center border-b-2 border-slate-900 pb-3">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500 border border-slate-900"></span>
              </span>
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">
                Sinyal Darurat Kesiswaan ({dataAlertSistem.length} Eskalasi Utama)
              </h3>
            </div>
            <span className="text-[9px] font-black uppercase text-white bg-rose-600 border border-slate-900 px-2 py-0.5 rounded shadow-[1px_1px_0px_0px_rgba(15,23,42,1)]">
              Disciplinary Alert
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dataAlertSistem.map((alert) => (
              <div 
                key={alert.id} 
                className="p-5 rounded-2xl border-4 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] flex flex-col justify-between transition-transform hover:-translate-y-0.5 bg-rose-50/20 border-rose-950 shadow-[4px_4px_0px_0px_#f43f5e]"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="px-2.5 py-0.5 rounded-md text-[9px] font-black uppercase border-2 border-slate-900 bg-rose-500 text-white shadow-[1px_1px_0px_0px_rgba(15,23,42,1)]">
                      💥 {alert.tipe}
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
                  <span>Status: Segera Proses Ke BK</span>
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