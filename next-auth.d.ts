import NextAuth, { DefaultSession } from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      username: string;
      isWaliKelas: boolean;
      kelasWali: string | null;
      tahunAjaran: string | null;
      sekolah_id?: number | null;
    } & DefaultSession["user"];
  }

  interface User {
    id?: string;
    role?: string;
    username?: string;
    image?: string;
    sekolah_id?: number | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    username: string;
    isWaliKelas?: boolean;
    kelasWali?: string | null;
    tahunAjaran?: string | null;
    sekolah_id?: number | null;
  }
}