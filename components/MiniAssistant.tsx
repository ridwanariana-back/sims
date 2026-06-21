// components/MiniAssistant.tsx
"use client";

import { useState, useEffect } from "react";
import { X, ChevronRight, Lightbulb } from "lucide-react";
import { usePathname } from "next/navigation";

export default function MiniAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [msgIndex, setMsgIndex] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);
  
  const pathname = usePathname(); 

  const getMessagesForPage = () => {
    if (pathname === "/") {
      return [
        "Halo! Selamat datang di SIMS. Silakan masukkan Username dan Password Anda untuk masuk. 👋",
        "Pastikan Caps Lock tidak menyala saat mengetikkan password ya!",
        "Belum punya akun sekolah? Anda bisa klik tulisan 'DAFTARKAN SEKOLAH BARU ANDA' di bawah."
      ];
    } else if (pathname === "/register-sekolah") {
      return [
        "Mari daftarkan sekolah baru Anda! Pastikan data yang dimasukkan valid ya. 🏫",
        "NPSN wajib diisi dengan benar agar bisa divalidasi oleh sistem.",
        "Setelah mendaftar, Anda akan otomatis mendapatkan akun untuk Operator Sekolah."
      ];
    } 
    // ==========================================
    // 🗂️ ROLE: TATA USAHA (TU)
    // ==========================================
    // 0. Dashboard Utama Tata Usaha
    else if (pathname === "/tatausaha") {
      return [
        "Selamat datang di pusat kendali Tata Usaha! Di sini Anda bisa memantau ringkasan data sekolah kita. 📊",
        "Kartu di bagian atas menampilkan jumlah Total Guru, Murid, dan Rombel secara real-time.",
        "Anda juga bisa melihat rasio perbandingan gender siswa dan tenaga pengajar melalui grafik statistik di bawah."
      ];
    }
    // 1. Identitas Sekolah
    else if (pathname.includes("/tatausaha/profil-sekolah")) {
      return [
        "Di sini Anda bisa mengatur profil utama dan logo sekolah kita. 🏫",
        "Pastikan data seperti NPSN dan Alamat sudah sesuai dengan data Dapodik ya!",
        "Perubahan nama sekolah di sini akan langsung tampil di seluruh dashboard pengguna."
      ];
    }
    // 2. Data Guru
    else if (pathname.includes("/tatausaha/dataguru")) {
      return [
        "Menu Data Guru digunakan untuk menambah, mengedit, atau menonaktifkan data pendidik. 👨‍🏫",
        "Jangan lupa untuk menginput NIP dengan benar jika guru tersebut adalah PNS.",
        "Guru yang baru ditambahkan di sini bisa dikaitkan dengan mata pelajaran yang dia ampu."
      ];
    }
    // 3. Data Murid
    else if (pathname.includes("/tatausaha/datamurid")) {
      return [
        "Pastikan Nomor Induk Siswa Nasional (NISN) diketik dengan benar sebagai identitas utama murid. 🎓",
        "Anda bisa menggunakan fitur pencarian untuk mencari nama murid dengan cepat.",
        "Jika ada data siswa yang salah input, Anda dapat mengeditnya disini!"
      ];
    }
    // 4. Data Kelas / Rombel
    else if (pathname.includes("/tatausaha/kelas")) {
      return [
        "Sebelum menyusun jadwal, pastikan semua wadah kelas (Rombel) sudah dibuat di sini! 🚪",
        "Gunakan format penamaan kelas yang konsisten, misalnya 'X.1' atau 'XII IPA 2'.",
        "Nantinya, wali kelas akan di-assign ke rombel-rombel yang Anda buat di halaman ini."
      ];
    }
    // 5. Data Mapel
    else if (pathname.includes("/tatausaha/mapel")) {
      return [
        "Input semua daftar Mata Pelajaran sesuai dengan kurikulum sekolah saat ini. 📚",
        "Data mapel ini sangat penting karena akan digunakan guru saat menginput nilai raport.",
        "Satu mata pelajaran bisa diajarkan oleh beberapa guru yang berbeda."
      ];
    }
    // 6. Daftar Hadir Guru
    else if (pathname.includes("/tatausaha/presensi-guru")) {
      return [
        "Di sini Anda bisa memantau dan merekap absensi para guru setiap harinya. 📋",
        "Jika ada guru yang berhalangan hadir (Sakit/Izin), segera update statusnya di halaman ini.",
        "Data ini akan otomatis terekap di dashboard Wakil Kurikulum lho!"
      ];
    }
    // 7. Jadwal Pelajaran
    else if (pathname.includes("/tatausaha/jadwal-pelajaran")) {
      return [
        "Hati-hati saat menyusun jadwal! Pastikan tidak ada guru yang bentrok mengajar di dua kelas pada jam yang sama. ⏰",
        "Pilih kelasnya dulu, pilih mapelnya, baru tentukan guru pengampunya.",
        "Jadwal yang Anda buat di sini akan langsung bisa dilihat oleh guru di akun mereka masing-masing."
      ];
    }
    // 8. Data Prestasi
    else if (pathname.includes("/tatausaha/prestasi")) {
      return [
        "Catat semua prestasi dan kejuaraan gemilang siswa di sini! 🏆",
        "Data prestasi sangat berguna untuk portofolio sekolah dan keperluan akreditasi.",
        "Jangan lupa sertakan tingkat kejuaraannya (Lokal, Nasional, atau Internasional)."
      ];
    }
    // 9. Data Alumni
    else if (pathname.includes("/tatausaha/alumni")) {
      return [
        "Data siswa yang sudah lulus dipindahkan dan dikelola di halaman ini. 🎓",
        "Tetap catat data alumni agar silaturahmi dan penelusuran lulusan sekolah tetap terjaga dengan baik."
      ];
    } 
    
    // ==========================================
    // ⚙️ ROLE: OPERATOR
    // ==========================================
    // 0. Dashboard Utama Operator
    else if (pathname === "/operator") {
      return [
        "Selamat datang di Dashboard Operator! Di sini Anda memegang kendali utama atas akses sistem SIMS. 🛡️",
        "Perhatikan indikator 'Perlu Tindakan' atau 'Tugas Tertunda'. Jika ada guru yang belum punya akun, segera buatkan ya!",
        "Gunakan menu cepat di bawah untuk langsung mengelola Manajemen Akun atau Data Wali Kelas."
      ];
    }
    // 1. Data User
    else if (pathname.includes("/operator/datauser")) {
      return [
        "Di menu ini, Anda mengelola hak akses login untuk Guru, Tata Usaha, dan Pimpinan Sekolah. 🔑",
        "Segera proses aktivasi akun untuk guru-guru yang datanya sudah masuk ke database namun belum memiliki akses login.",
        "Jika ada pengguna yang lupa password, Anda bisa mereset dan mengaturnya di sini."
      ];
    }
    // 2. Data Wali Kelas
    else if (pathname.includes("/operator/datawalikelas")) {
      return [
        "Waktunya menugaskan nahkoda kelas! Pasangkan akun guru yang aktif dengan kelas yang tersedia di sistem. 🧑‍🏫",
        "Guru yang ditugaskan di sini akan otomatis mendapatkan hak akses tambahan sebagai Wali Kelas di dashboard mereka.",
        "Pastikan jumlah penugasan wali kelas sinkron dengan jumlah total rombel yang ada."
      ];
    } // ==========================================
    // 👩‍🏫 ROLE: GURU & WALI KELAS
    // ==========================================
    
    // 0. Dashboard Utama Guru
    else if (pathname === "/guru") {
      return [
        "Selamat datang, Bapak/Ibu Guru! Di sini Anda bisa memantau ringkasan aktivitas akademik hari ini. 📊",
        "Cek kartu ringkasan di atas untuk melihat total nilai yang sudah diinput, jumlah siswa kelas, hingga kasus kedisiplinan.",
        "Gunakan menu di sebelah kiri untuk mulai mengelola nilai atau mengurus administrasi kelas Anda."
      ];
    }
    // 1. Input Nilai
    else if (pathname.includes("/guru/inputnilai")) {
      return [
        "Saatnya mengisi nilai siswa! Pilih mata pelajaran dan kelas yang Anda ampu terlebih dahulu. ✍️",
        "Pastikan nilai yang diinput sudah benar dan sesuai dengan rubrik penilaian ya!",
        "Jangan lupa klik tombol simpan jika semua nilai sudah terisi penuh."
      ];
    }
    // 2. Riwayat Nilai
    else if (pathname.includes("/guru/riwayat-nilai")) {
      return [
        "Ingin mengecek nilai yang sudah pernah dimasukkan? Di sini tempatnya! 📝",
        "Anda bisa menelusuri riwayat penilaian sebelumnya sebagai bahan evaluasi belajar siswa."
      ];
    }
    
    // --- KHUSUS MENU WALI KELAS ---
    
    // 3. Data Murid Kelas
    else if (pathname.includes("/guru/datamurid")) {
      return [
        "Sebagai Wali Kelas, Bapak/Ibu bisa melihat detail biodata seluruh anak didik di kelas ini. 🧑‍🎓",
        "Kenali siswa-siswi Anda lebih dekat untuk membantu mengembangkan potensi mereka maksimal.",
        "Gunakan kolom pencarian jika butuh mencari data siswa tertentu dengan cepat."
      ];
    }
    // 4. Riwayat Perwalian
    else if (pathname.includes("/guru/riwayat")) {
      return [
        "Halaman ini menyimpan jejak rekam sejarah kelas-kelas yang pernah Bapak/Ibu bina sebelumnya. 🕰️",
        "Data ini berguna sebagai arsip dan portofolio perjalanan karir Bapak/Ibu di sekolah ini."
      ];
    }
    // 5. Daftar Kehadiran
    else if (pathname.includes("/guru/kehadiran")) {
      return [
        "Mari pantau presensi kelas Anda di sini. Cek siapa saja yang Alpa, Izin, atau Sakit hari ini. 📋",
        "Kehadiran yang rajin adalah salah satu kunci kesuksesan belajar siswa lho!",
        "Segera tindak lanjuti jika ada siswa yang memiliki rekam jejak Alpa beruntun."
      ];
    }
    // 6. Catatan Kedisiplinan
    else if (pathname.includes("/guru/kedisiplinan")) {
      return [
        "Ada siswa yang melanggar tata tertib? Catat semuanya di sini! ⚖️",
        "Catatan ini sangat penting untuk bahan evaluasi, pembinaan, dan penulisan catatan di buku raport nanti.",
        "Mari bimbing siswa yang bermasalah agar menjadi lebih baik ke depannya."
      ];
    } // ==========================================
    // 👔 ROLE: KEPALA SEKOLAH
    // ==========================================
    
    // 0. Dashboard Utama Kepala Sekolah
    else if (pathname === "/kepalasekolah") {
      return [
        "Selamat datang, Bapak/Ibu Kepala Sekolah! Ini adalah panel Executive Information System (EIS) Anda. 📊",
        "Di sini Anda bisa memantau ringkasan kondisi sekolah secara menyeluruh, mulai dari Total Siswa, Guru, hingga Rata-rata Kehadiran.",
        "Gunakan data statistik di bawah ini sebagai acuan strategis dalam pengambilan keputusan dan evaluasi kinerja sekolah."
      ];
    }
    // 1. Data Guru
    else if (pathname.includes("/kepalasekolah/dataguru")) {
      return [
        "Halaman ini menampilkan seluruh data tenaga pendidik yang aktif di sekolah kita. 👨‍🏫",
        "Bapak/Ibu dapat memantau profil guru, status kepegawaian, serta penugasan masing-masing staf dari menu ini.",
        "Anda dapat melakukan ekspor data jika membutuhkan rekap pegawai dalam format Excel."
      ];
    }
    // 2. Data Murid
    else if (pathname.includes("/kepalasekolah/datamurid")) {
      return [
        "Pantau keseluruhan data peserta didik dari semua rombongan belajar di sini. 🎓",
        "Anda dapat melihat persebaran jumlah siswa dan detail profil masing-masing anak didik secara real-time.",
        "Menu ini dirancang khusus untuk kemudahan pemantauan pimpinan sekolah tanpa risiko mengubah data."
      ];
    }
    // 3. Catatan Kedisiplinan
    else if (pathname.includes("/kepalasekolah/kedisiplinan")) {
      return [
        "Di sini Bapak/Ibu dapat meninjau rekam jejak kedisiplinan siswa yang dilaporkan oleh guru maupun wali kelas. ⚖️",
        "Pantau grafik tren pelanggaran untuk menentukan langkah pembinaan karakter yang tepat.",
        "Evaluasi catatan ini secara berkala untuk menciptakan lingkungan sekolah yang lebih tertib dan aman."
      ];
    }
    // 4. Rekap Nilai Murid
    else if (pathname.includes("/kepalasekolah/rekap-nilai")) {
      return [
        "Halaman ini menyajikan rekapitulasi nilai akademik siswa dari seluruh mata pelajaran. 📈",
        "Bapak/Ibu dapat memonitor persentase ketuntasan KKM dan tren akademik setiap kelas dengan mudah.",
        "Silakan unduh rekap nilai ini sebagai bahan tinjauan saat rapat dewan guru di akhir semester."
      ];
    }
    // 5. Jadwal Pelajaran (Monitoring)
    else if (pathname.includes("/kepalasekolah/monitoring-jadwal")) {
      return [
        "Mari pantau alokasi jam mengajar guru dan jadwal pelajaran di setiap kelas. ⏰",
        "Pastikan proses Kegiatan Belajar Mengajar (KBM) terdistribusi merata dan berjalan sesuai struktur kurikulum.",
        "Anda bisa memonitor ketersediaan guru di jam tertentu secara langsung melalui tabel jadwal ini."
      ];
    }
    // 6. Kehadiran
    else if (pathname.includes("/kepalasekolah/kehadiran")) {
      return [
        "Pantau tingkat persentase kehadiran siswa dan kedisiplinan tenaga pendidik setiap harinya di halaman ini. 📋",
        "Tingkat kehadiran yang konsisten adalah fondasi utama dari budaya mutu sekolah kita.",
        "Cek tren kehadiran bulanan untuk mengidentifikasi apakah ada penurunan yang memerlukan intervensi segera."
      ];
    }
    // 7. Prestasi
    else if (pathname.includes("/kepalasekolah/prestasi")) {
      return [
        "Halaman kebanggaan sekolah! Ini adalah etalase seluruh pencapaian dan prestasi gemilang anak didik kita. 🏆",
        "Bapak/Ibu dapat memantau perolehan piala dan penghargaan baik di tingkat lokal, nasional, maupun internasional.",
        "Dokumentasi prestasi ini sangat berharga untuk mendukung proses akreditasi dan meningkatkan citra positif sekolah."
      ];
    }
    // 8. Alumni
    else if (pathname.includes("/kepalasekolah/alumni")) {
      return [
        "Ini adalah direktori lulusan sekolah kita dari tahun ke tahun. 🎓",
        "Penelusuran tamatan (Tracer Study) sangat esensial untuk mengukur keberhasilan pendidikan di sekolah ini.",
        "Pantau persentase alumni yang melanjutkan studi atau terserap ke dunia kerja sebagai bahan evaluasi kurikulum mendatang."
      ];
    }

    // --- 💡 KHUSUS MENU GURU (JIKA KEPSEK MENGAJAR) ---
    
    // 9. Input Nilai
    else if (pathname.includes("/kepalasekolah/inputnilai")) {
      return [
        "Selamat bertugas sebagai pendidik hari ini, Bapak/Ibu! Silakan masukkan nilai evaluasi siswa untuk mata pelajaran Anda. ✍️",
        "Meski menjabat sebagai pimpinan, dedikasi Anda di dalam kelas tetap menjadi inspirasi bagi siswa dan rekan guru.",
        "Pastikan seluruh nilai sudah diverifikasi sesuai rubrik sebelum disimpan ke dalam sistem."
      ];
    }
    // 10. Riwayat Nilai
    else if (pathname.includes("/kepalasekolah/riwayat-nilai")) {
      return [
        "Di sini Bapak/Ibu dapat meninjau kembali arsip nilai-nilai yang telah Anda berikan di semester sebelumnya. 📝",
        "Riwayat ini berguna sebagai dokumentasi pribadi dari pelaksanaan tugas mengajar Anda."
      ];
    } // ==========================================
    // 🛡️ ROLE: WAKIL KESISWAAN & BK
    // ==========================================
    
    // 0. Dashboard Utama Wakil Kesiswaan
    else if (pathname === "/wakilkesiswaan") {
      return [
        "Selamat datang di pusat kendali Kesiswaan dan Bimbingan Konseling! 🛡️",
        "Harap perhatikan panel 'Perhatian Sistem' di atas. Segera tindak lanjuti jika ada siswa dengan persentase absensi di bawah batas aman.",
        "Pantau terus metrik pelanggaran dan kehadiran siswa hari ini untuk memastikan lingkungan sekolah tetap tertib."
      ];
    }
    // 1. Data Guru
    else if (pathname.includes("/wakilkesiswaan/dataguru")) {
      return [
        "Menu ini membantu Bapak/Ibu berkoordinasi dengan rekan sejawat, khususnya Wali Kelas dan Guru BK lainnya. 🤝",
        "Sinergi yang baik antar pendidik adalah kunci utama dalam membina karakter dan kedisiplinan anak didik kita."
      ];
    }
    // 2. Data Murid
    else if (pathname.includes("/wakilkesiswaan/datamurid")) {
      return [
        "Di sini Bapak/Ibu bisa memantau dan mencari profil lengkap seluruh peserta didik. 🧑‍🎓",
        "Kenali latar belakang siswa lebih dalam untuk menentukan pendekatan bimbingan dan konseling yang paling tepat."
      ];
    }
    // 3. Catatan Kedisiplinan
    else if (pathname.includes("/wakilkesiswaan/kedisiplinan")) {
      return [
        "Fokus utama kita: Membina, bukan sekadar menghukum. Pantau dan catat setiap kasus pelanggaran tata tertib di sini. ⚖️",
        "Data ini terintegrasi dengan laporan Tim Tatib dan Guru Piket agar penanganan siswa bermasalah lebih terukur.",
        "Mari arahkan siswa yang melanggar agar bisa memperbaiki sikapnya menjadi lebih positif!"
      ];
    }
    // 4. Kehadiran
    else if (pathname.includes("/wakilkesiswaan/kehadiran")) {
      return [
        "Pantau ketat tren kehadiran siswa di sini. Ingat, target sekolah kita adalah absensi siswa selalu di atas 95%! 📈",
        "Segera koordinasikan dengan Wali Kelas jika menemukan siswa yang memiliki pola ketidakhadiran (Alpa) yang mencurigakan."
      ];
    }
    // 5. Prestasi
    else if (pathname.includes("/wakilkesiswaan/prestasi")) {
      return [
        "Mari rayakan potensi anak didik kita! Rekap semua piagam, medali, dan prestasi ekstrakurikuler di sini. 🏆",
        "Pencatatan prestasi yang rapi dan detail akan sangat membantu siswa saat mendaftar beasiswa atau jalur undangan Perguruan Tinggi."
      ];
    }
    // 6. Alumni
    else if (pathname.includes("/wakilkesiswaan/alumni")) {
      return [
        "Kelola data Tracer Study dan sebaran lulusan sekolah kita di menu ini. 🎓",
        "Jejaring alumni yang solid bisa menjadi inspirasi berharga dan membuka peluang bagi adik-adik kelas mereka."
      ];
    }

    // --- 💡 SUB MENU GURU (JIKA WAKET MENGAJAR) ---
    
    // 7. Input Nilai
    else if (pathname.includes("/wakilkesiswaan/inputnilai")) {
      return [
        "Waktunya beralih peran sejenak menjadi pengajar! Silakan input nilai evaluasi untuk mata pelajaran yang Bapak/Ibu ampu. ✍️",
        "Pastikan semua nilai diinput dengan teliti dan objektif sebelum menyimpannya ke dalam sistem."
      ];
    }
    // 8. Riwayat Nilai
    else if (pathname.includes("/wakilkesiswaan/riwayat-nilai")) {
      return [
        "Perlu mengecek kembali nilai yang sudah pernah dimasukkan? Silakan telusuri arsip riwayat penilaian Bapak/Ibu di sini. 📝"
      ];
    } // ==========================================
    // 📚 ROLE: WAKIL KURIKULUM
    // ==========================================
    
    // 0. Dashboard Utama Wakil Kurikulum
    else if (pathname === "/wakilkurikulum") {
      return [
        "Selamat datang di pusat kendali akademik sekolah! 📚",
        "Melalui dashboard ini, Bapak/Ibu dapat memantau secara langsung Rata-rata Nilai Rombel dan daftar siswa di Ranking Paralel Teratas.",
        "Pantau terus metrik Ketuntasan KKM untuk memastikan kualitas dan target pembelajaran kita tercapai dengan maksimal."
      ];
    }
    // 1. Data Guru
    else if (pathname.includes("/wakilkurikulum/dataguru")) {
      return [
        "Halaman ini memuat profil lengkap tenaga pendidik kita. 👨‍🏫",
        "Pastikan kualifikasi keilmuan setiap guru sudah sesuai dengan mata pelajaran yang mereka ampu.",
        "Data ini sangat krusial untuk keperluan akreditasi dan pemetaan beban kerja mengajar."
      ];
    }
    // 2. Data Murid
    else if (pathname.includes("/wakilkurikulum/datamurid")) {
      return [
        "Tinjau sebaran data peserta didik dari seluruh rombongan belajar di sini. 🎓",
        "Kepadatan jumlah siswa di tiap kelas akan mempengaruhi efektivitas Kegiatan Belajar Mengajar (KBM).",
        "Gunakan data ini untuk merencanakan peminatan atau penjurusan siswa di semester mendatang."
      ];
    }
    // 3. Rekap Nilai Murid
    else if (pathname.includes("/wakilkurikulum/rekap-nilai")) {
      return [
        "Pusat evaluasi akademik! Di sini Bapak/Ibu bisa meninjau hasil evaluasi belajar dari seluruh kelas. 📈",
        "Identifikasi mata pelajaran mana yang nilai rata-ratanya masih di bawah standar mutu sekolah.",
        "Rekap ini bisa diekspor dan dijadikan bahan diskusi utama saat Rapat Pleno Kenaikan Kelas."
      ];
    }
    // 4. Jadwal Pelajaran (Monitoring)
    else if (pathname.includes("/wakilkurikulum/monitoring-jadwal")) {
      return [
        "Pantau distribusi jam mengajar dan pastikan tidak ada jadwal KBM yang tumpang tindih. ⏰",
        "Keseimbangan beban kerja antar guru sangat penting untuk menjaga kualitas pengajaran di kelas.",
        "Bapak/Ibu juga bisa mengecek ketersediaan jam kosong guru jika ada keperluan rapat mendadak."
      ];
    }
    // 5. Kehadiran
    else if (pathname.includes("/wakilkurikulum/kehadiran")) {
      return [
        "Tingkat kehadiran sangat berkorelasi dengan pemahaman akademik siswa. Pantau rekap presensinya di sini. 📋",
        "Bapak/Ibu juga dapat memonitor kedisiplinan guru dalam mengisi jam pelajaran sesuai jadwal yang ditetapkan."
      ];
    }

    // --- 💡 KHUSUS MENU GURU (JIKA WAKAKUR MENGAJAR) ---
    
    // 6. Input Nilai
    else if (pathname.includes("/wakilkurikulum/inputnilai")) {
      return [
        "Saatnya beralih tugas menjadi pengajar! Silakan masukkan nilai evaluasi harian atau ujian siswa Bapak/Ibu. ✍️",
        "Sebagai Wakil Kurikulum, kedisiplinan Bapak/Ibu dalam menginput nilai tepat waktu akan menjadi teladan bagi guru lainnya."
      ];
    }
    // 7. Riwayat Nilai
    else if (pathname.includes("/wakilkurikulum/riwayat-nilai")) {
      return [
        "Di sini Bapak/Ibu bisa melihat kembali arsip nilai yang telah dimasukkan ke sistem sebelumnya. 📝",
        "Lakukan pengecekan ulang jika ada siswa yang mengajukan perbaikan atau remedial."
      ];
    }
    else {
      return [
        "Halo, semangat bertugas hari ini ya! 🌟",
        "Jika butuh bantuan, Anda selalu bisa mengecek panduan sistem.",
        "Semua data yang Anda masukkan otomatis tersimpan dengan aman."
      ];
    }
  };

  const autoMessages = getMessagesForPage();

  useEffect(() => {
    setMsgIndex(0);
    setIsOpen(false); 
    setIsMinimized(false); 
  }, [pathname]);

  const handleNext = () => {
    if (msgIndex < autoMessages.length - 1) {
      setMsgIndex(msgIndex + 1);
    } else {
      setMsgIndex(0); 
    }
  };

  return (
    <>
      {isMinimized ? (
        // ==========================================
        // ❌ TAMPILAN SAAT DI-MINIMIZE (TOMBOL PLUS)
        // ==========================================
        <button 
          onClick={() => setIsMinimized(false)} 
          className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-12 h-12 bg-emerald-200 border-4 border-slate-900 rounded-full shadow-[4px_4px_0px_rgba(15,23,42,1)] hover:scale-110 transition-transform"
          title="Tampilkan Asisten"
        >
          <span className="text-3xl font-black text-slate-900 pb-1">+</span>
        </button>
      ) : (
        // ==========================================
        // ✅ TAMPILAN NORMAL (CHIBI BESAR & CHAT)
        // ==========================================
        <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50 flex flex-col md:flex-row items-end gap-2 md:gap-3">
          
          {/* 💬 BALON DIALOG GAYA KOMIK */}
          {isOpen && (
            <div className="relative animate-in slide-in-from-bottom-5 fade-in duration-300 origin-bottom-right mb-2 md:mb-6 z-10">
              
              <div className="w-[calc(100vw-2.5rem)] sm:w-80 md:w-72 bg-white border-4 border-slate-900 rounded-3xl p-4 md:p-5 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] md:shadow-[8px_8px_0px_0px_rgba(15,23,42,1)]">
                
                <button 
                  onClick={() => setIsOpen(false)}
                  className="absolute top-3 right-3 p-1 bg-rose-400 hover:bg-rose-500 border-2 border-slate-900 rounded-full shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] transition-transform hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(15,23,42,1)]"
                >
                  <X size={16} className="text-slate-900" strokeWidth={4} />
                </button>

                <p className="text-sm font-bold text-slate-800 leading-relaxed mt-3 mb-5 pr-4 min-h-[60px]">
                  {autoMessages[msgIndex]}
                </p>

                <div className="flex justify-between items-center border-t-2 border-dashed border-slate-300 pt-3">
                  <span className="text-[11px] font-black text-slate-400 tracking-widest">
                    TIPS {msgIndex + 1}/{autoMessages.length}
                  </span>
                  
                  <button 
                    onClick={handleNext}
                    className="flex items-center gap-1 px-3 py-1.5 bg-amber-300 hover:bg-amber-400 border-2 border-slate-900 rounded-xl text-xs font-black shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(15,23,42,1)] transition-all text-slate-900"
                  >
                    Lanjut <ChevronRight size={16} strokeWidth={3} />
                  </button>
                </div>

              </div>
              
              {/* Ekor Balon Dialog */}
              <div className="absolute -bottom-3 right-8 md:right-10 w-6 h-6 bg-white border-b-4 border-r-4 border-slate-900 transform rotate-45"></div>
            </div>
          )}

          {/* 👩‍🏫 KARAKTER CHIBI GURU */}
          <div className="relative">
            {/* 💡 Tombol Minimize (X/Minus) yang sekarang ditaruh DI BAWAH lampu */}
            <button 
              onClick={() => setIsMinimized(true)}
              className="absolute top-10 right-2 md:top-16 md:right-7 z-30 w-6 h-6 flex items-center justify-center bg-slate-200 border-2 border-slate-900 rounded-full text-slate-900 font-black hover:bg-rose-400 hover:text-white transition-colors cursor-pointer shadow-[2px_2px_0px_rgba(15,23,42,1)]"
              title="Sembunyikan Asisten"
            >
              -
            </button>

            <button 
              onClick={() => {
                setIsOpen(!isOpen);
                if (!isOpen) setMsgIndex(0); 
              }}
              className="relative flex items-center justify-center w-32 h-32 md:w-48 md:h-48 hover:scale-110 transition-transform duration-300 overflow-visible animate-[bounce_3s_infinite] z-20"
            >
              <img 
                src="/chibi-guru.png" 
                alt="Asisten Guru" 
                className="w-full h-full object-contain drop-shadow-[4px_4px_0px_rgba(15,23,42,1)]"
              />
              
              {/* 💡 Notifikasi Lampu Kuning */}
              {!isOpen && (
                <span className="absolute top-2 right-2 md:top-7 md:right-7 flex items-center justify-center h-7 w-7 md:h-8 md:w-8">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                  <span className="relative flex items-center justify-center rounded-full h-full w-full bg-yellow-300 border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
                    <Lightbulb className="w-3.5 h-3.5 md:w-4 md:h-4 text-slate-900" strokeWidth={3} />
                  </span>
                </span>
              )}
            </button>
          </div>

        </div>
      )}
    </>
  );
}