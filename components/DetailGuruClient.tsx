"use client";

import { useState } from "react";
import ExcelJS from "exceljs";
import Link from "next/link";
import { ArrowLeft, Download, Search, ChevronLeft, ChevronRight } from "lucide-react";

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
  
  // == STATE PAGINATION ==
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // == LOGIKA TOMBOL KEMBALI DINAMIS BERDASARKAN ROLE ==
  const userRole = userSession?.user?.role?.toLowerCase() || "guru";
  
  let backPath = "/";
  if (userRole === "kepalasekolah") {
    backPath = "/kepalasekolah";
  } else if (userRole === "wakilkurikulum") {
    backPath = "/wakilkurikulum";
  } else if (userRole === "wakilkesiswaan") {
    backPath = "/wakilkesiswaan";
  }

  // Filter pencarian data guru dinamis di sisi client
  const filteredGuru = dataGuru.filter((guru) =>
    guru.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
    guru.nip.includes(searchQuery) ||
    guru.mapel.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // == HITUNG DATA UNTUK PAGINATION ==
  const totalPages = Math.ceil(filteredGuru.length / itemsPerPage);
  // Reset ke halaman 1 jika user mengetik pencarian baru agar tidak out-of-bounds
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentGuruList = filteredGuru.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (pageNumber: number) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  const exportToExcelWithChart = async () => {
    if (filteredGuru.length === 0) return alert("Tidak ada data untuk di-export!");

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Laporan Beban Kerja Guru");

    worksheet.columns = [
      { header: "NIP", key: "nip", width: 25 },
      { header: "Nama Lengkap Guru", key: "nama", width: 35 },
      { header: "Status Kepegawaian", key: "status", width: 20 },
      { header: "Tugas Tambahan", key: "jabatan", width: 20 },
      { header: "Mata Pelajaran Utama", key: "mapel", width: 25 },
      { header: "Beban Mengajar (JP)", key: "jamMengajar", width: 22 },
    ];

    worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFF" }, name: "Arial", size: 11 };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "0F172A" },
    };
    worksheet.getRow(1).alignment = { vertical: "middle", horizontal: "center" };

    filteredGuru.forEach((guru) => {
      worksheet.addRow(guru);
    });

    const chartConfig = {
      type: "bar",
      data: {
        labels: filteredGuru.map((g) => g.nama.split(" ")[0]),
        datasets: [{
          label: "Beban Mengajar (JP)",
          data: filteredGuru.map((g) => g.jamMengajar),
          backgroundColor: "#818cf8",
          borderColor: "#4338ca",
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

      worksheet.addImage(imageId, {
        tl: { col: 7, row: 1 },
        ext: { width: 550, height: 320 }
      });
    } catch (error) {
      console.error("Gagal menyuntikkan grafik otomatis:", error);
    }

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

      {/* FILTER SEARCH BAR */}
      <div className="bg-white p-4 rounded-2xl border-4 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] flex items-center gap-3 max-w-md">
        <Search className="text-slate-400 shrink-0" size={18} />
        <input 
          type="text" 
          placeholder="CARI NAMA GURU ATAU MATA PELAJARAN..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1); // Balik ke page 1 tiap kali nyari guru
          }}
          className="w-full text-xs font-black uppercase text-slate-900 placeholder-slate-400 outline-none tracking-tight"
        />
      </div>

      {/* VIEW UTAMA DATA TABEL */}
      <div className="bg-white p-6 lg:p-8 rounded-[2.5rem] border-4 border-slate-900 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse table-fixed min-w-[800px]">
          <thead>
            <tr className="border-b-4 border-slate-900 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <th className="pb-4 w-[30%]">Nama Lengkap Pendidik</th>
              <th className="pb-4 w-[20%] pl-4">NIP / Identitas</th>
              <th className="pb-4 w-[25%] pl-4">Mata Pelajaran</th>
              <th className="pb-4 w-[13%]">Status Kerja</th>
              <th className="pb-4 w-[12%] text-center">Beban Mengajar</th>
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-slate-900/10 font-bold text-xs">
            {currentGuruList.map((guru) => (
              <tr key={guru.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="py-4 pr-2">
                  <div className="flex flex-col">
                    <span className="text-slate-900 font-black uppercase text-[13px] break-words">{guru.nama}</span>
                    <span className="text-[9px] font-black tracking-wider text-indigo-500 uppercase flex items-center gap-0.5 mt-0.5">
                      🎖️ {guru.jabatan}
                    </span>
                  </div>
                </td>
                {/* Memberikan padding kiri (pl-4) agar tidak terlalu nempel dengan kolom nama */}
                <td className="py-4 pl-4 text-slate-600 font-mono tracking-tight break-all">{guru.nip}</td>
                {/* Kolom Mapel dirapikan menggunakan list ul & li */}
                <td className="py-4 pl-4 vertical-align-top">
                  <ul className="flex flex-col gap-1.5">
                    {guru.mapel.split(", ").map((item, index) => (
                      <li key={index} className="inline-self-start">
                        <span className="inline-block bg-indigo-50 border-2 border-indigo-200 text-indigo-700 px-2.5 py-1 rounded-md text-[10px] font-black uppercase whitespace-normal break-words">
                          📚 {item}
                        </span>
                      </li>
                    ))}
                  </ul>
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

        {/* == UI INTERFACE PAGINATION NEO-BRUTALISME == */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6 pt-4 border-t-4 border-slate-900">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
              Menampilkan {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredGuru.length)} Dari {filteredGuru.length} Guru
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 rounded-xl border-2 border-slate-900 bg-white hover:bg-slate-100 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] active:translate-y-0.5 active:shadow-none disabled:opacity-40 disabled:hover:bg-white disabled:active:translate-y-0 disabled:active:shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] transition-all"
              >
                <ChevronLeft size={16} className="text-slate-900" />
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-1.5 rounded-xl border-2 border-slate-900 text-xs font-black transition-all ${
                      currentPage === page
                        ? "bg-indigo-500 text-white shadow-none translate-y-0.5"
                        : "bg-white text-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] hover:bg-slate-100 active:translate-y-0.5 active:shadow-none"
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-xl border-2 border-slate-900 bg-white hover:bg-slate-100 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] active:translate-y-0.5 active:shadow-none disabled:opacity-40 disabled:hover:bg-white disabled:active:translate-y-0 disabled:active:shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] transition-all"
              >
                <ChevronRight size={16} className="text-slate-900" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}