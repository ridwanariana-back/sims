"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Save, Calendar, Loader2, Plus, Trash2, Eye } from "lucide-react";
import { 
  saveJadwalPelajaran, 
  getTahunAjaranDinamis, 
  getDaftarGuru, 
  getDaftarKelas, 
  getDaftarMapel 
} from "@/lib/actions";

const DAFTAR_HARI = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

export default function BuatJadwalPage() {
  const { data: session } = useSession();
  
  const sId = session?.user?.sekolah_id || (session?.user as any)?.sekolahId;
  const sekolahIdInt = sId ? parseInt(sId.toString()) : null;

  const [forms, setForms] = useState<any[]>([]);
  const [allGurus, setAllGurus] = useState<any[]>([]);
  const [allKelas, setAllKelas] = useState<any[]>([]);
  const [allMapel, setAllMapel] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [tahunAjaran, setTahunAjaran] = useState("");

  useEffect(() => {
    if (!sekolahIdInt) return;

    getTahunAjaranDinamis().then(setTahunAjaran);
    getDaftarGuru(sekolahIdInt).then(setAllGurus);
    getDaftarKelas(sekolahIdInt).then(setAllKelas);
    getDaftarMapel(sekolahIdInt).then(setAllMapel);
  }, [sekolahIdInt]);

  const daftarTingkatUnik = Array.from(new Set(allKelas.map(k => k.tingkat.toString()))).sort();

  const tambahForm = () => {
    setForms([{ 
      id: Date.now(), 
      hari: "", mapel: "", kelas: "", rombel: "", 
      jam_mulai: "", jam_selesai: "", guru_id: "" 
    }, ...forms]);
  };

  const hapusForm = (id: number) => {
    setForms(forms.filter(f => f.id !== id));
  };

  const updateForm = (id: number, field: string, value: string) => {
    setForms(forms.map(f => {
      if (f.id === id) {
        const updatedForm = { ...f, [field]: value };
        
        if (field === "kelas") {
          updatedForm.rombel = ""; 
        }

        if (field === "mapel") {
          // 💡 SINKRONISASI ID: Cari mapel berdasarkan ID mapel yang dipilih
          const selectedMapelObj = allMapel.find(m => m.id.toString() === value.toString());
          
          if (selectedMapelObj?.kelompok === "Kegiatan") {
            updatedForm.guru_id = "";
          } else {
            // 💡 SINKRONISASI ID: Cari guru yang string mapel-nya cocok dengan ID mapel ini
            const guruCocok = allGurus.find(g => g.mapel?.toString() === value.toString());
            updatedForm.guru_id = guruCocok ? guruCocok.id.toString() : "";
          }
        }
        
        return updatedForm;
      }
      return f;
    }));
  };

  const handleSaveAll = async () => {
    if (!sekolahIdInt) return alert("Sesi sekolah tidak valid. Silakan login ulang.");
    if (forms.length === 0) return alert("Tambah jadwal terlebih dahulu");
    
    for (const f of forms) {
      if (!f.hari || !f.mapel || !f.kelas || !f.rombel || !f.jam_mulai || !f.jam_selesai) {
        return alert("Mohon lengkapi semua kolom input jadwal yang kosong!");
      }
    }

    setLoading(true);
    const formsToProcess = [...forms].reverse(); 
    const formsBerhasil: number[] = [];
    let errorMsg = "";

    for (const form of formsToProcess) {
      const dataToSave = { ...form, tahun_ajaran: tahunAjaran };
      const res = await saveJadwalPelajaran([dataToSave], sekolahIdInt); 

      if (res.success) {
        formsBerhasil.push(form.id);
      } else {
        errorMsg = res.error; 
        break; 
      }
    }

    if (formsBerhasil.length > 0) {
      setForms(prev => prev.filter(f => !formsBerhasil.includes(f.id)));
    }

    if (errorMsg) {
      alert(errorMsg); 
    } else {
      alert("Semua jadwal berhasil disimpan!");
    }

    setLoading(false);
  };

  return (
    <div className="p-4 md:p-8 space-y-10 bg-slate-50 min-h-screen pb-32">
      {/* STICKY TOP HEADER */}
      <div className="flex flex-col md:flex-row justify-between sticky top-0 z-50 items-center gap-4 bg-slate-50/80 backdrop-blur-md py-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Buat Jadwal Pelajaran</h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Tahun Ajaran: {tahunAjaran}</p>
        </div>
        <div className="flex gap-3">
          <Link href="/tatausaha/jadwal-pelajaran/view" className="p-4 bg-white border-2 border-slate-200 rounded-2xl hover:bg-slate-50 transition-all">
            <Eye size={20} className="text-slate-600" />
          </Link>
          <button onClick={tambahForm} className="flex items-center gap-3 px-6 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
            <Plus size={18} /> Tambah Baris
          </button>
        </div>
      </div>

      {/* INPUT FORM GRID */}
      <div className="space-y-6">
        {forms.map((form) => {
          const rombelTersedia = allKelas.filter(k => k.tingkat.toString() === form.kelas);
          
          // 💡 SINKRONISASI ID: Filter guru pengampu berdasarkan ID Mapel yang dipilih
          const filteredGurus = allGurus.filter(g => g.mapel?.toString() === form.mapel?.toString());
          
          // 💡 SINKRONISASI ID: Cek kategori mapel berdasarkan ID
          const isKegiatan = allMapel.find(m => m.id.toString() === form.mapel?.toString())?.kelompok === "Kegiatan";

          return (
            <div key={form.id} className="bg-white p-6 md:p-8 rounded-[2.5rem] border-2 border-slate-100 shadow-sm relative animate-in fade-in slide-in-from-top-4 duration-300">
              <button onClick={() => hapusForm(form.id)} className="absolute -top-3 -right-3 p-3 bg-rose-500 text-white rounded-2xl shadow-lg hover:bg-rose-600 transition-all">
                <Trash2 size={16} />
              </button>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* HARI */}
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Hari</label>
                  <select value={form.hari} onChange={(e) => updateForm(form.id, "hari", e.target.value)} className="w-full p-3.5 bg-slate-100 border-2 border-transparent focus:border-slate-900 rounded-xl font-bold text-xs outline-none transition-all">
                    <option value="">Pilih Hari</option>
                    {DAFTAR_HARI.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>

                {/* TINGKAT KELAS */}
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Tingkat Kelas</label>
                  <select value={form.kelas} onChange={(e) => updateForm(form.id, "kelas", e.target.value)} className="w-full p-3.5 bg-slate-100 border-2 border-transparent focus:border-slate-900 rounded-xl font-bold text-xs outline-none transition-all">
                    <option value="">Pilih Tingkat</option>
                    {daftarTingkatUnik.map(t => <option key={t} value={t}>Kelas {t}</option>)}
                  </select>
                </div>

                {/* ROMBEL */}
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Rombongan Belajar</label>
                  <select value={form.rombel} onChange={(e) => updateForm(form.id, "rombel", e.target.value)} disabled={!form.kelas} className="w-full p-3.5 bg-slate-100 border-2 border-transparent focus:border-slate-900 rounded-xl font-bold text-xs outline-none transition-all disabled:opacity-50">
                    <option value="">Pilih Rombel</option>
                    {rombelTersedia.map(r => <option key={r.id} value={r.nama_kelas}>{r.nama_kelas}</option>)}
                  </select>
                </div>

                {/* MATA PELAJARAN / KEGIATAN (Ubah VALUE menjadi ID) */}
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Mata Pelajaran</label>
                  <select value={form.mapel} onChange={(e) => updateForm(form.id, "mapel", e.target.value)} className="w-full p-3.5 bg-slate-100 border-2 border-transparent focus:border-slate-900 rounded-xl font-bold text-xs outline-none transition-all">
                    <option value="">Pilih Mapel / Kegiatan</option>
                    <optgroup label="MATA PELAJARAN">
                      {allMapel.filter(m => m.kelompok !== 'Kegiatan').map(m => (
                        <option key={m.id} value={m.id}>{m.nama_mapel} ({m.kelompok})</option>
                      ))}
                    </optgroup>
                    <optgroup label="KEGIATAN SEKOLAH">
                      {allMapel.filter(m => m.kelompok === 'Kegiatan').map(m => (
                        <option key={m.id} value={m.id}>{m.nama_mapel}</option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                {/* GURU PENGAMPU */}
                <div className="space-y-1">
                  <label className={`text-[9px] font-black uppercase ml-2 ${isKegiatan ? 'text-slate-400' : 'text-indigo-600'}`}>
                    Guru Pengampu
                  </label>
                  <select 
                    value={form.guru_id} 
                    onChange={(e) => updateForm(form.id, "guru_id", e.target.value)} 
                    disabled={isKegiatan}
                    className="w-full p-3.5 bg-indigo-50 border-2 border-transparent focus:border-indigo-600 rounded-xl font-bold text-xs outline-none transition-all disabled:opacity-40 disabled:bg-slate-100"
                  >
                    {isKegiatan ? (
                      <option value="">-- Agenda Kegiatan (Tanpa Guru) --</option>
                    ) : (
                      <>
                        <option value="">-- Tidak Ada Guru --</option>
                        {filteredGurus.map(g => (
                          <option key={g.id} value={g.id}>{g.nama} (NIP: {g.nip || "-"})</option>
                        ))}
                      </>
                    )}
                  </select>
                </div>

                {/* WAKTU */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-blue-600 uppercase ml-2">Mulai</label>
                    <input type="time" value={form.jam_mulai} onChange={(e) => updateForm(form.id, "jam_mulai", e.target.value)} className="w-full p-3.5 bg-blue-50/50 border-2 border-transparent focus:border-blue-500 rounded-xl font-bold text-xs outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-rose-600 uppercase ml-2">Selesai</label>
                    <input type="time" value={form.jam_selesai} onChange={(e) => updateForm(form.id, "jam_selesai", e.target.value)} className="w-full p-3.5 bg-rose-50/50 border-2 border-transparent focus:border-rose-500 rounded-xl font-bold text-xs outline-none" />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* FLOAT SAVE BUTTON */}
      {forms.length > 0 && (
        <div className="fixed bottom-8 right-8 left-8 md:left-auto md:w-80">
          <button onClick={handleSaveAll} disabled={loading} className="w-full bg-slate-900 hover:bg-black text-white p-5 rounded-3xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 shadow-2xl transition-all active:scale-95 disabled:opacity-50">
            {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
            {loading ? "Menyimpan..." : "Simpan Semua"}
          </button>
        </div>
      )}

      {/* EMPTY STATE */}
      {forms.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-slate-300">
          <Calendar size={64} strokeWidth={1} />
          <p className="mt-4 font-black uppercase text-[10px] tracking-[0.3em]">Belum ada baris jadwal</p>
        </div>
      )}
    </div>
  );
}