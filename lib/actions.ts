'use server';

import { signIn, signOut, auth } from '@/auth';
import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import fs from 'fs/promises';
import path from 'path';
import bcrypt from 'bcryptjs';

// actions.ts
// Tambahkan async di sini
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
    if (!session ?.user ?.id) return { error: "Sesi tidak valid." };

    const name = formData.get('name') as string;
    const imageFile = formData.get('image') as File;

    if (imageFile && imageFile.size > 2 * 1024 * 1024) {
        return { error: "File terlalu besar. Maksimal 2MB." };
    }

    // 1. Ambil data lama dari database untuk pengecekan file
    const userQuery = await sql `SELECT image FROM users WHERE id = ${session.user.id}`;
    const oldImageName = userQuery.rows[0] ?.image || "default.png";
    const userRole = session.user.role; // 'operator' atau 'tatausaha'
    const profilePath = `/${userRole}/profil`;

    let newImageName = oldImageName;

    try {
        // 2. Jika ada file baru yang diunggah
        if (imageFile && imageFile.size > 0) {
            newImageName = `${Date.now()}-${imageFile.name.replaceAll(" ", "_")}`;
            const newFilePath = path.join(process.cwd(), "public/profil", newImageName);

            // Simpan file baru ke folder public/profil
            const bytes = await imageFile.arrayBuffer();
            await fs.writeFile(newFilePath, Buffer.from(bytes));

            // 3. Hapus foto lama JIKA bukan 'default.png'
            if (oldImageName !== "default.png") {
                const oldFilePath = path.join(process.cwd(), "public/profil", oldImageName);
                try {
                    await fs.access(oldFilePath); // Cek apakah file ada
                    await fs.unlink(oldFilePath);
                } catch (err) {
                    console.error("File lama tidak ditemukan atau gagal dihapus:", err);
                }
            }
        }

        // 4. Update Database (Hanya simpan nama filenya)
        await sql `
      UPDATE users 
      SET name = ${name}, image = ${newImageName} 
      WHERE id = ${session.user.id}
    `;

        // Revalidate path yang sesuai dengan role user tersebut
        revalidatePath(profilePath);
        // Opsional: revalidate layout utama jika nama/foto muncul di sidebar semua halaman
        revalidatePath(`/${userRole}`, 'layout');

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
    if (!session ?.user ?.id) return { error: "Tidak diizinkan." };

    const oldPassword = formData.get('oldPassword') as string;
    const newPassword = formData.get('newPassword') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (newPassword !== confirmPassword) return { error: "Konfirmasi password tidak cocok." };

    try {
        const userQuery = await sql `SELECT password FROM users WHERE id = ${session.user.id}`;
        const user = userQuery.rows[0];
        const isMatch = await bcrypt.compare(oldPassword, user.password);

        if (!isMatch) return { error: "Password lama salah." };

        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        await sql `UPDATE users SET password = ${hashedNewPassword} WHERE id = ${session.user.id}`;

        return { success: "Password berhasil diganti!" };
    } catch (error) {
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
    const nip = formData.get('nip') as string;
    const nama = formData.get('nama') as string;
    const mapel = formData.get('mapel') as string;
    const gender = formData.get('gender') as string;

    try {
        // 1. Ambil NIP lama sebelum diupdate untuk mencari user terkait
        const oldData = await sql`SELECT nip FROM guru WHERE id = ${id}`;
        const oldNip = oldData.rows[0]?.nip;

        // 2. Update data fisik di tabel guru
        await sql`
          UPDATE guru 
          SET nip = ${nip}, nama = ${nama}, mapel = ${mapel}, gender = ${gender}
          WHERE id = ${id}
        `;

        // 3. Sinkronisasi Otomatis: Update username & password (opsional) di tabel users
        // Kita cari user yang punya guru_id sama dengan id guru ini
        await sql`
          UPDATE users 
          SET username = ${nip}, name = ${nama} 
          WHERE guru_id = ${id}
        `;

        revalidatePath('/tatausaha/dataguru');
        revalidatePath('/operator/datauser'); // Agar list di operator juga update[cite: 8]
        return { success: true };
    } catch (error) {
        console.error(error);
        return { error: "Gagal memperbarui data guru dan sinkronisasi akun." };
    }
}

export async function deleteGuru(id: number) {
  try {
    // 1. Ambil NIP guru dulu sebelum dihapus untuk menghapus user terkait
    const res = await sql`SELECT nip FROM guru WHERE id = ${id}`;
    const guru = res.rows[0];

    if (guru) {
      await sql`DELETE FROM wali_kelas WHERE guru_id = ${id}`;
      await sql`DELETE FROM nilai WHERE guru_id = ${id}`; // Ini yang bikin error tadi
      await sql`DELETE FROM kehadiran_guru WHERE guru_id = ${id}`;
      await sql`DELETE FROM kehadiran WHERE guru_id = ${id}`;
      await sql`DELETE FROM history_perwalian WHERE guru_id = ${id}`;
      await sql`DELETE FROM catatan_kedisiplinan WHERE guru_id = ${id}`;
      // 2. Hapus akun di tabel users (berdasarkan username yang sama dengan NIP)
      await sql`DELETE FROM users WHERE username = ${guru.nip}`;
      
      // 3. Hapus data guru
      await sql`DELETE FROM guru WHERE id = ${id}`;
    }

    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Gagal menghapus data guru dan user terkait." };
  }
}

// Ambil data guru yang BELUM memiliki akun di tabel users
// Cari fungsi ini di lib/actions.ts dan ubah SQL-nya
export async function getGuruTanpaAkun() {
  try {
    const data = await sql`
      SELECT id, nip, nama, jenis  -- <--- TAMBAHKAN 'jenis' DI SINI!
      FROM guru 
      WHERE id NOT IN (SELECT guru_id FROM users WHERE guru_id IS NOT NULL)
      ORDER BY nama ASC
    `;
    return data.rows;
  } catch (error) {
    return [];
  }
}

// Action untuk membuat akun user baru
export async function createUserAccount(formData: FormData) {
  const name = formData.get('name') as string;
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;
  const role = formData.get('role') as string;
  const guruId = formData.get('guruId') as string || null; // Ambil guruId jika role-nya guru

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    await sql`
      INSERT INTO users (name, username, password, role, guru_id, image)
      VALUES (${name}, ${username}, ${hashedPassword}, ${role}, ${guruId}, 'default.png')
    `;
    revalidatePath('/operator/manajemen-user');
    return { success: true };
  } catch (error: any) {
    if (error.message.includes('unique constraint')) return { error: "Username sudah digunakan!" };
    return { error: "Gagal membuat akun user." };
  }
}

