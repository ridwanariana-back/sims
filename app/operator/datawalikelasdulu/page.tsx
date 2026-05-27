// app/operator/datawalikelasdulu/page.tsx
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { sql } from '@vercel/postgres';
import { History, ArrowLeft, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';
import WaliKelasTable from '@/components/WaliKelasTable';

export default async function WaliKelasWaliPage() {
  const session = await auth();
  if (!session || session.user.role?.toLowerCase() !== 'operator') {
    redirect('/');
  }

  // 1. Ambil sekolah_id dari session operator untuk mengamankan data
  const sId = session.user.sekolah_id || (session.user as any).sekolahId;
  const sekolahIdInt = sId ? parseInt(sId.toString(), 10) : null;

  if (!sekolahIdInt) {
    return <div className="p-6 text-center text-rose-600 font-bold">Error: ID Sekolah tidak ditemukan.</div>;
  }

  // 2. Ambil data master nama kelas milik sekolah ini (wajib dioper ke komponen)
  const { rows: allKelas } = await sql`
    SELECT id, nama_kelas 
    FROM kelas 
    WHERE sekolah_id = ${sekolahIdInt} 
    ORDER BY nama_kelas ASC
  `;

  // 3. Filter query menggunakan WHERE sekolah_id agar data yang tampil tidak campur aduk
  const { rows: allWaliData } = await sql`
    SELECT wk.id, g.nama as nama_guru, g.nip, wk.rombel, wk.tahun_ajaran, wk.guru_id
    FROM wali_kelas wk 
    JOIN guru g ON wk.guru_id = g.id
    WHERE wk.sekolah_id = ${sekolahIdInt}
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

      {/* 4. Panggil komponen dengan melengkapi prop yang dibutuhkan */}
      <WaliKelasTable 
        allKelas={allKelas}
        currentWali={allWaliData} 
        sekolahId={sekolahIdInt}
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