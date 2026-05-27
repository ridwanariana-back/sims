// app/wakilkurikulum/page.tsx
import { auth } from "@/auth"; 
import { redirect } from "next/navigation";
import { sql } from "@vercel/postgres";
import { getKurikulumStats } from "@/lib/actions"; // 🔄 Panggil Action baru
import KurikulumDashboardClient from "@/components/KurikulumDashboardClient"; // 🔄 Impor Client baru

export default async function WakilkurikulumPage() {
  // 1. Proteksi Login
  const session = await auth();
  
  if (!session?.user || session.user.role?.toLowerCase() !== "wakilkurikulum") {
    redirect("/");
  }

  const sId = session.user.sekolah_id || (session.user as any).sekolahId;
  const sekolahIdInt = sId ? parseInt(sId.toString(), 10) : null;
  
  // == AMBIL DATA SEKOLAH ==
  const profilSekolah = await sql`
    SELECT nama_sekolah FROM sekolah WHERE id = ${sekolahIdInt}
  `;
  const namaSekolah = profilSekolah.rows[0]?.nama_sekolah || "Tidak Ada Nama Sekolah!";

  // 2. Ambil data riil khusus kurikulum dari DB
  const statsData = await getKurikulumStats();

  // 3. OPER data ke KurikulumDashboardClient
  return (
    <KurikulumDashboardClient 
      initialStats={statsData} 
      userSession={session} 
      namaSekolah={namaSekolah} 
    />
  );
}