"use client";

import { useState } from "react";
import Link from "next/link";
import { Save, Calendar, Clock, BookOpen, Users, Loader2, Plus, Trash2, History, Eye } from "lucide-react";
import { saveJadwalPelajaran, getTahunAjaranDinamis } from "@/lib/actions";

const DAFTAR_HARI = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"];
const DAFTAR_MAPEL = [
  "PAI & BudiPekerti", "PKN", "Bahasa Indonesia", "Bahasa Inggris", 
  "Bahasa Inggris Tingkat Lanjut", "Matematika Wajib", "Matematika Tingkat Lanjut", 
  "Fisika", "Fisika Mapel Pilihan", "Biologi", "Biologi Mapel Pilihan", 
  "Kimia", "Kimia Mapel Pilihan", "Sejarah", "Sejarah Tingkat Lanjut", 
  "Geografi", "Geografi Mapel Pilihan", "Ekonomi", "Ekonomi Mapel Pilihan", 
  "Sosiologi", "Sosiologi Mapel Pilihan", "Seni Budaya", "Penjas Orkes", 
  "PKWU", "Informatika", "Bimbingan Konseling","Upacara Bendera","Istirahat","Isoma",
  "SMANSA Student Performance","Membaca Al Qur'an","Senam","Imtaq"
];

const DAFTAR_KELAS = ["X", "XI", "XII"];
const ROMBEL_PER_KELAS: Record<string, string[]> = {
  "X": ["X.1", "X.2", "X.3", "X.4"],
  "XI": ["XI.F1", "XI.F2", "XI.F3", "XI.F4"],
  "XII": ["XII.F1", "XII.F2", "XII.F3", "XII.F4"]
};

