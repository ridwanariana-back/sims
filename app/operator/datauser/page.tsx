// app/operator/datauser/page.tsx
import { sql } from "@vercel/postgres";
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getGuruTanpaAkun } from "@/lib/actions";
import AddUserModal from "@/components/AddUserModal";
import UserTable from "@/components/UserTable";

export default async function ManajemenUserPage() {
  // 1. Ambil session & proteksi role
  const session = await auth();
  if (!session || session.user.role?.toLowerCase() !== 'operator') {
    redirect('/');
  }

  const sId = session.user.sekolah_id || (session.user as any).sekolahId;
  const sekolahIdInt = sId ? parseInt(sId.toString(), 10) : null;

  if (!sekolahIdInt) {
    return <div className="p-6 text-center text-rose-600 font-bold">Error: ID Sekolah tidak ditemukan.</div>;
  }

  // 2. Ambil data user (Kecuali operator) berlandaskan sekolah_id
  const usersResult = await sql`
    SELECT id, name, username, role, image, sekolah_id
    FROM users 
    WHERE role != 'operator' AND sekolah_id = ${sekolahIdInt}
    ORDER BY created_at DESC
  `;
  
  const listUsers = usersResult.rows;
  
  // 3. Ambil data guru tanpa akun yang berada di sekolah_id bersangkutan
  const listGuru = await getGuruTanpaAkun(sekolahIdInt) as unknown as { id: number; nip: string; nama: string; jenis?: string }[];

  return (
    <div className="p-6 lg:p-10 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800">Manajemen User</h1>
          <p className="text-slate-500 text-sm">Kelola akun login sekolah</p>
        </div>
        {/* Oper sekolahIdInt ke Modal agar pendaftaran akun baru tercatat ke sekolah yang benar */}
        <AddUserModal listGuru={listGuru} sekolahId={sekolahIdInt} />
      </div>

      <UserTable initialData={listUsers} />
    </div>
  );
}