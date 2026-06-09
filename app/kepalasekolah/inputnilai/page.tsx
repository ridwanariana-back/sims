// app/kepalasekolah/inputnilai/page.tsx
import { auth } from "@/auth";
import Link from "next/link";
import { sql } from "@vercel/postgres";
import { redirect } from "next/navigation";
import { GraduationCap } from "lucide-react";
import FilterNilai from "@/components/FilterNilai";
import NilaiTable from "@/components/NilaiTableKS";
import { getTahunAjaranDinamis } from "@/lib/actions";

export default async function InputNilaiPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; kelas?: string; mapel?: string }>; 
}) {
  const session = await auth();
  if (!session?.user || session.user.role?.toLowerCase() !== "kepalasekolah") {
    redirect("/");
  }

  const params = await searchParams;
  const query = params.q || "";
  const filterKelas = params.kelas || "Semua";
  
  const tahunAjaranAktif = await getTahunAjaranDinamis();

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

  // 🔥 AMBIL SEMUA ID MAPEL (ARRAY) DARI TABEL GURU
  const guruRes = await sql`SELECT mapel FROM guru WHERE id = ${guruIdInt}`;
  const guruData = guruRes.rows[0];
  
  let mapelGuruIds: number[] = [];
  if (Array.isArray(guruData?.mapel)) {
    mapelGuruIds = guruData.mapel.map(Number);
  } else if (typeof guruData?.mapel === "string") {
    const cleaned = guruData.mapel.replace(/{|}/g, "");
    mapelGuruIds = cleaned ? cleaned.split(",").map(Number) : [];
  }

  if (mapelGuruIds.length === 0) {
    return (
      <div className="p-6 text-center text-amber-600 font-bold bg-white rounded-3xl border-2 border-amber-100 m-8">
        Error: Anda belum dikaitkan dengan mata pelajaran apapun.
      </div>
    );
  }

  // 🔥 AMBIL DETAIL SEMUA MAPEL GURU DARI DATABASE
  const listMapelRes = await sql`
    SELECT id, nama_mapel FROM mapel WHERE id = ANY(${mapelGuruIds as any})
  `;
  const listMapelGuru = listMapelRes.rows;

  // 🔥 Tentukan Mapel Aktif yang sedang dipilih (Default: mapel pertama)
  const currentMapelId = params.mapel ? parseInt(params.mapel, 10) : listMapelGuru[0]?.id;
  const mapelAktifData = listMapelGuru.find(m => m.id === currentMapelId) || listMapelGuru[0];
  const namaMapelTxt = mapelAktifData?.nama_mapel || "Mata Pelajaran";

  const allMuridRes = await sql`
    SELECT id, nama, nisn, kelas, rombel 
    FROM murid 
    WHERE status = 'aktif' 
      AND sekolah_id = ${sekolahIdInt}
  `;

  let tableData: any[] = [];

  if (query !== "") {
    // 🔥 Jalankan query data nilai menggunakan `currentMapelId` yang dinamis
    const muridRes = await sql`
      SELECT 
        m.id, 
        m.nama, 
        m.nisn, 
        m.kelas, 
        m.rombel,
        (SELECT id FROM nilai WHERE murid_id = m.id AND guru_id = ${guruIdInt} AND sekolah_id = ${sekolahIdInt} AND mapel = ${currentMapelId.toString()} AND semester = 'Ganjil' AND tahun_ajaran = ${tahunAjaranAktif} LIMIT 1) as id_ganjil,
        (SELECT nilai_angka FROM nilai WHERE murid_id = m.id AND guru_id = ${guruIdInt} AND sekolah_id = ${sekolahIdInt} AND mapel = ${currentMapelId.toString()} AND semester = 'Ganjil' AND tahun_ajaran = ${tahunAjaranAktif} LIMIT 1) as angka_ganjil,
        (SELECT id FROM nilai WHERE murid_id = m.id AND guru_id = ${guruIdInt} AND sekolah_id = ${sekolahIdInt} AND mapel = ${currentMapelId.toString()} AND semester = 'Genap' AND tahun_ajaran = ${tahunAjaranAktif} LIMIT 1) as id_genap,
        (SELECT nilai_angka FROM nilai WHERE murid_id = m.id AND guru_id = ${guruIdInt} AND sekolah_id = ${sekolahIdInt} AND mapel = ${currentMapelId.toString()} AND semester = 'Genap' AND tahun_ajaran = ${tahunAjaranAktif} LIMIT 1) as angka_genap
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
          <p className="text-slate-500 text-sm">Mode Mengisi: <span className="font-bold text-blue-600 uppercase bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">{namaMapelTxt}</span></p>
        </div>
        <Link
          href="/kepalasekolah/inputnilai/riwayat"
          className="flex items-center gap-2 px-5 py-3 bg-amber-500 hover:bg-amber-600 text-white font-black text-xs rounded-xl shadow-md uppercase tracking-wider transition-all"
        >
          📂 Lihat Murid Sudah Diisi
        </Link>
      </div>

      <FilterNilai 
        query={query} 
        filterKelas={filterKelas} 
        allMuridList={allMuridRes.rows} 
        mapelGuru={currentMapelId.toString()} 
        listMapelGuru={listMapelGuru} 
        selectedMapel={currentMapelId.toString()} 
        tahunAjaran={tahunAjaranAktif}
        guruId={guruIdInt.toString()}
        sekolahId={sekolahIdInt}
      />

      {/* 🔥 Data dipetakan agar menyuntikkan mapel_id dan nama_mapel yang sedang aktif dipilih di dropdown */}
      <NilaiTable 
        initialData={tableData.map(row => ({
          ...row,
          mapel_id: currentMapelId,
          nama_mapel: namaMapelTxt
        }))} 
      />
    </div>
  );
}