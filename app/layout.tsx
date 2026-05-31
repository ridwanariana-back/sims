import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
// 1. Impor SessionProvider
import { SessionProvider } from "next-auth/react";
import NextTopLoader from "nextjs-toploader";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sistem Informasi Manajemen Sekolah",
  description: "Sistem Informasi Manajemen Sekolah Multi Tenant",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NextTopLoader 
          color="#2563eb" // 🔥 Warna biru mantap (Tailwind blue-600) menyesuaikan tema SIMS abang
          initialPosition={0.08}
          crawlSpeed={200}
          height={3} // Ketebalan loading bar dalam pixel
          crawl={true}
          showSpinner={false} // Matikan spinner bundar di pojok kanan agar clean (hanya bar atas saja)
          easing="ease"
          speed={200}
          shadow="0 0 10px #2563eb,0 0 5px #2563eb"
        />
        {/* 2. Bungkus children dengan SessionProvider */}
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}