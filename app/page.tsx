'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation'; // Pastikan import dari next/navigation
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { authenticate } from '@/lib/actions';

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const clientAction = async (formData: FormData) => {
    setIsLoading(true);
    setErrorMessage(null);
    
    try {
      // Memanggil Server Action authenticate
      const result = await authenticate(formData);
      
      // Jika authenticate mengembalikan string (pesan error)
      if (result) {
        setErrorMessage(result);
        setIsLoading(false); // Matikan loading hanya jika ada error
      } else {
        // Jika berhasil, arahkan ke dashboard operator
        // Jangan set isLoading(false) agar tombol tetap loading saat transisi halaman
        router.push('/operator');
      }
    } catch (error: any) {
      // Menangani error internal Next.js (seperti redirect)
      if (error.message === 'NEXT_REDIRECT') {
        return; 
      }
      
      setErrorMessage("Terjadi kesalahan sistem. Silakan coba lagi.");
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-md space-y-6 rounded-xl bg-white p-8 shadow-xl">
        <div className="text-center space-y-4">
          <h3 className="text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">
            SIMS Pemulutan Selatan
          </h3>
          <div className="flex justify-center">
            <div className="relative h-32 w-32"> 
              <Image 
                src="/hero.jpg" 
                alt="Logo Sekolah"
                fill
                priority
                className="object-contain"
              />
            </div>
          </div>
        </div>
        
        {/* Menggunakan onSubmit agar state isLoading lebih terkontrol */}
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            clientAction(formData);
          }} 
          className="space-y-5"
        >
          {errorMessage && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-500 border border-red-200 text-center animate-in fade-in duration-300">
              {errorMessage}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700">Username</label>
              <input 
                name="username"
                type="text" 
                required 
                disabled={isLoading}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none disabled:bg-gray-50 transition-all" 
              />
            </div>
            
            <div className="relative">
              <label className="block text-sm font-semibold text-gray-700">Password</label>
              <input 
                name="password"
                type={showPassword ? "text" : "password"} 
                required 
                disabled={isLoading}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none disabled:bg-gray-50 transition-all" 
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[38px] text-gray-400 hover:text-gray-600"
                disabled={isLoading}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-md hover:bg-blue-700 disabled:bg-blue-400 transition-all active:scale-[0.98]"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Memproses...</span>
              </div>
            ) : (
              "Sign In"
            )}
          </button>
        </form>
      </div>
    </main>
  );
}