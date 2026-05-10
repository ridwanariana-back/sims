"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { getMuridByWaliWithValidation, getDetailNilaiMurid, prosesNaikKelas } from "@/lib/actions";
import { GraduationCap, ArrowUpCircle, Calendar, Heart, Eye, X } from "lucide-react";

const DAFTAR_MAPEL = [
  "PAI & BudiPekerti", "PKN", "Bahasa Indonesia", "Bahasa Inggris", 
  "Bahasa Inggris Tingkat Lanjut", "Matematika Wajib", "Matematika Tingkat Lanjut", 
  "Fisika", "Fisika Mapel Pilihan", "Biologi", "Biologi Mapel Pilihan", 
  "Kimia", "Kimia Mapel Pilihan", "Sejarah", "Sejarah Tingkat Lanjut", 
  "Geografi", "Geografi Mapel Pilihan", "Ekonomi", "Ekonomi Mapel Pilihan", 
  "Sosiologi", "Sosiologi Mapel Pilihan", "Seni Budaya", "Penjas Orkes", 
  "PKWU", "Informatika", "Bimbingan Konseling"
];

export default function DataMuridWaliPage() {
  const { data: session } = useSession();
  const [muridList, setMuridList] = useState<any[]>([]);
  const [selectedMurid, setSelectedMurid] = useState<any>(null);
  const [detailNilai, setDetailNilai] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

 useEffect(() => {
  if (session?.user?.isWaliKelas && session?.user?.kelasWali) {
    refreshData();
  }
}, [session]);

 const refreshData = () => {
  if (session?.user?.kelasWali) {
    getMuridByWaliWithValidation(session.user.kelasWali).then(setMuridList);
  }
};

  const handleShowNilai = async (murid: any) => {
    setSelectedMurid(murid);
    const dataNilaiRaw = await getDetailNilaiMurid(murid.id);
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

  const handleNaikKelas = async (murid: any) => {
    if (confirm(`Naikkan ${murid.nama} ke tingkat selanjutnya?`)) {
      const res = await prosesNaikKelas(murid, Number(session?.user?.id));
      if (res.success) {
        alert(`Berhasil! ${murid.nama} naik ke ${res.target}`);
        refreshData();
      }
    }
  };

  return (
    <div className="space-y-6 p-2">
      {/* HEADER */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 flex items-center gap-6 shadow-sm">
        <div className="w-16 h-16 bg-indigo-600 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-indigo-100">
          <GraduationCap size={32} />
        </div>
        <div>
          <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Kenaikan Kelas</h1>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">Rombel {session?.user?.kelasWali}</p>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white border-b border-slate-100">
              <th className="px-6 py-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center w-16">No</th>
              <th className="px-6 py-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Identitas Utama</th>
              <th className="px-6 py-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Detail Administrasi</th>
              <th className="px-6 py-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Status Nilai</th>
              <th className="px-6 py-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {muridList.map((murid, index) => {
              const siapNaik = Number(murid.jml_ganjil) > 0 && Number(murid.jml_genap) > 0;
              return (
                <tr key={murid.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-6 text-xs font-bold text-slate-300 text-center">{index + 1}</td>
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
                      <button onClick={() => handleShowNilai(murid)} className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-black text-white py-3 rounded-xl text-[10px] font-black uppercase transition-all">
                        <Eye size={14} /> Lihat Nilai
                      </button>
                      <button 
                        onClick={() => handleNaikKelas(murid)}
                        disabled={!siapNaik} 
                        className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${
                          siapNaik ? 'bg-[#00A36C] hover:bg-emerald-700 text-white shadow-lg shadow-emerald-50' : 'bg-slate-100 text-slate-300 cursor-not-allowed'
                        }`}
                      >
                        <ArrowUpCircle size={14} /> Naik Kelas
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* MODAL LAPORAN */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
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