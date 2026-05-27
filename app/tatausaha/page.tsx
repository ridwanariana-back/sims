import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { sql } from '@vercel/postgres';
import { Users, GraduationCap, School, PieChart } from 'lucide-react';

export default async function OperatorDashboardPage() {
  const session = await auth();

  // 1. Proteksi Router & Role
  if (!session || session.user.role?.toLowerCase() !== 'tata_usaha') {
    redirect('/');
  }

  // 2. Ambil sekolah_id dari session user
  const sId = session.user?.sekolah_id || (session.user as any)?.sekolahId;
  const sekolahId = sId ? parseInt(sId.toString()) : null;

  if (!sekolahId) {
    return (
      <div className="p-8 bg-gray-50 min-h-screen flex items-center justify-center">
        <p className="font-black text-rose-600 uppercase tracking-widest text-xs bg-rose-50 p-6 rounded-2xl border-2 border-rose-100">
          Error: Akun Anda tidak terikat dengan instansi sekolah manapun.
        </p>
      </div>
    );
  }

  // == TAMBAHAN: Ambil data nama sekolah secara dinamis ==
  const profilSekolah = await sql`
    SELECT nama_sekolah FROM sekolah WHERE id = ${sekolahId}
  `;
  // Jika nama sekolah ditemukan di DB, pakai namanya. Jika tidak, pakai fallback text.
  const namaSekolah = profilSekolah.rows[0]?.nama_sekolah || "Tidak Ada Nama Sekolah!";

  // 3. Ambil data statistik (DIFILTER BERDASARKAN SEKOLAH_ID)
  const { count: totalGuru } = (await sql`
    SELECT COUNT(*) FROM guru WHERE sekolah_id = ${sekolahId}
  `).rows[0];

  const { count: totalMurid } = (await sql`
    SELECT COUNT(*) FROM murid WHERE sekolah_id = ${sekolahId}
  `).rows[0];

  const { count: totalKelas } = (await sql`
    SELECT COUNT(*) FROM kelas WHERE sekolah_id = ${sekolahId}
  `).rows[0];

  // 4. Data Statistik Gender Murid
  const { count: muridLaki } = (await sql`
    SELECT COUNT(*) FROM murid WHERE sekolah_id = ${sekolahId} AND UPPER(gender) = 'LAKI-LAKI'
  `).rows[0];
  
  const { count: muridPerempuan } = (await sql`
    SELECT COUNT(*) FROM murid WHERE sekolah_id = ${sekolahId} AND UPPER(gender) = 'PEREMPUAN'
  `).rows[0];

  // 5. Data Statistik Gender Guru
  const { count: guruLaki } = (await sql`
    SELECT COUNT(*) FROM guru WHERE sekolah_id = ${sekolahId} AND (gender = 'Laki-laki' OR gender = 'LAKI-LAKI')
  `).rows[0];
  
  const { count: guruPerempuan } = (await sql`
    SELECT COUNT(*) FROM guru WHERE sekolah_id = ${sekolahId} AND (gender = 'Perempuan' OR gender = 'PEREMPUAN')
  `).rows[0];

  const stats = [
    { label: 'Total Guru', val: totalGuru, color: 'text-emerald-600', icon: Users, bg: 'bg-emerald-50' },
    { label: 'Total Murid', val: totalMurid, color: 'text-blue-600', icon: GraduationCap, bg: 'bg-blue-50' },
    { label: 'Total Rombel', val: totalKelas, color: 'text-indigo-600', icon: School, bg: 'bg-indigo-50' },
  ];

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="mb-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Dashboard Tata Usaha</h1>
          <p className="text-slate-500 font-medium">Sistem Informasi Manajemen Sekolah</p>
        </div>
        
        {/* == PENANDA SEKOLAH AKTIF == */}
        <div className="bg-blue-600 px-5 py-3 rounded-2xl shadow-sm text-white flex items-center gap-3 self-start md:self-auto">
          <School size={20} className="text-blue-200" />
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-blue-200">Sekolah Aktif</p>
            <p className="text-sm font-bold uppercase tracking-wide">{namaSekolah}</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex items-center gap-5">
            <div className={`p-4 rounded-2xl ${stat.bg}`}>
              <stat.icon className={`${stat.color}`} size={28} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
              <p className={`text-3xl font-black ${stat.color}`}>{stat.val}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Area Grafik Gender */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Statistik Murid */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-black text-slate-900 uppercase">Statistik Gender Murid</h3>
              <p className="text-[10px] text-slate-400 font-black uppercase">Perbandingan Siswa & Siswi</p>
            </div>
            <PieChart className="text-blue-500" />
          </div>
          <div className="space-y-5">
            <StatBar label="Laki-Laki" value={muridLaki} total={totalMurid} color="bg-blue-500" />
            <StatBar label="Perempuan" value={muridPerempuan} total={totalMurid} color="bg-pink-500" />
          </div>
        </div>

        {/* Statistik Guru */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-black text-slate-900 uppercase">Statistik Gender Guru</h3>
              <p className="text-[10px] text-slate-400 font-black uppercase">Komposisi Tenaga Pengajar</p>
            </div>
            <PieChart className="text-emerald-500" />
          </div>
          <div className="space-y-5">
            <StatBar label="Laki-Laki" value={guruLaki} total={totalGuru} color="bg-emerald-500" />
            <StatBar label="Perempuan" value={guruPerempuan} total={totalGuru} color="bg-orange-500" />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatBar({ label, value, total, color }: { label: string, value: any, total: any, color: string }) {
  const percentage = total > 0 ? (Number(value) / Number(total)) * 100 : 0;
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-[11px] font-black uppercase text-slate-700">
        <span>{label}</span>
        <span>{value} Orang ({Math.round(percentage)}%)</span>
      </div>
      <div className="w-full bg-slate-100 h-4 rounded-xl overflow-hidden">
        <div 
          className={`${color} h-full transition-all duration-1000 ease-out`} 
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}