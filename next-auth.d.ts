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
      tahunAjaran: string | null; // Data tahun ajaran dari tabel wali_kelas[cite: 3]
    } & DefaultSession["user"];
  }

  interface User {
    id?: string;
    role?: string;
    username?: string;
    image?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    username: string;
    isWaliKelas?: boolean;
    kelasWali?: string | null;
    tahunAjaran?: string | null; // Data tahun ajaran di dalam token[cite: 3]
  }
}