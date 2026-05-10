"use client";

import { useState, useEffect } from "react";
import { Search, Eye, Award, ChevronLeft, ChevronRight } from "lucide-react";
// Import action untuk mengambil data nilai murid (sesuaikan dengan nama action kamu)
import { getRekapNilaiMurid } from "@/lib/actions"; 
import ExcelNilai from "@/components/ExcelNilai";

export default function RekapNilaiPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMurid, setSelectedMurid] = useState<any>(null);

  useEffect(() => {
  getRekapNilaiMurid().then((res) => {
    setData(res);
    setLoading(false); // Diperbaiki dari setLoading(setLoading(false))
  });
}, []);

  const filteredData = data.filter(m => 
    m.nama.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.nisn.includes(searchTerm)
  );

  if (loading) return <div className="p-20 text-center font-black animate-pulse uppercase">Memuat Data Rekap...</div>;

  return (
    <div className="p-8 space-y-8 bg-slate-50 min-h-screen">
      {/* HEADER */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">Rekapitulasi Nilai</h1>
          <p className="text-slate-500 font-bold uppercase text-[10px] mt-1 tracking-widest">Manajemen Prestasi Akademik Murid</p>
        </div>
        <ExcelNilai/>
        
        {/* SEARCH BAR */}
        <div className="relative group w-72">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={16} />
          <input 
            type="text" placeholder="Cari nama atau NISN..." 
            className="w-full pl-12 pr-4 py-3 bg-white border-2 border-slate-100 rounded-2xl text-xs font-bold outline-none focus:border-indigo-500 transition-all shadow-sm"
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* TABLE SECTION */}
      <div className="bg-white rounded-[3rem] border-2 border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b-2 border-slate-100">
              <th className="p-6 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Identitas Murid</th>
              <th className="p-6 text-center text-[10px] font-black uppercase text-slate-400 tracking-widest">Kelas / Rombel</th>
              <th className="p-6 text-center text-[10px] font-black uppercase text-slate-400 tracking-widest">Rata-Rata Nilai</th>
              <th className="p-6 text-right text-[10px] font-black uppercase text-slate-400 tracking-widest">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredData.map((m, i) => (
              <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                <td className="p-6">
                  <div className="flex flex-col">
                    <span className="text-[12px] font-black text-slate-900 uppercase">{m.nama}</span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase mt-1">NISN: {m.nisn}</span>
                  </div>
                </td>
                <td className="p-6 text-center">
                  <span className="inline-block px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase">{m.rombel}</span>
                </td>
                <td className="p-6 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-12 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full" style={{ width: `${m.rerata}%` }} />
                    </div>
                    <span className="text-[12px] font-black text-emerald-600">{m.rerata}</span>
                  </div>
                </td>
                <td className="p-6 text-right">
                  <button 
                    onClick={() => setSelectedMurid(m)}
                    className="p-3 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all active:scale-90"
                  >
                    <Eye size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL DETAIL MAPEL */}
{selectedMurid && (
  <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
    <div className="bg-white w-full max-w-xl rounded-[3rem] border-4 border-slate-900 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
      <div className="p-8 bg-slate-900 text-white flex justify-between items-center">
        <div>
          <h2 className="text-xl font-black uppercase tracking-tighter">Detail Nilai Mapel</h2>
          <div className="flex flex-col mt-1">
            <p className="text-[9px] font-black text-slate-400 uppercase leading-none">
              {selectedMurid.nama} • {selectedMurid.rombel}
            </p>
          </div>
        </div>
        <button onClick={() => setSelectedMurid(null)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
          <Award size={24} className="text-yellow-400" />
        </button>
      </div>
      
      <div className="p-8 space-y-4 max-h-[50vh] overflow-y-auto">
        {(selectedMurid.nilai_mapel || []).map((n: any, idx: number) => (
    <div key={idx} className="flex flex-col p-4 bg-slate-50 rounded-2xl border border-slate-100">
      {/* Baris Atas: Nama Mapel | Semester | TA */}
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-black text-slate-900 uppercase tracking-tight">
            {n.mapel}
          </span>
          <span className="text-[10px] text-slate-300">|</span>
          <span className="text-[9px] font-bold text-emerald-600 uppercase">
            {n.semester}
          </span>
          <span className="text-[10px] text-slate-300">|</span>
          <span className="text-[9px] font-bold text-slate-400 uppercase">
            {n.tahun_ajaran}
          </span>
        </div>
        
        {/* Nilai Angka */}
        <span className="text-[12px] font-black text-indigo-600">
          {n.nilai}
        </span>
      </div>

      {/* Baris Bawah: Progress Bar */}
      <div className="w-full bg-white h-2 rounded-full border border-slate-100 overflow-hidden">
        <div 
          className="bg-indigo-500 h-full rounded-full transition-all duration-500" 
          style={{ width: `${n.nilai}%` }} 
        />
      </div>
    </div>
  ))}
  {/* Tambahkan pesan kalau datanya kosong */}
  {(!selectedMurid.nilai_mapel || selectedMurid.nilai_mapel.length === 0) && (
    <div className="p-10 text-center">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Belum ada data nilai untuk murid ini</p>
    </div>
  )}
        
        <button 
          onClick={() => setSelectedMurid(null)}
          className="w-full mt-6 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[11px] tracking-widest hover:bg-slate-800 transition-all"
        >
          Tutup Detail
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
}