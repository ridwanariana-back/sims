// app/kepalasekolah/inputnilai/[id]/page.tsx
import { auth } from "@/auth";
import { sql } from "@vercel/postgres";
import { notFound, redirect as nextRedirect } from "next/navigation";
import FormInputNilai from "@/components/FormInputNilaiKS";
import { getTahunAjaranDinamis } from "@/lib/actions";

export default async function HalamanFormNilai({ 
  params,
  searchParams
}: { 
  params: Promise<{ id: string }>,
  searchParams: Promise<{ s?: string; mapel?: string }> // 🔥 Tambahkan mapel di sini
}) {
  const session = await auth();
  
  if (!session?.user || session.user.role?.toLowerCase() !== "kepalasekolah") {
    nextRedirect("/");
  }

  const { id } = await params;
  const { s, mapel } = await searchParams; // 🔥 Ambil nilai mapel dari URL query string
  const semesterPilihan = s || "Ganjil";

  if (isNaN(Number(id))) {
    nextRedirect("/kepalasekolah/inputnilai");
  }

  const sId = session.user.sekolah_id || (session.user as any).sekolahId;
  const sekolahIdInt = sId ? parseInt(sId.toString(), 10) : null;
  const userIdFromSession = session.user.id; 

  if (!sekolahIdInt || !userIdFromSession) {
    nextRedirect("/kepalasekolah/inputnilai");
  }

  const guruRes = await sql`
    SELECT g.id, g.mapel 
    FROM users u
    INNER JOIN guru g ON u.guru_id = g.id
    WHERE u.id = ${userIdFromSession}
  `;
  const guruData = guruRes.rows[0];

  if (!guruData) {
    nextRedirect("/kepalasekolah/inputnilai");
  }

  const guruIdInt = guruData.id; 

  // 🔥 JIKA parameter mapel ada di URL, pakai itu. Jika tidak ada, baru fallback ke default guruData.mapel
  const mapelPilihanId = mapel || guruData.mapel || ""; 

  // 💡 AMBIL NAMA MAPEL ASLI DARI TABEL MAPEL BERDASARKAN ID YANG DIPILIH SECARA DINAMIS
  let namaMapelTxt = "Mata Pelajaran";
  if (mapelPilihanId) {
    const mapelNameRes = await sql`SELECT nama_mapel FROM mapel WHERE id = ${parseInt(mapelPilihanId.toString(), 10)}`;
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

  // 🔥 Cari nilai berdasarkan mapelPilihanId yang dinamis, bukan mapel default guru lagi
  const nilaiRes = await sql`
    SELECT * FROM nilai 
    WHERE murid_id = ${Number(id)} 
      AND guru_id = ${guruIdInt} 
      AND mapel = ${mapelPilihanId.toString()} 
      AND semester = ${semesterPilihan}
      AND sekolah_id = ${sekolahIdInt}
  `;
  const dataLama = nilaiRes.rows[0]; 
  const tahunSekarang = await getTahunAjaranDinamis();

  if (murid.status === "Lulus" || murid.status === "Naik Kelas") {
    nextRedirect("/kepalasekolah/inputnilai");
  }

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto space-y-8 text-left">
      <FormInputNilai 
        muridId={murid.id} 
        guruId={guruIdInt}         
        sekolahId={sekolahIdInt}   
        mapelDefault={mapelPilihanId.toString()} // 🔥 Kirim ID Mapel pilihan yang dinamis ke Form
        namaMapelTxt={namaMapelTxt}  
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