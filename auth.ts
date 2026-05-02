import NextAuth, { type DefaultSession } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { sql } from '@vercel/postgres';
import bcrypt from 'bcryptjs';

// 1. Deklarasi tipe agar TypeScript mengenali property kustom kita
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: string; 
      username: string;
      image?: string;
    } & DefaultSession['user'];
  }

  interface User {
    role?: string;
    username?: string;
    image?: string;
  }
}

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
            id: user.id,
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
      
      // Definisi Halaman Proteksi
      const isOperatorPage = nextUrl.pathname.startsWith('/operator');
      const isTUPage = nextUrl.pathname.startsWith('/tatausaha');
      const isGuruPage = nextUrl.pathname.startsWith('/guru');
      const isKepalaPage = nextUrl.pathname.startsWith('/kepalasekolah');
      const isKurikulumPage = nextUrl.pathname.startsWith('/wakilkurikulum'); // Baru
      const isKesiswaanPage = nextUrl.pathname.startsWith('/wakilkesiswaan'); // Baru
      
      // Role-based Access Control (Proteksi Rute)
      if (isOperatorPage && (!isLoggedIn || role !== 'operator')) return false;
      if (isTUPage && (!isLoggedIn || role !== 'tatausaha')) return false;
      if (isGuruPage && (!isLoggedIn || role !== 'guru')) return false;
      if (isKepalaPage && (!isLoggedIn || role !== 'kepalasekolah')) return false;
      if (isKurikulumPage && (!isLoggedIn || role !== 'wakilkurikulum')) return false; // Baru[cite: 6]
      if (isKesiswaanPage && (!isLoggedIn || role !== 'wakilkesiswaan')) return false; // Baru[cite: 6]
      
      // Logic Redirect saat Login (Jika user di root '/')
      if (isLoggedIn && nextUrl.pathname === '/') {
        let destination = '/';
        if (role === 'operator') destination = '/operator';
        else if (role === 'tatausaha') destination = '/tatausaha';
        else if (role === 'guru') destination = '/guru';
        else if (role === 'kepalasekolah') destination = '/kepalasekolah';
        else if (role === 'wakilkurikulum') destination = '/wakilkurikulum'; // Baru[cite: 6]
        else if (role === 'wakilkesiswaan') destination = '/wakilkesiswaan'; // Baru[cite: 6]
        
        return Response.redirect(new URL(destination, nextUrl));
      }

      return true;
    },

    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.username = user.username;
        token.name = user.name;
        token.picture = user.image;
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