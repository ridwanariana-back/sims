"use client";

import { useState } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { updateProfile } from "@/lib/actions";
import { useRouter } from "next/navigation";

export default function EditProfileModal({ session: initialSession }: { session: any }) {
  const { data: session, update } = useSession();
  const router = useRouter();
  
  const currentUser = session?.user || initialSession.user;
  const isGuru = currentUser.role === 'guru';

  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(currentUser.name || "");
  
  const initialImage = currentUser.image ? `/profil/${currentUser.image}` : "/profil/default.png";
  const [preview, setPreview] = useState(initialImage);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
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
    
    // Jika guru, pastikan name yang dikirim adalah name asli agar tidak berubah di DB
    if (isGuru) {
      formData.set('name', currentUser.name);
    }

    const result = await updateProfile(formData);

    if (result.success) {
      await update({
        ...currentUser,
        name: formData.get('name'), 
        image: result.image 
      });

      router.refresh();
      alert("Profil berhasil diperbarui!");
      setIsOpen(false);
    } else {
      alert(result.error || "Terjadi kesalahan.");
    }
    setLoading(false);
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-all shadow-sm"
      >
        {isGuru ? "Ganti Foto Profil" : "Edit Profil"}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4 transition-all">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 relative">
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <h3 className="text-xl font-bold mb-6 text-gray-800">{isGuru ? "Ganti Foto Profil" : "Edit Informasi Profil"}</h3>
            
            <form onSubmit={handleSubmit} className="space-y-5">
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

              <div>
                <label className={`block text-sm font-semibold mb-1 ${isGuru ? "text-gray-400" : "text-gray-700"}`}>
                  Nama Lengkap {isGuru && "(Hanya Tata Usaha yang bisa mengubah)"}
                </label>
                <input
                  type="text"
                  name="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isGuru}
                  className={`w-full px-4 py-2 border rounded-lg outline-none transition-all ${
                    isGuru ? "bg-gray-100 text-gray-500 cursor-not-allowed border-gray-200" : "border-gray-300 focus:ring-2 focus:ring-blue-500"
                  }`}
                  required
                />
              </div>

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