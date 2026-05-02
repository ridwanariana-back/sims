import { sql } from "@vercel/postgres";
import AddGuruModal from "@/components/AddGuruModal";
import GuruTable from "@/components/GuruTable";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function GuruPage() {
    // Proteksi: Pastikan hanya Tata Usaha yang bisa akses
    const session = await auth();
    if (session?.user?.role !== "tatausaha") {
        redirect("/");
    }

    // Ambil data guru terbaru
    const res = await sql`SELECT * FROM guru ORDER BY nama ASC`;
    const gurus = res.rows;

    return (
        <div className="p-6 lg:p-10 space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-extrabold text-slate-800">Manajemen Data Pendidik</h1>
                    <p className="text-slate-500 text-sm">Kelola informasi lengkap Guru & Tenaga Kependidikan</p>
                </div>
                <AddGuruModal />
            </div>

            <GuruTable initialData={gurus} />
        </div>
    );
}