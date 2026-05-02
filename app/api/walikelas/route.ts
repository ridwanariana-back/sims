import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const result = await sql`
      SELECT wk.id, g.nama as nama_guru, g.nip, wk.rombel, wk.tahun_ajaran, wk.guru_id
      FROM wali_kelas wk
      JOIN guru g ON wk.guru_id = g.id
      ORDER BY wk.tahun_ajaran DESC, wk.rombel ASC
    `;
    return NextResponse.json(result.rows);
  } catch (error) {
    return NextResponse.json({ error: "Gagal mengambil data" }, { status: 500 });
  }
}

// ... POST, PUT, DELETE tetap sama seperti sebelumnya
export async function POST(request: Request) {
  try {
    const { guru_id, rombel, tahun_ajaran } = await request.json();
    await sql`INSERT INTO wali_kelas (guru_id, rombel, tahun_ajaran) VALUES (${guru_id}, ${rombel}, ${tahun_ajaran})`;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.code === '23505') return NextResponse.json({ error: "Sudah terdaftar di periode ini!" }, { status: 400 });
    return NextResponse.json({ error: "Gagal menyimpan" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { id, guru_id, rombel, tahun_ajaran } = await request.json();
    await sql`UPDATE wali_kelas SET guru_id = ${guru_id}, rombel = ${rombel}, tahun_ajaran = ${tahun_ajaran} WHERE id = ${id}`;
    return NextResponse.json({ success: true });
  } catch (error) { return NextResponse.json({ error: "Gagal update" }, { status: 500 }); }
}

export async function DELETE(request: Request) {
  try {
    const id = new URL(request.url).searchParams.get("id");
    await sql`DELETE FROM wali_kelas WHERE id = ${id}`;
    return NextResponse.json({ success: true });
  } catch (error) { return NextResponse.json({ error: "Gagal hapus" }, { status: 500 }); }
}