export default function JadwalPelajaranPage() {
  const [loading, setLoading] = useState(false);
  const [selectedKelas, setSelectedKelas] = useState("X");
  
  // State untuk menampung banyak form (Default 1 form)
  const [forms, setForms] = useState([{
    id: Date.now(),
    hari: "Senin",
    mapel: DAFTAR_MAPEL[0],
    kelas: "X",
    rombel: "X.1",
    jam_mulai: "",
    jam_selesai: ""
  }]);

  // Fungsi tambah form baru di posisi PALING ATAS
  const addForm = () => {
    setForms([{
      id: Date.now(),
      hari: "Senin",
      mapel: DAFTAR_MAPEL[0],
      kelas: "X",
      rombel: "X.1",
      jam_mulai: "",
      jam_selesai: ""
    }, ...forms]);
  };

  // Fungsi hapus form tertentu
  const removeForm = (id: number) => {
    if (forms.length > 1) {
      setForms(forms.filter(f => f.id !== id));
    }
  };

  // Fungsi update data form secara dinamis
  const updateForm = (id: number, field: string, value: string) => {
    setForms(forms.map(f => f.id === id ? { ...f, [field]: value } : f));
  };

  // Ganti fungsi handleSaveAll yang lama dengan ini
const handleSaveAll = async () => {
  setLoading(true);
  const tahun = await getTahunAjaranDinamis();
  let successCount = 0;
  let errors = [];

  for (const form of forms) {
    const res = await saveJadwalPelajaran({ ...form, tahun_ajaran: tahun });
    if (res.success) {
      successCount++;
    } else {
      // Kita ambil detail Mapel, Hari, dan Rombel agar TU tahu mana yang bentrok
      errors.push(`- ${form.mapel} (Hari ${form.hari} / ${form.rombel}): ${res.message}`);
    }
  }

  if (errors.length > 0) {
    // Jika ada yang gagal, tampilkan detailnya dan tetap reset form agar tidak double input
    alert(`Hasil Simpan:\n✅ Berhasil: ${successCount} jadwal\n❌ Gagal:\n${errors.join('\n')}\n\nForm akan di-reset untuk menghindari duplikasi.`);
    setForms([{ id: Date.now(), hari: "Senin", mapel: DAFTAR_MAPEL[0], kelas: "X", rombel: "X.1", jam_mulai: "", jam_selesai: "" }]);
  } else {
    alert("Semua jadwal berhasil disimpan!");
    setForms([{ id: Date.now(), hari: "Senin", mapel: DAFTAR_MAPEL[0], kelas: "X", rombel: "X.1", jam_mulai: "", jam_selesai: "" }]);
  }
  
  setLoading(false);
};

  return (
    <div className="p-8 space-y-8">
      {/* HEADER */}
<div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
  <div className="flex items-center gap-6">
    <div className="w-16 h-16 bg-blue-600 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-blue-100">
      <Calendar size={32} />
    </div>
    <div>
      <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-none">
        Input Jadwal Pelajaran
      </h1>
      <p className="text-slate-500 font-bold uppercase tracking-widest text-[9px] mt-2 italic">
        Unit Tata Usaha | Multi-Form Entry
      </p>
    </div>
  </div>
  
  {/* BUTTON GROUP */}
  <div className="flex items-center gap-3 w-full md:w-auto">
    {/* TOMBOL LIHAT JADWAL (BARU) */}
    <Link 
      href="/tatausaha/jadwal-pelajaran/view"
      className="flex-1 md:flex-none bg-slate-100 hover:bg-slate-200 text-slate-600 px-8 py-4 rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-2 transition-all"
    >
      <Eye size={18} /> Lihat Jadwal
    </Link>

    {/* TOMBOL TAMBAH FORM */}
    <button 
      onClick={addForm}
      className="flex-1 md:flex-none bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-100 transition-all"
    >
      <Plus size={18} /> Tambah Form
    </button>
  </div>
</div>

      {/* RENDER DYNAMIC FORMS */}
      <div className="space-y-6">
        {forms.map((form, index) => (
          <div key={form.id} className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-100 shadow-sm relative group animate-in fade-in slide-in-from-top-4 duration-300">
            {forms.length > 1 && (
              <button 
                onClick={() => removeForm(form.id)}
                className="absolute -top-3 -right-3 bg-rose-500 text-white p-2 rounded-full shadow-lg hover:bg-rose-600 transition-all"
              >
                <Trash2 size={16} />
              </button>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* HARI */}
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Hari</label>
                <select 
                  value={form.hari} onChange={(e) => updateForm(form.id, "hari", e.target.value)}
                  className="w-full p-3.5 bg-slate-50 border-2 border-transparent focus:border-blue-500 rounded-xl font-bold text-xs outline-none transition-all"
                >
                  {DAFTAR_HARI.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>

              {/* MAPEL DROPDOWN */}
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Mata Pelajaran</label>
                <select 
                  value={form.mapel} onChange={(e) => updateForm(form.id, "mapel", e.target.value)}
                  className="w-full p-3.5 bg-slate-50 border-2 border-transparent focus:border-blue-500 rounded-xl font-bold text-xs outline-none transition-all"
                >
                  {DAFTAR_MAPEL.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>

              {/* KELAS & ROMBEL */}
{/* KELAS */}
<div className="space-y-1">
  <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Kelas</label>
  <select 
    value={form.kelas} 
    onChange={(e) => {
      const kelasBaru = e.target.value;
      const rombelBaru = ROMBEL_PER_KELAS[kelasBaru][0];
      
      // Update HANYA untuk form.id ini saja
      setForms(prev => prev.map(f => 
        f.id === form.id 
          ? { ...f, kelas: kelasBaru, rombel: rombelBaru } 
          : f
      ));
    }}
    className="w-full p-3.5 bg-slate-50 border-2 border-transparent focus:border-blue-500 rounded-xl font-bold text-xs outline-none transition-all"
  >
    {Object.keys(ROMBEL_PER_KELAS).map(k => (
      <option key={k} value={k}>{k}</option>
    ))}
  </select>
</div>

{/* ROMBEL */}
<div className="space-y-1">
  <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Rombel</label>
  <select 
    value={form.rombel} 
    onChange={(e) => {
      const val = e.target.value;
      // Update HANYA untuk ID form yang sedang di-klik
      setForms(prev => prev.map(f => 
        f.id === form.id ? { ...f, rombel: val } : f
      ));
    }}
    className="w-full p-3.5 bg-slate-50 border-2 border-transparent focus:border-blue-500 rounded-xl font-bold text-xs outline-none transition-all"
  >
    {/* Mengambil list rombel berdasarkan kelas di form ini saja */}
    {(ROMBEL_PER_KELAS[form.kelas] || []).map((r) => (
      <option key={r} value={r}>
        {r}
      </option>
    ))}
  </select>
</div>

              {/* JAM MULAI */}
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase ml-2 text-blue-600">Jam Mulai</label>
                <input 
                  type="time" value={form.jam_mulai} onChange={(e) => updateForm(form.id, "jam_mulai", e.target.value)}
                  className="w-full p-3.5 bg-blue-50/50 border-2 border-transparent focus:border-blue-500 rounded-xl font-bold text-xs outline-none transition-all" 
                />
              </div>

              {/* JAM SELESAI */}
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase ml-2 text-rose-600">Jam Selesai</label>
                <input 
                  type="time" value={form.jam_selesai} onChange={(e) => updateForm(form.id, "jam_selesai", e.target.value)}
                  className="w-full p-3.5 bg-rose-50/50 border-2 border-transparent focus:border-rose-500 rounded-xl font-bold text-xs outline-none transition-all" 
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* GLOBAL SAVE BUTTON */}
      <div className="fixed bottom-8 right-8 left-8 md:left-auto md:w-80">
        <button 
          onClick={handleSaveAll}
          disabled={loading}
          className="w-full bg-slate-900 hover:bg-black text-white p-5 rounded-3xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 transition-all shadow-2xl disabled:opacity-50"
        >
          {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
          Simpan Semua Jadwal ({forms.length})
        </button>
      </div>
    </div>
  );
}