import { auth } from "@/auth";

export default auth((req) => {
  // Middleware ini sekarang akan menjalankan logika 'authorized' 
  // yang sudah kita tulis di file auth.ts secara otomatis.
});

export const config = {
  // Matcher ini mengatur halaman mana saja yang harus melewati middleware
  // Kita mengecualikan file statis, gambar, dan api auth agar tidak looping
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};