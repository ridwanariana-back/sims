// app/guru/kedisiplinan/page.tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import ClientKedisiplinanManager from "@/components/ClientKedisiplinanManager";
import { sql } from "@vercel/postgres"; // Sesuaikan dengan koneksi database kamu

export default async function KedisiplinanPage() {
  const session = await auth();

  // 1. Otorisasi Pengamanan Akun Guru Wali Kelas
  if (!session?.user || session.user.role?.toLowerCase() !== "guru") {
    redirect("/");
  }

  if (!session.user.isWaliKelas || !session.user.kelasWali) {
    redirect("/");
  }

  // 2. Ambil ID User dari session auth (ID bernilai 31 yang error tadi)
  const authUserId = (session.user as any).id; 

  let guruIdInt: number | null = null;
  let sekolahIdInt: number | null = null;

  try {
    // 💡 Sesuai taktikmu: Tarik guru_id langsung dari tabel users/user berdasarkan id session
    // Catatan: Pastikan nama tabelnya 'users' atau 'user' sesuai di database Neon kamu ya!
    const userQuery = await sql`
      SELECT guru_id, sekolah_id FROM users WHERE id = ${authUserId} LIMIT 1
    `;
    
    if (userQuery.rows.length > 0) {
      guruIdInt = userQuery.rows[0].guru_id;      // Ini guru_id integer hasil fetch
      sekolahIdInt = userQuery.rows[0].sekolah_id;  // Ini sekolah_id hasil fetch
    }
  } catch (error) {
    console.error("Gagal mengambil guru_id dari tabel users:", error);
  }

  // Jika guru_id tidak ditemukan atau bernilai null, gagalkan proses
  if (!guruIdInt || !sekolahIdInt) {
    console.error(`User dengan ID ${authUserId} tidak memiliki relasi guru_id yang valid.`);
    redirect("/");
  }

  const rombelWali = session.user.kelasWali;
  const tahunAjaranActive = session.user.tahunAjaran || "-";

  return (
    <div className="p-6 space-y-6 text-left">
      <div className="bg-white border-b-4 border-slate-900 p-8 rounded-t-[2.5rem] flex items-center gap-4 shadow-sm">
        <div className="p-4 bg-rose-600 rounded-2xl text-white border-2 border-slate-900 shadow-lg shadow-rose-100">
          <ShieldAlert size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Buku Kendali Siswa</h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic mt-1">
            Wali Kelas: <span className="text-rose-600 font-black">{rombelWali}</span> • {tahunAjaranActive}
          </p>
        </div>
      </div>

      {/* Sekarang guruIdInt yang dikirim ke sini adalah murni GURU_ID asli, bukan user id lagi */}
      <ClientKedisiplinanManager 
        guruId={guruIdInt} 
        sekolahId={sekolahIdInt}
        kelasWali={rombelWali}
        tahunAjaran={tahunAjaranActive}
      />
    </div>
  );
}