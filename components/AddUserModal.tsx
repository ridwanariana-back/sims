"use client";

import { useState } from "react";
import { createUserAccount } from "@/lib/actions";
import { X, UserPlus, ShieldCheck } from "lucide-react";

interface Guru {
  id: number;
  nip: string;
  nama: string;
  jenis?: string; // Kembali menggunakan 'jenis' setelah kolom dibersihkan
}

export default function AddUserModal({ listGuru }: { listGuru: Guru[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    password: "",
    guruId: "",
    jenis_pegawai: "",
    role: "" 
  });

  // LOGIKA MAPPING ROLE OTOMATIS BERDASARKAN KOLOM 'JENIS'[cite: 7]
  const handleSelectGuru = (id: string) => {
    const selected = listGuru.find(g => g.id.toString() === id);
    
    if (selected) {
      // Ambil data dari kolom 'jenis' (Fallback ke string kosong jika null)[cite: 7]
      const rawJenis = selected.jenis || "";
      const jenisPegawai = rawJenis.toLowerCase().trim();
      
      let roleOtomatis = "guru"; // Role default jika tidak cocok dengan kriteria di bawah[cite: 7]

      // Penentuan role berdasarkan isi kolom jenis[cite: 7]
      if (jenisPegawai === "kepala sekolah") {
        roleOtomatis = "kepalasekolah";
      } else if (jenisPegawai === "wakil kurikulum") {
        roleOtomatis = "wakilkurikulum"; 
      } else if (jenisPegawai === "wakil kesiswaan") {
        roleOtomatis = "wakilkesiswaan";
      }

      setFormData({
        guruId: id,
        name: selected.nama,
        username: selected.nip,
        password: selected.nip,
        jenis_pegawai: rawJenis || "Staf/Guru", 
        role: roleOtomatis
      });
    } else {
      setFormData({ guruId: "", name: "", username: "", password: "", jenis_pegawai: "", role: "" });
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    
    const data = new FormData();
    data.append("guruId", formData.guruId);
    data.append("name", formData.name);
    data.append("username", formData.username);
    data.append("password", formData.password);
    data.append("role", formData.role); // Role otomatis dikirim ke server action[cite: 7]

    const res = await createUserAccount(data);

    if (res.success) {
      setIsOpen(false);
      setFormData({ guruId: "", name: "", username: "", password: "", jenis_pegawai: "", role: "" });
      alert(`Akun Berhasil Diaktifkan dengan Role: ${formData.role.toUpperCase()}`);
    } else {
      alert(res.error);
    }
    setLoading(false);
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)} 
        className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition font-black text-xs uppercase shadow-lg shadow-indigo-100"
      >
        <UserPlus size={18} /> Aktivasi Akun User
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 text-left">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <button 
              onClick={() => setIsOpen(false)} 
              className="absolute right-6 top-6 text-gray-400 hover:text-gray-600"
            >
              <X size={24} />
            </button>

            <h3 className="text-xl font-black mb-1 text-slate-800 uppercase">Aktivasi Akun</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase mb-6 tracking-widest">
              Sistem akan menentukan role secara otomatis
            </p>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-1 ml-1">Pilih Personel</label>
                <select 
                  name="guruId" 
                  required 
                  value={formData.guruId}
                  onChange={(e) => handleSelectGuru(e.target.value)}
                  className="w-full border-2 border-indigo-100 p-3 rounded-xl font-black text-xs outline-none focus:border-indigo-500 bg-indigo-50/30 uppercase cursor-pointer"
                >
                  <option value="">-- Cari Nama/NIP --</option>
                  {listGuru.map((g) => (
                    <option key={g.id} value={g.id}>[{g.nip}] {g.nama}</option>
                  ))}
                </select>
              </div>

              {/* TAMPILAN PREVIEW OTOMATIS */}
              <div className="bg-slate-50 p-5 rounded-2xl border-2 border-dashed border-slate-200 space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <label className="block text-[9px] uppercase font-black text-slate-400">Jenis Pegawai</label>
                    <p className="text-xs font-black text-slate-900 uppercase">{formData.jenis_pegawai || "-"}</p>
                  </div>
                  <div className="text-right">
                    <label className="block text-[9px] uppercase font-black text-indigo-400">Role Akses</label>
                    <p className="text-xs font-black text-indigo-600 uppercase flex items-center gap-1 justify-end">
                      <ShieldCheck size={12} /> {formData.role || "-"}
                    </p>
                  </div>
                </div>
                
                <div className="pt-2 border-t border-slate-100">
                  <label className="block text-[9px] uppercase font-black text-slate-400">Username & Password Default</label>
                  <p className="text-xs font-bold text-slate-600 italic">{formData.username || "Menunggu pilihan..."}</p>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setIsOpen(false)} 
                  className="flex-1 bg-slate-100 py-3 rounded-xl font-black text-[10px] uppercase text-slate-500"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={loading || !formData.guruId} 
                  className="flex-[2] bg-indigo-600 text-white py-3 rounded-xl font-black text-[10px] uppercase hover:bg-indigo-700 disabled:opacity-50 shadow-lg shadow-indigo-100"
                >
                  {loading ? "Proses..." : "Aktifkan Akun Sekarang"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}