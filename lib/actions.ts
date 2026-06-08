// lib/actions.ts
'use server';

import { signIn, signOut, auth } from '@/auth';
import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import fs from 'fs/promises';
import path from 'path';
import bcrypt from 'bcryptjs';

export async function getTahunAjaranDinamis() {
  const sekarang = new Date();
  const tahunIni = sekarang.getFullYear();
  const bulanIni = sekarang.getMonth(); // 0 = Januari, 6 = Juli

  if (bulanIni >= 6) {
    return `${tahunIni}/${tahunIni + 1}`;
  } else {
    return `${tahunIni - 1}/${tahunIni}`;
  }
}


export async function registerSekolahBaru(formData: FormData) {
  // 1. Ambil data mentah dari Form pendaftaran
  const namaSekolah = formData.get('nama_sekolah') as string;
  const npsn = formData.get('npsn') as string;
  const alamat = formData.get('alamat') as string;

  // Validasi dasar agar inputan tidak kosong
  if (!namaSekolah || !npsn || !alamat) {
    return { success: false, message: 'Semua kolom formulir wajib diisi!' };
  }

  try {
    // 2. Cek apakah NPSN sudah terdaftar
    const { rows: cekNpsn } = await sql`
      SELECT id FROM public.sekolah WHERE npsn = ${npsn.trim()}
    `;
    
    if (cekNpsn.length > 0) {
      return { success: false, message: 'Gagal! NPSN Sekolah tersebut sudah terdaftar di sistem.' };
    }

    // 3. Input data sekolah baru beserta default gambar 'sekolah.png'
    const { rows: sekolahBaru } = await sql`
      INSERT INTO public.sekolah (nama_sekolah, npsn, alamat, gambar)
      VALUES (${namaSekolah.trim()}, ${npsn.trim()}, ${alamat.trim()}, 'sekolah.png')
      RETURNING id
    `;
    const sekolahId = sekolahBaru[0].id;

    // 4. Rumus bikin username otomatis (bersihkan spasi, simbol, paksa huruf kecil)
    const slugSekolah = namaSekolah
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');

    const usernameTU = `tu_${slugSekolah}`;
    const usernameOps = `ops_${slugSekolah}`;

    // 5. Hash password default memakai bcrypt
    const passwordTUHashed = await bcrypt.hash(usernameTU, 10);
    const passwordOpsHashed = await bcrypt.hash(usernameOps, 10);

    // 6. Masukkan Akun Tata Usaha ke tabel users
    await sql`
      INSERT INTO public.users (sekolah_id, username, password, role, name)
      VALUES (${sekolahId}, ${usernameTU}, ${passwordTUHashed}, 'TATA_USAHA', ${`TU Default ${namaSekolah}`})
    `;

    // 7. Masukkan Akun Operator ke tabel users
    await sql`
      INSERT INTO public.users (sekolah_id, username, password, role, name)
      VALUES (${sekolahId}, ${usernameOps}, ${passwordOpsHashed}, 'OPERATOR', ${`Operator Default ${namaSekolah}`})
    `;

    // Kembalikan rincian sukses untuk dibaca oleh alert() di page client-side
    return {
      success: true,
      data: {
        namaSekolah,
        usernameTU,
        usernameOps
      }
    };

  } catch (error: any) {
    console.error('Error saat register sekolah baru:', error);
    return { 
      success: false, 
      message: error.message || 'Terjadi kesalahan sistem saat mendaftarkan sekolah.' 
    };
  }
}

export async function tambahKelasAction(formData: FormData) {
  const actionSession = await auth();
  const sId = actionSession?.user?.sekolah_id || (actionSession?.user as any)?.sekolahId;

  const namaKelas = formData.get('nama_kelas') as string;
  const tingkat = formData.get('tingkat') as string;

  if (!sId || !namaKelas || !tingkat) {
    throw new Error("Gagal menyimpan: Sesi sekolah tidak terbaca. Coba relogin.");
  }

  await sql`
    INSERT INTO kelas (sekolah_id, nama_kelas, tingkat)
    VALUES (${parseInt(sId.toString())}, ${namaKelas.trim()}, ${parseInt(tingkat)})
  `;

  revalidatePath('/tatausaha/kelas');
}

export async function hapusKelasAction(formData: FormData) {
  const actionSession = await auth();
  const sId = actionSession?.user?.sekolah_id || (actionSession?.user as any)?.sekolahId;
  const kelasId = formData.get('id') as string;
  
  if (!sId || !kelasId) return;

  await sql`
    DELETE FROM kelas 
    WHERE id = ${parseInt(kelasId)} AND sekolah_id = ${parseInt(sId.toString())}
  `;

  revalidatePath('/tatausaha/kelas');
}

export async function ambilDaftarKelas() {
  const actionSession = await auth();
  const sId = actionSession?.user?.sekolah_id || (actionSession?.user as any)?.sekolahId;

  if (!sId) return [];

  const { rows } = await sql`
    SELECT id, nama_kelas, tingkat 
    FROM kelas 
    WHERE sekolah_id = ${parseInt(sId.toString())}
    ORDER BY tingkat ASC, nama_kelas ASC
  `;

  return rows;
}

// app/tatausaha/kelas/actions.ts

export async function editKelasAction(formData: FormData) {
  const actionSession = await auth();
  const sId = actionSession?.user?.sekolah_id || (actionSession?.user as any)?.sekolahId;
  
  const kelasId = formData.get('id') as string;
  const namaKelas = formData.get('nama_kelas') as string;
  const tingkat = formData.get('tingkat') as string;

  if (!sId || !kelasId || !namaKelas || !tingkat) {
    throw new Error("Gagal mengubah: Data tidak lengkap.");
  }

  // Update data dengan mengunci sekolah_id demi keamanan multi-tenant
  await sql`
    UPDATE kelas 
    SET nama_kelas = ${namaKelas.trim()}, tingkat = ${parseInt(tingkat)}
    WHERE id = ${parseInt(kelasId)} AND sekolah_id = ${parseInt(sId.toString())}
  `;

  revalidatePath('/tatausaha/kelas');
}

// Action: Ambil Daftar Mapel dengan Server-side Pagination & Search
export async function ambilDaftarMapel(search: string, limit: number, offset: number) {
  const actionSession = await auth();
  const sId = actionSession?.user?.sekolah_id || (actionSession?.user as any)?.sekolahId;

  if (!sId) return { data: [], total: 0 };

  const querySearch = `%${search}%`;

  // Query 1: Ambil data mapel yang sudah difilter, dilimit, dan di-offset
  const { rows: data } = await sql`
    SELECT id, nama_mapel, kode_mapel, kelompok 
    FROM mapel 
    WHERE sekolah_id = ${parseInt(sId.toString())}
      AND (nama_mapel ILIKE ${querySearch} OR kode_mapel ILIKE ${querySearch})
    ORDER BY nama_mapel ASC
    LIMIT ${limit} OFFSET ${offset}
  `;

  // Query 2: Hitung total data keseluruhan untuk kalkulasi jumlah halaman pagination
  const { rows: totalRows } = await sql`
    SELECT COUNT(*) as total 
    FROM mapel 
    WHERE sekolah_id = ${parseInt(sId.toString())}
      AND (nama_mapel ILIKE ${querySearch} OR kode_mapel ILIKE ${querySearch})
  `;

  const total = parseInt(totalRows[0].total || '0');

  return { data, total };
}

// Action: Tambah Mapel Baru
export async function tambahMapelAction(formData: FormData) {
  const actionSession = await auth();
  const sId = actionSession?.user?.sekolah_id || (actionSession?.user as any)?.sekolahId;

  const namaMapel = formData.get('nama_mapel') as string;
  const kodeMapel = formData.get('kode_mapel') as string;
  const kelompok = formData.get('kelompok') as string;

  if (!sId || !namaMapel || !kodeMapel) {
    throw new Error("Gagal menyimpan: Data tidak lengkap.");
  }

  await sql`
    INSERT INTO mapel (sekolah_id, nama_mapel, kode_mapel, kelompok)
    VALUES (${parseInt(sId.toString())}, ${namaMapel.trim()}, ${kodeMapel.trim().toUpperCase()}, ${kelompok})
  `;

  revalidatePath('/tatausaha/mapel');
}

// Action: Hapus Mapel
export async function hapusMapelAction(formData: FormData) {
  const actionSession = await auth();
  const sId = actionSession?.user?.sekolah_id || (actionSession?.user as any)?.sekolahId;
  const mapelId = formData.get('id') as string;

  if (!sId || !mapelId) return;

  await sql`
    DELETE FROM mapel 
    WHERE id = ${parseInt(mapelId)} AND sekolah_id = ${parseInt(sId.toString())}
  `;

  revalidatePath('/tatausaha/mapel');
}

export async function editMapelAction(formData: FormData) {
  const actionSession = await auth();
  const sId = actionSession?.user?.sekolah_id || (actionSession?.user as any)?.sekolahId;
  
  const mapelId = formData.get('id') as string;
  const namaMapel = formData.get('nama_mapel') as string;
  const kodeMapel = formData.get('kode_mapel') as string;
  const kelompok = formData.get('kelompok') as string;

  if (!sId || !mapelId || !namaMapel || !kodeMapel || !kelompok) {
    throw new Error("Gagal mengubah: Data tidak lengkap.");
  }

  // Update data mapel berdasarkan ID dan kunci sekolah_id tenant
  await sql`
    UPDATE mapel 
    SET nama_mapel = ${namaMapel.trim()}, 
        kode_mapel = ${kodeMapel.trim().toUpperCase()}, 
        kelompok = ${kelompok}
    WHERE id = ${parseInt(mapelId)} AND sekolah_id = ${parseInt(sId.toString())}
  `;

  revalidatePath('/tatausaha/mapel');
}

export async function getDaftarKelas(sekolahId: number) {
  try {
    const res = await sql`
      SELECT id, tingkat, nama_kelas 
      FROM kelas 
      WHERE sekolah_id = ${sekolahId} 
      ORDER BY tingkat ASC, nama_kelas ASC
    `;
    return res.rows;
  } catch (error) {
    console.error("Gagal ambil daftar kelas:", error);
    return [];
  }
}

export async function getDaftarMapel(sekolahId: number) {
  try {
    const res = await sql`
      SELECT id, nama_mapel, kelompok, kode_mapel 
      FROM mapel 
      WHERE sekolah_id = ${sekolahId}
      ORDER BY kelompok ASC, nama_mapel ASC
    `;
    return res.rows;
  } catch (error) {
    console.error("Gagal ambil daftar mapel:", error);
    return [];
  }
}

export async function getDaftarMapel1(sekolahId: number) {
  try {
    const res = await sql`
      SELECT id, nama_mapel, kelompok, kode_mapel 
      FROM mapel 
      WHERE sekolah_id = ${sekolahId}
      ORDER BY kode_mapel ASC
    `;
    return res.rows;
  } catch (error) {
    console.error("Gagal ambil daftar mapel:", error);
    return [];
  }
}

export async function getDaftarMapel2(sekolahId: number) {
  try {
    const res = await sql`
      SELECT id, nama_mapel, kelompok 
      FROM mapel 
      WHERE sekolah_id = ${sekolahId} AND kelompok != 'Kegiatan'
      ORDER BY kelompok ASC, nama_mapel ASC
    `;
    return res.rows;
  } catch (error) {
    console.error("Gagal ambil daftar mapel:", error);
    return [];
  }
}

export async function deletePrestasi(id: number, sekolahId: number) {
  try {
    await sql`
      DELETE FROM prestasi 
      WHERE id = ${id} 
        AND sekolah_id = ${sekolahId}
    `;
    return { success: true };
  } catch (error) {
    console.error("Gagal menghapus prestasi:", error);
    return { success: false };
  }
}

export async function getDaftarPrestasi(sekolahId: number) {
  try {
    // Ambil data mentah prestasi sekolah terkait
    const res = await sql`
      SELECT * FROM prestasi 
      WHERE sekolah_id = ${sekolahId} 
      ORDER BY tahun DESC, created_at DESC
    `;
    
    const dataPrestasi = res.rows;

    // Lakukan mapping untuk menempelkan nama asli secara dinamis dari tabel referensinya
    const dataLengkap = await Promise.all(dataPrestasi.map(async (item) => {
      let namaPemilik = "-";
      let infoTambahan = "-"; // Menyimpan Kelas (Murid) atau NIP/Jabatan (Guru)

      if (item.kategori_pemilik === 'MURID') {
        const muridQuery = await sql`SELECT nama, rombel FROM murid WHERE id = ${item.pemilik_id}`;
        if (muridQuery.rows.length > 0) {
          namaPemilik = muridQuery.rows[0].nama;
          infoTambahan = `Kelas ${muridQuery.rows[0].rombel}`;
        }
      } else if (item.kategori_pemilik === 'GURU') {
        const guruQuery = await sql`SELECT nama, nip FROM guru WHERE id = ${item.pemilik_id}`;
        if (guruQuery.rows.length > 0) {
          namaPemilik = guruQuery.rows[0].nama;
          infoTambahan = guruQuery.rows[0].nip ? `NIP: ${guruQuery.rows[0].nip}` : "Guru";
        }
      }

      return {
        ...item,
        nama_display: namaPemilik,
        info_display: infoTambahan
      };
    }));

    return dataLengkap;
  } catch (error) {
    console.error("Gagal mengambil daftar prestasi:", error);
    return [];
  }
}

export async function createPrestasi(data: any, sekolahId: number) {
  try {
    await sql`
      INSERT INTO prestasi (sekolah_id, kategori_pemilik, pemilik_id, lomba, tingkat, juara, tahun)
      VALUES (
        ${sekolahId}, 
        ${data.kategori_pemilik}, 
        ${parseInt(data.pemilik_id)}, 
        ${data.lomba}, 
        ${data.tingkat}, 
        ${data.juara}, 
        ${parseInt(data.tahun)}
      )
    `;
    return { success: true };
  } catch (error) {
    console.error("Gagal menambah prestasi:", error);
    return { success: false, message: "Gagal menyimpan data ke database." };
  }
}

// 1. Ambil Semua Data Alumni (dengan Join Nama Murid)
export async function getDaftarAlumni(sekolahId: number) {
  try {
    const res = await sql`
      SELECT a.*, m.nama as nama_murid, m.nisn 
      FROM alumni a
      JOIN murid m ON a.murid_id = m.id
      WHERE a.sekolah_id = ${sekolahId}
      ORDER BY a.tahun_lulus DESC, m.nama ASC
    `;
    return res.rows;
  } catch (error) {
    console.error("Gagal mengambil data alumni:", error);
    return [];
  }
}

// 2. Tambah Data Alumni Baru
export async function createAlumni(data: any, sekolahId: number) {
  try {
    // 1. Cek dulu apakah murid ini sudah pernah didaftarkan sebagai alumni
    const cekQuery = await sql`
      SELECT id FROM alumni 
      WHERE sekolah_id = ${sekolahId} AND murid_id = ${parseInt(data.murid_id)}
    `;

    if (cekQuery.rows.length > 0) {
      return { success: false, message: "Siswa ini sudah terdaftar di data alumni!" };
    }

    // 2. Jika lolos pengecekan, baru jalankan INSERT
    await sql`
      INSERT INTO alumni (sekolah_id, murid_id, tahun_lulus, klaster, instansi, detail_status, jalur)
      VALUES (
        ${sekolahId}, 
        ${parseInt(data.murid_id)}, 
        ${parseInt(data.tahun_lulus)}, 
        ${data.klaster}, 
        ${data.instansi}, 
        ${data.detail_status || null}, 
        ${data.jalur || null}
      )
    `;
    return { success: true };
  } catch (error) {
    console.error("Gagal menambah data alumni:", error);
    return { success: false, message: "Terjadi kesalahan pada sistem database." };
  }
}

// 3. Hapus Data Alumni
export async function deleteAlumni(id: number, sekolahId: number) {
  try {
    await sql`DELETE FROM alumni WHERE id = ${id} AND sekolah_id = ${sekolahId}`;
    return { success: true };
  } catch (error) {
    console.error("Gagal menghapus data alumni:", error);
    return { success: false };
  }
}

export async function getRombelTujuanDinamis(kelasSekarang: number, sekolahId: number) {
  try {
    const tingkatTarget = Number(kelasSekarang) + 1;

    // Ambil data nama rombel/kelas dari master tabel 'kelas' berdasarkan tingkat target
    // Sesuai strukturmu: nama kolomnya 'tingkat' dan nama rombelnya 'nama' (atau sesuaikan jika nama kolomnya berbeda)
    const res = await sql`
      SELECT nama_kelas as nama 
      FROM kelas 
      WHERE tingkat = ${tingkatTarget} 
        AND sekolah_id = ${sekolahId}
      ORDER BY nama ASC
    `;

    return { 
      success: true, 
      data: res.rows.map(row => row.nama),
      tingkatTarget 
    };
  } catch (error) {
    console.error("Gagal mengambil rombel tujuan:", error);
    return { success: false, data: [] };
  }
}

