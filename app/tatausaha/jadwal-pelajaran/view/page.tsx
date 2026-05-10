"use client";

import { useState, useEffect } from "react";
import { 
  Calendar, 
  BookOpen, 
  Clock, 
  Users, 
  Trash2, 
  Edit, 
  X, 
  Save, 
  Loader2, 
  ArrowLeft 
} from "lucide-react";
import Link from "next/link";
import { 
  getJadwalPelajaran, 
  getTahunAjaranDinamis, 
  deleteJadwalPelajaran, 
  updateJadwalPelajaran 
} from "@/lib/actions";

const DAFTAR_HARI = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"];
const DAFTAR_MAPEL = [
  "PAI & BudiPekerti", "PKN", "Bahasa Indonesia", "Bahasa Inggris", 
  "Bahasa Inggris Tingkat Lanjut", "Matematika Wajib", "Matematika Tingkat Lanjut", 
  "Fisika", "Fisika Mapel Pilihan", "Biologi", "Biologi Mapel Pilihan", 
  "Kimia", "Kimia Mapel Pilihan", "Sejarah", "Sejarah Tingkat Lanjut", 
  "Geografi", "Geografi Mapel Pilihan", "Ekonomi", "Ekonomi Mapel Pilihan", 
  "Sosiologi", "Sosiologi Mapel Pilihan", "Seni Budaya", "Penjas Orkes", 
  "PKWU", "Informatika", "Bimbingan Konseling"
];

