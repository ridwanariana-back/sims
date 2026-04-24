import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, murid_id, guru_id, mapel, semester, tahun_ajaran, nilai_angka, keterangan } = body;

    if (id) {
      // MODE UPDATE
      await sql`
        UPDATE nilai SET 
          nilai_angka = ${nilai_angka}, 
          tahun_ajaran = ${tahun_ajaran}, 
          keterangan = ${keterangan}
        WHERE id = ${id}
      `;
    } else {
      // MODE INSERT
      await sql`
        INSERT INTO nilai (murid_id, guru_id, mapel, semester, tahun_ajaran, nilai_angka, keterangan)
        VALUES (${murid_id}, ${guru_id}, ${mapel}, ${semester}, ${tahun_ajaran}, ${nilai_angka}, ${keterangan})
      `;
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Gagal memproses data" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    await sql`DELETE FROM nilai WHERE id = ${id}`;
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Gagal menghapus" }, { status: 500 });
  }
}