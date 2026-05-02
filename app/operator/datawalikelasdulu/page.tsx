import { sql } from '@vercel/postgres';
import { History, ArrowLeft, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';
import WaliKelasTable from '@/components/WaliKelasTable';

export default async function WaliKelasDuluPage() {
  const { rows: allWaliData } = await sql`
    SELECT wk.id, g.nama as nama_guru, g.nip, wk.rombel, wk.tahun_ajaran, wk.guru_id
    FROM wali_kelas wk 
    JOIN guru g ON wk.guru_id = g.id
    ORDER BY wk.tahun_ajaran DESC, wk.rombel ASC
  `;

  return (
    <div className="p-8 bg-gray-50 min-h-screen text-left">
      <div className="mb-10">
        <div className="flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-widest mb-4">
          <LayoutDashboard size={12} />
          <Link href="/operator/datawalikelas" className="hover:text-blue-600 transition-all">Manajemen Wali Kelas</Link>
          <span>/</span>
          <span className="text-blue-600">Arsip Riwayat</span>
        </div>
        
        <h1 className="text-3xl font-black text-slate-900 uppercase flex items-center gap-3">
          <History className="text-slate-400" size={32} /> Riwayat Wali Kelas
        </h1>
        <p className="text-slate-500 font-bold text-xs uppercase mt-1">Arsip data penugasan periode terdahulu</p>
      </div>

      {/* Gunakan komponen table yang sama dengan flag isReadOnly[cite: 1] */}
      <WaliKelasTable 
        currentWali={allWaliData} 
        isReadOnly={true} 
      />

      <div className="mt-12 text-center">
         <Link href="/operator/datawalikelas" className="inline-flex items-center gap-2 bg-white border-2 border-slate-200 px-6 py-3 rounded-2xl font-black text-[10px] uppercase text-slate-500 hover:border-blue-600 hover:text-blue-600 transition-all">
            <ArrowLeft size={14} /> Kembali ke Data Aktif
         </Link>
      </div>
    </div>
  );
}