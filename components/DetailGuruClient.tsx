// components/DetailGuruClient.tsx
"use client";

import { useState } from "react";
import ExcelJS from "exceljs";
import Link from "next/link";
import { ArrowLeft, Download, Search, UserCheck } from "lucide-react";

interface Guru {
  id: number;
  nip: string;
  nama: string;
  status: string;
  jamMengajar: number;
  mapel: string;
  jabatan: string;
}

interface DetailGuruClientProps {
  initialDataGuru: Guru[];
  namaSekolah: string;
  userSession: any;
}

export default function DetailGuruClient({ initialDataGuru, namaSekolah, userSession }: DetailGuruClientProps) {
  const [dataGuru] = useState<Guru[]>(initialDataGuru);
  const [searchQuery, setSearchQuery] = useState("");

  // == LOGIKA TOMBOL KEMBALI DINAMIS BERDASARKAN ROLE ==
  const userRole = userSession?.user?.role?.toLowerCase() || "guru";
  
  let backPath = "/"; // jalur fallback aman
  
  if (userRole === "kepalasekolah") {
    backPath = "/kepalasekolah";
  } else if (userRole === "wakilkurikulum") {
    backPath = "/wakilkurikulum"; // sesuaikan dengan folder path dashboard kurikulummu
  } else if (userRole === "wakilkesiswaan") {
    backPath = "/wakilkesiswaan"; // sesuaikan dengan folder path dashboard kesiswaanmu
  }

  // Filter pencarian data guru dinamis di sisi client
  const filteredGuru = dataGuru.filter((guru) =>
    guru.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
    guru.nip.includes(searchQuery) ||
    guru.mapel.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const exportToExcelWithChart = async () => {
    if (filteredGuru.length === 0) return alert("Tidak ada data untuk di-export!");

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Laporan Beban Kerja Guru");

    // 1. Setup Kolom Tabel Utama Excel
    worksheet.columns = [
      { header: "NIP", key: "nip", width: 25 },
      { header: "Nama Lengkap Guru", key: "nama", width: 35 },
      { header: "Status Kepegawaian", key: "status", width: 20 },
      { header: "Tugas Tambahan", key: "jabatan", width: 20 },
      { header: "Mata Pelajaran Utama", key: "mapel", width: 25 },
      { header: "Beban Mengajar (JP)", key: "jamMengajar", width: 22 },
    ];

    // Styling Header Row (Tema Neo-Brutalisme Slate 900)
    worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFF" }, name: "Arial", size: 11 };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "0F172A" },
    };
    worksheet.getRow(1).alignment = { vertical: "middle", horizontal: "center" };

    // 2. Masukkan Data Riil Database ke baris Excel
    filteredGuru.forEach((guru) => {
      worksheet.addRow(guru);
    });

    // 3. ENGINE GRAFIK: Suntik QuickChart API ke Excel Sheet
    const chartConfig = {
      type: "bar",
      data: {
        labels: filteredGuru.map((g) => g.nama.split(" ")[0]), // Ambil kata pertama nama guru agar chart rapi
        datasets: [{
          label: "Beban Mengajar (JP)",
          data: filteredGuru.map((g) => g.jamMengajar),
          backgroundColor: "#818cf8", // Indigo 400
          borderColor: "#4338ca", // Indigo 700
          borderWidth: 2
        }]
      },
      options: {
        title: { 
          display: true, 
          text: `GRAFIK PEMBAGIAN JAM MENGAJAR - ${namaSekolah.toUpperCase()}` 
        },
        scales: {
          yAxes: [{ ticks: { beginAtZero: true } }]
        }
      }
    };

    const chartUrl = `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(chartConfig))}&w=600&h=350`;

    try {
      const response = await fetch(chartUrl);
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();

      const imageId = workbook.addImage({
        buffer: arrayBuffer,
        extension: "png",
      });

      // Tempatkan Grafik di kolom H baris 2
      worksheet.addImage(imageId, {
        tl: { col: 7, row: 1 },
        ext: { width: 550, height: 320 }
      });
    } catch (error) {
      console.error("Gagal menyuntikkan grafik otomatis:", error);
    }

    // 4. Trigger Download file excel di browser laptop user
    const buffer = await workbook.xlsx.writeBuffer();
    const fileBlob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const fileUrl = URL.createObjectURL(fileBlob);
    
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = `Laporan_Beban_Guru_${namaSekolah.replace(/\s+/g, "_")}.xlsx`;
    link.click();
    URL.revokeObjectURL(fileUrl);
  };

  return (
    <div className="space-y-6">
      {/* HEADER ATAS */}
      <div className="bg-white p-6 lg:p-8 rounded-[2rem] border-4 border-slate-900 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-2xl lg:text-3xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
            <span>📋</span> Monitoring Data Guru
          </h2>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">
            Daftar fungsional & distribusi beban mengajar di <span className="text-indigo-600">{namaSekolah}</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <Link 
            href={backPath}
            className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-900 font-black text-xs uppercase tracking-widest px-5 py-3.5 rounded-2xl border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] active:translate-y-0.5 active:shadow-none transition-all w-full sm:w-auto"
          >
            <ArrowLeft size={14} /> Kembali
          </Link>
          <button 
            onClick={exportToExcelWithChart}
            className="flex items-center justify-center gap-2 bg-emerald-400 hover:bg-emerald-500 text-slate-950 font-black text-xs uppercase tracking-widest px-5 py-3.5 rounded-2xl border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] active:translate-y-0.5 active:shadow-none transition-all w-full sm:w-auto"
          >
            <Download size={14} /> Export Laporan + Grafik
          </button>
        </div>
      </div>

      {/* FILTER SEARCH BAR BARU */}
      <div className="bg-white p-4 rounded-2xl border-4 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] flex items-center gap-3 max-w-md">
        <Search className="text-slate-400 shrink-0" size={18} />
        <input 
          type="text" 
          placeholder="CARI NAMA GURU ATAU MATA PELAJARAN..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full text-xs font-black uppercase text-slate-900 placeholder-slate-400 outline-none tracking-tight"
        />
      </div>

      {/* VIEW UTAMA DATA TABEL */}
      <div className="bg-white p-6 lg:p-8 rounded-[2.5rem] border-4 border-slate-900 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="border-b-4 border-slate-900 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <th className="pb-4">Nama Lengkap Pendidik</th>
              <th className="pb-4">NIP / Identitas</th>
              <th className="pb-4">Mata Pelajaran</th>
              <th className="pb-4">Status Kerja</th>
              <th className="pb-4 text-center">Beban Mengajar</th>
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-slate-900/10 font-bold text-xs">
            {filteredGuru.map((guru) => (
              <tr key={guru.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="py-4">
                  <div className="flex flex-col">
                    <span className="text-slate-900 font-black uppercase text-[13px]">{guru.nama}</span>
                    <span className="text-[9px] font-black tracking-wider text-indigo-500 uppercase flex items-center gap-0.5 mt-0.5">
                      🎖️ {guru.jabatan}
                    </span>
                  </div>
                </td>
                <td className="py-4 text-slate-600 font-mono tracking-tight">{guru.nip}</td>
                <td className="py-4">
                  <span className="bg-indigo-50 border-2 border-indigo-200 text-indigo-700 px-2.5 py-1 rounded-md text-[10px] font-black uppercase">
                    📚 {guru.mapel}
                  </span>
                </td>
                <td className="py-4">
                  <span className={`px-2.5 py-0.5 rounded border-2 font-black text-[9px] uppercase ${
                    guru.status === "PNS" 
                      ? "bg-amber-100 text-amber-800 border-amber-300" 
                      : "bg-purple-100 text-purple-800 border-purple-300"
                  }`}>
                    {guru.status}
                  </span>
                </td>
                <td className="py-4 text-center">
                  <span className="font-mono text-xs font-black bg-slate-100 border-2 border-slate-900 px-3 py-1 rounded-lg shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
                    {guru.jamMengajar} JP
                  </span>
                </td>
              </tr>
            ))}

            {filteredGuru.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center font-black text-slate-400 uppercase tracking-wide">
                  ❌ Data guru tidak ditemukan atau belum dimasukkan ke sistem.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}