"use client";

import { useState, useEffect } from "react";
import { 
  Calendar, 
  BookOpen, 
  Clock, 
  Trash2, 
  Edit, 
  X, 
  Save, 
  Loader2, 
  ArrowLeft
} from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { 
  getJadwalPelajaran, 
  getTahunAjaranDinamis, 
  deleteJadwalPelajaran, 
  updateJadwalPelajaran,
  getDaftarGuru,
  getDaftarKelas,
  getDaftarMapel
} from "@/lib/actions";

const DAFTAR_HARI = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

export default function ViewJadwalPage() {
  const { data: session } = useSession();
  
  const sId = session?.user?.sekolah_id || (session?.user as any)?.sekolahId;
  const sekolahIdInt = sId ? parseInt(sId.toString()) : null;

  const [jadwal, setJadwal] = useState<any[]>([]);
  const [allGurus, setAllGurus] = useState<any[]>([]);
  const [allKelas, setAllKelas] = useState<any[]>([]);
  const [allMapel, setAllMapel] = useState<any[]>([]);
  const [filteredJadwal, setFilteredJadwal] = useState<any[]>([]);
  const [tahunAjaran, setTahunAjaran] = useState("");
  const [loading, setLoading] = useState(true);
  
  const [selectedHari, setSelectedHari] = useState("Senin");
  const [selectedKelas, setSelectedKelas] = useState("");
  const [selectedRombel, setSelectedRombel] = useState("");

  const [editingItem, setEditingItem] = useState<any>(null);
  const [updateLoading, setUpdateLoading] = useState(false);

  // State bantuan untuk memegang ID mapel yang sedang dipilih di dalam modal edit
  const [modalSelectedMapel, setModalSelectedMapel] = useState("");

  useEffect(() => {
    if (sekolahIdInt === null || isNaN(sekolahIdInt)) return;

    async function init() {
      setLoading(true);
      const ta = await getTahunAjaranDinamis();
      setTahunAjaran(ta);
      
      const currentSekolahId: number = sekolahIdInt as number;

      const resGuru = await getDaftarGuru(currentSekolahId);
      const resKelas = await getDaftarKelas(currentSekolahId);
      const resMapel = await getDaftarMapel(currentSekolahId);
      const resJadwal = await getJadwalPelajaran(ta, currentSekolahId);

      setAllGurus(resGuru || []);
      setAllKelas(resKelas || []);
      setAllMapel(resMapel || []);
      setJadwal(resJadwal || []);

      if (resKelas && resKelas.length > 0) {
        const tingkatAwal = resKelas[0].tingkat.toString();
        setSelectedKelas(tingkatAwal);
        setSelectedRombel(resKelas[0].nama_kelas);
      }

      setLoading(false);
    }
    init();
  }, [sekolahIdInt]);

  useEffect(() => {
    const filtered = jadwal.filter(item => 
      item.hari === selectedHari && 
      item.kelas === selectedKelas && 
      item.rombel === selectedRombel
    );
    setFilteredJadwal(filtered);
  }, [jadwal, selectedHari, selectedKelas, selectedRombel]);

  const daftarTingkatUnik = Array.from(new Set(allKelas.map(k => k.tingkat.toString()))).sort();
  const rombelTersediaSesuaiFilter = allKelas.filter(k => k.tingkat.toString() === selectedKelas);

  const handleDelete = async (id: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus jadwal ini?")) return;
    if (!sekolahIdInt) return alert("Sesi sekolah tidak valid.");

    const res = await deleteJadwalPelajaran(id, sekolahIdInt); 
    
    if (res.success) {
      setJadwal(jadwal.filter(item => item.id !== id));
      alert("Jadwal berhasil dihapus");
    } else {
      alert("Gagal menghapus jadwal");
    }
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!sekolahIdInt) return;

    setUpdateLoading(true);
    const formData = new FormData(e.currentTarget);
    
    const id = editingItem.id;
    const mapel = formData.get("mapel") as string;
    const guru_id = formData.get("guru_id") as string;
    const jam_mulai = formData.get("jam_mulai") as string;
    const jam_selesai = formData.get("jam_selesai") as string;

    const res = await updateJadwalPelajaran(id, { 
      hari: editingItem.hari,   
      kelas: editingItem.kelas, 
      rombel: editingItem.rombel,
      mapel, // Menyimpan ID Mapel string
      guru_id: guru_id ? parseInt(guru_id) : null, 
      jam_mulai, 
      jam_selesai 
    }, sekolahIdInt);

    if (res.success) {
      const updatedJadwal = await getJadwalPelajaran(tahunAjaran, sekolahIdInt);
      setJadwal(updatedJadwal || []);
      setEditingItem(null);
      alert("Jadwal berhasil diperbarui!");
    } else {
      alert(res.message || "Gagal memperbarui jadwal");
    }
    setUpdateLoading(false);
  };

  // Trigger modal edit dan amankan tracking state ID mapel awal
  const bukaModalEdit = (item: any) => {
    setEditingItem(item);
    setModalSelectedMapel(item.mapel?.toString() || "");
  };

  return (
    <div className="p-4 md:p-8 space-y-8 bg-slate-50 min-h-screen pb-24">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-[2rem] border-2 border-slate-100 shadow-sm">
        <div className="flex items-center gap-4">
          <Link href="/tatausaha/jadwal-pelajaran" className="p-3 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all text-slate-700">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Lihat Jadwal Pelajaran</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Tahun Ajaran: {tahunAjaran}</p>
          </div>
        </div>
      </div>

      {/* FILTER CONTROLS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white p-6 rounded-[2rem] border-2 border-slate-100 shadow-sm">
        <div className="space-y-1">
          <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Pilih Hari</label>
          <select value={selectedHari} onChange={(e) => setSelectedHari(e.target.value)} className="w-full p-3.5 bg-slate-100 border-2 border-transparent focus:border-slate-900 rounded-xl font-bold text-xs outline-none transition-all">
            {DAFTAR_HARI.map(h => <option key={h} value={h}>{h}</option>)}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Tingkat Kelas</label>
          <select 
            value={selectedKelas} 
            onChange={(e) => {
              const kelasTerpilih = e.target.value;
              setSelectedKelas(kelasTerpilih);
              const rombelPertama = allKelas.find(k => k.tingkat.toString() === kelasTerpilih);
              setSelectedRombel(rombelPertama ? rombelPertama.nama_kelas : "");
            }} 
            className="w-full p-3.5 bg-slate-100 border-2 border-transparent focus:border-slate-900 rounded-xl font-bold text-xs outline-none transition-all"
          >
            {daftarTingkatUnik.length === 0 ? (
              <option value="">Belum ada data kelas</option>
            ) : (
              daftarTingkatUnik.map(t => <option key={t} value={t}>Kelas {t}</option>)
            )}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Rombongan Belajar</label>
          <select value={selectedRombel} onChange={(e) => setSelectedRombel(e.target.value)} className="w-full p-3.5 bg-slate-100 border-2 border-transparent focus:border-slate-900 rounded-xl font-bold text-xs outline-none transition-all">
            {rombelTersediaSesuaiFilter.length === 0 ? (
              <option value="">Pilih Rombel</option>
            ) : (
              rombelTersediaSesuaiFilter.map(r => (
                <option key={r.id} value={r.nama_kelas}>{r.nama_kelas}</option>
              ))
            )}
          </select>
        </div>
      </div>

      {/* JADWAL LIST VIEW */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3 font-black text-xs uppercase tracking-widest">
          <Loader2 className="animate-spin text-indigo-600" size={32} />
          Memuat Data Jadwal...
        </div>
      ) : filteredJadwal.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white border-2 border-dashed border-slate-200 rounded-[2.5rem] text-slate-300">
          <Calendar size={48} strokeWidth={1.5} />
          <p className="mt-3 font-black uppercase text-[10px] tracking-widest">Tidak ada jadwal untuk rombel ini</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredJadwal.map((item) => {
            // 💡 RE-MAPPING NAMA MAPEL: Cari nama mapel asli berdasarkan ID mapel yang disimpan
            const mapelObj = allMapel.find(m => m.id.toString() === item.mapel?.toString());
            const namaMapelAsli = mapelObj ? mapelObj.nama_mapel : `ID Mapel: ${item.mapel}`;

            return (
              <div key={item.id} className="bg-white rounded-[2rem] border-2 border-slate-100 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group relative overflow-hidden">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-wider">
                      <Clock size={12} />
                      {item.jam_mulai.slice(0, 5)} - {item.jam_selesai.slice(0, 5)}
                    </div>
                    <div className="flex gap-1 transition-all">
                      <button onClick={() => bukaModalEdit(item)} className="p-2 text-slate-400 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 rounded-lg transition-all">
                        <Edit size={14} />
                      </button>
                      <button onClick={() => handleDelete(item.id)} className="p-2 text-slate-400 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 rounded-lg transition-all">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 bg-slate-100 text-slate-800 rounded-xl mt-0.5">
                        <BookOpen size={16} />
                      </div>
                      <div>
                        {/* 💡 Menampilkan Nama Mapel asli hasil mapping */}
                        <h3 className="font-black text-slate-900 text-sm tracking-tight leading-snug uppercase">{namaMapelAsli}</h3>
                        
                        {item.nama_guru ? (
                          <div className="mt-1.5 flex flex-col text-[11px] font-bold text-slate-500">
                            <span className="text-slate-800 font-extrabold flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              {item.nama_guru}
                            </span>
                            <span className="text-[9px] text-slate-400 ml-2.5">NIP. {item.nip_guru || "-"}</span>
                          </div>
                        ) : (
                          <div className="mt-1 text-[10px] font-bold text-slate-400 italic flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                            Tidak Ada Guru / Kegiatan Umum
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-50 flex justify-between items-center text-[10px] font-bold text-slate-400">
                  <span className="uppercase tracking-wider">Rombel {item.rombel}</span>
                  <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600 uppercase tracking-tighter text-[9px] font-black">Kelas {item.kelas}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* DIALOG POPUP MODAL EDIT */}
      {editingItem && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] border-2 border-slate-100 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h2 className="text-lg font-black text-slate-900 uppercase tracking-tighter">Edit Data Jadwal</h2>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Hari {editingItem.hari} • Rombel {editingItem.rombel}</p>
              </div>
              <button onClick={() => setEditingItem(null)} className="p-2.5 bg-white border border-slate-200 text-slate-400 hover:text-slate-900 rounded-xl transition-all shadow-sm">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="p-6 md:p-8 space-y-6">
              {/* DROPDOWN MAPEL + KEGIATAN (VALUE DIUBAH MENJADI ID) */}
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Mata Pelajaran / Kegiatan</label>
                <select 
                  name="mapel" 
                  value={modalSelectedMapel}
                  onChange={(e) => {
                    const nextMapelId = e.target.value;
                    setModalSelectedMapel(nextMapelId);
                    
                    const selectGuru = document.getElementById("modal_guru_select") as HTMLSelectElement;
                    if (selectGuru) {
                      const targetMapelObj = allMapel.find(m => m.id.toString() === nextMapelId.toString());
                      
                      if (targetMapelObj?.kelompok === "Kegiatan") {
                        selectGuru.value = "";
                        selectGuru.disabled = true;
                      } else {
                        selectGuru.disabled = false;
                        // Pencarian kecocokan guru berdasarkan ID mapel yang string-nya sama
                        const guruCocok = allGurus.find(g => g.mapel?.toString() === nextMapelId.toString());
                        selectGuru.value = guruCocok ? guruCocok.id.toString() : "";
                      }
                    }
                  }}
                  className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-slate-900 rounded-xl font-bold text-xs outline-none transition-all"
                >
                  <option value="">Pilih Mapel / Kegiatan</option>
                  <optgroup label="MATA PELAJARAN">
                    {allMapel.filter(m => m.kelompok !== "Kegiatan").map(m => (
                      <option key={m.id} value={m.id}>{m.nama_mapel} ({m.kelompok})</option>
                    ))}
                  </optgroup>
                  <optgroup label="KEGIATAN SEKOLAH">
                    {allMapel.filter(m => m.kelompok === "Kegiatan").map(m => (
                      <option key={m.id} value={m.id}>{m.nama_mapel}</option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {/* DROPDOWN GURU */}
              <div className="space-y-1">
                <label className="text-[9px] font-black text-indigo-600 uppercase ml-2">Guru Pengampu</label>
                <select 
                  id="modal_guru_select"
                  name="guru_id" 
                  defaultValue={editingItem.guru_id || ""}
                  disabled={allMapel.find(m => m.id.toString() === modalSelectedMapel)?.kelompok === "Kegiatan"}
                  className="w-full p-4 bg-indigo-50/50 border-2 border-transparent focus:border-indigo-600 rounded-xl font-bold text-xs outline-none transition-all disabled:opacity-40 disabled:bg-slate-100"
                >
                  <option value="">-- Tidak Ada Guru / Kegiatan --</option>
                  
                  <optgroup label="GURU MAPEL INI">
                    {allGurus.filter(g => g.mapel?.toString() === modalSelectedMapel).map(g => (
                      <option key={g.id} value={g.id}>{g.nama} (NIP: {g.nip || "-"})</option>
                    ))}
                  </optgroup>

                  <optgroup label="SEMUA DAFTAR GURU">
                    {allGurus.map(g => (
                      <option key={g.id} value={g.id}>{g.nama} (NIP: {g.nip || "-"})</option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {/* WAKTU EDIT */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-blue-600 uppercase ml-2">Jam Mulai</label>
                  <input 
                    name="jam_mulai" 
                    type="time" 
                    defaultValue={editingItem.jam_mulai.slice(0, 5)} 
                    className="w-full p-4 bg-blue-50/30 border-2 border-transparent focus:border-blue-500 rounded-xl font-bold text-xs outline-none transition-all" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-rose-600 uppercase ml-2">Jam Selesai</label>
                  <input 
                    name="jam_selesai" 
                    type="time" 
                    defaultValue={editingItem.jam_selesai.slice(0, 5)} 
                    className="w-full p-4 bg-rose-50/30 border-2 border-transparent focus:border-rose-500 rounded-xl font-bold text-xs outline-none transition-all" 
                  />
                </div>
              </div>

              {/* SUBMIT BUTTON */}
              <button 
                type="submit" 
                disabled={updateLoading}
                className="w-full mt-2 bg-slate-900 hover:bg-black text-white p-4.5 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 transition-all shadow-xl disabled:opacity-50 active:scale-95"
              >
                {updateLoading ? <Loader2 className="animate-spin" /> : <Save size={16} />}
                Simpan Perubahan Jadwal
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}