'use server';

import { signIn, signOut, auth } from '@/auth';
import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import fs from 'fs/promises';
import path from 'path';
import bcrypt from 'bcryptjs';

// --- Action Login & Logout ---
export async function authenticate(formData: FormData) {
  try {
    await signIn('credentials', {
      ...Object.fromEntries(formData),
      redirectTo: '/operator', 
    });
  } catch (error) {
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

  const name = formData.get('name') as string;
  const imageFile = formData.get('image') as File;

  if (imageFile && imageFile.size > 2 * 1024 * 1024) {
    return { error: "File terlalu besar. Maksimal 2MB." };
  }
  
  // 1. Ambil data lama dari database untuk pengecekan file
  const userQuery = await sql`SELECT image FROM users WHERE id = ${session.user.id}`;
  const oldImageName = userQuery.rows[0]?.image || "default.png";
  
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
    await sql`
      UPDATE users 
      SET name = ${name}, image = ${newImageName} 
      WHERE id = ${session.user.id}
    `;

    revalidatePath('/operator/profil');
    
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

  const oldPassword = formData.get('oldPassword') as string;
  const newPassword = formData.get('newPassword') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  if (newPassword !== confirmPassword) return { error: "Konfirmasi password tidak cocok." };

  try {
    const userQuery = await sql`SELECT password FROM users WHERE id = ${session.user.id}`;
    const user = userQuery.rows[0];
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    
    if (!isMatch) return { error: "Password lama salah." };

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await sql`UPDATE users SET password = ${hashedNewPassword} WHERE id = ${session.user.id}`;

    return { success: "Password berhasil diganti!" };
  } catch (error) {
    return { error: "Terjadi kesalahan sistem." };
  }
}