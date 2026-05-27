// app/kepalasekolah/kedisiplinan/CatatanKedisiplinanClient.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import ExcelJS from "exceljs";
import { ArrowLeft, Download, ShieldAlert, X } from "lucide-react";

interface RekapKedisiplinan {
  bulan_angka: number;
  bulan: string;
  kedisiplinan: number;
  kerajinan: number;
  kebersihan: number;
  lainnya: number;
  total: number;
}

interface DetailCatatan {
  id: number;
  tanggal: string;
  bulan_angka: number;
  kategori: string;
  keterangan: string;
  nama_murid: string; // Otomatis berformat Nama (NISN: xxx)
  rombel: string;
  nama_guru: string;
}

interface ClientProps {
  initialDataKedisiplinan: RekapKedisiplinan[];
  listSemuaCatatan: DetailCatatan[];
  namaSekolah: string;
  userSession: any;
}

export default function CatatanKedisiplinanClient({ initialDataKedisiplinan, listSemuaCatatan, namaSekolah, userSession }: ClientProps) {
  const [dataKedisiplinan] = useState<RekapKedisiplinan[]>(initialDataKedisiplinan);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [filteredDetails, setFilteredDetails] = useState<DetailCatatan[]>([]);

  const userRole = userSession?.user?.role?.toLowerCase() || "guru";
  let backPath = "/dashboard";
  if (userRole === "kepalasekolah") backPath = "/kepalasekolah";
  else if (userRole === "wakilkurikulum") backPath = "/wakilkurikulum";
  else if (userRole === "wakilkesiswaan") backPath = "/wakilkesiswaan";

  const bulanAktifKasus = dataKedisiplinan.filter((d) => d.total > 0);
  const displayChartData = bulanAktifKasus.length > 0 ? bulanAktifKasus : dataKedisiplinan.slice(0, 6);

  const handleOpenDetailModal = (bulanAngka: number, kategoriFilter: string | "TOTAL") => {
    let result = listSemuaCatatan.filter((c) => c.bulan_angka === bulanAngka);
    
    if (kategoriFilter !== "TOTAL") {
      result = result.filter((c) => c.kategori.toUpperCase() === kategoriFilter.toUpperCase());
    }

    const namaBulan = dataKedisiplinan.find(d => d.bulan_angka === bulanAngka)?.bulan || "";
    setFilteredDetails(result);
    setModalTitle(`Detail Log Insiden ${kategoriFilter === "TOTAL" ? "Semua Kategori" : kategoriFilter} - Bulan ${namaBulan}`);
    setIsModalOpen(true);
  };

  const exportKedisiplinanToExcelWithChart = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Laporan Tata Tertib Siswa");

    worksheet.columns = [
      { header: "Periode Bulan", key: "bulan", width: 18 },
      { header: "Kategori Kedisiplinan", key: "kedisiplinan", width: 22 },
      { header: "Kategori Kerajinan", key: "kerajinan", width: 22 },
      { header: "Kategori Kebersihan", key: "kebersihan", width: 22 },
      { header: "Lainnya", key: "lainnya", width: 18 },
      { header: "Total Kasus", key: "total", width: 18 },
    ];

    worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFF" }, name: "Arial" };
    worksheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "0F172A" } };
    worksheet.getRow(1).alignment = { vertical: "middle", horizontal: "center" };

    dataKedisiplinan.forEach((item) => worksheet.addRow(item));

    const chartConfig = {
      type: "line",
      data: {
        labels: displayChartData.map((k) => k.bulan),
        datasets: [
          { label: "Kedisiplinan", data: displayChartData.map((k) => k.kedisiplinan), borderColor: "#f59e0b", fill: false, borderWidth: 2 },
          { label: "Kerajinan", data: displayChartData.map((k) => k.kerajinan), borderColor: "#3b82f6", fill: false, borderWidth: 2 },
          { label: "Kebersihan", data: displayChartData.map((k) => k.kebersihan), borderColor: "#10b981", fill: false, borderWidth: 2 },
          { label: "Lainnya", data: displayChartData.map((k) => k.lainnya), borderColor: "#ef4444", fill: false, borderWidth: 2 }
        ]
      },
      options: {
        title: { display: true, text: `GRAFIK TREN INDEKS PELANGGARAN - ${namaSekolah.toUpperCase()}` }
      }
    };

    try {
      const response = await fetch(`https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(chartConfig))}&w=550&h=320`);
      const arrayBuffer = await (await response.blob()).arrayBuffer();
      const imageId = workbook.addImage({ buffer: arrayBuffer, extension: "png" });
      worksheet.addImage(imageId, { tl: { col: 7, row: 1 }, ext: { width: 520, height: 300 } });
    } catch (error) {
      console.error("Gagal menyisipkan grafik:", error);
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
    link.download = `Laporan_Indeks_Tata_Tertib_Siswa_${namaSekolah.replace(/\s+/g, "_")}.xlsx`;
    link.click();
  };

  const totalKasusSemesterIni = dataKedisiplinan.reduce((acc, curr) => acc + curr.total, 0);

  return (
    <div className="space-y-6 relative">
      
      {/* HEADER BANNER */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-white p-6 rounded-3xl border-4 border-slate-900 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] gap-4">
        <div>
          <h2 className="text-2xl lg:text-3xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
            <span>🛡️</span> Log & Rekap Catatan Kedisiplinan
          </h2>
          <p className="text-xs font-bold text-slate-400 uppercase mt-0.5">
            Monitoring indeks kepatuhan tata tertib berkala di <span className="text-amber-600">{namaSekolah}</span>
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
            onClick={exportKedisiplinanToExcelWithChart}
            className="flex items-center justify-center gap-2 bg-emerald-400 hover:bg-emerald-500 text-slate-950 font-black text-xs uppercase tracking-widest px-5 py-3.5 rounded-2xl border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] active:translate-y-0.5 active:shadow-none transition-all w-full sm:w-auto"
          >
            <Download size={14} /> Export Excel + Grafik
          </button>
        </div>
      </div>

      {/* MINI STATS SUMMARY */}
      <div className="bg-amber-50 border-4 border-slate-900 p-5 rounded-2xl flex items-center justify-between shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
        <div className="space-y-1">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Akumulasi Poin Insiden Periode Aktif</p>
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">{totalKasusSemesterIni} Kasus Tercatat</h3>
        </div>
        <div className="w-12 h-12 rounded-xl bg-amber-400 border-2 border-slate-900 flex items-center justify-center text-slate-950 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
          <ShieldAlert size={20} />
        </div>
      </div>

      {/* TABEL PREVIEW DATA KEDISIPLINAN */}
      <div className="bg-white p-6 rounded-[2.5rem] border-4 border-slate-900 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            {/* FIXED HYDRATION ERROR (NO WHITESPACE CHILD TR) 🚀 */}
            <tr className="border-b-4 border-slate-900 text-[10px] font-black text-slate-400 uppercase tracking-widest"><th className="pb-4">Periode Bulan</th><th className="pb-4 text-center">Kedisiplinan</th><th className="pb-4 text-center">Kerajinan</th><th className="pb-4 text-center">Kebersihan</th><th className="pb-4 text-center">Lainnya</th><th className="pb-4 text-right">Total Insiden</th></tr>
          </thead>
          <tbody className="divide-y-2 divide-slate-900/10 font-bold text-xs">
            {dataKedisiplinan.map((item, idx) => (
              /* FIXED HYDRATION ERROR (CLAMPED INLINE TD) 🚀 */
              <tr key={idx} className="hover:bg-slate-50/60 transition-colors"><td className="py-4 text-slate-900 font-black uppercase tracking-tight text-[13px]">{item.bulan}</td><td className="py-4 text-center"><button onClick={() => handleOpenDetailModal(item.bulan_angka, "Kedisiplinan")} disabled={item.kedisiplinan === 0} className={`font-mono px-3 py-1.5 rounded-xl border-2 font-black transition-all ${item.kedisiplinan > 0 ? "text-amber-700 bg-amber-50 border-amber-400 hover:bg-amber-100 transform hover:-translate-y-0.5 shadow-[2px_2px_0px_0px_rgba(245,158,11,0.2)]" : "text-slate-300 bg-slate-50 border-slate-200 cursor-not-allowed"}`}>{item.kedisiplinan} Kasus</button></td><td className="py-4 text-center"><button onClick={() => handleOpenDetailModal(item.bulan_angka, "Kerajinan")} disabled={item.kerajinan === 0} className={`font-mono px-3 py-1.5 rounded-xl border-2 font-black transition-all ${item.kerajinan > 0 ? "text-blue-700 bg-blue-50 border-blue-400 hover:bg-blue-100 transform hover:-translate-y-0.5 shadow-[2px_2px_0px_0px_rgba(59,130,246,0.2)]" : "text-slate-300 bg-slate-50 border-slate-200 cursor-not-allowed"}`}>{item.kerajinan} Kasus</button></td><td className="py-4 text-center"><button onClick={() => handleOpenDetailModal(item.bulan_angka, "Kebersihan")} disabled={item.kebersihan === 0} className={`font-mono px-3 py-1.5 rounded-xl border-2 font-black transition-all ${item.kebersihan > 0 ? "text-emerald-700 bg-emerald-50 border-emerald-400 hover:bg-emerald-100 transform hover:-translate-y-0.5 shadow-[2px_2px_0px_0px_rgba(16,185,129,0.2)]" : "text-slate-300 bg-slate-50 border-slate-200 cursor-not-allowed"}`}>{item.kebersihan} Kasus</button></td><td className="py-4 text-center"><button onClick={() => handleOpenDetailModal(item.bulan_angka, "Lainnya")} disabled={item.lainnya === 0} className={`font-mono px-3 py-1.5 rounded-xl border-2 font-black transition-all ${item.lainnya > 0 ? "text-rose-700 bg-rose-50 border-rose-400 hover:bg-rose-100 transform hover:-translate-y-0.5 shadow-[2px_2px_0px_0px_rgba(239,68,68,0.2)]" : "text-slate-300 bg-slate-50 border-slate-200 cursor-not-allowed"}`}>{item.lainnya} Kasus</button></td><td className="py-4 text-right"><button onClick={() => handleOpenDetailModal(item.bulan_angka, "TOTAL")} disabled={item.total === 0} className={`font-mono font-black px-3 py-1.5 rounded-xl border-2 transition-all ${item.total > 0 ? "bg-slate-900 border-slate-900 text-white hover:bg-slate-800 transform hover:-translate-y-0.5 shadow-[2px_2px_0px_0px_rgba(15,23,42,0.3)]" : "text-slate-300 bg-slate-50 border-slate-200 cursor-not-allowed"}`}>{item.total} Kejadian 🔍</button></td></tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ========================================================= */}
      {/* 🔮 POP-UP MODAL LIST DETAIL PELANGGARAN (NEO-BRUTALISM) 🔮 */}
      {/* ========================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-[2rem] border-4 border-slate-900 shadow-[10px_10px_0px_0px_rgba(15,23,42,1)] w-full max-w-5xl max-h-[85vh] flex flex-col overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-6 bg-slate-900 text-white flex justify-between items-center shrink-0">
              <h3 className="font-black text-xs md:text-sm uppercase tracking-tight flex items-center gap-2">
                <span>📋</span> {modalTitle}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="bg-rose-500 hover:bg-rose-600 border-2 border-white p-1.5 rounded-xl text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 bg-slate-50/50 flex-1">
              <div className="border-2 border-slate-900 rounded-2xl bg-white overflow-hidden shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    {/* FIXED HYDRATION ERROR (NO WHITESPACE IN MODAL THEAD TR) 🚀 */}
                    <tr className="bg-slate-100 border-b-2 border-slate-900 font-black text-slate-600 uppercase tracking-wider"><th className="p-3 pl-4">Tanggal</th><th className="p-3">Nama Lengkap Murid (NISN)</th><th className="p-3 text-center">Rombel</th><th className="p-3">Kategori</th><th className="p-3">Keterangan Kasus</th><th className="p-3">Pelapor / Guru Pendidik (NIP)</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-bold text-slate-800">
                    {filteredDetails.map((catatan) => (
                      /* FIXED HYDRATION ERROR (CLAMPED INLINE TD WITH DATA INJECTED NISN) 🚀 */
                      <tr key={catatan.id} className="hover:bg-slate-50/80"><td className="p-3 pl-4 font-mono text-slate-500 shrink-0">{catatan.tanggal}</td><td className="p-3 font-black text-slate-900 uppercase bg-indigo-50/20">{catatan.nama_murid}</td><td className="p-3 text-center"><span className="bg-slate-100 border border-slate-300 font-mono text-[10px] px-2 py-0.5 rounded">{catatan.rombel}</span></td><td className="p-3"> <span className={`px-2 py-0.5 rounded text-[10px] font-black border uppercase ${catatan.kategori.toUpperCase() === 'KEDISIPLINAN' ? 'bg-amber-100 border-amber-300 text-amber-800' : catatan.kategori.toUpperCase() === 'KERAJINAN' ? 'bg-blue-100 border-blue-300 text-blue-800' : catatan.kategori.toUpperCase() === 'KEBERSIHAN' ? 'bg-emerald-100 border-emerald-300 text-emerald-800' : 'bg-rose-100 border-rose-300 text-rose-800'}`}>{catatan.kategori}</span></td><td className="p-3 text-slate-600 italic font-medium max-w-xs break-words">{catatan.keterangan}</td><td className="p-3 text-slate-900 font-black text-[11px] bg-slate-50/40 uppercase tracking-tight">{catatan.nama_guru}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t-2 border-slate-100 bg-white flex justify-end shrink-0">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-widest px-6 py-3 rounded-xl border-2 border-slate-900 active:translate-y-0.5 transition-all"
              >
                Kembali ke Ringkasan
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}