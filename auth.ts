import NextAuth, { type DefaultSession } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { sql } from '@vercel/postgres';
import bcrypt from 'bcryptjs';

// 1. Deklarasi Modul TypeScript agar tidak error saat build (Type Safety)
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: string;
      username: string;
      sekolah_id?: number | null; // Diperbarui agar aman menerima nilai 0 atau null untuk superadmin
      isWaliKelas: boolean;
      kelasWali: string | null;
      tahunAjaran: string | null;
    } & DefaultSession['user']
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      async authorize(credentials) {
        const { username, password } = credentials;

        const userQuery = await sql`
          SELECT id, name, username, role, password, image, sekolah_id 
          FROM users 
          WHERE LOWER(username) = LOWER(${username as string})
        `;
        const user = userQuery.rows[0];

        if (!user) return null;

        const passwordsMatch = await bcrypt.compare(password as string, user.password);

        if (passwordsMatch) {
          return {
            id: user.id.toString(),
            name: user.name,
            username: user.username,
            role: user.role, 
            image: user.image,
            sekolah_id: user.sekolah_id, 
          };
        }

        return null;
      },
    }),
  ],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const role = auth?.user?.role?.toLowerCase().replace('_', ''); // .replace('_', '') untuk antisipasi jika ada penulisan 'tata_usaha' di DB agar seragam jadi 'tatausaha'
      
      // Jalur Proteksi Halaman Dashboard
      const isSuperadminPage = nextUrl.pathname.startsWith('/superadmin'); // 🌟 Tambahan Rute Guard Superadmin
      const isGuruPage = nextUrl.pathname.startsWith('/guru');
      const isOperatorPage = nextUrl.pathname.startsWith('/operator');
      const isTUPage = nextUrl.pathname.startsWith('/tatausaha'); 
      const isKepalaPage = nextUrl.pathname.startsWith('/kepalasekolah');
      const isKurikulumPage = nextUrl.pathname.startsWith('/wakilkurikulum');
      const isKesiswaanPage = nextUrl.pathname.startsWith('/wakilkesiswaan');
      
      // Validasi Hak Akses Masuk Menu
      if (isSuperadminPage && (!isLoggedIn || role !== 'superadmin')) return false; // 🌟 Kunci halaman superadmin
      if (isGuruPage && (!isLoggedIn || role !== 'guru')) return false;
      if (isOperatorPage && (!isLoggedIn || role !== 'operator')) return false;
      if (isTUPage && (!isLoggedIn || role !== 'tatausaha')) return false; 
      if (isKepalaPage && (!isLoggedIn || role !== 'kepalasekolah')) return false;
      if (isKurikulumPage && (!isLoggedIn || role !== 'wakilkurikulum')) return false;
      if (isKesiswaanPage && (!isLoggedIn || role !== 'wakilkesiswaan')) return false;
      
      // Pengalihan Otomatis ke Dashboard Masing-Masing Jika Mengakses Halaman Landing Utama ("/")
      if (isLoggedIn && nextUrl.pathname === '/') {
        let destination = '/';
        if (role === 'superadmin') destination = '/superadmin'; // 🌟 Redirect otomatis superadmin
        else if (role === 'operator') destination = '/operator';
        else if (role === 'tatausaha') destination = '/tatausaha'; 
        else if (role === 'guru') destination = '/guru';
        else if (role === 'kepalasekolah') destination = '/kepalasekolah';
        else if (role === 'wakilkurikulum') destination = '/wakilkurikulum';
        else if (role === 'wakilkesiswaan') destination = '/wakilkesiswaan';
        
        return Response.redirect(new URL(destination, nextUrl));
      }

      return true;
    },

    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id as string;
        token.role = user.role as string;
        token.username = user.username as string;
        token.name = user.name as string;
        token.picture = user.image as string;
        
        const rawSekolahId = (user as any).sekolah_id !== undefined ? (user as any).sekolah_id : (user as any).sekolahId;
        // Gunakan pengecekan presisi agar jika sekolah_id bernilai 0 (Superadmin) tetap terbaca angka 0, bukan dianggap null/false.
        token.sekolah_id = (rawSekolahId !== null && rawSekolahId !== undefined) ? parseInt(rawSekolahId.toString()) : null;

        if (user.role?.toLowerCase() === 'guru' && user.username) {
          try {
            const guruRes = await sql`SELECT id FROM guru WHERE nip = ${user.username as string}`;
            const guruId = guruRes.rows[0]?.id;

            if (guruId) {
              const waliRes = await sql`
                SELECT rombel, tahun_ajaran 
                FROM wali_kelas 
                WHERE guru_id = ${guruId} 
                LIMIT 1
              `;
              
              if (waliRes.rows.length > 0) {
                token.isWaliKelas = true;
                token.kelasWali = waliRes.rows[0].rombel;
                token.tahunAjaran = waliRes.rows[0].tahun_ajaran;
              } else {
                token.isWaliKelas = false;
                token.kelasWali = null;
                token.tahunAjaran = null;
              }
            }
          } catch (error) {
            console.error("Gagal cek wali kelas:", error);
            token.isWaliKelas = false;
            token.kelasWali = null;
            token.tahunAjaran = null;
          }
        }
      }

      if (trigger === "update" && session) {
        if (session.name) token.name = session.name;
        if (session.image) token.picture = session.image;
      }

      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.username = token.username as string;
        session.user.name = token.name as string;
        session.user.image = token.picture as string; 
        
        const tokenSekolahId = token.sekolah_id !== undefined ? token.sekolah_id : (token as any).sekolahId;
        session.user.sekolah_id = (tokenSekolahId !== null && tokenSekolahId !== undefined) ? parseInt(tokenSekolahId.toString()) : null;
        
        session.user.isWaliKelas = !!token.isWaliKelas;
        session.user.kelasWali = (token.kelasWali as string) || null;
        session.user.tahunAjaran = (token.tahunAjaran as string) || null;
      }
      return session;
    }
  },
  pages: {
    signIn: '/',
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
});