"use client";

import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from "recharts";

const COLORS = ["#2563eb", "#7c3aed", "#db2777", "#ea580c", "#16a34a"];

export default function StatistikChart({ data }: { data: any[] }) {
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400">
        <p className="text-xs font-bold uppercase italic">Belum ada data nilai untuk diolah</p>
      </div>
    );
  }

  return (
    <div className="w-full h-[300px] mt-4">
      <ResponsiveContainer width="100%" height="100%" minHeight={300}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis 
  dataKey="rombel" // Ganti dari "name" menjadi "rombel"
  axisLine={false} 
  tickLine={false} 
  tick={{ fill: "#64748b", fontSize: 10, fontWeight: "bold" }}
/>
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: "#64748b", fontSize: 10, fontWeight: "bold" }}
          />
          <Tooltip 
            cursor={{ fill: "#f8fafc" }}
            contentStyle={{ 
              borderRadius: "16px", 
              border: "none", 
              boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
              fontSize: "12px",
              fontWeight: "bold"
            }}
          />
          <Bar 
  dataKey="rata" // Pastikan ini "rata" sesuai dengan dataGrafik kamu
  radius={[10, 10, 0, 0]} 
  barSize={40}
>
  {data.map((entry, index) => (
    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
  ))}
</Bar>
        </BarChart>
      </ResponsiveContainer >
    </div>
  );
}