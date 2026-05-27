// middleware.ts
import { auth } from "@/auth";

export default auth((req) => {
  // Biarkan kosong untuk menyerahkan kendali penuh ke auth.ts
});

export const config = {
  // 🚩 Tambahkan 'register-sekolah' dan 'hero.jpg' ke dalam daftar pengecualian matcher
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|register-sekolah|hero.jpg).*)"],
};