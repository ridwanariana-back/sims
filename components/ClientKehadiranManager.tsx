// components/ClientKehadiranManager.tsx
"use client";

import { useState, useEffect } from "react";
import { getMissingDatesWithSchool, saveKehadiranBulkWithSchool } from "@/lib/actions";
import { 
  Calendar as CalendarIcon, 
  CheckCircle2, 
  Save, 
  Loader2, 
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  History
} from "lucide-react";
import Link from "next/link";

interface AttendanceState {
  [date: string]: {
    [muridId: number]: string;
  };
}

interface ClientKehadiranProps {
  initialMurid: any[];
  sekolahId: number;
  guruId: number;
  tahunAjaran: string;
  kelasWali: string;
}

export default function ClientKehadiranManager({ initialMurid, sekolahId, guruId, tahunAjaran, kelasWali }: ClientKehadiranProps) {
  const sekarang = new Date();
  const year = sekarang.getFullYear();
  const month = String(sekarang.getMonth() + 1).padStart(2, '0'); // Bulan dimulai dari 0
  const day = String(sekarang.getDate()).padStart(2, '0');

  const today = `${year}-${month}-${day}`;
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);
  const [attendanceData, setAttendanceData] = useState<AttendanceState>({});
  const [loading, setLoading] = useState(false);
  const [isTooLong, setIsTooLong] = useState(false);

  useEffect(() => {
    if (initialMurid.length > 0) {
      const fetchDates = async () => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays > 7) {
          setIsTooLong(true);
          setAvailableDates([]);
          return;
        }

        setIsTooLong(false);
        const dateArray: string[] = [];
        for (let dt = new Date(start); dt <= end; dt.setDate(dt.getDate() + 1)) {
          dateArray.push(new Date(dt).toISOString().split('T')[0]);
        }

        const muridIds = initialMurid.map(m => m.id);
        const existingDates = await getMissingDatesWithSchool(muridIds, startDate, endDate, sekolahId);
        const missing = dateArray.filter(d => !existingDates.includes(d));
        
        setAvailableDates(missing);
        if (missing.length > 0) setOpenAccordion(missing[0]);
      };

      fetchDates();
    }
  }, [startDate, endDate, initialMurid, sekolahId]);

  const handleStatusChange = (date: string, muridId: number, status: string) => {
    setAttendanceData((prev: AttendanceState) => ({
      ...prev,
      [date]: { ...(prev[date] || {}), [muridId]: status }
    }));
  };

  const handleSave = async () => {
    if (Object.keys(attendanceData).length === 0) return alert("Pilih minimal satu status kehadiran!");

    setLoading(true);
    const finalData: any[] = [];
    
    Object.keys(attendanceData).forEach(date => {
      Object.keys(attendanceData[date]).forEach(mId => {
        // Catatan: Jika status 'Alpha' pastikan disesuaikan stringnya dengan CHECK constraint DB kamu ('Alpa')
        let statusDb = attendanceData[date][Number(mId)];
        if (statusDb === "Alpha") statusDb = "Alpa"; 

        finalData.push({
          murid_id: Number(mId),
          guru_id: guruId, // Mengirimkan Integer Asli
          tanggal: date,
          status: statusDb,
          tahun_ajaran: tahunAjaran 
        });
      });
    });

    const res = await saveKehadiranBulkWithSchool(finalData, sekolahId);
    if (res.success) {
      alert("Presensi Berhasil Disimpan!");
      window.location.reload(); 
    } else {
      alert("Gagal menyimpan presensi: " + res.error);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* CONTROL HEADER */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col lg:flex-row justify-between items-center gap-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-none">
            Input Presensi {kelasWali}
          </h1>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[9px] mt-2 italic">
            Periode Aktif: {tahunAjaran} | Maksimal: 7 hari terakhir
          </p>
        </div>

        <div className="flex flex-wrap gap-4 items-end justify-center lg:justify-end w-full lg:w-auto">
          <div className="space-y-1">
            <span className="text-[9px] font-black text-slate-400 uppercase ml-1">Mulai</span>
            <input type="date" value={startDate} max={today} onChange={(e) => setStartDate(e.target.value)} className="block p-3 bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-2xl font-bold text-xs outline-none transition-all" />
          </div>
          <div className="space-y-1">
            <span className="text-[9px] font-black text-slate-400 uppercase ml-1">Selesai</span>
            <input type="date" value={endDate} max={today} onChange={(e) => setEndDate(e.target.value)} className="block p-3 bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-2xl font-bold text-xs outline-none transition-all" />
          </div>
          <div className="flex gap-2">
            <Link href="/guru/kehadiran/riwayat" className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-4 rounded-2xl font-black uppercase text-xs flex items-center gap-2 transition-all">
              <History size={18} />
              Riwayat
            </Link>
            <button onClick={handleSave} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs flex items-center gap-2 shadow-lg shadow-indigo-100 transition-all disabled:opacity-50">
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
            <p className="text-amber-700 text-xs font-bold uppercase mt-1">Sistem hanya mengizinkan input maksimal 7 hari sekaligus agar data tetap akurat.</p>
          </div>
        ) : availableDates.length > 0 ? (
          availableDates.map(date => (
            <div key={date} className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm transition-all">
              <button 
                onClick={() => setOpenAccordion(openAccordion === date ? null : date)}
                className="w-full bg-slate-900 px-8 py-5 flex justify-between items-center hover:bg-slate-800 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <CalendarIcon size={18} className="text-indigo-400" />
                  <span className="text-white font-black uppercase tracking-[0.2em] text-xs">
                    {new Date(date).toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-[9px] font-black text-indigo-300 uppercase tracking-widest bg-indigo-500/10 px-3 py-1 rounded-full">
                    {Object.keys(attendanceData[date] || {}).length} / {initialMurid.length} Terpilih
                  </span>
                  {openAccordion === date ? <ChevronUp className="text-white" size={20}/> : <ChevronDown className="text-white" size={20}/>}
                </div>
              </button>

              {openAccordion === date && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/50">
                          <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Data Siswa</th>
                          <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Status Kehadiran</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {initialMurid.map((m) => (
                          <tr key={m.id} className="hover:bg-slate-50/30 transition-colors group">
                            <td className="px-8 py-4">
                              <p className="text-sm font-black text-slate-900 uppercase leading-none">{m.nama}</p>
                              <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase italic tracking-tighter">NISN: {m.nisn} • {m.gender}</p>
                            </td>
                            <td className="px-8 py-4">
                              <div className="flex justify-center gap-2">
                                {['Hadir', 'Sakit', 'Izin', 'Alpha'].map((status) => (
                                  <button
                                    key={status}
                                    onClick={() => handleStatusChange(date, m.id, status)}
                                    className={`w-20 py-2.5 rounded-xl text-[9px] font-black uppercase transition-all border-2 ${
                                      attendanceData[date]?.[m.id] === status 
                                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' 
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
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Sudah Terisi Semua</h3>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-2">Tidak ada data kosong di rentang tanggal ini.</p>
          </div>
        )}
      </div>
    </div>
  );
}