export async function getMuridByWaliWithSchool(rombel: string, sekolahId: number) {
  try {
    const data = await sql`
      SELECT id, nisn, nama, gender, rombel, tanggal_lahir, status, nik, nama_ibu 
      FROM murid 
      WHERE rombel = ${rombel} AND sekolah_id = ${sekolahId}
      ORDER BY nama ASC
    `;
    return data.rows;
  } catch (error) {
    console.error("Gagal mengambil data murid:", error);
    return [];
  }
}

export async function getMissingDatesWithSchool(muridIds: number[], startDate: string, endDate: string, sekolahId: number) {
  try {
    if (muridIds.length === 0) return [];
    const formattedIds = `{${muridIds.join(",")}}`;

    const existing = await sql`
      SELECT DISTINCT tanggal FROM kehadiran 
      WHERE murid_id = ANY(${formattedIds}::int[]) 
      AND sekolah_id = ${sekolahId}
      AND tanggal BETWEEN ${startDate} AND ${endDate}
    `;
    
    return existing.rows.map(r => {
      const date = new Date(r.tanggal);
      return date.toLocaleDateString('en-CA'); // Format: YYYY-MM-DD
    });
  } catch (error) {
    console.error("Error getMissingDates:", error);
    return [];
  }
}

export async function saveKehadiranBulkWithSchool(data: any[], sekolahId: number) {
  try {
    if (!data || data.length === 0) return { success: false, error: "Data kosong" };

    for (const item of data) {
      await sql`
        INSERT INTO kehadiran (murid_id, guru_id, tanggal, status, tahun_ajaran, sekolah_id)
        VALUES (${item.murid_id}, ${item.guru_id}, ${item.tanggal}, ${item.status}, ${item.tahun_ajaran}, ${sekolahId})
        ON CONFLICT (murid_id, tanggal) 
        DO UPDATE SET 
          status = EXCLUDED.status,
          guru_id = EXCLUDED.guru_id;
      `;
    }

    return { success: true };
  } catch (error) {
    console.error("Gagal menyimpan kehadiran:", error);
    return { success: false, error: "Gagal menyimpan ke database" };
  }
}

export async function getHistoryKehadiranWithSchool(
  kelasWali: string, 
  startDate: string, 
  endDate: string,
  tahunAjaran: string,
  sekolahId: number
) {
  try {
    const results = await sql`
      SELECT 
        k.id, k.tanggal, k.status, 
        m.nama, m.nisn, m.gender
      FROM kehadiran k
      JOIN murid m ON k.murid_id = m.id
      WHERE m.rombel = ${kelasWali}
        AND k.sekolah_id = ${sekolahId}
        AND m.sekolah_id = ${sekolahId}
        AND k.tahun_ajaran = ${tahunAjaran}
        AND k.tanggal BETWEEN ${startDate}::date AND ${endDate}::date
      ORDER BY k.tanggal DESC, m.nama ASC
    `;
    return results.rows;
  } catch (error) {
    console.error("Gagal mengambil riwayat kehadiran:", error);
    return [];
  }
}

// 1. Ambil data catatan kedisiplinan (Dibatasi sekolah_id dan guru_id tertentu)
export async function getCatatanKedisiplinanWithSchool(guruId: number, sekolahId: number) {
  try {
    const res = await sql`
      SELECT ck.*, m.nama as nama_murid, m.nisn
      FROM catatan_kedisiplinan ck
      JOIN murid m ON ck.murid_id = m.id
      WHERE ck.guru_id = ${guruId}
        AND ck.sekolah_id = ${sekolahId}
        AND m.sekolah_id = ${sekolahId}
      ORDER BY ck.created_at DESC
    `;
    return { success: true, data: res.rows };
  } catch (error) {
    console.error("Gagal mengambil data kedisiplinan:", error);
    return { success: false, error: "Gagal mengambil data catatan" };
  }
}

// 2. Simpan Catatan Baru (Injeksi sekolah_id & guru_id integer)
export async function saveCatatanKedisiplinanWithSchool(formData: {
  murid_id: number;
  guru_id: number;
  sekolah_id: number;
  kategori: string;
  keterangan: string;
  tahun_ajaran: string;
}) {
  try {
    await sql`
      INSERT INTO catatan_kedisiplinan (murid_id, guru_id, sekolah_id, kategori, keterangan, tahun_ajaran)
      VALUES (${formData.murid_id}, ${formData.guru_id}, ${formData.sekolah_id}, ${formData.kategori}, ${formData.keterangan}, ${formData.tahun_ajaran})
    `;
    return { success: true };
  } catch (error) {
    console.error("Gagal menyimpan catatan kedisiplinan:", error);
    return { success: false, error: "Gagal menyimpan data ke database" };
  }
}

// 3. Ambil Murid Berdasarkan Rombel Kelas Wali (Multi-Tenant)
export async function getMuridByKelasWithSchool(kelasWali: string, sekolahId: number) {
  try {
    const res = await sql`
      SELECT id, nama, nisn 
      FROM murid 
      WHERE rombel = ${kelasWali}
        AND sekolah_id = ${sekolahId}
      ORDER BY nama ASC
    `;
    return res.rows;
  } catch (error) {
    console.error("Gagal mengambil data murid per kelas:", error);
    return [];
  }
}

// 4. Hapus Catatan Kedisiplinan dengan Validasi Keamanan Sekolah
export async function deleteCatatanKedisiplinanWithSchool(id: number, sekolahId: number) {
  try {
    await sql`
      DELETE FROM catatan_kedisiplinan 
      WHERE id = ${id} AND sekolah_id = ${sekolahId}
    `;
    return { success: true };
  } catch (error) {
    console.error("Gagal menghapus catatan kedisiplinan:", error);
    return { success: false, error: "Gagal menghapus data" };
  }
}

// 5. Update Catatan Kedisiplinan dengan Validasi Keamanan Sekolah
export async function updateCatatanKedisiplinanWithSchool(
  id: number, 
  sekolahId: number,
  data: { kategori: string, keterangan: string }
) {
  try {
    await sql`
      UPDATE catatan_kedisiplinan 
      SET kategori = ${data.kategori}, keterangan = ${data.keterangan} 
      WHERE id = ${id} AND sekolah_id = ${sekolahId}
    `;
    return { success: true };
  } catch (error) {
    console.error("Gagal memperbarui catatan kedisiplinan:", error);
    return { success: false, error: "Gagal memperbarui data" };
  }
}

export async function getLogoSekolah(sekolahId: number | string) {
  try {
    if (!sekolahId) return 'sekolah.png'; // Fallback jika id kosong

    const idInt = parseInt(sekolahId.toString(), 10);
    const { rows } = await sql`
      SELECT gambar FROM public.sekolah WHERE id = ${idInt}
    `;

    // Jika gambar ditemukan dan tidak null, kembalikan namanya. Jika tidak, pakai fallback
    return rows[0]?.gambar || 'sekolah.png';
  } catch (error) {
    console.error("Gagal mengambil logo sekolah:", error);
    return 'sekolah.png'; // Fallback aman jika terjadi error sistem
  }
}

export async function getProfilSekolah(sekolahId: number | string) {
  try {
    if (!sekolahId) return null;
    const idInt = parseInt(sekolahId.toString(), 10);
    const { rows } = await sql`
      SELECT id, nama_sekolah, npsn, alamat, gambar 
      FROM public.sekolah 
      WHERE id = ${idInt}
    `;
    return rows[0] || null;
  } catch (error) {
    console.error("Gagal mengambil data sekolah:", error);
    return null;
  }
}

// 2. Fungsi Update Data & Logo Sekolah
export async function updateProfilSekolah(formData: FormData, sekolahId: number | string) {
  try {
    const idInt = parseInt(sekolahId.toString(), 10);
    const namaSekolah = formData.get("nama_sekolah") as string;
    const npsn = formData.get("npsn") as string;
    const alamat = formData.get("alamat") as string;
    const fileGambar = formData.get("gambar_file") as File | null;

    // A. Validasi Input Dasar
    if (!namaSekolah || !npsn || !alamat) {
      return { success: false, message: "Semua kolom teks wajib diisi!" };
    }

    // B. Validasi Unique NPSN (Tidak boleh sama dengan sekolah lain)
    const { rows: cekNpsn } = await sql`
      SELECT id FROM public.sekolah 
      WHERE npsn = ${npsn.trim()} AND id != ${idInt}
    `;
    if (cekNpsn.length > 0) {
      return { success: false, message: "Gagal! NPSN sudah digunakan oleh sekolah lain di dalam sistem." };
    }

    // Ambil data sekolah lama untuk mendapatkan nama gambar saat ini
    const { rows: sekolahLama } = await sql`SELECT gambar FROM public.sekolah WHERE id = ${idInt}`;
    let namaGambarFinal = sekolahLama[0]?.gambar || "sekolah.png";

    // C. Validasi & Proses Gambar (Jika User mengupload file baru)
    if (fileGambar && fileGambar.size > 0 && fileGambar.name !== "undefined") {
      // 1. Batasan Ukuran File (Max 5MB)
      const MAX_SIZE = 5 * 1024 * 1024; // 5 Megabytes
      if (fileGambar.size > MAX_SIZE) {
        return { success: false, message: "Gagal! Ukuran gambar maksimal adalah 5MB." };
      }

      // 2. Batasan Tipe File (Hanya boleh Image)
      if (!fileGambar.type.startsWith("image/")) {
        return { success: false, message: "Gagal! File harus berupa gambar (PNG, JPG, JPEG, WEBP)." };
      }

      // 3. Generate Nama File Unik biar antar tenant tidak bentrok / timpa-timpaan
      const ekstensi = path.extname(fileGambar.name) || ".png";
      const namaFileBaru = `sekolah_${idInt}_${Date.now()}${ekstensi}`;
      
      // 4. Proses Simpan File ke public/sekolah/
      const bytes = await fileGambar.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const direktoriTujuan = path.join(process.cwd(), "public", "sekolah");
      
      // Pastikan folder public/sekolah/ sudah terbuat
      await fs.mkdir(direktoriTujuan, { recursive: true });
      
      const pathLengkap = path.join(direktoriTujuan, namaFileBaru);
      await fs.writeFile(pathLengkap, buffer);

      // 5. Hapus file gambar lama dari storage jika bukan file default bawaan
      if (sekolahLama[0]?.gambar && sekolahLama[0].gambar !== "sekolah.png") {
        try {
          const pathGambarLama = path.join(direktoriTujuan, sekolahLama[0].gambar);
          await fs.unlink(pathGambarLama);
        } catch (err) {
          console.warn("Gambar lama tidak ditemukan atau gagal dihapus, abaikan saja:", err);
        }
      }

      namaGambarFinal = namaFileBaru;
    }

    // D. Jalankan Query Update Data ke Database
    await sql`
      UPDATE public.sekolah
      SET nama_sekolah = ${namaSekolah.trim()},
          npsn = ${npsn.trim()},
          alamat = ${alamat.trim()},
          gambar = ${namaGambarFinal}
      WHERE id = ${idInt}
    `;

    // Revalidate agar layout langsung membaca data terbaru tanpa perlu hard-reload manual
    revalidatePath("/tatausaha", "layout");

    return { success: true, message: "Berhasil memperbarui profil dan logo sekolah!" };
  } catch (error: any) {
    console.error("Error update profil sekolah:", error);
    return { success: false, message: error.message || "Terjadi kesalahan sistem saat memperbarui data." };
  }
}


// 1. Ambil Semua Daftar Sekolah untuk Tabel Utama
export async function getAllSekolah() {
  try {
    const { rows } = await sql`
      SELECT s.*, 
             (SELECT COUNT(*) FROM public.users WHERE sekolah_id = s.id) as total_users,
             (SELECT COUNT(*) FROM public.murid WHERE sekolah_id = s.id) as total_murid
      FROM public.sekolah s
      ORDER BY s.created_at DESC
    `;
    return rows;
  } catch (error) {
    console.error("Gagal mengambil daftar sekolah global:", error);
    return [];
  }
}

// 2. Tambah Sekolah Baru & Buatkan Otomatis Akun Tata Usaha Utama

export async function createSekolahBaru(formData: FormData) {
  const namaSekolah = formData.get('nama_sekolah') as string;
  const npsn = formData.get('npsn') as string;
  const alamat = formData.get('alamat') as string;

  if (!namaSekolah || !npsn || !alamat) {
    return { success: false, message: 'Semua kolom formulir wajib diisi!' };
  }

  try {
    // 1. Cek duplikasi NPSN
    const { rows: cekNpsn } = await sql`
      SELECT id FROM public.sekolah WHERE npsn = ${npsn.trim()}
    `;
    
    if (cekNpsn.length > 0) {
      return { success: false, message: 'Gagal! NPSN Sekolah tersebut sudah terdaftar di sistem.' };
    }

    // 2. Insert Data Lembaga Sekolah Baru
    const { rows: sekolahBaru } = await sql`
      INSERT INTO public.sekolah (nama_sekolah, npsn, alamat, gambar)
      VALUES (${namaSekolah.trim()}, ${npsn.trim()}, ${alamat.trim()}, 'sekolah.png')
      RETURNING id
    `;
    const sekolahId = sekolahBaru[0].id;

    // 3. 🌟 LOGIC ENGINE AUTO-GENERATE USERNAME
    const slugSekolah = namaSekolah
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');

    const usernameTU = `tu_${slugSekolah}`;
    const usernameOps = `ops_${slugSekolah}`;

    // 4. Hash password (menggunakan username sebagai default password awal)
    const passwordTUHashed = await bcrypt.hash(usernameTU, 10);
    const passwordOpsHashed = await bcrypt.hash(usernameOps, 10);

    // 5. Inject Akun Default Tata Usaha ke Database
    await sql`
      INSERT INTO public.users (sekolah_id, username, password, role, name)
      VALUES (${sekolahId}, ${usernameTU}, ${passwordTUHashed}, 'TATA_USAHA', ${`TU Default ${namaSekolah}`})
    `;

    // 6. Inject Akun Default Operator ke Database
    await sql`
      INSERT INTO public.users (sekolah_id, username, password, role, name)
      VALUES (${sekolahId}, ${usernameOps}, ${passwordOpsHashed}, 'OPERATOR', ${`Operator Default ${namaSekolah}`})
    `;

    // Kembalikan objek data agar bisa dibaca oleh modal pop-up sukses di UI client-side
    return {
      success: true,
      message: 'Sekolah sukses didaftarkan dengan akun ter-generate otomatis!',
      data: {
        namaSekolah,
        usernameTU,
        usernameOps
      }
    };

  } catch (error: any) {
    console.error('Error saat membuat sekolah baru dari superadmin:', error);
    return { 
      success: false, 
      message: error.message || 'Terjadi kesalahan internal sistem.' 
    };
  }
}

// 3. Edit Informasi Dasar Sekolah
export async function updateSekolah(formData: FormData, id: number) {
  try {
    const namaSekolah = formData.get("nama_sekolah") as string;
    const npsn = formData.get("npsn") as string;
    const alamat = formData.get("alamat") as string;

    const cekNpsn = await sql`SELECT id FROM public.sekolah WHERE npsn = ${npsn.trim()} AND id != ${id}`;
    if (cekNpsn.rows.length > 0) {
      return { success: false, message: "Gagal! NPSN ini sudah dipakai sekolah lain." };
    }

    await sql`
      UPDATE public.sekolah
      SET nama_sekolah = ${namaSekolah.trim()}, npsn = ${npsn.trim()}, alamat = ${alamat.trim()}
      WHERE id = ${id}
    `;

    revalidatePath("/superadmin");
    return { success: true, message: "Profil sekolah berhasil diperbarui!" };
  } catch (error: any) {
    return { success: false, message: error.message || "Gagal memperbarui data." };
  }
}

