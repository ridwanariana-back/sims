"use client";

import { useState } from "react";
import ExcelJS from "exceljs";
import Link from "next/link";
import { ArrowLeft, Clock, Search, ChevronLeft, ChevronRight, User, Download } from "lucide-react";

interface JadwalItem {
  rombel: string;
  mapel: string;
  jam_mulai: string;
  jam_selesai: string;
  hari: string;
}

interface GuruJadwal {
  id: number;
  nama: string;
  nip: string;
  status: string;
  mapel_utama: string;
  total_jam_minggu: number;
  list_jadwal: JadwalItem[];
}

interface MonitoringJadwalClientProps {
  initialJadwalGuru: GuruJadwal[];
  namaSekolah: string;
  userSession: any;
}

export default function MonitoringJadwalClient({ initialJadwalGuru, namaSekolah, userSession }: MonitoringJadwalClientProps) {
  const [dataJadwal] = useState<GuruJadwal[]>(initialJadwalGuru);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5; // Batasan maksimal 5 kartu guru per halaman

  // == JALUR KEMBALI DINAMIS ==
  const userRole = userSession?.user?.role?.toLowerCase() || "guru";
  let backPath = userRole === "kepalasekolah" ? "/kepalasekolah" : "/";

  // Filter pencarian data di sisi client
  const filteredData = dataJadwal.filter((guru) =>
    guru.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
    guru.nip.includes(searchQuery) ||
    guru.mapel_utama.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // == KALKULASI PAGINATION GURU JADWAL ==
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (pageNumber: number) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  // == ENGINE EXPORT EXCELJS + GRAFIK BATANG BEBAN KERJA GURU 📊 ==
  const exportToExcelJadwalDenganGrafik = async () => {
    if (filteredData.length === 0) return alert("Tidak ada data untuk di-export!");

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Laporan Beban Mengajar");

    worksheet.columns = [
      { header: "NIP", key: "nip", width: 25 },
      { header: "Nama Lengkap Pendidik", key: "nama", width: 35 },
      { header: "Status Kepegawaian", key: "status", width: 25 },
      { header: "Mata Pelajaran Utama", key: "mapel_utama", width: 30 },
      { header: "Beban Kerja (JP)", key: "total_jam_minggu", width: 20 },
    ];

    worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFF" }, name: "Arial", size: 11 };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "0F172A" },
    };
    worksheet.getRow(1).alignment = { vertical: "middle", horizontal: "center" };

    filteredData.forEach((guru) => {
      worksheet.addRow({
        nip: guru.nip,
        nama: guru.nama,
        status: guru.status,
        mapel_utama: guru.mapel_utama,
        total_jam_minggu: guru.total_jam_minggu,
      });
    });

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        row.getCell("total_jam_minggu").alignment = { horizontal: "center" };
        row.eachCell((cell) => {
          cell.border = {
            top: { style: "thin", color: { argb: "E2E8F0" } },
            bottom: { style: "thin", color: { argb: "E2E8F0" } },
          };
        });
      }
    });

    // 4. GENERATE GAMBAR GRAFIK BATANG VIA PROXY API LOKAL (ANTI-CORS) 🚀
    const namaGuruList = filteredData.map(g => g.nama.substring(0, 15)); 
    const jpList = filteredData.map(g => g.total_jam_minggu);

    const chartConfig = {
      type: "bar",
      data: {
        labels: namaGuruList,
        datasets: [{
          label: "Jumlah Jam Pelajaran (JP) Mingguan",
          data: jpList,
          backgroundColor: "rgba(99, 102, 241, 0.7)", 
          borderColor: "rgba(15, 23, 42, 1)",
          borderWidth: 2
        }]
      },
      options: {
        title: {
          display: true,
          text: `GRAFIK ANALISIS DISTRIBUSI JP - ${namaSekolah.toUpperCase()}`,
          fontColor: "#0F172A",
          fontSize: 14,
          fontStyle: "bold"
        },
        scales: {
          yAxes: [{
            ticks: {
              beginAtZero: true,
              stepSize: 5
            }
          }]
        }
      }
    };

    // 💡 UBAH DISINI: Arahkan fetch ke API Proxy lokal buatan kita
    const proxyUrl = `/api/chart-proxy?c=${encodeURIComponent(JSON.stringify(chartConfig))}`;

    try {
      // Fetch ke proxy lokal tidak akan memicu CORS Error!
      const response = await fetch(proxyUrl);
      if (!response.ok) throw new Error("Gagal mengambil gambar dari proxy server");
      
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();

      // Masukkan gambar grafik ke dalam workbook ExcelJS
      const imageId = workbook.addImage({
        buffer: arrayBuffer,
        extension: "png",
      });

      // Letakkan grafik di sebelah kanan tabel (Kolom G Baris ke-2)
      worksheet.addImage(imageId, {
        tl: { col: 6, row: 1 },
        ext: { width: 600, height: 350 }
      });

    } catch (err) {
      console.error("Gagal menyisipkan grafik ke Excel:", err);
      alert("Grafik gagal dimuat ke Excel karena kendala jaringan, namun file laporan Excel tetap akan diunduh.");
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const fileBlob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const fileUrl = URL.createObjectURL(fileBlob);
    
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = `Laporan_Jadwal_Plus_Grafik_${namaSekolah.replace(/\s+/g, "_")}.xlsx`;
    link.click();
    URL.revokeObjectURL(fileUrl);
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER BANNER UTAMA */}
      <div className="bg-white p-6 lg:p-8 rounded-[2rem] border-4 border-slate-900 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-2xl lg:text-3xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
            <span>📅</span> Monitoring Jadwal Pelajaran
          </h2>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">
            Peninjauan fungsional & distribusi beban mengajar mingguan di <span className="text-indigo-600">{namaSekolah}</span>
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
            onClick={exportToExcelJadwalDenganGrafik}
            className="flex items-center justify-center gap-2 bg-emerald-400 hover:bg-emerald-500 text-slate-950 font-black text-xs uppercase tracking-widest px-5 py-3.5 rounded-2xl border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] active:translate-y-0.5 active:shadow-none transition-all w-full sm:w-auto"
          >
            <Download size={14} /> Export Laporan + Grafik
          </button>
        </div>
      </div>

      {/* FILTER SEARCH BAR NEO-BRUTALISME */}
      <div className="bg-white p-4 rounded-2xl border-4 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] flex items-center gap-3 max-w-md">
        <Search className="text-slate-400 shrink-0" size={18} />
        <input 
          type="text" 
          placeholder="CARI NAMA GURU, NIP, ATAU MAPEL..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1); // Otomatis balik ke halaman 1 saat mengetik kata kunci baru
          }}
          className="w-full text-xs font-black uppercase text-slate-900 placeholder-slate-400 outline-none tracking-tight"
        />
      </div>

      {/* ITERASI GRID KARTU MONITORING JADWAL (Hanya merender currentItems hasil pagination) */}
      <div className="space-y-6">
        {currentItems.map((guru) => (
          <div key={guru.id} className="bg-white rounded-[2.5rem] border-4 border-slate-900 overflow-hidden shadow-[6px_6px_0px_0px_rgba(15,23,42,1)]">
            
            {/* Bagian Atas Kartu */}
            <div className="p-5 bg-slate-900 text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b-4 border-slate-900">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-500 rounded-xl border-2 border-white text-slate-950 shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
                  <User size={18} className="text-white" />
                </div>
                <div>
                  <h3 className="font-black uppercase text-sm tracking-tight">
                    {guru.nama} <span className="text-slate-400 font-mono text-xs">(NIP: {guru.nip})</span>
                  </h3>
                  <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-wide mt-0.5">
                    Mapel Utama: {guru.mapel_utama}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-slate-800 px-4 py-2 border-2 border-slate-700 rounded-xl">
                <span className="text-xs font-black text-amber-400 font-mono">{guru.total_jam_minggu} JP</span>
                <span className="text-[9px] uppercase font-black text-slate-300 tracking-wider">Total Beban</span>
              </div>
            </div>

            {/* Bagian Bawah Kartu: Pembagian Mengajar 5 Hari Kerja */}
            <div className="p-5 bg-slate-50/60">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'].map((hari) => (
                  <div key={hari} className="bg-white p-3.5 rounded-2xl border-2 border-slate-900 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] min-h-[140px] flex flex-col">
                    <span className="text-[10px] font-black text-slate-900 bg-amber-300 px-2 py-0.5 rounded border border-slate-900 uppercase tracking-wider block text-center mb-3">
                      {hari}
                    </span>
                    
                    <div className="space-y-2 flex-1">
                      {guru.list_jadwal?.filter((j) => j.hari === hari).map((item, idx) => (
                        <div key={idx} className="p-2 bg-indigo-50 border border-indigo-200 rounded-xl text-left">
                          <div className="text-[10px] font-black text-indigo-900 uppercase leading-none">{item.rombel}</div>
                          <div className="text-[8px] font-black text-indigo-500 uppercase mt-1 tracking-tight truncate">{item.mapel}</div>
                          <div className="text-[8px] font-black text-slate-400 mt-2 flex items-center gap-1 border-t border-indigo-100/60 pt-1.5">
                            <Clock size={9} />
                            <span className="font-mono">{item.jam_mulai.substring(0, 5)} - {item.jam_selesai.substring(0, 5)}</span>
                          </div>
                        </div>
                      ))}
                      
                      {!guru.list_jadwal?.some((j) => j.hari === hari) && (
                        <div className="h-full flex items-center justify-center text-[9px] font-black text-slate-300 uppercase tracking-widest pt-4 italic">
                          Kosong
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        ))}

        {/* Empty State */}
        {filteredData.length === 0 && (
          <div className="p-16 text-center bg-white rounded-[2.5rem] border-4 border-dashed border-slate-200">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
              ❌ Data Jadwal Guru tidak ditemukan.
            </p>
          </div>
        )}
      </div>

      {/* == TAMPILAN KONTROL PAGINATION NEO-BRUTALISME == */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-8 pt-4 border-t-4 border-slate-900">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
            Menampilkan {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredData.length)} Dari {filteredData.length} Guru
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 rounded-xl border-2 border-slate-900 bg-white hover:bg-slate-100 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] active:translate-y-0.5 active:shadow-none disabled:opacity-40 disabled:hover:bg-white disabled:active:translate-y-0"
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
                      ? "bg-indigo-500 text-white translate-y-0.5 shadow-none"
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
              className="p-2 rounded-xl border-2 border-slate-900 bg-white hover:bg-slate-100 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] active:translate-y-0.5 active:shadow-none disabled:opacity-40 disabled:hover:bg-white disabled:active:translate-y-0"
            >
              <ChevronRight size={16} className="text-slate-900" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}