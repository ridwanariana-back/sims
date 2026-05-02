"use client";

import { useState } from "react";
import { X, School, Trash2, Save } from "lucide-react";

export default function ModalWaliKelas({ 
  guru, 
  isOpen, 
  onClose 
}: { 
  guru: any; 
  isOpen: boolean; 
  onClose: () => void;
}) {
  const [selectedKelas, setSelectedKelas] = useState(guru.wali_kelas || "");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const listKelas = [
    "X.1", "X.2", "X.3", "X.4",
    "XI.F1", "XI.F2", "XI.F3", "XI.F4",
    "XII.F1", "XII.F2", "XII.F3", "XII.F4"
  ];

  const handleSave = async (isDelete = false) => {
    setLoading(true);
    const kelasValue = isDelete ? null : selectedKelas;

    try {
      const res = await fetch("/api/guru/wali-kelas", {
        method: "PATCH",
        body: JSON.stringify({ id: guru.id, wali_kelas: kelasValue }),
      });

      if (res.ok) {
        alert(isDelete ? "Status Wali Kelas dihapus!" : "Wali Kelas berhasil diupdate!");
        onClose();
        window.location.reload();
      }
    } catch (error) {
      alert("Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
        <div className="p-6 border-b flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-2 text-blue-600 font-bold">
            <School size={20} />
            <span>Set Wali Kelas</span>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-all">
            <X size={20} />
          </button>
        </div>

        <div className="p-8 space-y-6">
          <div className="text-center">
            <p className="text-sm text-slate-500">Pilih kelas tugas tambahan untuk:</p>
            <h3 className="text-lg font-black text-slate-900">{guru.nama}</h3>
          </div>

          <select 
            value={selectedKelas}
            onChange={(e) => setSelectedKelas(e.target.value)}
            className="w-full px-4 py-4 bg-slate-100 border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none font-bold text-slate-700 transition-all"
          >
            <option value="">-- Bukan Wali Kelas --</option>
            {listKelas.map((kls) => (
              <option key={kls} value={kls}>Kelas {kls}</option>
            ))}
          </select>

          <div className="flex gap-3 pt-4">
            {guru.wali_kelas && (
              <button 
                onClick={() => handleSave(true)}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-red-50 text-red-600 rounded-xl font-bold hover:bg-red-600 hover:text-white transition-all border border-red-100"
              >
                <Trash2 size={18} /> Hapus
              </button>
            )}
            <button 
              onClick={() => handleSave(false)}
              disabled={loading || (!selectedKelas && !guru.wali_kelas)}
              className="flex-[2] flex items-center justify-center gap-2 py-3.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all disabled:bg-slate-200 disabled:shadow-none"
            >
              <Save size={18} /> {loading ? "Proses..." : "Simpan Perubahan"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}