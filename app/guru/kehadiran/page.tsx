// app/guru/kehadiran/page.tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { sql } from "@vercel/postgres";
import { Users } from "lucide-react";
import { getMuridByWaliWithSchool } from "@/lib/actions";
import ClientKehadiranManager from "@/components/ClientKehadiranManager";

export default async function KehadiranPage() {
  const session = await auth();

  // 1. Validasi Akses Perwalian Guru
  if (!session?.user || session.user.role?.toLowerCase() !== "guru") {
    redirect("/");
  }

  if (!session.user.isWaliKelas || !session.user.kelasWali) {
    redirect("/");
  }

  const rombelWaliAktif = session.user.kelasWali;
  const tahunAjaranAktif = session.user.tahunAjaran || "-";

  // 2. Ambil Multi-Tenant ID Sekolah & User ID
  const sId = session.user.sekolah_id || (session.user as any).sekolahId;
  const sekolahIdInt = sId ? parseInt(sId.toString(), 10) : null;
  const userIdFromSession = session.user.id;

  if (!sekolahIdInt || !userIdFromSession) {
    redirect("/");
  }

  // 3. Ambil ID Guru Asli bertipe Integer (untuk kebutuhan foreign key fk_kehadiran_guru)
  const guruRes = await sql`
    SELECT g.id 
    FROM users u
    INNER JOIN guru g ON u.guru_id = g.id
    WHERE u.id = ${userIdFromSession}
  `;
  const guruData = guruRes.rows[0];
  if (!guruData) redirect("/");
  const guruIdInt = guruData.id;

  // 4. Ambil data murid ter-kunci dengan sekolah_id
  const listMuridWali = await getMuridByWaliWithSchool(rombelWaliAktif, sekolahIdInt);

  return (
    <div className="space-y-6 p-2 text-left">
      {/* HEADER UTAMA */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 flex items-center gap-6 shadow-sm">
        <div className="w-16 h-16 bg-indigo-600 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-indigo-100">
          <Users size={32} />
        </div>
        <div>
          <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none">Presensi Kelas</h1>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-2 italic">
            Daftar Perwalian Rombel: <span className="text-indigo-600 font-black">{rombelWaliAktif}</span>
          </p>
        </div>
      </div>

      {/* Jembatan ke Interaksi UI Client Component */}
      <ClientKehadiranManager 
        initialMurid={listMuridWali}
        sekolahId={sekolahIdInt}
        guruId={guruIdInt}
        tahunAjaran={tahunAjaranAktif}
        kelasWali={rombelWaliAktif}
      />
    </div>
  );
}