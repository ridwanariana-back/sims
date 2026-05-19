// app/kepalasekolah/datamurid/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import ExcelJS from "exceljs";
import { ArrowLeft, Download, Users } from "lucide-react";

export default function DetailMuridPage() {
  // Mock Data Rekapitulasi Murid Per Kelas (Siap dihubungkan ke Neon DB via Server Action)
  const [dataMurid] = useState([
    { kelas: "X.1", l: 15, p: 20, total: 35, wali: "Supardi, M.Pd" },
    { kelas: "X.2", l: 18, p: 16, total: 34, wali: "Siti Aminah, S.Pd" },
    { kelas: "XI.1", l: 14, p: 21, total: 35, wali: "Hendra, S.Kom" },
    { kelas: "XI.2", l: 16, p: 16, total: 32, wali: "Bambang, M.Si" },
    { kelas: "XII.1", l: 12, p: 22, total: 34, wali: "Drs. M. Yusuf" },
    { kelas: "XII.2", l: 15, p: 15, total: 30, wali: "Dra. Elvyra" },
  ]);

  const exportMuridToExcelWithChart = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Rekapitulasi Data Murid");

    // 1. Setup Header Kolom Excel
    worksheet.columns = [
      { header: "Kelas", key: "kelas", width: 15 },
      { header: "Wali Kelas", key: "wali", width: 28 },
      { header: "Laki-Laki (L)", key: "l", width: 18 },
      { header: "Perempuan (P)", key: "p", width: 18 },
      { header: "Total Siswa", key: "total", width: 18 },
    ];

    // Styling Header Formil Neo-Brutalisme (Slate 900)
    worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFF" } };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "0F172A" },
    };

    // 2. Masukkan Data baris demi baris
    dataMurid.forEach((item) => {
      worksheet.addRow(item);
    });

    // 3. SEKTOR GRAFIK: Batang Komposisi Murid Per Kelas
    const chartConfig = {
      type: "bar",
      data: {
        labels: dataMurid.map((m) => m.kelas),
        datasets: [
          {
            label: "Siswa Laki-Laki",
            data: dataMurid.map((m) => m.l),
            backgroundColor: "#3b82f6", // Biru
          },
          {
            label: "Siswa Perempuan",
            data: dataMurid.map((m) => m.p),
            backgroundColor: "#ec4899", // Pink
          }
        ]
      },
      options: {
        title: { display: true, text: "GRAFIK DEMOGRAFI MURID PER KELAS" },
        scales: { yAxes: [{ ticks: { beginAtZero: true } }] }
      }
    };

    const chartUrl = `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(chartConfig))}&w=500&h=300`;

    try {
      const response = await fetch(chartUrl);
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();

      const imageId = workbook.addImage({
        buffer: arrayBuffer,
        extension: "png",
      });

      // Tempatkan Grafik di samping tabel mulai kolom G (Col 6), baris 2
      worksheet.addImage(imageId, {
        tl: { col: 6, row: 1 },
        ext: { width: 500, height: 300 }
      });
    } catch (error) {
      console.error("Gagal menyisipkan grafik demografi murid:", error);
    }

    // 4. Unduh File Excel ke Browser
    const buffer = await workbook.xlsx.writeBuffer();
    const fileBlob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const fileUrl = URL.createObjectURL(fileBlob);
    
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = `Laporan_Demografi_Siswa_SIMS_${new Date().getFullYear()}.xlsx`;
    link.click();
    URL.revokeObjectURL(fileUrl);
  };

  // Hitung total akumulasi untuk statistik card di atas tabel web
  const totalSiswaSekolah = dataMurid.reduce((acc, curr) => acc + curr.total, 0);

  return (
    <div className="space-y-6">
      {/* HEADER BANNER DENGAN TOMBOL BERDAMPINGAN */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-white p-6 rounded-3xl border-4 border-slate-900 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
            <span>🎒</span> Analisis Data & Demografi Murid
          </h2>
          <p className="text-xs font-bold text-slate-400 uppercase">
            Statistik sebaran gender dan kapabilitas daya tampung siswa per kelas pararel
          </p>
        </div>
        
        {/* GRUP TOMBOL KONTROL */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <Link 
            href="/kepalasekolah"
            className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-900 font-black text-xs uppercase tracking-widest px-5 py-3.5 rounded-2xl border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] active:translate-y-1 active:shadow-none transition-all w-full sm:w-auto"
          >
            <ArrowLeft size={16} /> Kembali ke Dashboard
          </Link>

          <button 
            onClick={exportMuridToExcelWithChart}
            className="flex items-center justify-center gap-2 bg-emerald-400 hover:bg-emerald-500 text-slate-950 font-black text-xs uppercase tracking-widest px-5 py-3.5 rounded-2xl border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] active:translate-y-1 active:shadow-none transition-all w-full sm:w-auto"
          >
            <Download size={16} /> Export Excel + Grafik
          </button>
        </div>
      </div>

      {/* MINI STATS SUMMARY */}
      <div className="bg-blue-50 border-4 border-slate-900 p-5 rounded-2xl flex items-center justify-between shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
        <div className="space-y-1">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Konsolidasi Murid Aktif</p>
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">{totalSiswaSekolah} Lulusan / Siswa</h3>
        </div>
        <div className="w-12 h-12 rounded-xl bg-blue-400 border-2 border-slate-900 flex items-center justify-center text-slate-950 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
          <Users size={20} />
        </div>
      </div>

      {/* PREVIEW TABEL DI HALAMAN WEB */}
      <div className="bg-white p-6 rounded-[2.5rem] border-4 border-slate-900 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b-2 border-slate-900 text-[10px] font-black text-slate-400 uppercase tracking-wider">
              <th className="pb-3 w-28">Kelas</th>
              <th className="pb-3">Wali Kelas</th>
              <th className="pb-3 text-center">Laki-Laki (L)</th>
              <th className="pb-3 text-center">Perempuan (P)</th>
              <th className="pb-3 text-right">Total Kuota</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-bold text-xs">
            {dataMurid.map((item, idx) => (
              <tr key={idx} className="hover:bg-slate-50/80">
                <td className="py-3.5">
                  <span className="bg-slate-900 text-white font-mono text-[11px] font-black px-2.5 py-1 rounded-md">
                    {item.kelas}
                  </span>
                </td>
                <td className="py-3.5 text-slate-900 font-black uppercase tracking-tight">{item.wali}</td>
                <td className="py-3.5 text-center text-blue-600 font-mono">{item.l} Siswa</td>
                <td className="py-3.5 text-center text-pink-600 font-mono">{item.p} Siswa</td>
                <td className="py-3.5 text-right font-mono font-black text-slate-900">{item.total} Orang</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}