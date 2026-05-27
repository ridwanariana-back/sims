'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import { handleLogout, getLogoSekolah } from '@/lib/actions';
import { useSession } from 'next-auth/react';

export default function OperatorLayout({
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
    return `block px-4 py-2 rounded-lg transition-all duration-200 whitespace-nowrap ${
      isActive 
        ? 'bg-blue-600 text-white shadow-md' 
        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
    }`;
  };

  return (
    // 🌟 KUNCI 1: Mengunci tinggi layar penuh agar layout tidak berantakan
    <div className="flex h-screen w-screen bg-gray-100 text-slate-900 overflow-hidden relative">
      
      {/* --- SIDEBAR (SCROLLABLE & AUTO-CLOSE SUPPORT) --- */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out
        flex flex-col h-full
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:translate-x-0 md:static md:block flex-shrink-0
      `}>
        {/* Header Sidebar (Statis di atas) */}
        <div className="p-6 flex flex-col items-center border-b border-slate-800 flex-shrink-0">
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
              <h2 className="text-xl font-bold text-blue-400">SIMS</h2>
            </div>
            <button className="md:hidden text-white text-2xl" onClick={() => setIsOpen(false)}>
              ✕
            </button>
          </div>
        </div>

        {/* 🌟 KUNCI 2: Navigasi Menu bisa di-scroll mandiri */}
        <nav className="flex-1 mt-6 space-y-2 px-4 pb-6 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
          <Link 
            href="/operator" 
            onClick={() => setIsOpen(false)} 
            className={getLinkStyle('/operator')}
          >
            Dashboard
          </Link>
          <Link 
            href="/operator/datauser" 
            onClick={() => setIsOpen(false)} 
            className={getLinkStyle('/operator/datauser')}
          >
            Data User
          </Link>
          <Link 
            href="/operator/datawalikelas" 
            onClick={() => setIsOpen(false)} 
            className={getLinkStyle('/operator/datawalikelas')}
          >
            Data Wali Kelas
          </Link>
        </nav>
      </aside>

      {/* --- OVERLAY SIDEBAR (Mobile) --- */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden" 
          onClick={() => setIsOpen(false)}
        ></div>
      )}

      {/* --- RIGHT AREA WRAPPER (HEADER + CONTENT) --- */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        
        {/* --- HEADER (STAY ON TOP / FIXED) --- */}
        <header className="bg-white border-b border-gray-200 px-4 md:px-8 py-4 flex justify-between items-center shadow-sm flex-shrink-0">
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
              <span className="text-slate-900 capitalize">
                {pathname.split('/').pop() || 'Dashboard'}
              </span>
            </nav>
          </div>

          {/* --- PROFILE SECTION --- */}
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
                    href="/operator/profil" 
                    onClick={() => {
                      setIsProfileOpen(false);
                      setIsOpen(false);
                    }} 
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600"
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
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-medium transition-colors"
                  >
                    Keluar Sistem
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

        {/* --- MAIN CONTENT (SCROLLABLE INDEPENDEN) --- */}
        {/* 🌟 KUNCI 3: Ditambahkan flex-1 overflow-y-auto h-full agar konten halaman ter-scroll mulus */}
        <main className="flex-1 overflow-y-auto h-full p-4 md:p-8 bg-gray-50 scrollbar-thin">
          <div className="animate-in fade-in duration-500">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}