import { auth } from "@/auth";
import { sql } from "@vercel/postgres";
import { notFound, redirect } from "next/navigation";
import Image from "next/image";
import FormInputNilai from "@/components/FormInputNilai";

export default async function HalamanFormNilai({ 
  params,
  searchParams
}: { 
  params: Promise<{ id: string }>,
  searchParams: Promise<{ s?: string }>
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== "guru") {
    redirect("/");
  }

  const { id } = await params;
  const { s } = await searchParams;
  const semesterPilihan = s || "Ganjil";

  const muridRes = await sql`SELECT id, nama, nisn, kelas, foto, status FROM murid WHERE id = ${id}`;
  const murid = muridRes.rows[0];

  if (!murid) notFound();

  // Ambil Mapel Guru
  const guruRes = await sql`SELECT mapel FROM guru WHERE nip = ${session.user.username}`;
  const mapelGuru = guruRes.rows[0]?.mapel || "";

  // Ambil data nilai lama jika sudah pernah diinput (untuk mode Edit)
  const nilaiRes = await sql`
    SELECT * FROM nilai 
    WHERE murid_id = ${id} 
    AND guru_id = ${session.user.id} 
    AND mapel = ${mapelGuru} 
    AND semester = ${semesterPilihan}
  `;
  const dataLama = nilaiRes.rows[0];

  if (murid.status === "Lulus" || murid.status === "Naik Kelas") {
    redirect("/guru/input-nilai");
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-6">
        <div className="relative h-20 w-20 rounded-2xl overflow-hidden bg-slate-100 border-2 border-blue-50">
          <Image 
            src={murid.foto ? `/profil/${murid.foto}` : "/profil/default.png"} 
            alt={murid.nama} 
            fill 
            className="object-cover"
          />
        </div>
        <div>
          <h1 className="text-xl font-black text-slate-900">{murid.nama}</h1>
          <p className="text-slate-500 text-sm font-medium">NISN: {murid.nisn} • Kelas {murid.kelas}</p>
        </div>
      </div>

      <FormInputNilai 
        muridId={murid.id} 
        guruId={session.user.id} 
        mapelDefault={mapelGuru}
        semesterDefault={semesterPilihan}
        dataLama={dataLama} 
      />
    </div>
  );
}