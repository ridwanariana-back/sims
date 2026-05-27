// app/kepalasekolah/kehadiran/KehadiranClient.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import ExcelJS from "exceljs";
import { ArrowLeft, Download, Users, GraduationCap } from "lucide-react";

interface GuruHadir {
  nama: string;
  nip: string;
  pns: string;
  hadir: number;
  izin: number;
  sakit: number;
  alfa: number;
  persen: string;
}

interface MuridHadir {
  kelas: string;
  totalSiswa: number;
  hadir: number;
  izin: number;
  sakit: number;
  alfa: number;
}

interface KehadiranClientProps {
  initialGuru: GuruHadir[];
  initialMurid: MuridHadir[];
  namaSekolah: string;
  userSession: any;
}

export default function KehadiranClient({ initialGuru, initialMurid, namaSekolah, userSession }: KehadiranClientProps) {
  const [activeTab, setActiveTab] = useState<"guru" | "murid">("guru");
  const [dataHadirGuru] = useState<GuruHadir[]>(initialGuru);
  const [dataHadirMurid] = useState<MuridHadir[]>(initialMurid);

  // Jalur kembali dinamis berdasarkan role
  const userRole = userSession?.user?.role?.toLowerCase() || "guru";
  let backPath = userRole === "kepalasekolah" ? "/kepalasekolah" : "/";

  // == ENGINE EXPORT EXCEL DUA SHEET + DUA GRAFIK DI INDIVIDU TAB ==
  const exportKehadiranToExcelWithChart = async () => {
    const workbook = new ExcelJS.Workbook();

    // ==========================================
    // SHEET 1: PRESENSI KEHADIRAN GURU
    // ==========================================
    const sheetGuru = workbook.addWorksheet("Kehadiran Guru");
    sheetGuru.columns = [
      { header: "Nama Guru", key: "nama", width: 30 },
      { header: "NIP", key: "nip", width: 22 },
      { header: "Status", key: "pns", width: 15 },
      { header: "Hadir (Hari)", key: "hadir", width: 15 },
      { header: "Izin", key: "izin", width: 10 },
      { header: "Sakit", key: "sakit", width: 10 },
      { header: "Alfa", key: "alfa", width: 10 },
      { header: "Persentase", key: "persen", width: 15 },
    ];
    
    sheetGuru.getRow(1).font = { bold: true, color: { argb: "FFFFFF" }, name: "Arial" };
    sheetGuru.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "0F172A" } };
    sheetGuru.getRow(1).alignment = { vertical: "middle", horizontal: "center" };
    dataHadirGuru.forEach(g => sheetGuru.addRow(g));

    // Konfigurasi QuickChart Bar (Presensi Guru)
    const chartGuruConfig = {
      type: "bar",
      data: {
        labels: dataHadirGuru.map(g => g.nama.split(",")[0].substring(0, 12)),
        datasets: [{
          label: "Jumlah Hari Hadir",
          data: dataHadirGuru.map(g => g.hadir),
          backgroundColor: "rgba(59, 130, 246, 0.7)",
          borderColor: "#0F172A",
          borderWidth: 1.5
        }]
      },
      options: { title: { display: true, text: `TOTAL PRESENSI GURU - ${namaSekolah.toUpperCase()}` } }
    };
    const urlGuru = `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(chartGuruConfig))}&w=500&h=280`;

    // ==========================================
    // SHEET 2: PRESENSI KEHADIRAN MURID
    // ==========================================
    const sheetMurid = workbook.addWorksheet("Kehadiran Murid");
    sheetMurid.columns = [
      { header: "Tingkat Kelas", key: "kelas", width: 25 },
      { header: "Total Siswa", key: "totalSiswa", width: 15 },
      { header: "Rata-rata Hadir (%)", key: "hadir", width: 20 },
      { header: "Izin (%)", key: "izin", width: 12 },
      { header: "Sakit (%)", key: "sakit", width: 12 },
      { header: "Alfa (%)", key: "alfa", width: 12 },
    ];
    
    sheetMurid.getRow(1).font = { bold: true, color: { argb: "FFFFFF" }, name: "Arial" };
    sheetMurid.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "3B82F6" } };
    sheetMurid.getRow(1).alignment = { vertical: "middle", horizontal: "center" };
    dataHadirMurid.forEach(m => sheetMurid.addRow(m));

    // Konfigurasi QuickChart Pie (Proporsi Alfa Murid)
    const chartMuridConfig = {
      type: "pie",
      data: {
        labels: dataHadirMurid.map(m => m.kelas),
        datasets: [{
          data: dataHadirMurid.map(m => m.alfa),
          backgroundColor: ["#EF4444", "#F59E0B", "#10B981"]
        }]
      },
      options: { title: { display: true, text: "PROPORSI RASIO ALFA (%) MURID PER TINGKATAN" } }
    };
    const urlMurid = `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(chartMuridConfig))}&w=500&h=280`;

    // Fetch dan gabungkan asset visual chart ke berkas Excel
    try {
      const [resGuru, resMurid] = await Promise.all([fetch(urlGuru), fetch(urlMurid)]);
      const [blobG, blobM] = await Promise.all([resGuru.blob(), resMurid.blob()]);
      const [bufG, bufM] = await Promise.all([blobG.arrayBuffer(), blobM.arrayBuffer()]);

      const imgG = workbook.addImage({ buffer: bufG, extension: "png" });
      sheetGuru.addImage(imgG, { tl: { col: 10, row: 1 }, ext: { width: 500, height: 280 } });

      const imgM = workbook.addImage({ buffer: bufM, extension: "png" });
      sheetMurid.addImage(imgM, { tl: { col: 8, row: 1 }, ext: { width: 500, height: 280 } });
    } catch (e) {
      console.error("Gagal menyisipkan grafik otomatis:", e);
    }

    // Trigger download file berkas final
    const buffer = await workbook.xlsx.writeBuffer();
    const fileBlob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const fileUrl = URL.createObjectURL(fileBlob);
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = `Laporan_Presensi_SIMS_${namaSekolah.replace(/\s+/g, "_")}.xlsx`;
    link.click();
    URL.revokeObjectURL(fileUrl);
  };

  return (
    <div className="space-y-6">
      {/* HEADER BANNER */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-white p-6 lg:p-8 rounded-[2rem] border-4 border-slate-900 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] gap-4">
        <div>
          <h2 className="text-2xl lg:text-3xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
            <span>📅</span> Monitoring Kehadiran & Presensi
          </h2>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">
            Satu pintu rekapitulasi riil tingkat kehadiran pendidik dan peserta didik di <span className="text-indigo-600">{namaSekolah}</span>
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
            onClick={exportKehadiranToExcelWithChart}
            className="flex items-center justify-center gap-2 bg-emerald-400 hover:bg-emerald-500 text-slate-950 font-black text-xs uppercase tracking-widest px-5 py-3.5 rounded-2xl border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] active:translate-y-0.5 active:shadow-none transition-all w-full sm:w-auto"
          >
            <Download size={14} /> Export Semua (2 Sheet + Grafik)
          </button>
        </div>
      </div>

      {/* --- LOCAL TABS NAVIGATION --- */}
      <div className="flex border-4 border-slate-900 bg-slate-100 p-2 rounded-2xl shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] max-w-xl">
        <button
          onClick={() => setActiveTab("guru")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 font-black text-xs uppercase tracking-wider rounded-xl transition-all ${
            activeTab === "guru"
              ? "bg-slate-900 text-white shadow-inner border-2 border-slate-900"
              : "text-slate-600 hover:bg-slate-200"
          }`}
        >
          <Users size={14} /> Presensi Guru
        </button>
        <button
          onClick={() => setActiveTab("murid")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 font-black text-xs uppercase tracking-wider rounded-xl transition-all ${
            activeTab === "murid"
              ? "bg-slate-900 text-white shadow-inner border-2 border-slate-900"
              : "text-slate-600 hover:bg-slate-200"
          }`}
        >
          <GraduationCap size={14} /> Presensi Murid
        </button>
      </div>

      {/* --- DATA TABLE VIEWS --- */}
      {activeTab === "guru" ? (
        <div className="bg-white p-6 rounded-[2.5rem] border-4 border-slate-900 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] overflow-x-auto animate-in fade-in duration-200">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b-4 border-slate-900 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                <th className="pb-3">Nama Lengkap Guru</th>
                <th className="pb-3 text-center">Status</th>
                <th className="pb-3 text-center">Hadir</th>
                <th className="pb-3 text-center">Izin</th>
                <th className="pb-3 text-center">Sakit</th>
                <th className="pb-3 text-center">Alfa</th>
                <th className="pb-3 text-right">Rasio Kehadiran</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-bold text-xs">
              {dataHadirGuru.map((guru, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <span className="text-slate-900 font-black uppercase text-[13px]">{guru.nama}</span>
                      <span className="bg-slate-100 text-slate-600 font-mono text-[10px] px-2 py-0.5 rounded border border-slate-300 w-fit">
                        NIP: {guru.nip}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 text-center">
                    <span className={`px-2 py-0.5 rounded border-2 font-mono text-[9px] uppercase ${
                      guru.pns === "PNS" ? "bg-amber-100 text-amber-800 border-amber-200" : "bg-purple-100 text-purple-800 border-purple-200"
                    }`}>{guru.pns}</span>
                  </td>
                  <td className="py-4 text-center text-emerald-600 font-mono font-black">{guru.hadir} Hari</td>
                  <td className="py-4 text-center text-amber-500 font-mono">{guru.izin}</td>
                  <td className="py-4 text-center text-blue-500 font-mono">{guru.sakit}</td>
                  <td className="py-4 text-center text-rose-500 font-mono">{guru.alfa}</td>
                  <td className="py-4 text-right font-black font-mono text-indigo-600 text-sm">{guru.persen}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-[2.5rem] border-4 border-slate-900 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] overflow-x-auto animate-in fade-in duration-200">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b-4 border-slate-900 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                <th className="pb-3">Tingkat Kelas Pararel</th>
                <th className="pb-3 text-center">Daya Tampung Siswa</th>
                <th className="pb-3 text-center">Rerata Hadir (%)</th>
                <th className="pb-3 text-center">Izin (%)</th>
                <th className="pb-3 text-center">Sakit (%)</th>
                <th className="pb-3 text-center">Alfa (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-bold text-xs">
              {dataHadirMurid.map((murid, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-4 text-slate-900 font-black uppercase">{murid.kelas}</td>
                  <td className="py-4 text-center text-slate-600 font-mono">{murid.totalSiswa} Siswa</td>
                  <td className="py-4 text-center text-emerald-600 font-black font-mono">{murid.hadir}%</td>
                  <td className="py-4 text-center text-amber-500 font-mono">{murid.izin}%</td>
                  <td className="py-4 text-center text-blue-500 font-mono">{murid.sakit}%</td>
                  <td className="py-4 text-center text-rose-500 font-black font-mono">{murid.alfa}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}