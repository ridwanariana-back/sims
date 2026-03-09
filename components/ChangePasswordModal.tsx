"use client";

import { useState } from "react";
import { changePassword } from "@/lib/actions";

export default function ChangePasswordModal() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-all"
      >
        Ganti Password
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsOpen(false)}></div>
          
          <div className="relative bg-white p-8 rounded-xl shadow-2xl w-full max-w-md">
            <h3 className="text-xl font-bold mb-6 text-gray-800">Ganti Password Keamanan</h3>
            
            <form action={async (formData) => {
    const res = await changePassword(formData);
    if (res.success) {
      alert(res.success);
      setIsOpen(false);
    } else {
      alert(res.error);
    }
}} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700">Password Lama</label>
                <input 
                  type="password" 
                  name="oldPassword"
                  required
                  className="w-full border border-gray-300 rounded-lg p-3 mt-1 focus:ring-2 focus:ring-red-500 outline-none" 
                />
              </div>

              <hr />
              
              <div>
                <label className="block text-sm font-semibold text-gray-700">Password Baru</label>
                <input 
                  type="password" 
                  name="newPassword"
                  required
                  className="w-full border border-gray-300 rounded-lg p-3 mt-1 focus:ring-2 focus:ring-blue-500 outline-none" 
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700">Konfirmasi Password Baru</label>
                <input 
                  type="password" 
                  name="confirmPassword"
                  required
                  className="w-full border border-gray-300 rounded-lg p-3 mt-1 focus:ring-2 focus:ring-blue-500 outline-none" 
                />
              </div>

              <div className="flex justify-end gap-3 mt-8">
                <button 
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 shadow-md transition-all active:scale-95"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}