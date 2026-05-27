// app/kepalasekolah/prestasi/page.tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { sql } from "@vercel/postgres";
import PrestasiClient from "@/components/PrestasiClient";

export default async function PrestasiPage() {
  // 1. Amankan Sesi & Hak Akses Manajemen Kepala Sekolah
  const session = await auth();
  const allowedRoles = ["kepalasekolah", "wakilkurikulum", "wakilkesiswaan"];
  
  if (!session?.user || !allowedRoles.includes(session.user.role?.toLowerCase() || "")) {
    redirect("/");
  }

  const sId = session.user.sekolah_id || (session.user as any).sekolahId;
  const sekolahIdInt = sId ? parseInt(sId.toString(), 10) : null;

  try {
    // 2. Query data prestasi riil (Ambil g.nip & m.nisn dinamis berdasarkan kategori)
    const prestasiRes = await sql`
      SELECT 
        p.id,
        p.kategori_pemilik,
        p.lomba,
        p.tingkat,
        p.juara,
        p.tahun,
        CASE 
          WHEN p.kategori_pemilik = 'MURID' THEN m.nama
          WHEN p.kategori_pemilik = 'GURU' THEN g.nama
          ELSE 'Ekstrakurikuler / Tim'
        END as nama_peraih,
        CASE 
          WHEN p.kategori_pemilik = 'MURID' THEN COALESCE(m.nisn, '-')
          WHEN p.kategori_pemilik = 'GURU' THEN COALESCE(g.nip, '-')
          ELSE '-'
        END as nomor_identitas,
        CASE 
          WHEN p.kategori_pemilik = 'MURID' THEN CONCAT('Kelas ', COALESCE(m.rombel, m.kelas))
          WHEN p.kategori_pemilik = 'GURU' THEN COALESCE(g.jenis, 'Guru')
          ELSE 'Sekolah'
        END as kelas_jabatan
      FROM prestasi p
      LEFT JOIN murid m ON p.kategori_pemilik = 'MURID' AND p.pemilik_id = m.id
      LEFT JOIN guru g ON p.kategori_pemilik = 'GURU' AND p.pemilik_id = g.id
      WHERE p.sekolah_id = ${sekolahIdInt}
      ORDER BY p.tahun DESC, p.created_at DESC
    `;

    // Mapping data clean ke Client Component
    const dataPrestasiRiil = prestasiRes.rows.map((row) => ({
      nama: row.nama_peraih || "Tanpa Nama",
      identitas: row.nomor_identitas || "-",
      kategori: row.kategori_pemilik, // Digunakan untuk label conditional (NIP/NISN) di Client
      kelasJabatan: row.kelas_jabatan || "Umum",
      lomba: row.lomba,
      tingkat: row.tingkat ? row.tingkat.charAt(0).toUpperCase() + row.tingkat.slice(1).toLowerCase() : "Kabupaten",
      juara: row.juara,
      tahun: row.tahun || new Date().getFullYear(),
    }));

    // 3. Ambil Identitas Nama Sekolah
    const profilSekolah = await sql`
      SELECT nama_sekolah FROM sekolah WHERE id = ${sekolahIdInt}
    `;
    const namaSekolah = profilSekolah.rows[0]?.nama_sekolah || "SIMS Sekolah";

    return (
      <PrestasiClient 
        initialPrestasi={dataPrestasiRiil}
        namaSekolah={namaSekolah}
        userSession={session}
      />
    );

  } catch (error) {
    console.error("Gagal memuat data papan prestasi di server:", error);
    return (
      <div className="p-8 text-center font-black text-rose-500 uppercase border-4 border-slate-900 bg-rose-50 rounded-[2rem] m-6 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)]">
        🚨 Terjadi kesalahan internal database saat memproses sinkronisasi data prestasi. Silakan periksa kembali server Anda.
      </div>
    );
  }
}