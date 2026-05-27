// app/kepalasekolah/alumni/page.tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { sql } from "@vercel/postgres";
import AlumniClient from "@/components/AlumniClient";

export default async function StatistikAlumniPage() {
  // 1. Amankan Sesi & Hak Akses Manajemen Kepala Sekolah / Wakil
  const session = await auth();
  const allowedRoles = ["kepalasekolah", "wakilkurikulum", "wakilkesiswaan"];
  
  if (!session?.user || !allowedRoles.includes(session.user.role?.toLowerCase() || "")) {
    redirect("/");
  }

  const sId = session.user.sekolah_id || (session.user as any).sekolahId;
  const sekolahIdInt = sId ? parseInt(sId.toString(), 10) : null;

  try {
    // 2. Fetch Data Riil Alumni dengan JOIN ke Tabel Murid untuk mengambil NISN
    const alumniRes = await sql`
      SELECT 
        a.id,
        a.klaster,
        a.instansi,
        a.detail_status,
        a.jalur,
        a.tahun_lulus,
        m.nama as nama_murid,
        COALESCE(m.nisn, '-') as nisn_murid
      FROM alumni a
      LEFT JOIN murid m ON a.murid_id = m.id
      WHERE a.sekolah_id = ${sekolahIdInt}
      ORDER BY a.tahun_lulus DESC, m.nama ASC
    `;

    // Format data clean untuk dilempar ke Client Component
    const dataAlumniRiil = alumniRes.rows.map((row) => ({
      id: row.id,
      nama: row.nama_murid || "Alumni Tanpa Nama",
      nisn: row.nisn_murid,
      klaster: row.klaster || "LAINNYA", // KULIAH, KERJA, WIRAUSAHA, LAINNYA
      instansi: row.instansi || "-",
      detailStatus: row.detail_status || "-",
      jalur: row.jalur || "-",
      tahunLulus: row.tahun_lulus || new Date().getFullYear(),
    }));

    // 3. Ambil Nama Sekolah untuk Sub-header
    const profilSekolah = await sql`
      SELECT nama_sekolah FROM sekolah WHERE id = ${sekolahIdInt}
    `;
    const namaSekolah = profilSekolah.rows[0]?.nama_sekolah || "SIMS Sekolah";

    return (
      <AlumniClient 
        initialAlumni={dataAlumniRiil}
        namaSekolah={namaSekolah}
        userSession={session}
      />
    );

  } catch (error) {
    console.error("Gagal memuat data tracer study alumni di server:", error);
    return (
      <div className="p-8 text-center font-black text-rose-500 uppercase border-4 border-slate-900 bg-rose-50 rounded-[2rem] m-6 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)]">
        🚨 Terjadi kesalahan internal database saat memproses sinkronisasi data alumni. Silakan periksa kembali server Anda.
      </div>
    );
  }
}