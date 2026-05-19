// app/kepalasekolah/prestasi/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import ExcelJS from "exceljs";
import { ArrowLeft, Download, Trophy, Medal } from "lucide-react";

export default function PrestasiPage() {
  // Mock Data Prestasi Sekolah (Siap disambungkan ke database Neon DB)
  const [dataPrestasi] = useState([
    { nama: "Rizky Aditya", kelasJabatan: "Kelas XI.1", lomba: "Olimpiade Matematika (OSN)", tingkat: "Nasional", juara: "Juara 2 (Perak)", tahun: 2026 },
    { nama: "Siti Rahmawati", kelasJabatan: "Kelas XII.2", lomba: "Debat Bahasa Inggris", tingkat: "Provinsi", juara: "Juara 1", tahun: 2026 },
    { nama: "Hendra, S.Kom", kelasJabatan: "Guru Informatika", lomba: "Guru Inovatif Digital", tingkat: "Nasional", juara: "Juara 3", tahun: 2025 },
    { nama: "Tim Voli Putra", kelasJabatan: "Ekstrakurikuler", lomba: "Turnamen Voli Cup", tingkat: "Kabupaten", juara: "Juara 1", tahun: 2026 },
    { nama: "Ahmad Fauzan", kelasJabatan: "Kelas X.1", lomba: "FLS2N Baca Puisi", tingkat: "Kabupaten", juara: "Juara 2", tahun: 2026 },
  ]);

  const exportPrestasiToExcelWithChart = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Data Prestasi Sekolah");

    // 1. Setup Header Kolom Excel
    worksheet.columns = [
      { header: "Nama Peraih", key: "nama", width: 25 },
      { header: "Kelas / Jabatan", key: "kelasJabatan", width: 20 },
      { header: "Nama Lomba / Kompetisi", key: "lomba", width: 30 },
      { header: "Tingkat", key: "tingkat", width: 15 },
      { header: "Peringkat Juara", key: "juara", width: 20 },
      { header: "Tahun", key: "tahun", width: 12 },
    ];

    // Styling Header Formil Neo-Brutalisme (Slate 900)
    worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFF" } };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "0F172A" },
    };

    // 2. Masukkan Data baris demi baris
    dataPrestasi.forEach((item) => {
      worksheet.addRow(item);
    });

    // 3. SEKTOR GRAFIK: Menghitung jumlah juara berdasarkan tingkat untuk Chart
    const tingkatan = ["Kabupaten", "Provinsi", "Nasional"];
    const hitungTingkat = tingkatan.map(
      (t) => dataPrestasi.filter((p) => p.tingkat === t).length
    );

    const chartConfig = {
      type: "bar",
      data: {
        labels: tingkatan,
        datasets: [
          {
            label: "Jumlah Penghargaan",
            data: hitungTingkat,
            backgroundColor: "#eab308", // Warna emas piala
            borderColor: "#ca8a04",
            borderWidth: 2,
          },
        ],
      },
      options: {
        title: { display: true, text: "GRAFIK PRESTASI BERDASARKAN TINGKATAN" },
        scales: { yAxes: [{ ticks: { beginAtZero: true, stepSize: 1 } }] },
      },
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

      // Tempatkan Grafik di samping kanan tabel (Mulai kolom H, baris 2)
      worksheet.addImage(imageId, {
        tl: { col: 7, row: 1 },
        ext: { width: 500, height: 300 },
      });
    } catch (error) {
      console.error("Gagal menyisipkan grafik prestasi:", error);
    }

    // 4. Unduh File Excel ke Browser
    const buffer = await workbook.xlsx.writeBuffer();
    const fileBlob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const fileUrl = URL.createObjectURL(fileBlob);

    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = `Laporan_Prestasi_SIMS_${new Date().getFullYear()}.xlsx`;
    link.click();
    URL.revokeObjectURL(fileUrl);
  };

  // Hitung total seluruh medali/prestasi yang ada
  const totalPrestasi = dataPrestasi.length;

  return (
    <div className="space-y-6">
      {/* HEADER BANNER DENGAN TOMBOL BERDAMPINGAN */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-white p-6 rounded-3xl border-4 border-slate-900 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
            <span>🏆</span> Papan Penghargaan & Prestasi
          </h2>
          <p className="text-xs font-bold text-slate-400 uppercase">
            Daftar capaian prestasi akademik dan non-akademik civitas SMAN 1 Pemulutan Selatan
          </p>
        </div>

        {/* GRUP TOMBOL KONTROL */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <Link
            href="/wakilkesiswaan"
            className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-900 font-black text-xs uppercase tracking-widest px-5 py-3.5 rounded-2xl border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] active:translate-y-1 active:shadow-none transition-all w-full sm:w-auto"
          >
            <ArrowLeft size={16} /> Kembali
          </Link>

          <button
            onClick={exportPrestasiToExcelWithChart}
            className="flex items-center justify-center gap-2 bg-emerald-400 hover:bg-emerald-500 text-slate-950 font-black text-xs uppercase tracking-widest px-5 py-3.5 rounded-2xl border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] active:translate-y-1 active:shadow-none transition-all w-full sm:w-auto"
          >
            <Download size={16} /> Export Excel + Grafik
          </button>
        </div>
      </div>

      {/* MINI STATS SUMMARY */}
      <div className="bg-yellow-50 border-4 border-slate-900 p-5 rounded-2xl flex items-center justify-between shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
        <div className="space-y-1">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Penghargaan Terdata</p>
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">{totalPrestasi} Penghargaan Emas / Perak / Perunggu</h3>
        </div>
        <div className="w-12 h-12 rounded-xl bg-yellow-400 border-2 border-slate-900 flex items-center justify-center text-slate-950 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
          <Trophy size={20} />
        </div>
      </div>

      {/* PREVIEW TABEL DI HALAMAN WEB */}
      <div className="bg-white p-6 rounded-[2.5rem] border-4 border-slate-900 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b-2 border-slate-900 text-[10px] font-black text-slate-400 uppercase tracking-wider">
              <th className="pb-3">Nama Peraih</th>
              <th className="pb-3">Kelas / Jabatan</th>
              <th className="pb-3">Nama Kompetisi</th>
              <th className="pb-3 text-center">Tingkat</th>
              <th className="pb-3 text-center">Hasil Juara</th>
              <th className="pb-3 text-right">Tahun</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-bold text-xs">
            {dataPrestasi.map((item, idx) => (
              <tr key={idx} className="hover:bg-slate-50/80">
                <td className="py-3.5 text-slate-900 font-black uppercase tracking-tight">{item.nama}</td>
                <td className="py-3.5 text-slate-500 font-mono">{item.kelasJabatan}</td>
                <td className="py-3.5 text-indigo-600 uppercase font-black">{item.lomba}</td>
                <td className="py-3.5 text-center">
                  <span className="bg-slate-900 text-white font-mono text-[10px] font-black px-2 py-1 rounded">
                    {item.tingkat}
                  </span>
                </td>
                <td className="py-3.5 text-center text-amber-600 font-mono">
                  <div className="flex items-center justify-center gap-1">
                    <Medal size={14} className="text-yellow-500" />
                    <span>{item.juara}</span>
                  </div>
                </td>
                <td className="py-3.5 text-right font-mono text-slate-600">{item.tahun}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}