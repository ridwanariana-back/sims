import { getAllGuru } from "@/lib/actions";
import AddGuruModal from "@/components/AddGuruModal";
import GuruTable from "@/components/GuruTable";

export default async function GuruPage() {
    const gurus = await getAllGuru(); // Ambil data dari database

    return (
        <div className="p-6 lg:p-10 space-y-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800">Manajemen Data Guru</h1>
          <p className="text-slate-500 text-sm">Kelola informasi tenaga pendidik SIMS</p>
        </div>
        <AddGuruModal />
      </div>

      {/* Table Section dengan Search terintegrasi */}
      <GuruTable initialData={gurus} />
    </div>
    );
}