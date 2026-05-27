import { auth } from "@/auth";
import { sql } from "@vercel/postgres";
import { redirect } from "next/navigation";
import { History, ArrowLeft } from "lucide-react";
import Link from "next/link";
import NilaiTable from "@/components/NilaiTableKS";
import { getTahunAjaranDinamis } from "@/lib/actions";

export default async function RiwayatInputNilaiPage() {
  const session = await auth();
  
  // Proteksi Route: Hanya Guru yang bisa akses
  if (!session?.user || session.user.role?.toLowerCase() !== "kepalasekolah") {
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

  // 2. Ambil data asli guru dan mapel menggunakan INNER JOIN satu pintu demi efisiensi
  const guruRes = await sql`
    SELECT g.id, g.mapel 
    FROM users u
    INNER JOIN guru g ON u.guru_id = g.id
    WHERE u.id = ${userIdFromSession}
  `;
  const guruData = guruRes.rows[0];

  if (!guruData) {
    redirect("/kepalasekolah/inputnilai");
  }

  const guruIdInt = guruData.id; // ID Integer asli dari tabel guru
  const mapelGuru = guruData.mapel || ""; // 💡 Sekarang berisi ID Mapel (misal: "12")

  // 💡 AMBIL NAMA MAPEL ASLI UNTUK TEKS DI HEADER UI
  let namaMapelTxt = "Mata Pelajaran";
  if (mapelGuru) {
    const mapelNameRes = await sql`SELECT nama_mapel FROM mapel WHERE id = ${parseInt(mapelGuru.toString(), 10)}`;
    if (mapelNameRes.rows.length > 0) {
      namaMapelTxt = mapelNameRes.rows[0].nama_mapel;
    }
  }

  // 3. Query khusus mengambil Murid yang SUDAH PERNAH diinput nilainya di sekolah & oleh guru ini
  const muridRes = await sql`
    SELECT DISTINCT ON (m.nama)
      m.id, m.nama, m.nisn, m.kelas, m.rombel,
      
      (SELECT id FROM nilai WHERE murid_id = m.id AND guru_id = ${guruIdInt} AND sekolah_id = ${sekolahIdInt} AND mapel = ${mapelGuru} AND semester = 'Ganjil' AND tahun_ajaran = ${tahunAjaranAktif} LIMIT 1) as id_ganjil,
      (SELECT nilai_angka FROM nilai WHERE murid_id = m.id AND guru_id = ${guruIdInt} AND sekolah_id = ${sekolahIdInt} AND mapel = ${mapelGuru} AND semester = 'Ganjil' AND tahun_ajaran = ${tahunAjaranAktif} LIMIT 1) as angka_ganjil,
      
      (SELECT id FROM nilai WHERE murid_id = m.id AND guru_id = ${guruIdInt} AND sekolah_id = ${sekolahIdInt} AND mapel = ${mapelGuru} AND semester = 'Genap' AND tahun_ajaran = ${tahunAjaranAktif} LIMIT 1) as id_genap,
      (SELECT nilai_angka FROM nilai WHERE murid_id = m.id AND guru_id = ${guruIdInt} AND sekolah_id = ${sekolahIdInt} AND mapel = ${mapelGuru} AND semester = 'Genap' AND tahun_ajaran = ${tahunAjaranAktif} LIMIT 1) as angka_genap
    FROM murid m
    INNER JOIN nilai n ON m.id = n.murid_id
    WHERE n.guru_id = ${guruIdInt}         
      AND n.sekolah_id = ${sekolahIdInt}   
      AND n.mapel = ${mapelGuru} -- 💡 Tetap membandingkan ID Mapel di database
      AND n.tahun_ajaran = ${tahunAjaranAktif}
    ORDER BY m.nama ASC
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
            {/* 💡 SEKARANG MENGGUNAKAN namaMapelTxt AGAR YANG KELUAR NAMA MAPELNYA */}
            Mata Pelajaran: <span className="font-bold text-slate-700">{namaMapelTxt}</span>
          </p>
        </div>

        {/* Tombol Kembali ke halaman input utama */}
        <Link 
          href="/kepalasekolah/inputnilai" 
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm transition-all shadow-sm"
        >
          <ArrowLeft size={16} /> Kembali ke Pencarian
        </Link>
      </div>

      {/* Info Box */}
      <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-2xl text-sm text-blue-700">
        💡 Menampilkan daftar semua murid yang <strong>sudah memiliki data nilai</strong> ganjil/genap pada mata pelajaranmu. Kamu bisa langsung klik tombol untuk edit nilai atau isi semester genap.
      </div>

      {/* Tabel Data Riwayat */}
      {tableData.length > 0 ? (
        <NilaiTable initialData={tableData} />
      ) : (
        <div className="text-center py-12 border border-dashed rounded-3xl text-slate-400 font-medium bg-white">
          Belum ada data murid yang pernah kamu input nilainya pada periode ini.
        </div>
      )}
    </div>
  );
}