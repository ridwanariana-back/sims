import { auth } from "@/auth";
import { sql } from "@vercel/postgres";
import { redirect } from "next/navigation";
import { NotebookText, ClipboardCheck } from "lucide-react";
import ClientRiwayatTable from "@/components/ClientRiwayatTable";
import { getTahunAjaranDinamis } from "@/lib/actions";

export default async function RiwayatNilaiPage() {
  const session = await auth();

  // Proteksi Route: Hanya Guru yang bisa akses
  if (!session?.user || session.user.role?.toLowerCase() !== "wakilkesiswaan") {
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
    return (
      <div className="p-6 text-center text-rose-600 font-bold bg-white rounded-3xl border-2 border-rose-100 m-8">
        Error: Profil Guru tidak ditemukan di sistem database.
      </div>
    );
  }

  const guruIdInt = guruData.id; // ID Integer asli dari tabel guru
  const mapelGuru = guruData.mapel || "";

  // 💡 AMBIL NAMA MAPEL ASLI UNTUK TEKS DI HEADER & TABEL
  let namaMapelTxt = "Mata Pelajaran";
  if (mapelGuru) {
    const mapelNameRes = await sql`SELECT nama_mapel FROM mapel WHERE id = ${parseInt(mapelGuru.toString(), 10)}`;
    if (mapelNameRes.rows.length > 0) {
      namaMapelTxt = mapelNameRes.rows[0].nama_mapel;
    }
  }

  // 3. Query mengambil seluruh riwayat nilai, dikunci dengan sekolah_id dan guru_id (Integer)
  const riwayatRes = await sql`
    SELECT 
      n.id as nilai_id,
      n.nilai_harian,
      n.nilai_mid,
      n.nilai_uas,
      n.nilai_angka,
      n.tahun_ajaran,
      n.semester,
      n.mapel, -- Ini menampung string ID
      m.nama as nama_murid,
      m.nisn
    FROM nilai n
    JOIN murid m ON n.murid_id = m.id
    WHERE n.guru_id = ${guruIdInt}          
      AND n.sekolah_id = ${sekolahIdInt}    
      AND n.mapel = ${mapelGuru}
    ORDER BY n.id DESC
  `;

  // 💡 SISIPKAN PROPERTI nama_mapel KE TIAP BARIS DATA SEBELUM DIKIRIM KE CLIENT
  const dataRiwayat = riwayatRes.rows.map((row) => ({
    ...row,
    nama_mapel: namaMapelTxt, // Menyisipkan nama asli teks mapel hasil query di atas
  }));

  return (
    <div className="space-y-6 p-2 text-left">
      {/* HEADER SECTION */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-indigo-600 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-indigo-100">
            <NotebookText size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none">Riwayat Input Nilai</h1>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-2 italic">
              {/* 💡 GANTI JADI namaMapelTxt */}
              Arsip seluruh nilai mata pelajaran {namaMapelTxt} yang pernah Anda berikan
            </p>
          </div>
        </div>
      </div>

      {/* STATS */}
      <div className="flex items-center gap-4 px-4">
        <div className="bg-white border border-slate-200 px-6 py-3 rounded-2xl flex items-center gap-3 shadow-sm">
          <ClipboardCheck size={16} className="text-emerald-500" />
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Total Record:</span>
          <span className="text-sm font-black text-slate-900">{dataRiwayat.length} Entry</span>
        </div>
      </div>

      {/* Lempar data riwayat yang sudah di-mapping aman ke komponen client */}
      <ClientRiwayatTable initialData={dataRiwayat} />
    </div>
  );
}