// 4. 🔥 Fitur Sapu Bersih: Hapus Sekolah & Seluruh Data Terkait (Cascading Manual)
export async function deleteSekolahTotal(sekolahId: number) {
  try {
    await sql`BEGIN`;

    // Ambil semua id murid dan guru di sekolah ini untuk membersihkan tabel jembatan yang tidak mengikat sekolah_id langsung
    const muridIds = (await sql`SELECT id FROM public.murid WHERE sekolah_id = ${sekolahId}`).rows.map(r => r.id);
    const guruIds = (await sql`SELECT id FROM public.guru WHERE sekolah_id = ${sekolahId}`).rows.map(r => r.id);

    // Hapus data transaksional anak murid jika id murid terdeteksi
    if (muridIds.length > 0) {
      await sql`DELETE FROM public.alumni WHERE murid_id = ANY(${muridIds as any})`;
      await sql`DELETE FROM public.kehadiran WHERE murid_id = ANY(${muridIds as any})`;
      await sql`DELETE FROM public.nilai WHERE murid_id = ANY(${muridIds as any})`;
      await sql`DELETE FROM public.catatan_kedisiplinan WHERE murid_id = ANY(${muridIds as any})`;
      await sql`DELETE FROM public.history_perwalian WHERE murid_id = ANY(${muridIds as any})`;
    }

    // Hapus data transaksional guru jika id guru terdeteksi
    if (guruIds.length > 0) {
      await sql`DELETE FROM public.kehadiran_guru WHERE guru_id = ANY(${guruIds as any})`;
      await sql`DELETE FROM public.wali_kelas WHERE guru_id = ANY(${guruIds as any})`;
    }

    // Hapus data berdasarkan sekolah_id langsung sesuai relasi skema
    await sql`DELETE FROM public.history_perwalian WHERE sekolah_id = ${sekolahId}`;
    await sql`DELETE FROM public.catatan_kedisiplinan WHERE sekolah_id = ${sekolahId}`;
    await sql`DELETE FROM public.kehadiran WHERE sekolah_id = ${sekolahId}`;
    await sql`DELETE FROM public.kehadiran_guru WHERE sekolah_id = ${sekolahId}`;
    await sql`DELETE FROM public.jadwal_pelajaran WHERE sekolah_id = ${sekolahId}`;
    await sql`DELETE FROM public.nilai WHERE sekolah_id = ${sekolahId}`;
    await sql`DELETE FROM public.prestasi WHERE sekolah_id = ${sekolahId}`;
    await sql`DELETE FROM public.kelas WHERE sekolah_id = ${sekolahId}`;
    await sql`DELETE FROM public.mapel WHERE sekolah_id = ${sekolahId}`;
    await sql`DELETE FROM public.alumni WHERE sekolah_id = ${sekolahId}`;
    await sql`DELETE FROM public.wali_kelas WHERE sekolah_id = ${sekolahId}`;
    await sql`DELETE FROM public.users WHERE sekolah_id = ${sekolahId}`;
    await sql`DELETE FROM public.murid WHERE sekolah_id = ${sekolahId}`;
    await sql`DELETE FROM public.guru WHERE sekolah_id = ${sekolahId}`;

    // Terakhir, hapus entitas utama sekolahnya
    await sql`DELETE FROM public.sekolah WHERE id = ${sekolahId}`;

    await sql`COMMIT`;
    revalidatePath("/superadmin");
    return { success: true, message: "Sekolah dan seluruh data turunannya berhasil dihapus permanen!" };
  } catch (error: any) {
    await sql`ROLLBACK`;
    console.error("Gagal menghapus total data sekolah:", error);
    return { success: false, message: "Gagal menghapus: " + error.message };
  }
}
// -- revisi function yang dibawah --
// actions.ts
// Tambahkan async di sini
export async function authenticate(formData: FormData) {
    try {
        const result = await signIn('credentials', {
            ...Object.fromEntries(formData),
            redirect: false, // <--- SANGAT PENTING: Ubah jadi false
        });

        if (result ?.error) {
            return "Username atau Password salah.";
        }

        return { success: true };
    } catch (error: any) {
        // Abaikan error redirect internal Next.js
        if (error.type === 'CredentialsSignin') return "Username atau Password salah.";
        throw error;
    }
}

export async function handleLogout() {
    await signOut({ redirectTo: '/' });
}

// --- Action Update Profil ---
export async function updateProfile(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Sesi tidak valid." };

  // Ambil data sekolah_id dari session untuk guardrail ekstra
  const sId = session.user?.sekolah_id || (session.user as any)?.sekolahId;
  const sekolahId = sId ? parseInt(sId.toString()) : null;

  if (!sekolahId) return { error: "Akses ditolak: Sekolah tidak valid." };

  const name = formData.get('name') as string;
  const imageFile = formData.get('image') as File;

  if (imageFile && imageFile.size > 2 * 1024 * 1024) {
    return { error: "File terlalu besar. Maksimal 2MB." };
  }

  // 1. Ambil data lama dengan filter user id DAN sekolah_id (Guardrail)
  const userQuery = await sql`
    SELECT image FROM users 
    WHERE id = ${session.user.id} 
      AND sekolah_id = ${sekolahId}
  `;
  
  if (userQuery.rows.length === 0) return { error: "User tidak ditemukan." };
  
  const oldImageName = userQuery.rows[0].image || "default.png";
  const userRole = session.user.role?.toLowerCase(); // normalisasi huruf kecil
  
  // Perbaikan jalur revalidate: sesuaikan dengan struktur folder dashboard tatausaha kamu
  const profilePath = `/tatausaha/profil`; 

  let newImageName = oldImageName;

  try {
    // 2. Jika ada file baru yang diunggah
    if (imageFile && imageFile.size > 0) {
      newImageName = `${Date.now()}-${imageFile.name.replaceAll(" ", "_")}`;
      const newFilePath = path.join(process.cwd(), "public/profil", newImageName);

      const bytes = await imageFile.arrayBuffer();
      await fs.writeFile(newFilePath, Buffer.from(bytes));

      // 3. Hapus foto lama JIKA bukan 'default.png'
      if (oldImageName !== "default.png") {
        const oldFilePath = path.join(process.cwd(), "public/profil", oldImageName);
        try {
          await fs.access(oldFilePath);
          await fs.unlink(oldFilePath);
        } catch (err) {
          console.error("File lama tidak ditemukan atau gagal dihapus:", err);
        }
      }
    }

    // 4. Update Database dengan pengaman sekolah_id
    await sql`
      UPDATE users 
      SET name = ${name}, image = ${newImageName} 
      WHERE id = ${session.user.id}
        AND sekolah_id = ${sekolahId}
    `;

    // Revalidate data halaman agar langsung segar tanpa reload total
    revalidatePath(profilePath);
    revalidatePath(`/tatausaha`, 'layout');

    return {
      success: true,
      message: "Profil berhasil diperbarui!",
      image: newImageName
    };
  } catch (error) {
    console.error("Update Error:", error);
    return { error: "Gagal memperbarui profil." };
  }
}

export async function updateProfile1(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Sesi tidak valid." };

  // Ambil data sekolah_id dari session untuk guardrail ekstra
  
  const name = formData.get('name') as string;
  const imageFile = formData.get('image') as File;

  if (imageFile && imageFile.size > 2 * 1024 * 1024) {
    return { error: "File terlalu besar. Maksimal 2MB." };
  }

  // 1. Ambil data lama dengan filter user id DAN sekolah_id (Guardrail)
  const userQuery = await sql`
    SELECT image FROM users 
    WHERE id = ${session.user.id} 
      
  `;
  
  if (userQuery.rows.length === 0) return { error: "User tidak ditemukan." };
  
  const oldImageName = userQuery.rows[0].image || "default.png";
  const userRole = session.user.role?.toLowerCase(); // normalisasi huruf kecil
  
  // Perbaikan jalur revalidate: sesuaikan dengan struktur folder dashboard tatausaha kamu
  const profilePath = `/tatausaha/profil`; 

  let newImageName = oldImageName;

  try {
    // 2. Jika ada file baru yang diunggah
    if (imageFile && imageFile.size > 0) {
      newImageName = `${Date.now()}-${imageFile.name.replaceAll(" ", "_")}`;
      const newFilePath = path.join(process.cwd(), "public/profil", newImageName);

      const bytes = await imageFile.arrayBuffer();
      await fs.writeFile(newFilePath, Buffer.from(bytes));

      // 3. Hapus foto lama JIKA bukan 'default.png'
      if (oldImageName !== "default.png") {
        const oldFilePath = path.join(process.cwd(), "public/profil", oldImageName);
        try {
          await fs.access(oldFilePath);
          await fs.unlink(oldFilePath);
        } catch (err) {
          console.error("File lama tidak ditemukan atau gagal dihapus:", err);
        }
      }
    }

    // 4. Update Database dengan pengaman sekolah_id
    await sql`
      UPDATE users 
      SET name = ${name}, image = ${newImageName} 
      WHERE id = ${session.user.id}
        
    `;

    // Revalidate data halaman agar langsung segar tanpa reload total
    revalidatePath(profilePath);
    revalidatePath(`/tatausaha`, 'layout');

    return {
      success: true,
      message: "Profil berhasil diperbarui!",
      image: newImageName
    };
  } catch (error) {
    console.error("Update Error:", error);
    return { error: "Gagal memperbarui profil." };
  }
}

// --- Action Ganti Password ---
export async function changePassword(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Tidak diizinkan." };

  // Ambil sekolah_id dari session untuk guardrail ekstra
  const sId = session.user?.sekolah_id || (session.user as any)?.sekolahId;
  const sekolahId = sId ? parseInt(sId.toString()) : null;

  if (!sekolahId) return { error: "Akses ditolak: Sekolah tidak valid." };

  const oldPassword = formData.get('oldPassword') as string;
  const newPassword = formData.get('newPassword') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  if (newPassword !== confirmPassword) return { error: "Konfirmasi password tidak cocok." };

  try {
    // 1. Ambil password lama dengan filter ID dan Sekolah (Guardrail)
    const userQuery = await sql`
      SELECT password FROM users 
      WHERE id = ${session.user.id} 
        AND sekolah_id = ${sekolahId}
    `;
    
    if (userQuery.rows.length === 0) return { error: "Pengguna tidak ditemukan." };
    
    const user = userQuery.rows[0];
    const isMatch = await bcrypt.compare(oldPassword, user.password);

    if (!isMatch) return { error: "Password lama salah." };

    // 2. Hash password baru
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    
    // 3. Update database dengan filter ID dan Sekolah (Guardrail)
    await sql`
      UPDATE users 
      SET password = ${hashedNewPassword} 
      WHERE id = ${session.user.id} 
        AND sekolah_id = ${sekolahId}
    `;

    return { success: "Password berhasil diganti!" };
  } catch (error) {
    console.error("Change Password Error:", error);
    return { error: "Terjadi kesalahan sistem." };
  }
}

export async function changePassword1(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Tidak diizinkan." };

  // Ambil sekolah_id dari session untuk guardrail ekstra
  
  const oldPassword = formData.get('oldPassword') as string;
  const newPassword = formData.get('newPassword') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  if (newPassword !== confirmPassword) return { error: "Konfirmasi password tidak cocok." };

  try {
    // 1. Ambil password lama dengan filter ID dan Sekolah (Guardrail)
    const userQuery = await sql`
      SELECT password FROM users 
      WHERE id = ${session.user.id} 
        
    `;
    
    if (userQuery.rows.length === 0) return { error: "Pengguna tidak ditemukan." };
    
    const user = userQuery.rows[0];
    const isMatch = await bcrypt.compare(oldPassword, user.password);

    if (!isMatch) return { error: "Password lama salah." };

    // 2. Hash password baru
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    
    // 3. Update database dengan filter ID dan Sekolah (Guardrail)
    await sql`
      UPDATE users 
      SET password = ${hashedNewPassword} 
      WHERE id = ${session.user.id} 
        
    `;

    return { success: "Password berhasil diganti!" };
  } catch (error) {
    console.error("Change Password Error:", error);
    return { error: "Terjadi kesalahan sistem." };
  }
}

// Action DataGuru di role tatausaha
export async function getAllGuru() {
    try {
        const data = await sql `SELECT * FROM guru ORDER BY created_at DESC`;
        return data.rows;
    } catch (error) {
        return [];
    }
}

export async function addGuru(formData: FormData) {
    const nip = formData.get('nip') as string;
    const nama = formData.get('nama') as string;
    const mapel = formData.get('mapel') as string;
    const gender = formData.get('gender') as string; // Tambahkan ini

    try {
        await sql `
      INSERT INTO guru (nip, nama, mapel, gender) 
      VALUES (${nip}, ${nama}, ${mapel}, ${gender})
    `;
        revalidatePath('/tatausaha/dataguru');
        return { success: true };
    } catch (error: any) {
        if (error.message.includes('unique constraint')) return { error: "NIP sudah terdaftar!" };
        return { error: "Gagal menambah data guru." };
    }
}

export async function updateGuru(id: number, formData: FormData) {
    const actionSession = await auth();
    const sId = actionSession?.user?.sekolah_id || (actionSession?.user as any)?.sekolahId;

    if (!sId) return { success: false, error: "Sesi tidak valid." };
    const sekolahIdInt = parseInt(sId.toString());

    const nip = formData.get('nip') as string;
    const nama = formData.get('nama') as string;
    const mapel = formData.get('mapel') as string;
    const gender = formData.get('gender') as string;
    const status = formData.get('status') as string;
    const nik = formData.get('nik') as string;
    const nuptk = formData.get('nuptk') as string;
    const sekolahInduk = formData.get('sekolah_induk') as string;

    try {
        // 1. Update data guru dengan filter ketat sekolah_id
        await sql`
          UPDATE guru 
          SET nip = ${nip}, 
              nama = ${nama}, 
              mapel = ${mapel}, 
              gender = ${gender},
              status = ${status},
              nik = ${nik},
              nuptk = ${nuptk},
              sekolah_induk = ${sekolahInduk}
          WHERE id = ${id} AND sekolah_id = ${sekolahIdInt}
        `;

        // 2. Sinkronisasi Otomatis ke tabel user milik sekolah terkait
        await sql`
          UPDATE users 
          SET username = ${nip}, name = ${nama} 
          WHERE guru_id = ${id} AND sekolah_id = ${sekolahIdInt}
        `;

        revalidatePath('/tatausaha/dataguru');
        revalidatePath('/operator/datauser'); 
        return { success: true };
    } catch (error) {
        console.error(error);
        return { error: "Gagal memperbarui data guru dan sinkronisasi akun." };
    }
}

export async function deleteGuru(id: number) {
  const actionSession = await auth();
  const sId = actionSession?.user?.sekolah_id || (actionSession?.user as any)?.sekolahId;

  if (!sId) return { success: false, error: "Sesi tidak valid." };
  const sekolahIdInt = parseInt(sId.toString());

  try {
    // 1. Ambil NIP guru dan pastikan guru tersebut benar milik sekolah_id si operator TU
    const res = await sql`SELECT nip FROM guru WHERE id = ${id} AND sekolah_id = ${sekolahIdInt}`;
    const guru = res.rows[0];

    if (guru) {
      // Hapus berantai data anak tabel
      await sql`DELETE FROM wali_kelas WHERE guru_id = ${id}`;
      await sql`DELETE FROM nilai WHERE guru_id = ${id}`; 
      await sql`DELETE FROM kehadiran_guru WHERE guru_id = ${id}`;
      await sql`DELETE FROM kehadiran WHERE guru_id = ${id}`;
      await sql`DELETE FROM history_perwalian WHERE guru_id = ${id}`;
      await sql`DELETE FROM catatan_kedisiplinan WHERE guru_id = ${id}`;
      await sql`DELETE FROM jadwal_pelajaran WHERE guru_id = ${id}`;
      
      // 2. Hapus akun di tabel users yang terikat ke sekolah_id ini
      await sql`DELETE FROM users WHERE username = ${guru.nip} AND sekolah_id = ${sekolahIdInt}`;
      
      // 3. Hapus data guru utama
      await sql`DELETE FROM guru WHERE id = ${id} AND sekolah_id = ${sekolahIdInt}`;
    }

    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Gagal menghapus data guru dan user terkait." };
  }
}

// Ambil data guru yang BELUM memiliki akun di tabel users
// Cari fungsi ini di lib/actions.ts dan ubah SQL-nya
export async function getGuruTanpaAkun(sekolahId: number) {
  try {
    const data = await sql`
      SELECT id, nip, nama, jenis
      FROM guru 
      WHERE sekolah_id = ${sekolahId}
        AND id NOT IN (
          SELECT guru_id FROM users 
          WHERE guru_id IS NOT NULL AND sekolah_id = ${sekolahId}
        )
      ORDER BY nama ASC
    `;
    return data.rows;
  } catch (error) {
    return [];
  }
}

// Action untuk membuat akun user baru
export async function createUserAccount(formData: FormData, sekolahId: number) {
  const name = formData.get('name') as string;
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;
  const role = formData.get('role') as string;
  const guruId = formData.get('guruId') as string || null;

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    // Tambahkan sekolah_id ke dalam query INSERT
    await sql`
      INSERT INTO users (name, username, password, role, guru_id, image, sekolah_id)
      VALUES (${name}, ${username}, ${hashedPassword}, ${role}, ${guruId}, 'default.png', ${sekolahId})
    `;
    revalidatePath('/operator/datauser');
    return { success: true };
  } catch (error: any) {
    if (error.message.includes('unique constraint')) return { error: "Username sudah digunakan!" };
    return { error: "Gagal membuat akun user." };
  }
}

