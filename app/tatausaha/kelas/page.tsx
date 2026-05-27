// app/tatausaha/kelas/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Plus, School, Trash2, Loader2, Edit3, X, Check } from 'lucide-react';
import { tambahKelasAction, hapusKelasAction, ambilDaftarKelas, editKelasAction } from '@/lib/actions';

export default function TataUsahaKelasPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [daftarKelas, setDaftarKelas] = useState<any[]>([]);
  const [loadingFetch, setLoadingFetch] = useState(true);

  // State tambahan untuk handling inline edit
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editNama, setEditNama] = useState('');
  const [editTingkat, setEditTingkat] = useState('');

  async function refreshData() {
    try {
      const data = await ambilDaftarKelas();
      setDaftarKelas(data);
    } catch (err) {
      console.error("Gagal memuat data kelas:", err);
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
      refreshData();
    }
  }, [status]);

  // Fungsi untuk mengaktifkan mode edit pada baris tertentu
  void function mulaiEdit(kelas: any) {
    setEditingId(kelas.id);
    setEditNama(kelas.nama_kelas);
    setEditTingkat(kelas.tingkat.toString());
  }

  if (status === 'loading' || loadingFetch) {
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
        <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Manajemen Kelas & Rombel</h1>
        <p className="text-slate-500 font-medium">Tambah dan atur daftar kelas aktif untuk sekolah Anda</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Tambah Kelas (Kiri) */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 h-fit">
          <h3 className="font-black text-slate-900 uppercase mb-4 flex items-center gap-2">
            <Plus size={18} className="text-blue-600" />
            <span>Tambah Kelas Baru</span>
          </h3>
          
          <form 
            action={async (formData) => {
              await tambahKelasAction(formData);
              refreshData();
            }} 
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-black uppercase text-slate-400 tracking-wider mb-1">Nama Kelas / Rombel</label>
              <input 
                name="nama_kelas"
                type="text" 
                placeholder="Contoh: X.1, VII-A, atau Kelas 1-A"
                required
                className="block w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-slate-400 tracking-wider mb-1">Tingkat / Angkatan</label>
              <select 
                name="tingkat"
                required
                className="block w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all bg-white"
              >
                <option value="">-- Pilih Tingkat --</option>
                <optgroup label="Tingkat SD">
                  <option value="1">Tingkat 1</option>
                  <option value="2">Tingkat 2</option>
                  <option value="3">Tingkat 3</option>
                  <option value="4">Tingkat 4</option>
                  <option value="5">Tingkat 5</option>
                  <option value="6">Tingkat 6</option>
                </optgroup>
                <optgroup label="Tingkat SMP">
                  <option value="7">Tingkat 7</option>
                  <option value="8">Tingkat 8</option>
                  <option value="9">Tingkat 9</option>
                </optgroup>
                <optgroup label="Tingkat SMA/SMK">
                  <option value="10">Tingkat 10</option>
                  <option value="11">Tingkat 11</option>
                  <option value="12">Tingkat 12</option>
                </optgroup>
              </select>
            </div>

            <button
              type="submit"
              className="flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-md hover:bg-blue-700 transition-all active:scale-[0.98]"
            >
              Simpan Kelas
            </button>
          </form>
        </div>

        {/* Tabel List Kelas Terdaftar (Kanan) */}
        <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h3 className="font-black text-slate-900 uppercase">Daftar Kelas Aktif</h3>
            <p className="text-[10px] text-slate-400 font-black uppercase">Total terdata: {daftarKelas.length} Kelas</p>
          </div>

          {daftarKelas.length === 0 ? (
            <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
              <School size={48} className="text-slate-300" />
              <p className="text-sm font-medium">Belum ada data kelas untuk sekolah ini.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-wider border-b border-slate-100">
                    <th className="py-4 px-6">No</th>
                    <th className="py-4 px-6">Nama Kelas / Rombel</th>
                    <th className="py-4 px-6">Tingkat</th>
                    <th className="py-4 px-6 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                  {daftarKelas.map((kelas, index) => {
                    const sedangEdit = editingId === kelas.id;
                    
                    return (
                      <tr key={kelas.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-4 px-6 font-mono text-xs text-slate-400">{index + 1}</td>
                        
                        {/* Kolom Nama Kelas */}
                        <td className="py-4 px-6">
                          {sedangEdit ? (
                            <input 
                              type="text"
                              value={editNama}
                              onChange={(e) => setEditNama(e.target.value)}
                              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg outline-none focus:border-blue-500 w-full font-bold text-slate-900"
                            />
                          ) : (
                            <span className="font-bold text-slate-900">{kelas.nama_kelas}</span>
                          )}
                        </td>

                        {/* Kolom Tingkat */}
                        <td className="py-4 px-6">
                          {sedangEdit ? (
                            <select
                              value={editTingkat}
                              onChange={(e) => setEditTingkat(e.target.value)}
                              className="px-2 py-1.5 text-sm border border-gray-300 rounded-lg outline-none bg-white focus:border-blue-500 font-bold text-slate-600"
                            >
                              {[1,2,3,4,5,6,7,8,9,10,11,12].map((t) => (
                                <option key={t} value={t}>Tingkat {t}</option>
                              ))}
                            </select>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-slate-100 text-slate-600">
                              Tingkat {kelas.tingkat}
                            </span>
                          )}
                        </td>

                        {/* Kolom Aksi */}
                        <td className="py-4 px-6">
                          <div className="flex items-center justify-center gap-2">
                            {sedangEdit ? (
                              <>
                                {/* Tombol Save Edit */}
                                <button 
                                  onClick={async () => {
                                    const fData = new FormData();
                                    fData.append('id', kelas.id.toString());
                                    fData.append('nama_kelas', editNama);
                                    fData.append('tingkat', editTingkat);
                                    
                                    await editKelasAction(fData);
                                    setEditingId(null);
                                    refreshData();
                                  }}
                                  className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors"
                                  title="Simpan Perubahan"
                                >
                                  <Check size={16} />
                                </button>
                                {/* Tombol Cancel Edit */}
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
                                {/* Tombol Memicu Mode Edit */}
                                <button 
                                  onClick={() => {
                                    setEditingId(kelas.id);
                                    setEditNama(kelas.nama_kelas);
                                    setEditTingkat(kelas.tingkat.toString());
                                  }}
                                  className="p-2 text-amber-500 hover:bg-amber-50 rounded-xl transition-colors"
                                  title="Edit Kelas"
                                >
                                  <Edit3 size={16} />
                                </button>

                                {/* Tombol Hapus */}
                                <form 
                                  action={async (formData) => {
                                    await hapusKelasAction(formData);
                                    refreshData();
                                  }} 
                                  onSubmit={(e) => {
                                    if(!confirm("Yakin ingin menghapus kelas ini?")) e.preventDefault();
                                  }}
                                  className="inline"
                                >
                                  <input type="hidden" name="id" value={kelas.id} />
                                  <button 
                                    type="submit"
                                    className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors inline-flex items-center justify-center"
                                    title="Hapus Kelas"
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
      </div>
    </div>
  );
}