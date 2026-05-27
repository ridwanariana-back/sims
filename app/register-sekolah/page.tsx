// app/register-sekolah/page.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, School, ArrowLeft } from 'lucide-react';
import { registerSekolahBaru } from '@/lib/actions'; // Pastikan fungsi backend sudah dibuat

export default function RegisterSekolahPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const clientAction = async (formData: FormData) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const result = await registerSekolahBaru(formData);

      if (result && !result.success) {
  setErrorMessage(result.message || 'Gagal mendaftarkan sekolah.');
  setIsLoading(false);
} else if (result && result.data) { // 🚩 TEGASKAN DI SINI KALAU RESULT.DATA ADA
  // Sekarang TypeScript dijamin tidak akan komplain lagi
  alert(
    `🎉 PENDAFTARAN BERHASIL!\n\n` +
    `Sekolah "${result.data.namaSekolah}" sukses terdaftar.\n\n` +
    `BERIKUT DATA LOGIN DEFAULT ANDA:\n` +
    `----------------------------------------\n` +
    `[ Akun Tata Usaha ]\n` +
    `Username: ${result.data.usernameTU}\n` +
    `Password: ${result.data.usernameTU}\n\n` +
    `[ Akun Operator ]\n` +
    `Username: ${result.data.usernameOps}\n` +
    `Password: ${result.data.usernameOps}\n` +
    `----------------------------------------\n` +
    `*Silakan catat/copy akun di atas dan segera ganti password setelah login!`
  );

  router.push('/');
}
    } catch (error: any) {
      setErrorMessage('Terjadi kesalahan sistem yang tidak terduga.');
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-md space-y-6 rounded-xl bg-white p-8 shadow-xl relative">
        
        {/* Tombol Kembali */}
        <button
          onClick={() => router.push('/')}
          className="absolute top-6 left-6 flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors"
          disabled={isLoading}
        >
          <ArrowLeft size={14} />
          <span>Kembali</span>
        </button>

        <div className="text-center space-y-4 pt-4">
          <h3 className="text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">
            Registrasi Sekolah SIMS
          </h3>
          <div className="flex justify-center">
            <div className="relative h-24 w-24 flex items-center justify-center bg-blue-50 text-blue-600 rounded-full border border-blue-100 shadow-sm"> 
              <School size={44} />
            </div>
          </div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Sistem Universal Multi-Tenant Sekolah
          </p>
        </div>
        
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            clientAction(formData);
          }} 
          className="space-y-5"
        >
          {errorMessage && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-500 border border-red-200 text-center">
              {errorMessage}
            </div>
          )}

          <div className="space-y-4">
            {/* Nama Sekolah */}
            <div>
              <label className="block text-sm font-semibold text-gray-700">Nama Sekolah</label>
              <input 
                name="nama_sekolah"
                type="text" 
                placeholder="Contoh: SMAN 1 Indralaya"
                required 
                disabled={isLoading}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none disabled:bg-gray-50 transition-all" 
              />
            </div>
            
            {/* NPSN */}
            <div>
              <label className="block text-sm font-semibold text-gray-700">NPSN Sekolah</label>
              <input 
                name="npsn"
                type="text" 
                maxLength={20}
                placeholder="Masukkan Nomor Pokok Sekolah Nasional"
                required 
                disabled={isLoading}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none disabled:bg-gray-50 transition-all font-mono" 
              />
            </div>

            {/* Alamat */}
            <div>
              <label className="block text-sm font-semibold text-gray-700">Alamat Lengkap</label>
              <textarea 
                name="alamat"
                rows={3}
                placeholder="Jl. Raya Lintas Timur..."
                required 
                disabled={isLoading}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none disabled:bg-gray-50 transition-all resize-none" 
              />
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
                <span>Mendaftarkan...</span>
              </div>
            ) : (
              "Daftarkan Sekolah & Generate Akun"
            )}
          </button>
        </form>
      </div>
    </main>
  );
}