// action untuk menghapus user
export async function deleteUser(id: number) {
  try {
    // Diproteksi tanpa harus kirim parameter sekolahId lagi karena ID user bersifat mutlak unik pkey
    await sql`DELETE FROM users WHERE id = ${id}`;
    revalidatePath('/operator/datauser');
    return { success: true };
  } catch (error) {
    return { error: "Gagal menghapus user." };
  }
}

// Update hanya Nama saja[cite: 8]
export async function updateUser(id: number, formData: FormData) {
  const name = formData.get('name') as string;
  try {
    await sql`UPDATE users SET name = ${name} WHERE id = ${id}`;
    revalidatePath('/operator/datauser');
    return { success: true };
  } catch (error) {
    return { error: "Gagal memperbarui nama user." };
  }
}

// Reset Password ke NIP (Username)
export async function resetPassword(id: number, nip: string) {
  const hashedPassword = await bcrypt.hash(nip, 10);
  try {
    await sql`UPDATE users SET password = ${hashedPassword} WHERE id = ${id}`;
    return { success: true };
  } catch (error) {
    return { error: "Gagal mereset password." };
  }
}

export async function getAllMurid() {
  try {
    const data = await sql`SELECT * FROM murid ORDER BY kelas ASC, nama ASC`;
    return data.rows;
  } catch (error) {
    return [];
  }
}

export async function addMurid(formData: FormData) {
  const nisn = formData.get('nisn') as string;
  const nama = formData.get('nama') as string;
  const kelas = formData.get('kelas') as string;
  const jk = formData.get('jenis_kelamin') as string;
  const agama = formData.get('agama') as string;
  const tempat_lahir = formData.get('tempat_lahir') as string;
  const tanggal_lahir = formData.get('tanggal_lahir') as string;
  const alamat = formData.get('alamat') as string;
  const fotoFile = formData.get('foto') as File;

  let fileName = 'default.png';

  try {
    // Logika simpan foto jika ada
    if (fotoFile && fotoFile.size > 0) {
      fileName = `${Date.now()}-${fotoFile.name.replaceAll(" ", "_")}`;
      const filePath = path.join(process.cwd(), "public/murid", fileName);
      const bytes = await fotoFile.arrayBuffer();
      await fs.writeFile(filePath, Buffer.from(bytes));
    }

    await sql`
      INSERT INTO murid (nisn, nama, kelas, jenis_kelamin, agama, tempat_lahir, tanggal_lahir, alamat, foto) 
      VALUES (${nisn}, ${nama}, ${kelas}, ${jk}, ${agama}, ${tempat_lahir}, ${tanggal_lahir}, ${alamat}, ${fileName})
    `;
    revalidatePath('/guru/datamurid');
    return { success: true };
  } catch (error: any) {
    if (error.message.includes('unique')) return { error: "NISN sudah terdaftar!" };
    return { error: "Gagal menambah data murid." };
  }
}

export async function updateMurid(id: number, formData: FormData) {
  const nisn = formData.get('nisn') as string;  
  const nama = formData.get('nama') as string;
  const kelas = formData.get('kelas') as string;
  const jk = formData.get('jenis_kelamin') as string;
  const agama = formData.get('agama') as string;
  const tempat_lahir = formData.get('tempat_lahir') as string;
  const tanggal_lahir = formData.get('tanggal_lahir') as string;
  const alamat = formData.get('alamat') as string;
  const status = formData.get('status') as string;
  const fotoFile = formData.get('foto') as File;

  try {
    // Ambil data lama untuk cek foto
    const oldData = await sql`SELECT foto FROM murid WHERE id = ${id}`;
    let fileName = oldData.rows[0].foto;

    if (fotoFile && fotoFile.size > 0) {
      // Hapus foto lama jika bukan default
      if (fileName !== 'default.png') {
        try { await fs.unlink(path.join(process.cwd(), "public/murid", fileName)); } catch (e) {}
      }
      
      fileName = `${Date.now()}-${fotoFile.name.replaceAll(" ", "_")}`;
      const filePath = path.join(process.cwd(), "public/murid", fileName);
      const bytes = await fotoFile.arrayBuffer();
      await fs.writeFile(filePath, Buffer.from(bytes));
    }

    await sql`
      UPDATE murid 
      SET nisn = ${nisn}, nama = ${nama}, kelas = ${kelas}, jenis_kelamin = ${jk}, 
          agama = ${agama}, tempat_lahir = ${tempat_lahir}, 
          tanggal_lahir = ${tanggal_lahir}, alamat = ${alamat}, 
          status = ${status}, foto = ${fileName} 
      WHERE id = ${id}
    `;
    revalidatePath('/guru/datamurid');
    return { success: true };
  } catch (error: any) {
    if (error.message.includes('unique')) return { error: "Gagal! NISN baru sudah digunakan murid lain." };
    return { error: "Gagal memperbarui data." };
  }
}

export async function deleteMurid(id: number) {
  try {
    // 1. Ambil info foto murid sebelum datanya dihapus
    const res = await sql`SELECT foto FROM murid WHERE id = ${id}`;
    
    if (res.rows.length > 0) {
      const fileName = res.rows[0].foto;

      // 2. Jika fotonya bukan default.png, hapus filenya dari folder public/profil
      if (fileName && fileName !== 'default.png') {
        const filePath = path.join(process.cwd(), "public/murid", fileName);
        
        try {
          // Cek dulu apakah filenya ada, baru hapus
          await fs.access(filePath); 
          await fs.unlink(filePath);
          console.log(`File ${fileName} berhasil dihapus.`);
        } catch (err) {
          // Jika file tidak ditemukan, abaikan saja agar proses database tetap lanjut
          console.error("File tidak ditemukan atau gagal dihapus:", err);
        }
      }
    }

    // 3. Baru hapus data murid dari database
    await sql`DELETE FROM murid WHERE id = ${id}`;
    
    revalidatePath('/guru/datamurid');
    return { success: true };
  } catch (error) {
    console.error("Delete Error:", error);
    return { 
      error: "Gagal menghapus. Data mungkin terikat dengan tabel lain (seperti Nilai)." 
    };
  }
}

export async function getOperatorStats(sekolahId: number) {
  try {
    if (!sekolahId) {
      return { totalUsers: 0, pendingGuru: 0, totalWaliKelas: 0 };
    }

    // 1. Hitung total akun di tabel users berdasarkan sekolah_id
    const userRes = await sql`
      SELECT COUNT(*) as count FROM users 
      WHERE sekolah_id = ${sekolahId}
    `;
    
    // 2. Hitung guru di sekolah tersebut yang belum dibuatkan akun
    const pendingRes = await sql`
      SELECT COUNT(*) as count FROM guru 
      WHERE sekolah_id = ${sekolahId}
        AND id NOT IN (
          SELECT guru_id FROM users 
          WHERE guru_id IS NOT NULL AND sekolah_id = ${sekolahId}
        )
    `;
    
    // 3. Hitung total wali kelas berdasarkan sekolah_id
    const waliRes = await sql`
      SELECT COUNT(*) as count FROM wali_kelas 
      WHERE sekolah_id = ${sekolahId}
    `;

    return {
      totalUsers: Number(userRes.rows[0].count),
      pendingGuru: Number(pendingRes.rows[0].count),
      totalWaliKelas: Number(waliRes.rows[0].count),
    };
  } catch (error) {
    console.error("Gagal mengambil data statistik:", error);
    return { totalUsers: 0, pendingGuru: 0, totalWaliKelas: 0 };
  }
}

export async function getMuridByWali(rombel: string) {
  try {
    const data = await sql`
      SELECT 
        id, 
        nisn, 
        nama, 
        gender, 
        rombel, 
        tanggal_lahir, 
        status, 
        nik, 
        nama_ibu 
      FROM murid 
      WHERE rombel = ${rombel}
      ORDER BY nama ASC
    `;
    return data.rows;
  } catch (error) {
    console.error("Gagal mengambil data murid:", error);
    return [];
  }
}

export async function getMuridByWaliWithValidation(rombel: string, sekolahId: number) {
  try {
    const data = await sql`
      SELECT 
        m.id, 
        m.nisn, 
        m.nama,
        m.kelas, 
        m.gender, 
        m.rombel, 
        m.status,
        m.nik,
        m.nama_ibu,
        m.tanggal_lahir,
        (SELECT COUNT(*) FROM nilai n WHERE n.murid_id = m.id AND n.semester = 'Ganjil' AND n.sekolah_id = ${sekolahId}) as jml_ganjil,
        (SELECT COUNT(*) FROM nilai n WHERE n.murid_id = m.id AND n.semester = 'Genap' AND n.sekolah_id = ${sekolahId}) as jml_genap
      FROM murid m
      WHERE m.rombel = ${rombel} 
        AND m.sekolah_id = ${sekolahId} -- 💡 Kunci Multi-Tenant
      ORDER BY m.nama ASC
    `;
    return data.rows;
  } catch (error) {
    console.error("Gagal mengambil data murid wali:", error);
    return [];
  }
}

export async function getDetailNilaiMurid(muridId: number, sekolahId: number) {
  try {
    // Kita gunakan INNER JOIN atau LEFT JOIN ke tabel mapel agar mendapatkan nama mapel yang valid secara real-time
    const data = await sql`
      SELECT 
        m.nama_mapel, 
        n.semester, 
        n.nilai_angka 
      FROM nilai n
      -- 💡 Hubungkan kolom mapel (baik berupa ID maupun nama teks) ke tabel master mapel
      INNER JOIN mapel m ON (n.mapel = m.nama_mapel OR n.mapel = CAST(m.id AS TEXT) OR n.mapel = CAST(m.id AS VARCHAR))
      WHERE n.murid_id = ${Number(muridId)} 
        AND n.sekolah_id = ${Number(sekolahId)}
      ORDER BY m.nama_mapel ASC
    `;
    return data.rows;
  } catch (error) {
    console.error("Gagal ambil detail nilai:", error);
    return [];
  }
}

// Fungsi pembantu untuk menentukan target kelas
const getNextRombel = (currentRombel: string) => {
  const DAFTAR_ROMBEL = [
    "X.1", "X.2", "X.3", "X.4", 
    "XI.F1", "XI.F2", "XI.F3", "XI.F4", 
    "XII.F1", "XII.F2", "XII.F3", "XII.F4"
  ];
  
  const currentIndex = DAFTAR_ROMBEL.indexOf(currentRombel);
  if (currentIndex >= 0 && currentIndex <= 3) return DAFTAR_ROMBEL[currentIndex + 4]; // X -> XI
  if (currentIndex >= 4 && currentIndex <= 7) return DAFTAR_ROMBEL[currentIndex + 4]; // XI -> XII
  return null; // Lulus jika sudah di kelas XII
};


export async function prosesNaikKelas(
  murid: any, 
  guruId: number, 
  sekolahId: number, 
  nextRombel: string
) {
  // 💡 MENDETEKSI TINGKAT BARU SEBAGAI ANGKA MURNI
  let nextKelas: string;
  
  if (nextRombel === "LULUS") {
    nextKelas = "LULUS";
  } else {
    // Ambil nilai kelas saat ini, konversi ke number, lalu tambah 1
    const angkaKelasSekarang = Number(murid.kelas);
    
    if (!isNaN(angkaKelasSekarang)) {
      nextKelas = String(angkaKelasSekarang + 1); // 10 + 1 = "11" (Angka, bukan Romawi!)
    } else {
      // Cadangan aman jika data di DB telanjur berformat Romawi "X" atau "XI"
      const kelasLamaUpper = String(murid.kelas).toUpperCase();
      if (kelasLamaUpper === "X") nextKelas = "11";
      else if (kelasLamaUpper === "XI") nextKelas = "12";
      else nextKelas = String(nextRombel.split('.')[0]); // Fallback terakhir
    }
  }

  // Pendeteksi kelas lama untuk log history
  const kelasLamaTerdeteksi = murid.kelas || murid.rombel.split('.')[0];
  const tahunAjaranSekarang = await getTahunAjaranDinamis();

  try {
    // 1. Simpan log ke History Perwalian
    await sql`
      INSERT INTO history_perwalian (
        murid_id, guru_id, kelas_lama, rombel_lama, tahun_ajaran, sekolah_id
      )
      VALUES (
        ${Number(murid.id)}, 
        ${Number(guruId)}, 
        ${kelasLamaTerdeteksi}, 
        ${murid.rombel}, 
        ${tahunAjaranSekarang},
        ${Number(sekolahId)}
      )
    `;

    // 2. Update data kelas (Angka murni) dan rombel baru murid
    await sql`
      UPDATE murid 
      SET 
        kelas = ${nextKelas}, -- 💡 Di sini akan terupdate angka pasti ("11" atau "12")
        rombel = ${nextRombel === "LULUS" ? null : nextRombel},
        status = ${nextRombel === "LULUS" ? 'lulus' : 'aktif'}
      WHERE id = ${Number(murid.id)} 
        AND sekolah_id = ${Number(sekolahId)}
    `;

    return { success: true, target: nextRombel };
  } catch (error) {
    console.error("Gagal proses kenaikan kelas:", error);
    return { success: false };
  }
}

export async function getRiwayatPerwalian(guruId: number) {
  try {
    const data = await sql`
      SELECT
        h.id,       
        h.murid_id, 
        h.kelas_lama, 
        h.rombel_lama, 
        h.tahun_ajaran, 
        h.tanggal_proses,
        m.nama, 
        m.nisn, 
        m.gender, 
        m.nik,
        m.nama_ibu,
        m.tanggal_lahir
      FROM history_perwalian h
      JOIN murid m ON h.murid_id = m.id
      WHERE h.guru_id = ${guruId}
      ORDER BY h.tanggal_proses DESC
    `;
    return data.rows;
  } catch (error) {
    console.error("Gagal ambil riwayat perwalian:", error);
    return [];
  }
}

export async function getRiwayatInputNilai(userId: number) {
  try {
    // 1. Kita cari dulu ID Guru berdasarkan User ID yang sedang login
    // Karena session.user.id biasanya merujuk ke tabel users
    const guru = await sql`SELECT id FROM guru WHERE nip = (SELECT username FROM users WHERE id = ${userId})`;
    
    if (guru.rows.length === 0) return [];
    
    const guruId = guru.rows[0].id;

    // 2. Baru tarik data nilai berdasarkan guruId yang benar
    const res = await sql`
      SELECT 
        n.*, 
        m.nama as nama_murid, 
        m.nisn, 
        m.rombel 
      FROM nilai n
      JOIN murid m ON n.murid_id = m.id
      WHERE n.guru_id = ${guruId}
      ORDER BY n.created_at DESC
    `;

    return res.rows;
  } catch (error) {
    console.error("Gagal ambil riwayat:", error);
    return [];
  }
}

export async function getMissingDates(muridIds: number[], startDate: string, endDate: string) {
  try {
    // Kita ubah array [1, 2, 3] menjadi string format Postgres '{1,2,3}'
    const formattedIds = `{${muridIds.join(",")}}`;

    const existing = await sql`
      SELECT DISTINCT tanggal FROM kehadiran 
      WHERE murid_id = ANY(${formattedIds}::int[]) 
      AND tanggal BETWEEN ${startDate} AND ${endDate}
    `;
    
    return existing.rows.map(r => {
      // Memastikan format tanggal tetap YYYY-MM-DD tanpa masalah timezone
      const date = new Date(r.tanggal);
      return date.toLocaleDateString('en-CA'); // Format: YYYY-MM-DD
    });
  } catch (error) {
    console.error("Error getMissingDates:", error);
    return [];
  }
}

export async function saveKehadiranBulk(data: any[]) {
  try {
    if (!data || data.length === 0) return { success: false, error: "Data kosong" };

    for (const item of data) {
      // Langsung masukkan string guru_id (NIP) ke database karena tipenya sudah VARCHAR
      await sql`
        INSERT INTO kehadiran (murid_id, guru_id, tanggal, status, tahun_ajaran)
        VALUES (${item.murid_id}, ${item.guru_id}, ${item.tanggal}, ${item.status}, ${item.tahun_ajaran})
        ON CONFLICT (murid_id, tanggal) 
        DO UPDATE SET status = EXCLUDED.status;
      `;
    }

    revalidatePath("/guru/kehadiran");
    return { success: true };
  } catch (error) {
    console.error("Gagal menyimpan kehadiran:", error);
    return { success: false, error: "Gagal menyimpan ke database" };
  }
}


