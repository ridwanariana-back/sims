// app/kepalasekolah/alumni/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import ExcelJS from "exceljs";
import { ArrowLeft, Download, GraduationCap, School } from "lucide-react";

export default function StatistikAlumniPage() {
  // Data Riil sesuai dengan screenshot dashboard SIMS kamu
  const [dataAlumni] = useState([
    { instansi: "UNIVERSITAS SRIWIJAYA (UNSRI)", klaster: "PTN DAERAH", jalur: "SNBP / SNBT", jumlah: 45 },
    { instansi: "UIN RADEN FATAH PALEMBANG", klaster: "PTKIN ISLAM", jalur: "SPAN-PTKIN", jumlah: 28 },
    { instansi: "POLITEKNIK NEGERI SRIWIJAYA", klaster: "VOKASI NEGERI", jalur: "Mandiri / SNBP", jumlah: 19 },
    { instansi: "LANGSUNG BEKERJA / WIRAUSAHA", klaster: "KARIER & INDUSTRI", jalur: "BKK Sekolah", jumlah: 15 },
    { instansi: "UNIVERSITAS MUHAMMADIYAH", klaster: "PTS SWASTA", jalur: "Prestasi", jumlah: 12 },
  ]);

  const exportAlumniToExcelWithChart = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Statistik Lulusan & Alumni");

    // 1. Setup Header Kolom Excel
    worksheet.columns = [
      { header: "Instansi Tujuan / Kampus", key: "instansi", width: 35 },
      { header: "Klaster", key: "klaster", width: 22 },
      { header: "Jalur Terbanyak", key: "jalur", width: 22 },
      { header: "Jumlah Lulusan (Orang)", key: "jumlah", width: 22 },
    ];

    // Styling Header Formil Neo-Brutalisme (Slate 900)
    worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFF" } };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "0F172A" },
    };

    // 2. Masukkan Data baris demi baris
    dataAlumni.forEach((item) => {
      worksheet.addRow(item);
    });

    // 3. SEKTOR GRAFIK: Sebaran Destinasi Alumni (Pie Chart)
    const chartConfig = {
      type: "pie",
      data: {
        labels: dataAlumni.map((a) => a.instansi.split(" (")[0]), // Potong teks panjang biar rapi di chart
        datasets: [
          {
            data: dataAlumni.map((a) => a.jumlah),
            backgroundColor: ["#3b82f6", "#10b981", "#f59e0b", "#6366f1", "#ec4899"],
          },
        ],
      },
      options: {
        title: { display: true, text: "PROPORSI DESTINASI LULUSAN AKHIR" },
      },
    };

    const chartUrl = `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(chartConfig))}&w=450&h=300`;

    try {
      const response = await fetch(chartUrl);
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();

      const imageId = workbook.addImage({
        buffer: arrayBuffer,
        extension: "png",
      });

      // Letakkan Grafik di sebelah kanan tabel (Mulai Kolom F, Baris 2)
      worksheet.addImage(imageId, {
        tl: { col: 5, row: 1 },
        ext: { width: 450, height: 300 },
      });
    } catch (error) {
      console.error("Gagal menyisipkan grafik alumni:", error);
    }

    // 4. Unduh File Excel ke Browser
    const buffer = await workbook.xlsx.writeBuffer();
    const fileBlob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const fileUrl = URL.createObjectURL(fileBlob);

    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = `Laporan_Statistik_Alumni_SIMS_${new Date().getFullYear()}.xlsx`;
    link.click();
    URL.revokeObjectURL(fileUrl);
  };

  // Hitung total penyerapan lulusan tahun ini
  const totalAlumniTercatat = dataAlumni.reduce((acc: number, curr) => acc + curr.jumlah, 0);

  return (
    <div className="space-y-6">
      {/* HEADER BANNER DENGAN TOMBOL BERDAMPINGAN */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-white p-6 rounded-3xl border-4 border-slate-900 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
            <span>🎓</span> Kualitas Lulusan & Statistik Alumni
          </h2>
          <p className="text-xs font-bold text-slate-400 uppercase">
            Analisis efisiensi kelulusan tahunan dan pelacakan (*tracer study*) sebaran perguruan tinggi alumni
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
            onClick={exportAlumniToExcelWithChart}
            className="flex items-center justify-center gap-2 bg-emerald-400 hover:bg-emerald-500 text-slate-950 font-black text-xs uppercase tracking-widest px-5 py-3.5 rounded-2xl border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] active:translate-y-1 active:shadow-none transition-all w-full sm:w-auto"
          >
            <Download size={16} /> Export Excel + Grafik
          </button>
        </div>
      </div>

      {/* MINI STATS SUMMARY */}
      <div className="bg-blue-50 border-4 border-slate-900 p-5 rounded-2xl flex items-center justify-between shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
        <div className="space-y-1">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Traced Lulusan Akhir</p>
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">{totalAlumniTercatat} Siswa Berhasil Dilacak</h3>
        </div>
        <div className="w-12 h-12 rounded-xl bg-blue-400 border-2 border-slate-900 flex items-center justify-center text-slate-950 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
          <GraduationCap size={20} />
        </div>
      </div>

      {/* PREVIEW TABEL DI HALAMAN WEB */}
      <div className="bg-white p-6 rounded-[2.5rem] border-4 border-slate-900 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b-2 border-slate-900 text-[10px] font-black text-slate-400 uppercase tracking-wider">
              <th className="pb-3">Instansi Tujuan / Kampus</th>
              <th className="pb-3 text-center">Klaster</th>
              <th className="pb-3 text-center">Jalur Terbanyak</th>
              <th className="pb-3 text-right">Jumlah</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-bold text-xs">
            {dataAlumni.map((item, idx) => (
              <tr key={idx} className="hover:bg-slate-50/80">
                <td className="py-4 flex items-center gap-2">
                  <div className="p-1.5 bg-slate-100 rounded-lg border border-slate-200">
                    <School size={14} className="text-blue-600" />
                  </div>
                  <span className="text-slate-900 font-black tracking-tight">{item.instansi}</span>
                </td>
                <td className="py-4 text-center">
                  <span className="bg-slate-100 text-slate-700 text-[10px] font-black px-2.5 py-1 rounded-md border border-slate-300 uppercase font-mono">
                    {item.klaster}
                  </span>
                </td>
                <td className="py-4 text-center text-slate-500 font-mono text-[11px] font-bold">{item.jalur}</td>
                <td className="py-4 text-right font-mono font-black text-blue-600 text-sm">
                  {item.jumlah} Orang
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}