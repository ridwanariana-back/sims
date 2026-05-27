// components/ClientRiwayatManager.tsx
"use client";

import { useState } from "react";
import { getDetailNilaiMurid } from "@/lib/actions";
import { Calendar, Heart, Search, Users, Eye, X, ChevronLeft, ChevronRight, SlidersHorizontal } from "lucide-react";

interface ClientRiwayatProps {
  initialRiwayat: any[];
  daftarMapel: string[];
  sekolahId: number;
}

export default function ClientRiwayatManager({ initialRiwayat, daftarMapel, sekolahId }: ClientRiwayatProps) {
  const [searchTerm, setSearchTerm] = useState(""); 
  const [selectedMurid, setSelectedMurid] = useState<any>(null);
  const [detailNilai, setDetailNilai] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingNilai, setLoadingNilai] = useState(false);

  // 💡 STATE BARU: PAGINATION & LIMIT
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10); // Default limit 10 baris

  // LOGIKA SEARCH
  const filteredRiwayat = initialRiwayat.filter((item) => {
    const searchStr = searchTerm.toLowerCase();
    return (
      item.nama?.toLowerCase().includes(searchStr) ||
      item.nisn?.toString().includes(searchStr)
    );
  });

  // 💡 LOGIKA PAGINATION HITUNGAN CLIENT-SIDE
  const totalItems = filteredRiwayat.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  // Memotong data riwayat yang tampil sesuai halaman aktif
  const currentRiwayatPageList = filteredRiwayat.slice(indexOfFirstItem, indexOfLastItem);

  // Reset page ke halaman 1 sewaktu user mengetik pencarian baru
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleShowNilai = async (item: any) => {
    setSelectedMurid(item);
    setLoadingNilai(true);
    setIsModalOpen(true);

    try {
      const dataNilaiRaw = await getDetailNilaiMurid(Number(item.murid_id), sekolahId);
      
      const fullMapelList = daftarMapel.map(mapelName => {
        const dataGanjil = dataNilaiRaw.find(
          (n: any) => (n.mapel?.toLowerCase() === mapelName.toLowerCase() || n.nama_mapel?.toLowerCase() === mapelName.toLowerCase()) && n.semester === 'Ganjil'
        );
        const dataGenap = dataNilaiRaw.find(
          (n: any) => (n.mapel?.toLowerCase() === mapelName.toLowerCase() || n.nama_mapel?.toLowerCase() === mapelName.toLowerCase()) && n.semester === 'Genap'
        );
        return {
          mapel: mapelName,
          ganjil: dataGanjil ? dataGanjil.nilai_angka : '-',
          genap: dataGenap ? dataGenap.nilai_angka : '-'
        };
      });
      setDetailNilai(fullMapelList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingNilai(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* INPUT SEARCH & HEADER (RESPONSIF MOBILE) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-slate-800 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-slate-100 flex-shrink-0">
            <span className="text-2xl">⏳</span>
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none">Riwayat Perwalian</h1>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] md:text-xs mt-2 italic">Daftar siswa yang pernah dibimbing</p>
          </div>
        </div>

        <div className="relative group w-full md:w-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Cari Nama atau NISN..." 
            value={searchTerm}
            onChange={handleSearchChange}
            className="pl-12 pr-6 py-4 bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl w-full md:w-80 outline-none font-bold text-sm transition-all"
          />
        </div>
      </div>

      {/* STATS & LIMIT SELECTOR CONTROLLER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-4">
        <div className="bg-white border border-slate-200 px-6 py-3 rounded-2xl flex items-center gap-3 shadow-sm">
          <Users size={16} className="text-indigo-600" />
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Ditemukan:</span>
          <span className="text-sm font-black text-slate-900">{filteredRiwayat.length} Siswa</span>
        </div>

        {/* 💡 INPUT LIMIT BARIS DATA */}
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-2xl px-4 py-2.5 shadow-sm">
          <SlidersHorizontal size={14} className="text-slate-400" />
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Tampilkan:</span>
          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="bg-transparent text-xs font-black text-slate-700 outline-none cursor-pointer"
          >
            <option value={5}>5 Baris</option>
            <option value={10}>10 Baris</option>
            <option value={25}>25 Baris</option>
            <option value={50}>50 Baris</option>
          </select>
        </div>
      </div>

      {/* TABLE WORK WRAPPER FOR MOBILE RESPONSIVE */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
        {/* 💡 WRAPPER UTAMA: Mengizinkan tabel untuk di-swipe kiri-kanan pada layar kecil */}
        <div className="w-full overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200">
          <table className="w-full text-left border-collapse min-w-[850px]">
            <thead>
              <tr className="bg-white border-b border-slate-100">
                <th className="px-6 py-7 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center w-12">No</th>
                <th className="px-8 py-7 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Siswa</th>
                <th className="px-8 py-7 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Identitas Lengkap</th>
                <th className="px-8 py-7 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Periode Perwalian</th>
                <th className="px-8 py-7 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {currentRiwayatPageList.length > 0 ? (
                currentRiwayatPageList.map((item, idx) => {
                  // Sinkronisasi nomor absen kumulatif halaman
                  const globalIndex = indexOfFirstItem + idx + 1;

                  return (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-6 text-xs font-bold text-slate-300 text-center">{globalIndex}</td>
                      <td className="px-8 py-6">
                        <p className="text-base font-black text-slate-900 uppercase leading-none">{item.nama}</p>
                        <div className="flex gap-2 mt-3">
                          <span className={`text-[9px] font-black px-3 py-1 rounded-lg uppercase ${
                            item.gender?.toUpperCase() === 'PEREMPUAN' ? 'bg-pink-100 text-pink-600' : 'bg-blue-100 text-blue-600'
                          }`}>
                            {item.gender}
                          </span>
                        </div>
                      </td>

                      <td className="px-8 py-6">
                        <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase">
                            <div className="w-5 h-5 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500 text-[9px]">🆔</div>
                            NISN: {item.nisn}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase">
                            <div className="w-5 h-5 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 text-[9px]">📑</div>
                            NIK: {item.nik || '-'}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase">
                            <Calendar size={14} className="text-slate-400" />
                            Lahir: {item.tanggal_lahir ? new Date(item.tanggal_lahir).toLocaleDateString('id-ID') : '-'}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase">
                            <Heart size={14} className="text-rose-400" />
                            Ibu: {item.nama_ibu || '-'}
                          </div>
                        </div>
                      </td>

                      <td className="px-8 py-6">
                        <div className="bg-slate-900 text-white p-4 rounded-2xl inline-block min-w-[140px] shadow-lg shadow-slate-200">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Rombel {item.rombel_lama}</p>
                          <p className="text-sm font-black mt-1 leading-none">{item.tahun_ajaran}</p>
                        </div>
                      </td>

                      <td className="px-8 py-6 text-center">
                        <button 
                          onClick={() => handleShowNilai(item)}
                          className="p-3.5 bg-white hover:bg-slate-900 text-slate-300 hover:text-white rounded-2xl transition-all border border-slate-100 hover:border-slate-900 shadow-sm"
                        >
                          <Eye size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-3 opacity-20">
                      <Search size={48} />
                      <p className="font-black uppercase tracking-[0.3em] text-xs">Data tidak ditemukan</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 💡 PAGINATION CONTROLLER FOOTER INTERFACE */}
        {totalPages > 1 && (
          <div className="bg-slate-50/50 px-8 py-4 flex flex-col sm:flex-row gap-4 items-center justify-between border-t border-slate-100">
            <p className="text-[10px] font-black uppercase text-slate-400">
              Showing <span className="text-slate-800">{indexOfFirstItem + 1}</span> to{" "}
              <span className="text-slate-800">{Math.min(indexOfLastItem, totalItems)}</span> of{" "}
              <span className="text-slate-800">{totalItems}</span> Riwayat Murid
            </p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 border border-slate-200 bg-white rounded-xl text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-all"
              >
                <ChevronLeft size={16} />
              </button>
              
              <div className="flex items-center gap-1">
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-8 h-8 rounded-xl text-xs font-black transition-all ${
                      currentPage === i + 1
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-100"
                        : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2 border border-slate-200 bg-white rounded-xl text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-all"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL LAPORAN NILAI */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 text-left">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">{selectedMurid?.nama}</h2>
                <p className="text-[10px] font-black text-slate-400 uppercase mt-2 tracking-widest">Arsip Nilai - {selectedMurid?.tahun_ajaran}</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-rose-50 text-slate-300 hover:text-rose-500 rounded-2xl transition-colors">
                <X size={28} />
              </button>
            </div>
            <div className="p-8 max-h-[50vh] overflow-y-auto">
              {loadingNilai ? (
                <div className="text-center py-12 text-sm font-bold text-slate-400 animate-pulse uppercase">
                  Memuat Detail Nilai Siswa...
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                      <th className="py-4 text-left">Mata Pelajaran</th>
                      <th className="py-4 text-center w-24">Ganjil</th>
                      <th className="py-4 text-center w-24">Genap</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {detailNilai.map((n, idx) => (
                      <tr key={idx}>
                        <td className="py-4 text-[11px] font-black text-slate-700 uppercase tracking-tight">{n.mapel}</td>
                        <td className="py-4 text-center font-black text-indigo-600 text-xs">{n.ganjil}</td>
                        <td className="py-4 text-center font-black text-indigo-600 text-xs">{n.genap}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="p-8 bg-slate-50/50 text-right">
              <button onClick={() => setIsModalOpen(false)} className="bg-indigo-600 text-white px-10 py-4 rounded-2xl text-[10px] font-black uppercase hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">Tutup Arsip</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}