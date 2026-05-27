"use client";

import { useState } from "react";
import { Trophy, Plus, Trash2, Search, Award, ChevronLeft, ChevronRight } from "lucide-react";
import { createPrestasi, deletePrestasi } from "@/lib/actions";
import { useRouter } from "next/navigation";

interface PrestasiClientProps {
  sekolahId: number;
  initialPrestasi: any[];
  allMurid: any[];
  allGuru: any[];
}

export default function PrestasiClientView({ sekolahId, initialPrestasi, allMurid, allGuru }: PrestasiClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // === STATE PAGINATION ===
  const [currentPage, setCurrentPage] = useState(1);
  const limitPerPage = 10; // Kamu bisa ganti angka ini untuk mengatur jumlah data per halaman

  // === STATE FORM MODAL ===
  const currentYear = new Date().getFullYear();
  const [kategori, setKategori] = useState<"MURID" | "GURU">("MURID");
  const [pemilikId, setPemilikId] = useState("");
  const [lomba, setLomba] = useState("");
  const [tingkat, setTingkat] = useState("KABUPATEN/KOTA");
  const [juara, setJuara] = useState("");
  const [tahun, setTahun] = useState(currentYear.toString());

  // === LOGIKA GENERATE 20 TAHUN KE BELAKANG ===
  const daftarTahun = Array.from({ length: 21 }, (_, index) => (currentYear - index).toString());

  // Handle Hapus
  const handleDelete = async (id: number) => {
    if (confirm("Apakah Anda yakin ingin menghapus data prestasi ini?")) {
      const res = await deletePrestasi(id, sekolahId);
      if (res.success) {
        alert("Prestasi berhasil dihapus!");
        router.refresh();
      } else {
        alert("Gagal menghapus data.");
      }
    }
  };

  // Handle Simpan Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pemilikId) return alert("Silakan pilih nama pemilik prestasi!");
    setLoading(true);

    const payload = {
      kategori_pemilik: kategori,
      pemilik_id: pemilikId,
      lomba,
      tingkat,
      juara,
      tahun
    };

    const res = await createPrestasi(payload, sekolahId);
    if (res.success) {
      alert("Prestasi berhasil ditambahkan!");
      setIsOpen(false);
      // Reset Form
      setPemilikId("");
      setLomba("");
      setJuara("");
      setTahun(currentYear.toString());
      setCurrentPage(1); // Balik ke halaman 1 biar kelihatan data barunya
      router.refresh();
    } else {
      alert(res.message || "Terjadi kesalahan.");
    }
    setLoading(false);
  };

  // === LOGIKA FILTER & PAGINATION DATA ===
  const filteredPrestasi = initialPrestasi.filter(item => 
    item.nama_display.toLowerCase().includes(search.toLowerCase()) ||
    item.lomba.toLowerCase().includes(search.toLowerCase())
  );

  // Hitung total halaman
  const totalPages = Math.ceil(filteredPrestasi.length / limitPerPage);
  
  // Potong data sesuai halaman aktif saat ini
  const startIndex = (currentPage - 1) * limitPerPage;
  const endIndex = startIndex + limitPerPage;
  const paginatedPrestasi = filteredPrestasi.slice(startIndex, endIndex);

  // Fungsi navigasi page
  const handlePageChange = (pageNumber: number) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  return (
    <>
      {/* HEADER */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
            <Trophy className="text-amber-500" size={28} /> Data Prestasi
          </h1>
          <p className="text-slate-500 text-sm">Catatan pencapaian resmi civitas akademika sekolah</p>
        </div>
        <button
          onClick={() => setIsOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-3 rounded-2xl flex items-center gap-2 shadow-sm transition-all self-start sm:self-auto text-sm"
        >
          <Plus size={18} /> Tambah Prestasi
        </button>
      </div>

      {/* FILTER SEARCH */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 mb-6 flex items-center gap-3 shadow-sm">
        <Search className="text-slate-400" size={20} />
        <input 
          type="text"
          placeholder="Cari nama orang atau nama kompetisi..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1); // Reset ke halaman 1 kalau user mengetik pencarian baru
          }}
          className="w-full bg-transparent outline-none text-slate-700 text-sm"
        />
      </div>

      {/* TABEL DATA */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-black uppercase text-slate-500 tracking-wider">
                <th className="p-4 pl-6">Kategori</th>
                <th className="p-4">Nama Lengkap</th>
                <th className="p-4">Detail Lomba / Penghargaan</th>
                <th className="p-4">Tingkat</th>
                <th className="p-4">Pencapaian</th>
                <th className="p-4">Tahun</th>
                <th className="p-4 text-center pr-6">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700 font-medium">
              {paginatedPrestasi.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-slate-400 font-bold uppercase text-xs">
                    Belum ada data prestasi yang terekam.
                  </td>
                </tr>
              ) : (
                paginatedPrestasi.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 pl-6">
                      <span className={`px-2 py-1 text-[10px] font-black rounded-md ${
                        item.kategori_pemilik === 'MURID' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                      }`}>
                        {item.kategori_pemilik}
                      </span>
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-slate-900">{item.nama_display}</p>
                      <p className="text-[11px] text-slate-400 font-semibold">{item.info_display}</p>
                    </td>
                    <td className="p-4 text-slate-600 font-semibold">{item.lomba}</td>
                    <td className="p-4">
                      <span className="bg-slate-100 text-slate-700 text-[11px] font-bold px-2 py-0.5 rounded">
                        {item.tingkat}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-amber-600 flex items-center gap-1">
                      <Award size={16} /> {item.juara}
                    </td>
                    <td className="p-4 font-mono font-bold">{item.tahun}</td>
                    <td className="p-4 text-center pr-6">
                      <button 
                        onClick={() => handleDelete(item.id)}
                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
                        title="Hapus Data"
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

        {/* === UI CONTROLLER PAGINATION === */}
        {totalPages > 1 && (
          <div className="bg-white px-6 py-4 border-t border-slate-100 flex items-center justify-between">
            <p className="text-xs text-slate-500 font-semibold">
              Menampilkan <span className="font-bold text-slate-700">{startIndex + 1}</span> sampai{" "}
              <span className="font-bold text-slate-700">{Math.min(endIndex, filteredPrestasi.length)}</span> dari{" "}
              <span className="font-bold text-slate-700">{filteredPrestasi.length}</span> data prestasi
            </p>
            
            <div className="flex items-center gap-1">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`w-8 h-8 rounded-xl text-xs font-black transition-all ${
                    currentPage === page
                      ? "bg-blue-600 text-white shadow-sm"
                      : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL FORM INPUT */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-4 flex items-center gap-2">
              <Trophy className="text-blue-500" size={22} /> Form Tambah Prestasi
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Kategori Pemilik */}
              <div>
                <label className="block text-xs font-black uppercase text-slate-400 tracking-wider mb-1.5">Kategori Pemilik</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => { setKategori("MURID"); setPemilikId(""); }}
                    className={`py-2.5 text-xs font-black rounded-xl border transition-all ${
                      kategori === "MURID" ? "bg-blue-50 text-blue-600 border-blue-300 ring-2 ring-blue-100" : "border-slate-200 text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    SISWA / MURID
                  </button>
                  <button
                    type="button"
                    onClick={() => { setKategori("GURU"); setPemilikId(""); }}
                    className={`py-2.5 text-xs font-black rounded-xl border transition-all ${
                      kategori === "GURU" ? "bg-emerald-50 text-emerald-600 border-emerald-300 ring-2 ring-emerald-100" : "border-slate-200 text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    GURU / TENAGA PENDIDIK
                  </button>
                </div>
              </div>

              {/* Dropdown Dinamis */}
              <div>
                <label className="block text-xs font-black uppercase text-slate-400 tracking-wider mb-1">
                  Pilih {kategori === "MURID" ? "Nama Siswa" : "Nama Guru"}
                </label>
                <select
                  value={pemilikId}
                  onChange={(e) => setPemilikId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-semibold outline-none focus:border-blue-500 transition-colors"
                  required
                >
                  <option value="">-- Pilih Personel --</option>
                  {kategori === "MURID" 
                    ? allMurid.map(m => (
                        <option key={m.id} value={m.id}>{m.nama} ({m.rombel})</option>
                      ))
                    : allGuru.map(g => (
                        <option key={g.id} value={g.id}>{g.nama} {g.nip ? `[NIP: ${g.nip}]` : ''}</option>
                      ))
                  }
                </select>
              </div>

              {/* Nama Lomba */}
              <div>
                <label className="block text-xs font-black uppercase text-slate-400 tracking-wider mb-1">Nama Lomba / Penghargaan</label>
                <input 
                  type="text" 
                  value={lomba} 
                  onChange={(e) => setLomba(e.target.value)}
                  placeholder="Contoh: Olimpiade Sains Nasional (OSN) Biologi"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-semibold outline-none focus:border-blue-500"
                  required
                />
              </div>

              {/* Grid Tingkat & Tahun (REVISI DROPDOWN TAHUN) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black uppercase text-slate-400 tracking-wider mb-1">Tingkat</label>
                  <select
                    value={tingkat}
                    onChange={(e) => setTingkat(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-semibold outline-none"
                  >
                    <option value="KECAMATAN">Kecamatan</option>
                    <option value="KABUPATEN/KOTA">Kabupaten/Kota</option>
                    <option value="PROVINSI">Provinsi</option>
                    <option value="NASIONAL">Nasional</option>
                    <option value="INTERNASIONAL">Internasional</option>
                  </select>
                </div>

                {/* 🔥 REVISI: Dropdown Tahun Terbatas 20 Tahun ke Belakang */}
                <div>
                  <label className="block text-xs font-black uppercase text-slate-400 tracking-wider mb-1">Tahun Perolehan</label>
                  <select
                    value={tahun}
                    onChange={(e) => setTahun(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-semibold outline-none focus:border-blue-500"
                    required
                  >
                    {daftarTahun.map((yr) => (
                      <option key={yr} value={yr}>
                        {yr}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Pencapaian / Juara */}
              <div>
                <label className="block text-xs font-black uppercase text-slate-400 tracking-wider mb-1">Pencapaian / Juara</label>
                <input 
                  type="text" 
                  value={juara} 
                  onChange={(e) => setJuara(e.target.value)}
                  placeholder="Contoh: Juara 1, Medali Emas, Harapan 2"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-semibold outline-none focus:border-blue-500"
                  required
                />
              </div>

              {/* Tombol Aksi */}
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