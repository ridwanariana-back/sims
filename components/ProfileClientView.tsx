"use client";

import Image from "next/image";
import { useSession } from "next-auth/react";

export default function ProfileClientView({ initialSession }: { initialSession: any }) {
  // Mengambil data sesi terbaru dari client-side cache
  const { data: session } = useSession();
  
  // Gunakan data dari session (client) jika tersedia, jika tidak pakai initialSession (server)
  const currentUser = session?.user || initialSession.user;

  return (
    <div className="flex items-center gap-6">
      <div className="w-24 h-24 rounded-full bg-gray-100 overflow-hidden relative border-4 border-blue-50 shadow-sm">
        <Image 
          // Mengambil path gambar terbaru secara dinamis
          src={currentUser.image ? `/profil/${currentUser.image}` : "/profil/default.png"} 
          alt="Avatar" 
          fill 
          className="object-cover"
          priority
        />
      </div>
      <div>
        <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold uppercase rounded-full">
          {currentUser.role}
        </span>
        <p className="font-bold text-2xl text-gray-900 mt-1">{currentUser.name}</p>
      </div>
    </div>
  );
}