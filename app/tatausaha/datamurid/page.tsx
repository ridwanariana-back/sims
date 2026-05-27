// app/tatausaha/datamurid/page.tsx
import { sql } from "@vercel/postgres";
import MuridTable from "@/components/MuridTable";
import AddMuridModal from "@/components/AddMuridModal";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function DataMuridPage() {
  const session = await auth();
  const sId = session?.user?.sekolah_id || (session?.user as any)?.sekolahId;

  // Proteksi Halaman Server-side
  if (!session || session.user.role?.toLowerCase() !== 'tata_usaha' || !sId) {
    redirect('/');
  }

  const sekolahIdInt = parseInt(sId.toString());

// Parallel Fetching: Ambil data murid DAN daftar rombel kelas aktif milik sekolah ini
  const [resMurid, resKelas] = await Promise.all([
    sql`
      SELECT * FROM murid 
      WHERE sekolah_id = ${sekolahIdInt} 
      ORDER BY kelas ASC, rombel ASC, nama ASC
    `, // 👈 Di sini diubah dari 'tingkat ASC' menjadi 'kelas ASC'
    sql`
      SELECT DISTINCT tingkat, nama_kelas 
      FROM kelas 
      WHERE sekolah_id = ${sekolahIdInt}
      ORDER BY tingkat ASC, nama_kelas ASC
    `
  ]);

  const masterMurid = resMurid.rows;
  const masterKelas = resKelas.rows; // Array objek berisi { tingkat, nama_kelas }

  return (
    <div className="p-6 lg:p-10 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800">Data Induk Murid</h1>
          <p className="text-slate-500 text-sm">Manajemen informasi siswa/siswi aktif</p>
        </div>
        {/* Kirim masterKelas ke dalam modal tambah */}
        <AddMuridModal masterKelas={masterKelas} />
      </div>
      {/* Kirim masterMurid dan masterKelas ke dalam tabel */}
      <MuridTable initialData={masterMurid} masterKelas={masterKelas} />
    </div>
  );
}