// app/kepalasekolah/alumni/AlumniClient.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import ExcelJS from "exceljs";
import { ArrowLeft, Download, GraduationCap, School, Search } from "lucide-react";

interface Alumni {
  id: number;
  nama: string;
  nisn: string;
  klaster: string;
  instansi: string;
  detailStatus: string;
  jalur: string;
  tahunLulus: number;
}

interface AlumniClientProps {
  initialAlumni: Alumni[];
  namaSekolah: string;
  userSession: any;
}

export default function AlumniClient({ initialAlumni, namaSekolah, userSession }: AlumniClientProps) {
  const [dataAlumni] = useState<Alumni[]>(initialAlumni);
  const [searchQuery, setSearchQuery] = useState("");

  // Jalur kembali dinamis berdasarkan peran/role user session
  const userRole = userSession?.user?.role?.toLowerCase() || "guru";
  let backPath = userRole === "kepalasekolah" ? "/kepalasekolah" : "/";

  // Filter pencarian data alumni real-time (bisa cari nama, nisn, instansi, atau klaster)
  const filteredAlumni = dataAlumni.filter((item) => 
    item.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.nisn.includes(searchQuery) ||
    item.instansi.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.klaster.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Perhitungan Distribusi Klaster Riil untuk Data Grafik (Pie Chart)
  const totalKuliah = filteredAlumni.filter((a) => a.klaster === "KULIAH").length;
  const totalKerja = filteredAlumni.filter((a) => a.klaster === "KERJA").length;
  const totalWirausaha = filteredAlumni.filter((a) => a.klaster === "WIRAUSAHA").length;
  const totalLainnya = filteredAlumni.filter((a) => a.klaster === "LAINNYA").length;

  const exportAlumniToExcelWithChart = async () => {
    if (filteredAlumni.length === 0) return alert("Tidak ada data untuk di-export!");

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Tracer Study Alumni");

    // 1. Setup Header Kolom Excel (Formil & Disertai NISN Murid)
    worksheet.columns = [
      { header: "NISN", key: "nisn", width: 18 },
      { header: "Nama Alumni", key: "nama", width: 25 },
      { header: "Tahun Lulus", key: "tahunLulus", width: 15 },
      { header: "Klaster Kelulusan", key: "klaster", width: 20 },
      { header: "Nama Instansi / Kampus / Usaha", key: "instansi", width: 35 },
      { header: "Jalur Masuk / Rekrutmen", key: "jalur", width: 22 },
      { header: "Detail Keterangan", key: "detailStatus", width: 25 },
    ];

    // Styling Header Formil Neo-Brutalisme (Slate 900)
    worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFF" }, name: "Arial" };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "0F172A" },
    };
    worksheet.getRow(1).alignment = { vertical: "middle", horizontal: "center" };

    // 2. Masukkan Data baris demi baris
    filteredAlumni.forEach((item) => {
      worksheet.addRow(item);
    });

    // 3. SEKTOR GRAFIK DINAMIS: Proporsi Klaster (Pie Chart) berdasarkan kuantitas data riil terfilter
    const chartConfig = {
      type: "pie",
      data: {
        labels: ["Kuliah", "Kerja", "Wirausaha", "Lainnya"],
        datasets: [
          {
            data: [totalKuliah, totalKerja, totalWirausaha, totalLainnya],
            backgroundColor: ["#3b82f6", "#10b981", "#f59e0b", "#94a3b8"], // Blue, Emerald, Amber, Slate
          },
        ],
      },
      options: {
        title: { display: true, text: `PROPORSI SEBARAN ALUMNI - ${namaSekolah.toUpperCase()}` },
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

      // Letakkan Grafik di sebelah kanan tabel (Mulai Kolom I, Baris 2)
      worksheet.addImage(imageId, {
        tl: { col: 8, row: 1 },
        ext: { width: 450, height: 300 },
      });
    } catch (error) {
      console.error("Gagal menyisipkan grafik proporsi alumni:", error);
    }

    // 4. Unduh File Excel ke Browser
    const buffer = await workbook.xlsx.writeBuffer();
    const fileBlob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const fileUrl = URL.createObjectURL(fileBlob);

    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = `Laporan_Tracer_Study_Alumni_${namaSekolah.replace(/\s+/g, "_")}.xlsx`;
    link.click();
    URL.revokeObjectURL(fileUrl);
  };

  const totalAlumniTercatat = filteredAlumni.length;

  return (
    <div className="space-y-6">
      {/* HEADER BANNER */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-white p-6 rounded-3xl border-4 border-slate-900 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
            <span>🎓</span> Kualitas Lulusan & Statistik Alumni
          </h2>
          <p className="text-xs font-bold text-slate-400 uppercase mt-0.5">
            Analisis efisiensi kelulusan tahunan dan pelacakan (*tracer study*) sebaran alumni <span className="text-indigo-600">{namaSekolah}</span>
          </p>
        </div>

        {/* GRUP TOMBOL KONTROL */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <Link
            href={backPath}
            className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-900 font-black text-xs uppercase tracking-widest px-5 py-3.5 rounded-2xl border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] active:translate-y-0.5 active:shadow-none transition-all w-full sm:w-auto"
          >
            <ArrowLeft size={16} /> Kembali
          </Link>

          <button
            onClick={exportAlumniToExcelWithChart}
            className="flex items-center justify-center gap-2 bg-emerald-400 hover:bg-emerald-500 text-slate-950 font-black text-xs uppercase tracking-widest px-5 py-3.5 rounded-2xl border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] active:translate-y-0.5 active:shadow-none transition-all w-full sm:w-auto"
          >
            <Download size={16} /> Export Excel + Grafik
          </button>
        </div>
      </div>

      {/* FILTER SEARCH BAR DATA ALUMNI */}
      <div className="bg-white p-4 rounded-2xl border-4 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] flex items-center gap-3 max-w-md">
        <Search className="text-slate-400 shrink-0" size={18} />
        <input 
          type="text" 
          placeholder="CARI NAMA, NISN, KAMPUS, KLASTER..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full text-xs font-black uppercase text-slate-900 placeholder-slate-400 outline-none tracking-tight"
        />
      </div>

      {/* MINI STATS SUMMARY & SUMMARY KLASTER */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="bg-blue-50 border-4 border-slate-900 p-5 rounded-2xl flex items-center justify-between shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] lg:col-span-2">
          <div className="space-y-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Traced Lulusan Akhir</p>
            <h3 className="text-xl font-black text-slate-900 tracking-tight">{totalAlumniTercatat} Alumni Berhasil Dilacak</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-400 border-2 border-slate-900 flex items-center justify-center text-slate-950 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
            <GraduationCap size={20} />
          </div>
        </div>

        {/* KLASTER QUICK VIEW STATS */}
        <div className="bg-white border-4 border-slate-900 p-3.5 rounded-2xl flex flex-col justify-center text-center shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
          <span className="text-[9px] font-black text-blue-500 uppercase">🎓 KULIAH</span>
          <span className="text-lg font-black text-slate-900 font-mono">{totalKuliah}</span>
        </div>
        <div className="bg-white border-4 border-slate-900 p-3.5 rounded-2xl flex flex-col justify-center text-center shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
          <span className="text-[9px] font-black text-emerald-500 uppercase">💼 KERJA</span>
          <span className="text-lg font-black text-slate-900 font-mono">{totalKerja}</span>
        </div>
        <div className="bg-white border-4 border-slate-900 p-3.5 rounded-2xl flex flex-col justify-center text-center shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
          <span className="text-[9px] font-black text-amber-500 uppercase">🚀 WIRAUSAHA</span>
          <span className="text-lg font-black text-slate-900 font-mono">{totalWirausaha}</span>
        </div>
      </div>

      {/* PREVIEW TABEL DI HALAMAN WEB */}
      <div className="bg-white p-6 rounded-[2.5rem] border-4 border-slate-900 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="border-b-4 border-slate-900 text-[10px] font-black text-slate-400 uppercase tracking-wider">
              <th className="pb-3">Nama Alumni & NISN</th>
              <th className="pb-3 text-center">Tahun Lulus</th>
              <th className="pb-3 text-center">Klaster</th>
              <th className="pb-3">Instansi Tujuan / Kampus / Usaha</th>
              <th className="pb-3">Jalur / Metode</th>
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-slate-900/10 font-bold text-xs">
            {filteredAlumni.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="py-4">
                  <div className="flex flex-col">
                    <span className="text-slate-900 font-black uppercase text-[13px]">{item.nama}</span>
                    <span className="text-slate-500 font-mono text-[10px] tracking-tight mt-0.5">
                      NISN: {item.nisn}
                    </span>
                  </div>
                </td>
                <td className="py-4 text-center font-mono text-slate-600 text-sm">{item.tahunLulus}</td>
                <td className="py-4 text-center">
                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-md border-2 uppercase font-mono ${
                    item.klaster === "KULIAH" ? "bg-blue-50 text-blue-700 border-blue-200" :
                    item.klaster === "KERJA" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                    item.klaster === "WIRAUSAHA" ? "bg-amber-50 text-amber-700 border-amber-200" :
                    "bg-slate-100 text-slate-600 border-slate-300"
                  }`}>
                    {item.klaster}
                  </span>
                </td>
                <td className="py-4">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-slate-100 rounded-lg border border-slate-200 shrink-0">
                      <School size={14} className="text-indigo-600" />
                    </div>
                    <span className="text-slate-900 font-black uppercase tracking-tight">{item.instansi}</span>
                  </div>
                </td>
                <td className="py-4">
                  <div className="flex flex-col">
                    <span className="text-slate-900 font-black uppercase">{item.jalur}</span>
                    <span className="text-[10px] font-normal text-slate-400 italic normal-case">{item.detailStatus}</span>
                  </div>
                </td>
              </tr>
            ))}

            {filteredAlumni.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center font-black text-slate-400 uppercase tracking-wide">
                  ❌ Belum ada data pelacakan lulusan (*tracer study*) yang cocok dengan pencarian.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}