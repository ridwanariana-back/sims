// app/guru/riwayat/page.tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { sql } from "@vercel/postgres";
import { getRiwayatPerwalian, getDaftarMapel2 } from "@/lib/actions"; // 💡 Pakai getDaftarMapel asli bawanmu
import ClientRiwayatManager from "@/components/ClientRiwayatManager";

export default async function RiwayatPerwalianPage() {
  const session = await auth();

  // 1. Validasi Sesi dan Hak Akses Role Guru
  if (!session?.user || session.user.role?.toLowerCase() !== "guru") {
    redirect("/");
  }

  // 2. Parsing Multi-Tenant IDs
  const sId = session.user.sekolah_id || (session.user as any).sekolahId;
  const sekolahIdInt = sId ? parseInt(sId.toString(), 10) : null;
  const userIdFromSession = session.user.id;

  if (!sekolahIdInt || !userIdFromSession) {
    redirect("/");
  }

  // 3. Ambil ID Guru Asli lewat Join user
  const guruRes = await sql`
    SELECT g.id 
    FROM users u
    INNER JOIN guru g ON u.guru_id = g.id
    WHERE u.id = ${userIdFromSession}
  `;
  const guruData = guruRes.rows[0];
  if (!guruData) redirect("/");
  const guruIdInt = guruData.id;

  // 4. Ambil Data Riwayat (1 parameter) & Daftar Mapel secara Paralel di Server
  const [listRiwayat, rawMapel] = await Promise.all([
    getRiwayatPerwalian(guruIdInt), // 💡 Diubah jadi 1 parameter sesuai fungsimu
    getDaftarMapel2(sekolahIdInt)
  ]);

  // 5. 💡 SOLUSI ERROR: Ekstrak properti 'nama_mapel' menjadi string[]
  const daftarMapelString = rawMapel.map((item: any) => item.nama_mapel);

  return (
    <div className="p-2 text-left">
      <ClientRiwayatManager 
        initialRiwayat={listRiwayat} 
        daftarMapel={daftarMapelString} // 💡 Sekarang tipenya pas jadi string[]
        sekolahId={sekolahIdInt} 
      />
    </div>
  );
}