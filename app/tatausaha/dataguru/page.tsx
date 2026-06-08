// app/tatausaha/dataguru/page.tsx
import { sql } from "@vercel/postgres";
import AddGuruModal from "@/components/AddGuruModal";
import GuruTable from "@/components/GuruTable";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function GuruPage() {
  // Proteksi: Pastikan hanya Tata Usaha yang bisa akses
  const session = await auth();
  const sId = session?.user?.sekolah_id || (session?.user as any)?.sekolahId;

  if (!session || session.user.role?.toLowerCase() !== 'tata_usaha' || !sId) {
    redirect('/');
  }

  const sekolahIdInt = parseInt(sId.toString());

  // PARALLEL FETCHING: Ambil data Guru sekolah terkait DAN ambil data pilihan Mapel dari database
  const [resGuru, resMapel] = await Promise.all([
    sql`
      SELECT 
        g.*, 
        wk.rombel as wali_kelas_rombel 
      FROM guru g
      LEFT JOIN wali_kelas wk ON g.id = wk.guru_id
      WHERE g.sekolah_id = ${sekolahIdInt}
      ORDER BY g.nama ASC
    `,
    sql`
      SELECT id, nama_mapel, kode_mapel 
      FROM mapel 
      WHERE sekolah_id = ${sekolahIdInt} AND Kelompok != 'Kegiatan'
      ORDER BY kode_mapel ASC
    `
  ]);

  const gurus = resGuru.rows;
  const listMapelAktif = resMapel.rows;

  return (
    <div className="p-6 lg:p-10 space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800">Manajemen Data Pendidik</h1>
          <p className="text-slate-500 text-sm">Kelola informasi lengkap Guru & Tenaga Kependidikan</p>
        </div>
        {/* Kirim data mapel database ke modal tambah */}
        <AddGuruModal listMapel={listMapelAktif} />
      </div>

      {/* Kirim data guru dan data mapel database ke komponen tabel */}
      <GuruTable initialData={gurus} listMapel={listMapelAktif} />
    </div>
  );
}