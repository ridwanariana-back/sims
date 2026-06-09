import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { sql } from "@vercel/postgres";
import DetailGuruClient from "@/components/DetailGuruClient";

export default async function DetailGuruPage() {
  // 1. Amankan Sesi & Sekolah ID
  const session = await auth();
  const allowedRoles = ["kepalasekolah", "wakilkurikulum", "wakilkesiswaan"];
  
  if (!session?.user || !allowedRoles.includes(session.user.role?.toLowerCase() || "")) {
    redirect("/");
  }

  const sId = session.user.sekolah_id || (session.user as any).sekolahId;
  const sekolahIdInt = sId ? parseInt(sId.toString(), 10) : null;

  // 2. Fetch Data Guru Riil (Fix Komparasi Multi-Mapel Array)
  const guruRes = await sql`
    SELECT 
      g.id,
      g.nip,
      g.nama,
      g.status, -- PNS / HONORER
      g.jenis as role_internal,
      
      -- 💡 FIX MULTI-MAPEL ARRAY: Ambil semua nama mapel yang ID-nya ada di dalam array g.mapel lalu gabungkan dengan koma
      COALESCE(
        (
          SELECT string_agg(m.nama_mapel, ', ')
          FROM mapel m
          WHERE m.id = ANY(g.mapel)
        ), 'Belum Ditentukan'
      ) as mapel_utama,

      -- HITUNG TOTAL BEBAN MENGAJAR (Hanya menghitung mapel yang BUKAN kelompok 'Kegiatan')
      COALESCE(
        (
          SELECT COUNT(*)::int 
          FROM jadwal_pelajaran jp
          JOIN mapel m ON jp.mapel = m.id::varchar
          WHERE jp.guru_id = g.id AND m.kelompok != 'Kegiatan'
        ), 
        0
      ) as total_jam,

      -- CEK STATUS WALI KELAS
      CASE 
        WHEN wk.id IS NOT NULL THEN CONCAT('WALI KELAS ', wk.rombel)
        ELSE 'GURU KELAS'
      END as jabatan_perwalian
    FROM guru g
    LEFT JOIN wali_kelas wk ON g.id = wk.guru_id
    WHERE g.sekolah_id = ${sekolahIdInt} 
      AND g.jenis IN ('Guru', 'Kepala Sekolah', 'Wakil Kurikulum', 'Wakil Kesiswaan', 'Tenaga Kependidikan')
    ORDER BY g.nama ASC
  `;

  // Format array clean untuk dilempar ke Client Component
  const dataGuruRiil = guruRes.rows.map((row) => {
    let labelJabatan = row.jabatan_perwalian;
    if (row.role_internal !== 'Guru') {
      labelJabatan = `${row.role_internal.toUpperCase()} | ${row.jabatan_perwalian}`;
    }

    return {
      id: row.id,
      nip: row.nip && row.nip !== "" ? row.nip : "-",
      nama: row.nama,
      status: row.status ? row.status.toUpperCase() : "HONORER",
      jamMengajar: row.total_jam || 0,
      mapel: row.mapel_utama, // Otomatis berformat string mulus (Contoh: "Matematika, Fisika")
      jabatan: labelJabatan
    };
  });

  // 3. Ambil Nama Sekolah untuk Sub-header
  const profilSekolah = await sql`
    SELECT nama_sekolah FROM sekolah WHERE id = ${sekolahIdInt}
  `;
  const namaSekolah = profilSekolah.rows[0]?.nama_sekolah || "SIMS Sekolah";

  return (
    <DetailGuruClient 
      initialDataGuru={dataGuruRiil} 
      namaSekolah={namaSekolah} 
      userSession={session}
    />
  );
}