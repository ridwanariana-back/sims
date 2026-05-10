"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { getRiwayatPerwalian, getDetailNilaiMurid } from "@/lib/actions";
import { History, Calendar, Heart, Search, Users, Eye, X } from "lucide-react";

const DAFTAR_MAPEL = [
  "PAI & BudiPekerti", "PKN", "Bahasa Indonesia", "Bahasa Inggris", 
  "Bahasa Inggris Tingkat Lanjut", "Matematika Wajib", "Matematika Tingkat Lanjut", 
  "Fisika", "Fisika Mapel Pilihan", "Biologi", "Biologi Mapel Pilihan", 
  "Kimia", "Kimia Mapel Pilihan", "Sejarah", "Sejarah Tingkat Lanjut", 
  "Geografi", "Geografi Mapel Pilihan", "Ekonomi", "Ekonomi Mapel Pilihan", 
  "Sosiologi", "Sosiologi Mapel Pilihan", "Seni Budaya", "Penjas Orkes", 
  "PKWU", "Informatika", "Bimbingan Konseling"
];

export default function RiwayatPerwalianPage() {
  const { data: session } = useSession();
  const [riwayat, setRiwayat] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState(""); // State untuk kata kunci pencarian

  const [selectedMurid, setSelectedMurid] = useState<any>(null);
  const [detailNilai, setDetailNilai] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (session?.user?.id) {
      getRiwayatPerwalian(Number(session.user.id)).then(setRiwayat);
    }
  }, [session]);

  // LOGIKA SEARCH: Filter data berdasarkan nama atau nisn
  const filteredRiwayat = riwayat.filter((item) => {
    const searchStr = searchTerm.toLowerCase();
    return (
      item.nama?.toLowerCase().includes(searchStr) ||
      item.nisn?.toString().includes(searchStr)
    );
  });

  const handleShowNilai = async (item: any) => {
    setSelectedMurid(item);
    const dataNilaiRaw = await getDetailNilaiMurid(item.murid_id);
    const fullMapelList = DAFTAR_MAPEL.map(mapelName => {
      const dataGanjil = dataNilaiRaw.find((n: any) => n.mapel === mapelName && n.semester === 'Ganjil');
      const dataGenap = dataNilaiRaw.find((n: any) => n.mapel === mapelName && n.semester === 'Genap');
      return {
        mapel: mapelName,
        ganjil: dataGanjil ? dataGanjil.nilai_angka : '-',
        genap: dataGenap ? dataGenap.nilai_angka : '-'
      };
    });
    setDetailNilai(fullMapelList);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 p-2">
      {/* HEADER */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-slate-800 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-slate-100">
            <History size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none">Riwayat Perwalian</h1>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-2 italic">Daftar siswa yang pernah dibimbing</p>
          </div>
        </div>
        
        {/* INPUT SEARCH AKTIF */}
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Cari Nama atau NISN..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 pr-6 py-4 bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl w-full md:w-80 outline-none font-bold text-sm transition-all"
          />
        </div>
      </div>

      {/* STATS */}
      <div className="flex items-center gap-4 px-4">
        <div className="bg-white border border-slate-200 px-6 py-3 rounded-2xl flex items-center gap-3 shadow-sm">
          <Users size={16} className="text-indigo-600" />
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Ditemukan:</span>
          <span className="text-sm font-black text-slate-900">{filteredRiwayat.length} Siswa</span>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white border-b border-slate-100">
              <th className="px-8 py-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Siswa</th>
              <th className="px-8 py-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Identitas Lengkap</th>
              <th className="px-8 py-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Periode Perwalian</th>
              <th className="px-8 py-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredRiwayat.map((item, idx) => ( // Pakai filteredRiwayat di sini
              <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
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
                      <div className="w-5 h-5 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500">🆔</div>
                      NISN: {item.nisn}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase">
                      <div className="w-5 h-5 rounded-full bg-rose-50 flex items-center justify-center text-rose-500">📑</div>
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
                    className="p-4 bg-white hover:bg-slate-900 text-slate-300 hover:text-white rounded-2xl transition-all border border-slate-100 hover:border-slate-900 shadow-sm"
                  >
                    <Eye size={20} />
                  </button>
                </td>
              </tr>
            ))}
            
            {/* Tampilan jika pencarian tidak ditemukan */}
            {filteredRiwayat.length === 0 && (
              <tr>
                <td colSpan={4} className="px-8 py-20 text-center">
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

      {/* MODAL LAPORAN NILAI */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
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
              <button onClick={() => setIsModalOpen(false)} className="bg-indigo-600 text-white px-10 py-4 rounded-2xl text-[10px] font-black uppercase hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">Tutup Arsip</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}