import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    // Ambil data tambahan: nilai_harian, nilai_mid, dan nilai_uas
    const { 
      id, 
      murid_id, 
      guru_id, 
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
      // MODE UPDATE: Perbarui semua komponen nilai
      await sql`
        UPDATE nilai SET 
          nilai_harian = ${nilai_harian},
          nilai_mid = ${nilai_mid},
          nilai_uas = ${nilai_uas},
          nilai_angka = ${nilai_angka}, 
          tahun_ajaran = ${tahun_ajaran}, 
          keterangan = ${keterangan}
        WHERE id = ${id}
      `;
    } else {
      // MODE INSERT: Masukkan data baru beserta rinciannya
      await sql`
        INSERT INTO nilai (
          murid_id, 
          guru_id, 
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

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    
    if (!id) {
        return NextResponse.json({ error: "ID tidak ditemukan" }, { status: 400 });
    }

    await sql`DELETE FROM nilai WHERE id = ${id}`;
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Gagal menghapus" }, { status: 500 });
  }
}