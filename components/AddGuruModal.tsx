"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Save, UserPlus } from "lucide-react";

// Daftar Mapel sesuai revisi project SIMS
export const DAFTAR_MAPEL = [
  "PAI & BudiPekerti", "PKN", "Bahasa Indonesia", "Bahasa Inggris", 
  "Bahasa Inggris Tingkat Lanjut", "Matematika Wajib", "Matematika Tingkat Lanjut", 
  "Fisika", "Fisika Mapel Pilihan", "Biologi", "Biologi Mapel Pilihan", 
  "Kimia", "Kimia Mapel Pilihan", "Sejarah", "Sejarah Tingkat Lanjut", 
  "Geografi", "Geografi Mapel Pilihan", "Ekonomi", "Ekonomi Mapel Pilihan", 
  "Sosiologi", "Sosiologi Mapel Pilihan", "Seni Budaya", "Penjas Orkes", 
  "PKWU", "Informatika", "Bimbingan Konseling"
];

export default function AddGuruModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    
    // Kirim ke API route /api/guru
    const res = await fetch('/api/guru', {
        method: 'POST',
        body: JSON.stringify(Object.fromEntries(formData))
    });

    if (res.ok) {
      router.refresh(); 
      setIsOpen(false);
      (e.target as HTMLFormElement).reset();
    } else {
      alert("Gagal menyimpan data.");
    }
    setLoading(false);
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)} 
        className="bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-all font-bold shadow-lg shadow-blue-200 flex items-center gap-2"
      >
        <UserPlus size={18} /> Tambah Pendidik
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 text-left">
          <div className="bg-white rounded-3xl p-8 w-full max-w-2xl shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setIsOpen(false)} className="absolute right-6 top-6 text-gray-400 hover:text-gray-600">
              <X size={24} />
            </button>
            
            <h3 className="text-2xl font-black mb-6 text-slate-800 uppercase tracking-tighter">Registrasi Pendidik Baru</h3>
            
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* NAMA LENGKAP */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Nama Lengkap</label>
                <input name="nama" type="text" required className="w-full border-2 p-3 rounded-xl outline-none focus:border-blue-500 transition-all font-bold uppercase text-slate-900" />
              </div>

              {/* NIP */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1">NIP (Username)</label>
                <input name="nip" type="text" required className="w-full border-2 p-3 rounded-xl outline-none focus:border-blue-500 transition-all font-bold text-slate-900" />
              </div>

              {/* NIK */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1">NIK</label>
                <input name="nik" type="text" className="w-full border-2 p-3 rounded-xl outline-none focus:border-blue-500 transition-all font-bold text-slate-900" />
              </div>

              {/* NUPTK */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1">NUPTK</label>
                <input name="nuptk" type="text" className="w-full border-2 p-3 rounded-xl outline-none focus:border-blue-500 transition-all font-bold text-slate-900" />
              </div>

              {/* JENIS KELAMIN */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Jenis Kelamin</label>
                <select name="gender" required className="w-full border-2 p-3 rounded-xl outline-none focus:border-blue-500 bg-white font-black text-xs uppercase text-slate-900">
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                </select>
              </div>

              {/* TANGGAL LAHIR */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Tgl Lahir</label>
                <input name="tgl_lahir" type="date" required className="w-full border-2 p-3 rounded-xl outline-none focus:border-blue-500 transition-all font-bold text-slate-900" />
              </div>

              {/* JENIS PEGAWAI (REVISI TERBARU) */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Jenis Pegawai</label>
                <select name="jenis" required className="w-full border-2 p-3 rounded-xl outline-none focus:border-blue-500 bg-white font-black text-xs uppercase text-slate-900">
                    <option value="Guru">Guru</option>
                    <option value="Kepala Sekolah">Kepala Sekolah</option>
                    <option value="Wakil Kurikulum">Wakil Kurikulum</option>
                    <option value="Wakil Kesiswaan">Wakil Kesiswaan</option>
                    <option value="Tenaga Kependidikan">Tenaga Kependidikan</option>
                </select>
              </div>

              {/* STATUS KEPEGAWAIAN */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Status Kepegawaian</label>
                <select name="status" required className="w-full border-2 p-3 rounded-xl outline-none focus:border-blue-500 bg-white font-black text-xs uppercase text-slate-900">
                    <option value="PNS">PNS</option>
                    <option value="PPPK">PPPK</option>
                    <option value="Guru Honor Sekolah">Guru Honor Sekolah</option>
                    <option value="Tenaga Honor Sekolah">Tenaga Honor Sekolah</option>
                </select>
              </div>

              {/* MATA PELAJARAN */}
              <div className="space-y-1 md:col-span-2">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Mata Pelajaran Diampu</label>
                <select name="mapel" required className="w-full border-2 p-3 rounded-xl outline-none focus:border-blue-500 bg-white font-black text-xs uppercase text-slate-900">
                  <option value="">-- Pilih Mata Pelajaran --</option>
                  {DAFTAR_MAPEL.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>

              {/* SEKOLAH INDUK */}
              <div className="space-y-2 md:col-span-2 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <label className="text-[10px] font-black text-slate-500 uppercase block ml-1">Sekolah Induk</label>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer font-black text-slate-900 text-xs">
                    <input type="radio" name="sekolah_induk" value="Ya" defaultChecked className="w-4 h-4 accent-blue-600" /> YA
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-black text-slate-900 text-xs">
                    <input type="radio" name="sekolah_induk" value="Tidak" className="w-4 h-4 accent-blue-600" /> TIDAK
                  </label>
                </div>
              </div>

              {/* ACTIONS */}
              <div className="flex gap-4 pt-4 md:col-span-2">
                <button 
                  type="button" 
                  onClick={() => setIsOpen(false)} 
                  className="flex-1 bg-slate-100 py-3 rounded-xl hover:bg-slate-200 transition font-black text-slate-500 uppercase text-[10px]"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={loading} 
                  className="flex-[2] bg-blue-600 text-white py-3 rounded-xl font-black hover:bg-blue-700 transition flex items-center justify-center gap-2 uppercase text-[10px] shadow-lg shadow-blue-100"
                >
                  <Save size={18} /> {loading ? "Menyimpan..." : "Simpan Data Guru"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}