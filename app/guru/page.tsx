import { auth } from "@/auth";
import { sql } from "@vercel/postgres";
import { redirect } from "next/navigation";
import { 
  Users, 
  BookOpen, 
  GraduationCap, 
  ClipboardCheck, 
  AlertCircle,
  ArrowUpRight,
  UserCheck
} from "lucide-react";
import StatistikChart from "@/components/StatistikChart";
import Link from "next/link";

export default async function DashboardGuru() {
  const session = await auth();
  if (!session?.user || session.user.role !== "guru") {
    redirect("/");
  }

  const guruId = session.user.id;
  const nipGuru = session.user.username;
  const kelasWali = session.user.kelasWali; // Data dari session wali kelas

  // 1. Ambil Data Universal (Gunakan NIP untuk mencari ID Guru yang benar)
const statsGuru = await sql`
  SELECT 
    (SELECT COUNT(DISTINCT rombel) FROM murid) as total_semua_kelas,
    (
      SELECT count(*) FROM nilai 
      WHERE guru_id::text = ${nipGuru}::text -- <-- LANGSUNG KUNCI MENGGUNAKAN NIP GURU
    ) as total_input_nilai,
    (SELECT mapel FROM guru WHERE nip = ${nipGuru} LIMIT 1) as mapel
`;

  // 2. Ambil Data Khusus Wali Kelas (Jika ada)
  let statsWali = null;
  let catatanTerbaru: any[] = [];
  
  if (kelasWali) {
  const resWali = await sql`
    SELECT 
      -- Menghitung total murid di kelas perwalian
      (SELECT COUNT(*) FROM murid WHERE rombel = ${kelasWali}) as total_murid_perwalian,

      -- Menghitung alpa hari ini dengan JOIN ke tabel murid untuk filter rombel
      (SELECT COUNT(*) 
       FROM kehadiran k
       JOIN murid m ON k.murid_id = m.id
       WHERE m.rombel = ${kelasWali} 
       AND k.tanggal = CURRENT_DATE 
       AND k.status = 'Alpa') as alpa_hari_ini,

      -- Menghitung total kasus kedisiplinan murid di kelas tersebut
      (SELECT COUNT(*) 
       FROM catatan_kedisiplinan ck
       JOIN murid m ON ck.murid_id = m.id
       WHERE m.rombel = ${kelasWali}) as total_kasus
  `;
  statsWali = resWali.rows[0];

    // Ambil 5 catatan kedisiplinan terbaru untuk kelas ini
    const resCatatan = await sql`
      SELECT c.*, m.nama as nama_murid 
      FROM catatan_kedisiplinan c
      JOIN murid m ON c.murid_id = m.id
      WHERE m.rombel = ${kelasWali}
      ORDER BY c.created_at DESC
      LIMIT 5
    `;
    catatanTerbaru = resCatatan.rows;
  }

  const dataGuru = statsGuru.rows[0];

// Ambil rata-rata nilai per rombel untuk grafik
const grafikRes = await sql`
  SELECT 
    m.rombel, 
    AVG(n.nilai_angka)::numeric(10,2) as rata 
  FROM nilai n
  JOIN murid m ON n.murid_id = m.id
  WHERE n.guru_id::text = ${nipGuru}::text -- <-- LANGSUNG KUNCI MENGGUNAKAN NIP GURU
  GROUP BY m.rombel
  ORDER BY m.rombel ASC
`;

const dataGrafik = grafikRes.rows.map((row: any) => ({
  rombel: row.rombel,
  rata: parseFloat(row.rata) // Tambahkan Number() di sini Ridwan!
}));

  return (
    <div className="p-6 lg:p-10 space-y-8">
      {/* GREETING SECTION */}
      <div>
        <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">
          Selamat Datang Kembali, {session.user.name}
        </h1>
        <p className="text-slate-500 font-medium italic mt-1">
          {kelasWali ? `Wali Kelas ${kelasWali} • Guru Mata Pelajaran ${dataGuru.mapel}`  : `Guru Mata Pelajaran ${dataGuru.mapel}`} • Dashboard Monitoring
        </p>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Universal Card 1 */}
        <div className="bg-white p-6 rounded-[2rem] border-2 border-slate-100 shadow-sm">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4">
            <BookOpen size={24} />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Input Nilai</p>
          <h3 className="text-3xl font-black text-slate-900">{dataGuru.total_input_nilai}</h3>
        </div>

        {/* Conditional Cards for Wali Kelas */}
        {kelasWali && (
          <>
            <div className="bg-white p-6 rounded-[2rem] border-2 border-slate-100 shadow-sm">
              <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-4">
                <Users size={24} />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Murid Kelas {kelasWali}</p>
              <h3 className="text-3xl font-black text-slate-900">{statsWali?.total_murid_perwalian}</h3>
            </div>

            <div className="bg-white p-6 rounded-[2rem] border-2 border-slate-100 shadow-sm border-b-rose-500 border-b-4">
              <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mb-4">
                <UserCheck size={24} />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Alpa Hari Ini</p>
              <h3 className="text-3xl font-black text-rose-600">{statsWali?.alpa_hari_ini}</h3>
            </div>

            <div className="bg-white p-6 rounded-[2rem] border-2 border-slate-100 shadow-sm border-b-amber-500 border-b-4">
              <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-4">
                <AlertCircle size={24} />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kasus Kedisiplinan</p>
              <h3 className="text-3xl font-black text-amber-600">{statsWali?.total_kasus}</h3>
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* MAIN CONTENT AREA */}
        <div className="lg:col-span-2 space-y-6">
<div className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-100 min-h-[400px]">
  <div className="flex justify-between items-center mb-6">
    <div>
       <h4 className="font-black text-slate-900 uppercase text-sm tracking-tight">Rata-rata Nilai per Rombel</h4>
       <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Berdasarkan data input nilai terakhir</p>
    </div>
  </div>
  
  {/* Masukkan Komponen Grafik di Sini */}
  <div className="h-[300px] min-h-[300px] w-full relative">
  {dataGrafik.length > 0 ? (
      <StatistikChart data={dataGrafik} />
    ) : (
      <div className="h-full flex items-center justify-center border-2 border-dashed border-slate-100 rounded-3xl">
         <p className="text-[10px] font-black text-slate-300 uppercase italic">Belum ada data nilai</p>
      </div>
    )}
    </div>
</div>

          {/* Wali Kelas: Catatan Kedisiplinan Terbaru */}
          {kelasWali && (
            <div className="bg-white rounded-[2.5rem] border-2 border-slate-100 overflow-hidden">
              <div className="p-6 border-b border-slate-50 flex justify-between items-center">
                <h4 className="font-black text-slate-900 uppercase text-sm tracking-tighter flex items-center gap-2">
                  <AlertCircle size={18} className="text-amber-500" /> Kasus Terbaru di {kelasWali}
                </h4>
                <Link href="/guru/kedisiplinan" className="text-[10px] font-black text-blue-600 uppercase hover:underline">Lihat Semua</Link>
              </div>
              <div className="p-2">
                {catatanTerbaru.length > 0 ? catatanTerbaru.map((catatan: any) => (
                  <div key={catatan.id} className="p-4 hover:bg-slate-50 rounded-2xl transition-all flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center font-black text-slate-400 group-hover:bg-rose-100 group-hover:text-rose-600 transition-all">
                        {catatan.nama_murid.charAt(0)}
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-900 uppercase">{catatan.nama_murid}</p>
                        <p className="text-[10px] text-slate-500 italic">"{catatan.keterangan}"</p>
                      </div>
                    </div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase bg-slate-100 px-2 py-1 rounded-md">
                      {catatan.kategori}
                    </span>
                  </div>
                )) : (
                  <div className="p-10 text-center text-slate-400 text-xs font-bold uppercase italic">Belum ada catatan kasus.</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT SIDEBAR ACTIONS */}
        <div className="space-y-6">
          <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white space-y-4">
            <h4 className="font-black uppercase text-xs tracking-widest text-slate-400">Aksi Cepat</h4>
            <div className="grid grid-cols-1 gap-3">
              <Link href="/guru/inputnilai" className="flex items-center justify-between p-4 bg-white/10 hover:bg-white/20 rounded-2xl transition-all group">
                <span className="text-xs font-black uppercase tracking-tight">Input Nilai Baru</span>
                <ArrowUpRight size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
              </Link>
              
              {kelasWali && (
                <>
                  <Link href="/guru/kehadiran" className="flex items-center justify-between p-4 bg-white/10 hover:bg-white/20 rounded-2xl transition-all group">
                    <span className="text-xs font-black uppercase tracking-tight">Absensi Kelas</span>
                    <ClipboardCheck size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
                  </Link>
                  <Link href="/guru/kedisiplinan" className="flex items-center justify-between p-4 bg-rose-500/20 hover:bg-rose-500/40 border border-rose-500/30 rounded-2xl transition-all group">
                    <span className="text-xs font-black uppercase tracking-tight text-rose-300">Catat Pelanggaran</span>
                    <AlertCircle size={18} className="text-rose-300 group-hover:scale-110 transition-all" />
                  </Link>
                </>
              )}
            </div>
          </div>

          <div className="bg-blue-50 p-8 rounded-[2.5rem] border border-blue-100">
             <h4 className="font-black text-blue-900 uppercase text-xs mb-2">Informasi Sistem</h4>
             <p className="text-[10px] text-blue-700 font-medium leading-relaxed">
               Gunakan menu di samping untuk mengelola data perwalian. Pastikan untuk selalu melakukan sinkronisasi data kehadiran setiap hari sebelum jam pulang sekolah.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}