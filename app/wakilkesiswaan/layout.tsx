// app/kepalasekolah/layout.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import { handleLogout, getLogoSekolah } from '@/lib/actions';
import { useSession } from 'next-auth/react';

export default function KepalaSekolahLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
    const { data: session, status } = useSession();
    const [isOpen, setIsOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [logoSekolah, setLogoSekolah] = useState<string>('sekolah.png');
    const pathname = usePathname();
  
    useEffect(() => {
      async function fetchLogo() {
        const sId = session?.user?.sekolah_id || (session?.user as any)?.sekolahId;
        if (sId) {
          const logo = await getLogoSekolah(sId);
          setLogoSekolah(logo);
        }
      }
      if (status === 'authenticated') {
        fetchLogo();
      }
    }, [session, status]);
  
  // Helper function untuk menentukan class active pada sidebar
  const getLinkStyle = (path: string) => {
    const isActive = pathname === path;
    return `block px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wide transition-all duration-200 ${
      isActive 
        ? 'bg-blue-600 text-white shadow-md border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]' 
        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
    }`;
  };

  return (
    // KUNCI UTAMA 1: Mengunci tinggi layar maksimal sebatas monitor (h-screen) dan mematikan scroll global (overflow-hidden)
    <div className="flex h-screen bg-gray-100 text-slate-900 overflow-hidden relative">
      
      {/* --- SIDEBAR CONTROLLER --- */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out flex flex-col h-full shrink-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:translate-x-0 md:static md:block
      `}>
        {/* Header Logo Brand */}
        <div className="p-6 flex flex-col items-center border-b border-slate-800 shrink-0">
          <div className="flex w-full justify-between items-center md:justify-center">
            <div className="flex items-center gap-2">
              {/* 🌟 LOGO SEKOLAH DINAMIS (Membaca dari folder public/sekolah/) */}
                            <div className="relative h-8 w-8 rounded-md overflow-hidden bg-white flex items-center justify-center p-1">
                              <Image 
                                src={`/sekolah/${logoSekolah}`} 
                                alt="Logo Sekolah" 
                                fill 
                                className="object-contain"
                                priority
                              />
                            </div>
              <h2 className="text-xl font-black text-blue-400 tracking-wider">SIMS</h2>
            </div>
            <button className="md:hidden text-white text-xl font-black" onClick={() => setIsOpen(false)}>
              ✕
            </button>
          </div>
        </div>

        {/* Area Navigasi Sidebar - Sekarang bisa di-scroll mandiri jika menu kepanjangan */}
        <nav className="flex-1 overflow-y-auto pt-4 pb-8 px-4 space-y-2 [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-slate-800 [&::-webkit-scrollbar-thumb]:rounded-full">
          <Link href="/wakilkesiswaan" className={getLinkStyle('/wakilkesiswaan')} onClick={() => setIsOpen(false)}>
            Dashboard
          </Link>
          <Link href="/wakilkesiswaan/dataguru" className={getLinkStyle('/wakilkesiswaan/dataguru')} onClick={() => setIsOpen(false)}>
            Data Guru
          </Link>
          <Link href="/wakilkesiswaan/datamurid" className={getLinkStyle('/wakilkesiswaan/datamurid')} onClick={() => setIsOpen(false)}>
            Data Murid
          </Link>
          <Link href="/wakilkesiswaan/kedisiplinan" className={getLinkStyle('/wakilkesiswaan/kedisiplinan')} onClick={() => setIsOpen(false)}>
            Catatan Kedisiplinan
          </Link>
          <Link href="/wakilkesiswaan/kehadiran" className={getLinkStyle('/wakilkesiswaan/kehadiran')} onClick={() => setIsOpen(false)}>
            Kehadiran
          </Link>
          <Link href="/wakilkesiswaan/prestasi" className={getLinkStyle('/wakilkesiswaan/prestasi')} onClick={() => setIsOpen(false)}>
            Prestasi
          </Link>
          <Link href="/wakilkesiswaan/alumni" className={getLinkStyle('/wakilkesiswaan/alumni')} onClick={() => setIsOpen(false)}>
            Alumni
          </Link>

          {/* Sub Menu Guru */}
          <div className="pt-4 pb-1 px-4 text-[10px] font-black text-slate-500 uppercase border-t border-slate-800/60 mt-4 select-none">
            Menu Guru : 
          </div>
          <Link href="/wakilkesiswaan/inputnilai" className={getLinkStyle('/wakilkesiswaan/inputnilai')} onClick={() => setIsOpen(false)}>
            Input Nilai
          </Link>
          <Link href="/wakilkesiswaan/riwayat-nilai" className={getLinkStyle('/wakilkesiswaan/riwayat-nilai')} onClick={() => setIsOpen(false)}>
            Riwayat Nilai
          </Link>
        </nav>
      </aside>

      {/* --- OVERLAY SIDEBAR (Mobile) --- */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-xs" 
          onClick={() => setIsOpen(false)}
        ></div>
      )}

      {/* --- MAIN CONTENT AREA --- */}
      {/* KUNCI UTAMA 2: Memaksa area kanan memiliki tinggi konstan h-screen dan susunan flex vertical */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        
        {/* Header Atas (Tetap Diam/Sticky) */}
        <header className="bg-white border-b border-gray-200 px-4 md:px-8 py-4 flex justify-between items-center shadow-sm shrink-0">
          <div className="flex items-center gap-4">
            <button 
              className="md:hidden p-2 hover:bg-gray-100 rounded-lg text-2xl"
              onClick={() => setIsOpen(true)}
            >
              ☰
            </button>
            <nav className="flex text-sm font-medium text-gray-500" aria-label="Breadcrumb">
              <span className="hidden sm:inline">System</span>
              <span className="mx-2 hidden sm:inline">/</span>
              <span className="text-slate-900 capitalize font-bold">
                {pathname.split('/').pop() || 'Dashboard'}
              </span>
            </nav>
          </div>

          {/* Profile Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-3 p-1 rounded-full hover:bg-gray-50 transition border border-transparent hover:border-gray-200"
            >
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold leading-none">
                  {status === "loading" ? "Loading..." : session?.user?.name}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600 mt-1">
                  Role: {session?.user?.role || "Guest"}
                </p>
              </div>

              <div className="h-9 w-9 rounded-full relative overflow-hidden border-2 border-white shadow-md bg-blue-600 flex items-center justify-center text-white font-bold">
                <Image 
                  src={session?.user?.image ? `/profil/${session.user.image}` : "/profil/default.png"} 
                  alt="Profile" 
                  fill 
                  className="object-cover"
                  priority
                />
              </div>
            </button>

            {isProfileOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsProfileOpen(false)}></div>
                <div className="absolute right-0 mt-3 w-52 bg-white rounded-xl shadow-2xl border border-gray-100 py-2 z-20 animate-in fade-in zoom-in duration-150">
                  <div className="px-4 py-2 border-b border-gray-50 mb-1">
                    <p className="text-xs text-gray-400">Role Anda</p>
                    <p className="text-sm font-bold truncate text-blue-600 capitalize">
                      {session?.user?.role}
                    </p>
                  </div>
                  <Link 
                    href="/wakilkesiswaan/profil" 
                    onClick={() => setIsProfileOpen(false)}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 font-bold"
                  >
                    Profil Saya
                  </Link>
                  <hr className="my-1 border-gray-100" />
                  <button 
                    onClick={async () => {
                      await handleLogout();
                      router.refresh();
                      router.push('/');
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-bold transition-colors"
                  >
                    Keluar Sistem
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

        {/* KUNCI UTAMA 3: Bagian isi halaman dibuat scrollable mandiri di sini! */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-100 animate-in fade-in duration-500">
          {children}
        </main>
      </div>
    </div>
  );
}