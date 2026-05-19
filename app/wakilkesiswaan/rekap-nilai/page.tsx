// app/kepalasekolah/rekap-nilai/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import ExcelJS from "exceljs";
import { ArrowLeft, Download, TrendingUp, BookOpen } from "lucide-react";

export default function RekapNilaiPage() {
  // Mock Data Rekap Nilai (Siap disambungkan ke database Neon DB)
  const [dataNilai] = useState([
    { mapel: "Matematika", rataRata: 78, tertinggi: 98, terendah: 60, tuntas: "85%" },
    { mapel: "Bahasa Indonesia", rataRata: 85, tertinggi: 96, terendah: 72, tuntas: "94%" },
    { mapel: "Bahasa Inggris", rataRata: 82, tertinggi: 95, terendah: 68, tuntas: "90%" },
    { mapel: "IPA (Fisika/Bio)", rataRata: 75, tertinggi: 94, terendah: 55, tuntas: "78%" },
    { mapel: "IPS (Sejarah/Geo)", rataRata: 80, tertinggi: 92, terendah: 65, tuntas: "88%" },
    { mapel: "Pendidikan Agama", rataRata: 88, tertinggi: 100, terendah: 75, tuntas: "100%" },
  ]);

  const exportNilaiToExcelWithChart = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Rekap Nilai Akademik");

    // 1. Setup Header Kolom Excel
    worksheet.columns = [
      { header: "Mata Pelajaran", key: "mapel", width: 25 },
      { header: "Rata-Rata Nilai", key: "rataRata", width: 18 },
      { header: "Nilai Tertinggi", key: "tertinggi", width: 18 },
      { header: "Nilai Terendah", key: "terendah", width: 18 },
      { header: "Persentase Ketuntasan", key: "tuntas", width: 22 },
    ];

    // Styling Header Neo-Brutalisme (Slate 900)
    worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFF" } };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "0F172A" },
    };

    // 2. Masukkan Data baris demi baris
    dataNilai.forEach((item) => {
      worksheet.addRow(item);
    });

    // 3. SEKTOR GRAFIK: Perbandingan Rata-Rata Nilai antar Mapel
    const chartConfig = {
      type: "bar",
      data: {
        labels: dataNilai.map((n) => n.mapel),
        datasets: [{
          label: "Rata-Rata Nilai Siswa",
          data: dataNilai.map((n) => n.rataRata),
          backgroundColor: "#6366f1", // Indigo
          borderWidth: 1
        }]
      },
      options: {
        title: { display: true, text: "PERBANDINGAN RATA-RATA NILAI PER MAPEL" },
        scales: { yAxes: [{ ticks: { min: 0, max: 100 } }] }
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

      worksheet.addImage(imageId, {
        tl: { col: 6, row: 1 },
        ext: { width: 500, height: 300 }
      });
    } catch (error) {
      console.error("Gagal menyisipkan grafik nilai:", error);
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const fileBlob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const fileUrl = URL.createObjectURL(fileBlob);
    
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = `Rekap_Nilai_Akademik_SIMS_${new Date().getFullYear()}.xlsx`;
    link.click();
    URL.revokeObjectURL(fileUrl);
  };

  // Hitung rata-rata sekolah secara keseluruhan
  const rataRataSekolah = dataNilai.reduce((acc: number, curr) => acc + curr.rataRata, 0) / dataNilai.length;

  return (
    <div className="space-y-6">
      {/* HEADER BANNER DENGAN TOMBOL BERDAMPINGAN */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-white p-6 rounded-3xl border-4 border-slate-900 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
            <span>📚</span> Rekapitulasi Nilai Akademik
          </h2>
          <p className="text-xs font-bold text-slate-400 uppercase">
            Ringkasan pencapaian kurikulum dan standarisasi nilai siswa SMAN 1 Pemulutan Selatan
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
            onClick={exportNilaiToExcelWithChart}
            className="flex items-center justify-center gap-2 bg-emerald-400 hover:bg-emerald-500 text-slate-950 font-black text-xs uppercase tracking-widest px-5 py-3.5 rounded-2xl border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] active:translate-y-1 active:shadow-none transition-all w-full sm:w-auto"
          >
            <Download size={16} /> Export Excel + Grafik
          </button>
        </div>
      </div>

      {/* MINI STATS SUMMARY */}
      <div className="bg-indigo-50 border-4 border-slate-900 p-5 rounded-2xl flex items-center justify-between shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
        <div className="space-y-1">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Indeks Rata-Rata Akademik Sekolah</p>
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">{rataRataSekolah.toFixed(1)} / 100</h3>
        </div>
        <div className="w-12 h-12 rounded-xl bg-indigo-400 border-2 border-slate-900 flex items-center justify-center text-slate-950 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
          <TrendingUp size={20} />
        </div>
      </div>

      {/* PREVIEW TABEL DI HALAMAN WEB */}
      <div className="bg-white p-6 rounded-[2.5rem] border-4 border-slate-900 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b-2 border-slate-900 text-[10px] font-black text-slate-400 uppercase tracking-wider">
              <th className="pb-3">Mata Pelajaran</th>
              <th className="pb-3 text-center">Rata-Rata</th>
              <th className="pb-3 text-center">Tertinggi</th>
              <th className="pb-3 text-center">Terendah</th>
              <th className="pb-3 text-right">Ketuntasan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-bold text-xs">
            {dataNilai.map((item, idx) => (
              <tr key={idx} className="hover:bg-slate-50/80">
                <td className="py-3.5 flex items-center gap-2">
                  <div className="p-1.5 bg-slate-100 rounded-lg border border-slate-200">
                    <BookOpen size={14} className="text-indigo-600" />
                  </div>
                  <span className="text-slate-900 font-black uppercase tracking-tight">{item.mapel}</span>
                </td>
                <td className="py-3.5 text-center text-indigo-600 font-black font-mono text-base">{item.rataRata}</td>
                <td className="py-3.5 text-center text-emerald-600 font-mono">{item.tertinggi}</td>
                <td className="py-3.5 text-center text-rose-500 font-mono">{item.terendah}</td>
                <td className="py-3.5 text-right font-black text-slate-900">
                  <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-xl border border-emerald-200">
                    {item.tuntas}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}