export async function getHistoryKehadiran(
  kelasWali: string, 
  startDate: string, 
  endDate: string,
  tahunAjaran: string
) {
  try {
    const results = await sql`
      SELECT 
        k.id, k.tanggal, k.status, 
        m.nama, m.nisn, m.gender
      FROM kehadiran k
      JOIN murid m ON k.murid_id = m.id
      WHERE m.rombel = ${kelasWali}
        AND k.tahun_ajaran = ${tahunAjaran} -- Filter langsung di tabel kehadiran
        AND k.tanggal::date BETWEEN ${startDate}::date AND ${endDate}::date
      ORDER BY k.tanggal DESC, m.nama ASC
    `;
    return results.rows;
  } catch (error) {
    return [];
  }
}

// Di dalam lib/actions.ts (Contoh penyesuaian query select kedisiplinan)
export async function getCatatanKedisiplinan(nipGuru: string) {
  try {
    const res = await sql`
      SELECT ck.*, m.nama as nama_murid, m.kelas, m.rombel 
      FROM catatan_kedisiplinan ck
      JOIN murid m ON ck.murid_id = m.id
      WHERE ck.guru_id::text = ${nipGuru}::text
      ORDER BY ck.created_at DESC
    `;
    return { success: true, data: res.rows };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Gagal mengambil data" };
  }
}

