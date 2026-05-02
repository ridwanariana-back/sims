"use client";

import { useState, useMemo } from "react";
import { Trash2, Plus, X, ShieldCheck, Edit3, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";

const DAFTAR_ROMBEL = ["X.1", "X.2", "X.3", "X.4", "XI.F1", "XI.F2", "XI.F3", "XI.F4", "XII.F1", "XII.F2", "XII.F3", "XII.F4"];

export default function WaliKelasTable({ allGuru, currentWali, isReadOnly = false }: { allGuru?: any[], currentWali: any[], isReadOnly?: boolean }) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [editingData, setEditingData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // STATE UNTUK SEARCH & PAGINATION
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const d = new Date();
  const TAHUN_AKTIF = d.getMonth() + 1 > 6 ? `${d.getFullYear()}/${d.getFullYear() + 1}` : `${d.getFullYear() - 1}/${d.getFullYear()}`;
  
  // Filter data berdasarkan context (Aktif vs Riwayat)
  const displayData = isReadOnly 
    ? currentWali.filter(wk => wk.tahun_ajaran !== TAHUN_AKTIF)
    : currentWali.filter(wk => wk.tahun_ajaran === TAHUN_AKTIF);

  // LOGIKA SEARCH
  const filteredData = useMemo(() => {
    return displayData.filter(wk => 
      wk.nama_guru.toLowerCase().includes(searchTerm.toLowerCase()) ||
      wk.nip?.includes(searchTerm) ||
      wk.rombel.toLowerCase().includes(searchTerm.toLowerCase()) ||
      wk.tahun_ajaran.includes(searchTerm)
    );
  }, [displayData, searchTerm]);

  // LOGIKA PAGINATION
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);

  // Dropdown filter untuk Modal
  const availableGuru = allGuru?.filter(g => !displayData.some(wk => wk.guru_id === g.id)) || [];
  const availableRombelTambah = DAFTAR_ROMBEL.filter(r => !displayData.some(wk => wk.rombel === r));
  const availableRombelEdit = DAFTAR_ROMBEL.filter(r => !displayData.some(wk => wk.rombel === r) || (editingData && r === editingData.rombel));

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const isEdit = !!editingData;

    const res = await fetch("/api/walikelas", {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editingData?.id,
        guru_id: isEdit ? editingData.guru_id : formData.get("guru_id"),
        rombel: formData.get("rombel"),
        tahun_ajaran: TAHUN_AKTIF
      }),
    });

    if (res.ok) { setShowModal(false); setEditingData(null); router.refresh(); }
    else { const err = await res.json(); alert(err.error); }
    setLoading(false);
  };

  return (
    <div className="space-y-6 text-left">
      {/* TOOLBAR: SEARCH & ACTION */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text"
            placeholder="Cari Nama, NIP, atau Rombel..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-slate-100 focus:border-blue-500 outline-none font-bold text-xs uppercase transition-all shadow-sm"
          />
        </div>

        {!isReadOnly && (
          <button onClick={() => setShowModal(true)} className="w-full md:w-auto bg-blue-600 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-200">
            <Plus size={20} /> Tentukan Wali Kelas
          </button>
        )}
      </div>

      {/* TABEL UTAMA */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 font-black text-slate-500 text-[10px] uppercase tracking-widest">
              <th className="px-8 py-5">Nama Guru Pengampu</th>
              <th className="px-8 py-5 text-center">Rombel</th>
              <th className="px-8 py-5 text-center">Periode</th>
              {!isReadOnly && <th className="px-8 py-5 text-center">Aksi</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-black text-slate-900 uppercase text-sm">
            {currentItems.length === 0 ? (
              <tr><td colSpan={isReadOnly ? 3 : 4} className="px-8 py-10 text-center text-slate-300 italic font-bold">Data tidak ditemukan.</td></tr>
            ) : (
              currentItems.map((wk) => (
                <tr key={wk.id} className="hover:bg-slate-50 transition-all">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600"><ShieldCheck size={22}/></div>
                      <div>
                        <p className="leading-tight">{wk.nama_guru}</p>
                        <p className="text-[10px] text-slate-400 font-bold mt-0.5">NIP: {wk.nip || '-'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <span className="bg-slate-900 text-white px-4 py-1.5 rounded-xl text-[11px] border-2 border-slate-800">{wk.rombel}</span>
                  </td>
                  <td className="px-8 py-6 text-center text-slate-400 text-xs font-bold">{wk.tahun_ajaran}</td>
                  {!isReadOnly && (
                    <td className="px-8 py-6 text-center">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => setEditingData(wk)} className="p-2.5 border-2 border-slate-100 text-amber-500 hover:border-amber-500 rounded-xl transition-all bg-white"><Edit3 size={18} /></button>
                        <button onClick={async () => { if(confirm('Hapus status wali kelas?')) { await fetch(`/api/walikelas?id=${wk.id}`, {method:'DELETE'}); router.refresh(); }}} className="p-2.5 border-2 border-slate-100 text-red-600 hover:border-red-600 rounded-xl transition-all bg-white"><Trash2 size={18} /></button>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* PAGINATION FOOTER */}
        <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black text-slate-400 uppercase">Tampilkan</span>
            <select 
              value={itemsPerPage} 
              onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
              className="bg-white border-2 border-slate-200 rounded-xl px-3 py-1.5 font-black text-xs outline-none focus:border-blue-500"
            >
              {[5, 10, 20, 50].map(val => <option key={val} value={val}>{val}</option>)}
            </select>
            <span className="text-[10px] font-black text-slate-400 uppercase">Data Per Halaman</span>
          </div>

          <div className="flex items-center gap-2">
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => prev - 1)}
              className="p-2 rounded-xl bg-white border-2 border-slate-100 text-slate-400 disabled:opacity-30 hover:border-blue-500 hover:text-blue-600 transition-all"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="flex gap-1">
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-10 h-10 rounded-xl font-black text-xs transition-all ${currentPage === i + 1 ? 'bg-blue-600 text-white shadow-md shadow-blue-100' : 'bg-white border-2 border-slate-100 text-slate-400 hover:border-slate-300'}`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <button 
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => setCurrentPage(prev => prev + 1)}
              className="p-2 rounded-xl bg-white border-2 border-slate-100 text-slate-400 disabled:opacity-30 hover:border-blue-500 hover:text-blue-600 transition-all"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* MODAL (Tambah/Edit) */}
      {(showModal || editingData) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 text-left">
          <div className="bg-white rounded-[40px] p-10 w-full max-w-lg border-4 border-white shadow-2xl">
            <div className="flex justify-between items-start mb-8">
              <h3 className="text-2xl font-black text-slate-900 uppercase">{editingData ? "Update Rombel" : "Pilih Wali Kelas"}</h3>
              <button onClick={() => {setShowModal(false); setEditingData(null)}} className="text-slate-300 hover:text-slate-900"><X size={28} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Guru Pengampu</label>
                {editingData ? (
                  <div className="w-full border-2 border-slate-100 p-4 rounded-2xl font-black text-slate-400 bg-slate-50 uppercase">
                    <p className="text-[9px] text-slate-300">NIP: {editingData.nip}</p>
                    {editingData.nama_guru}
                  </div>
                ) : (
                  <select name="guru_id" required className="w-full border-2 p-4 rounded-2xl font-black text-slate-900 bg-slate-50 focus:border-blue-500 outline-none uppercase text-xs">
                    <option value="">-- PILIH GURU --</option>
                    {availableGuru.map(g => (
                      <option key={g.id} value={g.id}>{g.nip ? `${g.nip} - ` : ''}{g.nama}</option>
                    ))}
                  </select>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Rombongan Belajar</label>
                <select name="rombel" defaultValue={editingData?.rombel} required className="w-full border-2 p-4 rounded-2xl font-black text-slate-900 bg-slate-50 focus:border-blue-500 outline-none">
                  <option value="">-- PILIH ROMBEL --</option>
                  {(editingData ? availableRombelEdit : availableRombelTambah).map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="flex gap-4 pt-6">
                <button type="button" onClick={() => {setShowModal(false); setEditingData(null)}} className="flex-1 bg-slate-100 py-4 rounded-2xl font-black text-slate-500 uppercase text-xs">Batal</button>
                <button type="submit" disabled={loading} className={`flex-[2] py-4 rounded-2xl font-black text-white uppercase text-xs shadow-lg ${editingData ? 'bg-amber-500 hover:bg-amber-600' : 'bg-blue-600 hover:bg-blue-700'}`}>
                  {loading ? "Proses..." : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}