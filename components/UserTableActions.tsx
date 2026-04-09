"use client";

import { Trash2, Edit } from "lucide-react";
import { deleteUser } from "@/lib/actions"; // Pastikan buat fungsi ini di actions.ts

export default function UserTableActions({ user }: { user: any }) {
  const handleDelete = async () => {
    if (confirm(`Hapus akun ${user.name}?`)) {
      const res = await deleteUser(user.id);
      if (!res.success) alert(res.error);
    }
  };

  return (
    <div className="flex justify-center gap-2">
      {/* Tombol Edit selalu ada untuk Tata Usaha & Guru */}
      <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
        <Edit size={16} />
      </button>

      {/* Tombol Hapus KHUSUS role GURU */}
      {user.role === "guru" ? (
        <button 
          onClick={handleDelete}
          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <Trash2 size={16} />
        </button>
      ) : (
        <div className="w-8"></div> // Spacer agar layout tetap rapi
      )}
    </div>
  );
}