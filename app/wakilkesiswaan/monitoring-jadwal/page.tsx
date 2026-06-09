import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { sql } from "@vercel/postgres";
import MonitoringJadwalClient from "@/components/MonitoringJadwalClient";

export default async function MonitoringJadwalPage() {
  // 1. Amankan Sesi & Hak Akses
  const session = await auth();
  const allowedRoles = ["kepalasekolah", "wakilkurikulum", "wakilkesiswaan"];
  
  if (!session?.user || !allowedRoles.includes(session.user.role?.toLowerCase() || "")) {
    redirect("/");
  }

  const sId = session.user.sekolah_id || (session.user as any).sekolahId;
  const sekolahIdInt = sId ? parseInt(sId.toString(), 10) : null;

  try {
    // 2. Ambil data master guru beserta akumulasi beban mengajar mingguan (JP) & Fix Multi-Mapel Array
    const guruRes = await sql`
      SELECT 
        g.id,
        g.nama,
        g.nip,
        g.status,
        -- 💡 FIX MULTI-MAPEL ARRAY: Ambil semua nama mapel berdasarkan array g.mapel
        COALESCE(
          (
            SELECT string_agg(m.nama_mapel, ', ')
            FROM mapel m
            WHERE m.id = ANY(g.mapel)
          ), 'Belum Ditentukan'
        ) as mapel_utama,
        COUNT(j.id)::int as total_jam_minggu
      FROM guru g
      LEFT JOIN jadwal_pelajaran j ON g.id = j.guru_id AND j.sekolah_id = ${sekolahIdInt}
      WHERE g.sekolah_id = ${sekolahIdInt}
        AND g.jenis IN ('Guru', 'Kepala Sekolah', 'Wakil Kurikulum', 'Wakil Kesiswaan', 'Tenaga Kependidikan')
      GROUP BY g.id, g.nama, g.nip, g.status, g.mapel
      ORDER BY g.nama ASC
    `;

    // 3. Ambil detail baris jadwal pelajaran (Fix casting mapel di jadwal jika bertipe varchar/int)
    const jadwalRes = await sql`
      SELECT 
        j.guru_id,
        j.hari,
        j.rombel,
        j.jam_mulai,
        j.jam_selesai,
        mp.nama_mapel
      FROM jadwal_pelajaran j
      JOIN mapel mp ON j.mapel = mp.id::varchar
      WHERE j.sekolah_id = ${sekolahIdInt}
      ORDER BY j.jam_mulai ASC
    `;

    // 4. Transformasi data gabungan agar siap dipakai di client component
    const dataJadwalBebanGuru = guruRes.rows.map((guru) => {
      const listJadwalGuru = jadwalRes.rows
        .filter((j) => j.guru_id === guru.id)
        .map((j) => ({
          rombel: j.rombel,
          mapel: j.nama_mapel,
          jam_mulai: j.jam_mulai,
          jam_selesai: j.jam_selesai,
          hari: j.hari
        }));

      return {
        id: guru.id,
        nama: guru.nama,
        nip: guru.nip && guru.nip !== "" ? guru.nip : "-",
        status: guru.status ? guru.status.toUpperCase() : "HONORER",
        mapel_utama: guru.mapel_utama,
        total_jam_minggu: guru.total_jam_minggu || 0,
        list_jadwal: listJadwalGuru
      };
    });

    // 5. Ambil identitas nama sekolah
    const profilSekolah = await sql`
      SELECT nama_sekolah FROM sekolah WHERE id = ${sekolahIdInt}
    `;
    const namaSekolah = profilSekolah.rows[0]?.nama_sekolah || "SIMS Sekolah";

    return (
      <MonitoringJadwalClient 
        initialJadwalGuru={dataJadwalBebanGuru}
        namaSekolah={namaSekolah}
        userSession={session}
      />
    );

  } catch (error) {
    console.error("Gagal memuat monitoring jadwal server:", error);
    return (
      <div className="p-8 text-center font-black text-rose-500 uppercase">
        🚨 Terjadi kesalahan saat mensinkronkan data jadwal.
      </div>
    );
  }
}