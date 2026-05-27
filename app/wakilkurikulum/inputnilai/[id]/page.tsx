import { auth } from "@/auth";
import { sql } from "@vercel/postgres";
import { notFound, redirect as nextRedirect } from "next/navigation";
import FormInputNilai from "@/components/FormInputNilaiWKR";
import { getTahunAjaranDinamis } from "@/lib/actions";

export default async function HalamanFormNilai({ 
  params,
  searchParams
}: { 
  params: Promise<{ id: string }>,
  searchParams: Promise<{ s?: string }>
}) {
  const session = await auth();
  
  if (!session?.user || session.user.role?.toLowerCase() !== "wakilkurikulum") {
    nextRedirect("/");
  }

  const { id } = await params;
  const { s } = await searchParams;
  const semesterPilihan = s || "Ganjil";

  if (isNaN(Number(id))) {
    nextRedirect("/wakilkurikulum/inputnilai");
  }

  const sId = session.user.sekolah_id || (session.user as any).sekolahId;
  const sekolahIdInt = sId ? parseInt(sId.toString(), 10) : null;
  const userIdFromSession = session.user.id; 

  if (!sekolahIdInt || !userIdFromSession) {
    nextRedirect("/wakilkurikulum/inputnilai");
  }

  const guruRes = await sql`
    SELECT g.id, g.mapel 
    FROM users u
    INNER JOIN guru g ON u.guru_id = g.id
    WHERE u.id = ${userIdFromSession}
  `;
  const guruData = guruRes.rows[0];

  if (!guruData) {
    nextRedirect("/wakilkurikulum/inputnilai");
  }

  const guruIdInt = guruData.id; 
  const mapelGuru = guruData.mapel || ""; // 💡 Ini berisi ID Mapel (misal: "12")

  // 💡 AMBIL NAMA MAPEL ASLI DARI TABEL MAPEL BERDASARKAN ID
  let namaMapelTxt = "Mata Pelajaran";
  if (mapelGuru) {
    const mapelNameRes = await sql`SELECT nama_mapel FROM mapel WHERE id = ${parseInt(mapelGuru.toString(), 10)}`;
    if (mapelNameRes.rows.length > 0) {
      namaMapelTxt = mapelNameRes.rows[0].nama_mapel;
    }
  }

  const muridRes = await sql`
    SELECT id, nama, nisn, kelas, rombel, status 
    FROM murid 
    WHERE id = ${Number(id)} AND sekolah_id = ${sekolahIdInt}
  `;
  const murid = muridRes.rows[0];

  if (!murid) notFound();

  const nilaiRes = await sql`
    SELECT * FROM nilai 
    WHERE murid_id = ${Number(id)} 
      AND guru_id = ${guruIdInt} 
      AND mapel = ${mapelGuru} 
      AND semester = ${semesterPilihan}
      AND sekolah_id = ${sekolahIdInt}
  `;
  const dataLama = nilaiRes.rows[0]; 
  const tahunSekarang = await getTahunAjaranDinamis();

  if (murid.status === "Lulus" || murid.status === "Naik Kelas") {
    nextRedirect("/wakilkurikulum/inputnilai");
  }

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto space-y-8 text-left">
      <FormInputNilai 
        muridId={murid.id} 
        guruId={guruIdInt}         
        sekolahId={sekolahIdInt}   
        mapelDefault={mapelGuru}      // 💡 Tetap ID Mapel untuk kebutuhan payload simpan data
        namaMapelTxt={namaMapelTxt}  // 💡 Oper Nama Mapel teks asli ke Client Component
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