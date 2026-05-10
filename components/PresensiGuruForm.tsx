"use client";
import { useState } from "react";
import { Save, User } from "lucide-react";
import { simpanPresensiGuru } from "@/lib/actions";

export default function PresensiGuruForm({ daftarGuru }: { daftarGuru: any[] }) {
  const [presensi, setPresensi] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(false);

  const handleStatusChange = (guruId: number, status: string) => {
    setPresensi(prev => ({ ...prev, [guruId]: status }));
  };

  const handleSimpan = async () => {
    const payload = Object.entries(presensi).map(([id, status]) => ({
      guru_id: parseInt(id),
      status
    }));

    if (payload.length === 0) return alert("Pilih minimal satu status guru!");

    setLoading(true);
    try {
      await simpanPresensiGuru(payload);
      alert("Presensi guru berhasil disimpan!");
    } catch (e) {
      alert("Gagal menyimpan data.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-[3rem] border-2 border-slate-100 overflow-hidden shadow-sm">
        <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
          <span className="text-xs font-black uppercase tracking-widest">Daftar Guru & Staff</span>
          <span className="text-[10px] font-bold bg-white/20 px-3 py-1 rounded-full">{daftarGuru.length} TOTAL</span>
        </div>

        <div className="divide-y divide-slate-50">
          {daftarGuru.map((guru) => (
            <div key={guru.id} className="p-6 flex flex-col md:flex-row justify-between items-center hover:bg-slate-50 transition-all gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center font-black">
                  {guru.nama.charAt(0)}
                </div>
                <div>
                  <h4 className="font-black text-slate-900 uppercase text-sm leading-none">{guru.nama}</h4>
                  <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">NIP: {guru.nip}</p>
                </div>
              </div>

              <div className="flex gap-2">
                {['Hadir', 'Sakit', 'Izin', 'Alpa'].map((s) => (
                  <button
                    key={s}
                    onClick={() => handleStatusChange(guru.id, s)}
                    className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all border-2 
                      ${presensi[guru.id] === s 
                        ? 'bg-slate-900 border-slate-900 text-white shadow-lg scale-105' 
                        : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <button 
        onClick={handleSimpan}
        disabled={loading}
        className="w-full py-5 bg-blue-600 text-white rounded-[2rem] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-slate-900 transition-all shadow-xl shadow-blue-500/20"
      >
        <Save size={20} /> {loading ? "Sedang Menyimpan..." : "Simpan Semua Kehadiran"}
      </button>
    </div>
  );
}