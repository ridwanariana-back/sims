"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, ArrowLeft, BookOpen, Calendar, Info, Trash2 } from "lucide-react";
import Link from "next/link";

export default function FormInputNilai({ 
  muridId, guruId, mapelDefault, semesterDefault, dataLama 
}: { 
  muridId: number, guruId: any, mapelDefault: string, semesterDefault: string, dataLama?: any 
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const payload = {
      id: dataLama?.id || null, // Jika ada ID, berarti mode UPDATE
      murid_id: muridId,
      guru_id: guruId,
      mapel: mapelDefault,
      semester: semesterDefault,
      tahun_ajaran: formData.get("tahun_ajaran"),
      nilai_angka: formData.get("nilai_angka"),
      keterangan: formData.get("keterangan"),
    };

    try {
      const res = await fetch("/api/nilai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        alert(dataLama ? "Nilai berhasil diperbarui!" : "Nilai berhasil disimpan!");
        router.push("/guru/inputnilai");
        router.refresh();
      }
    } catch (error) {
      alert("Terjadi kesalahan sistem.");
    } finally {
      setLoading(false);
    }
  };

  const handleHapus = async () => {
    if (!confirm("Apakah Anda yakin ingin menghapus nilai ini?")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/nilai?id=${dataLama.id}`, { method: "DELETE" });
      if (res.ok) {
        alert("Nilai berhasil dihapus.");
        router.push("/guru/inputnilai");
        router.refresh();
      }
    } catch (error) {
      alert("Gagal menghapus.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-bold text-slate-700"><BookOpen size={16} className="text-blue-500" /> Mata Pelajaran</label>
            <input type="text" value={mapelDefault || ""} readOnly className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold cursor-not-allowed" />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-bold text-slate-700"><Info size={16} className="text-blue-500" /> Nilai Akhir (0-100)</label>
            <input type="number" name="nilai_angka" step="0.01" defaultValue={dataLama?.nilai_angka || ""} required className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 outline-none" />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-bold text-slate-700"><Calendar size={16} className="text-blue-500" /> Semester</label>
            <input type="text" value={semesterDefault} readOnly className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold cursor-not-allowed text-blue-600" />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-bold text-slate-700"><Calendar size={16} className="text-blue-500" /> Tahun Ajaran</label>
            <input type="text" name="tahun_ajaran" defaultValue={dataLama?.tahun_ajaran || "2025/2026"} required className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 outline-none" />
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-bold text-slate-700">Keterangan / Catatan</label>
          <textarea name="keterangan" rows={3} defaultValue={dataLama?.keterangan || ""} className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none"></textarea>
        </div>

        <div className="flex flex-col md:flex-row gap-4 pt-4">
          <Link href="/guru/inputnilai" className="flex-1 flex items-center justify-center gap-2 py-3.5 border border-slate-200 rounded-xl font-bold hover:bg-slate-50">
            <ArrowLeft size={18} /> Kembali
          </Link>
          <button type="submit" disabled={loading} className="flex-[2] flex items-center justify-center gap-2 py-3.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200">
            <Save size={18} /> {loading ? "Menyimpan..." : dataLama ? "Update Nilai" : "Simpan Nilai"}
          </button>
        </div>
      </form>

      {dataLama && (
        <button onClick={handleHapus} disabled={loading} className="w-full flex items-center justify-center gap-2 py-3 text-red-600 font-bold bg-red-50 border border-red-100 rounded-2xl hover:bg-red-600 hover:text-white transition-all">
          <Trash2 size={18} /> Hapus Data Nilai {semesterDefault}
        </button>
      )}
    </div>
  );
}