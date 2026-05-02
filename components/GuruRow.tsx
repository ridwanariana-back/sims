"use client";

import { useState } from "react";
import { Edit2, School } from "lucide-react";
import Link from "next/link";
import ModalWaliKelas from "./ModalWaliKelas";

export default function GuruRow({ guru }: { guru: any }) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <tr className="hover:bg-slate-50/50 transition-all">
        <td className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden">
                {/* Image Placeholder */}
            </div>
            <div>
              <p className="font-bold text-slate-900">{guru.nama}</p>
              <p className="text-xs font-mono text-slate-400">{guru.nip || "-"}</p>
            </div>
          </div>
        </td>
        <td className="p-6">
          <div className="space-y-1">
            <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded uppercase border border-blue-100">
              {guru.jenis}
            </span>
            <p className="text-xs text-slate-500 font-medium">{guru.status}</p>
          </div>
        </td>
        <td className="p-6">
          {guru.wali_kelas ? (
            <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-black rounded-full">
              Kelas {guru.wali_kelas}
            </span>
          ) : (
            <span className="text-slate-300 text-xs italic">Bukan Wali Kelas</span>
          )}
        </td>
        <td className="p-6">
          <div className="flex justify-center gap-2">
            <button 
              onClick={() => setShowModal(true)}
              className="p-2.5 bg-white border border-slate-200 text-blue-600 rounded-xl hover:bg-blue-50 transition-all shadow-sm"
              title="Set Wali Kelas"
            >
              <School size={18} />
            </button>
            <Link 
              href={`/operator/guru/edit/${guru.id}`}
              className="p-2.5 bg-white border border-slate-200 text-amber-600 rounded-xl hover:bg-amber-50 transition-all shadow-sm"
            >
              <Edit2 size={18} />
            </Link>
          </div>
        </td>
      </tr>

      <ModalWaliKelas 
        guru={guru} 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
      />
    </>
  );
}