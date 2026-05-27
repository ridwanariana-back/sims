// app/wakilkesiswaan/page.tsx
import { auth } from "@/auth"; 
import { redirect } from "next/navigation";
import { sql } from "@vercel/postgres";
import { getWakilKesiswaanStats } from "@/lib/actions";
import WakilKesiswaanDashboardClient from "@/components/WakilKesiswaanDashboardClient";

export default async function WakilKesiswaanPage() {
  const session = await auth();
  
  if (!session?.user || session.user.role?.toLowerCase() !== "wakilkesiswaan") {
    redirect("/");
  }

  const sId = session.user.sekolah_id || (session.user as any).sekolahId;
  const sekolahIdInt = sId ? parseInt(sId.toString(), 10) : null;
  
  const profilSekolah = await sql`
    SELECT nama_sekolah FROM sekolah WHERE id = ${sekolahIdInt}
  `;
  const namaSekolah = profilSekolah.rows[0]?.nama_sekolah || "Sekolah Aktif";

  const statsData = await getWakilKesiswaanStats();

  return (
    <WakilKesiswaanDashboardClient 
      initialStats={statsData} 
      userSession={session} 
      namaSekolah={namaSekolah} 
    />
  );
}