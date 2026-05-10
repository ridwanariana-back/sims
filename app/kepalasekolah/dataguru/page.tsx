import { sql } from "@vercel/postgres";
import GuruTable from "@/components/GuruTableKepsek";
import ExcelGuru from "@/components/ExcelGuru";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function GuruPage() {
    // Proteksi: Pastikan hanya Tata Usaha yang bisa akses[cite: 6]
    const session = await auth();
    if (session?.user?.role !== "kepalasekolah") {
        redirect("/");
    }

    // QUERY DIPERBAIKI: Menggabungkan tabel guru dengan tabel wali_kelas
    const res = await sql`
        SELECT 
            g.*, 
            wk.rombel as wali_kelas_rombel 
        FROM guru g
        LEFT JOIN wali_kelas wk ON g.id = wk.guru_id
        ORDER BY g.nama ASC
    `;
    const gurus = res.rows;

    return (
        <div className="p-6 lg:p-10 space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-extrabold text-slate-800">Manajemen Data Pendidik</h1>
                    <p className="text-slate-500 text-sm">Kelola informasi lengkap Guru & Tenaga Kependidikan</p>
                </div>
            </div>
            <ExcelGuru/>

            {/* Kirim data yang sudah digabung ke GuruTable[cite: 6] */}
            <GuruTable initialData={gurus} />
        </div>
    );
}