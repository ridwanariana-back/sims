// app/kepalasekolah/kedisiplinan/page.tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { sql } from "@vercel/postgres";
import CatatanKedisiplinanClient from "@/components/CatatanKedisiplinanClient";

export default async function CatatanKedisiplinanPage() {
  // 1. Proteksi Multi-role Akses Manajemen
  const session = await auth();
  const allowedRoles = ["kepalasekolah", "wakilkurikulum", "wakilkesiswaan"];
  
  if (!session?.user || !allowedRoles.includes(session.user.role?.toLowerCase() || "")) {
    redirect("/");
  }

  const sId = session.user.sekolah_id || (session.user as any).sekolahId;
  const sekolahIdInt = sId ? parseInt(sId.toString(), 10) : null;

  // 2. Fetch Agregasi Kasus Kedisiplinan Per Bulan
  const rekapRes = await sql`
    SELECT 
      m.bulan_angka,
      CASE m.bulan_angka
        WHEN 1 THEN 'Januari' WHEN 2 THEN 'Februari' WHEN 3 THEN 'Maret'
        WHEN 4 THEN 'April' WHEN 5 THEN 'Mei' WHEN 6 THEN 'Juni'
        WHEN 7 THEN 'Juli' WHEN 8 THEN 'Agustus' WHEN 9 THEN 'September'
        WHEN 10 THEN 'Oktober' WHEN 11 THEN 'November' WHEN 12 THEN 'Desember'
      END AS bulan,
      COALESCE(SUM(CASE WHEN UPPER(c.kategori) = 'KEDISIPLINAN' THEN 1 ELSE 0 END)::int, 0) AS kedisiplinan,
      COALESCE(SUM(CASE WHEN UPPER(c.kategori) = 'KERAJINAN' THEN 1 ELSE 0 END)::int, 0) AS kerajinan,
      COALESCE(SUM(CASE WHEN UPPER(c.kategori) = 'KEBERSIHAN' THEN 1 ELSE 0 END)::int, 0) AS kebersihan,
      COALESCE(SUM(CASE WHEN UPPER(c.kategori) = 'LAINNYA' THEN 1 ELSE 0 END)::int, 0) AS lainnya
    FROM (
      SELECT generate_series(1, 12) AS bulan_angka
    ) m
    LEFT JOIN catatan_kedisiplinan c 
      ON EXTRACT(MONTH FROM c.tanggal) = m.bulan_angka 
      AND c.sekolah_id = ${sekolahIdInt}
    GROUP BY m.bulan_angka
    ORDER BY m.bulan_angka ASC
  `;

  const dataKedisiplinanRiil = rekapRes.rows.map((row) => ({
    bulan_angka: row.bulan_angka,
    bulan: row.bulan,
    kedisiplinan: row.kedisiplinan,
    kerajinan: row.kerajinan,
    kebersihan: row.kebersihan,
    lainnya: row.lainnya,
    total: row.kedisiplinan + row.kerajinan + row.kebersihan + row.lainnya
  }));

  // 3. AMBIL DATA DENGAN NISN MURID SEKALIAN 🎒
  const detailRes = await sql`
    SELECT 
      c.id,
      TO_CHAR(c.tanggal, 'YYYY-MM-DD') AS tanggal,
      EXTRACT(MONTH FROM c.tanggal)::int AS bulan_angka,
      c.kategori,
      c.keterangan,
      m.nama AS nama_murid,
      m.nisn AS nisn_murid, -- <-- Menarik data NISN dari tabel murid
      m.rombel,
      g.nama AS nama_guru,
      g.nip AS nip_guru
    FROM catatan_kedisiplinan c
    JOIN murid m ON c.murid_id = m.id AND c.sekolah_id = m.sekolah_id
    LEFT JOIN guru g ON c.guru_id = g.id
    WHERE c.sekolah_id = ${sekolahIdInt}
    ORDER BY c.tanggal DESC
  `;

  const listSemuaCatatan = detailRes.rows.map((row) => ({
    id: row.id,
    tanggal: row.tanggal,
    bulan_angka: row.bulan_angka,
    kategori: row.kategori,
    keterangan: row.keterangan,
    // Format nama murid + NISN di sampingnya secara presisi! 👑
    nama_murid: `${row.nama_murid} (NISN: ${row.nisn_murid || "-"})`,
    rombel: row.rombel,
    nama_guru: row.nama_guru 
      ? `${row.nama_guru} (NIP: ${row.nip_guru || "-"})` 
      : "Administrator / Sistem"
  }));

  const profilSekolah = await sql`
    SELECT nama_sekolah FROM sekolah WHERE id = ${sekolahIdInt}
  `;
  const namaSekolah = profilSekolah.rows[0]?.nama_sekolah || "SIMS Sekolah";

  return (
    <CatatanKedisiplinanClient 
      initialDataKedisiplinan={dataKedisiplinanRiil}
      listSemuaCatatan={listSemuaCatatan}
      namaSekolah={namaSekolah}
      userSession={session}
    />
  );
}