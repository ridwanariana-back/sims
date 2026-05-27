// app/api/murid/route.ts
import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";
import { auth } from "@/auth";

export async function POST(request: Request) {
  try {
    const session = await auth();
    const sId = session?.user?.sekolah_id || (session?.user as any)?.sekolahId;

    if (!session || !sId) {
      return NextResponse.json({ error: "Sesi kadaluarsa / Tidak sah" }, { status: 401 });
    }

    const sekolahIdInt = parseInt(sId.toString());
    const body = await request.json();
    const { 
      nama, nisn, nik, gender, tgl_lahir, 
      nama_ibu, kelas, rombel 
    } = body;

    await sql`
      INSERT INTO murid (
        sekolah_id, nama, nisn, nik, gender, tanggal_lahir, 
        nama_ibu, kelas, rombel, status
      ) VALUES (
        ${sekolahIdInt}, ${nama}, ${nisn}, ${nik}, ${gender}, ${tgl_lahir}, 
        ${nama_ibu}, ${kelas}, ${rombel}, 'aktif'
      )
    `;

    return NextResponse.json({ success: true, message: "Data murid berhasil disimpan" }, { status: 201 });
  } catch (error: any) {
    console.error("Insert Error:", error);
    if (error.code === '23505') {
      return NextResponse.json({ error: "NISN sudah terdaftar di sekolah ini!" }, { status: 400 });
    }
    return NextResponse.json({ error: "Gagal menyimpan ke database" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth();
    const sId = session?.user?.sekolah_id || (session?.user as any)?.sekolahId;

    if (!session || !sId) {
      return NextResponse.json({ error: "Sesi tidak sah" }, { status: 401 });
    }

    const sekolahIdInt = parseInt(sId.toString());
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
      WHERE id = ${id} AND sekolah_id = ${sekolahIdInt}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Gagal update data" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth();
    const sId = session?.user?.sekolah_id || (session?.user as any)?.sekolahId;

    if (!session || !sId) {
      return NextResponse.json({ error: "Sesi tidak sah" }, { status: 401 });
    }

    const sekolahIdInt = parseInt(sId.toString());
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: "ID tidak ditemukan" }, { status: 400 });
    }
    await sql`DELETE FROM alumni WHERE murid_id = ${id} AND sekolah_id = ${sekolahIdInt}`;
    await sql`DELETE FROM catatan_kedisiplinan WHERE murid_id = ${id} AND sekolah_id = ${sekolahIdInt}`;
    await sql`DELETE FROM history_perwalian WHERE murid_id = ${id} AND sekolah_id = ${sekolahIdInt}`;
    await sql`DELETE FROM kehadiran WHERE murid_id = ${id} AND sekolah_id = ${sekolahIdInt}`;
    await sql`DELETE FROM nilai WHERE murid_id = ${id} AND sekolah_id = ${sekolahIdInt}`;
    await sql`DELETE FROM prestasi WHERE pemilik_id = ${id} AND sekolah_id = ${sekolahIdInt}`;
    
    await sql`DELETE FROM murid WHERE id = ${id} AND sekolah_id = ${sekolahIdInt}`;

    return NextResponse.json({ success: true, message: "Data murid berhasil dihapus" });
  } catch (error: any) {
    console.error("Delete Error:", error);
    return NextResponse.json({ error: "Gagal menghapus data dari database" }, { status: 500 });
  }
}