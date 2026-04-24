"use client";

import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

export default function FilterNilai({ query, filterKelas }: { query: string; filterKelas: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const updateSearch = (term: string, kelas: string) => {
    const params = new URLSearchParams(searchParams);
    
    if (term) params.set("q", term);
    else params.delete("q");
    
    if (kelas && kelas !== "Semua") params.set("kelas", kelas);
    else params.delete("kelas");

    // Menggunakan startTransition agar navigasi lebih halus
    startTransition(() => {
      router.push(`?${params.toString()}`);
    });
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 items-center bg-slate-50 p-4 rounded-2xl border border-slate-200">
      <div className="relative flex-1 w-full">
        <Search className={`absolute left-4 top-1/2 -translate-y-1/2 ${isPending ? "text-blue-500 animate-pulse" : "text-slate-400"}`} size={20} />
        <input
          type="text"
          placeholder="Cari Nama Siswa atau NISN..."
          defaultValue={query}
          onChange={(e) => updateSearch(e.target.value, filterKelas)}
          className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
        />
      </div>
      <select
        defaultValue={filterKelas}
        onChange={(e) => updateSearch(query, e.target.value)}
        className="w-full md:w-48 px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none font-semibold text-slate-700 cursor-pointer"
      >
        <option value="Semua">Semua Kelas</option>
        <option value="X">Kelas X</option>
        <option value="XI">Kelas XI</option>
        <option value="XII">Kelas XII</option>
      </select>
    </div>
  );
}