import { auth } from "@/auth";
import Link from "next/link";
import { sql } from "@vercel/postgres";
import { redirect } from "next/navigation";
import { GraduationCap } from "lucide-react";
import FilterNilai from "@/components/FilterNilai";
import NilaiTable from "@/components/NilaiTableWKS";
import { getTahunAjaranDinamis } from "@/lib/actions";

export default async function InputNilaiPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; kelas?: string }>;
}) {
  const session = await auth();
  if (!session?.user || session.user.role?.toLowerCase() !== "wakilkesiswaan") {
    redirect("/");
  }

  const params = await searchParams;
  const query = params.q || "";
  const filterKelas = params.kelas || "Semua";
  
  const tahunAjaranAktif = await getTahunAjaranDinamis();

  // 1. Ambil sekolah_id dan ID Guru asli (Integer) dari session login
  const sId = session.user.sekolah_id || (session.user as any).sekolahId;
  const sekolahIdInt = sId ? parseInt(sId.toString(), 10) : null;

  const gId = session.user.id;
  const userRes = await sql`
    SELECT guru_id 
    FROM users 
    WHERE id = ${gId}
  `;
  const userData = userRes.rows[0];
  const guruIdInt = userData.guru_id ? parseInt(userData.guru_id.toString(), 10) : null;

  if (!sekolahIdInt || !guruIdInt) {
    return (
      <div className="p-6 text-center text-rose-600 font-bold bg-white rounded-3xl border-2 border-rose-100 m-8">
        Error: Autentikasi Gagal atau ID Sekolah tidak ditemukan.
      </div>
    );
  }

  // 2. Ambil ID mapel dari tabel guru
  const guruRes = await sql`SELECT mapel FROM guru WHERE id = ${guruIdInt}`;
  const guruData = guruRes.rows[0];
  const mapelGuruId = guruData?.mapel || ""; // Sekarang berisi ID Mapel (misal: "12" atau 12)

  // 💡 AMBIL NAMA MAPEL ASLI UNTUK TEKS DI UI GURU
  let namaMapelTxt = "Mata Pelajaran";
  if (mapelGuruId) {
    const mapelNameRes = await sql`SELECT nama_mapel FROM mapel WHERE id = ${parseInt(mapelGuruId.toString(), 10)}`;
    if (mapelNameRes.rows.length > 0) {
      namaMapelTxt = mapelNameRes.rows[0].nama_mapel;
    }
  }

  // 3. Ambil seluruh daftar murid aktif YANG HANYA BERASAL DARI SEKOLAH INI
  const allMuridRes = await sql`
    SELECT id, nama, nisn, kelas, rombel 
    FROM murid 
    WHERE status = 'aktif' 
      AND sekolah_id = ${sekolahIdInt}
  `;

  let tableData: any[] = [];

  if (query !== "") {
    // 4. Query data nilai murid, mapel disesuaikan membandingkan ID Mapel
    const muridRes = await sql`
      SELECT 
        m.id, 
        m.nama, 
        m.nisn, 
        m.kelas, 
        m.rombel,
        (SELECT id FROM nilai WHERE murid_id = m.id AND guru_id = ${guruIdInt} AND sekolah_id = ${sekolahIdInt} AND mapel = ${mapelGuruId} AND semester = 'Ganjil' AND tahun_ajaran = ${tahunAjaranAktif} LIMIT 1) as id_ganjil,
        (SELECT nilai_angka FROM nilai WHERE murid_id = m.id AND guru_id = ${guruIdInt} AND sekolah_id = ${sekolahIdInt} AND mapel = ${mapelGuruId} AND semester = 'Ganjil' AND tahun_ajaran = ${tahunAjaranAktif} LIMIT 1) as angka_ganjil,
        (SELECT id FROM nilai WHERE murid_id = m.id AND guru_id = ${guruIdInt} AND sekolah_id = ${sekolahIdInt} AND mapel = ${mapelGuruId} AND semester = 'Genap' AND tahun_ajaran = ${tahunAjaranAktif} LIMIT 1) as id_genap,
        (SELECT nilai_angka FROM nilai WHERE murid_id = m.id AND guru_id = ${guruIdInt} AND sekolah_id = ${sekolahIdInt} AND mapel = ${mapelGuruId} AND semester = 'Genap' AND tahun_ajaran = ${tahunAjaranAktif} LIMIT 1) as angka_genap
      FROM murid m
      WHERE m.sekolah_id = ${sekolahIdInt}
        AND (m.nama ILIKE ${query} OR m.nisn ILIKE ${query})
        AND (${filterKelas} = 'Semua' OR m.kelas = ${filterKelas})
      ORDER BY m.nama ASC
    `;
    tableData = muridRes.rows;
  }

  return (
    <div className="p-6 lg:p-10 space-y-8 text-left">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b pb-6">
        <div>
          <div className="flex items-center gap-2 text-blue-600 mb-2">
            <GraduationCap size={20} />
            <span className="text-xs font-bold bg-blue-50 px-2 py-1 rounded-md uppercase tracking-wider">
              Periode: {tahunAjaranAktif}
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-800">Input Nilai Siswa</h1>
          {/* Menampilkan teks nama asli mapel agar user friendly */}
          <p className="text-slate-500 text-sm">Mata Pelajaran: <span className="font-bold text-slate-700">{namaMapelTxt}</span></p>
        </div>
        <Link
          href="/wakilkesiswaan/inputnilai/riwayat"
          className="flex items-center gap-2 px-5 py-3 bg-amber-500 hover:bg-amber-600 text-white font-black text-xs rounded-xl shadow-md uppercase tracking-wider transition-all"
        >
          📂 Lihat Murid Sudah Diisi
        </Link>
      </div>

      <FilterNilai 
        query={query} 
        filterKelas={filterKelas} 
        allMuridList={allMuridRes.rows} 
        mapelGuru={mapelGuruId.toString()} // 💡 Kirim ID Mapel ke komponen client filter
        tahunAjaran={tahunAjaranAktif}
        guruId={guruIdInt.toString()}
        sekolahId={sekolahIdInt}
      />

      <NilaiTable initialData={tableData} />
    </div>
  );
}