import { auth } from "@/auth";
import { sql } from "@vercel/postgres";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { PlusCircle, Edit3, Trash2, GraduationCap, ClipboardCheck } from "lucide-react";
import FilterNilai from "@/components/FilterNilai";

export default async function InputNilaiPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; kelas?: string }>;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== "guru") {
    redirect("/");
  }

  const params = await searchParams;
  const query = params.q || "";
  const filterKelas = params.kelas || "Semua";

  // 1. Ambil Mapel guru yang sedang login berdasarkan NIP/Username
  const guruRes = await sql`SELECT mapel FROM guru WHERE nip = ${session.user.username}`;
  const mapelGuru = guruRes.rows[0]?.mapel || "Mapel";

  // 2. Query Murid sekaligus cek keberadaan nilai Ganjil/Genap untuk Mapel & Guru ini
  const muridRes = await sql`
    SELECT 
      m.id, m.nama, m.nisn, m.kelas, m.foto, m.status,
      (SELECT id FROM nilai WHERE murid_id = m.id AND guru_id = ${session.user.id} AND mapel = ${mapelGuru} AND semester = 'Ganjil' LIMIT 1) as id_ganjil,
      (SELECT id FROM nilai WHERE murid_id = m.id AND guru_id = ${session.user.id} AND mapel = ${mapelGuru} AND semester = 'Genap' LIMIT 1) as id_genap
    FROM murid m
    WHERE (m.nama ILIKE ${'%' + query + '%'} OR m.nisn ILIKE ${'%' + query + '%'})
    AND (${filterKelas} = 'Semua' OR m.kelas = ${filterKelas})
    ORDER BY m.nama ASC
  `;
  const daftarMurid = muridRes.rows;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b pb-6">
        <div>
          <div className="flex items-center gap-2 text-blue-600 mb-2">
            <GraduationCap size={20} />
            <span className="text-sm font-bold uppercase tracking-wider">Panel Guru • {mapelGuru}</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900">Manajemen Nilai Siswa</h1>
        </div>
      </div>

      <FilterNilai query={query} filterKelas={filterKelas} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {daftarMurid.map((murid) => {
          const isFinalized = murid.status === "Lulus" || murid.status === "Naik Kelas";
          
          return (
            <div key={murid.id} className="group bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl transition-all overflow-hidden flex flex-col">
              <div className="p-6 flex-1">
                <div className="flex items-start gap-4">
                  <div className="relative h-16 w-16 rounded-2xl overflow-hidden bg-slate-100 border-2 border-white shadow-md">
                    <Image 
                      src={murid.foto ? `/profil/${murid.foto}` : "/profil/default.png"} 
                      alt={murid.nama} 
                      fill 
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-md uppercase">
                      Kelas {murid.kelas}
                    </span>
                    <h3 className="font-bold text-slate-900 text-base mt-1 line-clamp-1">{murid.nama}</h3>
                    <p className="text-xs font-mono text-slate-400">{murid.nisn}</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="px-4 py-4 bg-slate-50 border-t border-slate-100 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  {/* Tombol Semester Ganjil */}
                  <Link 
                    href={`/guru/inputnilai/${murid.id}?s=Ganjil`}
                    className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[11px] font-bold transition-all ${
                      isFinalized ? "bg-slate-200 text-slate-400 pointer-events-none" :
                      murid.id_ganjil ? "bg-amber-500 text-white hover:bg-amber-600 shadow-md" : 
                      "bg-blue-600 text-white hover:bg-blue-700 shadow-md"
                    }`}
                  >
                    {murid.id_ganjil ? <Edit3 size={14} /> : <PlusCircle size={14} />}
                    {murid.id_ganjil ? "Edit Ganjil" : "Input Ganjil"}
                  </Link>

                  {/* Tombol Semester Genap */}
                  <Link 
                    href={`/guru/inputnilai/${murid.id}?s=Genap`}
                    className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[11px] font-bold transition-all ${
                      isFinalized ? "bg-slate-200 text-slate-400 pointer-events-none" :
                      murid.id_genap ? "bg-amber-500 text-white hover:bg-amber-600 shadow-md" : 
                      "bg-blue-600 text-white hover:bg-blue-700 shadow-md"
                    }`}
                  >
                    {murid.id_genap ? <Edit3 size={14} /> : <PlusCircle size={14} />}
                    {murid.id_genap ? "Edit Genap" : "Input Genap"}
                  </Link>
                </div>

                <div className="flex gap-2">
                  <Link 
                    href={`/guru/inputnilai/riwayat/${murid.id}`}
                    className="flex-1 flex items-center justify-center gap-2 py-2 bg-white border border-slate-200 text-slate-500 rounded-xl text-[11px] font-bold hover:bg-slate-100"
                  >
                    <ClipboardCheck size={14} /> Riwayat
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}