import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { sql } from '@vercel/postgres';
import { getDaftarPrestasi } from '@/lib/actions';
import PrestasiClientView from '@/components/PrestasiClientView';

export default async function PrestasiPage() {
  const session = await auth();

  // 1. Proteksi Halaman
  if (!session || session.user.role?.toLowerCase() !== 'tata_usaha') {
    redirect('/');
  }

  // 2. Ambil Sekolah ID
  const sId = session.user?.sekolah_id || (session.user as any)?.sekolahId;
  const sekolahId = sId ? parseInt(sId.toString()) : null;

  if (!sekolahId) {
    return (
      <div className="p-8 text-center text-red-600 font-bold">
        Akses Ditolak: Akun Anda tidak terikat dengan instansi sekolah manapun.
      </div>
    );
  }

  // 3. Ambil data secara paralel dari database
  const listPrestasi = await getDaftarPrestasi(sekolahId);

  // Ambil data murid untuk dropdown modal
  const muridQuery = await sql`
    SELECT id, nama, rombel FROM murid 
    WHERE sekolah_id = ${sekolahId} 
    ORDER BY nama ASC
  `;
  
  // Ambil data guru untuk dropdown modal
  const guruQuery = await sql`
    SELECT id, nama, nip FROM guru 
    WHERE sekolah_id = ${sekolahId} 
    ORDER BY nama ASC
  `;

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <PrestasiClientView 
        sekolahId={sekolahId}
        initialPrestasi={listPrestasi}
        allMurid={muridQuery.rows}
        allGuru={guruQuery.rows}
      />
    </div>
  );
}