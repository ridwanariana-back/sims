// app/kepalasekolah/prestasi/PrestasiClient.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import ExcelJS from "exceljs";
import { ArrowLeft, Download, Trophy, Medal, Search } from "lucide-react";

interface Prestasi {
  nama: string;
  identitas: string;
  kategori: string;
  kelasJabatan: string;
  lomba: string;
  tingkat: string;
  juara: string;
  tahun: number;
}

interface PrestasiClientProps {
  initialPrestasi: Prestasi[];
  namaSekolah: string;
  userSession: any;
}

export default function PrestasiClient({ initialPrestasi, namaSekolah, userSession }: PrestasiClientProps) {
  const [dataPrestasi] = useState<Prestasi[]>(initialPrestasi);
  const [searchQuery, setSearchQuery] = useState("");

  // Jalur kembali dinamis berdasarkan peran/role user session
  const userRole = userSession?.user?.role?.toLowerCase() || "guru";
  let backPath = userRole === "kepalasekolah" ? "/kepalasekolah" : "/";

  // Filter pencarian data prestasi real-time di sisi client
  const filteredPrestasi = dataPrestasi.filter((item) => 
    item.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.identitas.includes(searchQuery) ||
    item.lomba.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.tingkat.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const exportPrestasiToExcelWithChart = async () => {
    if (filteredPrestasi.length === 0) return alert("Tidak ada data untuk di-export!");

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Data Prestasi Sekolah");

    // 1. Setup Header Kolom Excel (Menambahkan Kolom Tipe & Nomor Identitas)
    worksheet.columns = [
      { header: "Nama Peraih", key: "nama", width: 25 },
      { header: "Kategori", key: "kategori", width: 12 },
      { header: "NIP / NISN", key: "identitas", width: 20 },
      { header: "Kelas / Jabatan", key: "kelasJabatan", width: 20 },
      { header: "Nama Lomba / Kompetisi", key: "lomba", width: 35 },
      { header: "Tingkat", key: "tingkat", width: 18 },
      { header: "Peringkat Juara", key: "juara", width: 20 },
      { header: "Tahun", key: "tahun", width: 12 },
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
    filteredPrestasi.forEach((item) => {
      worksheet.addRow(item);
    });

    // 3. SEKTOR GRAFIK: Menghitung jumlah juara berdasarkan tingkatan
    const tingkatan = ["Kabupaten/kota", "Provinsi", "Nasional", "Internasional"];
    const hitungTingkat = tingkatan.map(
      (t) => filteredPrestasi.filter((p) => p.tingkat.toLowerCase() === t.toLowerCase()).length
    );

    const labelTingkatanChart = ["Kabupaten", "Provinsi", "Nasional", "Internasional"];

    const chartConfig = {
      type: "bar",
      data: {
        labels: labelTingkatanChart,
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
        title: { display: true, text: `GRAFIK PRESTASI CIVITAS - ${namaSekolah.toUpperCase()}` },
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

      // Tempatkan Grafik di samping kanan tabel (Mulai kolom J karena ada sisipan kolom identitas)
      worksheet.addImage(imageId, {
        tl: { col: 9, row: 1 },
        ext: { width: 500, height: 300 },
      });
    } catch (error) {
      console.error("Gagal menyisipkan grafik prestasi otomatis:", error);
    }

    // 4. Unduh File Excel ke Browser
    const buffer = await workbook.xlsx.writeBuffer();
    const fileBlob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const fileUrl = URL.createObjectURL(fileBlob);

    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = `Laporan_Prestasi_${namaSekolah.replace(/\s+/g, "_")}.xlsx`;
    link.click();
    URL.revokeObjectURL(fileUrl);
  };

  const totalPrestasi = filteredPrestasi.length;

  return (
    <div className="space-y-6">
      {/* HEADER BANNER */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-white p-6 rounded-3xl border-4 border-slate-900 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
            <span>🏆</span> Papan Penghargaan & Prestasi
          </h2>
          <p className="text-xs font-bold text-slate-400 uppercase mt-0.5">
            Daftar capaian prestasi akademik dan non-akademik civitas di <span className="text-indigo-600">{namaSekolah}</span>
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
            onClick={exportPrestasiToExcelWithChart}
            className="flex items-center justify-center gap-2 bg-emerald-400 hover:bg-emerald-500 text-slate-950 font-black text-xs uppercase tracking-widest px-5 py-3.5 rounded-2xl border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] active:translate-y-0.5 active:shadow-none transition-all w-full sm:w-auto"
          >
            <Download size={16} /> Export Excel + Grafik
          </button>
        </div>
      </div>

      {/* FILTER SEARCH BAR DATA PRESTASI */}
      <div className="bg-white p-4 rounded-2xl border-4 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] flex items-center gap-3 max-w-md">
        <Search className="text-slate-400 shrink-0" size={18} />
        <input 
          type="text" 
          placeholder="CARI PERAIH, NIP/NISN, KOMPETISI..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full text-xs font-black uppercase text-slate-900 placeholder-slate-400 outline-none tracking-tight"
        />
      </div>

      {/* MINI STATS SUMMARY */}
      <div className="bg-yellow-50 border-4 border-slate-900 p-5 rounded-2xl flex items-center justify-between shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
        <div className="space-y-1">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Capaian Terfilter</p>
          <h3 className="text-xl lg:text-2xl font-black text-slate-900 tracking-tight">{totalPrestasi} Penghargaan Resmi Terdata</h3>
        </div>
        <div className="w-12 h-12 rounded-xl bg-yellow-400 border-2 border-slate-900 flex items-center justify-center text-slate-950 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
          <Trophy size={20} />
        </div>
      </div>

      {/* PREVIEW TABEL DI HALAMAN WEB */}
      <div className="bg-white p-6 rounded-[2.5rem] border-4 border-slate-900 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="border-b-4 border-slate-900 text-[10px] font-black text-slate-400 uppercase tracking-wider">
              <th className="pb-3">Nama Peraih</th>
              <th className="pb-3">Kelas / Jabatan</th>
              <th className="pb-3">Nama Kompetisi</th>
              <th className="pb-3 text-center">Tingkat</th>
              <th className="pb-3 text-center">Hasil Juara</th>
              <th className="pb-3 text-right">Tahun</th>
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-slate-900/10 font-bold text-xs">
            {filteredPrestasi.map((item, idx) => (
              <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                <td className="py-4">
                  {/* LOGIKA CONDITIONAL BADGE IDENTITAS DI SAMPING NAMA */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <span className="text-slate-900 font-black uppercase text-[13px]">{item.nama}</span>
                    {item.identitas !== "-" && (
                      <span className="bg-slate-100 text-slate-600 font-mono text-[9px] px-2 py-0.5 rounded border border-slate-300 w-fit">
                        {item.kategori === "GURU" ? "NIP" : "NISN"}: {item.identitas}
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-4 text-slate-500 font-mono text-[11px]">{item.kelasJabatan}</td>
                <td className="py-4 text-indigo-600 uppercase font-black">{item.lomba}</td>
                <td className="py-4 text-center">
                  <span className="bg-slate-900 text-white font-mono text-[10px] font-black px-2.5 py-1 rounded border border-slate-900 uppercase">
                    {item.tingkat}
                  </span>
                </td>
                <td className="py-4 text-center text-amber-600 font-mono">
                  <div className="flex items-center justify-center gap-1 bg-amber-50 border-2 border-amber-200 py-1 px-2 rounded-lg w-fit mx-auto">
                    <Medal size={13} className="text-yellow-500 shrink-0" />
                    <span className="text-[10px] font-black uppercase text-amber-900">{item.juara}</span>
                  </div>
                </td>
                <td className="py-4 text-right font-mono text-slate-600">{item.tahun}</td>
              </tr>
            ))}

            {filteredPrestasi.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center font-black text-slate-400 uppercase tracking-wide">
                  ❌ Belum ada data penghargaan yang terdata atau cocok dengan pencarian.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}