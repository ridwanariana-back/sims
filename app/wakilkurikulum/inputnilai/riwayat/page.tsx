// app/guru/inputnilai/riwayat/page.tsx

import { auth } from "@/auth";
import { sql } from "@vercel/postgres";
import { redirect } from "next/navigation";
import { History, ArrowLeft } from "lucide-react";
import Link from "next/link";
import NilaiTable from "@/components/NilaiTableWKR";
import { getTahunAjaranDinamis } from "@/lib/actions";

export default async function RiwayatInputNilaiPage() {
  const session = await auth();
  
  // Proteksi Route
  if (!session?.user || session.user.role !== "wakilkurikulum") {
    redirect("/");
  }

  const tahunAjaranAktif = await getTahunAjaranDinamis();
  const nipGuru = session.user.username; 

  // 1. Ambil data mapel guru berdasarkan NIP
  const guruRes = await sql`SELECT mapel FROM guru WHERE nip = ${nipGuru}`;
  const guruData = guruRes.rows[0];
  const mapelGuru = guruData?.mapel || "Mapel";

  // 2. Query khusus mengambil Murid yang SUDAH PERNAH diinput nilainya oleh guru ini
  // Menggunakan DISTINCT agar nama murid tidak ganda jika ganjil & genapnya sudah terisi
  const muridRes = await sql`
    SELECT DISTINCT ON (m.nama)
      m.id, m.nama, m.nisn, m.kelas, m.rombel,
      
      (SELECT id FROM nilai WHERE murid_id = m.id AND guru_id::text = ${nipGuru}::text AND mapel = ${mapelGuru} AND semester = 'Ganjil' AND tahun_ajaran = ${tahunAjaranAktif} LIMIT 1) as id_ganjil,
      (SELECT nilai_angka FROM nilai WHERE murid_id = m.id AND guru_id::text = ${nipGuru}::text AND mapel = ${mapelGuru} AND semester = 'Ganjil' AND tahun_ajaran = ${tahunAjaranAktif} LIMIT 1) as angka_ganjil,
      
      (SELECT id FROM nilai WHERE murid_id = m.id AND guru_id::text = ${nipGuru}::text AND mapel = ${mapelGuru} AND semester = 'Genap' AND tahun_ajaran = ${tahunAjaranAktif} LIMIT 1) as id_genap,
      (SELECT nilai_angka FROM nilai WHERE murid_id = m.id AND guru_id::text = ${nipGuru}::text AND mapel = ${mapelGuru} AND semester = 'Genap' AND tahun_ajaran = ${tahunAjaranAktif} LIMIT 1) as angka_genap
    FROM murid m
    INNER JOIN nilai n ON m.id = n.murid_id
    WHERE n.guru_id::text = ${nipGuru}::text
      AND n.mapel = ${mapelGuru}
      AND n.tahun_ajaran = ${tahunAjaranAktif}
    ORDER BY m.nama ASC
  `;

  const tableData = muridRes.rows;

  return (
    <div className="p-6 lg:p-10 space-y-8">
      {/* Header Halaman */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b pb-6">
        <div>
          <div className="flex items-center gap-2 text-amber-600 mb-2">
            <History size={20} />
            <span className="text-xs font-bold bg-amber-50 px-2 py-1 rounded-md uppercase tracking-wider">
              Periode: {tahunAjaranAktif}
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-800">Siswa Sudah Diisi Nilai</h1>
          <p className="text-slate-500 text-sm">
            Mata Pelajaran: <span className="font-bold text-slate-700">{mapelGuru}</span>
          </p>
        </div>

        {/* Tombol Kembali ke halaman input utama */}
        <Link 
          href="/wakilkurikulum/inputnilai" 
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm transition-all shadow-sm"
        >
          <ArrowLeft size={16} /> Kembali ke Pencarian
        </Link>
      </div>

      {/* Info Box */}
      <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-2xl text-sm text-blue-700">
        💡 Menampilkan daftar semua murid yang <strong>sudah memiliki data nilai</strong> ganjil/genap pada mata pelajaranmu. Kamu bisa langsung klik tombol untuk edit nilai atau isi semester genap.
      </div>

      {/* Gunakan NilaiTable milikmu yang sudah jadi untuk merender list datanya */}
      {tableData.length > 0 ? (
        <NilaiTable initialData={tableData} />
      ) : (
        <div className="text-center py-12 border border-dashed rounded-3xl text-slate-400 font-medium">
          Belum ada data murid yang pernah kamu input nilainya pada periode ini.
        </div>
      )}
    </div>
  );
}