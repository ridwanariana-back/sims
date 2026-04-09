"use client";

import { useState } from "react";
import { addGuru } from "@/lib/actions";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";

// Daftar Mapel (Pastikan sama dengan yang ada di GuruTable)
const DAFTAR_MAPEL = [
  "Matematika",
  "Bahasa Indonesia",
  "Bahasa Inggris",
  "IPA",
  "IPS",
  "PJOK",
  "Seni Budaya",
  "Informatika"
];

export default function AddGuruModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const res = await addGuru(formData);

    if (res.success) {
      router.refresh(); 
      setIsOpen(false);
      (e.target as HTMLFormElement).reset();
    } else {
      alert(res.error);
    }
    setLoading(false);
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)} 
        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-semibold shadow-sm"
      >
        + Tambah Guru
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl relative">
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>

            <h3 className="text-xl font-bold mb-4 text-slate-800">Tambah Data Guru</h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">NIP</label>
                <input 
                  name="nip" 
                  type="text" 
                  placeholder="Masukkan NIP"
                  required 
                  className="w-full border p-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all" 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
                <input 
                  name="nama" 
                  type="text" 
                  placeholder="Nama Lengkap"
                  required 
                  className="w-full border p-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all" 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Jenis Kelamin</label>
                <div className="flex gap-6 p-2 border rounded-lg bg-slate-50">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="radio" name="gender" value="Laki-laki" required /> Laki-laki
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="radio" name="gender" value="Perempuan" required /> Perempuan
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mata Pelajaran</label>
                <select 
                  name="mapel" 
                  required 
                  className="w-full border p-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer"
                >
                  <option value="">Pilih Mata Pelajaran</option>
                  {DAFTAR_MAPEL.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 pt-4">
                <button 
                  type="button" 
                  onClick={() => setIsOpen(false)} 
                  className="flex-1 bg-gray-100 py-2 rounded-lg hover:bg-gray-200 transition font-medium"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={loading} 
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700 transition disabled:opacity-50"
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