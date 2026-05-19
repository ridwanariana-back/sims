// app/guru/inputnilai/page.tsx

import { auth } from "@/auth";
import Link from "next/link";
import { sql } from "@vercel/postgres";
import { redirect } from "next/navigation";
import { GraduationCap } from "lucide-react";
import FilterNilai from "@/components/FilterNilai";
import NilaiTable from "@/components/NilaiTableWKR";
import { getTahunAjaranDinamis } from "@/lib/actions";

export default async function InputNilaiPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; kelas?: string }>;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== "wakilkurikulum") {
    redirect("/");
  }

  const params = await searchParams;
  const query = params.q || "";
  const filterKelas = params.kelas || "Semua";
  
  const tahunAjaranAktif = await getTahunAjaranDinamis();

  // Ambil NIP langsung dari session user yang login
  const nipGuru = session.user.username; 

  // Ambil data mapel guru
  const guruRes = await sql`SELECT mapel FROM guru WHERE nip = ${nipGuru}`;
  const guruData = guruRes.rows[0];
  const mapelGuru = guruData?.mapel || "Mapel";

  // 2. Ambil seluruh daftar murid aktif untuk kebutuhan data di Autocomplete Dropdown
  const allMuridRes = await sql`SELECT id, nama, nisn, kelas, rombel FROM murid WHERE status = 'aktif'`;

  // 3. Jika guru belum memilih/mencari murid via autocomplete (query kosong)
  // Maka tableData langsung kita set kosong [], tidak usah buang-buang query ke DB.
  let tableData: any[] = [];

  if (query !== "") {
    // PERBAIKAN: Gunakan ILIKE menggantikan '=' agar kebal terhadap perbedaan huruf besar/kecil
    const muridRes = await sql`
      SELECT 
        m.id, 
        m.nama, 
        m.nisn, 
        m.kelas, 
        m.rombel,
        (SELECT id FROM nilai WHERE murid_id = m.id AND guru_id::text = ${nipGuru}::text AND mapel = ${mapelGuru} AND semester = 'Ganjil' AND tahun_ajaran = ${tahunAjaranAktif} LIMIT 1) as id_ganjil,
        (SELECT nilai_angka FROM nilai WHERE murid_id = m.id AND guru_id::text = ${nipGuru}::text AND mapel = ${mapelGuru} AND semester = 'Ganjil' AND tahun_ajaran = ${tahunAjaranAktif} LIMIT 1) as angka_ganjil,
        (SELECT id FROM nilai WHERE murid_id = m.id AND guru_id::text = ${nipGuru}::text AND mapel = ${mapelGuru} AND semester = 'Genap' AND tahun_ajaran = ${tahunAjaranAktif} LIMIT 1) as id_genap,
        (SELECT nilai_angka FROM nilai WHERE murid_id = m.id AND guru_id::text = ${nipGuru}::text AND mapel = ${mapelGuru} AND semester = 'Genap' AND tahun_ajaran = ${tahunAjaranAktif} LIMIT 1) as angka_genap
      FROM murid m
      WHERE (m.nama ILIKE ${query} OR m.nisn ILIKE ${query})
      AND (${filterKelas} = 'Semua' OR m.kelas = ${filterKelas})
      ORDER BY m.nama ASC
    `;
    tableData = muridRes.rows;
  }

  return (
    <div className="p-6 lg:p-10 space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b pb-6">
        <div>
          <div className="flex items-center gap-2 text-blue-600 mb-2">
            <GraduationCap size={20} />
            <span className="text-xs font-bold bg-blue-50 px-2 py-1 rounded-md uppercase tracking-wider">
              Periode: {tahunAjaranAktif}
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-800">Input Nilai Siswa</h1>
          <p className="text-slate-500 text-sm">Mata Pelajaran: <span className="font-bold text-slate-700">{mapelGuru}</span></p>
        </div>
        <Link
        href="/wakilkurikulum/inputnilai/riwayat"
        className="flex items-center gap-2 px-5 py-3 bg-amber-500 hover:bg-amber-600 text-white font-black text-xs rounded-xl shadow-md uppercase tracking-wider transition-all"
      >
        📂 Lihat Murid Sudah Diisi
      </Link>
      </div>

      {/* Komponen filter autocomplete pencarian */}
      <FilterNilai 
        query={query} 
        filterKelas={filterKelas} 
        allMuridList={allMuridRes.rows} 
        mapelGuru={mapelGuru}
        tahunAjaran={tahunAjaranAktif}
        guruId={nipGuru}
      />

      {/* Tampilkan NilaiTable */}
      <NilaiTable initialData={tableData} />
    </div>
  );
}