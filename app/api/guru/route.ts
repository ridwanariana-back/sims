// app/api/guru/route.ts

import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";
import { auth } from "@/auth";

// 1. GET: Ambil data untuk GuruTable (Hanya milik sekolah yang sedang login) + Join Nama Mapel (Format Array)
export async function GET() {
  try {
    const session = await auth();
    const sId = session?.user?.sekolah_id || (session?.user as any)?.sekolahId;

    if (!session || !sId) {
      return NextResponse.json({ error: "Tidak ada otoritas / Sesi habis" }, { status: 401 });
    }

    const sekolahIdInt = parseInt(sId.toString());

    // 💡 PENYESUAIAN: Menggunakan subquery ANY untuk mencocokkan ID di dalam array
    // m.id = ANY(g.mapel) artinya mencari semua id mapel yang ada di dalam list array guru.mapel
    // string_agg digunakan untuk menyatukan nama mapel menjadi satu string dipisahkan oleh koma (contoh: "Matematika, Fisika")
    const result = await sql`
      SELECT 
        g.*, 
        (
          SELECT string_agg(m.nama_mapel, ', ') 
          FROM mapel m 
          WHERE m.id = ANY(g.mapel)
        ) AS nama_mapel_asli
      FROM guru g
      WHERE g.sekolah_id = ${sekolahIdInt}
      ORDER BY g.nama ASC
    `;
    
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Database Error:", error);
    return NextResponse.json({ error: "Gagal mengambil data guru" }, { status: 500 });
  }
}

// 2. POST: Mengisi data di table guru
export async function POST(request: Request) {
  try {
    const session = await auth();
    const sId = session?.user?.sekolah_id || (session?.user as any)?.sekolahId;

    if (!session || !sId) {
      return NextResponse.json({ error: "Tidak ada otoritas / Sesi habis" }, { status: 401 });
    }

    const sekolahIdInt = parseInt(sId.toString());
    const body = await request.json();
    // Ambil variabel mapel dari body request
const { 
  nama, nip, nik, nuptk, gender, tgl_lahir, 
  status, jenis, mapel, sekolah_induk 
} = body;

// 💡 VALIDASI: Jika mapel kosong/null/tidak diisi, buat jadi string array kosong '{}'
const pgArrayMapel = Array.isArray(mapel) && mapel.length > 0 
  ? `{${mapel.join(',')}}` 
  : '{}';

await sql`
  INSERT INTO guru (
    sekolah_id, nama, nip, nik, nuptk, gender, tgl_lahir, 
    status, jenis, mapel, sekolah_induk
  ) VALUES (
    ${sekolahIdInt}, ${nama}, ${nip}, ${nik}, ${nuptk}, ${gender}, ${tgl_lahir}, 
    ${status}, ${jenis}, ${pgArrayMapel}, ${sekolah_induk}
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

// 3. DELETE: Hapus Data Fisik + Hapus Akun User (Sync & Terkunci sekolah_id)
export async function DELETE(request: Request) {
  try {
    const session = await auth();
    const sId = session?.user?.sekolah_id || (session?.user as any)?.sekolahId;

    if (!session || !sId) {
      return NextResponse.json({ error: "Tidak ada otoritas / Sesi habis" }, { status: 401 });
    }

    const sekolahIdInt = parseInt(sId.toString());
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "ID tidak ditemukan" }, { status: 400 });

    // Langkah A: Ambil NIP guru sebagai referensi username, pastikan datanya MEMANG milik sekolah terkait
    const guruRes = await sql`
      SELECT nip FROM guru 
      WHERE id = ${id} AND sekolah_id = ${sekolahIdInt}
    `;
    const guru = guruRes.rows[0];

    if (!guru) {
      return NextResponse.json({ error: "Data guru tidak ditemukan atau bukan hak akses sekolah ini" }, { status: 404 });
    }

    // Jalankan Transaction agar proses hapus bersih berantai tidak terputus di tengah jalan
    await sql`BEGIN`;
    
    // Langkah B: Hapus akun di tabel users yang usernamenya adalah NIP guru tersebut DAN terikat sekolah yang sama
    await sql`DELETE FROM users WHERE username = ${guru.nip} AND sekolah_id = ${sekolahIdInt}`;
    
    // Langkah C: Hapus relasi anak tabel guru lainnya jika sewaktu-waktu dibutuhkan (opsional/antisipasi error foreign key)
    await sql`DELETE FROM wali_kelas WHERE guru_id = ${id}`;
    
    // Langkah D: Hapus data utama di tabel guru
    await sql`DELETE FROM guru WHERE id = ${id} AND sekolah_id = ${sekolahIdInt}`;
    
    await sql`COMMIT`;

    return NextResponse.json({ 
      success: true, 
      message: "Data guru dan akun login terkait berhasil dibersihkan dari sekolah ini" 
    });
  } catch (error) {
    // Jika ada yang gagal di tengah jalan, kembalikan data ke kondisi semula
    await sql`ROLLBACK`;
    console.error("Delete Error:", error);
    return NextResponse.json({ error: "Gagal menghapus data secara menyeluruh" }, { status: 500 });
  }
}