// components/NilaiTable.tsx
"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, PlusCircle, Edit3, Search } from "lucide-react";
import Link from "next/link";

export default function NilaiTable({ initialData }: { initialData: any[] }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const totalPages = Math.ceil(initialData.length / rowsPerPage);
  const currentItems = initialData.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in duration-200">
      <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
        <select 
          value={rowsPerPage} 
          onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }} 
          className="border-2 rounded-xl p-2 text-sm font-black outline-none focus:border-blue-500 text-slate-900 bg-white"
        >
          {[10, 20, 50].map((num) => <option key={num} value={num}>Show {num}</option>)}
        </select>
        <div className="text-sm text-slate-900 font-black uppercase tracking-tighter">
          Total <span className="text-blue-600">{initialData.length}</span> Murid
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-100/50">
              <th className="p-4 text-[10px] font-black uppercase text-slate-400 tracking-wider">Nama Siswa</th>
              <th className="p-4 text-[10px] font-black uppercase text-slate-400 tracking-wider text-center">Rombel</th>
              <th className="p-4 text-[10px] font-black uppercase text-slate-400 tracking-wider text-center">Semester Ganjil</th>
              <th className="p-4 text-[10px] font-black uppercase text-slate-400 tracking-wider text-center">Semester Genap</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {/* JIKA DATA KOSONG (Belum memilih murid dari Autocomplete) */}
            {currentItems.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-16 text-center bg-slate-50/50">
                  <div className="flex flex-col items-center justify-center space-y-3 text-slate-400">
                    <div className="p-4 bg-slate-100 rounded-full text-slate-400">
                      <Search size={24} />
                    </div>
                    <p className="text-xs font-black uppercase tracking-widest">
                      Silakan cari dan klik nama murid pada dropdown di atas untuk menginput nilai
                    </p>
                    <p className="text-[11px] font-bold text-slate-400/80 lowercase normal-case">
                      sistem akan menampilkan form baris data setelah nama atau nisn murid dipilih.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              // JIKA DATA ADA (Setelah murid di-klik & lolos cek proteksi rombel)
              currentItems.map((murid) => {
                return (
                  <tr key={murid.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4">
                      <div className="font-black text-slate-900 uppercase tracking-tight text-sm">
                        {murid.nama}
                      </div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase mt-0.5 tracking-wider">
                        NISN: {murid.nisn}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className="text-xs font-black bg-blue-50 text-blue-600 px-2.5 py-1 rounded-xl uppercase">
                        {murid.rombel}
                      </span>
                    </td>
                    
                    {/* SEMESTER GANJIL */}
<td className="p-4">
  <div className="flex items-center justify-center gap-2">
    {!murid.id_ganjil ? (
      // PERBAIKAN: Arahkan ke /guru/inputnilai/[murid_id]?s=Ganjil
      <Link 
        href={`/guru/inputnilai/${murid.id}?s=Ganjil`}
        className="text-[10px] font-black text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all active:scale-95 uppercase tracking-wider"
      >
        <PlusCircle size={14} /> Isi Nilai
      </Link>
    ) : (
      <Link
      href={`/guru/inputnilai/${murid.id}?s=Ganjil`}
        className="text-[10px] font-black text-amber-600 bg-amber-50 hover:bg-amber-500 hover:text-white px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all active:scale-95 uppercase tracking-wider border border-amber-200/50"
      >
        <Edit3 size={14} /> Edit Nilai
      </Link>
    )}
    {murid.angka_ganjil !== null && (
      <span className="text-xs font-black text-slate-900 bg-slate-100 px-2 py-1 rounded-md border border-slate-200 font-mono">
        NILAI: {murid.angka_ganjil}
      </span>
    )}
  </div>
</td>

{/* SEMESTER GENAP */}
<td className="p-4">
  <div className="flex items-center justify-center gap-2">
    {!murid.id_genap ? (
      // PERBAIKAN: Arahkan ke /guru/inputnilai/[murid_id]?s=Genap
      <Link 
        href={`/guru/inputnilai/${murid.id}?s=Genap`}
        className="text-[10px] font-black text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all active:scale-95 uppercase tracking-wider"
      >
        <PlusCircle size={14} /> Isi Nilai
      </Link>
    ) : (
      <Link 
        href={`/guru/inputnilai/${murid.id}?s=Genap`}
        className="text-[10px] font-black text-amber-600 bg-amber-50 hover:bg-amber-500 hover:text-white px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all active:scale-95 uppercase tracking-wider border border-amber-200/50"
      >
        <Edit3 size={14} /> Edit Nilai
      </Link>
    )}
    {murid.angka_genap !== null && (
      <span className="text-xs font-black text-slate-900 bg-slate-100 px-2 py-1 rounded-md border border-slate-200 font-mono">
        NILAI: {murid.angka_genap}
      </span>
    )}
  </div>
</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* FOOTER PAGINATION */}
      <div className="px-6 py-5 bg-slate-50 flex items-center justify-between border-t border-slate-200">
        <div className="text-xs text-slate-900 font-black uppercase tracking-tighter">
          Halaman <span className="text-blue-600">{currentPage}</span> Dari {totalPages || 1}
        </div>
        <div className="flex gap-2">
          <button 
            disabled={currentPage === 1} 
            onClick={() => setCurrentPage(prev => prev - 1)} 
            className="p-2 bg-white border-2 rounded-xl disabled:opacity-30 hover:bg-slate-900 hover:text-white transition-all text-slate-900 shadow-sm"
          >
            <ChevronLeft size={20} />
          </button>
          <button 
            disabled={currentPage === totalPages || totalPages === 0} 
            onClick={() => setCurrentPage(prev => prev + 1)} 
            className="p-2 bg-white border-2 rounded-xl disabled:opacity-30 hover:bg-slate-900 hover:text-white transition-all text-slate-900 shadow-sm"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}