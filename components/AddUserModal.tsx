"use client";

import { useState } from "react";
import { createUserAccount } from "@/lib/actions";
import { X, UserPlus } from "lucide-react";

interface Guru {
  id: number;
  nip: string;
  nama: string;
}

export default function AddUserModal({ listGuru }: { listGuru: Guru[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // State untuk auto-fill
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    password: "",
    guruId: ""
  });

  const handleSelectGuru = (id: string) => {
    const selected = listGuru.find(g => g.id.toString() === id);
    if (selected) {
      setFormData({
        guruId: id,
        name: selected.nama,
        username: selected.nip, // Auto-fill Username pakai NIP
        password: selected.nip, // Auto-fill Password pakai NIP
      });
    } else {
      setFormData({ guruId: "", name: "", username: "", password: "" });
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    
    const data = new FormData(e.currentTarget);
    // Kita tambahkan role 'guru' secara manual karena sudah tidak ada pilihan role
    data.append("role", "guru");

    const res = await createUserAccount(data);

    if (res.success) {
      setIsOpen(false);
      setFormData({ guruId: "", name: "", username: "", password: "" });
      alert("Akun Guru Berhasil Diaktifkan!");
    } else {
      alert(res.error);
    }
    setLoading(false);
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)} 
        className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition font-semibold shadow-sm"
      >
        <UserPlus size={18} /> Aktivasi Akun Guru
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <button onClick={() => setIsOpen(false)} className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"><X size={20} /></button>

            <h3 className="text-xl font-bold mb-1 text-slate-800">Aktivasi Akun Guru</h3>
            <p className="text-sm text-slate-500 mb-6">Pilih guru untuk membuat akun login otomatis.</p>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* PILIH GURU */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Data Guru</label>
                <select 
                  name="guruId" 
                  required 
                  value={formData.guruId}
                  onChange={(e) => handleSelectGuru(e.target.value)}
                  className="w-full border border-indigo-200 p-2 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 bg-indigo-50/50"
                >
                  <option value="">-- Cari Guru --</option>
                  {listGuru.map((g) => (
                    <option key={g.id} value={g.id}>[{g.nip}] {g.nama}</option>
                  ))}
                </select>
              </div>

              {/* AUTO-FILL FIELDS */}
              <div className="space-y-3 bg-slate-50 p-3 rounded-lg border border-dashed">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-gray-400">Nama Akun</label>
                  <input 
                    name="name" 
                    value={formData.name} 
                    readOnly // Dibuat readonly agar tidak diubah operator
                    className="w-full bg-transparent border-b text-sm font-semibold outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-gray-400">Username (NIP)</label>
                  <input 
                    name="username" 
                    value={formData.username} 
                    readOnly 
                    className="w-full bg-transparent border-b text-sm outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-gray-400">Password Default (NIP)</label>
                  <input 
                    name="password" 
                    type="text" // Pakai text agar operator bisa lihat password sementaranya
                    value={formData.password} 
                    readOnly 
                    className="w-full bg-transparent text-sm outline-none" 
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <button type="button" onClick={() => setIsOpen(false)} className="flex-1 bg-gray-100 py-2.5 rounded-lg font-medium">Batal</button>
                <button 
                  type="submit" 
                  disabled={loading || !formData.guruId} 
                  className="flex-1 bg-indigo-600 text-white py-2.5 rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50"
                >
                  {loading ? "Menyimpan..." : "Aktifkan Akun"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}