// action untuk menghapus user
export async function deleteUser(id: number) {
  try {
    await sql`DELETE FROM users WHERE id = ${id}`;
    revalidatePath('/operator/manajemen-user');
    return { success: true };
  } catch (error) {
    return { error: "Gagal menghapus user." };
  }
}

// Update hanya Nama saja[cite: 8]
export async function updateUser(id: number, formData: FormData) {
  const name = formData.get('name') as string;

  try {
    // Hilangkan UPDATE username di sini[cite: 8]
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

// Action guru
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

export async function getOperatorStats() {
  try {
    // 1. Hitung total akun di tabel users
    const userRes = await sql`SELECT COUNT(*) as count FROM users`;
    
    // 2. Hitung guru yang ada di data fisik (tabel guru) tapi belum dibuatkan akun
    const pendingRes = await sql`
      SELECT COUNT(*) as count FROM guru 
      WHERE id NOT IN (SELECT guru_id FROM users WHERE guru_id IS NOT NULL)
    `;
    
    // 3. Hitung total wali kelas
    const waliRes = await sql`SELECT COUNT(*) as count FROM wali_kelas`;

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

export async function getMuridByWaliWithValidation(rombel: string) {
  try {
    const data = await sql`
      SELECT 
        m.id, 
        m.nisn, 
        m.nama, 
        m.gender, 
        m.rombel, 
        m.status,
        m.nik,
        m.nama_ibu,
        m.tanggal_lahir,
        (SELECT COUNT(*) FROM nilai n WHERE n.murid_id = m.id AND n.semester = 'Ganjil') as jml_ganjil,
        (SELECT COUNT(*) FROM nilai n WHERE n.murid_id = m.id AND n.semester = 'Genap') as jml_genap
      FROM murid m
      WHERE m.rombel = ${rombel}
      ORDER BY m.nama ASC
    `;
    return data.rows;
  } catch (error) {
    console.error("Gagal mengambil data murid:", error);
    return [];
  }
}

export async function getDetailNilaiMurid(muridId: number) {
  try {
    const data = await sql`
      SELECT mapel, semester, nilai_angka 
      FROM nilai 
      WHERE murid_id = ${muridId} 
      ORDER BY mapel ASC
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

export async function prosesNaikKelas(murid: any, guruId: number) {
  const nextRombel = getNextRombel(murid.rombel);
  const nextKelas = nextRombel ? nextRombel.split('.')[0] : 'LULUS';
  const kelasLamaTerdeteksi = murid.kelas || murid.rombel.split('.')[0];
  
  // Tambahkan await di sini karena fungsinya sudah jadi async
  const tahunAjaranSekarang = await getTahunAjaranDinamis();

  try {
    // 1. Simpan ke History dengan tahun ajaran otomatis
    await sql`
      INSERT INTO history_perwalian (
        murid_id, guru_id, kelas_lama, rombel_lama, tahun_ajaran
      )
      VALUES (
        ${murid.id}, 
        ${guruId}, 
        ${kelasLamaTerdeteksi}, 
        ${murid.rombel}, 
        ${tahunAjaranSekarang} -- Variabel dinamis
      )
    `;

    // 2. Update data murid
    await sql`
      UPDATE murid 
      SET 
        kelas = ${nextKelas}, 
        rombel = ${nextRombel},
        status = ${nextRombel ? 'aktif' : 'lulus'}
      WHERE id = ${murid.id}
    `;

    return { success: true, target: nextRombel || 'LULUS' };
  } catch (error) {
    console.error("Gagal proses kenaikan:", error);
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

export async function getMissingDatesGuru(guruIds: number[], startDate: string, endDate: string) {
  // Ubah array [1, 2] menjadi string "{1,2}" agar valid untuk PostgreSQL ANY
  const formattedIds = `{${guruIds.join(",")}}`;

  const res = await sql`
    SELECT DISTINCT tanggal::text FROM kehadiran_guru 
    WHERE guru_id = ANY(${formattedIds}::int[]) 
    AND tanggal BETWEEN ${startDate} AND ${endDate}
  `;
  
  return res.rows.map(r => r.tanggal);
}

export async function savePresensiGuruBulk(data: any[]) {
  try {
    for (const item of data) {
      await sql`
        INSERT INTO kehadiran_guru (guru_id, tanggal, status, tahun_ajaran)
        VALUES (${item.guru_id}, ${item.tanggal}, ${item.status}, ${item.tahun_ajaran})
        ON CONFLICT (guru_id, tanggal) DO UPDATE SET status = EXCLUDED.status
      `;
    }
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false };
  }
}

// lib/actions.ts

export async function getHistoryKehadiranGuru(startDate: string, endDate: string, tahunAjaran: string) {
  try {
    const res = await sql`
      SELECT 
        kg.id, 
        kg.tanggal::text, -- Paksa jadi text agar formatnya YYYY-MM-DD konsisten
        kg.status, 
        g.nama, 
        g.nip
      FROM kehadiran_guru kg
      JOIN guru g ON kg.guru_id = g.id
      WHERE kg.tanggal::date BETWEEN ${startDate}::date AND ${endDate}::date
      AND kg.tahun_ajaran = ${tahunAjaran}
      ORDER BY kg.tanggal DESC, g.nama ASC
    `;
    
    return res.rows; 
  } catch (error) {
    console.error("Database Error:", error);
    return [];
  }
}

// lib/actions.ts

export async function saveJadwalPelajaran(data: any[]) {
  try {
    for (const item of data) {
      // 1. CEK BENTROK: Cari apakah ada jadwal dengan GURU, HARI, dan JAM yang sama
      // Kita abaikan pengecekan jika guru_id kosong (untuk kegiatan umum)
      if (item.guru_id) {
        const bentrok = await sql`
          SELECT id FROM jadwal_pelajaran 
          WHERE guru_id = ${item.guru_id} 
          AND hari = ${item.hari} 
          AND jam_mulai = ${item.jam_mulai}
          LIMIT 1
        `;

        if (bentrok.rows.length > 0) {
          // Jika ditemukan data, lempar error dan batalkan semua proses
          throw new Error(`Jadwal Bentrok! Guru tersebut sudah memiliki jadwal di hari ${item.hari} jam ${item.jam_mulai}.`);
        }
      }

      // 2. Jika tidak bentrok, baru jalankan INSERT
      await sql`
        INSERT INTO jadwal_pelajaran (
          hari, mapel, kelas, rombel, jam_mulai, jam_selesai, tahun_ajaran, guru_id
        ) VALUES (
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
    // Kirim pesan error yang spesifik ke UI
    return { error: error.message || "Gagal simpan jadwal" };
  }
}

// lib/actions.ts

export async function getJadwalPelajaran(tahunAjaran?: string) {
  try {
    // Jika tahunAjaran tidak dikirim saat fungsi dipanggil, kita cari otomatis
    let ta = tahunAjaran;
    if (!ta) {
      const sekarang = new Date();
      const tahunIni = sekarang.getFullYear();
      const bulanIni = sekarang.getMonth(); // 0 = Januari, 6 = Juli
      ta = bulanIni >= 6 ? `${tahunIni}/${tahunIni + 1}` : `${tahunIni - 1}/${tahunIni}`;
    }

    // QUERY YANG DISESUAIKAN: Menggabungkan data jadwal dengan data guru
    const res = await sql`
      SELECT 
        jp.*, 
        g.nama as nama_guru, 
        g.nip as nip_guru 
      FROM jadwal_pelajaran jp
      LEFT JOIN guru g ON jp.guru_id = g.id
      WHERE jp.tahun_ajaran = ${ta}
      ORDER BY jp.jam_mulai ASC
    `;
    
    return res.rows;
  } catch (error) {
    console.error("Gagal mengambil data jadwal pelajaran:", error);
    return [];
  }
}

// lib/actions.ts

// Hapus Jadwal
export async function deleteJadwalPelajaran(id: number) {
  try {
    await sql`DELETE FROM jadwal_pelajaran WHERE id = ${id}`;
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}

// Update Jadwal dengan Cek Bentrok
export async function updateJadwalPelajaran(id: number, data: any) {
  try {
    // Cek bentrok, tapi abaikan ID yang sedang diedit (id != ${id})
    const bentrok = await sql`
      SELECT id FROM jadwal_pelajaran 
      WHERE hari = ${data.hari} 
      AND kelas = ${data.kelas} 
      AND rombel = ${data.rombel}
      AND id != ${id}
      AND (
        (${data.jam_mulai} >= jam_mulai AND ${data.jam_mulai} < jam_selesai) OR
        (${data.jam_selesai} > jam_mulai AND ${data.jam_selesai} <= jam_selesai)
      )
    `;

    if (bentrok.rows.length > 0) {
      return { success: false, message: "Gagal update! Jadwal bentrok dengan pelajaran lain." };
    }

    await sql`
      UPDATE jadwal_pelajaran 
      SET hari = ${data.hari}, mapel = ${data.mapel}, 
          jam_mulai = ${data.jam_mulai}, jam_selesai = ${data.jam_selesai}
      WHERE id = ${id}
    `;

    return { success: true };
  } catch (error) {
    return { success: false, message: "Terjadi kesalahan sistem." };
  }
}

// lib/actions.ts

export async function getKepalaSekolahStats() {
  const DAFTAR_MAPEL = ["PAI & BudiPekerti", "PKN", "Bahasa Indonesia", "Bahasa Inggris", "Bahasa Inggris Tingkat Lanjut", "Matematika Wajib", "Matematika Tingkat Lanjut", "Fisika", "Fisika Mapel Pilihan", "Biologi", "Biologi Mapel Pilihan", "Kimia", "Kimia Mapel Pilihan", "Sejarah", "Sejarah Tingkat Lanjut", "Geografi", "Geografi Mapel Pilihan", "Ekonomi", "Ekonomi Mapel Pilihan", "Sosiologi", "Sosiologi Mapel Pilihan", "Seni Budaya", "Penjas Orkes", "PKWU", "Informatika", "Bimbingan Konseling"];
  const DAFTAR_KELAS = ["X", "XI", "XII"];
  const DAFTAR_ROMBEL = ["X.1", "X.2", "X.3", "X.4", "XI.1", "XI.2", "XI.3", "XI.4", "XII.1", "XII.2", "XII.3", "XII.4"];

  try {
    const hariIni = new Date().toISOString().split('T')[0];
    
    // Query kehadiran (Pakai nama field asli kamu: tanggal & status)
    const hadirGuru = await sql`SELECT COUNT(*)::int FROM kehadiran_guru WHERE tanggal::date = ${hariIni}::date AND status = 'Hadir'`;
    const hadirMurid = await sql`SELECT COUNT(*)::int FROM kehadiran WHERE tanggal::date = ${hariIni}::date AND status = 'Hadir'`;
    
    const resCount = await sql`SELECT (SELECT COUNT(*) FROM guru) as total_guru, (SELECT COUNT(*) FROM murid) as total_murid`;
    const resTopNilai = await sql`SELECT m.nama, m.nisn, m.rombel, AVG(n.nilai_angka)::numeric(10,2) as rerata FROM nilai n JOIN murid m ON n.murid_id = m.id GROUP BY m.nama, m.nisn, m.rombel ORDER BY rerata DESC LIMIT 5`;
    const resWaliKelas = await sql`SELECT g.nama as nama_guru, g.nip, wk.rombel FROM wali_kelas wk JOIN guru g ON wk.guru_id = g.id ORDER BY wk.rombel ASC`;
    // Cari bagian resJamMengajar dan ganti dengan ini
const resJamMengajar = await sql`
  SELECT 
    jp.mapel, 
    SUM(
      EXTRACT(EPOCH FROM (jam_selesai::time - jam_mulai::time)) / 60 / 45
    )::int as total_jam, 
    (
      SELECT string_agg(CONCAT(nama, ' (', nip, ')'), '|') 
      FROM guru 
      WHERE mapel = jp.mapel
    ) as daftar_guru 
  FROM jadwal_pelajaran jp 
  GROUP BY jp.mapel 
  ORDER BY total_jam DESC 
  LIMIT 5
`;
const resDisiplin = await sql`SELECT m.nama, m.rombel, ck.kategori, ck.keterangan, ck.tanggal, g.nama as nama_wali, g.nip as nip_wali FROM catatan_kedisiplinan ck JOIN murid m ON ck.murid_id = m.id LEFT JOIN wali_kelas wk ON m.rombel = wk.rombel LEFT JOIN guru g ON wk.guru_id = g.id ORDER BY ck.created_at DESC LIMIT 5`;

    return {
      counts: {
        total_guru: resCount.rows[0].total_guru,
        total_murid: resCount.rows[0].total_murid,
        total_kelas: DAFTAR_KELAS.length,
        total_rombel: DAFTAR_ROMBEL.length,
        total_mapel: DAFTAR_MAPEL.length,
        // INI YANG DITAMBAHKAN:
        guruHadir: hadirGuru.rows[0].count || 0,
        muridHadir: hadirMurid.rows[0].count || 0,
      },
      details: {
        kelas: DAFTAR_KELAS,
        rombel: DAFTAR_ROMBEL,
        mapel: DAFTAR_MAPEL
      },
      topNilai: resTopNilai.rows,
      waliKelas: resWaliKelas.rows,
      jamMengajar: resJamMengajar.rows.map((row: any) => ({ ...row, list_guru: row.daftar_guru ? row.daftar_guru.split('|') : [] })),
      disiplin: resDisiplin.rows
    };
  } catch (error) { return null; }
}

// lib/actions.ts

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

export async function deleteNilai(id: number) {
  try {
    await sql`DELETE FROM nilai WHERE id = ${id}`;
    revalidatePath("/guru/inputnilai"); // Sesuaikan path-nya
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}

export async function getDaftarGuru() {
  try {
    const res = await sql`SELECT id, nama, nip, mapel FROM guru ORDER BY nama ASC`;
    return res.rows;
  } catch (error) {
    console.error("Gagal ambil daftar guru:", error);
    return [];
  }
}

// lib/actions.ts

export async function checkRombelConflict(
  muridId: number,
  mapelGuru: string,
  tahunAjaran: string,
  currentGuruNip: string
) {
  try {
    // 1. Ambil detail rombel murid yang sedang dipilih terlebih dahulu
    const muridRes = await sql`SELECT rombel FROM murid WHERE id = ${muridId}`;
    const rombelMurid = muridRes.rows[0]?.rombel;

    if (!rombelMurid) {
      return { allowed: true };
    }

    // 2. Gunakan CASTING TYPE ::text agar kolom integer bisa di-join aman ke varchar username
    const conflictRes = await sql`
      SELECT n.guru_id, u.name as nama_guru
      FROM nilai n
      JOIN murid m ON n.murid_id = m.id
      JOIN users u ON n.guru_id::text = u.username::text 
      WHERE m.rombel = ${rombelMurid}
        AND n.mapel = ${mapelGuru}
        AND n.tahun_ajaran = ${tahunAjaran}
        AND n.guru_id::text != ${currentGuruNip}::text
      LIMIT 1
    `;

    if (conflictRes.rows.length > 0) {
      const namaGuruLain = conflictRes.rows[0].nama_guru;
      const nipGuruLain = conflictRes.rows[0].guru_id;
      return {
        allowed: false,
        error: `Data murid di rombel ${rombelMurid} sudah ada yang mengisi (${namaGuruLain} - ${nipGuruLain}), silahkan pilih murid di rombel yang lain.`,
      };
    }

    return { allowed: true };
  } catch (error) {
    console.error("Error pada checkRombelConflict:", error);
    // Jika ada error, kembalikan allowed: false agar tidak lolos bypass saat error database terjadi
    return { allowed: false, error: "Gagal memverifikasi proteksi rombel database." };
  }
}