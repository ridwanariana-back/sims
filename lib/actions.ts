'use server';

import { signIn, signOut, auth } from '@/auth';
import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import fs from 'fs/promises';
import path from 'path';
import bcrypt from 'bcryptjs';

// actions.ts
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