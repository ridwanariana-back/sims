import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      nama, nisn, nik, gender, tgl_lahir, 
      nama_ibu, kelas, rombel 
    } = body;

    // Nama kolom disesuaikan dengan update Neon kamu (gender & tanggal_lahir)
    await sql`
      INSERT INTO murid (
        nama, nisn, nik, gender, tanggal_lahir, 
        nama_ibu, kelas, rombel, status
      ) VALUES (
        ${nama}, ${nisn}, ${nik}, ${gender}, ${tgl_lahir}, 
        ${nama_ibu}, ${kelas}, ${rombel}, 'aktif'
      )
    `;

    return NextResponse.json({ success: true, message: "Data murid berhasil disimpan" }, { status: 201 });
  } catch (error: any) {
    console.error("Insert Error:", error);
    if (error.code === '23505') {
      return NextResponse.json({ error: "NISN sudah ada!" }, { status: 400 });
    }
    return NextResponse.json({ error: "Gagal menyimpan ke database" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, nama, nisn, nik, gender, tanggal_lahir, nama_ibu, kelas, rombel } = body;

    await sql`
      UPDATE murid SET 
        nama = ${nama}, 
        nisn = ${nisn}, 
        nik = ${nik}, 
        gender = ${gender}, 
        tanggal_lahir = ${tanggal_lahir}, 
        nama_ibu = ${nama_ibu}, 
        kelas = ${kelas}, 
        rombel = ${rombel}
      WHERE id = ${id}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Gagal update data" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    // Mengambil ID dari URL parameter (?id=...)
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: "ID tidak ditemukan" }, { status: 400 });
    }

    // Eksekusi hapus di database Neon
    await sql`DELETE FROM murid WHERE id = ${id}`;

    return NextResponse.json({ success: true, message: "Data murid berhasil dihapus" });
  } catch (error: any) {
    console.error("Delete Error:", error);
    return NextResponse.json({ error: "Gagal menghapus data dari database" }, { status: 500 });
  }
}