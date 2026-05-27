// app/kepalasekolah/datamurid/DetailMuridClient.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import ExcelJS from "exceljs";
import { ArrowLeft, Download, Users, Search, X } from "lucide-react";

interface RekapMurid {
  kelas: string;
  wali: string;
  l: number;
  p: number;
  total: number;
}

interface DetailMurid {
  nisn: string;
  nama: string;
  gender: string;
  rombel: string;
  status: string;
}

interface DetailMuridClientProps {
  initialDataMurid: RekapMurid[];
  listSemuaMurid: DetailMurid[];
  namaSekolah: string;
  userSession: any;
}

export default function DetailMuridClient({ initialDataMurid, listSemuaMurid, namaSekolah, userSession }: DetailMuridClientProps) {
  const [dataMurid] = useState<RekapMurid[]>(initialDataMurid);
  const [searchQuery, setSearchQuery] = useState("");

  // == STATE UNTUK MODAL MAGIC 🔮 ==
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [filteredModalMurid, setFilteredModalMurid] = useState<DetailMurid[]>([]);

  // Logika Backpath
  const userRole = userSession?.user?.role?.toLowerCase() || "guru";
  let backPath = "/dashboard";
  if (userRole === "kepalasekolah") backPath = "/kepalasekolah";
  else if (userRole === "wakilkurikulum") backPath = "/wakilkurikulum";
  else if (userRole === "wakilkesiswaan") backPath = "/wakilkesiswaan";

  const filteredMurid = dataMurid.filter((item) =>
    item.kelas.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.wali.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // == FUNGSI MEMBUKA MODAL SECARA DINAMIS ==
  const handleOpenDetailModal = (kelas: string, genderFilter: "LAKI-LAKI" | "PEREMPUAN" | "TOTAL") => {
    let result = listSemuaMurid.filter(m => m.rombel === kelas);
    
    if (genderFilter !== "TOTAL") {
      result = result.filter(m => m.gender.toUpperCase() === genderFilter);
    }

    setFilteredModalMurid(result);
    setModalTitle(`Daftar Murid Kelas ${kelas} (${genderFilter === "TOTAL" ? "Semua Gender" : genderFilter})`);
    setIsModalOpen(true);
  };

  const exportMuridToExcelWithChart = async () => {
    if (filteredMurid.length === 0) return alert("Tidak ada data!");
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Rekapitulasi Data Murid");

    worksheet.columns = [
      { header: "Kelas / Rombel", key: "kelas", width: 18 },
      { header: "Wali Kelas (NIP)", key: "wali", width: 45 },
      { header: "Laki-Laki (L)", key: "l", width: 20 },
      { header: "Perempuan (P)", key: "p", width: 20 },
      { header: "Total Siswa", key: "total", width: 22 },
    ];

    worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFF" }, name: "Arial" };
    worksheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "0F172A" } };

    filteredMurid.forEach(item => worksheet.addRow(item));

    // Chart config singkat
    const chartConfig = {
      type: "bar",
      data: {
        labels: filteredMurid.map(m => m.kelas),
        datasets: [
          { label: "Laki-Laki", data: filteredMurid.map(m => m.l), backgroundColor: "#3b82f6" },
          { label: "Perempuan", data: filteredMurid.map(m => m.p), backgroundColor: "#ec4899" }
        ]
      },
      options: { title: { display: true, text: "GRAFIK DEMOGRAFI" } }
    };

    try {
      const response = await fetch(`https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(chartConfig))}&w=500&h=300`);
      const arrayBuffer = await (await response.blob()).arrayBuffer();
      const imageId = workbook.addImage({ buffer: arrayBuffer, extension: "png" });
      worksheet.addImage(imageId, { tl: { col: 6, row: 1 }, ext: { width: 500, height: 300 } });
    } catch (e) { console.error(e); }

    const buffer = await workbook.xlsx.writeBuffer();
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
    link.download = `Laporan_Demografi_Siswa.xlsx`;
    link.click();
  };

  const totalSiswaSekolah = filteredMurid.reduce((acc, curr) => acc + curr.total, 0);

  return (
    <div className="space-y-6 relative">
      
      {/* HEADER BANNER */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-white p-6 rounded-3xl border-4 border-slate-900 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] gap-4">
        <div>
          <h2 className="text-2xl lg:text-3xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
            <span>🎒</span> Analisis Data & Demografi Murid
          </h2>
          <p className="text-xs font-bold text-slate-400 uppercase mt-0.5">
            Monitoring sebaran kuota dan rasio gender siswa di <span className="text-indigo-600">{namaSekolah}</span>
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
            onClick={exportMuridToExcelWithChart}
            className="flex items-center justify-center gap-2 bg-emerald-400 hover:bg-emerald-500 text-slate-950 font-black text-xs uppercase tracking-widest px-5 py-3.5 rounded-2xl border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] active:translate-y-0.5 active:shadow-none transition-all w-full sm:w-auto"
          >
            <Download size={14} /> Export Excel + Grafik
          </button>
        </div>
      </div>

      {/* SEARCH BAR & MINI STATS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-2xl border-4 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] flex items-center gap-3">
          <Search className="text-slate-400 shrink-0" size={18} />
          <input 
            type="text" 
            placeholder="CARI KELAS ATAU WALI KELAS..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs font-black uppercase text-slate-900 placeholder-slate-400 outline-none tracking-tight"
          />
        </div>
        <div className="bg-blue-50 border-4 border-slate-900 p-4 rounded-2xl flex items-center justify-between shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Konsolidasi Murid</p>
            <h3 className="text-xl font-black text-slate-900 tracking-tight">{totalSiswaSekolah} Siswa Aktif</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-400 border-2 border-slate-900 flex items-center justify-center text-slate-950">
            <Users size={16} />
          </div>
        </div>
      </div>

      {/* PREVIEW TABEL DI HALAMAN WEB */}
      <div className="bg-white p-6 rounded-[2.5rem] border-4 border-slate-900 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="border-b-4 border-slate-900 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <th className="pb-4 w-28">Kelas / Rombel</th>
              <th className="pb-4">Wali Kelas Utama (Pendidik)</th>
              <th className="pb-4 text-center">Laki-Laki (L)</th>
              <th className="pb-4 text-center">Perempuan (P)</th>
              <th className="pb-4 text-right">Total Siswa</th>
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-slate-900/10 font-bold text-xs">
            {filteredMurid.map((item, idx) => (
              <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                <td className="py-4">
                  <span className="bg-slate-900 text-white font-mono text-[11px] font-black px-3 py-1.5 rounded-xl border border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
                    {item.kelas}
                  </span>
                </td>
                <td className="py-4 text-slate-900 font-black uppercase tracking-tight text-[12px]">{item.wali}</td>
                
                {/* 🔮 MAGIC CLICKABLE KOLOM LAKI-LAKI */}
                <td className="py-4 text-center">
                  <button 
                    onClick={() => handleOpenDetailModal(item.kelas, "LAKI-LAKI")}
                    className="text-blue-600 bg-blue-50 hover:bg-blue-100 border-2 border-blue-400 px-3 py-1.5 rounded-xl font-mono transition-all transform hover:-translate-y-0.5 active:translate-y-0 shadow-[2px_2px_0px_0px_rgba(59,130,246,0.3)]"
                  >
                    {item.l} Siswa 🔍
                  </button>
                </td>

                {/* 🔮 MAGIC CLICKABLE KOLOM PEREMPUAN */}
                <td className="py-4 text-center">
                  <button 
                    onClick={() => handleOpenDetailModal(item.kelas, "PEREMPUAN")}
                    className="text-pink-600 bg-pink-50 hover:bg-pink-100 border-2 border-pink-400 px-3 py-1.5 rounded-xl font-mono transition-all transform hover:-translate-y-0.5 active:translate-y-0 shadow-[2px_2px_0px_0px_rgba(236,72,153,0.3)]"
                  >
                    {item.p} Siswa 🔍
                  </button>
                </td>

                {/* 🔮 MAGIC CLICKABLE KOLOM TOTAL */}
                <td className="py-4 text-right">
                  <button 
                    onClick={() => handleOpenDetailModal(item.kelas, "TOTAL")}
                    className="bg-amber-100 border-2 border-amber-400 hover:bg-amber-200 text-amber-900 font-mono font-black px-3 py-1.5 rounded-xl transition-all transform hover:-translate-y-0.5 active:translate-y-0 shadow-[2px_2px_0px_0px_rgba(245,158,11,0.3)]"
                  >
                    {item.total} Orang 🔍
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ========================================================= */}
      {/* 🔮 RENDER MODAL POP-UP DETAIL SISWA AKTIF (NEO-BRUTALISM) 🔮 */}
      {/* ========================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-[2rem] border-4 border-slate-900 shadow-[10px_10px_0px_0px_rgba(15,23,42,1)] w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-6 bg-slate-900 text-white flex justify-between items-center shrink-0">
              <h3 className="font-black text-sm md:text-base uppercase tracking-tight flex items-center gap-2">
                <span>📂</span> {modalTitle}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="bg-rose-500 hover:bg-rose-600 border-2 border-white p-1.5 rounded-xl text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="p-6 overflow-y-auto space-y-4 bg-slate-50/50 flex-1">
              {filteredModalMurid.length === 0 ? (
                <p className="text-center py-8 font-black text-slate-400 uppercase">Tidak ada data murid terdaftar.</p>
              ) : (
                <div className="border-2 border-slate-900 rounded-2xl bg-white overflow-hidden shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 border-b-2 border-slate-900 font-black text-slate-600 uppercase tracking-wider">
                        <th className="p-3 pl-4">No</th>
                        <th className="p-3">NISN</th>
                        <th className="p-3">Nama Lengkap Siswa</th>
                        <th className="p-3 text-center">Gender</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-bold text-slate-800">
                      {filteredModalMurid.map((m, index) => (
                        <tr key={index} className="hover:bg-slate-50">
                          <td className="p-3 pl-4 font-mono text-slate-400">{index + 1}</td>
                          <td className="p-3 font-mono text-indigo-600">{m.nisn}</td>
                          <td className="p-3 uppercase font-black text-slate-900">{m.nama}</td>
                          <td className="p-3 text-center">
                            <span className={`px-2 py-1 rounded-md text-[10px] font-black border ${
                              m.gender.toUpperCase() === 'LAKI-LAKI' 
                                ? 'bg-blue-100 border-blue-300 text-blue-800' 
                                : 'bg-pink-100 border-pink-300 text-pink-800'
                            }`}>
                              {m.gender.toUpperCase() === 'LAKI-LAKI' ? 'L' : 'P'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t-2 border-slate-100 bg-white flex justify-end shrink-0">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-widest px-6 py-3 rounded-xl border-2 border-slate-900 active:translate-y-0.5 transition-all"
              >
                Tutup Window
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}