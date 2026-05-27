// app/api/walikelas/route.ts
import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";
import { auth } from "@/auth";

export async function GET() {
  try {
    const session = await auth();
    const sId = session?.user?.sekolah_id;
    if (!sId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const result = await sql`
      SELECT wk.id, g.nama as nama_guru, g.nip, wk.rombel, wk.tahun_ajaran, wk.guru_id
      FROM wali_kelas wk
      JOIN guru g ON wk.guru_id = g.id
      WHERE wk.sekolah_id = ${sId}
      ORDER BY wk.tahun_ajaran DESC, wk.rombel ASC
    `;
    return NextResponse.json(result.rows);
  } catch (error) {
    return NextResponse.json({ error: "Gagal mengambil data" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { guru_id, rombel, tahun_ajaran, sekolahId } = await request.json();
    
    if (!sekolahId) {
      return NextResponse.json({ error: "ID Sekolah tidak valid" }, { status: 400 });
    }

    // Masukkan sekolah_id ke Query INSERT
    await sql`
      INSERT INTO wali_kelas (guru_id, rombel, tahun_ajaran, sekolah_id) 
      VALUES (${guru_id}, ${rombel}, ${tahun_ajaran}, ${sekolahId})
    `;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    // Menangkap error jika melanggar unique constraint gabungan (sekolah_id, rombel, tahun_ajaran)
    if (error.code === '23505') return NextResponse.json({ error: "Rombel atau Guru sudah terdaftar di periode sekolah ini!" }, { status: 400 });
    return NextResponse.json({ error: "Gagal menyimpan data wali kelas." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { id, guru_id, rombel, tahun_ajaran, sekolahId } = await request.json();
    
    // Pastikan update terkunci pada sekolah_id yang sesuai
    await sql`
      UPDATE wali_kelas 
      SET guru_id = ${guru_id}, rombel = ${rombel}, tahun_ajaran = ${tahun_ajaran} 
      WHERE id = ${id} AND sekolah_id = ${sekolahId}
    `;
    return NextResponse.json({ success: true });
  } catch (error) { 
    return NextResponse.json({ error: "Gagal mengupdate data wali kelas" }, { status: 500 }); 
  }
}

export async function DELETE(request: Request) {
  try {
    const id = new URL(request.url).searchParams.get("id");
    
    // ID bersifat pkey unik tunggal, aman langsung didelete
    await sql`DELETE FROM wali_kelas WHERE id = ${id}`;
    return NextResponse.json({ success: true });
  } catch (error) { 
    return NextResponse.json({ error: "Gagal menghapus wali kelas" }, { status: 500 }); 
  }
}