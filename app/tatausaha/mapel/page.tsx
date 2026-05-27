// app/tatausaha/mapel/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Loader2, BookOpen, Search, ChevronLeft, ChevronRight, Edit3, X, Check } from 'lucide-react';
// 🚩 Ambil editMapelAction dari file actions
import { tambahMapelAction, hapusMapelAction, ambilDaftarMapel, editMapelAction } from '@/lib/actions';

export default function TataUsahaMapelPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // State Data Master
  const [daftarMapel, setDaftarMapel] = useState<any[]>([]);
  const [totalData, setTotalData] = useState(0);
  const [loadingFetch, setLoadingFetch] = useState(true);

  // State Filter, Limit, & Pagination
  const [search, setSearch] = useState('');
  const [limit, setLimit] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);

  // 🚩 State Tambahan untuk mengurusi Fitur Inline Edit Mapel
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editNama, setEditNama] = useState('');
  const [editKode, setEditKode] = useState('');
  const [editKelompok, setEditKelompok] = useState('');

  async function loadData() {
    setLoadingFetch(true);
    try {
      const offset = (currentPage - 1) * limit;
      const result = await ambilDaftarMapel(search, limit, offset);
      setDaftarMapel(result.data);
      setTotalData(result.total);
    } catch (err) {
      console.error("Gagal memuat data mapel:", err);
    } finally {
      setLoadingFetch(false);
    }
  }

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    } else if (status === 'authenticated' && session?.user?.role?.toLowerCase() !== 'tata_usaha') {
      router.push('/');
    }
  }, [status, session, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      loadData();
    }
  }, [status, search, limit, currentPage]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(totalData / limit);

  if (status === 'loading') {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Manajemen Mata Pelajaran</h1>
        <p className="text-slate-500 font-medium">Kelola daftar mata pelajaran aktif sesuai kurikulum sekolah Anda</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* FORM TAMBAH MAPEL (KIRI) */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 h-fit">
          <h3 className="font-black text-slate-900 uppercase mb-4 flex items-center gap-2">
            <Plus size={18} className="text-blue-600" />
            <span>Tambah Mapel</span>
          </h3>
          
          <form 
            action={async (formData) => {
              await tambahMapelAction(formData);
              setCurrentPage(1);
              loadData();
            }} 
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-black uppercase text-slate-400 tracking-wider mb-1">Nama Mata Pelajaran</label>
              <input 
                name="nama_mapel"
                type="text" 
                placeholder="Contoh: Matematika, Bahasa Indonesia"
                required
                className="block w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-slate-400 tracking-wider mb-1">Kode Mapel</label>
              <input 
                name="kode_mapel"
                type="text" 
                placeholder="Contoh: MTK, BIN, IPA"
                required
                className="block w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-slate-400 tracking-wider mb-1">Kelompok Mapel</label>
              <select 
                name="kelompok"
                required
                className="block w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all bg-white font-medium text-slate-700"
              >
                <option value="Umum">Muatan Umum (A / B)</option>
                <option value="Kejuruan">Peminatan / Kejuruan (C)</option>
                <option value="Muatan Lokal">Muatan Lokal (Mulok)</option>
                <option value="Kegiatan">Kegiatan</option>
              </select>
            </div>

            <button
              type="submit"
              className="flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-md hover:bg-blue-700 transition-all active:scale-[0.98]"
            >
              Simpan Mapel
            </button>
          </form>
        </div>

        {/* TABEL DATA MAPEL + SEARCH & PAGINATION (KANAN) */}
        <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col justify-between">
          <div>
            {/* Toolbar Filter */}
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row gap-4 justify-between items-center bg-white">
              <div className="relative w-full sm:w-72">
                <Search size={16} className="absolute left-4 top-3.5 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Cari nama atau kode mapel..."
                  value={search}
                  onChange={handleSearchChange}
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-transparent rounded-xl text-sm outline-none focus:bg-white focus:border-blue-500 transition-all text-slate-800 font-medium"
                />
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <span className="text-xs font-black uppercase text-slate-400 tracking-wider">Tampilkan:</span>
                <select
                  value={limit}
                  onChange={(e) => { setLimit(parseInt(e.target.value)); setCurrentPage(1); }}
                  className="rounded-xl border border-gray-300 px-3 py-1.5 text-xs font-bold outline-none bg-white text-slate-700"
                >
                  <option value={5}>5 Baris</option>
                  <option value={10}>10 Baris</option>
                  <option value={25}>25 Baris</option>
                </select>
              </div>
            </div>

            {loadingFetch ? (
              <div className="p-24 flex items-center justify-center text-blue-600">
                <Loader2 className="animate-spin" size={32} />
              </div>
            ) : daftarMapel.length === 0 ? (
              <div className="p-16 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
                <BookOpen size={48} className="text-slate-300" />
                <p className="text-sm font-medium">Data mata pelajaran tidak ditemukan.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-wider border-b border-slate-100">
                      <th className="py-4 px-6 w-16">No</th>
                      <th className="py-4 px-6 w-28">Kode</th>
                      <th className="py-4 px-6">Nama Mata Pelajaran</th>
                      <th className="py-4 px-6 w-40">Kelompok</th>
                      <th className="py-4 px-6 text-center w-28">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                    {daftarMapel.map((mapel, index) => {
                      const sedangEdit = editingId === mapel.id;

                      return (
                        <tr key={mapel.id} className="hover:bg-slate-50/80 transition-colors">
                          {/* No */}
                          <td className="py-4 px-6 font-mono text-xs text-slate-400">
                            {(currentPage - 1) * limit + index + 1}
                          </td>

                          {/* Kode Mapel */}
                          <td className="py-4 px-6">
                            {sedangEdit ? (
                              <input 
                                type="text"
                                value={editKode}
                                onChange={(e) => setEditKode(e.target.value)}
                                className="px-2 py-1.5 font-mono text-xs uppercase border border-gray-300 rounded-lg outline-none focus:border-blue-500 w-full font-bold text-blue-600"
                              />
                            ) : (
                              <span className="font-mono font-bold text-blue-600 uppercase text-xs">
                                {mapel.kode_mapel}
                              </span>
                            )}
                          </td>

                          {/* Nama Mapel */}
                          <td className="py-4 px-6">
                            {sedangEdit ? (
                              <input 
                                type="text"
                                value={editNama}
                                onChange={(e) => setEditNama(e.target.value)}
                                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg outline-none focus:border-blue-500 w-full font-bold text-slate-900"
                              />
                            ) : (
                              <span className="font-bold text-slate-900">{mapel.nama_mapel}</span>
                            )}
                          </td>

                          {/* Kelompok Mapel */}
                          <td className="py-4 px-6">
                            {sedangEdit ? (
                              <select
                                value={editKelompok}
                                onChange={(e) => setEditKelompok(e.target.value)}
                                className="px-2 py-1.5 text-xs border border-gray-300 rounded-lg outline-none bg-white focus:border-blue-500 font-bold text-slate-600 w-full"
                              >
                                <option value="Umum">Umum</option>
                                <option value="Kejuruan">Kejuruan</option>
                                <option value="Muatan Lokal">Muatan Lokal</option>
                              </select>
                            ) : (
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold ${
                                mapel.kelompok === 'Umum' ? 'bg-slate-100 text-slate-600' :
                                mapel.kelompok === 'Kejuruan' ? 'bg-purple-50 text-purple-600' : 'bg-amber-50 text-amber-600'
                              }`}>
                                {mapel.kelompok}
                              </span>
                            )}
                          </td>

                          {/* Kolom Kolom Aksi */}
                          <td className="py-4 px-6 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {sedangEdit ? (
                                <>
                                  {/* Simpan Perubahan */}
                                  <button 
                                    onClick={async () => {
                                      const fData = new FormData();
                                      fData.append('id', mapel.id.toString());
                                      fData.append('nama_mapel', editNama);
                                      fData.append('kode_mapel', editKode);
                                      fData.append('kelompok', editKelompok);
                                      
                                      await editMapelAction(fData);
                                      setEditingId(null);
                                      loadData();
                                    }}
                                    className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors"
                                    title="Simpan"
                                  >
                                    <Check size={16} />
                                  </button>
                                  {/* Batal */}
                                  <button 
                                    onClick={() => setEditingId(null)}
                                    className="p-2 text-gray-400 hover:bg-gray-100 rounded-xl transition-colors"
                                    title="Batal"
                                  >
                                    <X size={16} />
                                  </button>
                                </>
                              ) : (
                                <>
                                  {/* Tombol Picu Edit */}
                                  <button 
                                    onClick={() => {
                                      setEditingId(mapel.id);
                                      setEditNama(mapel.nama_mapel);
                                      setEditKode(mapel.kode_mapel);
                                      setEditKelompok(mapel.kelompok);
                                    }}
                                    className="p-2 text-amber-500 hover:bg-amber-50 rounded-xl transition-colors"
                                    title="Edit Mapel"
                                  >
                                    <Edit3 size={16} />
                                  </button>

                                  {/* Tombol Hapus */}
                                  <form 
                                    action={async (formData) => {
                                      await hapusMapelAction(formData);
                                      loadData();
                                    }} 
                                    onSubmit={(e) => {
                                      if(!confirm("Hapus mata pelajaran ini?")) e.preventDefault();
                                    }}
                                    className="inline"
                                  >
                                    <input type="hidden" name="id" value={mapel.id} />
                                    <button 
                                      type="submit"
                                      className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors inline-flex items-center justify-center"
                                      title="Hapus"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </form>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* FOOTER: CONTROLLER PAGINATION BAR */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-bold text-slate-500">
              <span>
                Menampilkan Halaman <span className="text-slate-800">{currentPage}</span> dari <span className="text-slate-800">{totalPages}</span> ({totalData} data master)
              </span>
              
              <div className="flex items-center gap-1.5">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-all disabled:opacity-40 disabled:hover:bg-white inline-flex items-center justify-center text-slate-700"
                >
                  <ChevronLeft size={16} />
                </button>
                
                {Array.from({ length: totalPages }).map((_, i) => {
                  const pageNum = i + 1;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                        currentPage === pageNum 
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10' 
                          : 'border border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-all disabled:opacity-40 disabled:hover:bg-white inline-flex items-center justify-center text-slate-700"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}