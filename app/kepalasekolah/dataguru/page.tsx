// app/kepalasekolah/dataguru/page.tsx
"use client";

import { useState } from "react";
import ExcelJS from "exceljs";
import Link from "next/link";
import { ArrowLeft, Download } from "lucide-react";

export default function DetailGuruPage() {
  // Mock Data Guru riil (Nanti tinggal kamu sambungkan ke query Neon DB)
  const [dataGuru] = useState([
    { nip: "19870112009011002", nama: "Siti Aminah, S.Pd", status: "PNS", jamMengajar: 24, mapel: "Matematika" },
    { nip: "19920523201503200", nama: "Hendra, S.Kom", status: "PNS", jamMengajar: 28, mapel: "Informatika" },
    { nip: "-", nama: "Supardi, M.Pd", status: "HONORER", jamMengajar: 18, mapel: "Bahasa Indonesia" },
    { nip: "19850809201001100", nama: "Bambang, M.Si", status: "PNS", jamMengajar: 22, mapel: "Fisika" },
    { nip: "-", nama: "Rinaawati, S.E", status: "HONORER", jamMengajar: 12, mapel: "Ekonomi" },
  ]);

  const exportToExcelWithChart = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Laporan Beban Mengajar Guru");

    // 1. Setup Kolom Tabel Utama
    worksheet.columns = [
      { header: "NIP", key: "nip", width: 25 },
      { header: "Nama Guru", key: "nama", width: 30 },
      { header: "Status Kepegawaian", key: "status", width: 20 },
      { header: "Beban Mengajar (JP)", key: "jamMengajar", width: 22 },
      { header: "Mata Pelajaran", key: "mapel", width: 25 },
    ];

    // Styling Header biar rapi (Bold & Background Slate)
    worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFF" } };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "0F172A" }, // Warna Slate 900 tema Neo-Brutalisme kita
    };

    // 2. Masukkan Data Riil ke baris Excel
    dataGuru.forEach((guru) => {
      worksheet.addRow(guru);
    });

    // 3. SEKTOR GRAFIK: Mengubah Grafik HTML menjadi Gambar untuk Disuntik ke Excel
    // Kita memanfaatkan QuickChart API (Gratis, Open Source, tanpa registrasi token)
    // untuk membentuk grafik batang (Bar Chart) total jam mengajar guru secara instan.
    const chartConfig = {
      type: "bar",
      data: {
        labels: dataGuru.map((g) => g.nama.split(",")[0]), // Potong nama depan saja biar gak kepanjangan
        datasets: [{
          label: "Total Jam Mengajar (JP)",
          data: dataGuru.map((g) => g.jamMengajar),
          backgroundColor: "#3b82f6",
          borderColor: "#1d4ed8",
          borderWidth: 2
        }]
      },
      options: {
        title: { display: true, text: "GRAFIK BEBAN MENGAJAR GURU (JP)" }
      }
    };

    const chartUrl = `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(chartConfig))}&w=500&h=300`;

    try {
      // Ambil gambar grafik dari generator API
      const response = await fetch(chartUrl);
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();

      // Masukkan gambar grafik ke dalam file Excel
      const imageId = workbook.addImage({
        buffer: arrayBuffer,
        extension: "png",
      });

      // Letakkan grafik di samping tabel (Mulai dari Kolom G, Baris ke-2)
      worksheet.addImage(imageId, {
        tl: { col: 6, row: 1 },
        ext: { width: 500, height: 300 }
      });

    } catch (error) {
      console.error("Gagal menyisipkan grafik ke Excel:", error);
    }

    // 4. Proses Trigger Unduhan File Excel di Browser
    const buffer = await workbook.xlsx.writeBuffer();
    const fileBlob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const fileUrl = URL.createObjectURL(fileBlob);
    
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = `Laporan_Guru_SIMS_${new Date().getFullYear()}.xlsx`;
    link.click();
    URL.revokeObjectURL(fileUrl);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl border-2 border-slate-200">
        <div>
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Management Data Guru</h2>
          <p className="text-xs font-bold text-slate-400 uppercase">Daftar beban fungsional mengajar pendidik SMAN 1 Pemulutan Selatan</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                  <Link 
                    href="/kepalasekolah"
                    className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-900 font-black text-xs uppercase tracking-widest px-5 py-3.5 rounded-2xl border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] active:translate-y-1 active:shadow-none transition-all w-full sm:w-auto"
                  >
                    <ArrowLeft size={16} /> Kembali ke Dashboard
                  </Link>
        
                  <button 
                    onClick={exportToExcelWithChart}
                    className="flex items-center justify-center gap-2 bg-emerald-400 hover:bg-emerald-500 text-slate-950 font-black text-xs uppercase tracking-widest px-5 py-3.5 rounded-2xl border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] active:translate-y-1 active:shadow-none transition-all w-full sm:w-auto"
                  >
                    <Download size={16} /> Export Excel + Grafik
                  </button>
                </div>
      </div>

      {/* Preview Tabel di Halaman Web */}
      <div className="bg-white p-6 rounded-[2.5rem] border-2 border-slate-200 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b-2 border-slate-900 text-[10px] font-black text-slate-400 uppercase tracking-wider">
              <th className="pb-3">Nama</th>
              <th className="pb-3">NIP</th>
              <th className="pb-3">Mapel</th>
              <th className="pb-3 text-center">Beban Mengajar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-bold text-xs">
            {dataGuru.map((guru, idx) => (
              <tr key={idx}>
                <td className="py-3.5 text-slate-900 font-black uppercase">{guru.nama}</td>
                <td className="py-3.5 text-slate-500 font-mono">{guru.nip}</td>
                <td className="py-3.5 text-indigo-600 uppercase">{guru.mapel}</td>
                <td className="py-3.5 text-center font-mono text-slate-900">{guru.jamMengajar} JP</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}