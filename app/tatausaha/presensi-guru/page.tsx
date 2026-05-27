// app/tatausaha/presensi-guru/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { 
  getMissingDatesGuru, 
  savePresensiGuruBulk,
  getTahunAjaranDinamis 
} from "@/lib/actions";
import { 
  Calendar as CalendarIcon, 
  CheckCircle2, 
  Save, 
  Loader2, 
  Users,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  History
} from "lucide-react";
import Link from "next/link";

export default function PresensiGuruPage() {
  const { data: session } = useSession();
  
  // Ambil sekolah_id dari session client-side
  const sId = session?.user?.sekolah_id || (session?.user as any)?.sekolahId;
  const sekolahIdInt = sId ? parseInt(sId.toString()) : null;

  const [daftarGuru, setDaftarGuru] = useState<any[]>([]);
  const sekarang = new Date();
  const offset = sekarang.getTimezoneOffset() * 60000;
  const today = new Date(sekarang.getTime() - offset).toISOString().split('T')[0];
  
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);
  const [attendanceData, setAttendanceData] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [isTooLong, setIsTooLong] = useState(false);

  // 1. Fetch Daftar Guru dari Database
  useEffect(() => {
    if (session) {
      fetch('/api/guru')
        .then(res => res.json())
        .then(setDaftarGuru)
        .catch(err => console.error("Gagal load guru:", err));
    }
  }, [session]);

  // 2. Logika Range Tanggal & Cek Data Kosong dengan Sekolah ID
  useEffect(() => {
    if (daftarGuru.length > 0 && sekolahIdInt) {
      const fetchDates = async () => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffDays = Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays > 7) {
          setIsTooLong(true);
          return;
        }

        setIsTooLong(false);
        const dateArray: string[] = [];
        for (let dt = new Date(start); dt <= end; dt.setDate(dt.getDate() + 1)) {
          dateArray.push(new Date(dt).toISOString().split('T')[0]);
        }

        const ids = daftarGuru.map(g => g.id);
        
        const existingDates = await getMissingDatesGuru(ids, startDate, endDate, sekolahIdInt);
        const missing = dateArray.filter(d => !existingDates.includes(d));
        
        setAvailableDates(missing);
        if (missing.length > 0) setOpenAccordion(missing[0]);
      };
      fetchDates();
    }
  }, [startDate, endDate, daftarGuru, sekolahIdInt]);

  const handleStatusChange = (date: string, guruId: number, status: string) => {
    setAttendanceData((prev: any) => ({
      ...prev,
      [date]: { ...(prev[date] || {}), [guruId]: status }
    }));
  };

  const handleSave = async () => {
    if (!sekolahIdInt) return alert("Sesi sekolah tidak valid, silahkan login ulang!");
    if (Object.keys(attendanceData).length === 0) return alert("Pilih status presensi!");
    
    setLoading(true);
    
    const currentYear = await getTahunAjaranDinamis(); 
    const finalData: any[] = [];
    
    Object.keys(attendanceData).forEach(date => {
      Object.keys(attendanceData[date]).forEach(gId => {
        finalData.push({
          sekolah_id: sekolahIdInt,
          guru_id: Number(gId),
          tanggal: date,
          status: attendanceData[date][gId],
          tahun_ajaran: currentYear
        });
      });
    });

    const res = await savePresensiGuruBulk(finalData);
    if (res.success) {
      alert("Presensi Guru Berhasil Disimpan!");
      window.location.reload();
    } else {
      alert("Gagal menyimpan presensi!");
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6 p-6">
      {/* HEADER CARD */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col lg:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-slate-900 rounded-3xl flex items-center justify-center text-white shadow-xl">
            <Users size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-none">
              Presensi Seluruh Guru
            </h1>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-[9px] mt-2 italic">
              Dashboard Tata Usaha | Maksimal Input 7 Hari
            </p>
          </div>
        </div>

        {/* Filter & Tombol Aksi */}
        <div className="flex flex-wrap gap-4 items-end justify-center lg:justify-end">
          <div className="space-y-1">
            <span className="text-[9px] font-black text-slate-400 uppercase ml-1">Mulai</span>
            <input type="date" value={startDate} max={today} onChange={(e) => setStartDate(e.target.value)} className="block p-3 bg-slate-50 border-2 border-transparent focus:border-blue-500 rounded-2xl font-bold text-xs outline-none transition-all" />
          </div>
          <div className="space-y-1">
            <span className="text-[9px] font-black text-slate-400 uppercase ml-1">Selesai</span>
            <input type="date" value={endDate} max={today} onChange={(e) => setEndDate(e.target.value)} className="block p-3 bg-slate-50 border-2 border-transparent focus:border-blue-500 rounded-2xl font-bold text-xs outline-none transition-all" />
          </div>

          <div className="flex items-center gap-3">
            <Link 
              href="/tatausaha/riwayat-hadir-guru" 
              className="flex items-center gap-2 px-6 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-black uppercase text-[10px] transition-all shadow-sm h-[46px]"
            >
              <History size={16} />
              Riwayat
            </Link>
            
            <button 
              onClick={handleSave} 
              disabled={loading} 
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs flex items-center gap-2 shadow-lg shadow-blue-100 transition-all disabled:opacity-50 h-[46px]"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              Simpan
            </button>
          </div>
        </div>
      </div>

      {/* RENDER AREA */}
      <div className="space-y-4">
        {isTooLong ? (
          <div className="bg-amber-50 border-2 border-amber-200 rounded-[2.5rem] p-12 text-center">
            <AlertTriangle size={48} className="mx-auto text-amber-500 mb-4" />
            <h3 className="text-lg font-black text-amber-900 uppercase">Rentang Terlalu Lebar</h3>
          </div>
        ) : availableDates.length > 0 ? (
          availableDates.map(date => (
            <div key={date} className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm transition-all">
              <button 
                onClick={() => setOpenAccordion(openAccordion === date ? null : date)}
                className="w-full bg-slate-900 px-8 py-5 flex justify-between items-center hover:bg-slate-800 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <CalendarIcon size={18} className="text-blue-400" />
                  <span className="text-white font-black uppercase tracking-[0.2em] text-xs">
                    {new Date(date).toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-[9px] font-black text-blue-300 uppercase tracking-widest bg-blue-500/10 px-3 py-1 rounded-full">
                    {Object.keys(attendanceData[date] || {}).length} / {daftarGuru.length} Terpilih
                  </span>
                  {openAccordion === date ? <ChevronUp className="text-white" size={20}/> : <ChevronDown className="text-white" size={20}/>}
                </div>
              </button>

              {openAccordion === date && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="w-full overflow-x-auto scrollbar-thin">
                    <table className="w-full text-left border-collapse min-w-[650px]">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/50">
                          <th className="px-6 md:px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Nama Guru</th>
                          <th className="px-6 md:px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Status Kehadiran</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {daftarGuru.map((g) => (
                          <tr key={g.id} className="hover:bg-slate-50/30 transition-colors group">
                            <td className="px-6 md:px-8 py-4">
                              <p className="text-sm font-black text-slate-900 uppercase leading-none">{g.nama}</p>
                              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-2">
                                <p className="text-[10px] font-bold text-slate-400 uppercase italic tracking-tighter">NIP: {g.nip || "-"}</p>
                                <span className="hidden sm:inline w-1 h-1 bg-slate-200 rounded-full"></span>
                                
                                {/* 💡 SEKARANG MENAMPILKAN NAMA MAPEL ASLI DARI HASIL JOIN SQL */}
                                <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">
                                  MAPEL: {g.nama_mapel_asli || g.mapel || "Belum Memilih"}
                                </p>
                              </div>
                            </td>
                            <td className="px-6 md:px-8 py-4">
                              <div className="flex items-center justify-center gap-1.5 md:gap-2">
                                {['Hadir', 'Sakit', 'Izin', 'Alpa'].map((status) => (
                                  <button
                                    key={status}
                                    type="button"
                                    onClick={() => handleStatusChange(date, g.id, status)}
                                    className={`w-16 sm:w-20 py-2.5 rounded-xl text-[9px] font-black uppercase transition-all border-2 ${
                                      attendanceData[date]?.[g.id] === status 
                                      ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-100' 
                                      : 'bg-white border-slate-100 text-slate-400 hover:border-slate-300'
                                    }`}
                                  >
                                    {status}
                                  </button>
                                ))}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-[3rem] p-24 text-center">
            <CheckCircle2 size={40} className="mx-auto text-emerald-400 mb-4" />
            <h3 className="text-xl font-black text-slate-900 uppercase">Sudah Terisi Semua</h3>
          </div>
        )}
      </div>
    </div>
  );
}