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

        // Ambil data user dari database
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
      
      const isOperatorPage = nextUrl.pathname.startsWith('/operator');
      const isTUPage = nextUrl.pathname.startsWith('/tatausaha');
      const isGuruPage = nextUrl.pathname.startsWith('/guru');
      const isKepalaPage = nextUrl.pathname.startsWith('/kepalasekolah'); // Proteksi baru
      
      // Role-based Access Control
      if (isOperatorPage) {
        if (isLoggedIn && role === 'operator') return true;
        return false; 
      }

      if (isTUPage) {
        if (isLoggedIn && role === 'tatausaha') return true;
        return false; 
      }

      if (isGuruPage) {
        if (isLoggedIn && role === 'guru') return true;
        return false; 
      }

      if (isKepalaPage) {
        if (isLoggedIn && role === 'kepalasekolah') return true;
        return false; 
      }
      
      // Redirect login berdasarkan role
      if (isLoggedIn && nextUrl.pathname === '/') {
        let destination = '/';
        if (role === 'operator') destination = '/operator';
        else if (role === 'tatausaha') destination = '/tatausaha';
        else if (role === 'guru') destination = '/guru';
        else if (role === 'kepalasekolah') destination = '/kepalasekolah'; // Redirect kepala sekolah
        
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
    maxAge: 30 * 24 * 60 * 60, // 30 hari
  },
});