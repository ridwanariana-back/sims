// app/kepalasekolah/kedisiplinan/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import ExcelJS from "exceljs";
import { ArrowLeft, Download, ShieldAlert } from "lucide-react";

export default function CatatanKedisiplinanPage() {
  // Mock Data Rekap Kasus Pelanggaran Bulanan (Siap disambungkan ke database Neon DB)
  const [dataKedisiplinan] = useState([
    { bulan: "Januari", terlambat: 42, atribut: 15, bolos: 8, total: 65 },
    { bulan: "Februari", terlambat: 35, atribut: 22, bolos: 12, total: 69 },
    { bulan: "Maret", terlambat: 28, atribut: 12, bolos: 5, total: 45 },
    { bulan: "April", terlambat: 50, atribut: 18, bolos: 14, total: 82 },
    { bulan: "Mei", terlambat: 19, atribut: 9, bolos: 4, total: 32 },
  ]);

  const exportKedisiplinanToExcelWithChart = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Laporan Kedisiplinan Siswa");

    // 1. Setup Header Kolom Excel
    worksheet.columns = [
      { header: "Periode Bulan", key: "bulan", width: 18 },
      { header: "Kasus Keterlambatan", key: "terlambat", width: 22 },
      { header: "Pelanggaran Atribut", key: "atribut", width: 22 },
      { header: "Siswa Bolos / Cabut", key: "bolos", width: 22 },
      { header: "Total Insiden", key: "total", width: 18 },
    ];

    // Styling Header Formil Neo-Brutalisme (Slate 900)
    worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFF" } };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "0F172A" },
    };

    // 2. Masukkan Data baris demi baris
    dataKedisiplinan.forEach((item) => {
      worksheet.addRow(item);
    });

    // 3. SEKTOR GRAFIK: Tren Pelanggaran Siswa Berdasarkan Jenis Kasus
    const chartConfig = {
      type: "line", // Menggunakan Line Chart agar Kepala Sekolah bisa melihat tren naik/turun kedisiplinan
      data: {
        labels: dataKedisiplinan.map((k) => k.bulan),
        datasets: [
          {
            label: "Keterlambatan",
            data: dataKedisiplinan.map((k) => k.terlambat),
            borderColor: "#f59e0b", // Kuning/Amber
            fill: false,
          },
          {
            label: "Atribut",
            data: dataKedisiplinan.map((k) => k.atribut),
            borderColor: "#3b82f6", // Biru
            fill: false,
          },
          {
            label: "Bolos",
            data: dataKedisiplinan.map((k) => k.bolos),
            borderColor: "#ef4444", // Merah
            fill: false,
          }
        ]
      },
      options: {
        title: { display: true, text: "TREN GRAFIK KASUS KEDISIPLINAN" }
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

      // Tempatkan Grafik di samping kanan tabel (Mulai kolom G, baris 2)
      worksheet.addImage(imageId, {
        tl: { col: 6, row: 1 },
        ext: { width: 500, height: 300 }
      });
    } catch (error) {
      console.error("Gagal menyisipkan grafik kedisiplinan:", error);
    }

    // 4. Unduh File Excel ke Browser
    const buffer = await workbook.xlsx.writeBuffer();
    const fileBlob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const fileUrl = URL.createObjectURL(fileBlob);
    
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = `Laporan_Kedisiplinan_SIMS_${new Date().getFullYear()}.xlsx`;
    link.click();
    URL.revokeObjectURL(fileUrl);
  };

  // Hitung total akumulasi pelanggaran sepanjang semester berjalan
  const totalKasusSemesterIni = dataKedisiplinan.reduce((acc, curr) => acc + curr.total, 0);

  return (
    <div className="space-y-6">
      {/* HEADER BANNER DENGAN TOMBOL BERDAMPINGAN */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-white p-6 rounded-3xl border-4 border-slate-900 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
            <span>🛡️</span> Log & Rekap Catatan Kedisiplinan
          </h2>
          <p className="text-xs font-bold text-slate-400 uppercase">
            Monitoring indeks kepatuhan tata tertib operasional berkala Siswa SMAN 1 Pemulutan Selatan
          </p>
        </div>
        
        {/* GRUP TOMBOL KONTROL */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <Link 
            href="/wakilkesiswaan"
            className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-900 font-black text-xs uppercase tracking-widest px-5 py-3.5 rounded-2xl border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] active:translate-y-1 active:shadow-none transition-all w-full sm:w-auto"
          >
            <ArrowLeft size={16} /> Kembali ke Dashboard
          </Link>

          <button 
            onClick={exportKedisiplinanToExcelWithChart}
            className="flex items-center justify-center gap-2 bg-emerald-400 hover:bg-emerald-500 text-slate-950 font-black text-xs uppercase tracking-widest px-5 py-3.5 rounded-2xl border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] active:translate-y-1 active:shadow-none transition-all w-full sm:w-auto"
          >
            <Download size={16} /> Export Excel + Grafik
          </button>
        </div>
      </div>

      {/* MINI STATS SUMMARY */}
      <div className="bg-amber-50 border-4 border-slate-900 p-5 rounded-2xl flex items-center justify-between shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
        <div className="space-y-1">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Akumulasi Poin Pelanggaran Aktif</p>
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">{totalKasusSemesterIni} Insiden Tercatat</h3>
        </div>
        <div className="w-12 h-12 rounded-xl bg-amber-400 border-2 border-slate-900 flex items-center justify-center text-slate-950 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
          <ShieldAlert size={20} />
        </div>
      </div>

      {/* PREVIEW TABEL DI HALAMAN WEB */}
      <div className="bg-white p-6 rounded-[2.5rem] border-4 border-slate-900 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b-2 border-slate-900 text-[10px] font-black text-slate-400 uppercase tracking-wider">
              <th className="pb-3">Periode Bulan</th>
              <th className="pb-3 text-center">Keterlambatan</th>
              <th className="pb-3 text-center">Pelanggaran Atribut</th>
              <th className="pb-3 text-center">Bolos / Cabut</th>
              <th className="pb-3 text-right">Total Kasus</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-bold text-xs">
            {dataKedisiplinan.map((item, idx) => (
              <tr key={idx} className="hover:bg-slate-50/80">
                <td className="py-3.5 text-slate-900 font-black uppercase tracking-tight">{item.bulan}</td>
                <td className="py-3.5 text-center text-amber-600 font-mono">{item.terlambat} Kasus</td>
                <td className="py-3.5 text-center text-blue-600 font-mono">{item.atribut} Kasus</td>
                <td className="py-3.5 text-center text-rose-600 font-mono">{item.bolos} Siswa</td>
                <td className="py-3.5 text-right font-mono font-black text-slate-950 bg-slate-50/50 px-2 rounded">
                  {item.total} Kejadian
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}