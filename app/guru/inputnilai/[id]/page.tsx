import { auth } from "@/auth";
import { sql } from "@vercel/postgres";
import { notFound, redirect } from "next/navigation";
import { redirect as nextRedirect } from "next/navigation";
import FormInputNilai from "@/components/FormInputNilai";
import { getTahunAjaranDinamis } from "@/lib/actions";

export default async function HalamanFormNilai({ 
  params,
  searchParams
}: { 
  params: Promise<{ id: string }>,
  searchParams: Promise<{ s?: string }>
}) {
  const session = await auth();
  
  // Proteksi Route: Hanya Guru yang bisa akses
  if (!session?.user || session.user.role !== "guru") {
    nextRedirect("/");
  }

  const { id } = await params;
  const { s } = await searchParams;
  const semesterPilihan = s || "Ganjil";

  // 1. Ambil Data Murid (Tanpa kolom 'foto', tambahkan 'rombel')
  const muridRes = await sql`
    SELECT id, nama, nisn, kelas, rombel, status 
    FROM murid 
    WHERE id = ${id}
  `;
  const murid = muridRes.rows[0];

  if (!murid) notFound();

  // 2. Ambil Mapel Guru yang sedang login berdasarkan NIP (username)[cite: 5]
  const guruRes = await sql`SELECT id, mapel FROM guru WHERE nip = ${session.user.username}`;
  const guruData = guruRes.rows[0];
  const mapelGuru = guruData?.mapel || "";
  const guruIdDb = guruData?.id;

  // 3. Ambil data nilai lama jika sudah pernah diinput (untuk mode Edit)[cite: 5]
  const nilaiRes = await sql`
    SELECT * FROM nilai 
    WHERE murid_id = ${id} 
    AND guru_id = ${guruIdDb} 
    AND mapel = ${mapelGuru} 
    AND semester = ${semesterPilihan}
  `;
  const dataLama = nilaiRes.rows[0];
  const tahunSekarang = await getTahunAjaranDinamis();

  // Cegah input nilai jika murid sudah dinyatakan Lulus atau Naik Kelas[cite: 5]
  if (murid.status === "Lulus" || murid.status === "Naik Kelas") {
    nextRedirect("/guru/inputnilai");
  }

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto space-y-8">
      {/* 
          Komponen FormInputNilai sekarang menerima detailMurid 
          termasuk rombel untuk ditampilkan di header[cite: 3]
      */}
      <FormInputNilai 
        muridId={murid.id} 
        guruId={guruIdDb} 
        mapelDefault={mapelGuru}
        semesterDefault={semesterPilihan}
        dataLama={dataLama} 
        detailMurid={{
          nama: murid.nama,
          nisn: murid.nisn,
          kelas: murid.kelas,
          rombel: murid.rombel || "-" 
        }}
        tahunAjaran={tahunSekarang}
      />
    </div>
  );
}