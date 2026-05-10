"use client";
import { Download } from "lucide-react";

export default function ExcelKedisiplinan() {
  const handleDownload = async () => {
    window.location.href = "/api/export-kedisiplinan";
  };

  return (
    <button 
      onClick={handleDownload}
      className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-xs transition-all shadow-lg shadow-green-200"
    >
      <Download size={16} />
      CETAK EXCEL
    </button>
  );
}