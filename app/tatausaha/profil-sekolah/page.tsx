'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { Loader2, School, Upload, CheckCircle, AlertTriangle } from 'lucide-react';
import { getProfilSekolah, updateProfilSekolah } from '@/lib/actions';

interface SekolahData {
  id: number;
  nama_sekolah: string;
  npsn: string;
  alamat: string;
  gambar: string;
}

export default function ProfilSekolahPage() {
  const { data: session, status } = useSession();
  const [sekolah, setSekolah] = useState<SekolahData | null>(null);
  const [isLoadingFetch, setIsLoadingFetch] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // State manajemen pesan feedback
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  
  // State untuk Live Preview Gambar
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const sekolahId = session?.user?.sekolah_id || (session?.user as any)?.sekolahId;

  // 1. Fetch data sekolah saat component di-load
  useEffect(() => {
    async function initData() {
      if (sekolahId) {
        const data = await getProfilSekolah(sekolahId);
        if (data) {
          setSekolah(data as SekolahData);
        }
        setIsLoadingFetch(false);
      }
    }
    if (status === 'authenticated') {
      initData();
    }
  }, [sekolahId, status]);

  // 2. Handle perubahan file gambar untuk Live Preview
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validasi Ukuran Client-Side (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setFeedback({ type: 'error', message: 'Ukuran file terlalu besar! Maksimal adalah 5MB.' });
        e.target.value = ''; // Reset input
        return;
      }
      // Validasi Tipe File Client-Side
      if (!file.type.startsWith('image/')) {
        setFeedback({ type: 'error', message: 'File yang dipilih harus berupa gambar!' });
        e.target.value = ''; 
        return;
      }

      setFeedback(null);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  // 3. Handle pengiriman form (Client Action)
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!sekolahId) return;

    setIsSubmitting(true);
    setFeedback(null);

    const formData = new FormData(e.currentTarget);
    const result = await updateProfilSekolah(formData, sekolahId);

    setIsSubmitting(false);

    if (result.success) {
      setFeedback({ type: 'success', message: result.message });
      // Ambil data terbaru untuk sinkronisasi state
      const updatedData = await getProfilSekolah(sekolahId);
      if (updatedData) {
        setSekolah(updatedData as SekolahData);
        setPreviewUrl(null); // Bersihkan objek url preview karena sudah tersimpan di DB
      }
      // Info: Halaman layout otomatis ter-update karena revalidatePath di backend
    } else {
      setFeedback({ type: 'error', message: result.message });
    }
  };

  if (status === 'loading' || isLoadingFetch) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        <p className="text-sm font-semibold text-gray-500">Memuat Data Profil Sekolah...</p>
      </div>
    );
  }

  if (!sekolah) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-xl text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-2" />
        <p className="font-bold">Data Sekolah Tidak Ditemukan!</p>
        <p className="text-sm mt-1">Pastikan ID Sekolah Anda sudah ter-link dengan benar di dalam session akun Anda.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header Halaman */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Profil & Identitas Sekolah</h1>
        <p className="text-sm text-gray-500">Kelola informasi publik, nomor pokok nasional, serta logo sistem multi-tenant sekolah Anda di sini.</p>
      </div>

      {/* Alert Status Feedback */}
      {feedback && (
        <div className={`p-4 rounded-xl border flex items-start gap-3 text-sm animate-in fade-in zoom-in-95 duration-200 ${
          feedback.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          {feedback.type === 'success' ? <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0" /> : <AlertTriangle className="h-5 w-5 text-rose-600 flex-shrink-0" />}
          <div>
            <span className="font-bold">{feedback.type === 'success' ? 'Sukses!' : 'Perhatian!'}</span> {feedback.message}
          </div>
        </div>
      )}

      {/* Main Grid Card Form */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
          
          {/* Section 1: Pengaturan Logo */}
          <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-gray-100">
            <div className="relative h-24 w-24 rounded-2xl overflow-hidden bg-gray-50 border border-gray-200 shadow-inner flex items-center justify-center p-2 flex-shrink-0">
              <Image 
                src={previewUrl ? previewUrl : `/sekolah/${sekolah.gambar}`}
                alt="Logo Sekolah Current"
                fill
                className="object-contain"
                unoptimized={!!previewUrl} // Mencegah caching bermasalah pada objek URL blob local
              />
            </div>
            
            <div className="flex-1 text-center sm:text-left space-y-2">
              <label className="block text-sm font-bold text-gray-800">Logo Sistem Sekolah</label>
              <p className="text-xs text-gray-400 leading-normal">
                Format file diizinkan: gambar saja (PNG, JPG, JPEG).<br />
                Ukuran maksimal file: <strong>5 MegaBytes (5MB)</strong>.
              </p>
              
              <div className="pt-1 flex justify-center sm:justify-start">
                <label className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer transition active:scale-[0.98]">
                  <Upload size={14} />
                  <span>Pilih Gambar Baru</span>
                  <input 
                    type="file" 
                    name="gambar_file" 
                    accept="image/*" 
                    onChange={handleImageChange}
                    className="hidden" 
                    disabled={isSubmitting}
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Section 2: Informasi Data Teks */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* Nama Sekolah */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700">Nama Resmi Sekolah</label>
              <input 
                type="text"
                name="nama_sekolah"
                defaultValue={sekolah.nama_sekolah}
                required
                disabled={isSubmitting}
                placeholder="Masukkan nama resmi instansi sekolah"
                className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none disabled:bg-gray-50 transition-all font-medium"
              />
            </div>

            {/* NPSN */}
            <div>
              <label className="block text-sm font-semibold text-gray-700">NPSN (Nomor Pokok Sekolah Nasional)</label>
              <input 
                type="text"
                name="npsn"
                defaultValue={sekolah.npsn}
                required
                maxLength={20}
                disabled={isSubmitting}
                placeholder="Masukkan NPSN valid"
                className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none disabled:bg-gray-50 transition-all font-mono font-bold text-gray-800"
              />
            </div>

            {/* Jenis Tenant - Read Only / Informasi saja */}
            <div>
              <label className="block text-sm font-semibold text-gray-400">ID Identitas Tenant Sistem</label>
              <div className="mt-1 flex items-center gap-2 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-400 font-mono text-sm">
                <School size={16} />
                <span>TENANT_ID_00{sekolah.id}</span>
              </div>
            </div>

            {/* Alamat Sekolah */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700">Alamat Lengkap Instansi</label>
              <textarea 
                name="alamat"
                defaultValue={sekolah.alamat}
                required
                rows={4}
                disabled={isSubmitting}
                placeholder="Tuliskan jalan, kelurahan, kecamatan, kabupaten/kota..."
                className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none disabled:bg-gray-50 transition-all resize-none leading-relaxed text-sm"
              />
            </div>

          </div>

          {/* Form Action Buttons */}
          <div className="pt-4 border-t border-gray-100 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-6 py-3 rounded-lg shadow-md disabled:bg-blue-400 transition active:scale-[0.98]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Menyimpan Perubahan...</span>
                </>
              ) : (
                "Simpan Semua Perubahan"
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}