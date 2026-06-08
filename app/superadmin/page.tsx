'use client';

import React, { useState, useEffect } from 'react';
import { getAllSekolah, createSekolahBaru, updateSekolah, deleteSekolahTotal } from '@/lib/actions';
import { Plus, Edit, Trash2, ShieldAlert, School, Key, Loader2, X, Search, ChevronLeft, ChevronRight, Copy, Check } from 'lucide-react';

export default function SuperadminPage() {
  const [listSekolah, setListSekolah] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState<any | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error'; txt: string } | null>(null);

  // 🌟 State Baru untuk menampung data Auto-Generate Akun setelah Sukses Berhasil Terdaftar
  const [successData, setSuccessData] = useState<{
    namaSekolah: string;
    usernameTU: string;
    usernameOps: string;
  } | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // State untuk Search & Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  const refreshData = async () => {
    setLoading(true);
    const data = await getAllSekolah();
    setListSekolah(data);
    setLoading(false);
  };

  useEffect(() => {
    refreshData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, itemsPerPage]);

  // Handle Kirim Form (Tambah / Edit)
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitLoading(true);
    setAlertMsg(null);

    const formData = new FormData(e.currentTarget);
    let res: any;

    if (editMode) {
      res = await updateSekolah(formData, editMode.id);
    } else {
      res = await createSekolahBaru(formData);
    }

    setSubmitLoading(false);
    if (res.success) {
      setModalOpen(false);
      
      if (!editMode && res && 'data' in res) {
        // 🌟 Jika mendaftarkan baru, tampung data akun ke state untuk memicu modal kredensial
        setSuccessData(res.data as any);
      } else {
        setAlertMsg({ type: 'success', txt: res.message || 'Berhasil memperbarui data sekolah!' });
      }
      
      setEditMode(null);
      refreshData();
    } else {
      setAlertMsg({ type: 'error', txt: res.message });
    }
  };

  // Handle Hapus Total Sekolah
  const handleDelete = async (id: number, nama: string) => {
    const konfirmasi = window.confirm(`⚠️ PERINGATAN KELAS BERAT!\n\nApakah Anda yakin ingin menghapus "${nama.toUpperCase()}"?\nFitur ini akan menyapu bersih data Guru, Siswa, Kelas, Absensi, Akun Login, Nilai, dll yang berada di sekolah tersebut secara permanen.`);
    
    if (konfirmasi) {
      setLoading(true);
      const res = await deleteSekolahTotal(id);
      if (res.success) {
        alert(res.message);
        refreshData();
      } else {
        alert(res.message);
        setLoading(false);
      }
    }
  };

  // Fungsi Copy to Clipboard untuk mempermudah Superadmin
  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Logic Engine Search & Pagination
  const filteredSekolah = listSekolah.filter((sch) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      sch.nama_sekolah?.toLowerCase().includes(searchLower) ||
      sch.npsn?.toLowerCase().includes(searchLower) ||
      sch.alamat?.toLowerCase().includes(searchLower)
    );
  });

  const totalItems = filteredSekolah.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentData = filteredSekolah.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-6 bg-gray-50 min-h-screen">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ShieldAlert className="text-red-600" /> Control Panel Superadmin
          </h1>
          <p className="text-sm text-gray-500 mt-1">Sistem Manajemen Multi-Tenant Central SIMS (Registrasi, Edit, & Purge Sekolah)</p>
        </div>
        <button
          onClick={() => { setEditMode(null); setModalOpen(true); }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-4 py-2.5 rounded-xl transition shadow-md whitespace-nowrap"
        >
          <Plus size={16} /> Daftarkan Sekolah Baru
        </button>
      </div>

      {/* Tampilan Umpan Balik */}
      {alertMsg && (
        <div className={`p-4 rounded-xl border text-sm ${alertMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-800 border-red-200'}`}>
          {alertMsg.txt}
        </div>
      )}

      {/* Kontrol Filter (Search Input & Limit Per Page) */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari nama sekolah, NPSN, atau alamat..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:bg-white transition"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-3 text-gray-400 hover:text-gray-600">
              <X size={14} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto text-sm text-gray-500">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Tampilkan:</span>
          <select
            value={itemsPerPage}
            onChange={(e) => setItemsPerPage(parseInt(e.target.value))}
            className="bg-gray-50 border border-gray-300 rounded-lg px-2 py-1.5 font-bold text-slate-700 outline-none focus:border-blue-500 cursor-pointer text-xs"
          >
            <option value={5}>5 Sekolah</option>
            <option value={10}>10 Sekolah</option>
            <option value={25}>25 Sekolah</option>
            <option value={50}>50 Sekolah</option>
          </select>
        </div>
      </div>

      {/* Tabel Data Sekolah */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-2">
            <Loader2 className="animate-spin text-blue-600 h-8 w-8" />
            <span className="text-sm font-medium text-gray-500">Sinkronisasi Basis Data Global...</span>
          </div>
        ) : currentData.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm text-gray-400">Data sekolah tidak ditemukan atau kata kunci tidak cocok.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white text-xs font-bold uppercase tracking-wider">
                    <th className="px-6 py-4">Nama Sekolah / Tenant</th>
                    <th className="px-6 py-4">NPSN</th>
                    <th className="px-6 py-4">Alamat</th>
                    <th className="px-6 py-4 text-center">Statistik</th>
                    <th className="px-6 py-4 text-center">Aksi Terpusat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm font-medium">
                  {currentData.map((sch) => (
                    <tr key={sch.id} className="hover:bg-gray-50/80 transition">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-800 capitalize flex items-center gap-2">
                          <School size={16} className="text-blue-500" /> {sch.nama_sekolah}
                        </div>
                        <span className="text-[10px] text-gray-400 font-mono">ID: TENANT_00{sch.id}</span>
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-gray-600">{sch.npsn}</td>
                      <td className="px-6 py-4 text-gray-500 text-xs max-w-xs truncate">{sch.alamat || '-'}</td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-2 text-center text-[11px]">
                          <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-md font-bold">User: {sch.total_users}</span>
                          <span className="bg-purple-50 text-purple-700 px-2 py-1 rounded-md font-bold">Murid: {sch.total_murid}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => { setEditMode(sch); setModalOpen(true); }}
                            className="p-2 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 transition"
                            title="Edit Sekolah"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(sch.id, sch.nama_sekolah)}
                            className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
                            title="Hapus Bersih Sekolah"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 border-t border-gray-200 bg-gray-50/50 text-sm font-medium text-gray-600">
              <div>
                Menampilkan <span className="font-bold text-slate-900">{totalItems === 0 ? 0 : indexOfFirstItem + 1}</span> sampai{' '}
                <span className="font-bold text-slate-900">{indexOfLastItem > totalItems ? totalItems : indexOfLastItem}</span> dari{' '}
                <span className="font-bold text-slate-900">{totalItems}</span> Total Jaringan Sekolah
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-xs bg-slate-900 text-white font-bold px-3 py-1.5 rounded-lg font-mono">
                  Hal {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* --- MODAL INPUT FORM (TAMBAH / EDIT) --- */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
              <h3 className="font-bold flex items-center gap-2 text-md">
                <School size={18} /> {editMode ? 'Perbarui Profil Tenant' : 'Daftarkan Lembaga Sekolah Baru'}
              </h3>
              <button onClick={() => { setModalOpen(false); setEditMode(null); }} className="text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase">Nama Resmi Lembaga</label>
                <input
                  type="text" name="nama_sekolah" required defaultValue={editMode?.nama_sekolah || ''}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase">NPSN</label>
                <input
                  type="text" name="npsn" required defaultValue={editMode?.npsn || ''} maxLength={20}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase">Alamat Instansi</label>
                <textarea
                  name="alamat" rows={2} defaultValue={editMode?.alamat || ''}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 outline-none resize-none"
                />
              </div>

              {/* 🚩 INPUT MANUAL USERNAME & PASSWORD SUDAH DIBUANG SESUAI PERMINTAAN */}

              <div className="pt-4 border-t border-gray-100 flex justify-end gap-2">
                <button
                  type="button" onClick={() => { setModalOpen(false); setEditMode(null); }}
                  className="px-4 py-2 border border-gray-200 text-gray-500 font-bold text-xs rounded-lg hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit" disabled={submitLoading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg disabled:bg-blue-400 flex items-center gap-1"
                >
                  {submitLoading && <Loader2 className="animate-spin h-3 w-3" />}
                  {editMode ? 'Simpan Pembaruan' : 'Eksekusi & Daftarkan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- 🌟 MODAL POPUP DISPLAY KREDENSIAL AKUN (AUTO GENERATE BERHASIL) --- */}
      {successData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-emerald-100 shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 bg-emerald-600 text-white text-center space-y-2">
              <div className="mx-auto w-12 h-12 rounded-full bg-emerald-500/30 flex items-center justify-center text-xl">🎉</div>
              <h3 className="font-bold text-lg">Registrasi Tenant Berhasil!</h3>
              <p className="text-xs text-emerald-100">Sekolah &quot;{successData.namaSekolah}&quot; sukses didaftarkan.</p>
            </div>

            <div className="p-6 space-y-4 bg-white">
              <p className="text-xs text-gray-500 font-medium text-center">
                Berikut akun default yang berhasil dibuat secara otomatis. Username sekaligus berfungsi sebagai Password default:
              </p>

              {/* Box Akun Tata Usaha */}
              <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl space-y-1 relative group">
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">🏢 Akun Tata Usaha (TU)</span>
                <div className="text-sm font-mono font-bold text-slate-800 tracking-wide mt-1">
                  {successData.usernameTU}
                </div>
                <button
                  onClick={() => handleCopy(successData.usernameTU, 'tu')}
                  className="absolute right-3 top-3.5 p-1.5 text-gray-400 hover:text-slate-700 bg-white border border-gray-200 rounded-md transition"
                  title="Salin Akun"
                >
                  {copiedField === 'tu' ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                </button>
              </div>

              {/* Box Akun Operator */}
              <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl space-y-1 relative group">
                <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider block">⚡ Akun Operator (OPS)</span>
                <div className="text-sm font-mono font-bold text-slate-800 tracking-wide mt-1">
                  {successData.usernameOps}
                </div>
                <button
                  onClick={() => handleCopy(successData.usernameOps, 'ops')}
                  className="absolute right-3 top-3.5 p-1.5 text-gray-400 hover:text-slate-700 bg-white border border-gray-200 rounded-md transition"
                  title="Salin Akun"
                >
                  {copiedField === 'ops' ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                </button>
              </div>

              <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-3 text-[11px] font-medium leading-relaxed">
                ⚠️ <span className="font-bold">Pemberitahuan:</span> Segera salin/catat kredensial di atas dan berikan ke pihak sekolah untuk dilakukan penggantian kata sandi berkala demi keamanan data.
              </div>

              <button
                onClick={() => setSuccessData(null)}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition"
              >
                Selesai & Tutup Panel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}