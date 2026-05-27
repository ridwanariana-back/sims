// app/api/nilai/route.ts
import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      id, 
      murid_id, 
      guru_id, 
      sekolah_id, // 💡 Ambil sekolah_id dari payload request
      mapel, 
      semester, 
      tahun_ajaran, 
      nilai_harian, 
      nilai_mid, 
      nilai_uas, 
      nilai_angka, 
      keterangan 
    } = body;

    if (id) {
      // MODE UPDATE: Kunci juga dengan sekolah_id demi proteksi ekstra
      await sql`
        UPDATE nilai SET 
          nilai_harian = ${nilai_harian},
          nilai_mid = ${nilai_mid},
          nilai_uas = ${nilai_uas},
          nilai_angka = ${nilai_angka}, 
          tahun_ajaran = ${tahun_ajaran}, 
          keterangan = ${keterangan}
        WHERE id = ${id} AND sekolah_id = ${sekolah_id}
      `;
    } else {
      // MODE INSERT: Sertakan kolom sekolah_id
      await sql`
        INSERT INTO nilai (
          murid_id, 
          guru_id, 
          sekolah_id, -- 💡 Masukkan ke DB
          mapel, 
          semester, 
          tahun_ajaran, 
          nilai_harian, 
          nilai_mid, 
          nilai_uas, 
          nilai_angka, 
          keterangan
        )
        VALUES (
          ${murid_id}, 
          ${guru_id}, 
          ${sekolah_id}, -- 💡 Berikan value-nya
          ${mapel}, 
          ${semester}, 
          ${tahun_ajaran}, 
          ${nilai_harian}, 
          ${nilai_mid}, 
          ${nilai_uas}, 
          ${nilai_angka}, 
          ${keterangan}
        )
      `;
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Database Error:", error);
    return NextResponse.json({ error: "Gagal memproses data" }, { status: 500 });
  }
}