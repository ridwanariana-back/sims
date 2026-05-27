// app/kepalasekolah/page.tsx
import { auth } from "@/auth"; 
import { redirect } from "next/navigation";
import { sql } from "@vercel/postgres";
import { getKepalaSekolahStats } from "@/lib/actions";
import KepalaSekolahDashboardClient from "@/components/KepalaSekolahDashboardClient";

export default async function KepalaSekolahPage() {
  // 1. Proteksi Login
  const session = await auth();
  
  if (!session?.user || session.user.role?.toLowerCase() !== "kepalasekolah") {
    redirect("/");
  }

  const sId = session.user.sekolah_id || (session.user as any).sekolahId;
  const sekolahIdInt = sId ? parseInt(sId.toString(), 10) : null;
  
  // == AMBIL DATA SEKOLAH ==
  const profilSekolah = await sql`
    SELECT nama_sekolah FROM sekolah WHERE id = ${sekolahIdInt}
  `;
  const namaSekolah = profilSekolah.rows[0]?.nama_sekolah || "Tidak Ada Nama Sekolah!";

  // 2. Ambil data riil dari DB
  const statsData = await getKepalaSekolahStats();

  // 3. OPER namaSekolah SEBAGAI PROP KE CLIENT COMPONENT DI SINI 👇
  return (
    <KepalaSekolahDashboardClient 
      initialStats={statsData} 
      userSession={session} 
      namaSekolah={namaSekolah} // <-- Dititipkan di sini
    />
  );
}