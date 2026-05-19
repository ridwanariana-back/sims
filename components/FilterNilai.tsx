// components/FilterNilai.tsx
"use client";

import { Search, X, ChevronDown } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition, useRef, useEffect } from "react";
import { checkRombelConflict } from "@/lib/actions";

interface FilterNilaiProps {
  query: string;
  filterKelas: string;
  allMuridList: any[];
  mapelGuru: string;
  tahunAjaran: string;
  guruId: string;
}

export default function FilterNilai({ 
  query, 
  filterKelas, 
  allMuridList, 
  mapelGuru, 
  tahunAjaran, 
  guruId 
}: FilterNilaiProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Autocomplete States
  const [search, setSearch] = useState(query);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Klik di luar dropdown untuk menutup panel menu list
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // LOGIKA UTAMA (Ala Select2): 
  // Jika kolom input kosong, tampilkan SEMUA murid aktif sebagai referensi.
  // Jika kolom input diisi, saring berdasarkan ketikan nama atau NISN.
  const filteredOptions = allMuridList.filter(m => {
    const matchesSearch = search === "" || 
      m.nama.toLowerCase().includes(search.toLowerCase()) || 
      m.nisn.includes(search);
    
    // Opsional: Jika select box kelas di kanan dipilih, ikut saring list dropdown-nya juga
    const matchesKelas = filterKelas === "Semua" || m.kelas === filterKelas;
    
    return matchesSearch && matchesKelas;
  });

  const applySearch = (term: string, kelas: string) => {
    const params = new URLSearchParams(searchParams);
    if (term) params.set("q", term); else params.delete("q");
    if (kelas && kelas !== "Semua") params.set("kelas", kelas); else params.delete("kelas");

    startTransition(() => {
      router.push(`?${params.toString()}`);
    });
  };

  const handleSelectMurid = async (murid: any) => {
  // Pastikan guruId di sini mengirimkan string NIP Guru yang didapat dari prop
  const check = await checkRombelConflict(murid.id, mapelGuru, tahunAjaran, guruId);
  
  if (!check.allowed) {
    alert(check.error);
    setSearch("");
    applySearch("", filterKelas);
    setIsOpen(false);
    return;
  }

  // Jika aman, lanjutkan proses...
  setSearch(murid.nama);
  applySearch(murid.nama, filterKelas);
  setIsOpen(false);
};

  const handleClear = () => {
    setSearch("");
    applySearch("", filterKelas);
  };

  return (
    <div ref={dropdownRef} className="flex flex-col md:flex-row gap-4 items-center bg-slate-50 p-4 rounded-2xl border border-slate-200 relative">
      <div className="relative flex-1 w-full">
        <Search className={`absolute left-4 top-1/2 -translate-y-1/2 ${isPending ? "text-blue-500 animate-pulse" : "text-slate-400"}`} size={20} />
        
        <input
          type="text"
          placeholder="Klik di sini untuk melihat list siswa / ketik nama untuk mencari..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)} // <-- KUNCI UTAMA: Langsung buka list pas kotak diklik/fokus
          className="w-full pl-12 pr-16 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-black text-xs text-slate-800 placeholder-slate-400"
        />

        {/* Indikator Tombol Dropdown ala Select2 */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-slate-400">
          {search && (
            <button onClick={handleClear} className="hover:text-slate-600 transition-colors">
              <X size={16} />
            </button>
          )}
          <ChevronDown size={16} className={`transition-transform duration-200 ${isOpen ? "rotate-180 text-blue-500" : ""}`} />
        </div>

        {/* BOX DROPDOWN LIST AUTOCOMPLETE */}
        {isOpen && (
          <div className="absolute left-0 right-0 top-14 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-64 overflow-y-auto divide-y divide-slate-100 animate-in fade-in slide-in-from-top-2 duration-150">
            {filteredOptions.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400 font-bold uppercase tracking-wider">
                Murid tidak ditemukan
              </div>
            ) : (
              filteredOptions.map((m) => (
                <div
                  key={m.id}
                  onClick={() => handleSelectMurid(m)}
                  className="p-3.5 hover:bg-blue-50/50 cursor-pointer transition-all flex justify-between items-center text-xs font-black group"
                >
                  {/* Format: NAMA - ROMBEL - NISN */}
                  <div className="text-slate-700 group-hover:text-blue-700 uppercase tracking-tight transition-colors">
                    {m.nama} 
                    <span className="mx-2 text-slate-300 font-normal">|</span> 
                    <span className="text-blue-600 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase">
                      {m.rombel}
                    </span> 
                    <span className="mx-2 text-slate-300 font-normal">|</span> 
                    <span className="text-slate-400 font-medium font-mono text-[11px] group-hover:text-blue-500">
                      {m.nisn}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}