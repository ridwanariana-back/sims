"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, PlusCircle, Edit3 } from "lucide-react";
import Link from "next/link";

export default function NilaiTable({ initialData }: { initialData: any[] }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const totalPages = Math.ceil(initialData.length / rowsPerPage);
  const currentItems = initialData.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
        <select 
          value={rowsPerPage} 
          onChange={(e) => {setRowsPerPage(Number(e.target.value)); setCurrentPage(1)}} 
          className="border-2 rounded-xl p-2 text-sm font-black outline-none focus:border-blue-500 text-slate-900"
        >
          {[10, 20, 50].map((num) => <option key={num} value={num}>Show {num}</option>)}
        </select>
        <div className="text-sm text-slate-900 font-black uppercase tracking-tighter">
          Total <span className="text-blue-600">{initialData.length}</span> Siswa
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Siswa</th>
              <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Kelas & Rombel</th>
              <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Semester Ganjil</th>
              <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Semester Genap</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {currentItems.map((murid) => {
              const isFinalized = murid.status === "Lulus" || murid.status === "Naik Kelas";
              
              return (
                <tr key={murid.id} className="hover:bg-slate-50/50 transition-all group">
                  <td className="px-6 py-4">
                    <div className="font-black text-slate-900 text-sm uppercase">{murid.nama}</div>
                    <div className="text-[11px] font-mono text-slate-400">{murid.nisn}</div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex flex-col items-center gap-1">
                        <span className="px-3 py-1 bg-blue-600 text-white text-[10px] font-black rounded-lg uppercase shadow-sm">
                        {murid.kelas}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                        Rombel: {murid.rombel || "-"}
                        </span>
                    </div>
                  </td>
                  
                  {/* Semester Ganjil */}
                  <td className="px-6 py-4 text-center">
                    <div className="flex flex-col items-center gap-2">
                        <Link 
                        href={`/guru/inputnilai/${murid.id}?s=Ganjil`}
                        className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-black transition-all ${
                            isFinalized ? "bg-slate-100 text-slate-300 pointer-events-none" :
                            murid.id_ganjil ? "bg-amber-500 text-white shadow-md hover:bg-amber-600" : "bg-blue-600 text-white shadow-md hover:bg-blue-700"
                        }`}
                        >
                        {murid.id_ganjil ? <Edit3 size={12} /> : <PlusCircle size={12} />}
                        {murid.id_ganjil ? "EDIT" : "INPUT"}
                        </Link>
                        {murid.id_ganjil && (
                            <span className="text-xs font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                                NILAI: {murid.angka_ganjil}
                            </span>
                        )}
                    </div>
                  </td>

                  {/* Semester Genap */}
                  <td className="px-6 py-4 text-center">
                    <div className="flex flex-col items-center gap-2">
                        <Link 
                        href={`/guru/inputnilai/${murid.id}?s=Genap`}
                        className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-black transition-all ${
                            isFinalized ? "bg-slate-100 text-slate-300 pointer-events-none" :
                            murid.id_genap ? "bg-amber-500 text-white shadow-md hover:bg-amber-600" : "bg-blue-600 text-white shadow-md hover:bg-blue-700"
                        }`}
                        >
                        {murid.id_genap ? <Edit3 size={12} /> : <PlusCircle size={12} />}
                        {murid.id_genap ? "EDIT" : "INPUT"}
                        </Link>
                        {murid.id_genap && (
                            <span className="text-xs font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                                NILAI: {murid.angka_genap}
                            </span>
                        )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="px-6 py-5 bg-slate-50 flex items-center justify-between border-t border-slate-200">
        <div className="text-xs text-slate-900 font-black uppercase tracking-tighter">
          Halaman <span className="text-blue-600">{currentPage}</span> Dari {totalPages || 1}
        </div>
        <div className="flex gap-2">
          <button 
            disabled={currentPage === 1} 
            onClick={() => setCurrentPage(prev => prev - 1)} 
            className="p-2 bg-white border-2 rounded-xl disabled:opacity-30 hover:bg-slate-900 hover:text-white transition-all text-slate-900"
          >
            <ChevronLeft size={20} />
          </button>
          <button 
            disabled={currentPage === totalPages || totalPages === 0} 
            onClick={() => setCurrentPage(prev => prev + 1)} 
            className="p-2 bg-white border-2 rounded-xl disabled:opacity-30 hover:bg-slate-900 hover:text-white transition-all text-slate-900"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}