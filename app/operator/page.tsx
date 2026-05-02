import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getOperatorStats } from '@/lib/actions';
import { 
  Users, 
  UserPlus, 
  GraduationCap, 
  ArrowRight, 
  LayoutDashboard, 
  ShieldCheck,
  Zap
} from 'lucide-react';
import Link from 'next/link';

export default async function OperatorDashboardPage() {
  // 1. Proteksi Halaman & Ambil Session
  const session = await auth();
  
  if (!session || session.user.role !== 'operator') {
    redirect('/');
  }

  // 2. Ambil Data Real-time dari Database
  const stats = await getOperatorStats();

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      {/* Header Info */}
      <div className="mb-8 flex justify-between items-end">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 mb-1">
            <LayoutDashboard size={18} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Sistem Informasi Manajemen Sekolah</span>
          </div>
          <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tight">Dashboard Operator</h1>
          <p className="text-sm text-slate-500 font-medium">
            Selamat datang kembali, <span className="text-indigo-600 font-bold">{session.user.name}</span>
          </p>
        </div>
        
        <div className="hidden md:block text-right">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status Server</p>
          <div className="flex items-center gap-2 text-emerald-500 font-bold text-sm">
            <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />
            Sistem Optimal
          </div>
        </div>
      </div>

      {/* Stats Grid - Menampilkan data dari variable 'stats' */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Total Akun */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 group hover:shadow-md transition-all">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <Users size={24} />
            </div>
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Database</span>
          </div>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Total Akun User</p>
          <p className="text-3xl font-black text-slate-800">{stats.totalUsers}</p>
        </div>

        {/* Aktivasi Tertunda (Guru tanpa akun) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 group hover:shadow-md transition-all">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-amber-50 rounded-xl text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <UserPlus size={24} />
            </div>
            <span className="text-[10px] font-black text-amber-300 uppercase tracking-widest">Perlu Tindakan</span>
          </div>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Aktivasi Tertunda</p>
          <p className="text-3xl font-black text-slate-800">
            {stats.pendingGuru} <span className="text-xs text-slate-400 font-medium">Guru</span>
          </p>
        </div>

        {/* Wali Kelas */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 group hover:shadow-md transition-all">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-purple-50 rounded-xl text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <GraduationCap size={24} />
            </div>
            <span className="text-[10px] font-black text-purple-300 uppercase tracking-widest">Penugasan</span>
          </div>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Wali Kelas</p>
          <p className="text-3xl font-black text-slate-800">{stats.totalWaliKelas}</p>
        </div>
      </div>

      {/* Main Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Menu Navigasi Cepat */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest flex items-center gap-2">
                <ShieldCheck size={16} className="text-indigo-500" /> Kendali Akses & Sistem
              </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link href="/operator/datauser" className="group p-5 rounded-2xl border-2 border-slate-50 hover:border-indigo-100 hover:bg-indigo-50/30 transition-all">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">Manajemen Akun</h4>
                  <Zap size={14} className="text-slate-300 group-hover:text-indigo-400" />
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Kelola hak akses login untuk Guru, Tata Usaha, dan pimpinan sekolah.
                </p>
                <div className="mt-4 flex items-center text-[10px] font-black text-indigo-500 uppercase tracking-widest gap-1 group-hover:gap-2 transition-all">
                  Kelola Sekarang <ArrowRight size={12} />
                </div>
              </Link>

              <Link href="/operator/datawalikelas" className="group p-5 rounded-2xl border-2 border-slate-50 hover:border-purple-100 hover:bg-purple-50/30 transition-all">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-slate-700 group-hover:text-purple-600 transition-colors">Data Wali Kelas</h4>
                  <Zap size={14} className="text-slate-300 group-hover:text-purple-400" />
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Pasangkan akun guru yang aktif dengan kelas yang tersedia di sistem.
                </p>
                <div className="mt-4 flex items-center text-[10px] font-black text-purple-500 uppercase tracking-widest gap-1 group-hover:gap-2 transition-all">
                  Atur Penugasan <ArrowRight size={12} />
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Info Box Biru (Notifikasi Penting) */}
        <div className="bg-indigo-600 rounded-3xl p-8 text-white shadow-xl shadow-indigo-200 relative overflow-hidden flex flex-col justify-between">
          {/* Aksesoris Background */}
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
          
          <div className="relative z-10">
            <div className="bg-white/20 w-fit p-2 rounded-lg mb-6">
              <UserPlus size={20} />
            </div>
            <h4 className="font-black uppercase text-xs tracking-[0.2em] opacity-70 mb-3">Tugas Tertunda</h4>
            <p className="text-lg font-medium leading-snug">
              Terdapat <span className="font-black text-yellow-300 italic">{stats.pendingGuru} orang guru</span> yang datanya sudah masuk namun <span className="underline underline-offset-4">belum memiliki akun</span>.
            </p>
          </div>

          <Link 
            href="/operator/datauser" 
            className="relative z-10 mt-8 bg-white text-indigo-600 text-center py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-50 transition-all active:scale-95 shadow-lg shadow-black/10"
          >
            Buat Akun Sekarang
          </Link>
        </div>
      </div>
    </div>
  );
}