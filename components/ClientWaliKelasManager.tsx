// components/ClientWaliKelasManager.tsx
"use client";

import { useState } from "react";
import { Calendar, Heart, Eye, ArrowUpCircle, X, Search, ChevronLeft, ChevronRight, SlidersHorizontal } from "lucide-react";
import { getDetailNilaiMurid, prosesNaikKelas, getRombelTujuanDinamis } from "@/lib/actions";

interface ClientWaliKelasProps {
  initialMuridList: any[];
  daftarMapelDinamis: string[];
  sekolahId: number;
  guruId: number;
  rombelWali: string;
}

export default function ClientWaliKelasManager({
  initialMuridList,
  daftarMapelDinamis,
  sekolahId,
  guruId,
  rombelWali
}: ClientWaliKelasProps) {
  const [muridList, setMuridList] = useState<any[]>(initialMuridList);
  const [selectedMurid, setSelectedMurid] = useState<any>(null);
  const [detailNilai, setDetailNilai] = useState<any[]>([]);
  
  // State untuk Modal Lihat Nilai
  const [isModalOpen, setIsModalOpen] = useState(false);

  // State untuk Modal Naik Kelas
  const [isNaikKelasModalOpen, setIsNaikKelasModalOpen] = useState(false);
  const [muridTargetNaik, setMuridTargetNaik] = useState<any>(null);
  const [rombelTujuan, setRombelTujuan] = useState("");
  const [rombelTujuanTersedia, setRombelTujuanTersedia] = useState<string[]>([]);
  const [loadingRombel, setLoadingRombel] = useState(false);

  // 💡 STATE BARU: SEARCH & PAGINATION
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10); // Default limit 10 per page

  // 1. FILTER SEARCH (Berdasarkan Nama atau NISN)
  const filteredMurid = muridList.filter((murid) => {
    const term = searchQuery.toLowerCase();
    return (
      murid.nama?.toLowerCase().includes(term) ||
      murid.nisn?.toString().includes(term)
    );
  });

  // 2. HITUNG PAGINATION
  const totalItems = filteredMurid.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  
  // Ambil slice data murid sesuai page aktif
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentMuridPageList = filteredMurid.slice(indexOfFirstItem, indexOfLastItem);

  // Reset page ke 1 kalau user ngetik search query baru
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  // Fungsi memetakan rapor nilai siswa
  const handleShowNilai = async (murid: any) => {
    setSelectedMurid(murid);
    const dataNilaiRaw = await getDetailNilaiMurid(murid.id, sekolahId);
    
    const fullMapelList = daftarMapelDinamis.map(mapelName => {
      const dataGanjil = dataNilaiRaw.find(
        (n: any) => (n.nama_mapel?.toLowerCase().trim() === mapelName.toLowerCase().trim()) && n.semester === 'Ganjil'
      );
      const dataGenap = dataNilaiRaw.find(
        (n: any) => (n.nama_mapel?.toLowerCase().trim() === mapelName.toLowerCase().trim()) && n.semester === 'Genap'
      );
      
      return {
        mapel: mapelName,
        ganjil: dataGanjil ? dataGanjil.nilai_angka : '-',
        genap: dataGenap ? dataGenap.nilai_angka : '-'
      };
    });
    
    setDetailNilai(fullMapelList);
    setIsModalOpen(true);
  };

  // PEMICU NAIK KELAS
  const pemicuNaikKelas = async (murid: any) => {
    setMuridTargetNaik(murid);
    setRombelTujuan(""); 
    setRombelTujuanTersedia([]);
    setLoadingRombel(true);
    setIsNaikKelasModalOpen(true);

    const kelasSekarang = Number(murid.kelas);

    if (!isNaN(kelasSekarang)) {
      const res = await getRombelTujuanDinamis(kelasSekarang, sekolahId);
      if (res.success) {
        setRombelTujuanTersedia(res.data);
      } else {
        alert("Gagal memuat daftar kelas tujuan dari database master.");
      }
    } else {
      alert("Data tingkat kelas murid tidak valid (harus berupa angka).");
    }
    loadingRombel && setLoadingRombel(false);
    setLoadingRombel(false);
  };

  // Eksekusi Server Action
  const eksekusiNaikKelas = async () => {
    if (!rombelTujuan) {
      alert("Silakan pilih rombel tujuan terlebih dahulu!");
      return;
    }

    const res = await prosesNaikKelas(muridTargetNaik, guruId, sekolahId, rombelTujuan);
    if (res.success) {
      alert(`Berhasil! ${muridTargetNaik.nama} dipindahkan ke rombel ${rombelTujuan}`);
      setMuridList(prev => prev.filter(m => m.id !== muridTargetNaik.id));
      setIsNaikKelasModalOpen(false);
    } else {
      alert("Gagal memproses kenaikan kelas murid. Coba lagi.");
    }
  };

  return (
    <div className="space-y-6">
      
      {/* 💡 CONTROL PANELBAR: SEARCH & LIMIT PER PAGE (RESPONSIF MOBILE) */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-5 rounded-[2rem] border border-slate-200 shadow-sm">
        {/* Kolom Search */}
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Cari Nama Murid atau NISN..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full bg-slate-50 border-2 border-slate-100 focus:border-indigo-500 rounded-2xl py-3 pl-12 pr-4 font-bold text-xs outline-none transition-all placeholder:text-slate-400"
          />
        </div>

        {/* Kolom Limit Per Page */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2">
            <SlidersHorizontal size={14} className="text-slate-400" />
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Limit:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-transparent text-xs font-black text-slate-700 outline-none cursor-pointer"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>
      </div>

      {/* 💡 TABLE DATA MURID (Diberikan wrapper overflow-x-auto agar responsif smartphone) */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm text-left overflow-hidden">
        <div className="w-full overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-white border-b border-slate-100">
                <th className="px-6 py-7 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center w-16">No</th>
                <th className="px-6 py-7 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Identitas Utama</th>
                <th className="px-6 py-7 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Detail Administrasi</th>
                <th className="px-6 py-7 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Status Nilai</th>
                <th className="px-6 py-7 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {currentMuridPageList.length > 0 ? (
                currentMuridPageList.map((murid, index) => {
                  const siapNaik = Number(murid.jml_ganjil) > 0 && Number(murid.jml_genap) > 0;
                  // Kalkulasi No Absen Real agar sinkron saat page berpindah
                  const realIndex = indexOfFirstItem + index + 1;

                  return (
                    <tr key={murid.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-6 text-xs font-bold text-slate-300 text-center">{realIndex}</td>
                      <td className="px-6 py-6">
                        <p className="text-base font-black text-slate-900 uppercase leading-none">{murid.nama}</p>
                        <div className="flex gap-2 mt-2">
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase ${
                            murid.gender?.toUpperCase() === 'PEREMPUAN' ? 'bg-pink-100 text-pink-600' : 'bg-blue-100 text-blue-600'
                          }`}>
                            {murid.gender}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">NISN: {murid.nisn}</span>
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <div className="space-y-1.5 text-[10px] font-bold uppercase text-slate-500">
                          <div className="flex items-center gap-2"><Calendar size={12} className="text-indigo-400" /> Lahir: {murid.tanggal_lahir ? new Date(murid.tanggal_lahir).toLocaleDateString('id-ID') : '-'}</div>
                          <div className="flex items-center gap-2"><Heart size={12} className="text-rose-400" /> Ibu: {murid.nama_ibu || '-'}</div>
                          <p className="text-indigo-600 font-black">NIK: {murid.nik || '-'}</p>
                        </div>
                      </td>
                      <td className="px-6 py-6 text-center">
                        <div className="flex justify-center gap-3">
                          <BadgeNilai label="Ganjil" aktif={Number(murid.jml_ganjil) > 0} />
                          <BadgeNilai label="Genap" aktif={Number(murid.jml_genap) > 0} />
                        </div>
                      </td>
                      <td className="px-6 py-6 text-center">
                        <div className="flex flex-col gap-2 max-w-[160px] mx-auto">
                          <button onClick={() => handleShowNilai(murid)} className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-black text-white py-2.5 rounded-xl text-[10px] font-black uppercase transition-all">
                            <Eye size={14} /> Lihat Nilai
                          </button>
                          <button 
                            onClick={() => pemicuNaikKelas(murid)}
                            disabled={!siapNaik} 
                            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${
                              siapNaik ? 'bg-[#00A36C] hover:bg-emerald-700 text-white shadow-lg shadow-emerald-50' : 'bg-slate-100 text-slate-300 cursor-not-allowed'
                            }`}
                          >
                            <ArrowUpCircle size={14} /> Naik Kelas
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-400 font-bold uppercase text-xs">
                    {searchQuery ? "Tidak ditemukan murid yang cocok dengan kata kunci." : `Tidak ada murid aktif di Rombel ${rombelWali} saat ini.`}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 💡 PAGINATION CONTROLLER INTERFACE */}
        {totalPages > 1 && (
          <div className="bg-slate-50/50 px-6 py-4 flex items-center justify-between border-t border-slate-100">
            <p className="text-[10px] font-black uppercase text-slate-400">
              Showing <span className="text-slate-800">{indexOfFirstItem + 1}</span> to{" "}
              <span className="text-slate-800">{Math.min(indexOfLastItem, totalItems)}</span> of{" "}
              <span className="text-slate-800">{totalItems}</span> Murid
            </p>
            <div className="flex items-center gap-2">
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
                <p className="text-[10px] font-black text-slate-400 uppercase mt-2 tracking-widest">Laporan Hasil Belajar</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-rose-50 text-slate-300 hover:text-rose-500 rounded-2xl transition-colors">
                <X size={28} />
              </button>
            </div>
            <div className="p-8 max-h-[50vh] overflow-y-auto">
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
            </div>
            <div className="p-8 bg-slate-50/50 text-right">
              <button onClick={() => setIsModalOpen(false)} className="bg-indigo-600 text-white px-10 py-4 rounded-2xl text-[10px] font-black uppercase hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">Tutup</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PILIH ROMBEL TUJUAN */}
      {isNaikKelasModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 text-left animate-in fade-in zoom-in duration-150">
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">
              Tentukan Kelas Tujuan
            </h3>
            <p className="text-xs font-bold text-slate-400 uppercase mt-1">
              Murid: {muridTargetNaik?.nama} (Tingkat Sekarang: {muridTargetNaik?.kelas})
            </p>

            <div className="mt-6 space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Pilih Rombel / Tingkat Baru:
              </label>
              
              {loadingRombel ? (
                <div className="w-full bg-slate-50 text-slate-400 p-4 font-bold text-xs rounded-2xl animate-pulse uppercase border border-slate-200">
                  Sedang mencari data di master kelas...
                </div>
              ) : (
                <select
                  value={rombelTujuan}
                  onChange={(e) => setRombelTujuan(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-200 focus:border-indigo-500 rounded-2xl p-4 font-bold text-sm outline-none transition-all"
                >
                  <option value="">-- PILIH ROMBEL TUJUAN --</option>
                  
                  
                    <option value="LULUS">LULUS DARI SEKOLAH</option>
                  
                  
                  {rombelTujuanTersedia.map((rombelName) => (
                    <option key={rombelName} value={rombelName}>
                      Kelas {rombelName}
                    </option>
                  ))}
                </select>
              )}
              
              {!loadingRombel && rombelTujuanTersedia.length === 0 && (
                <p className="text-[10px] text-rose-500 font-black uppercase mt-1 leading-normal">
                  * Peringatan: Belum ada data Rombel aktif untuk tingkat {Number(muridTargetNaik?.kelas) + 1} di tabel master kelas sekolah ini!
                </p>
              )}
            </div>

            <div className="mt-8 flex gap-3">
              <button
                onClick={() => setIsNaikKelasModalOpen(false)}
                className="flex-1 py-3.5 border-2 border-slate-200 hover:bg-slate-50 rounded-xl text-[10px] font-black uppercase transition-all text-slate-500 text-center"
              >
                Batal
              </button>
              <button
                onClick={eksekusiNaikKelas}
                disabled={!rombelTujuan || loadingRombel}
                className={`flex-1 py-3.5 text-white rounded-xl text-[10px] font-black uppercase transition-all text-center ${
                  rombelTujuan && !loadingRombel 
                    ? 'bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-100' 
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                Proses Kenaikan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function BadgeNilai({ label, aktif }: { label: string, aktif: boolean }) {
  return (
    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase ${
      aktif ? 'bg-emerald-50 border-emerald-100 text-emerald-500 shadow-sm' : 'bg-rose-50 border-rose-100 text-rose-400 opacity-60'
    }`}>
      <div className={`w-1.5 h-1.5 rounded-full ${aktif ? 'bg-emerald-500 animate-pulse' : 'bg-rose-400'}`} /> {label}
    </div>
  );
}