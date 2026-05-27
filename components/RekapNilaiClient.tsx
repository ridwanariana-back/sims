// app/kepalasekolah/rekap-nilai/RekapNilaiClient.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import ExcelJS from "exceljs";
import { ArrowLeft, Download, TrendingUp, BookOpen, Award } from "lucide-react";

interface RowNilai {
  mapel: string;
  rataRata: number;
  tertinggi: number;
  terendah: number;
  tuntas: string;
}

interface LogNilai {
  id: number;
  mapel: string;
  angka: number;
  jenis: string;
  nama_murid: string;
  nama_guru: string;
}

interface ClientProps {
  initialDataNilai: RowNilai[];
  listLogNilai: LogNilai[];
  namaSekolah: string;
  userSession: any;
}

export default function RekapNilaiClient({ initialDataNilai, listLogNilai, namaSekolah, userSession }: ClientProps) {
  const [dataNilai] = useState<RowNilai[]>(initialDataNilai);
  const [logNilai] = useState<LogNilai[]>(listLogNilai);

  const userRole = userSession?.user?.role?.toLowerCase() || "guru";
  let backPath = "/dashboard";
  if (userRole === "kepalasekolah") backPath = "/kepalasekolah";
  else if (userRole === "wakilkurikulum") backPath = "/wakilkurikulum";
  else if (userRole === "wakilkesiswaan") backPath = "/wakilkesiswaan";

  const rataRataSekolah = dataNilai.length > 0 
    ? dataNilai.reduce((acc, curr) => acc + curr.rataRata, 0) / dataNilai.length 
    : 0;

  const exportNilaiToExcelWithChart = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Rekap Nilai Akademik");

    worksheet.columns = [
      { header: "Mata Pelajaran", key: "mapel", width: 25 },
      { header: "Rata-Rata Nilai", key: "rataRata", width: 18 },
      { header: "Nilai Tertinggi", key: "tertinggi", width: 18 },
      { header: "Nilai Terendah", key: "terendah", width: 18 },
      { header: "Persentase Ketuntasan", key: "tuntas", width: 22 },
    ];

    worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFF" }, name: "Arial" };
    worksheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "0F172A" } };
    worksheet.getRow(1).alignment = { vertical: "middle", horizontal: "center" };

    dataNilai.forEach((item) => worksheet.addRow(item));

    const chartConfig = {
      type: "bar",
      data: {
        labels: dataNilai.map((n) => n.mapel),
        datasets: [{
          label: "Rata-Rata Nilai Siswa",
          data: dataNilai.map((n) => n.rataRata),
          backgroundColor: "#6366f1",
          borderWidth: 1
        }]
      },
      options: {
        title: { display: true, text: `PERBANDINGAN RATA-RATA NILAI PER MAPEL - ${namaSekolah.toUpperCase()}` },
        scales: { yAxes: [{ ticks: { min: 0, max: 100 } }] }
      }
    };

    try {
      const response = await fetch(`https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(chartConfig))}&w=500&h=300`);
      const arrayBuffer = await (await response.blob()).arrayBuffer();
      const imageId = workbook.addImage({ buffer: arrayBuffer, extension: "png" });
      worksheet.addImage(imageId, { tl: { col: 6, row: 1 }, ext: { width: 500, height: 300 } });
    } catch (error) {
      console.error("Gagal menyisipkan grafik nilai:", error);
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
    link.download = `Rekap_Nilai_Akademik_SIMS_${namaSekolah.replace(/\s+/g, "_")}.xlsx`;
    link.click();
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER BANNER */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-white p-6 rounded-3xl border-4 border-slate-900 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] gap-4">
        <div>
          <h2 className="text-2xl lg:text-3xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
            <span>📚</span> Rekapitulasi Nilai Akademik
          </h2>
          <p className="text-xs font-bold text-slate-400 uppercase mt-0.5">
            Analisis capaian kurikulum dan standarisasi nilai siswa di <span className="text-indigo-600">{namaSekolah}</span>
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
            onClick={exportNilaiToExcelWithChart}
            className="flex items-center justify-center gap-2 bg-emerald-400 hover:bg-emerald-500 text-slate-950 font-black text-xs uppercase tracking-widest px-5 py-3.5 rounded-2xl border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] active:translate-y-0.5 active:shadow-none transition-all w-full sm:w-auto"
          >
            <Download size={14} /> Export Excel + Grafik
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

      {/* PREVIEW TABEL UTAMA MAPEL */}
      <div className="bg-white p-6 rounded-[2.5rem] border-4 border-slate-900 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            {/* INLINE TAG CLAMPING UNTUK PREVENT HYDRATION ERROR 🚀 */}
            <tr className="border-b-4 border-slate-900 text-[10px] font-black text-slate-400 uppercase tracking-wider"><th className="pb-4">Mata Pelajaran</th><th className="pb-4 text-center">Rata-Rata</th><th className="pb-4 text-center">Tertinggi</th><th className="pb-4 text-center">Terendah</th><th className="pb-4 text-right">Ketuntasan</th></tr>
          </thead>
          <tbody className="divide-y-2 divide-slate-900/10 font-bold text-xs">
            {dataNilai.map((item, idx) => (
              <tr key={idx} className="hover:bg-slate-50/60 transition-colors"><td className="py-4 flex items-center gap-2"><div className="p-1.5 bg-slate-100 rounded-lg border border-slate-200"><BookOpen size={14} className="text-indigo-600" /></div><span className="text-slate-900 font-black uppercase tracking-tight text-[13px]">{item.mapel}</span></td><td className="py-4 text-center text-indigo-600 font-black font-mono text-base">{item.rataRata}</td><td className="py-4 text-center text-emerald-600 font-mono text-sm">{item.tertinggi}</td><td className="py-4 text-center text-rose-500 font-mono text-sm">{item.terendah}</td><td className="py-4 text-right font-black text-slate-900"><span className="bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-xl border border-emerald-200 uppercase text-[10px] tracking-wider font-mono">{item.tuntas}</span></td></tr>
            ))}
            {dataNilai.length === 0 && (
              <tr><td colSpan={5} className="py-8 text-center text-slate-400 uppercase font-black text-xs">Belum ada data nilai riil yang masuk di database</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* LOG ENTRANCE NILAI TERBARU (DENGAN IDENTITAS LENGKAP NISN & NIP) */}
      <div className="bg-white p-6 rounded-[2.5rem] border-4 border-slate-900 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] space-y-4">
        <div className="flex items-center gap-2 border-b-2 border-slate-100 pb-3">
          <div className="p-2 bg-amber-400 text-slate-950 border-2 border-slate-900 rounded-xl shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]"><Award size={16} /></div>
          <div>
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">Log 10 Transaksi Penilaian Terbaru</h4>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Audit transparansi entri nilai murid dan penanggung jawab guru pendidik</p>
          </div>
        </div>

        <div className="overflow-x-auto border-2 border-slate-900 rounded-2xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b-2 border-slate-900 font-black text-slate-600 uppercase tracking-wider"><th className="p-3 pl-4">Mapel</th><th className="p-3">Jenis Evaluasi</th><th className="p-3 text-center">Skor Nilai</th><th className="p-3">Nama Lengkap Murid (NISN)</th><th className="p-3">Guru Penguji / Wali Kelas (NIP)</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-bold text-slate-800">
              {logNilai.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80"><td className="p-3 pl-4 font-black text-slate-900 uppercase">{log.mapel}</td><td className="p-3"><span className="bg-slate-100 text-slate-600 border border-slate-300 rounded px-2 py-0.5 text-[10px] font-mono uppercase font-black">{log.jenis}</span></td><td className="p-3 text-center font-mono text-sm font-black text-indigo-600 bg-indigo-50/30">{log.angka}</td><td className="p-3 text-slate-900 uppercase tracking-tight text-[11px]">{log.nama_murid}</td><td className="p-3 text-slate-500 uppercase tracking-tight text-[11px] bg-slate-50/50">{log.nama_guru}</td></tr>
              ))}
              {logNilai.length === 0 && (
                <tr><td colSpan={5} className="p-4 text-center text-slate-400 italic">Belum ada aktivitas transaksi penilaian</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}