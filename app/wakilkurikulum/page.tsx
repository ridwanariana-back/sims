import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export default async function WakilKurikulumDashboardPage() {
  const session = await auth();

  // Proteksi Halaman: Hanya boleh diakses oleh role 'operator'
  if (!session || session.user.role !== 'wakilkurikulum') {
    redirect('/');
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header Info */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard Guru</h1>
        <p className="text-gray-500">Selamat datang kembali, {session.user.name}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Guru', val: '0', color: 'text-green-600' },
          { label: 'Total Murid', val: '0', color: 'text-blue-600' },
          { label: 'Total Kelas ', val: '0', color: 'text-purple-600' },
          { label: 'Persentase Ketuntasan', val: '0%', color: 'text-orange-600' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
            <p className="text-xs text-gray-400 font-semibold uppercase">{stat.label}</p>
            <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.val}</p>
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 min-h-[400px]">
        <h3 className="font-bold text-gray-700">Laporan Grafik Utama</h3>
        <p className="text-sm text-gray-400 mb-4">Data statistik bulan ini</p>
        
        <div className="flex items-center justify-center h-64 border-2 border-dashed border-gray-100 rounded-lg">
          <p className="text-gray-300 italic">Grafik data siswa akan muncul di sini setelah database terisi.</p>
        </div>
      </div>
    </div>
  );
}