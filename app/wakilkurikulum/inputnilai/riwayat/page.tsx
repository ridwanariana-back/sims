// app/wakilkurikulum/inputnilai/riwayat/page.tsx
import { auth } from "@/auth";
import { sql } from "@vercel/postgres";
import { redirect } from "next/navigation";
import { History, ArrowLeft } from "lucide-react";
import Link from "next/link";
import NilaiTable from "@/components/NilaiTableWKR";
import { getTahunAjaranDinamis } from "@/lib/actions";

export default async function RiwayatInputNilaiPage() {
  const session = await auth();
  
  // Proteksi Route: Hanya Guru yang bisa akses
  if (!session?.user || session.user.role?.toLowerCase() !== "wakilkurikulum") {
    redirect("/");
  }

  const tahunAjaranAktif = await getTahunAjaranDinamis();

  // 1. Ambil sekolah_id dan User ID dari session login
  const sId = session.user.sekolah_id || (session.user as any).sekolahId;
  const sekolahIdInt = sId ? parseInt(sId.toString(), 10) : null;
  const userIdFromSession = session.user.id;

  if (!sekolahIdInt || !userIdFromSession) {
    return (
      <div className="p-6 text-center text-rose-600 font-bold bg-white rounded-3xl border-2 border-rose-100 m-8">
        Error: Autentikasi Gagal atau ID Sekolah tidak ditemukan.
      </div>
    );
  }

  // 2. Ambil data asli guru dan list ID mapel yang dia miliki
  const guruRes = await sql`
    SELECT g.id, g.mapel 
    FROM users u
    INNER JOIN guru g ON u.guru_id = g.id
    WHERE u.id = ${userIdFromSession}
  `;
  const guruData = guruRes.rows[0];

  if (!guruData) {
    redirect("/wakilkurikulum/inputnilai");
  }

  const guruIdInt = guruData.id; 
  
  // 💡 Antisipasi jika field mapel di database berupa array atau string JSON (misal: "[19, 20]" atau "19,20")
  let mapelIds: number[] = [];
  try {
    if (Array.isArray(guruData.mapel)) {
      mapelIds = guruData.mapel.map((id: any) => parseInt(id, 10));
    } else if (typeof guruData.mapel === "string") {
      // Jika disave dalam bentuk string "[19,20]" atau "19,20"
      const cleanStr = guruData.mapel.replace(/[\[\]]/g, "");
      mapelIds = cleanStr.split(",").map((id: string) => parseInt(id.trim(), 10)).filter(Boolean);
    } else if (guruData.mapel) {
      mapelIds = [parseInt(guruData.mapel, 10)];
    }
  } catch (e) {
    console.error("Gagal parsing mapel guru:", e);
  }

  if (mapelIds.length === 0) {
    return (
      <div className="p-6 text-center text-amber-600 font-bold bg-white rounded-3xl border border-amber-200 m-8">
        Kamu belum dikonfigurasi mengampu mata pelajaran apapun oleh Admin.
      </div>
    );
  }

  // 3. Query khusus mengambil data Murid BESERTA Mapelnya (DISTINCT ON kombinasi nama & mapel)
  // 💡 Di sini kita hilangkan penguncian satu mapel tunggal, tapi memakai operator IN (${mapelIds})
  const muridRes = await sql`
    SELECT DISTINCT ON (m.nama, n.mapel)
      m.id, 
      m.nama, 
      m.nisn, 
      m.kelas, 
      m.rombel,
      n.mapel as mapel_id,
      (SELECT nama_mapel FROM mapel WHERE id = CAST(n.mapel AS INTEGER) LIMIT 1) as nama_mapel,
      
      (SELECT id FROM nilai WHERE murid_id = m.id AND guru_id = ${guruIdInt} AND sekolah_id = ${sekolahIdInt} AND mapel = n.mapel AND semester = 'Ganjil' AND tahun_ajaran = ${tahunAjaranAktif} LIMIT 1) as id_ganjil,
      (SELECT nilai_angka FROM nilai WHERE murid_id = m.id AND guru_id = ${guruIdInt} AND sekolah_id = ${sekolahIdInt} AND mapel = n.mapel AND semester = 'Ganjil' AND tahun_ajaran = ${tahunAjaranAktif} LIMIT 1) as angka_ganjil,
      
      (SELECT id FROM nilai WHERE murid_id = m.id AND guru_id = ${guruIdInt} AND sekolah_id = ${sekolahIdInt} AND mapel = n.mapel AND semester = 'Genap' AND tahun_ajaran = ${tahunAjaranAktif} LIMIT 1) as id_genap,
      (SELECT nilai_angka FROM nilai WHERE murid_id = m.id AND guru_id = ${guruIdInt} AND sekolah_id = ${sekolahIdInt} AND mapel = n.mapel AND semester = 'Genap' AND tahun_ajaran = ${tahunAjaranAktif} LIMIT 1) as angka_genap
    FROM murid m
    INNER JOIN nilai n ON m.id = n.murid_id
    WHERE n.guru_id = ${guruIdInt}         
      AND n.sekolah_id = ${sekolahIdInt}   
      AND CAST(n.mapel AS INTEGER) = ANY(${mapelIds as any}) -- 💡 Mengambil semua data dari list mapel guru
      AND n.tahun_ajaran = ${tahunAjaranAktif}
    ORDER BY m.nama ASC, n.mapel ASC
  `;

  const tableData = muridRes.rows;

  return (
    <div className="p-6 lg:p-10 space-y-8 text-left">
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
            Menampilkan riwayat nilai dari semua mata pelajaran yang kamu ampu.
          </p>
        </div>

        {/* Tombol Kembali ke halaman pencarian utama */}
        <Link 
          href="/wakilkurikulum/inputnilai" 
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm transition-all shadow-sm"
        >
          <ArrowLeft size={16} /> Kembali ke Pencarian
        </Link>
      </div>

      {/* Info Box */}
      <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-2xl text-sm text-blue-700">
        💡 Menampilkan daftar semua murid yang <strong>sudah memiliki data nilai</strong> ganjil/genap. Data dikelompokkan per siswa dan per mata pelajaran yang kamu ajar.
      </div>

      {/* Tabel Data Riwayat */}
      {tableData.length > 0 ? (
        // 💡 Kirim data ke NilaiTable, pastikan NilaiTable kamu merender kolom "Mata Pelajaran" nya!
        <NilaiTable initialData={tableData} />
      ) : (
        <div className="text-center py-12 border border-dashed rounded-3xl text-slate-400 font-medium bg-white">
          Belum ada data murid yang pernah kamu input nilainya pada periode ini.
        </div>
      )}
    </div>
  );
}