import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

export async function GET() {
  try {
    const res = await sql`
      SELECT guru.nama as nama_guru,guru.nip,
      jadwal_pelajaran.hari,jadwal_pelajaran.mapel,jadwal_pelajaran.kelas,jadwal_pelajaran.rombel,
      jadwal_pelajaran.jam_mulai,jadwal_pelajaran.jam_selesai,jadwal_pelajaran.tahun_ajaran
      FROM jadwal_pelajaran 
      JOIN guru ON jadwal_pelajaran.mapel=guru.mapel
      ORDER BY guru.nama ASC
    `;
    
    // Buat worksheet
    const worksheet = XLSX.utils.json_to_sheet(res.rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data Jadwal");

    // Generate buffer
    const buf = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Disposition": 'attachment; filename="Data_Jadwal_SMAN1_Pemulutan_Selatan.xlsx"',
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Gagal export" }, { status: 500 });
  }
}