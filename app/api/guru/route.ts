import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";

// 1. GET: Ambil data untuk GuruTable
export async function GET() {
  try {
    const result = await sql`
      SELECT * FROM guru 
      ORDER BY nama ASC
    `;
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Database Error:", error);
    return NextResponse.json({ error: "Gagal mengambil data guru" }, { status: 500 });
  }
}

// 2. POST: Hanya isi data di table guru (Tugas Tata Usaha)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      nama, nip, nik, nuptk, gender, tgl_lahir, 
      status, jenis, mapel, sekolah_induk 
    } = body;

    await sql`
      INSERT INTO guru (
        nama, nip, nik, nuptk, gender, tgl_lahir, 
        status, jenis, mapel, sekolah_induk
      ) VALUES (
        ${nama}, ${nip}, ${nik}, ${nuptk}, ${gender}, ${tgl_lahir}, 
        ${status}, ${jenis}, ${mapel}, ${sekolah_induk}
      )
    `;

    return NextResponse.json({ 
      success: true, 
      message: "Data fisik guru berhasil ditambahkan" 
    }, { status: 201 });

  } catch (error: any) {
    console.error("Insert Error:", error);
    if (error.code === '23505') {
      return NextResponse.json({ error: "NIP sudah terdaftar" }, { status: 400 });
    }
    return NextResponse.json({ error: "Gagal menyimpan data" }, { status: 500 });
  }
}

// 3. DELETE: Hapus Data Fisik + Hapus Akun User (Sync)
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "ID tidak ditemukan" }, { status: 400 });

    // Langkah A: Ambil NIP guru sebagai referensi username di tabel users
    const guruRes = await sql`SELECT nip FROM guru WHERE id = ${id}`;
    const guru = guruRes.rows[0];

    if (guru) {
      // Gunakan Transaction agar penghapusan sinkron
      await sql`BEGIN`;
      
      // Langkah B: Hapus akun di tabel users yang usernamenya adalah NIP guru tersebut
      await sql`DELETE FROM users WHERE username = ${guru.nip}`;
      
      // Langkah C: Hapus data di tabel guru
      await sql`DELETE FROM guru WHERE id = ${id}`;
      
      await sql`COMMIT`;
    }

    return NextResponse.json({ 
      success: true, 
      message: "Data guru dan akun login terkait berhasil dibersihkan" 
    });
  } catch (error) {
    await sql`ROLLBACK`;
    console.error("Delete Error:", error);
    return NextResponse.json({ error: "Gagal menghapus data secara menyeluruh" }, { status: 500 });
  }
}