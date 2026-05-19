// app/wakilkesiswaan/inputnilai/[id]/page.tsx

import { auth } from "@/auth";
import { sql } from "@vercel/postgres";
import { notFound } from "next/navigation";
import { redirect as nextRedirect } from "next/navigation";
import FormInputNilai from "@/components/FormInputNilaiWKS";
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
  if (!session?.user || session.user.role !== "wakilkesiswaan") {
    nextRedirect("/");
  }

  const { id } = await params;
  const { s } = await searchParams;
  const semesterPilihan = s || "Ganjil";

  // Pastikan ID yang masuk adalah angka valid sebelum query ke DB
  if (isNaN(Number(id))) {
    nextRedirect("/wakilkesiswaan/inputnilai");
  }

  // 1. Ambil Data Murid berdasarkan ID Murid dari URL params
  const muridRes = await sql`
    SELECT id, nama, nisn, kelas, rombel, status 
    FROM murid 
    WHERE id = ${Number(id)}
  `;
  const murid = muridRes.rows[0];

  if (!murid) notFound();
  const nipGuru = session.user.username;

  // 2. Ambil Mapel Guru yang sedang login berdasarkan NIP
  const guruRes = await sql`SELECT mapel FROM guru WHERE nip = ${nipGuru}`;
  const guruData = guruRes.rows[0];
  const mapelGuru = guruData?.mapel || "";

  // 3. Ambil data nilai lama jika sudah pernah diinput sebelumnya
  const nilaiRes = await sql`
    SELECT * FROM nilai 
    WHERE murid_id = ${Number(id)} 
    AND guru_id = ${nipGuru} 
    AND mapel = ${mapelGuru} 
    AND semester = ${semesterPilihan}
  `;
  const dataLama = nilaiRes.rows[0]; // Jika tidak ada, otomatis undefined (Mode Tambah Nilai)
  const tahunSekarang = await getTahunAjaranDinamis();

  // Cegah input nilai jika murid sudah dinyatakan Lulus atau Naik Kelas
  if (murid.status === "Lulus" || murid.status === "Naik Kelas") {
    nextRedirect("/wakilkesiswaan/inputnilai");
  }

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto space-y-8">
      <FormInputNilai 
        muridId={murid.id} 
        guruId={nipGuru} 
        mapelDefault={mapelGuru}
        semesterDefault={semesterPilihan}
        dataLama={dataLama} // Dikirim ke komponen form untuk membedakan Mode Tambah / Edit
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