"use client";

import { useState } from "react";
import { Search, Trash2, Edit, Key, X, ChevronLeft, ChevronRight, Info } from "lucide-react";
import { deleteUser, updateUser, resetPassword } from "@/lib/actions";
import Image from "next/image";

export default function UserTable({ initialData }: { initialData: any[] }) {
  // State untuk Search & Pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);

  // State untuk Modal Edit
  const [editingUser, setEditingUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // 1. Logika Filter Search (Nama atau Username)
  const filteredUsers = initialData.filter((user) =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 2. Logika Pagination
  const totalPages = Math.ceil(filteredUsers.length / rowsPerPage);
  const indexOfLastItem = currentPage * rowsPerPage;
  const indexOfFirstItem = indexOfLastItem - rowsPerPage;
  const currentItems = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);

  // Handler Hapus (Aturan: Selain Tata Usaha boleh dihapus)
  const handleDelete = async (id: number, name: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus akun ${name}?`)) {
      const res = await deleteUser(id);
      if (res.success) {
        alert("Akun berhasil dihapus!");
      } else {
        alert(res.error);
      }
    }
  };

  // Handler Update Profil (Hanya kirim Nama)[cite: 8]
  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const res = await updateUser(editingUser.id, formData);
    
    if (res.success) {
      setEditingUser(null);
      alert("Profil berhasil diperbarui!");
    } else {
      alert(res.error);
    }
    setLoading(false);
  };

  // Handler Reset Password
  const handleReset = async (user: any) => {
    if (confirm(`Reset password ${user.name} ke default (NIP: ${user.username})?`)) {
      const res = await resetPassword(user.id, user.username);
      if (res.success) alert("Password berhasil direset ke NIP!");
      else alert(res.error);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header: Search & Show Per Page */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <select 
            value={rowsPerPage}
            onChange={(e) => {
              setRowsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="border border-gray-200 rounded-lg p-1.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white"
          >
            {[5, 10, 20, 50].map((num) => (
              <option key={num} value={num}>Show {num}</option>
            ))}
          </select>
          <div className="text-sm text-gray-500">
            Total <span className="font-bold text-gray-800">{filteredUsers.length}</span> Akun
          </div>
        </div>
        
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Cari nama atau username..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Username</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {currentItems.length > 0 ? (
                currentItems.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative h-10 w-10 rounded-full overflow-hidden border border-gray-200 bg-gray-100">
                          <Image 
                            src={user.image?.startsWith('http') ? user.image : `/profil/${user.image || 'default.png'}`}
                            alt={user.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <span className="text-sm font-semibold text-slate-700">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 font-mono">{user.username}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                        user.role === 'tatausaha' ? 'bg-purple-100 text-purple-700' : 
                        user.role === 'operator' ? 'bg-blue-100 text-blue-700' : 
                        user.role === 'kepalasekolah' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2">
                        <button 
                          onClick={() => setEditingUser(user)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" 
                          title="Edit Profil"
                        >
                          <Edit size={16} />
                        </button>

                        <button 
                          onClick={() => handleReset(user)}
                          className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" 
                          title="Reset Password ke NIP"
                        >
                          <Key size={16} />
                        </button>

                        {user.role !== "tatausaha" && (
                          <button 
                            onClick={() => handleDelete(user.id, user.name)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Hapus Akun"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-gray-400 italic text-sm">
                    User tidak ditemukan...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-gray-100 flex items-center justify-between">
          <div className="text-xs text-gray-500">
            Halaman <span className="font-bold text-gray-800">{currentPage}</span> dari {totalPages || 1}
          </div>
          <div className="flex gap-2">
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => prev - 1)}
              className="p-2 border rounded-lg bg-white hover:bg-gray-50 disabled:opacity-50 transition-all shadow-sm"
            >
              <ChevronLeft size={16} />
            </button>
            <button 
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => setCurrentPage(prev => prev + 1)}
              className="p-2 border rounded-lg bg-white hover:bg-gray-50 disabled:opacity-50 transition-all shadow-sm"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* MODAL EDIT PROFIL[cite: 7, 10] */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl relative animate-in fade-in zoom-in duration-200 border border-indigo-100">
            <button 
              onClick={() => setEditingUser(null)} 
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>
            
            <h3 className="text-xl font-black mb-1 text-slate-800 uppercase tracking-tight">Edit Profil User</h3>
            <p className="text-xs text-slate-500 mb-6 font-medium">Perbarui informasi nama akun pengguna.</p>
            
            <form onSubmit={handleUpdate} className="space-y-5">
              {/* Input Nama (Bisa diubah)[cite: 10] */}
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-1.5 ml-1 tracking-wider">
                  Nama Lengkap
                </label>
                <input 
                  name="name" 
                  type="text"
                  defaultValue={editingUser.name}
                  required 
                  placeholder="Masukkan nama lengkap..."
                  className="w-full border-2 border-slate-100 p-3 rounded-xl outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm font-bold text-slate-700 bg-slate-50/50" 
                />
              </div>

              {/* Input Username (Terkunci/NIP)[cite: 7, 8] */}
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-1 tracking-wider">
                  Username (NIP)
                </label>
                <div className="relative group">
                  <input 
                    name="username" 
                    type="text"
                    value={editingUser.username}
                    readOnly // Mencegah perubahan manual[cite: 8]
                    className="w-full border-2 border-slate-100 p-3 rounded-xl text-sm font-bold text-slate-400 bg-slate-100 cursor-not-allowed transition-all" 
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300">
                    <Info size={16} />
                  </div>
                </div>
                <p className="text-[9px] text-slate-400 mt-2 ml-1 leading-relaxed italic">
                  * Username disinkronkan dengan NIP di data Guru fisik (Tata Usaha).
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setEditingUser(null)} 
                  className="flex-1 bg-slate-50 py-3 rounded-xl hover:bg-slate-100 transition font-bold text-slate-500 text-xs uppercase tracking-widest border-2 border-transparent"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={loading} 
                  className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-black hover:bg-indigo-700 transition disabled:opacity-50 shadow-lg shadow-indigo-200 text-xs uppercase tracking-widest"
                >
                  {loading ? "Proses..." : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}