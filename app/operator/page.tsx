export default function DashboardPage() {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Guru', val: '0', color: 'text-green-600' },
          { label: 'Total Murid', val: '0', color: 'text-blue-600' },
          { label: 'Total Kelas ', val: '0', color: 'text-purple-600' },
          { label: 'Persentase Ketuntasan Belajar', val: '0%', color: 'text-orange-600' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
            <p className="text-xs text-gray-400 font-semibold uppercase">{stat.label}</p>
            <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.val}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 min-h-[400px]">
        <h3 className="font-bold text-gray-700">Laporan Grafik Utama</h3>
        <p className="text-sm text-gray-400">Data statistik bulan ini</p>
        {/* Tempat chart/grafik nantinya */}
      </div>
    </>
  );
}