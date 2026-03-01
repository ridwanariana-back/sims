'use client';

import React, { useState } from 'react';
import Image from 'next/image'; // Gunakan next/image untuk optimasi otomatis
import { Eye, EyeOff, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsLoading(false);
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-md space-y-6 rounded-xl bg-white p-8 shadow-xl">
        
        {/* Header Section */}
        <div className="text-center space-y-4">
          <h3 className="text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">
            Sistem Informasi Manajemen Sekolah
          </h3>

          {/* Container Logo */}
          <div className="flex justify-center">
            <div className="relative h-32 w-32 md:h-40 md:w-40"> 
              <Image 
                src="/hero.jpg" // Pastikan file ada di folder public/hero.jpg
                alt="Logo SMAN 1 Pemulutan Selatan"
                fill
                priority
                className="object-contain"
              />
            </div>
          </div>

          <p className="text-lg font-medium text-gray-600">
            Silakan masuk ke akun Anda
          </p>
        </div>
        
        {/* Form Section */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700">Username</label>
              <input 
                type="text" 
                required 
                className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all" 
                placeholder="Username Anda"
              />
            </div>
            
            <div className="relative">
              <label className="block text-sm font-semibold text-gray-700">Password</label>
              <input 
                type={showPassword ? "text" : "password"} 
                required 
                className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all" 
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[38px] text-gray-400 hover:text-blue-600 transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-md hover:bg-blue-700 active:scale-[0.98] disabled:opacity-70 transition-all"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Memproses...
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        {/* Footer Kecil (Opsional) */}
        <p className="text-center text-xs text-gray-400">
          &copy; 2026 SMAN 1 Pemulutan Selatan
        </p>
      </div>
    </main>
  );
}