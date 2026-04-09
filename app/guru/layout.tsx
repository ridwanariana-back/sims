'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname,useRouter } from 'next/navigation';
import Image from 'next/image';
import { handleLogout } from '@/lib/actions';
import { useSession } from 'next-auth/react';

export default function GuruLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const pathname = usePathname();

  // Helper function untuk menentukan class active pada sidebar
  const getLinkStyle = (path: string) => {
    const isActive = pathname === path;
    return `block px-4 py-2 rounded-lg transition-all duration-200 ${
      isActive 
        ? 'bg-blue-600 text-white shadow-md' 
        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
    }`;
  };

  return (
    <div className="flex min-h-screen bg-gray-100 text-slate-900 relative">
      
      {/* --- SIDEBAR --- */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:translate-x-0 md:static md:block
      `}>
        <div className="p-6 flex flex-col items-center border-b border-slate-800">
          <div className="flex w-full justify-between items-center md:justify-center">
            <div className="flex items-center gap-2">
              <div className="relative h-8 w-8">
                <Image src="/hero.jpg" alt="Logo" fill className="object-contain" />
              </div>
              <h2 className="text-xl font-bold text-blue-400">SIMS</h2>
            </div>
            <button className="md:hidden text-white text-2xl" onClick={() => setIsOpen(false)}>
              ✕
            </button>
          </div>
        </div>

        <nav className="mt-6 space-y-2 px-4">
          <Link href="/guru" className={getLinkStyle('/guru')}>
            Dashboard
          </Link>
          <Link href="/guru/datamurid" className={getLinkStyle('/guru/datamurid')}>
            Data Murid
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

      {/* --- MAIN CONTENT --- */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 md:px-8 py-4 flex justify-between items-center shadow-sm">
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
                {/* Menampilkan Role secara dinamis dari session */}
                <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600 mt-1">
                  Role: {session?.user?.role || "Guest"}
                </p>
              </div>

              {/* Avatar Dinamis dengan Fallback yang Kuat */}
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
                    href="/guru/profil" 
                    onClick={() => setIsProfileOpen(false)}
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

        <main className="p-4 md:p-8 animate-in fade-in duration-500">
          {children}
        </main>
      </div>
    </div>
  );
}