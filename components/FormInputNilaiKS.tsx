// components/forminputnilai.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { deleteNilai } from "@/lib/actions";
import { Save, ArrowLeft, BookOpen, Calendar, Calculator, Trash2, User } from "lucide-react";
import Link from "next/link";

export default function FormInputNilai({ 
  muridId, guruId, sekolahId, mapelDefault, namaMapelTxt, semesterDefault, dataLama, 
  detailMurid, tahunAjaran 
}: { 
  muridId: number, 
  guruId: number, 
  sekolahId: number, 
  mapelDefault: string, // 💡 Ini menampung ID Mapel string
  namaMapelTxt: string,  // 💡 Terima properti nama asli teks mapel
  semesterDefault: string, 
  dataLama?: any,
  detailMurid: { nama: string, nisn: string, kelas: string, rombel: string },
  tahunAjaran: string
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [harian, setHarian] = useState<number>(dataLama?.nilai_harian || 0);
  const [mid, setMid] = useState<number>(dataLama?.nilai_mid || 0);
  const [uas, setUas] = useState<number>(dataLama?.nilai_uas || 0);
  const [nilaiAkhir, setNilaiAkhir] = useState<number>(dataLama?.nilai_angka || 0);

  const handleInputChange = (val: string, setter: (n: number) => void) => {
    const cleanValue = val.replace(/[^0-9]/g, "");
    const numValue = cleanValue === "" ? 0 : parseInt(cleanValue, 10);
    if (numValue <= 100) setter(numValue);
  };

  useEffect(() => {
    const hitung = (harian * 0.4) + (mid * 0.3) + (uas * 0.3);
    setNilaiAkhir(Number(hitung.toFixed(2)));
  }, [harian, mid, uas]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    
    const payload = {
      id: dataLama?.id || null,
      murid_id: muridId,
      guru_id: guruId,
      sekolah_id: sekolahId, 
      mapel: mapelDefault, // 💡 Tetap aman mengirim ID Mapel ke database!
      semester: semesterDefault,
      tahun_ajaran: tahunAjaran,
      nilai_harian: harian,
      nilai_mid: mid,
      nilai_uas: uas,
      nilai_angka: nilaiAkhir,
      keterangan: formData.get("keterangan"),
    };

    try {
      const res = await fetch("/api/nilai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        alert("Data berhasil disimpan!");
        router.push("/kepalasekolah/inputnilai/riwayat");
        router.refresh();
      }
    } catch (error) {
      alert("Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Profil Murid Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-5">
        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
          <User size={32} strokeWidth={2.5} />
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-900 uppercase leading-tight">{detailMurid.nama}</h2>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <span className="px-2 py-0.5 bg-slate-900 text-white text-[10px] font-black rounded uppercase">
              Kelas {detailMurid.kelas}
            </span>
            <span className="px-2 py-0.5 bg-blue-600 text-white text-[10px] font-black rounded uppercase">
              Rombel: {detailMurid.rombel}
            </span>
            <span className="text-[11px] font-bold text-slate-400 uppercase ml-1">
              NISN: {detailMurid.nisn}
            </span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
              <BookOpen size={16} className="text-blue-500" /> Mata Pelajaran
            </label>
            {/* 💡 SEKARANG VALUE MENGGUNAKAN NAMA MAPEL ASLI AGAR CANTIK DI UI */}
            <input 
              type="text" 
              value={namaMapelTxt} 
              readOnly 
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold cursor-not-allowed uppercase text-sm" 
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
              <Calendar size={16} className="text-blue-500" /> Tahun Ajaran
            </label>
            <input type="text" value={tahunAjaran} readOnly className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold cursor-not-allowed text-sm" />
          </div>

          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nilai Harian (40%)</label>
              <input type="text" inputMode="numeric" value={harian === 0 ? "" : harian} onChange={(e) => handleInputChange(e.target.value, setHarian)} placeholder="0" className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 outline-none font-bold text-lg" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nilai MID (30%)</label>
              <input type="text" inputMode="numeric" value={mid === 0 ? "" : mid} onChange={(e) => handleInputChange(e.target.value, setMid)} placeholder="0" className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 outline-none font-bold text-lg" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nilai UAS (30%)</label>
              <input type="text" inputMode="numeric" value={uas === 0 ? "" : uas} onChange={(e) => handleInputChange(e.target.value, setUas)} placeholder="0" className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 outline-none font-bold text-lg" />
            </div>
          </div>

          <div className="md:col-span-2 p-6 bg-blue-600 rounded-2xl flex items-center justify-between text-white shadow-lg">
            <div className="flex items-center gap-3">
              <Calculator size={32} className="opacity-50" />
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Estimasi Nilai Akhir ({semesterDefault})</p>
                <p className="text-4xl font-black">{nilaiAkhir}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-bold text-slate-700 uppercase tracking-tight">Keterangan / Catatan</label>
          <textarea name="keterangan" rows={3} defaultValue={dataLama?.keterangan || ""} className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none text-sm" placeholder="Contoh: Menunjukkan peningkatan..."></textarea>
        </div>

        <div className="flex flex-col md:flex-row gap-4 pt-4">
         <Link 
  href={`/kepalasekolah/inputnilai?mapel=${mapelDefault}`} 
  className="flex-1 flex items-center justify-center gap-2 py-3.5 border-2 border-slate-100 rounded-xl font-bold hover:bg-slate-50 text-slate-600 transition-all text-sm"
>
  <ArrowLeft size={18} /> KEMBALI
</Link>
          
          {dataLama?.id && (
            <button
              type="button"
              onClick={async () => {
                if (confirm("Hapus data nilai murid ini?")) {
                  const res = await deleteNilai(dataLama.id, sekolahId);
                  if (res.success) {
                    alert("Nilai berhasil dihapus!");
                    router.push("/kepalasekolah/inputnilai/riwayat");
                    router.refresh();
                  } else {
                    alert("Gagal menghapus nilai.");
                  }
                }
              }}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 border-2 border-rose-100 bg-rose-50 text-rose-600 rounded-xl font-black hover:bg-rose-600 hover:text-white transition-all text-sm uppercase tracking-widest"
            >
              <Trash2 size={18} /> HAPUS
            </button>
          )}
          
          <button type="submit" disabled={loading} className="flex-[2] flex items-center justify-center gap-2 py-3.5 bg-slate-900 text-white rounded-xl font-black hover:bg-blue-600 shadow-xl transition-all text-sm uppercase tracking-widest">
            <Save size={18} /> {loading ? "PROSES..." : "SIMPAN NILAI"}
          </button>
        </div>
      </form>
    </div>
  );
}