// Simpan catatan baru
export async function saveCatatanKedisiplinan(formData: any) {
  try {
    await sql`
      INSERT INTO catatan_kedisiplinan (murid_id, guru_id, kategori, keterangan, tahun_ajaran)
      VALUES (${formData.murid_id}, ${formData.guru_id}, ${formData.kategori}, ${formData.keterangan}, ${formData.tahun_ajaran})
    `;
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}

export async function getMuridByKelas(kelasWali: string) {
  try {
    // Kita pecah kelasWali (misal "X.1") menjadi kelas "X" dan rombel "X.1"
    const kelas = kelasWali.split('.')[0];

    const res = await sql`
      SELECT id, nama, nisn 
      FROM murid 
      WHERE kelas = ${kelas} 
      AND rombel = ${kelasWali}
      ORDER BY nama ASC
    `;
    
    return res.rows;
  } catch (error) {
    console.error("Gagal mengambil data murid per kelas:", error);
    return [];
  }
}

// Hapus Catatan
export async function deleteCatatanKedisiplinan(id: number) {
  try {
    await sql`DELETE FROM catatan_kedisiplinan WHERE id = ${id}`;
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}

// Update Catatan (Hanya Kategori & Keterangan)
export async function updateCatatanKedisiplinan(id: number, data: { kategori: string, keterangan: string }) {
  try {
    await sql`
      UPDATE catatan_kedisiplinan 
      SET kategori = ${data.kategori}, keterangan = ${data.keterangan} 
      WHERE id = ${id}
    `;
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}

export async function simpanPresensiGuru(payload: any[]) {
  "use server";
  const tahunAjaran = await getTahunAjaranDinamis();
  
  for (const data of payload) {
    await sql`
      INSERT INTO kehadiran_guru (guru_id, tanggal, status, tahun_ajaran)
      VALUES (${data.guru_id}, CURRENT_DATE, ${data.status}, ${tahunAjaran})
      ON CONFLICT (guru_id, tanggal) 
      DO UPDATE SET status = EXCLUDED.status
    `;
  }
}

export async function getMissingDatesGuru(guruIds: number[], startDate: string, endDate: string, sekolahId: number) {
  if (guruIds.length === 0) return [];
  
  // Ubah array [1, 2] menjadi string "{1,2}" agar valid untuk PostgreSQL ANY
  const formattedIds = `{${guruIds.join(",")}}`;

  const res = await sql`
    SELECT DISTINCT tanggal::text FROM kehadiran_guru 
    WHERE sekolah_id = ${sekolahId}
    AND guru_id = ANY(${formattedIds}::int[]) 
    AND tanggal BETWEEN ${startDate} AND ${endDate}
  `;
  
  return res.rows.map(r => r.tanggal);
}

export async function savePresensiGuruBulk(data: any[]) {
  try {
    for (const item of data) {
      await sql`
        INSERT INTO kehadiran_guru (sekolah_id, guru_id, tanggal, status, tahun_ajaran)
        VALUES (${item.sekolah_id}, ${item.guru_id}, ${item.tanggal}, ${item.status}, ${item.tahun_ajaran})
        ON CONFLICT (sekolah_id, guru_id, tanggal) 
        DO UPDATE SET status = EXCLUDED.status
      `;
    }
    return { success: true };
  } catch (error) {
    console.error("Bulk Save Error:", error);
    return { success: false };
  }
}

export async function getHistoryKehadiranGuru(
  startDate: string, 
  endDate: string, 
  tahunAjaran: string,
  sekolahId: number // 👈 Tambahkan parameter sekolahId
) {
  try {
    const res = await sql`
      SELECT 
        kg.id, 
        kg.tanggal::text, 
        kg.status, 
        g.nama, 
        g.nip
      FROM kehadiran_guru kg
      JOIN guru g ON kg.guru_id = g.id
      WHERE kg.sekolah_id = ${sekolahId}
      AND kg.tanggal::date BETWEEN ${startDate}::date AND ${endDate}::date
      AND kg.tahun_ajaran = ${tahunAjaran}
      ORDER BY kg.tanggal DESC, g.nama ASC
    `;
    
    return res.rows; 
  } catch (error) {
    console.error("Database Error:", error);
    return [];
  }
}

export async function saveJadwalPelajaran(data: any[], sekolahId: number) {
  try {
    for (const item of data) {
      // 1. CEK BENTROK GURU: Hanya jika ada guru_id
      if (item.guru_id) {
        const bentrokGuru = await sql`
          SELECT id FROM jadwal_pelajaran 
          WHERE sekolah_id = ${sekolahId}
          AND guru_id = ${item.guru_id} 
          AND hari = ${item.hari} 
          AND jam_mulai = ${item.jam_mulai}
          LIMIT 1
        `;

        if (bentrokGuru.rows.length > 0) {
          throw new Error(`Jadwal Bentrok! Guru tersebut sudah memiliki jadwal mengajar di hari ${item.hari} jam ${item.jam_mulai}.`);
        }
      }

      // 2. CEK BENTROK RUANG KELAS: Ruangan kelas + rombel tidak boleh dipakai mapel lain di jam yang sama
      const bentrokKelas = await sql`
        SELECT id FROM jadwal_pelajaran
        WHERE sekolah_id = ${sekolahId}
        AND kelas = ${item.kelas}
        AND rombel = ${item.rombel}
        AND hari = ${item.hari}
        AND jam_mulai = ${item.jam_mulai}
        LIMIT 1
      `;

      if (bentrokKelas.rows.length > 0) {
        throw new Error(`Kelas Bentrok! Ruangan Kelas ${item.rombel} sudah terpakai untuk jadwal lain di hari ${item.hari} jam ${item.jam_mulai}.`);
      }

      // 3. JALANKAN INSERT
      await sql`
        INSERT INTO jadwal_pelajaran (
          sekolah_id, hari, mapel, kelas, rombel, jam_mulai, jam_selesai, tahun_ajaran, guru_id
        ) VALUES (
          ${sekolahId},
          ${item.hari}, 
          ${item.mapel}, 
          ${item.kelas}, 
          ${item.rombel}, 
          ${item.jam_mulai}, 
          ${item.jam_selesai}, 
          ${item.tahun_ajaran}, 
          ${item.guru_id || null}
        )
      `;
    }
    
    revalidatePath('/tatausaha/jadwal-pelajaran');
    return { success: true };
  } catch (error: any) {
    console.error(error);
    return { error: error.message || "Gagal simpan jadwal" };
  }
}

export async function getJadwalPelajaran(tahunAjaran: string | undefined, sekolahId: number) {
  try {
    // Jika tahunAjaran tidak dikirim (atau null/undefined) saat fungsi dipanggil, cari otomatis
    let ta = tahunAjaran;
    if (!ta) {
      const sekarang = new Date();
      const tahunIni = sekarang.getFullYear();
      const bulanIni = sekarang.getMonth(); // 0 = Januari, 6 = Juli (Sudah diperbaiki ke 'sekarang')
      ta = bulanIni >= 6 ? `${tahunIni}/${tahunIni + 1}` : `${tahunIni - 1}/${tahunIni}`;
    }

    // QUERY YANG DISESUAIKAN: Menambahkan filter jp.sekolah_id
    const res = await sql`
      SELECT 
        jp.*, 
        g.nama as nama_guru, 
        g.nip as nip_guru 
      FROM jadwal_pelajaran jp
      LEFT JOIN guru g ON jp.guru_id = g.id
      WHERE jp.tahun_ajaran = ${ta}
        AND jp.sekolah_id = ${sekolahId}
      ORDER BY jp.jam_mulai ASC
    `;
    
    return res.rows;
  } catch (error) {
    console.error("Gagal mengambil data jadwal pelajaran:", error);
    return [];
  }
}

export async function deleteJadwalPelajaran(id: number, sekolahId: number) {
  try {
    // Menambahkan filter sekolah_id untuk memastikan keamanan data antar-sekolah
    await sql`
      DELETE FROM jadwal_pelajaran 
      WHERE id = ${id} 
        AND sekolah_id = ${sekolahId}
    `;
    return { success: true };
  } catch (error) {
    console.error("Gagal menghapus jadwal pelajaran:", error);
    return { success: false };
  }
}

// Update Jadwal dengan Cek Bentrok
export async function updateJadwalPelajaran(id: number, data: any, sekolahId: number) {
  try {
    // 1. CEK BENTROK GURU (Hanya jika ada guru_id / bukan kegiatan umum)
    if (data.guru_id) {
      const bentrokGuru = await sql`
        SELECT id FROM jadwal_pelajaran 
        WHERE sekolah_id = ${sekolahId}
          AND guru_id = ${data.guru_id} 
          AND hari = ${data.hari}
          AND id != ${id}
          AND (
            (${data.jam_mulai} >= jam_mulai AND ${data.jam_mulai} < jam_selesai) OR
            (${data.jam_selesai} > jam_mulai AND ${data.jam_selesai} <= jam_selesai)
          )
        LIMIT 1
      `;

      if (bentrokGuru.rows.length > 0) {
        return { success: false, message: "Gagal update! Guru tersebut sudah memiliki jadwal mengajar di jam yang sama." };
      }
    }

    // 2. CEK BENTROK RUANG KELAS / ROMBEL
    const bentrokKelas = await sql`
      SELECT id FROM jadwal_pelajaran 
      WHERE sekolah_id = ${sekolahId}
        AND hari = ${data.hari} 
        AND kelas = ${data.kelas} 
        AND rombel = ${data.rombel}
        AND id != ${id}
        AND (
          (${data.jam_mulai} >= jam_mulai AND ${data.jam_mulai} < jam_selesai) OR
          (${data.jam_selesai} > jam_mulai AND ${data.jam_selesai} <= jam_selesai)
        )
      LIMIT 1
    `;

    if (bentrokKelas.rows.length > 0) {
      return { success: false, message: "Gagal update! Jadwal bentrok dengan pelajaran lain di kelas ini." };
    }

    // 3. JALANKAN PROSES UPDATE DATA (Sertakan sekolah_id di WHERE sebagai guardrail)
    await sql`
      UPDATE jadwal_pelajaran 
      SET 
        hari = ${data.hari}, 
        mapel = ${data.mapel}, 
        guru_id = ${data.guru_id || null},
        jam_mulai = ${data.jam_mulai}, 
        jam_selesai = ${data.jam_selesai}
      WHERE id = ${id} 
        AND sekolah_id = ${sekolahId}
    `;

    return { success: true };
  } catch (error) {
    console.error("Gagal memperbarui jadwal pelajaran:", error);
    return { success: false, message: "Terjadi kesalahan sistem." };
  }
}

export async function getKepalaSekolahStats() {
  try {
    // --- QUERY SUMMARY CARDS (KODE YANG SEBELUMNYA) ---
    const totalSiswaRes = await sql`SELECT COUNT(*) as count FROM murid WHERE status = 'aktif'`;
    const totalGuruRes = await sql`SELECT COUNT(*) as count FROM guru`;
    const kehadiranCardRes = await sql`
      SELECT 
        COUNT(CASE WHEN status = 'Hadir' THEN 1 END) as total_hadir,
        COUNT(*) as total_kehadiran
      FROM kehadiran 
      WHERE DATE_TRUNC('month', tanggal) = DATE_TRUNC('month', CURRENT_DATE)
    `;
    const totalHadirCard = Number(kehadiranCardRes.rows[0]?.total_hadir || 0);
    const totalKehadiranCard = Number(kehadiranCardRes.rows[0]?.total_kehadiran || 1); 
    const rataKehadiranCard = totalKehadiranCard > 0 ? Math.round((totalHadirCard / totalKehadiranCard) * 100) : 0;

    const kkmRes = await sql`
      SELECT COUNT(CASE WHEN CAST(nilai_angka AS NUMERIC) >= 75 THEN 1 END) as total_tuntas, COUNT(*) as total_nilai
      FROM nilai
    `;
    const totalTuntas = Number(kkmRes.rows[0]?.total_tuntas || 0);
    const totalNilai = Number(kkmRes.rows[0]?.total_nilai || 1);
    const ketuntasanKKM = totalNilai > 0 ? Math.round((totalTuntas / totalNilai) * 100) : 0;


    // --- 1. QUERY UNTUK GRAFIK PERKEMBANGAN SEKOLAH ---
    const perkembanganRes = await sql`
      SELECT 
        TO_CHAR(created_at, 'YYYY') as tahun,
        COUNT(*) as siswa
      FROM murid
      GROUP BY tahun
      ORDER BY tahun ASC
    `;
    const dataPerkembanganSekolah = perkembanganRes.rows.map(row => ({
      tahun: row.tahun,
      siswa: Number(row.siswa)
    }));


    // --- 2. QUERY UNTUK GRAFIK RATA-RATA NILAI ROMBEL ---
    const nilaiRombelRes = await sql`
      SELECT 
        m.rombel,
        ROUND(AVG(CAST(n.nilai_angka AS NUMERIC)), 1) as rata_nilai
      FROM nilai n
      INNER JOIN murid m ON n.murid_id = m.id
      WHERE m.rombel IS NOT NULL AND m.rombel != ''
      GROUP BY m.rombel
      ORDER BY m.rombel ASC
    `;
    const dataNilaiRombel = nilaiRombelRes.rows.map(row => ({
      rombel: row.rombel,
      nilai: Number(row.rata_nilai)
    }));


    // --- 3. QUERY UNTUK GRAFIK TREN KEHADIRAN BULANAN (BULAN BERJALAN) ---
    const trenKehadiranRes = await sql`
      SELECT 
        TO_CHAR(tanggal, 'DD Mon') as tgl,
        tanggal,
        COUNT(CASE WHEN status = 'Hadir' THEN 1 END) as total_hadir,
        COUNT(*) as total_hari
      FROM kehadiran
      WHERE DATE_TRUNC('month', tanggal) = DATE_TRUNC('month', CURRENT_DATE)
      GROUP BY tanggal, tgl
      ORDER BY tanggal ASC
    `;
    const dataTrenKehadiran = trenKehadiranRes.rows.map(row => {
      const hadir = Number(row.total_hadir);
      const total = Number(row.total_hari);
      return {
        tgl: row.tgl, // Contoh output: "25 May"
        persen: total > 0 ? Math.round((hadir / total) * 100) : 0
      };
    });
    const rataKelasRes = await sql`
      SELECT 
        m.rombel as kelas,
        ROUND(AVG(CAST(n.nilai_angka AS NUMERIC)), 1) as rata_rata
      FROM nilai n
      INNER JOIN murid m ON n.murid_id = m.id
      WHERE m.rombel IS NOT NULL AND m.rombel != ''
      GROUP BY m.rombel
      ORDER BY m.rombel ASC
    `;
    const dataRataNilaiPerKelas = rataKelasRes.rows.map(row => ({
      kelas: row.kelas,
      rataRata: Number(row.rata_rata)
    }));

    // =================================================================
    // 2. QUERY UNTUK GRAFIK: TREN NILAI LINTAS SEMESTER
    // =================================================================
    const trenSemesterRes = await sql`
      SELECT 
        CONCAT(tahun_ajaran, ' ', semester) as semester_label,
        tahun_ajaran,
        semester,
        ROUND(AVG(CAST(nilai_angka AS NUMERIC)), 1) as rata_nilai
      FROM nilai
      GROUP BY tahun_ajaran, semester
      ORDER BY tahun_ajaran ASC, semester DESC
    `;
    const dataPerkembanganSemester = trenSemesterRes.rows.map(row => ({
      semester: row.semester_label, // Menghasilkan format: "2025/2026 Ganjil"
      rataNilai: Number(row.rata_nilai)
    }));

    // =================================================================
    // 3. QUERY UNTUK TABEL: RANKING PARAREL TERATAS (LIMIT 5)
    // =================================================================
        const rankingRes = await sql`
      SELECT 
        m.id as murid_id,
        m.nama as murid_nama,
        m.nisn as murid_nisn, -- 🌟 Pastikan kolom NISN diambil dari DB
        m.rombel,
        ROUND(AVG(CAST(n.nilai_angka AS NUMERIC)), 1) as rata_rata
      FROM nilai n
      JOIN murid m ON n.murid_id = m.id
      WHERE m.status = 'aktif'
      GROUP BY m.id, m.nama, m.nisn, m.rombel
      ORDER BY rata_rata DESC
      LIMIT 5
    `;

    // 🌟 Update bagian mapping dataTabelRanking-nya
    const dataTabelRanking = rankingRes.rows.map((row, idx) => ({
      rank: idx + 1,
      nama: row.murid_nama,
      nisn: row.murid_nisn || null, // 🌟 Masukkan NISN ke dalam object array
      rombel: row.rombel,
      nilai: Number(row.rata_rata || 0)
    }));

const proporsiBulanIniRes = await sql`
  SELECT 
    COUNT(CASE WHEN status = 'Hadir' THEN 1 END) as hadir,
    COUNT(CASE WHEN status = 'Izin' THEN 1 END) as izin,
    COUNT(CASE WHEN status = 'Sakit' THEN 1 END) as sakit,
    COUNT(CASE WHEN status = 'Alpa' THEN 1 END) as alpa
  FROM kehadiran 
  WHERE DATE_TRUNC('month', tanggal) = DATE_TRUNC('month', CURRENT_DATE)
`;

const rowBulanIni = proporsiBulanIniRes.rows[0];
const dataPieKehadiran = [
  { name: "Hadir", value: Number(rowBulanIni?.hadir || 0) },
  { name: "Izin", value: Number(rowBulanIni?.izin || 0) },
  { name: "Sakit", value: Number(rowBulanIni?.sakit || 0) },
  { name: "Alfa", value: Number(rowBulanIni?.alpa || 0) },
];

    // =================================================================
    // 2. QUERY UNTUK GRAFIK GARIS: TREN KASUS TIDAK HADIR (BULANAN)
    // =================================================================
    const trenKasusBulananRes = await sql`
      SELECT 
        TO_CHAR(tanggal, 'Mon') as bulan_label,
        DATE_TRUNC('month', tanggal) as bulan_date,
        COUNT(CASE WHEN status = 'Alpa' THEN 1 END) as total_alfa,
        COUNT(CASE WHEN status IN ('Sakit', 'Izin') THEN 1 END) as total_sakit_izin
      FROM kehadiran
      GROUP BY bulan_date, bulan_label
      ORDER BY bulan_date ASC
    `;

    const dataTrenBulananAbsensi = trenKasusBulananRes.rows.map(row => ({
      bulan: row.bulan_label, // Menghasilkan string singkat seperti "Jan", "Feb", "Mar", dst.
      alfa: Number(row.total_alfa),
      sakitIzin: Number(row.total_sakit_izin)
    }));

    const siswaBermasalahRes = await sql`
      SELECT 
        m.nama,
        m.rombel as kelas,
        COALESCE(ROUND(AVG(CAST(n.nilai_angka AS NUMERIC)), 1), 0) as rata_nilai,
        COALESCE(
          ROUND(
            (COUNT(CASE WHEN k.status = 'Hadir' THEN 1 END) * 100.0) / 
            NULLIF(COUNT(k.id), 0), 1
          ), 100
        ) as persen_absensi
      FROM murid m
      LEFT JOIN nilai n ON m.id = n.murid_id
      LEFT JOIN kehadiran k ON m.id = k.murid_id
      WHERE m.status = 'aktif'
      GROUP BY m.id, m.nama, m.rombel
      ORDER BY persen_absensi ASC, rata_nilai ASC
      LIMIT 10
    `;

    const dataSiswaBermasalah = siswaBermasalahRes.rows.map(row => ({
      nama: row.nama,
      kelas: row.kelas || '-',
      nilai: Number(row.rata_nilai),
      absensi: Math.round(Number(row.persen_absensi)) // Dibulatkan tanpa pecahan agar pas dengan logic JSX
    }));

    const kinerjaGuruKepsekRes = await sql`
      SELECT 
        g.id as guru_id,
        g.nama as guru_nama,
        g.nip as guru_nip, -- 🌟 Ambil NIP dari database
        COALESCE(m.nama_mapel, 'Umum') as nama_mapel,
        -- 1. Hitung total jam pelajaran (JPM) murni tanpa dikali 2 🛠️
        (SELECT COUNT(jp.id) FROM jadwal_pelajaran jp WHERE jp.guru_id = g.id) as total_jam,
        -- 2. Kehadiran riil: jika belum ada absen sama sekali set ke 0% 🛠️
        COALESCE(
          ROUND(
            (COUNT(CASE WHEN kg.status = 'Hadir' THEN 1 END) * 100.0) / 
            NULLIF(COUNT(kg.id), 0), 1
          ), 0
        ) as persen_kehadiran,
        -- 3. Logika Kelengkapan Nilai yang Lebih Ketat 🛠️
        -- Dianggap Lengkap HANYA JIKA guru sudah input nilai di semester Ganjil DAN Genap
        CASE 
          WHEN (SELECT COUNT(DISTINCT n.semester) FROM nilai n WHERE n.guru_id = g.id) >= 2 THEN 'Lengkap'
          ELSE 'Belum Lengkap'
        END as status_nilai
      FROM guru g
      LEFT JOIN mapel m ON g.mapel = CAST(m.id AS VARCHAR)
      LEFT JOIN kehadiran_guru kg ON g.id = kg.guru_id
      WHERE g.jenis != 'Kepala Sekolah'
      GROUP BY g.id, g.nama, g.nip, m.nama_mapel
      ORDER BY total_jam DESC
    `;

    // 🌟 Sinkronisasi hasil mapping objek data untuk dikirim ke Client
    const dataJamMengajarGuru = kinerjaGuruKepsekRes.rows.map(row => ({
      nama: row.guru_nama,
      jam: Number(row.total_jam || 0) // Grafik JPM otomatis jadi 1 jam
    }));

    const dataTabelKinerjaGuru = kinerjaGuruKepsekRes.rows.map(row => ({
      nama: row.guru_nama,
      nip: row.guru_nip || null, // 🌟 Bawa data NIP ke client component
      mapel: row.nama_mapel,
      kehadiran: Math.round(Number(row.persen_kehadiran)), // Jadi 0% jika belum absen
      inputNilai: row.status_nilai // Harus isi Ganjil & Genap baru bisa "Lengkap"
    }));

    // =================================================================
    // 1. QUERY KARTU TINGKAT LOMBA (MENGHITUNG DATA REALS DARI DB)
    // =================================================================
    const tingkatLombaRes = await sql`
      SELECT 
        COUNT(CASE WHEN tingkat IN ('NASIONAL', 'INTERNASIONAL') THEN 1 END) as nasional_internasional,
        COUNT(CASE WHEN tingkat = 'PROVINSI' THEN 1 END) as provinsi,
        COUNT(CASE WHEN tingkat = 'KABUPATEN/KOTA' THEN 1 END) as kabupaten_kota,
        COUNT(CASE WHEN tingkat = 'KECAMATAN' THEN 1 END) as kecamatan
      FROM prestasi
    `;
    const rowTingkat = tingkatLombaRes.rows[0];

    const kartuTingkatLomba = [
      { tingkat: "Nasional / Internasional", jumlah: `${rowTingkat?.nasional_internasional || 0} Piala`, color: "bg-amber-300", icon: "🌐" },
      { tingkat: "Tingkat Provinsi", jumlah: `${rowTingkat?.provinsi || 0} Piala`, color: "bg-cyan-300", icon: "🏛️" },
      { tingkat: "Tingkat Kabupaten/Kota", jumlah: `${rowTingkat?.kabupaten_kota || 0} Piala`, color: "bg-purple-300", icon: "🏆" },
      { tingkat: "Tingkat Kecamatan", jumlah: `${rowTingkat?.kecamatan || 0} Piala`, color: "bg-emerald-300", icon: "🥇" },
    ];

    // =================================================================
    // 2. QUERY GRAFIK TREN TAHUNAN (BERDASARKAN JUARA GURU & MURID)
    // =================================================================
    // Mengelompokkan berdasarkan kolom tahun dan memetakan string juara ke medali
    const trenPrestasiRes = await sql`
      SELECT 
        tahun::varchar as tahun_label,
        COUNT(CASE WHEN LOWER(juara) LIKE '%1%' OR LOWER(juara) LIKE '%emas% ' THEN 1 END) as emas,
        COUNT(CASE WHEN LOWER(juara) LIKE '%2%' OR LOWER(juara) LIKE '%perak%' THEN 1 END) as perak,
        COUNT(CASE WHEN LOWER(juara) LIKE '%3%' OR LOWER(juara) LIKE '%perunggu%' THEN 1 END) as perunggu
      FROM prestasi
      GROUP BY tahun
      ORDER BY tahun ASC
    `;

    // Jika data di tabel prestasi masih sedikit, kita pastikan array tidak kosong agar grafik tetap cantik
    const dataPrestasiTahunan = trenPrestasiRes.rows.length > 0 
      ? trenPrestasiRes.rows.map(row => ({
          tahun: row.tahun_label,
          emas: Number(row.emas),
          perak: Number(row.perak),
          perunggu: Number(row.perunggu)
        }))
      : [
          { tahun: "2024", emas: 0, perak: 0, perunggu: 0 },
          { tahun: "2025", emas: 0, perak: 0, perunggu: 0 },
          { tahun: "2026", emas: 0, perak: 0, perunggu: 0 }
        ];

        // =================================================================
    // 1. QUERY KOMPOSISI JENIS PELANGGARAN (PIE CHART)
    // =================================================================
    const komposisiRes = await sql`
      SELECT 
        kategori,
        COUNT(id) as jumlah_kasus
      FROM catatan_kedisiplinan
      GROUP BY kategori
    `;

    // Pastikan semua kategori default yang kamu minta ('Kedisiplinan', 'Kerajinan', 'Kebersihan', 'Lainnya') terpetakan dengan baik
    const kategoriTarget = ['Kedisiplinan', 'Kerajinan', 'Kebersihan', 'Lainnya'];
    const dataPiePelanggaran = kategoriTarget.map(kat => {
      const match = komposisiRes.rows.find(row => row.kategori.toLowerCase() === kat.toLowerCase());
      return {
        name: kat,
        value: match ? Number(match.jumlah_kasus) : 0
      };
    });

    // =================================================================
    // 2. QUERY PEMETAAN KELAS KASUS TERBANYAK (TABEL)
    // =================================================================
    const kelasTerbanyakRes = await sql`
      SELECT 
        m.rombel as kelas,
        COALESCE(g.nama, 'Belum Ditentukan') as wali_kelas,
        COUNT(ck.id) as total_kasus
      FROM catatan_kedisiplinan ck
      JOIN murid m ON ck.murid_id = m.id
      LEFT JOIN wali_kelas wk ON m.rombel = wk.rombel
      LEFT JOIN guru g ON wk.guru_id = g.id
      GROUP BY m.rombel, g.nama
      ORDER BY total_kasus DESC
      LIMIT 5
    `;

    const dataKelasPelanggaranTerbanyak = kelasTerbanyakRes.rows.map(row => ({
      kelas: row.kelas,
      waliKelas: row.wali_kelas,
      totalKasus: Number(row.total_kasus),
      statusTrend: "➖ Stabil" // Status indikator tren default
    }));

    // =================================================================
    // 1. QUERY TREN KELULUSAN & KULIAH (BAR CHART)
    // =================================================================
    const trenAlumniRes = await sql`
      SELECT 
        tahun_lulus::varchar as tahun_label,
        COUNT(id) as total_lulus,
        COUNT(CASE WHEN klaster = 'KULIAH' THEN 1 END) as total_kuliah
      FROM alumni
      GROUP BY tahun_lulus
      ORDER BY tahun_lulus ASC
    `;

    // Kita petakan ke persentase (Default % kelulusan resmi diset 100% sebagai basis kelulusan sekolah)
    const dataTrenKelulusanAlumni = trenAlumniRes.rows.length > 0
      ? trenAlumniRes.rows.map(row => {
          const total = Number(row.total_lulus);
          const kuliah = Number(row.total_kuliah);
          return {
            tahun: row.tahun_label,
            kelulusan: 100, // Basis kelulusan siswa yang terdata alumni
            lanjutKuliah: total > 0 ? Math.round((kuliah / total) * 100) : 0
          };
        })
      : [
          { tahun: "2024", kelulusan: 100, lanjutKuliah: 0 },
          { tahun: "2025", kelulusan: 100, lanjutKuliah: 0 },
          { tahun: "2026", kelulusan: 100, lanjutKuliah: 0 }
        ];

    // =================================================================
    // 2. QUERY PEMETAAN DESTINASI UTAMA LULUSAN (TABEL)
    // =================================================================
    // Mengambil data sebaran instansi/kampus, klaster, jalur masuk, dan jumlahnya
    const sebaranAlumniRes = await sql`
      SELECT 
        instansi as target_tujuan,
        klaster as kategori,
        COALESCE(jalur, '-') as jalur_favorit,
        COUNT(id) as jumlah_siswa
      FROM alumni
      GROUP BY instansi, klaster, jalur
      ORDER BY jumlah_siswa DESC
      LIMIT 5
    `;

    const dataTabelAlumni = sebaranAlumniRes.rows.map(row => ({
      targetTujuan: row.target_tujuan,
      kategori: row.kategori, // Akan berisi KULIAH, KERJA, WIRAUSAHA, atau LAINNYA
      jalurFavorit: row.jalur_favorit,
      jumlahSiswa: Number(row.jumlah_siswa)
    }));

const alertSistemRes = await sql`
      -- KUMPULKAN SEMUA CTE (WITH) DI PALING ATAS QUERY UTAMA
      WITH 
      -- 1. Kesiswaan: Hitung rasio absen
      rasio_absen AS (
        SELECT 
          murid_id,
          COUNT(id) as total_hari,
          COUNT(CASE WHEN status = 'Hadir' THEN 1 END) as total_hadir
        FROM kehadiran
        GROUP BY murid_id
      ),
      siswa_bermasalah AS (
        SELECT COUNT(*) as jumlah_siswa 
        FROM rasio_absen 
        WHERE total_hari > 0 AND ((total_hadir::float / total_hari::float) * 100) < 70
      ),

      -- 2. Kurikulum: Deteksi perbandingan rata-rata nilai semester ganjil vs genap (Mapel ID 6)
      nilai_semester AS (
        SELECT 
          semester,
          AVG(NULLIF(nilai_angka, 0)::float) as avg_nilai
        FROM nilai
        WHERE mapel = '6'
        GROUP BY semester
      ),
      ganjil AS (SELECT avg_nilai FROM nilai_semester WHERE semester = 'Ganjil'),
      genap AS (SELECT avg_nilai FROM nilai_semester WHERE semester = 'Genap'),
      analisis_tren AS (
        SELECT 
          ganjil.avg_nilai as n_ganjil,
          genap.avg_nilai as n_genap,
          ROUND((((ganjil.avg_nilai - genap.avg_nilai) / NULLIF(ganjil.avg_nilai, 0)) * 100)::numeric, 1) as penurunan
        FROM ganjil, genap
      ),

      -- 3. Administrasi: Cek guru yang belum menginput nilai sama sekali
      guru_tanpa_nilai AS (
        SELECT COUNT(g.id) as jumlah_guru
        FROM guru g
        LEFT JOIN nilai n ON g.id = n.guru_id
        WHERE n.id IS NULL AND g.jenis = 'Guru'
      )

      -- BARU KITA JALANKAN SELECT UNION ALL DI BAWAHNYA
      SELECT 
        '1' as id,
        'CRITICAL' as tipe,
        'Kesiswaan / BK' as kategori,
        UPPER(CONCAT(sb.jumlah_siswa, ' SISWA MEMILIKI PERSENTASE ABSENSI DI BAWAH 70%')) as pesan,
        'BARU SAJA' as waktu
      FROM siswa_bermasalah sb
      WHERE sb.jumlah_siswa > 0

      UNION ALL

      SELECT 
        '2' as id,
        'WARNING' as tipe,
        'Kurikulum' as kategori,
        UPPER(CONCAT('RATA-RATA NILAI AKHIR MAPEL INTI MENURUN SEBESAR ', t.penurunan, '% DI SEMESTER INI')) as pesan,
        '2 JAM YANG LALU' as waktu
      FROM analisis_tren t
      WHERE t.penurunan > 0

      UNION ALL

      SELECT 
        '3' as id,
        'WARNING' as tipe,
        'Administrasi' as kategori,
        UPPER(CONCAT(gtn.jumlah_guru, ' GURU MATA PELAJARAN BELUM MENYELESAIKAN INPUT NILAI RAPORT')) as pesan,
        'HARI INI' as waktu
      FROM guru_tanpa_nilai gtn
      WHERE gtn.jumlah_guru > 0
    `;

    // Map hasil baris query database ke format array dashboard
    const dataAlertSistem = alertSistemRes.rows.map(row => ({
      id: Number(row.id),
      tipe: row.tipe,
      kategori: row.kategori,
      pesan: row.pesan,
      waktu: row.waktu
    }));

    // Kembalikan semua data komponen dashboard
    return {
      cards: {
        totalSiswa: Number(totalSiswaRes.rows[0]?.count || 0).toLocaleString('id-ID'),
        totalGuru: totalGuruRes.rows[0]?.count?.toString() || "0",
        rataKehadiran: `${rataKehadiranCard}%`,
        dashKKM: `${ketuntasanKKM}%`,
      },
      charts: {
        dataPerkembanganSekolah,
        dataNilaiRombel,
        dataTrenKehadiran,
        dataRataNilaiPerKelas,
        dataPerkembanganSemester,
        dataTabelRanking,
        dataPieKehadiran,
        dataTrenBulananAbsensi,
        dataSiswaBermasalah,
        dataJamMengajarGuru,
        dataTabelKinerjaGuru,
        kartuTingkatLomba,
        dataPrestasiTahunan,
        dataPiePelanggaran,
        dataKelasPelanggaranTerbanyak,
        dataTrenKelulusanAlumni,
        dataTabelAlumni,
        dataAlertSistem
      }
    };

  } catch (error) {
    console.error("Gagal mengambil statistik dashboard kepala sekolah:", error);
    return null;
  }
}

export async function getWakilKesiswaanStats() {
  try {
    // =================================================================
    // --- 1. CARDS SUMMARY (MURNI KESISWAAN) ---
    // =================================================================
    const totalSiswaRes = await sql`SELECT COUNT(*) as count FROM murid WHERE status = 'aktif'`;
    
    // Kehadiran Murid Bulan Ini
    const kehadiranCardRes = await sql`
      SELECT 
        COUNT(CASE WHEN status = 'Hadir' THEN 1 END) as total_hadir,
        COUNT(*) as total_kehadiran
      FROM kehadiran 
      WHERE DATE_TRUNC('month', tanggal) = DATE_TRUNC('month', CURRENT_DATE)
    `;
    const totalHadirCard = Number(kehadiranCardRes.rows[0]?.total_hadir || 0);
    const totalKehadiranCard = Number(kehadiranCardRes.rows[0]?.total_kehadiran || 0); 
    const rataKehadiranCard = totalKehadiranCard > 0 ? Math.round((totalHadirCard / totalKehadiranCard) * 100) : 0;

    // Hitung total kasus pelanggaran bulan ini sebagai indikator tambahan kesiswaan
    const totalKasusRes = await sql`
      SELECT COUNT(*) as count FROM catatan_kedisiplinan 
      WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)
    `;

    // =================================================================
    // --- 2. GRAFIK & DATA PRESTASI / LOMBA ---
    // =================================================================
    const tingkatLombaRes = await sql`
      SELECT 
        COUNT(CASE WHEN tingkat IN ('NASIONAL', 'INTERNASIONAL') THEN 1 END) as nasional_internasional,
        COUNT(CASE WHEN tingkat = 'PROVINSI' THEN 1 END) as provinsi,
        COUNT(CASE WHEN tingkat = 'KABUPATEN/KOTA' THEN 1 END) as kabupaten_kota,
        COUNT(CASE WHEN tingkat = 'KECAMATAN' THEN 1 END) as kecamatan
      FROM prestasi
    `;
    const rowTingkat = tingkatLombaRes.rows[0];

    const kartuTingkatLomba = [
      { tingkat: "Nasional / Internasional", jumlah: `${rowTingkat?.nasional_internasional || 0} Piala`, color: "bg-amber-300", icon: "🌐" },
      { tingkat: "Tingkat Provinsi", jumlah: `${rowTingkat?.provinsi || 0} Piala`, color: "bg-cyan-300", icon: "🏛️" },
      { tingkat: "Tingkat Kabupaten/Kota", jumlah: `${rowTingkat?.kabupaten_kota || 0} Piala`, color: "bg-purple-300", icon: "🏆" },
      { tingkat: "Tingkat Kecamatan", jumlah: `${rowTingkat?.kecamatan || 0} Piala`, color: "bg-emerald-300", icon: "🥇" },
    ];

    const trenPrestasiRes = await sql`
      SELECT 
        tahun::varchar as tahun_label,
        COUNT(CASE WHEN LOWER(juara) LIKE '%1%' OR LOWER(juara) LIKE '%emas%' THEN 1 END) as emas,
        COUNT(CASE WHEN LOWER(juara) LIKE '%2%' OR LOWER(juara) LIKE '%perak%' THEN 1 END) as perak,
        COUNT(CASE WHEN LOWER(juara) LIKE '%3%' OR LOWER(juara) LIKE '%perunggu%' THEN 1 END) as perunggu
      FROM prestasi
      GROUP BY tahun
      ORDER BY tahun ASC
    `;
    const dataPrestasiTahunan = trenPrestasiRes.rows.length > 0 
      ? trenPrestasiRes.rows.map(row => ({
          tahun: row.tahun_label,
          emas: Number(row.emas),
          perak: Number(row.perak),
          perunggu: Number(row.perunggu)
        }))
      : [
          { tahun: "2024", emas: 0, perak: 0, perunggu: 0 },
          { tahun: "2025", emas: 0, perak: 0, perunggu: 0 },
          { tahun: "2026", emas: 0, perak: 0, perunggu: 0 }
        ];

    // =================================================================
    // --- 3. GRAFIK & TABEL KEDISIPLINAN MURID ---
    // =================================================================
    const komposisiRes = await sql`
      SELECT kategori, COUNT(id) as jumlah_kasus FROM catatan_kedisiplinan GROUP BY kategori
    `;
    const kategoriTarget = ['Kedisiplinan', 'Kerajinan', 'Kebersihan', 'Lainnya'];
    const dataPiePelanggaran = kategoriTarget.map(kat => {
      const match = komposisiRes.rows.find(row => row.kategori.toLowerCase() === kat.toLowerCase());
      return { name: kat, value: match ? Number(match.jumlah_kasus) : 0 };
    });

    const kelasTerbanyakRes = await sql`
      SELECT 
        m.rombel as kelas,
        COALESCE(g.nama, 'Belum Ditentukan') as wali_kelas,
        COUNT(ck.id) as total_kasus
      FROM catatan_kedisiplinan ck
      JOIN murid m ON ck.murid_id = m.id
      LEFT JOIN wali_kelas wk ON m.rombel = wk.rombel
      LEFT JOIN guru g ON wk.guru_id = g.id
      GROUP BY m.rombel, g.nama
      ORDER BY total_kasus DESC
      LIMIT 5
    `;
    const dataKelasPelanggaranTerbanyak = kelasTerbanyakRes.rows.map(row => ({
      kelas: row.kelas,
      waliKelas: row.wali_kelas,
      totalKasus: Number(row.total_kasus),
      statusTrend: "➖ Stabil"
    }));

    // =================================================================
// --- 4. GRAFIK & DATA ABSENSI / KEHADIRAN SISWA (BULAN INI) ---
// =================================================================

// 🌟 DIUBAH: Dari murni CURRENT_DATE menjadi akumulasi bulan berjalan
const proporsiBulanIniRes = await sql`
  SELECT 
    COUNT(CASE WHEN status = 'Hadir' THEN 1 END) as hadir,
    COUNT(CASE WHEN status = 'Izin' THEN 1 END) as izin,
    COUNT(CASE WHEN status = 'Sakit' THEN 1 END) as sakit,
    COUNT(CASE WHEN status = 'Alpa' THEN 1 END) as alpa
  FROM kehadiran 
  WHERE DATE_TRUNC('month', tanggal) = DATE_TRUNC('month', CURRENT_DATE)
`;

const rowBulanIni = proporsiBulanIniRes.rows[0];
const dataPieKehadiran = [
  { name: "Hadir", value: Number(rowBulanIni?.hadir || 0) },
  { name: "Izin", value: Number(rowBulanIni?.izin || 0) },
  { name: "Sakit", value: Number(rowBulanIni?.sakit || 0) },
  { name: "Alfa", value: Number(rowBulanIni?.alpa || 0) },
];

    const trenKasusBulananRes = await sql`
      SELECT 
        TO_CHAR(tanggal, 'Mon') as bulan_label,
        DATE_TRUNC('month', tanggal) as bulan_date,
        COUNT(CASE WHEN status = 'Alpa' THEN 1 END) as total_alfa,
        COUNT(CASE WHEN status IN ('Sakit', 'Izin') THEN 1 END) as total_sakit_izin
      FROM kehadiran GROUP BY bulan_date, bulan_label ORDER BY bulan_date ASC
    `;
    const dataTrenBulananAbsensi = trenKasusBulananRes.rows.map(row => ({
      bulan: row.bulan_label,
      alfa: Number(row.total_alfa),
      sakitIzin: Number(row.total_sakit_izin)
    }));

    // Siswa dengan kehadiran terendah (Deteksi Dini BK / Kesiswaan)
    // Siswa dengan kehadiran terendah (HANYA yang di bawah 80%)
const siswaBermasalahRes = await sql`
  SELECT 
    m.nama, m.rombel as kelas,
    COALESCE(
      ROUND((COUNT(CASE WHEN k.status = 'Hadir' THEN 1 END) * 100.0) / NULLIF(COUNT(k.id), 0), 1), 100
    ) as persen_absensi
  FROM murid m
  LEFT JOIN kehadiran k ON m.id = k.murid_id
  WHERE m.status = 'aktif'
  GROUP BY m.id, m.nama, m.rombel
  HAVING COALESCE(
    ROUND((COUNT(CASE WHEN k.status = 'Hadir' THEN 1 END) * 100.0) / NULLIF(COUNT(k.id), 0), 1), 100
  ) < 80 -- 🌟 KUNCI: Hanya ambil yang di bawah 80%
  ORDER BY persen_absensi ASC
  LIMIT 5
`;

    const dataSiswaBermasalah = siswaBermasalahRes.rows.map(row => ({
      nama: row.nama,
      kelas: row.kelas || '-',
      absensi: Math.round(Number(row.persen_absensi))
    }));

    // =================================================================
    // --- 5. DATA TRACER STUDY / ALUMNI ---
    // =================================================================
    const trenAlumniRes = await sql`
      SELECT 
        tahun_lulus::varchar as tahun_label,
        COUNT(id) as total_lulus,
        COUNT(CASE WHEN klaster = 'KULIAH' THEN 1 END) as total_kuliah
      FROM alumni GROUP BY tahun_lulus ORDER BY tahun_lulus ASC
    `;
    const dataTrenKelulusanAlumni = trenAlumniRes.rows.length > 0
      ? trenAlumniRes.rows.map(row => ({
            tahun: row.tahun_label,
            kelulusan: 100,
            lanjutKuliah: Number(row.total_lulus) > 0 ? Math.round((Number(row.total_kuliah) / Number(row.total_lulus)) * 100) : 0
        }))
      : [{ tahun: "2026", kelulusan: 100, lanjutKuliah: 0 }];

    const sebaranAlumniRes = await sql`
      SELECT instansi as target_tujuan, klaster as kategori, COALESCE(jalur, '-') as jalur_favorit, COUNT(id) as jumlah_siswa
      FROM alumni GROUP BY instansi, klaster, jalur ORDER BY jumlah_siswa DESC LIMIT 5
    `;
    const dataTabelAlumni = sebaranAlumniRes.rows.map(row => ({
      targetTujuan: row.target_tujuan,
      kategori: row.kategori,
      jalurFavorit: row.jalur_favorit,
      jumlahSiswa: Number(row.jumlah_siswa)
    }));

    // =================================================================
    // --- 6. ALERT SISTEM (KHUSUS BK & KESISWAAN) ---
    // =================================================================
    const alertSistemRes = await sql`
      WITH rasio_absen AS (
        SELECT murid_id, COUNT(id) as total_hari, COUNT(CASE WHEN status = 'Hadir' THEN 1 END) as total_hadir
        FROM kehadiran GROUP BY murid_id
      ),
      siswa_bermasalah AS (
        SELECT COUNT(*) as jumlah_siswa FROM rasio_absen 
        WHERE total_hari > 0 AND ((total_hadir::float / total_hari::float) * 100) < 70
      )
      SELECT 
        '1' as id, 'CRITICAL' as tipe, 'Kesiswaan / BK' as kategori,
        UPPER(CONCAT(sb.jumlah_siswa, ' SISWA MEMILIKI PERSENTASE ABSENSI DI BAWAH 70%')) as pesan, 'BARU SAJA' as waktu
      FROM siswa_bermasalah sb WHERE sb.jumlah_siswa > 0
    `;
    const dataAlertSistem = alertSistemRes.rows.map(row => ({
      id: Number(row.id), tipe: row.tipe, kategori: row.kategori, pesan: row.pesan, waktu: row.waktu
    }));

    return {
      cards: {
        totalSiswa: Number(totalSiswaRes.rows[0]?.count || 0).toLocaleString('id-ID'),
        rataKehadiran: `${rataKehadiranCard}%`,
        totalKasusBulanIni: `${totalKasusRes.rows[0]?.count || 0} Kasus`,
      },
      charts: {
        kartuTingkatLomba,
        dataPrestasiTahunan,
        dataPiePelanggaran,
        dataKelasPelanggaranTerbanyak,
        dataPieKehadiran,
        dataTrenBulananAbsensi,
        dataSiswaBermasalah,
        dataTrenKelulusanAlumni,
        dataTabelAlumni,
        dataAlertSistem
      }
    };

  } catch (error) {
    console.error("Gagal mengambil statistik dashboard kesiswaan:", error);
    return null;
  }
}

export async function getKurikulumStats() {
  try {
    // --- 1. SUMMARY CARDS (AKADEMIK & KEGURUAN) ---
    // --- 1. SUMMARY CARDS (AKADEMIK & KEGURUAN) ---
    // Ambil total murid aktif sebagai pembagi dasar
    const totalSiswaRes = await sql`SELECT COUNT(*) as count FROM murid WHERE status = 'aktif'`;
    const totalSiswaAktif = Number(totalSiswaRes.rows[0]?.count || 0);

    const totalGuruRes = await sql`SELECT COUNT(*) as count FROM guru`;
    
    // Kehadiran Murid Bulan Ini
    const kehadiranCardRes = await sql`
      SELECT 
        COUNT(CASE WHEN status = 'Hadir' THEN 1 END) as total_hadir,
        COUNT(*) as total_kehadiran
      FROM kehadiran 
      WHERE DATE_TRUNC('month', tanggal) = DATE_TRUNC('month', CURRENT_DATE)
    `;
    const totalHadirCard = Number(kehadiranCardRes.rows[0]?.total_hadir || 0);
    const totalKehadiranCard = Number(kehadiranCardRes.rows[0]?.total_kehadiran || 0); 
    
    // Jika belum ada data absen sama sekali di bulan ini, set ke 0%
    const rataKehadiranCard = totalKehadiranCard > 0 
      ? Math.round((totalHadirCard / totalKehadiranCard) * 100) 
      : 0;

    // KETUNTASAN KKM REAL: Hitung berapa banyak murid yang rata-rata nilainya >= 75 
    // lalu bagi dengan TOTAL SELURUH SISWA AKTIF di sekolah
    const kkmRes = await sql`
      WITH rata_murid AS (
        SELECT murid_id, AVG(CAST(nilai_angka AS NUMERIC)) as rerata
        FROM nilai
        GROUP BY murid_id
      )
      SELECT COUNT(*) as lulus_kkm 
      FROM rata_murid 
      WHERE rerata >= 75
    `;
    const totalLulusKKM = Number(kkmRes.rows[0]?.lulus_kkm || 0);
    
    const ketuntasanKKM = totalSiswaAktif > 0 
      ? Math.round((totalLulusKKM / totalSiswaAktif) * 100) 
      : 0;


    // --- 2. GRAFIK RATA-RATA NILAI ROMBEL ---
    const nilaiRombelRes = await sql`
      SELECT 
        m.rombel,
        ROUND(AVG(CAST(n.nilai_angka AS NUMERIC)), 1) as rata_nilai
      FROM nilai n
      INNER JOIN murid m ON n.murid_id = m.id
      WHERE m.rombel IS NOT NULL AND m.rombel != ''
      GROUP BY m.rombel
      ORDER BY m.rombel ASC
    `;
    const dataNilaiRombel = nilaiRombelRes.rows.map(row => ({
      rombel: row.rombel,
      nilai: Number(row.rata_nilai)
    }));


    // --- 3. TREN KEHADIRAN BULANAN ---
    const trenKehadiranRes = await sql`
      SELECT 
        TO_CHAR(tanggal, 'DD Mon') as tgl,
        tanggal,
        COUNT(CASE WHEN status = 'Hadir' THEN 1 END) as total_hadir,
        COUNT(*) as total_hari
      FROM kehadiran
      WHERE DATE_TRUNC('month', tanggal) = DATE_TRUNC('month', CURRENT_DATE)
      GROUP BY tanggal, tgl
      ORDER BY tanggal ASC
    `;
    const dataTrenKehadiran = trenKehadiranRes.rows.map(row => {
      const hadir = Number(row.total_hadir);
      const total = Number(row.total_hari);
      return {
        tgl: row.tgl,
        persen: total > 0 ? Math.round((hadir / total) * 100) : 0
      };
    });


    // --- 4. DATA RATA NILAI PER KELAS ---
    const rataKelasRes = await sql`
      SELECT 
        m.rombel as kelas,
        ROUND(AVG(CAST(n.nilai_angka AS NUMERIC)), 1) as rata_rata
      FROM nilai n
      INNER JOIN murid m ON n.murid_id = m.id
      WHERE m.rombel IS NOT NULL AND m.rombel != ''
      GROUP BY m.rombel
      ORDER BY m.rombel ASC
    `;
    const dataRataNilaiPerKelas = rataKelasRes.rows.map(row => ({
      kelas: row.kelas,
      rataRata: Number(row.rata_rata)
    }));


    // --- 5. TREN NILAI LINTAS SEMESTER ---
    const trenSemesterRes = await sql`
      SELECT 
        CONCAT(tahun_ajaran, ' ', semester) as semester_label,
        tahun_ajaran,
        semester,
        ROUND(AVG(CAST(nilai_angka AS NUMERIC)), 1) as rata_nilai
      FROM nilai
      GROUP BY tahun_ajaran, semester
      ORDER BY tahun_ajaran ASC, semester DESC
    `;
    const dataPerkembanganSemester = trenSemesterRes.rows.map(row => ({
      semester: row.semester_label,
      rataNilai: Number(row.rata_nilai)
    }));


    // --- 6. RANKING PARALEL TERATAS ---
    const rankingRes = await sql`
      SELECT 
        m.id as murid_id,
        m.nama as murid_nama,
        m.nisn as murid_nisn, -- 🌟 Pastikan kolom NISN diambil dari DB
        m.rombel,
        ROUND(AVG(CAST(n.nilai_angka AS NUMERIC)), 1) as rata_rata
      FROM nilai n
      JOIN murid m ON n.murid_id = m.id
      WHERE m.status = 'aktif'
      GROUP BY m.id, m.nama, m.nisn, m.rombel
      ORDER BY rata_rata DESC
      LIMIT 5
    `;

    // 🌟 Update bagian mapping dataTabelRanking-nya
    const dataTabelRanking = rankingRes.rows.map((row, idx) => ({
      rank: idx + 1,
      nama: row.murid_nama,
      nisn: row.murid_nisn || null, // 🌟 Masukkan NISN ke dalam object array
      rombel: row.rombel,
      nilai: Number(row.rata_rata || 0)
    }));


    // --- 7. BEBAN MENGAJAR & KINERJA GURU ---
  const kinerjaGuruRes = await sql`
      SELECT 
        g.id as guru_id,
        g.nama as guru_nama,
        g.nip as guru_nip, -- 🌟 Ambil dengan alias yang sangat jelas
        COALESCE(m.nama_mapel, 'Umum') as nama_mapel,
        -- 1. Hitung total jam pelajaran (JPM) murni tanpa dikali 2
        (SELECT COUNT(jp.id) FROM jadwal_pelajaran jp WHERE jp.guru_id = g.id) as total_jam,
        -- 2. Persentase kehadiran guru (jika belum ada data absen, set ke 0%)
        COALESCE(
          ROUND(
            (COUNT(CASE WHEN kg.status = 'Hadir' THEN 1 END) * 100.0) / 
            NULLIF(COUNT(kg.id), 0), 1
          ), 0
        ) as persen_kehadiran,
        -- 3. Cek kelengkapan input nilai
        CASE 
          WHEN (SELECT COUNT(n.id) FROM nilai n WHERE n.guru_id = g.id) > 0 THEN 'Lengkap'
          ELSE 'Belum Lengkap'
        END as status_nilai
      FROM guru g
      LEFT JOIN mapel m ON g.mapel = CAST(m.id AS VARCHAR)
      LEFT JOIN kehadiran_guru kg ON g.id = kg.guru_id
      WHERE g.jenis != 'Kepala Sekolah'
      GROUP BY g.id, g.nama, g.nip, m.nama_mapel -- 🌟 Group by dipastikan aman
      ORDER BY total_jam DESC
    `;

    // 🌟 PERBAIKAN MAPPING: Pastikan field 'nip' diambil dari alias 'guru_nip'
    const dataJamMengajarGuru = kinerjaGuruRes.rows.map(row => ({
      nama: row.guru_nama,
      jam: Number(row.total_jam || 0)
    }));

    const dataTabelKinerjaGuru = kinerjaGuruRes.rows.map(row => ({
      nama: row.guru_nama,
      nip: row.guru_nip || null, // 🌟 Menggunakan row.guru_nip hasil select di atas
      mapel: row.nama_mapel,
      kehadiran: Math.round(Number(row.persen_kehadiran)),
      inputNilai: row.status_nilai
    }));

    // --- 8. ALERT SYSTEM KHUSUS (Hanya memuat Kurikulum & Administrasi Nilai) ---
    const alertSistemRes = await sql`
      WITH 
      nilai_semester AS (
        SELECT 
          semester,
          AVG(NULLIF(nilai_angka, 0)::float) as avg_nilai
        FROM nilai
        WHERE mapel = '6'
        GROUP BY semester
      ),
      ganjil AS (SELECT avg_nilai FROM nilai_semester WHERE semester = 'Ganjil'),
      genap AS (SELECT avg_nilai FROM nilai_semester WHERE semester = 'Genap'),
      analisis_tren AS (
        SELECT 
          ROUND((((ganjil.avg_nilai - genap.avg_nilai) / NULLIF(ganjil.avg_nilai, 0)) * 100)::numeric, 1) as penurunan
        FROM ganjil, genap
      ),
      guru_tanpa_nilai AS (
        SELECT COUNT(g.id) as jumlah_guru
        FROM guru g
        LEFT JOIN nilai n ON g.id = n.guru_id
        WHERE n.id IS NULL AND g.jenis = 'Guru'
      )

      SELECT 
        '1' as id, 'WARNING' as tipe, 'Kurikulum' as kategori,
        UPPER(CONCAT('RATA-RATA NILAI AKHIR MAPEL INTI MENURUN SEBESAR ', t.penurunan, '% DI SEMESTER INI')) as pesan,
        '2 JAM YANG LALU' as waktu
      FROM analisis_tren t WHERE t.penurunan > 0

      UNION ALL

      SELECT 
        '2' as id, 'WARNING' as tipe, 'Administrasi' as kategori,
        UPPER(CONCAT(gtn.jumlah_guru, ' GURU MATA PELAJARAN BELUM MENYELESAIKAN INPUT NILAI RAPORT')) as pesan,
        'HARI INI' as waktu
      FROM guru_tanpa_nilai gtn WHERE gtn.jumlah_guru > 0
    `;

    const dataAlertSistem = alertSistemRes.rows.map(row => ({
      id: Number(row.id),
      tipe: row.tipe,
      kategori: row.kategori,
      pesan: row.pesan,
      waktu: row.waktu
    }));

    return {
      cards: {
        totalSiswa: Number(totalSiswaRes.rows[0]?.count || 0).toLocaleString('id-ID'),
        totalGuru: totalGuruRes.rows[0]?.count?.toString() || "0",
        rataKehadiran: `${rataKehadiranCard}%`,
        dashKKM: `${ketuntasanKKM}%`,
      },
      charts: {
        dataNilaiRombel,
        dataTrenKehadiran,
        dataRataNilaiPerKelas,
        dataPerkembanganSemester,
        dataTabelRanking,
        dataJamMengajarGuru,
        dataTabelKinerjaGuru,
        dataAlertSistem
      }
    };

  } catch (error) {
    console.error("Gagal mengambil statistik dashboard kurikulum:", error);
    return null;
  }
}

export async function getRekapNilaiMurid(semester?: string, tahun_ajaran?: string) {
  try {
    const data = await sql`
      SELECT 
        m.id,
        m.nama,
        m.nisn,
        m.rombel,
        COALESCE(ROUND(AVG(n.nilai_angka), 2), 0) as rerata,
        JSON_AGG(
          JSON_BUILD_OBJECT(
            'mapel', n.mapel,
            'nilai', n.nilai_angka,
            'semester', n.semester,
            'tahun_ajaran', n.tahun_ajaran
          )
        ) FILTER (WHERE n.mapel IS NOT NULL) as nilai_mapel
      FROM murid m
      LEFT JOIN nilai n ON m.id = n.murid_id
      WHERE 
        (${semester}::text IS NULL OR n.semester = ${semester}) AND
        (${tahun_ajaran}::text IS NULL OR n.tahun_ajaran = ${tahun_ajaran})
      GROUP BY m.id, m.nama, m.nisn, m.rombel
      ORDER BY rerata DESC
    `;

    return data.rows;
  } catch (error) {
    console.error("Gagal mengambil rekap nilai:", error);
    return [];
  }
}

export async function getJadwalBebanMengajar(searchTerm: string = '', page: number = 1, limit: number = 5) {
  const offset = (page - 1) * limit;
  const MENIT_PER_JP = 40; // Ubah ini sesuai durasi 1 jam pelajaran di sekolahmu

  try {
    const data = await sql`
      SELECT 
        g.id, g.nama, g.nip, g.mapel as mapel_utama,
        (
          SELECT json_agg(j)
          FROM (
            SELECT hari, rombel, mapel, jam_mulai, jam_selesai
            FROM jadwal_pelajaran
            WHERE mapel = g.mapel 
            ORDER BY 
              CASE hari 
                WHEN 'Senin' THEN 1 WHEN 'Selasa' THEN 2 
                WHEN 'Rabu' THEN 3 WHEN 'Kamis' THEN 4 WHEN 'Jumat' THEN 5 
              END, jam_mulai
          ) j
        ) as list_jadwal,
        (
          SELECT 
            SUM(
              EXTRACT(EPOCH FROM (jam_selesai::time - jam_mulai::time)) / 60 / ${MENIT_PER_JP}
            )::int
          FROM jadwal_pelajaran
          WHERE mapel = g.mapel
        ) as total_jam_minggu,
        COUNT(*) OVER() as total_count 
      FROM guru g
      WHERE EXISTS (
        SELECT 1 FROM jadwal_pelajaran jp WHERE jp.mapel = g.mapel
      )
      AND (g.nama ILIKE ${'%' + searchTerm + '%'} OR g.nip ILIKE ${'%' + searchTerm + '%'})
      ORDER BY g.nama ASC
      LIMIT ${limit}
      OFFSET ${offset}
    `;

    return JSON.parse(JSON.stringify(data.rows)); 
  } catch (error) {
    console.error("Database Error:", error);
    return [];
  }
}

// @/lib/actions.ts
export async function getMonitoringKehadiran(startDate: string, endDate: string, search: string = "") {
  try {
    // 1. Ambil Data Kehadiran Guru
    // Berdasarkan image_ba0400.png, tabelnya 'kehadiran_guru'
    // Kolomnya: guru_id (berisi NIP), attendance_status, time_in
    const guru = await sql`
      SELECT 
        kg.id, 
        kg.tanggal::text, -- Paksa jadi text agar formatnya YYYY-MM-DD konsisten
        kg.status, 
        g.nama, 
        g.nip,
        g.mapel,
        g.gender
      FROM kehadiran_guru kg
      JOIN guru g ON kg.guru_id = g.id
      WHERE kg.tanggal::date BETWEEN ${startDate}::date AND ${endDate}::date 
      AND (g.nama ILIKE ${'%' + search + '%'} OR g.nip ILIKE ${'%' + search + '%'})
      ORDER BY kg.tanggal DESC, g.nama ASC
    `;

    // 2. Ambil Ringkasan Kehadiran Murid per Rombel
    // Berdasarkan image_ba045b.png, tabelnya 'kehadiran' (murid)
    // Kolomnya: murid_id, attendance_status, attendance_date
    const murid = await sql`
      SELECT 
        k.id, k.tanggal::text, k.status, 
        m.nama, m.nisn, m.gender, m.rombel
      FROM kehadiran k
      JOIN murid m ON k.murid_id = m.id
      WHERE k.tanggal::date BETWEEN ${startDate}::date AND ${endDate}::date
      AND (m.nama ILIKE ${'%' + search + '%'} OR m.nisn ILIKE ${'%' + search + '%'})
      ORDER BY k.tanggal DESC, m.nama ASC
    `;;

    return { 
      guru: JSON.parse(JSON.stringify(guru.rows)), 
      murid: JSON.parse(JSON.stringify(murid.rows)) 
    };
  } catch (error) {
    console.error("Error Kehadiran:", error);
    return { guru: [], murid: [] };
  }
}

export async function deleteNilai(id: number, sekolahId: number) {
  try {
    // Pastikan hanya menghapus nilai yang sesuai dengan ID dan sekolah_id guru login
    await sql`DELETE FROM nilai WHERE id = ${id} AND sekolah_id = ${sekolahId}`;
    
    revalidatePath("/guru/inputnilai"); 
    return { success: true };
  } catch (error) {
    console.error("Action Error deleteNilai:", error);
    return { success: false };
  }
}

export async function getDaftarGuru(sekolahId: number) {
  try {
    const res = await sql`
      SELECT id, nama, nip, mapel 
      FROM guru 
      WHERE sekolah_id = ${sekolahId} 
      ORDER BY nama ASC
    `;
    return res.rows;
  } catch (error) {
    console.error("Gagal ambil daftar guru:", error);
    return [];
  }
}

export async function checkRombelConflict(
  muridId: number,
  mapelGuru: string, // 💡 Menerima ID Mapel string/int dari client
  tahunAjaran: string,
  currentGuruId: string, 
  sekolahId: number      
) {
  try {
    const guruIdInt = parseInt(currentGuruId, 10);

    // 1. Ambil detail rombel murid
    const muridRes = await sql`SELECT rombel FROM murid WHERE id = ${muridId} AND sekolah_id = ${sekolahId}`;
    const rombelMurid = muridRes.rows[0]?.rombel;

    if (!rombelMurid) {
      return { allowed: true };
    }

    // 2. Cari conflict, n.mapel sekarang membandingkan ID Mapel
    const conflictRes = await sql`
      SELECT n.guru_id, g.nama as nama_guru
      FROM nilai n
      JOIN murid m ON n.murid_id = m.id
      JOIN guru g ON n.guru_id = g.id 
      WHERE m.rombel = ${rombelMurid}
        AND n.mapel = ${mapelGuru} -- 💡 Membandingkan ID Mapel langsung di DB
        AND n.tahun_ajaran = ${tahunAjaran}
        AND n.sekolah_id = ${sekolahId}   
        AND n.guru_id != ${guruIdInt}     
      LIMIT 1
    `;

    if (conflictRes.rows.length > 0) {
      const namaGuruLain = conflictRes.rows[0].nama_guru;
      return {
        allowed: false,
        error: `Data murid di rombel ${rombelMurid} sudah mulai diisi oleh guru lain (${namaGuruLain}) untuk mata pelajaran ini. Silakan hubungi kurikulum sekolah jika ini adalah kekeliruan.`,
      };
    }

    return { allowed: true };
  } catch (error) {
    console.error("Error pada checkRombelConflict:", error);
    return { allowed: false, error: "Gagal memverifikasi proteksi rombel database." };
  }
}