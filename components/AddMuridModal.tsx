"use client";

import { useState } from "react";
import { addMurid } from "@/lib/actions";
import { X, UserPlus } from "lucide-react";

export default function AddMuridModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const res = await addMurid(formData);

    if (res.success) {
      setIsOpen(false);
      (e.target as HTMLFormElement).reset();
      alert("Data murid berhasil ditambahkan!");
    } else {
      alert(res.error);
    }
    setLoading(false);
  };

  return (
    <>
      <button onClick={() => setIsOpen(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-semibold shadow-md">
        <UserPlus size={18} /> Tambah Murid
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-2xl relative flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-6 border-b">
              <button onClick={() => setIsOpen(false)} className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"><X size={20} /></button>
              <h3 className="text-xl font-bold text-slate-800">Tambah Murid Baru</h3>
              <p className="text-sm text-slate-500">Masukkan data induk dengan lengkap.</p>
            </div>

            {/* Body (Scrollable) */}
            <div className="p-6 overflow-y-auto flex-1">
              <form id="add-form" onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">NISN</label>
                  <input name="nisn" type="text" placeholder="Contoh: 0012345678" required className="w-full border p-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
                  <input name="nama" type="text" placeholder="Nama sesuai ijazah" required className="w-full border p-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Kelas</label>
                    <select name="kelas" required className="w-full border p-2 rounded-lg bg-white">
                      <option value="">Pilih Kelas</option>
                      <option value="X">Kelas X</option>
                      <option value="XI">Kelas XI</option>
                      <option value="XII">Kelas XII</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Agama</label>
                    <select name="agama" required className="w-full border p-2 rounded-lg bg-white">
                      <option value="Islam">Islam</option>
                      <option value="Kristen">Kristen</option>
                      <option value="Katolik">Katolik</option>
                      <option value="Hindu">Hindu</option>
                      <option value="Budha">Budha</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Jenis Kelamin</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="jenis_kelamin" value="Laki-laki" defaultChecked className="w-4 h-4 text-blue-600" />
                      <span className="text-sm text-gray-600">Laki-laki</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="jenis_kelamin" value="Perempuan" className="w-4 h-4 text-blue-600" />
                      <span className="text-sm text-gray-600">Perempuan</span>
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tempat Lahir</label>
                    <input name="tempat_lahir" type="text" placeholder="Kota" required className="w-full border p-2 rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Lahir</label>
                    <input name="tanggal_lahir" type="date" required className="w-full border p-2 rounded-lg" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Alamat Lengkap</label>
                  <textarea name="alamat" rows={2} placeholder="Jl. Contoh No. 123..." required className="w-full border p-2 rounded-lg"></textarea>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Foto Murid (Opsional)</label>
                  <input name="foto" type="file" accept="image/*" className="w-full text-xs" />
                </div>
              </form>
            </div>

            {/* Footer */}
            <div className="p-6 border-t flex gap-2">
              <button type="button" onClick={() => setIsOpen(false)} className="flex-1 bg-gray-100 py-2.5 rounded-lg font-medium">Batal</button>
              <button form="add-form" type="submit" disabled={loading} className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg font-bold">
                {loading ? "Menyimpan..." : "Simpan Data"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}