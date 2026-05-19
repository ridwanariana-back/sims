// app/guru/riwayat-nilai/page.tsx

import { auth } from "@/auth";
import { sql } from "@vercel/postgres";
import { redirect } from "next/navigation";
import { NotebookText, BookOpen, User, ClipboardCheck } from "lucide-react";
import ClientRiwayatTable from "@/components/ClientRiwayatTable"; // Kita pindahkan pencarian & pagination ke client component terpisah
import { getTahunAjaranDinamis } from "@/lib/actions";

export default async function RiwayatNilaiPage() {
  const session = await auth();

  // Proteksi Route: Hanya Guru yang bisa akses
  if (!session?.user || session.user.role !== "wakilkesiswaan") {
    redirect("/");
  }

  const nipGuru = session.user.username; // Ambil NIP Guru dari session username
  const tahunAjaranAktif = await getTahunAjaranDinamis();

  // Ambil Mapel Guru yang sedang login
  const guruRes = await sql`SELECT mapel FROM guru WHERE nip = ${nipGuru}`;
  const guruData = guruRes.rows[0];
  const mapelGuru = guruData?.mapel || "";

  // Query langsung mengambil seluruh riwayat nilai yang pernah diinput oleh guru ini
  const riwayatRes = await sql`
    SELECT 
      n.id as nilai_id,
      n.nilai_harian,
      n.nilai_mid,
      n.nilai_uas,
      n.nilai_angka,
      n.tahun_ajaran,
      n.semester,
      n.mapel,
      m.nama as nama_murid,
      m.nisn
    FROM nilai n
    JOIN murid m ON n.murid_id = m.id
    WHERE n.guru_id::text = ${nipGuru}::text
      AND n.mapel = ${mapelGuru}
    ORDER BY n.id DESC
  `;

  const dataRiwayat = riwayatRes.rows;

  return (
    <div className="space-y-6 p-2">
      {/* HEADER SECTION */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-indigo-600 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-indigo-100">
            <NotebookText size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none">Riwayat Input Nilai</h1>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-2 italic">Arsip seluruh nilai yang pernah Anda berikan</p>
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

      {/* Lempar data riwayat dari DB ke komponen client untuk fitur search & pagination */}
      <ClientRiwayatTable initialData={dataRiwayat} />
    </div>
  );
}