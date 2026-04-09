import { sql } from "@vercel/postgres";
import { getGuruTanpaAkun } from "@/lib/actions";
import AddUserModal from "@/components/AddUserModal";
import UserTable from "@/components/UserTable"; // Kita buat komponen tabel terpisah agar bisa pakai "use client"

export default async function ManajemenUserPage() {
  // Ambil data user (kecuali operator) termasuk kolom image
  const usersResult = await sql`
    SELECT id, name, username, role, image 
    FROM users 
    WHERE role != 'operator' 
    ORDER BY created_at DESC
  `;
  
  const listUsers = usersResult.rows;
  const listGuru = await getGuruTanpaAkun() as unknown as { id: number; nip: string; nama: string; }[];

  return (
    <div className="p-6 lg:p-10 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800">Manajemen User</h1>
          <p className="text-slate-500 text-sm">Kelola akun login</p>
        </div>
        <AddUserModal listGuru={listGuru} />
      </div>

      {/* Pindahkan tabel ke komponen client-side agar pagination & search jalan mulus */}
      <UserTable initialData={listUsers} />
    </div>
  );
}