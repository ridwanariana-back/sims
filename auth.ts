import NextAuth, { type DefaultSession } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { sql } from '@vercel/postgres';
import bcrypt from 'bcryptjs';

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      async authorize(credentials) {
        const { username, password } = credentials;

        const userQuery = await sql`
          SELECT id, name, username, role, password, image 
          FROM users 
          WHERE username = ${username as string}
        `;
        const user = userQuery.rows[0];

        if (!user) return null;

        const passwordsMatch = await bcrypt.compare(password as string, user.password);

        if (passwordsMatch) {
          return {
            id: user.id.toString(), // Pastikan menjadi string
            name: user.name,
            username: user.username,
            role: user.role,
            image: user.image,
          };
        }

        return null;
      },
    }),
  ],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const role = auth?.user?.role;
      
      const isGuruPage = nextUrl.pathname.startsWith('/guru');
      const isOperatorPage = nextUrl.pathname.startsWith('/operator');
      const isTUPage = nextUrl.pathname.startsWith('/tatausaha');
      const isKepalaPage = nextUrl.pathname.startsWith('/kepalasekolah');
      const isKurikulumPage = nextUrl.pathname.startsWith('/wakilkurikulum');
      const isKesiswaanPage = nextUrl.pathname.startsWith('/wakilkesiswaan');
      
      if (isGuruPage && (!isLoggedIn || role !== 'guru')) return false;
      if (isOperatorPage && (!isLoggedIn || role !== 'operator')) return false;
      if (isTUPage && (!isLoggedIn || role !== 'tatausaha')) return false;
      if (isKepalaPage && (!isLoggedIn || role !== 'kepalasekolah')) return false;
      if (isKurikulumPage && (!isLoggedIn || role !== 'wakilkurikulum')) return false;
      if (isKesiswaanPage && (!isLoggedIn || role !== 'wakilkesiswaan')) return false;
      
      if (isLoggedIn && nextUrl.pathname === '/') {
        let destination = '/';
        if (role === 'operator') destination = '/operator';
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

        // CEK DATA WALI KELAS & TAHUN AJARAN[cite: 2]
        if (user.role === 'guru' && user.username) {
          try {
            const guruRes = await sql`SELECT id FROM guru WHERE nip = ${user.username as string}`;
            const guruId = guruRes.rows[0]?.id;

            if (guruId) {
              // Mengambil rombel DAN tahun_ajaran agar riwayat tidak nyampur[cite: 2]
              const waliRes = await sql`
                SELECT rombel, tahun_ajaran 
                FROM wali_kelas 
                WHERE guru_id = ${guruId} 
                LIMIT 1
              `;
              
              if (waliRes.rows.length > 0) {
                token.isWaliKelas = true;
                token.kelasWali = waliRes.rows[0].rombel;
                token.tahunAjaran = waliRes.rows[0].tahun_ajaran; // Simpan ke token[cite: 2]
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

      if (trigger === "update" && session?.user) {
        if (session.user.name) token.name = session.user.name;
        if (session.user.image) token.picture = session.user.image;
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
        
        // Melempar data wali kelas dan tahun ajaran ke session user[cite: 2]
        session.user.isWaliKelas = !!token.isWaliKelas;
        session.user.kelasWali = (token.kelasWali as string) || null;
        session.user.tahunAjaran = (token.tahunAjaran as string) || null; // Sekarang tersedia di client[cite: 2]
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