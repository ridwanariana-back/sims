// app/kepalasekolah/kehadiran/page.tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { sql } from "@vercel/postgres";
import KehadiranClient from "@/components/KehadiranClient";

export default async function DaftarHadirPage() {
  // 1. Amankan Sesi & Hak Akses Manajemen Sekolah
  const session = await auth();
  const allowedRoles = ["kepalasekolah", "wakilkurikulum", "wakilkesiswaan"];
  
  if (!session?.user || !allowedRoles.includes(session.user.role?.toLowerCase() || "")) {
    redirect("/");
  }

  const sId = session.user.sekolah_id || (session.user as any).sekolahId;
  const sekolahIdInt = sId ? parseInt(sId.toString(), 10) : null;

  try {
    // 2. Query Agregasi Riil Kehadiran Guru (Ambil g.nip & g.status)
    const guruRes = await sql`
      SELECT 
        g.nama,
        g.nip,
        g.status as status_pns,
        COUNT(CASE WHEN k.status ILIKE 'Hadir' THEN 1 END)::int as hadir,
        COUNT(CASE WHEN k.status ILIKE 'Izin' THEN 1 END)::int as izin,
        COUNT(CASE WHEN k.status ILIKE 'Sakit' THEN 1 END)::int as sakit,
        COUNT(CASE WHEN k.status ILIKE 'Alfa' THEN 1 END)::int as alfa,
        COUNT(k.id)::int as total_hari_kerja
      FROM guru g
      LEFT JOIN kehadiran_guru k ON g.id = k.guru_id AND k.sekolah_id = ${sekolahIdInt}
      WHERE g.sekolah_id = ${sekolahIdInt}
        AND g.jenis IN ('Guru', 'Kepala Sekolah', 'Wakil Kurikulum', 'Wakil Kesiswaan', 'Tenaga Kependidikan')
      GROUP BY g.id, g.nama, g.nip, g.status
      ORDER BY g.nama ASC
    `;

    // Kalkulasi persentase rasio hadir guru secara dinamis
    const dataHadirGuru = guruRes.rows.map((row) => {
      const total = row.total_hari_kerja || 0;
      const persenNum = total > 0 ? Math.round((row.hadir / total) * 100) : 0;
      return {
        nama: row.nama,
        nip: row.nip && row.nip !== "" ? row.nip : "-",
        pns: row.status_pns ? row.status_pns.toUpperCase() : "HONORER",
        hadir: row.hadir || 0,
        izin: row.izin || 0,
        sakit: row.sakit || 0,
        alfa: row.alfa || 0,
        persen: `${persenNum}%`,
      };
    });

    // 3. Query Agregasi Riil Kehadiran Murid (Target tabel: kehadiran)
    const muridRes = await sql`
      SELECT 
        m.kelas,
        COUNT(DISTINCT m.id)::int as total_siswa,
        COUNT(CASE WHEN km.status ILIKE 'Hadir' THEN 1 END)::int as total_hadir,
        COUNT(CASE WHEN km.status ILIKE 'Izin' THEN 1 END)::int as total_izin,
        COUNT(CASE WHEN km.status ILIKE 'Sakit' THEN 1 END)::int as total_sakit,
        COUNT(CASE WHEN km.status ILIKE 'Alfa' THEN 1 END)::int as total_alfa,
        COUNT(km.id)::int as total_records
      FROM murid m
      LEFT JOIN kehadiran km ON m.id = km.murid_id AND km.sekolah_id = ${sekolahIdInt}
      WHERE m.sekolah_id = ${sekolahIdInt}
      GROUP BY m.kelas
      ORDER BY m.kelas ASC
    `;

    // Kalkulasi rasio persentase distribusi presensi murid
    const dataHadirMurid = muridRes.rows.map((row) => {
      const total = row.total_records || 1; // menghindari pembagian dengan angka 0
      return {
        kelas: `Kelas ${row.kelas} (Fase ${row.kelas === "10" ? "E" : "F"})`,
        totalSiswa: row.total_siswa || 0,
        hadir: Math.round(((row.total_hadir || 0) / total) * 100),
        izin: Math.round(((row.total_izin || 0) / total) * 100),
        sakit: Math.round(((row.total_sakit || 0) / total) * 100),
        alfa: Math.round(((row.total_alfa || 0) / total) * 100),
      };
    });

    // 4. Ambil identitas profil sekolah asli
    const profilSekolah = await sql`
      SELECT nama_sekolah FROM sekolah WHERE id = ${sekolahIdInt}
    `;
    const namaSekolah = profilSekolah.rows[0]?.nama_sekolah || "SIMS Sekolah";

    return (
      <KehadiranClient 
        initialGuru={dataHadirGuru}
        initialMurid={dataHadirMurid}
        namaSekolah={namaSekolah}
        userSession={session}
      />
    );

  } catch (error) {
    console.error("Gagal memuat rekap presensi di server:", error);
    return (
      <div className="p-8 text-center font-black text-rose-500 uppercase border-4 border-slate-900 bg-rose-50 rounded-[2rem] m-6 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)]">
        🚨 Terjadi kesalahan database saat memproses sinkronisasi presensi. Silakan cek skema tabel Anda.
      </div>
    );
  }
}