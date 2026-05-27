// app/kepalasekolah/rekap-nilai/page.tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { sql } from "@vercel/postgres";
import RekapNilaiClient from "@/components/RekapNilaiClient";

export default async function RekapNilaiPage() {
  // 1. Proteksi Autentikasi Multi-role
  const session = await auth();
  const allowedRoles = ["kepalasekolah", "wakilkurikulum", "wakilkesiswaan"];
  
  if (!session?.user || !allowedRoles.includes(session.user.role?.toLowerCase() || "")) {
    redirect("/");
  }

  const sId = session.user.sekolah_id || (session.user as any).sekolahId;
  const sekolahIdInt = sId ? parseInt(sId.toString(), 10) : null;

  // 2. QUERY DISESUAIKAN DENGAN SKEMA RIIL NEON DB 🚀
  // Kolom mapel di tabel nilai bertipe VARCHAR/TEXT berisi ID dari tabel mapel (CONVERT via ::int)
  const nilaiRes = await sql`
    SELECT 
      mp.nama_mapel AS mapel,
      ROUND(AVG(n.nilai_angka)::numeric, 1)::float AS rata_rata,
      MAX(n.nilai_angka)::float AS tertinggi,
      MIN(n.nilai_angka)::float AS terendah,
      ROUND((COUNT(CASE WHEN n.nilai_angka >= 75 THEN 1 END) * 100.0 / COUNT(n.id))::numeric, 0)::int AS tuntas_persen
    FROM nilai n
    JOIN mapel mp ON n.mapel::int = mp.id
    WHERE n.sekolah_id = ${sekolahIdInt}
    GROUP BY mp.id, mp.nama_mapel
    ORDER BY mp.nama_mapel ASC
  `;

  const dataNilaiRiil = nilaiRes.rows.map((row) => ({
    mapel: row.mapel,
    rataRata: row.rata_rata || 0,
    tertinggi: row.tertinggi || 0,
    terendah: row.terendah || 0,
    tuntas: `${row.tuntas_persen || 0}%`,
  }));

  // 3. QUERY LOG TRANSAKSI DENGAN IDENTITAS LENGKAP NISN & NIP 🎒
  const logNilaiRes = await sql`
    SELECT 
      n.id,
      mp.nama_mapel AS mapel,
      n.nilai_angka AS angka,
      COALESCE(n.semester, 'Ganjil') AS jenis_ujian,
      m.nama AS nama_murid,
      m.nisn AS nisn_murid,
      g.nama AS nama_guru,
      g.nip AS nip_guru
    FROM nilai n
    JOIN mapel mp ON n.mapel::int = mp.id
    JOIN murid m ON n.murid_id = m.id AND n.sekolah_id = m.sekolah_id
    LEFT JOIN guru g ON n.guru_id = g.id AND n.sekolah_id = g.sekolah_id
    WHERE n.sekolah_id = ${sekolahIdInt}
    ORDER BY n.id DESC
    LIMIT 10
  `;

  const listLogNilai = logNilaiRes.rows.map((row) => ({
    id: row.id,
    mapel: row.mapel,
    angka: row.angka || 0,
    jenis: row.jenis_ujian,
    // Penyematan NISN dan NIP secara rapi aman terkendali! ⭐
    nama_murid: `${row.nama_murid} (NISN: ${row.nisn_murid || "-"})`,
    nama_guru: row.nama_guru ? `${row.nama_guru} (NIP: ${row.nip_guru || "-"})` : "Sistem / Admin",
  }));

  // 4. Ambil Profil Sekolah
  const profilSekolah = await sql`
    SELECT nama_sekolah FROM sekolah WHERE id = ${sekolahIdInt}
  `;
  const namaSekolah = profilSekolah.rows[0]?.nama_sekolah || "SIMS Sekolah";

  return (
    <RekapNilaiClient 
      initialDataNilai={dataNilaiRiil}
      listLogNilai={listLogNilai}
      namaSekolah={namaSekolah}
      userSession={session}
    />
  );
}