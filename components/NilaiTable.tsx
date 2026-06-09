// components/NilaiTable.tsx
"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, PlusCircle, Edit3, Search } from "lucide-react";
import Link from "next/link";

export default function NilaiTable({ initialData }: { initialData: any[] }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");

  // Filter data berdasarkan pencarian nama siswa di client-side (opsional & bikin aplikasi makin responsif)
  const filteredData = initialData.filter((item) =>
    item.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.nisn.includes(searchQuery) ||
    (item.nama_mapel && item.nama_mapel.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const currentItems = filteredData.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in duration-200">
      
      {/* HEADER UTAMA TABEL + SEARCH BAR */}
      <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama siswa, NISN, atau mata pelajaran..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1); // Reset ke halaman pertama saat mencari
            }}
            className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-slate-800 placeholder-slate-400"
          />
        </div>
        
        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 self-end sm:self-auto">
          <span>Tampilkan:</span>
          <select
            value={rowsPerPage}
            onChange={(e) => {
              setRowsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-black outline-none focus:border-blue-500 text-slate-700"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
          <span>baris</span>
        </div>
      </div>

      {/* WRAPPER TABEL */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-100/50">
              <th className="p-4 text-[10px] font-black uppercase text-slate-400 tracking-wider">Nama Siswa</th>
              {/* 💡 KOLOM BARU: Agar guru tahu baris ini untuk mapel apa */}
              <th className="p-4 text-[10px] font-black uppercase text-slate-400 tracking-wider">Mata Pelajaran</th>
              <th className="p-4 text-[10px] font-black uppercase text-slate-400 tracking-wider text-center">Rombel</th>
              <th className="p-4 text-[10px] font-black uppercase text-slate-400 tracking-wider text-center">Semester Ganjil</th>
              <th className="p-4 text-[10px] font-black uppercase text-slate-400 tracking-wider text-center">Semester Genap</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {currentItems.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Data siswa tidak ditemukan
                </td>
              </tr>
            ) : (
              currentItems.map((murid) => {
                // Kombinasi unik key menggunakan id siswa + id mapel agar React tidak error duplicate key
                const uniqueKey = `${murid.id}-${murid.mapel_id}`;
                
                return (
                  <tr key={uniqueKey} className="hover:bg-slate-50/80 transition-colors">
                    {/* INFO IDENTITAS SISWA */}
                    <td className="p-4">
                      <div className="font-black text-slate-900 uppercase tracking-tight text-sm">
                        {murid.nama}
                      </div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase mt-0.5 tracking-wider">
                        NISN: {murid.nisn}
                      </div>
                    </td>
                    
                    {/* INFO MATA PELAJARAN */}
                    <td className="p-4">
                      <span className="text-[10px] font-black bg-slate-900 text-white px-2.5 py-1 rounded-md uppercase tracking-tight block w-max max-w-[200px] truncate">
                        {murid.nama_mapel || "Mata Pelajaran"}
                      </span>
                    </td>

                    {/* ROMBEL KELAS */}
                    <td className="p-4 text-center">
                      <span className="text-xs font-black bg-blue-50 text-blue-600 px-2.5 py-1 rounded-xl uppercase">
                        {murid.rombel}
                      </span>
                    </td>
                    
                    {/* SEMESTER GANJIL */}
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        {!murid.id_ganjil ? (
                          <Link 
                            href={`/guru/inputnilai/${murid.id}?s=Ganjil&mapel=${murid.mapel_id}`}
                            className="text-[10px] font-black text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all active:scale-95 uppercase tracking-wider"
                          >
                            <PlusCircle size={14} /> Isi Nilai
                          </Link>
                        ) : (
                          <Link
                            href={`/guru/inputnilai/${murid.id}?s=Ganjil&mapel=${murid.mapel_id}`}
                            className="text-[10px] font-black text-amber-600 bg-amber-50 hover:bg-amber-500 hover:text-white px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all active:scale-95 uppercase tracking-wider border border-amber-200/50"
                          >
                            <Edit3 size={14} /> Edit Nilai
                          </Link>
                        )}
                        {murid.angka_ganjil !== null && murid.angka_ganjil !== undefined && (
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
                          <Link 
                            href={`/guru/inputnilai/${murid.id}?s=Genap&mapel=${murid.mapel_id}`}
                            className="text-[10px] font-black text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all active:scale-95 uppercase tracking-wider"
                          >
                            <PlusCircle size={14} /> Isi Nilai
                          </Link>
                        ) : (
                          <Link 
                            href={`/guru/inputnilai/${murid.id}?s=Genap&mapel=${murid.mapel_id}`}
                            className="text-[10px] font-black text-amber-600 bg-amber-50 hover:bg-amber-500 hover:text-white px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all active:scale-95 uppercase tracking-wider border border-amber-200/50"
                          >
                            <Edit3 size={14} /> Edit Nilai
                          </Link>
                        )}
                        {murid.angka_genap !== null && murid.angka_genap !== undefined && (
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

      {/* FOOTER TABEL / PAGINATION CONTROLS */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Halaman {currentPage} dari {totalPages} ({filteredData.length} total data)
          </div>
          
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:hover:bg-white transition-all"
            >
              <ChevronLeft size={16} />
            </button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`w-9 h-9 text-xs font-black rounded-xl transition-all ${
                  currentPage === page
                    ? "bg-slate-900 text-white shadow-md shadow-slate-900/10"
                    : "border border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:hover:bg-white transition-all"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}