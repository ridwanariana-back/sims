import { getAllMurid } from "@/lib/actions";
import MuridTable from "@/components/MuridTable";
import AddMuridModal from "@/components/AddMuridModal"; // Buat form sederhana seperti AddGuruModal

export default async function DataMuridPage() {
  const data = await getAllMurid();

  return (
    <div className="p-6 lg:p-10 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800">Data Induk Murid</h1>
          <p className="text-slate-500 text-sm">Manajemen informasi siswa/siswi aktif</p>
        </div>
        <AddMuridModal />
      </div>
      <MuridTable initialData={data as any} />
    </div>
  );
}