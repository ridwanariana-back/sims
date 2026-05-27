"use client";

import { useState } from "react";
import { GraduationCap, Plus, Trash2, Search, ChevronLeft, ChevronRight, Briefcase, Landmark } from "lucide-react";
import { createAlumni, deleteAlumni } from "@/lib/actions";
import { useRouter } from "next/navigation";

interface AlumniClientProps {
  sekolahId: number;
  initialAlumni: any[];
  allMurid: any[];
}

export default function AlumniClientView({ sekolahId, initialAlumni, allMurid }: AlumniClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const limitPerPage = 10;

  // Form State
  const currentYear = new Date().getFullYear();
  const [muridId, setMuridId] = useState("");
  const [tahunLulus, setTahunLulus] = useState(currentYear.toString());
  const [klaster, setKlaster] = useState("KULIAH");
  const [instansi, setInstansi] = useState("");
  const [detailStatus, setDetailStatus] = useState("");
  const [jalur, setJalur] = useState("");

  const daftarTahun = Array.from({ length: 21 }, (_, index) => (currentYear - index).toString());

  const handleDelete = async (id: number) => {
    if (confirm("Hapus track records alumni ini?")) {
      const res = await deleteAlumni(id, sekolahId);
      if (res.success) {
        alert("Data alumni berhasil dihapus!");
        router.refresh();
      } else {
        alert("Gagal menghapus data.");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!muridId) return alert("Silakan pilih siswa!");
    setLoading(true);

    const payload = { murid_id: muridId, tahun_lulus: tahunLulus, klaster, instansi, detail_status: detailStatus, jalur };

    const res = await createAlumni(payload, sekolahId);
    if (res.success) {
      alert("Data alumni berhasil disimpan!");
      setIsOpen(false);
      // Reset Form
      setMuridId("");
      setInstansi("");
      setDetailStatus("");
      setJalur("");
      setCurrentPage(1);
      router.refresh();
    } else {
      alert(res.message || "Terjadi kesalahan.");
    }
    setLoading(false);
  };

  // Filter Data Berdasarkan Nama / Instansi / Klaster
  const filteredAlumni = initialAlumni.filter(item => 
    item.nama_murid.toLowerCase().includes(search.toLowerCase()) ||
    item.instansi.toLowerCase().includes(search.toLowerCase()) ||
    item.klaster.toLowerCase().includes(search.toLowerCase())
  );

  // Logika Pagination
  const totalPages = Math.ceil(filteredAlumni.length / limitPerPage);
  const startIndex = (currentPage - 1) * limitPerPage;
  const paginatedAlumni = filteredAlumni.slice(startIndex, startIndex + limitPerPage);

  return (
    <>
      {/* HEADER */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
            <GraduationCap className="text-blue-600" size={28} /> Penelusuran Alumni (Tracer Study)
          </h1>
          <p className="text-slate-500 text-sm">Pelacakan aktivitas dan klasterisasi alumni setelah kelulusan</p>
        </div>
        <button
          onClick={() => setIsOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-3 rounded-2xl flex items-center gap-2 shadow-sm transition-all text-sm"
        >
          <Plus size={18} /> Daftarkan Alumni
        </button>
      </div>

      {/* FILTER SEARCH */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 mb-6 flex items-center gap-3 shadow-sm">
        <Search className="text-slate-400" size={20} />
        <input 
          type="text"
          placeholder="Cari nama alumni, nama kampus, atau nama perusahaan..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
          className="w-full bg-transparent outline-none text-slate-700 text-sm"
        />
      </div>

      {/* TABEL DATA */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-black uppercase text-slate-500 tracking-wider">
                <th className="p-4 pl-6">Alumni</th>
                <th className="p-4">Tahun Lulus</th>
                <th className="p-4">Klaster</th>
                <th className="p-4">Nama Instansi / Tempat</th>
                <th className="p-4">Detail Prodi / Jabatan</th>
                <th className="p-4">Jalur</th>
                <th className="p-4 text-center pr-6">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700 font-medium">
              {paginatedAlumni.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-slate-400 font-bold uppercase text-xs">
                    Belum ada data pelacakan alumni.
                  </td>
                </tr>
              ) : (
                paginatedAlumni.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 pl-6">
                      <p className="font-bold text-slate-900">{item.nama_murid}</p>
                      <p className="text-[11px] text-slate-400 font-mono">NISN: {item.nisn || "-"}</p>
                    </td>
                    <td className="p-4 font-mono font-bold text-slate-600">{item.tahun_lulus}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 text-[10px] font-black rounded-md ${
                        item.klaster === 'KULIAH' ? 'bg-purple-50 text-purple-600 border border-purple-100' :
                        item.klaster === 'KERJA' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
                      }`}>
                        {item.klaster}
                      </span>
                    </td>
                    <td className="p-4 text-slate-800 font-semibold">{item.instansi}</td>
                    <td className="p-4 text-slate-600">{item.detail_status || "-"}</td>
                    <td className="p-4">
                      <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded font-bold">
                        {item.jalur || "-"}
                      </span>
                    </td>
                    <td className="p-4 text-center pr-6">
                      <button 
                        onClick={() => handleDelete(item.id)}
                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION CONTROLLER */}
        {totalPages > 1 && (
          <div className="bg-white px-6 py-4 border-t border-slate-100 flex items-center justify-between">
            <p className="text-xs text-slate-500 font-semibold">
              Menampilkan <span className="font-bold text-slate-700">{startIndex + 1}</span> - <span className="font-bold text-slate-700">{Math.min(startIndex + limitPerPage, filteredAlumni.length)}</span> dari <span className="font-bold text-slate-700">{filteredAlumni.length}</span> alumni
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 rounded-xl text-xs font-black ${currentPage === page ? "bg-blue-600 text-white" : "border border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL FORM INPUT ALUMNI */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-4 flex items-center gap-2">
              <GraduationCap className="text-blue-600" size={24} /> Input Data Alumni
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Pilih Murid */}
              <div>
                <label className="block text-xs font-black uppercase text-slate-400 tracking-wider mb-1">Nama Siswa / Alumni</label>
                <select
                  value={muridId}
                  onChange={(e) => setMuridId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-semibold outline-none focus:border-blue-500"
                  required
                >
                  <option value="">-- Pilih Siswa --</option>
                  {allMurid
  // Filter: Hanya tampilkan murid yang ID-nya BELUM ADA di dalam daftar alumni saat ini
  .filter(m => !initialAlumni.some(alumni => alumni.murid_id === m.id))
  .map(m => (
    <option key={m.id} value={m.id}>
      {m.nama} [NISN: {m.nisn || '-'}]
    </option>
  ))
}
                </select>
              </div>

              {/* Grid Tahun Lulus & Klaster */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black uppercase text-slate-400 tracking-wider mb-1">Tahun Lulus</label>
                  <select
                    value={tahunLulus}
                    onChange={(e) => setTahunLulus(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-semibold outline-none focus:border-blue-500"
                    required
                  >
                    {daftarTahun.map(yr => (
                      <option key={yr} value={yr}>{yr}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase text-slate-400 tracking-wider mb-1">Klaster Aktivitas</label>
                  <select
                    value={klaster}
                    onChange={(e) => setKlaster(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-semibold outline-none focus:border-blue-500"
                    required
                  >
                    <option value="KULIAH">KULIAH</option>
                    <option value="KERJA">KERJA</option>
                    <option value="WIRAUSAHA">WIRAUSAHA</option>
                    <option value="LAINNYA">LAINNYA</option>
                  </select>
                </div>
              </div>

              {/* Instansi Tempat */}
              <div>
                <label className="block text-xs font-black uppercase text-slate-400 tracking-wider mb-1">
                  {klaster === "KULIAH" ? "Nama Universitas / Kampus" : klaster === "KERJA" ? "Nama PT / Perusahaan" : "Nama Usaha / Keterangan"}
                </label>
                <input 
                  type="text" 
                  value={instansi} 
                  onChange={(e) => setInstansi(e.target.value)}
                  placeholder={klaster === "KULIAH" ? "Contoh: Universitas Sriwijaya" : "Contoh: PT. Telkom Indonesia"}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-semibold outline-none focus:border-blue-500"
                  required
                />
              </div>

              {/* Detail Status (Prodi / Jabatan) */}
              <div>
                <label className="block text-xs font-black uppercase text-slate-400 tracking-wider mb-1">
                  {klaster === "KULIAH" ? "Program Studi / Jurusan" : "Posisi / Jabatan Pekerjaan"}
                </label>
                <input 
                  type="text" 
                  value={detailStatus} 
                  onChange={(e) => setDetailStatus(e.target.value)}
                  placeholder={klaster === "KULIAH" ? "Contoh: Sistem Informasi" : "Contoh: Full Stack Developer"}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-semibold outline-none focus:border-blue-500"
                />
              </div>

              {/* Jalur Masuk */}
              <div>
                <label className="block text-xs font-black uppercase text-slate-400 tracking-wider mb-1">Jalur Masuk / Rekrutmen</label>
                <input 
                  type="text" 
                  value={jalur} 
                  onChange={(e) => setJalur(e.target.value)}
                  placeholder="Contoh: SNBP, UTBK, Mandiri, Professional Hiring"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-semibold outline-none focus:border-blue-500"
                />
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 py-3 text-slate-600 hover:bg-slate-100 font-bold text-sm rounded-xl transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-all disabled:bg-slate-300"
                >
                  {loading ? "Menyimpan..." : "Simpan Data"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}