export default function ViewJadwalPage() {
  const [jadwal, setJadwal] = useState<any[]>([]);
  const [tahun, setTahun] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [updateLoading, setUpdateLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const thn = await getTahunAjaranDinamis();
    setTahun(thn);
    const data = await getJadwalPelajaran(thn);
    setJadwal(data);
    setLoading(false);
  };

  const handleDelete = async (id: number) => {
    if (confirm("Apakah Anda yakin ingin menghapus jadwal ini?")) {
      const res = await deleteJadwalPelajaran(id);
      if (res.success) {
        fetchData();
      } else {
        alert("Gagal menghapus data.");
      }
    }
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setUpdateLoading(true);
    const fd = new FormData(e.currentTarget);
    const data = {
      mapel: fd.get("mapel"),
      jam_mulai: fd.get("jam_mulai"),
      jam_selesai: fd.get("jam_selesai"),
      hari: editingItem.hari,
      kelas: editingItem.kelas,
      rombel: editingItem.rombel
    };

    const res = await updateJadwalPelajaran(editingItem.id, data);
    if (res.success) {
      alert("Jadwal berhasil diperbarui!");
      setEditingItem(null);
      fetchData();
    } else {
      alert(res.message);
    }
    setUpdateLoading(false);
  };

  // Mengelompokkan data berdasarkan Kelas + Rombel
  const groupedJadwal = jadwal.reduce((acc: any, curr: any) => {
    const key = `${curr.kelas} - ${curr.rombel}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(curr);
    return acc;
  }, {});

  return (
    <div className="p-8 space-y-8 bg-slate-50 min-h-screen pb-20">
      {/* HEADER */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-6">
          <Link href="/tatausaha/jadwal-pelajaran" className="p-4 bg-slate-100 rounded-2xl text-slate-600 hover:bg-slate-200 transition-all">
            <ArrowLeft size={20} />
          </Link>
          <div className="w-16 h-16 bg-blue-600 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-blue-100">
            <BookOpen size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-none">
              Data Jadwal Pelajaran
            </h1>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-[9px] mt-2 italic">
              Tahun Ajaran: {tahun} | Pengaturan Jadwal Mingguan
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="animate-spin text-blue-600" size={40} />
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Memuat Data...</p>
        </div>
      ) : Object.keys(groupedJadwal).length === 0 ? (
        <div className="bg-white p-20 rounded-[3rem] border border-dashed border-slate-300 text-center">
           <p className="text-slate-400 font-black uppercase text-sm italic">Belum ada jadwal yang diinputkan.</p>
        </div>
      ) : (
        <div className="space-y-12">
          {Object.keys(groupedJadwal).sort().map((groupKey) => (
            <div key={groupKey} className="bg-white rounded-[3rem] border border-slate-200 overflow-hidden shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-slate-900 px-10 py-6 flex justify-between items-center">
                <h2 className="text-white font-black uppercase tracking-widest text-sm flex items-center gap-3">
                  <Users size={18} className="text-blue-400" /> KELAS: {groupKey}
                </h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase text-center border-r w-32">Waktu</th>
                      {DAFTAR_HARI.map(hari => (
                        <th key={hari} className="px-6 py-5 text-[10px] font-black text-slate-600 uppercase text-center border-r">
                          {hari}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {/* Mengambil jam unik dan mengurutkannya */}
                    {Array.from(new Set(groupedJadwal[groupKey].map((j:any) => `${j.jam_mulai.slice(0,5)} - ${j.jam_selesai.slice(0,5)}`)))
                      .sort()
                      .map((timeSlot: any) => (
                        <tr key={timeSlot} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-8 text-center border-r">
                            <span className="bg-slate-100 px-4 py-2 rounded-xl text-[10px] font-black text-slate-600 border border-slate-200">
                              {timeSlot}
                            </span>
                          </td>
                          {DAFTAR_HARI.map(hari => {
                            const item = groupedJadwal[groupKey].find((j:any) => 
                              j.hari === hari && `${j.jam_mulai.slice(0,5)} - ${j.jam_selesai.slice(0,5)}` === timeSlot
                            );
                            return (
                              <td key={hari} className="px-4 py-4 border-r text-center relative group">
                                {item ? (
                                  <div className="bg-blue-50 border-2 border-blue-100 p-4 rounded-2xl transition-all group-hover:border-blue-400 relative">
                                    <p className="text-[11px] font-black text-blue-800 uppercase leading-tight mb-1">
                                      {item.mapel}
                                    </p>
                                    
                                    {/* Action Buttons on Hover */}
                                    <div className="absolute -top-3 -right-3 hidden group-hover:flex gap-1 animate-in zoom-in duration-200">
                                      <button 
                                        onClick={() => setEditingItem(item)}
                                        className="bg-amber-500 text-white p-2 rounded-xl shadow-lg hover:bg-amber-600 transition-all"
                                      >
                                        <Edit size={12} />
                                      </button>
                                      <button 
                                        onClick={() => handleDelete(item.id)}
                                        className="bg-rose-500 text-white p-2 rounded-xl shadow-lg hover:bg-rose-600 transition-all"
                                      >
                                        <Trash2 size={12} />
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-slate-200 font-black text-[10px]">-</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL EDIT */}
      {editingItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[3rem] p-10 shadow-2xl animate-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="font-black text-slate-900 uppercase tracking-tighter text-xl">Edit Jadwal</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{editingItem.kelas} - {editingItem.rombel} | {editingItem.hari}</p>
              </div>
              <button onClick={() => setEditingItem(null)} className="p-2 bg-slate-100 rounded-xl text-slate-400 hover:text-slate-900 transition-all">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleUpdate} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-2">Mata Pelajaran</label>
                <select 
                  name="mapel" 
                  defaultValue={editingItem.mapel} 
                  className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-blue-500 rounded-2xl font-black text-sm outline-none transition-all"
                >
                  {DAFTAR_MAPEL.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase ml-2">Jam Mulai</label>
                  <input 
                    name="jam_mulai" 
                    type="time" 
                    defaultValue={editingItem.jam_mulai} 
                    className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-blue-500 rounded-2xl font-black text-sm outline-none transition-all" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase ml-2">Jam Selesai</label>
                  <input 
                    name="jam_selesai" 
                    type="time" 
                    defaultValue={editingItem.jam_selesai} 
                    className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-blue-500 rounded-2xl font-black text-sm outline-none transition-all" 
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={updateLoading}
                className="w-full bg-slate-900 hover:bg-black text-white p-5 rounded-[2rem] font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 transition-all shadow-xl disabled:opacity-50"
              >
                {updateLoading ? <Loader2 className="animate-spin" /> : <Save size={18} />}
                Simpan Perubahan
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}