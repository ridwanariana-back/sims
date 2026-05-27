// app/guru/datamurid/page.tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { sql } from "@vercel/postgres";
import { GraduationCap } from "lucide-react";
import { getMuridByWaliWithValidation } from "@/lib/actions";
import ClientWaliKelasManager from "@/components/ClientWaliKelasManager";

export default async function DataMuridWaliPage() {
  const session = await auth();

  // 1. Validasi Akses Perwalian
  if (!session?.user || session.user.role?.toLowerCase() !== "guru") {
    redirect("/");
  }

  // Jika akun ini di-set bukan wali kelas, tolak akses ke halaman ini
  if (!session.user.isWaliKelas || !session.user.kelasWali) {
    redirect("/");
  }

  const rombelWaliAktif = session.user.kelasWali;

  // 2. Ambil data sekolah_id dan dapatkan guru_id integer asli dari database
  const sId = session.user.sekolah_id || (session.user as any).sekolahId;
  const sekolahIdInt = sId ? parseInt(sId.toString(), 10) : null;
  const userIdFromSession = session.user.id;

  if (!sekolahIdInt || !userIdFromSession) {
    redirect("/");
  }

  // Ambil ID Guru Asli lewat inner join satu kali jalan
  const guruRes = await sql`
    SELECT g.id 
    FROM users u
    INNER JOIN guru g ON u.guru_id = g.id
    WHERE u.id = ${userIdFromSession}
  `;
  const guruData = guruRes.rows[0];
  if (!guruData) redirect("/");
  const guruIdInt = guruData.id;

  // 3. 💡 AMBIL MASTER MAPEL: Ambil seluruh daftar nama dari master tabel mapel sekolah ini
  const mapelRes = await sql`
    SELECT nama_mapel as nama 
    FROM mapel 
    WHERE sekolah_id = ${sekolahIdInt} AND kelompok != 'Kegiatan'
    ORDER BY nama ASC
  `;
  
  // Ambil array string nama mata pelajaran
  const daftarMapelSekolah = mapelRes.rows.length > 0 
    ? mapelRes.rows.map(row => row.nama)
    : [
        "PAI & BudiPekerti", "PKN", "Bahasa Indonesia", "Bahasa Inggris", 
        "Matematika Wajib", "Fisika", "Biologi", "Kimia", "Sejarah", "Geografi"
      ]; // Cadangan jika tabel master mapel di DB masih kosong

  // 4. Ambil data murid perwalian terkunci dengan sekolah_id
  const listMuridWali = await getMuridByWaliWithValidation(rombelWaliAktif, sekolahIdInt);

  return (
    <div className="space-y-6 p-2 text-left">
      {/* HEADER */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 flex items-center gap-6 shadow-sm">
        <div className="w-16 h-16 bg-indigo-600 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-indigo-100">
          <GraduationCap size={32} />
        </div>
        <div>
          <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none">Kenaikan Kelas</h1>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-2 italic">
            Daftar Perwalian Rombel: <span className="text-indigo-600 font-black">{rombelWaliAktif}</span>
          </p>
        </div>
      </div>

      {/* Jembatan ke Komponen Client untuk Aksi Interaktif */}
      <ClientWaliKelasManager 
        initialMuridList={listMuridWali} 
        daftarMapelDinamis={daftarMapelSekolah} 
        sekolahId={sekolahIdInt}
        guruId={guruIdInt}
        rombelWali={rombelWaliAktif}
      />
    </div>
  );
}