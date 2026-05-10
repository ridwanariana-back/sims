import { auth } from "@/auth";
import { sql } from "@vercel/postgres";
import { redirect } from "next/navigation";
import { GraduationCap } from "lucide-react";
import FilterNilai from "@/components/FilterNilai";
import NilaiTable from "@/components/NilaiTable"; // Komponen baru yang akan kita buat
import { getTahunAjaranDinamis } from "@/lib/actions";

// guru/inputnilai/page.tsx[cite: 5]

export default async function InputNilaiPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; kelas?: string }>;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== "guru") {
    redirect("/");
  }

  const params = await searchParams;
  const query = params.q || "";
  const filterKelas = params.kelas || "Semua";
  
  // Ambil tahun ajaran dari session agar nilai yang muncul hanya untuk periode ini
  const tahunAjaranAktif = await getTahunAjaranDinamis();

  // 1. Ambil Mapel guru yang sedang login[cite: 5]
  const guruRes = await sql`SELECT id, mapel FROM guru WHERE nip = ${session.user.username}`;
  const guruData = guruRes.rows[0];
  const mapelGuru = guruData?.mapel || "Mapel";
  const guruId = guruData?.id;

  // 2. Query Murid dengan filter tahun_ajaran di setiap subquery[cite: 2, 5]
  const muridRes = await sql`
  SELECT 
    m.id, m.nama, m.nisn, m.kelas, m.rombel, m.status,
    -- Tambahkan filter tahun_ajaran agar nilai kelas X tidak bocor ke kelas XI
    (SELECT id FROM nilai WHERE murid_id = m.id AND guru_id = ${guruId} AND mapel = ${mapelGuru} AND semester = 'Ganjil' AND tahun_ajaran = ${tahunAjaranAktif} LIMIT 1) as id_ganjil,
    (SELECT nilai_angka FROM nilai WHERE murid_id = m.id AND guru_id = ${guruId} AND mapel = ${mapelGuru} AND semester = 'Ganjil' AND tahun_ajaran = ${tahunAjaranAktif} LIMIT 1) as angka_ganjil,
    
    (SELECT id FROM nilai WHERE murid_id = m.id AND guru_id = ${guruId} AND mapel = ${mapelGuru} AND semester = 'Genap' AND tahun_ajaran = ${tahunAjaranAktif} LIMIT 1) as id_genap,
    (SELECT nilai_angka FROM nilai WHERE murid_id = m.id AND guru_id = ${guruId} AND mapel = ${mapelGuru} AND semester = 'Genap' AND tahun_ajaran = ${tahunAjaranAktif} LIMIT 1) as angka_genap
  FROM murid m
  WHERE (m.nama ILIKE ${'%' + query + '%'} OR m.nisn ILIKE ${'%' + query + '%'})
  AND (${filterKelas} = 'Semua' OR m.kelas = ${filterKelas})
  ORDER BY m.nama ASC
`;

  return (
    <div className="p-6 lg:p-10 space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b pb-6">
        <div>
          <div className="flex items-center gap-2 text-blue-600 mb-2">
            <GraduationCap size={20} />
            {/* Tampilkan Periode Aktif di Header agar Guru makin yakin */}
            <span className="text-sm font-bold uppercase tracking-wider">
                Panel Guru • {mapelGuru} • Periode {tahunAjaranAktif} 
            </span>
          </div>
          <h1 className="text-3xl font-black text-slate-900">Manajemen Nilai Siswa</h1>
        </div>
      </div>

      <FilterNilai query={query} filterKelas={filterKelas} />

      <NilaiTable initialData={muridRes.rows} />
    </div>
  );
}