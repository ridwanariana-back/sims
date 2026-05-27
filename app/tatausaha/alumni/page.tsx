import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { sql } from '@vercel/postgres';
import { getDaftarAlumni } from '@/lib/actions';
import AlumniClientView from '@/components/AlumniClientView';

export default async function AlumniPage() {
  const session = await auth();

  if (!session || session.user.role?.toLowerCase() !== 'tata_usaha') {
    redirect('/');
  }

  const sId = session.user?.sekolah_id || (session.user as any)?.sekolahId;
  const sekolahId = sId ? parseInt(sId.toString()) : null;

  if (!sekolahId) {
    return <div className="p-8 text-center text-red-600 font-bold">Akses Ditolak.</div>;
  }

  // Ambil data alumni yang sudah di-join
  const listAlumni = await getDaftarAlumni(sekolahId);

  // Ambil list murid untuk dropdown pendaftaran alumni
  const muridQuery = await sql`
    SELECT id, nama, nisn FROM murid 
    WHERE sekolah_id = ${sekolahId} AND status = 'lulus'
    ORDER BY nama ASC
  `;

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <AlumniClientView 
        sekolahId={sekolahId}
        initialAlumni={listAlumni}
        allMurid={muridQuery.rows}
      />
    </div>
  );
}