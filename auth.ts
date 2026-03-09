import NextAuth, { type DefaultSession } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { sql } from '@vercel/postgres';
import bcrypt from 'bcryptjs';

// Module Augmentation untuk TypeScript agar mendukung properti kustom
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: string;
      image?: string;
    } & DefaultSession['user'];
  }

  interface User {
    role?: string;
    image?: string;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      async authorize(credentials) {
        const { username, password } = credentials;

        // Ambil data user dari database Neon / Vercel Postgres
        const userQuery = await sql`
          SELECT id, name, role, password, image 
          FROM users 
          WHERE username = ${username as string}
        `;
        const user = userQuery.rows[0];

        if (!user) return null;

        // Verifikasi password menggunakan bcrypt
        const passwordsMatch = await bcrypt.compare(password as string, user.password);

        if (passwordsMatch) {
          return {
            id: user.id,
            name: user.name,
            role: user.role,
            image: user.image, // Mengambil nama file gambar (misal: default.png)
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
      
      const isOperatorPage = nextUrl.pathname.startsWith('/operator');
      
      // Proteksi halaman /operator: Hanya untuk user yang login dengan role 'operator'
      if (isOperatorPage) {
        if (isLoggedIn && role === 'operator') return true;
        return false; 
      }
      
      // Redirect jika sudah login tapi mencoba akses halaman login (root '/')
      if (isLoggedIn && nextUrl.pathname === '/') {
        const destination = role === 'operator' ? '/operator' : '/dashboard';
        return Response.redirect(new URL(destination, nextUrl));
      }

      return true;
    },

    async jwt({ token, user, trigger, session }) {
      // Inisialisasi token saat login pertama kali
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.name = user.name;
        token.picture = user.image; // Menyimpan nama file gambar di token
      }

      // LOGIKA SINKRONISASI: Menangkap perubahan dari useSession().update() di sisi Client
      if (trigger === "update" && session?.user) {
        if (session.user.name) token.name = session.user.name;
        if (session.user.image) token.picture = session.user.image;
        if (session.user.role) token.role = session.user.role;
      }

      return token;
    },

    async session({ session, token }) {
      // Memindahkan data dari token JWT ke objek session agar bisa diakses di UI/Client
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.name = token.name as string;
        session.user.image = token.picture as string; // Pastikan image terupdate dari token.picture
      }
      return session;
    }
  },
  pages: {
    signIn: '/', // Halaman login kustom
  },
  // Jika kamu menggunakan database session, tambahkan adapter di sini. 
  // Untuk SIMS ini, kita menggunakan JWT (default).
});