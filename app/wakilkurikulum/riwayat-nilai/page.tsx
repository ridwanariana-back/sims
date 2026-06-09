// app/guru/riwayat-nilai/page.tsx
import { auth } from "@/auth";
import { sql } from "@vercel/postgres";
import { redirect } from "next/navigation";
import { NotebookText, ClipboardCheck } from "lucide-react";
import ClientRiwayatTable from "@/components/ClientRiwayatTable";
import { getTahunAjaranDinamis } from "@/lib/actions";

export default async function RiwayatNilaiPage() {
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
  
  // 💡 Parsing data mapel guru (antisipasi jika tipenya array atau string JSON list)
  let mapelIds: number[] = [];
  try {
    if (Array.isArray(guruData.mapel)) {
      mapelIds = guruData.mapel.map((id: any) => parseInt(id, 10));
    } else if (typeof guruData.mapel === "string") {
      const cleanStr = guruData.mapel.replace(/[\[\]{}]/g, "");
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

  // 3. Query mengambil seluruh riwayat nilai menggunakan ANY() agar mencakup seluruh mapel yang diampu
  const riwayatRes = await sql`
    SELECT 
      n.id as nilai_id,
      n.nilai_harian,
      n.nilai_mid,
      n.nilai_uas,
      n.nilai_angka,
      n.tahun_ajaran,
      n.semester,
      n.mapel, -- menampung ID mapel dari row nilai
      (SELECT nama_mapel FROM mapel WHERE id = CAST(n.mapel AS INTEGER) LIMIT 1) as nama_mapel, -- 💡 Cari nama teks mapel asli langsung dari db
      m.nama as nama_murid,
      m.nisn
    FROM nilai n
    JOIN murid m ON n.murid_id = m.id
    WHERE n.guru_id = ${guruIdInt}          
      AND n.sekolah_id = ${sekolahIdInt}    
      AND CAST(n.mapel AS INTEGER) = ANY(${mapelIds as any}) -- 💡 Support multi-mapel
      AND n.tahun_ajaran = ${tahunAjaranAktif}
    ORDER BY n.id DESC
  `;

  const dataRiwayat = riwayatRes.rows;

  return (
    <div className="space-y-6 p-2 text-left">
      {/* HEADER SECTION */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-indigo-600 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-indigo-100">
            <NotebookText size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none">Riwayat Rekap Nilai</h1>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-2 italic">
              Arsip seluruh rekap nilai dari semua mata pelajaran yang Anda ampu
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

      {/* Lempar data riwayat yang sudah aman ke komponen client */}
      <ClientRiwayatTable initialData={dataRiwayat} />
    </div>
  );
}