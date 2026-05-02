import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { sql } from '@vercel/postgres';
import WaliKelasTable from '@/components/WaliKelasTable';
import { ShieldCheck, History, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';

export default async function WaliKelasPage() {
  const session = await auth();
  if (!session || (session.user.role !== 'tatausaha' && session.user.role !== 'operator')) {
    redirect('/');
  }

  const d = new Date();
  const TAHUN_AKTIF = d.getMonth() + 1 > 6 ? `${d.getFullYear()}/${d.getFullYear() + 1}` : `${d.getFullYear() - 1}/${d.getFullYear()}`;

  // Ambil NIP juga di sini
  const { rows: allGuru } = await sql`SELECT id, nama, nip FROM guru ORDER BY nama ASC`;
  
  const { rows: currentWali } = await sql`
    SELECT wk.id, g.nama as nama_guru, g.nip, wk.rombel, wk.tahun_ajaran, wk.guru_id 
    FROM wali_kelas wk 
    JOIN guru g ON wk.guru_id = g.id
    ORDER BY wk.tahun_ajaran DESC, wk.rombel ASC
  `;

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10 text-left">
        <div>
          <div className="flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">
            <LayoutDashboard size={12} />
            <span>Sistem</span> / <span className="text-blue-600">Manajemen Wali Kelas</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
            <ShieldCheck className="text-blue-600" size={32} /> Data Wali Kelas
          </h1>
          <p className="text-slate-500 font-bold text-xs uppercase mt-1">Penugasan Guru penanggung jawab rombel</p>
        </div>
        
        <div className="bg-white px-6 py-4 rounded-3xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="text-right">
            <p className="text-[9px] font-black text-slate-400 uppercase">Wali Aktif</p>
            <p className="text-xl font-black text-slate-900">{currentWali.filter(w => w.tahun_ajaran === TAHUN_AKTIF).length} Guru</p>
          </div>
          <div className="w-[2px] h-8 bg-slate-100"></div>
          <Link href="/operator/datawalikelasdulu" className="flex items-center gap-2 bg-slate-100 hover:bg-slate-900 hover:text-white px-5 py-2.5 rounded-2xl transition-all group">
            <History size={16} className="text-slate-500 group-hover:text-white" />
            <span className="text-[10px] font-black uppercase tracking-tighter">Data Periode Terdahulu</span>
          </Link>
        </div>
      </div>

      <WaliKelasTable allGuru={allGuru} currentWali={currentWali} />
    </div>
  );
}