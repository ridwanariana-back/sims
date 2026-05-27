// app/guru/kehadiran/riwayat/page.tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { FileText } from "lucide-react";
import ClientRiwayatKehadiran from "@/components/ClientRiwayatKehadiran";

export default async function RiwayatKehadiranPage() {
  const session = await auth();

  // 1. Amankan Proteksi Sesi dan Hak Akses Wali Kelas
  if (!session?.user || session.user.role?.toLowerCase() !== "guru") {
    redirect("/");
  }

  if (!session.user.isWaliKelas || !session.user.kelasWali) {
    redirect("/");
  }

  const rombelWali = session.user.kelasWali;
  const tahunAjaranActive = session.user.tahunAjaran || "-";

  // 2. Parsing Multi-Tenant ID Sekolah
  const sId = session.user.sekolah_id || (session.user as any).sekolahId;
  const sekolahIdInt = sId ? parseInt(sId.toString(), 10) : null;

  if (!sekolahIdInt) {
    redirect("/");
  }

  return (
    <div className="space-y-6 p-4 text-left">
      {/* HEADER UTAMA SERVER RENDERED */}
      <div className="bg-white border-b-4 border-slate-900 p-8 rounded-t-[2.5rem] shadow-sm flex items-center gap-4">
        <div className="p-4 bg-slate-900 rounded-2xl text-white">
          <FileText size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Laporan Kehadiran Siswa</h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic mt-1">
            Kelas: <span className="text-indigo-600 font-black">{rombelWali}</span> | Periode: {tahunAjaranActive}
          </p>
        </div>
      </div>

      {/* OPER DATA SECARA AMAN KE INTERAKSI CLIENT COMPONENT */}
      <ClientRiwayatKehadiran 
        kelasWali={rombelWali}
        tahunAjaran={tahunAjaranActive}
        sekolahId={sekolahIdInt}
      />
    </div>
  );
}