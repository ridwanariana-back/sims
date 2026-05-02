"use client";

import { useState } from "react";
import { X, Save, UserPlus, GraduationCap, Calendar, Heart, Fingerprint } from "lucide-react";
import { useRouter } from "next/navigation";

// Daftar Kelas & Rombel sesuai kebutuhan sekolah
const DAFTAR_KELAS = ["X", "XI", "XII"];
const DAFTAR_ROMBEL = [
  "X.1", "X.2", "X.3", "X.4", 
  "XI.F1", "XI.F2", "XI.F3", "XI.F4", 
  "XII.F1", "XII.F2", "XII.F3", "XII.F4"
];

export default function AddMuridModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    try {
      const res = await fetch("/api/murid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        setIsOpen(false);
        router.refresh();
        (e.target as HTMLFormElement).reset();
      } else {
        const errorData = await res.json();
        alert(errorData.error || "Gagal menambahkan data murid");
      }
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan sistem");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Tombol Pemicu di Halaman Datamurid */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-black transition-all shadow-lg shadow-blue-200 uppercase text-sm"
      >
        <UserPlus size={20} />
        Tambah Murid
      </button>

      {/* Backdrop & Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-2xl shadow-2xl relative max-h-[90vh] overflow-y-auto border-4 border-white">
            <button 
              onClick={() => setIsOpen(false)} 
              className="absolute right-6 top-6 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={24} />
            </button>

            <div className="mb-8">
              <h3 className="text-2xl font-black text-slate-900 uppercase flex items-center gap-3">
                <GraduationCap className="text-blue-600" size={28} />
                Registrasi Siswa Baru
              </h3>
              <p className="text-slate-500 text-[10px] font-black mt-1 uppercase tracking-[0.2em]">
                Manajemen Data Pendidik & Kependidikan
              </p>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* NAMA LENGKAP */}
              <div className="space-y-1 md:col-span-2">
                <label className="text-[10px] font-black text-slate-500 uppercase">Nama Lengkap Siswa</label>
                <input
                  name="nama"
                  type="text"
                  required
                  placeholder="MASUKKAN NAMA LENGKAP"
                  className="w-full border-2 p-3.5 rounded-xl outline-none focus:border-blue-500 font-black text-slate-900 uppercase bg-slate-50 focus:bg-white transition-all"
                />
              </div>

              {/* NISN & NIK */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase">NISN</label>
                <input
                  name="nisn"
                  type="text"
                  required
                  placeholder="10 DIGIT NOMOR"
                  className="w-full border-2 p-3.5 rounded-xl outline-none focus:border-blue-500 font-black text-slate-900 bg-slate-50 focus:bg-white transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase">NIK (KTP/KK)</label>
                <input
                  name="nik"
                  type="text"
                  placeholder="16 DIGIT NOMOR"
                  className="w-full border-2 p-3.5 rounded-xl outline-none focus:border-blue-500 font-black text-slate-900 bg-slate-50 focus:bg-white transition-all"
                />
              </div>

              {/* GENDER & TGL LAHIR */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase">Jenis Kelamin</label>
                <select 
                  name="gender" 
                  className="w-full border-2 p-3.5 rounded-xl font-black bg-white text-slate-900 appearance-none outline-none focus:border-blue-500"
                >
                  <option value="LAKI-LAKI">LAKI-LAKI</option>
                  <option value="PEREMPUAN">PEREMPUAN</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase">Tanggal Lahir</label>
                <div className="relative">
                  <input
                    name="tgl_lahir"
                    type="date"
                    required
                    className="w-full border-2 p-3.5 rounded-xl outline-none focus:border-blue-500 font-black text-slate-900 bg-slate-50 focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* NAMA IBU KANDUNG */}
              <div className="space-y-1 md:col-span-2">
                <label className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-1">
                  <Heart size={12} className="text-red-500" /> Nama Ibu Kandung
                </label>
                <input
                  name="nama_ibu"
                  type="text"
                  required
                  placeholder="NAMA IBU KANDUNG"
                  className="w-full border-2 p-3.5 rounded-xl outline-none focus:border-blue-500 font-black text-slate-900 uppercase bg-slate-50 focus:bg-white transition-all"
                />
              </div>

              {/* KELAS & ROMBEL */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase">Tingkat Kelas</label>
                <select 
                  name="kelas" 
                  className="w-full border-2 p-3.5 rounded-xl font-black bg-white text-slate-900 outline-none focus:border-blue-500"
                >
                  {DAFTAR_KELAS.map((k) => <option key={k} value={k}>{k}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase">Rombel</label>
                <select 
                  name="rombel" 
                  className="w-full border-2 p-3.5 rounded-xl font-black bg-white text-slate-900 outline-none focus:border-blue-500"
                >
                  {DAFTAR_ROMBEL.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              {/* BUTTONS */}
              <div className="flex gap-4 pt-6 md:col-span-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 bg-slate-100 py-4 rounded-2xl font-black text-slate-600 uppercase hover:bg-slate-200 transition-all text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-[2] bg-blue-600 text-white py-4 rounded-2xl font-black hover:bg-blue-700 transition-all flex items-center justify-center gap-2 uppercase shadow-lg shadow-blue-200 text-xs disabled:opacity-50"
                >
                  <Save size={18} />
                  {loading ? "Proses Menyimpan..." : "Simpan Data Murid"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}