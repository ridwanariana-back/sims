// app/kepalasekolah/datamurid/page.tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { sql } from "@vercel/postgres";
import DetailMuridClient from "@/components/DetailMuridClient";

export default async function DetailMuridPage() {
  const session = await auth();
  const allowedRoles = ["kepalasekolah", "wakilkurikulum", "wakilkesiswaan"];
  
  if (!session?.user || !allowedRoles.includes(session.user.role?.toLowerCase() || "")) {
    redirect("/");
  }

  const sId = session.user.sekolah_id || (session.user as any).sekolahId;
  const sekolahIdInt = sId ? parseInt(sId.toString(), 10) : null;

  // 1. Fetch Aggregasi Kelas + Nama & NIP Wali Kelas (HANYA MENGHITUNG SISWA AKTIF 🎯)
  const muridRes = await sql`
    SELECT 
      k.nama_kelas AS kelas,
      -- Tampilkan format: NAMA (NIP: xxx) atau Belum Ada
      CASE 
        WHEN g.nama IS NOT NULL THEN CONCAT(g.nama, ' (NIP: ', COALESCE(g.nip, '-'), ')')
        ELSE 'Belum Ada Wali Kelas'
      END AS wali,
      COALESCE(
        (
          SELECT COUNT(*)::int 
          FROM murid m 
          WHERE m.rombel = k.nama_kelas 
            AND m.sekolah_id = k.sekolah_id 
            AND UPPER(m.gender) = 'LAKI-LAKI'
            AND LOWER(m.status) = 'aktif' -- KUNCI FIX: Hanya hitung yang aktif
        ), 
        0
      ) AS l,
      COALESCE(
        (
          SELECT COUNT(*)::int 
          FROM murid m 
          WHERE m.rombel = k.nama_kelas 
            AND m.sekolah_id = k.sekolah_id 
            AND UPPER(m.gender) = 'PEREMPUAN'
            AND LOWER(m.status) = 'aktif' -- KUNCI FIX: Hanya hitung yang aktif
        ), 
        0
      ) AS p
    FROM kelas k
    LEFT JOIN wali_kelas wk ON k.nama_kelas = wk.rombel AND k.sekolah_id = wk.sekolah_id
    LEFT JOIN guru g ON wk.guru_id = g.id
    WHERE k.sekolah_id = ${sekolahIdInt}
    ORDER BY k.tingkat ASC, k.nama_kelas ASC
  `;

  const dataMuridRiil = muridRes.rows.map((row) => ({
    kelas: row.kelas,
    wali: row.wali,
    l: row.l,
    p: row.p,
    total: (row.l + row.p)
  }));

  // 2. MAGIC DATA: Ambil seluruh data murid untuk list detail di dalam Modal 🔮
  const semuaMuridRes = await sql`
    SELECT nisn, nama, gender, rombel, status 
    FROM murid 
    WHERE sekolah_id = ${sekolahIdInt} AND LOWER(status) = 'aktif'
    ORDER BY nama ASC
  `;
  
  const listSemuaMurid = semuaMuridRes.rows.map(m => ({
    nisn: m.nisn,
    nama: m.nama,
    gender: m.gender,
    rombel: m.rombel,
    status: m.status
  }));

  const profilSekolah = await sql`
    SELECT nama_sekolah FROM sekolah WHERE id = ${sekolahIdInt}
  `;
  const namaSekolah = profilSekolah.rows[0]?.nama_sekolah || "SIMS Sekolah";

  return (
    <DetailMuridClient 
      initialDataMurid={dataMuridRiil} 
      listSemuaMurid={listSemuaMurid} 
      namaSekolah={namaSekolah} 
      userSession={session}
    />
  );
}