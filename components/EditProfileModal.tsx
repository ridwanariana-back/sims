"use client";

import { useState } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { updateProfile } from "@/lib/actions";

export default function EditProfileModal({ session: initialSession }: { session: any }) {
  const { update } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(initialSession?.user?.name || "");
  
  // State untuk preview gambar
  const initialImage = initialSession?.user?.image 
    ? `/profil/${initialSession.user.image}` 
    : "/profil/default.png";
  const [preview, setPreview] = useState(initialImage);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validasi ukuran file maks 2MB
      if (file.size > 2 * 1024 * 1024) {
        alert("Ukuran gambar terlalu besar! Maksimal 2MB.");
        e.target.value = "";
        return;
      }
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await updateProfile(formData);

    if (result.success) {
      // Memperbarui sesi client secara instan
      await update({
        ...initialSession,
        user: { 
          ...initialSession.user, 
          name: formData.get('name'), 
          image: result.image 
        }
      });
      alert("Profil berhasil diperbarui!");
      setIsOpen(false); // Menutup modal setelah sukses
    } else {
      alert(result.error || "Terjadi kesalahan.");
    }
    setLoading(false);
  };

  return (
    <>
      {/* Tombol pemicu modal */}
      <button 
        onClick={() => setIsOpen(true)}
        className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-all shadow-sm"
      >
        Edit Profil
      </button>

      {/* Overlay Modal dengan efek Blur */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4 transition-all">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 relative animate-in fade-in zoom-in duration-200">
            {/* Tombol Close */}
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <h3 className="text-xl font-bold mb-6 text-gray-800">Edit Informasi Profil</h3>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Preview & Input Gambar */}
              <div className="flex flex-col items-center gap-4">
                <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-blue-50 shadow-md">
                  <Image src={preview} alt="Preview" fill className="object-cover" />
                </div>
                <input 
                  type="file" 
                  name="image" 
                  accept="image/*" 
                  onChange={handleImageChange}
                  className="text-xs text-gray-500 cursor-pointer file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>

              {/* Input Nama */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  name="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  required
                />
              </div>

              {/* Tombol Aksi */}
              <div className="flex gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg font-bold hover:bg-green-700 disabled:bg-gray-400 transition-colors shadow-sm"
                >
                  {loading ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}