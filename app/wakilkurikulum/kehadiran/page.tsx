// app/kepalasekolah/kehadiran/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import ExcelJS from "exceljs";
import { ArrowLeft, Download, CalendarCheck, Users, GraduationCap } from "lucide-react";

export default function DaftarHadirPage() {
  // State untuk mengontrol tab aktif ('guru' atau 'murid')
  const [activeTab, setActiveTab] = useState<"guru" | "murid">("guru");

  // Mock Data Kehadiran Guru (Siap dikoneksikan ke Neon Postgres DB)
  const [dataHadirGuru] = useState([
    { nama: "Siti Aminah, S.Pd", pns: "PNS", hadir: 20, izin: 1, sakit: 1, alfa: 0, persen: "91%" },
    { nama: "Hendra, S.Kom", pns: "PNS", hadir: 22, izin: 0, sakit: 0, alfa: 0, persen: "100%" },
    { nama: "Supardi, M.Pd", pns: "HONORER", hadir: 18, izin: 2, sakit: 2, alfa: 0, persen: "82%" },
    { nama: "Bambang, M.Si", pns: "PNS", hadir: 21, izin: 1, sakit: 0, alfa: 0, persen: "95%" },
    { nama: "Rinaawati, S.E", pns: "HONORER", hadir: 19, izin: 0, sakit: 1, alfa: 2, persen: "86%" },
  ]);

  // Mock Data Kehadiran Murid per Tingkat Kelas
  const [dataHadirMurid] = useState([
    { kelas: "Kelas X (Fase E)", totalSiswa: 69, hadir: 94, izin: 3, sakit: 2, alfa: 1 },
    { kelas: "Kelas XI (Fase F)", totalSiswa: 67, hadir: 92, izin: 4, sakit: 3, alfa: 1 },
    { kelas: "Kelas XII (Persiapan)", totalSiswa: 64, hadir: 97, izin: 1, sakit: 2, alfa: 0 },
  ]);

  const exportKehadiranToExcelWithChart = async () => {
    const workbook = new ExcelJS.Workbook();

    // ==========================================
    // SHEET 1: KEHADIRAN GURU
    // ==========================================
    const sheetGuru = workbook.addWorksheet("Kehadiran Guru");
    sheetGuru.columns = [
      { header: "Nama Guru", key: "nama", width: 30 },
      { header: "Status", key: "pns", width: 15 },
      { header: "Hadir (Hari)", key: "hadir", width: 15 },
      { header: "Izin", key: "izin", width: 10 },
      { header: "Sakit", key: "sakit", width: 10 },
      { header: "Alfa", key: "alfa", width: 10 },
      { header: "Persentase", key: "persen", width: 15 },
    ];
    sheetGuru.getRow(1).font = { bold: true, color: { argb: "FFFFFF" } };
    sheetGuru.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "0F172A" } };
    dataHadirGuru.forEach(g => sheetGuru.addRow(g));

    // Grafik Sheet Guru (Bar Chart Persentase)
    const chartGuruConfig = {
      type: "bar",
      data: {
        labels: dataHadirGuru.map(g => g.nama.split(",")[0]),
        datasets: [{
          label: "Hari Hadir",
          data: dataHadirGuru.map(g => g.hadir),
          backgroundColor: "#3b82f6"
        }]
      },
      options: { title: { display: true, text: "TOTAL HARI HADIR GURU" } }
    };
    const urlGuru = `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(chartGuruConfig))}&w=450&h=250`;

    // ==========================================
    // SHEET 2: KEHADIRAN MURID
    // ==========================================
    const sheetMurid = workbook.addWorksheet("Kehadiran Murid");
    sheetMurid.columns = [
      { header: "Tingkat Kelas", key: "kelas", width: 25 },
      { header: "Total Siswa", key: "totalSiswa", width: 15 },
      { header: "Rata-rata Hadir (%)", key: "hadir", width: 20 },
      { header: "Izin (%)", key: "izin", width: 12 },
      { header: "Sakit (%)", key: "sakit", width: 12 },
      { header: "Alfa (%)", key: "alfa", width: 12 },
    ];
    sheetMurid.getRow(1).font = { bold: true, color: { argb: "FFFFFF" } };
    sheetMurid.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "1E3A8A" } };
    dataHadirMurid.forEach(m => sheetMurid.addRow(m));

    // Grafik Sheet Murid (Pie Chart Perbandingan Alfa)
    const chartMuridConfig = {
      type: "pie",
      data: {
        labels: dataHadirMurid.map(m => m.kelas),
        datasets: [{
          data: dataHadirMurid.map(m => m.alfa),
          backgroundColor: ["#ef4444", "#f59e0b", "#3b82f6"]
        }]
      },
      options: { title: { display: true, text: "PROPORSI KETIDAKHADIRAN (ALFA) MURID" } }
    };
    const urlMurid = `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(chartMuridConfig))}&w=450&h=250`;

    // Ambil kedua grafik & inject ke sheet masing-masing
    try {
      const [resGuru, resMurid] = await Promise.all([fetch(urlGuru), fetch(urlMurid)]);
      const [blobG, blobM] = await Promise.all([resGuru.blob(), resMurid.blob()]);
      const [bufG, bufM] = await Promise.all([blobG.arrayBuffer(), blobM.arrayBuffer()]);

      const imgG = workbook.addImage({ buffer: bufG, extension: "png" });
      sheetGuru.addImage(imgG, { tl: { col: 8, row: 1 }, ext: { width: 450, height: 250 } });

      const imgM = workbook.addImage({ buffer: bufM, extension: "png" });
      sheetMurid.addImage(imgM, { tl: { col: 7, row: 1 }, ext: { width: 450, height: 250 } });
    } catch (e) {
      console.error("Gagal menyisipkan grafik", e);
    }

    // Trigger Download file tunggal berisi 2 sheet
    const buffer = await workbook.xlsx.writeBuffer();
    const fileBlob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const fileUrl = URL.createObjectURL(fileBlob);
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = `Laporan_Presensi_SIMS_${new Date().getFullYear()}.xlsx`;
    link.click();
    URL.revokeObjectURL(fileUrl);
  };

  return (
    <div className="space-y-6">
      {/* HEADER BANNER */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-white p-6 rounded-3xl border-4 border-slate-900 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
            <span>📅</span> Monitoring Kehadiran & Presensi
          </h2>
          <p className="text-xs font-bold text-slate-400 uppercase">
            Satu pintu rekapitulasi tingkat kehadiran pendidik dan peserta didik SMAN 1 Pemulutan Selatan
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <Link 
            href="/wakilkurikulum"
            className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-900 font-black text-xs uppercase tracking-widest px-5 py-3.5 rounded-2xl border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] active:translate-y-1 active:shadow-none transition-all w-full sm:w-auto"
          >
            <ArrowLeft size={16} /> Kembali
          </Link>

          <button 
            onClick={exportKehadiranToExcelWithChart}
            className="flex items-center justify-center gap-2 bg-emerald-400 hover:bg-emerald-500 text-slate-950 font-black text-xs uppercase tracking-widest px-5 py-3.5 rounded-2xl border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] active:translate-y-1 active:shadow-none transition-all w-full sm:w-auto"
          >
            <Download size={16} /> Export Semua (2 Sheet)
          </button>
        </div>
      </div>

      {/* --- LOCAL TABS NAVIGATION --- */}
      <div className="flex border-4 border-slate-900 bg-slate-200 p-1.5 rounded-2xl shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
        <button
          onClick={() => setActiveTab("guru")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 font-black text-xs uppercase tracking-wider rounded-xl transition-all ${
            activeTab === "guru"
              ? "bg-blue-600 text-white shadow-inner border-2 border-slate-900"
              : "text-slate-700 hover:bg-slate-300"
          }`}
        >
          <Users size={16} /> Presensi Kehadiran Guru
        </button>
        <button
          onClick={() => setActiveTab("murid")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 font-black text-xs uppercase tracking-wider rounded-xl transition-all ${
            activeTab === "murid"
              ? "bg-blue-600 text-white shadow-inner border-2 border-slate-900"
              : "text-slate-700 hover:bg-slate-300"
          }`}
        >
          <GraduationCap size={16} /> Presensi Kehadiran Murid
        </button>
      </div>

      {/* --- DYNAMIC PREVIEW DATA --- */}
      {activeTab === "guru" ? (
        <div className="bg-white p-6 rounded-[2.5rem] border-4 border-slate-900 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] overflow-x-auto animate-in fade-in duration-200">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b-2 border-slate-900 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                <th className="pb-3">Nama Guru</th>
                <th className="pb-3 text-center">Status</th>
                <th className="pb-3 text-center">Hadir</th>
                <th className="pb-3 text-center">Izin</th>
                <th className="pb-3 text-center">Sakit</th>
                <th className="pb-3 text-center">Alfa</th>
                <th className="pb-3 text-right">Rasio Hadir</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-bold text-xs">
              {dataHadirGuru.map((guru, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="py-3.5 text-slate-900 font-black uppercase">{guru.nama}</td>
                  <td className="py-3.5 text-center text-slate-500 text-[10px]"><span className="border px-2 py-0.5 rounded bg-slate-50 font-mono">{guru.pns}</span></td>
                  <td className="py-3.5 text-center text-emerald-600 font-mono">{guru.hadir} Hari</td>
                  <td className="py-3.5 text-center text-amber-500 font-mono">{guru.izin}</td>
                  <td className="py-3.5 text-center text-blue-500 font-mono">{guru.sakit}</td>
                  <td className="py-3.5 text-center text-rose-500 font-mono">{guru.alfa}</td>
                  <td className="py-3.5 text-right font-black font-mono text-blue-600">{guru.persen}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-[2.5rem] border-4 border-slate-900 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] overflow-x-auto animate-in fade-in duration-200">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b-2 border-slate-900 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                <th className="pb-3">Tingkat Kelas pararel</th>
                <th className="pb-3 text-center">Daya Tampung</th>
                <th className="pb-3 text-center">Rerata Hadir</th>
                <th className="pb-3 text-center">Izin (%)</th>
                <th className="pb-3 text-center">Sakit (%)</th>
                <th className="pb-3 text-center">Alfa (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-bold text-xs">
              {dataHadirMurid.map((murid, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="py-3.5 text-slate-900 font-black uppercase">{murid.kelas}</td>
                  <td className="py-3.5 text-center text-slate-600 font-mono">{murid.totalSiswa} Siswa</td>
                  <td className="py-3.5 text-center text-emerald-600 font-black font-mono">{murid.hadir}%</td>
                  <td className="py-3.5 text-center text-amber-500 font-mono">{murid.izin}%</td>
                  <td className="py-3.5 text-center text-blue-500 font-mono">{murid.sakit}%</td>
                  <td className="py-3.5 text-center text-rose-500 font-black font-mono">{murid.alfa}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}