# Ta'awun Maqom Kuttab Al Fatih Lampung

Situs **open-source** untuk pendaftaran Maqom dan pembayaran Ta'awun Kuttab Al Fatih Lampung. Dibangun dengan Next.js, Supabase, dan Vercel.

- **Live:** https://maqom2026.vercel.app
- **Source:** https://github.com/benbask/taawun-maqom-kuttab-al-fatih
- **Dikelola oleh:** Beny Abu Ibrahim

## Ringkasan

Masyarakat mendaftar memakai nomor WhatsApp + **Kode Keamanan**, memilih peran, memilih kelas/anak, membayar lewat QRIS dinamis, lalu mengupload bukti transfer. Admin memverifikasi pembayaran, dan rekap publik menampilkan perolehan per kelas dengan identitas tersamarkan.

## Fitur utama

### Pendaftaran & akun

- Login **nomor WhatsApp + Kode Keamanan** (tidak case-sensitive). Nomor `08xx`, `8xx`, atau `62xx` otomatis disesuaikan.
- Nomor WhatsApp istri/istri yang tertaut juga bisa dipakai untuk masuk ke akun ayah.
- Tiga peran: **OTS Aktif**, **OTS Alumni**, dan **Pihak Umum**. Yang mendaftar Maqom adalah **ayah**; nama anak dipakai untuk rekap per kelas.
- OTS Aktif mencari nama santri dari direktori (cukup 1 huruf), lalu saudara kandung terdeteksi otomatis. Ta'awun dialokasikan ke **kelas anak bungsu**; kelas kakak tetap ikut terhitung sebagai kontribusi **nominal 0** pada rekap.
- OTS Alumni memilih tahun angkatan dan apakah ikut Maqom atau hanya ber-Ta'awun.
- User lama langsung diarahkan ke dashboard `/akun`; data santri dan invoice lama otomatis muncul kembali. Duplikat dicegah berdasarkan NIS + nama/kelas.

### Pembayaran

- **QRIS dinamis** dibuat dari QRIS statis milik admin: tag `01` diubah ke `12`, tag `54` ditambahkan, **tanpa tag 62**, CRC dihitung ulang.
- Kode unik audit 3 digit berpola `9, 19, 29, … 999`, melewati kode yang sudah terpakai.
- Halaman invoice menampilkan QRIS, hitung mundur, tombol unduh QR, dan tombol upload bukti.
- Bukti transfer **JPG/PNG/WEBP/PDF maksimal 5 MB**; gambar dikompres di browser agar tetap lolos batas body request serverless.
- Notifikasi mengambang **“Belum dibayar”** muncul di seluruh halaman publik sampai bukti diunggah.

### Halaman publik

- Beranda dengan konten yang bisa diubah admin, total terkumpul, target, progress bar, rekap per kelas, dan **10 kontributor teratas** dengan nama disamarkan.
- Tombol **Bagikan ke WhatsApp** memakai kartu meta otomatis (`/api/share-card`) berisi nominal tercapai, persentase, dan tombol “Tambah Ta'awun”.
- Halaman `/verifikasi` menggabungkan rekap dan rincian per kelas: nama disamarkan menjadi inisial, WhatsApp hanya 4 digit terakhir, status per baris, legenda status, dan tampilan kartu di layar kecil.
- Rekap menghitung semua anak pada keluarga kontributor, sehingga jumlah anak tidak selalu sama dengan jumlah keluarga.

### Panel admin

- Login username/password (bcrypt + JWT cookie), penyiapan akun pertama, dan ganti password.
- Kelola konten beranda, termasuk **upload gambar** untuk logo, hero, dan gambar pratinjau WhatsApp ke bucket publik.
- Verifikasi invoice: lihat/upload bukti, ubah status ke mana saja, jalankan **Cek OCR** per invoice atau **Cek antrean OCR** untuk memproses bukti lama (sekali per bukti), serta kirim pengingat WA.
- Akun admin bertingkat: empat slot tetap (Super Admin, Code Harnes Admin, Bendahara 1, Bendahara 2) plus satu akun asisten untuk uji; tiap slot bisa diaktifkan/dinonaktifkan dan diatur cakupan menunya di **Akun Admin**. Perubahan hak berlaku setelah admin masuk ulang.
- Profil OTS dengan nomor WhatsApp berformat `+62` yang bisa diklik.
- Kelola kelas, field formulir, QRIS statis, kode unik, template pesan, webhook Google Sheets, dan daftar hadir.
- Ekspor XLSX/CSV/Sheets, audit log, dan panel status koneksi WhatsApp.

### WhatsApp worker

- Worker Baileys berjalan di laptop/VM (Windows Scheduled Task `Taawun WA Worker`), bukan di Vercel.
- Alur pendaftaran publik memakai Kode Keamanan; antrean OTP/worker tetap tersedia untuk kebutuhan internal dan pengikatan akun Google.
- Jika sesi WhatsApp logout, pindai ulang QR di `/admin/whatsapp`.
- Tombol pengingat di halaman verifikasi memakai tautan `wa.me`, jadi tetap bekerja walau worker sedang mati.

### Mode demo

- Aktif otomatis bila Supabase belum dikonfigurasi, atau dengan `DEMO_MODE=true`. Data disimpan di `.data/demo.json`.
- Admin demo: `admin` / `Taawun123!`. User demo: `08888` / `8888` (tanpa rate limit).
- Data demo diberi badge **DEMO** dan tidak masuk statistik publik; hapus lewat menu **Hapus data demo**.

## Struktur

```
src/app/(public)/       Beranda, verifikasi/rekap, daftar, tambah, invoice, akun, masuk
src/app/admin/          Login, setup, panel admin terlindungi
src/app/api/            Route handlers (auth, register, invoice, admin, upload, share-card, export)
src/components/         Komponen publik, admin, dan situs
src/lib/                QRIS, kode unik, sesi, format, store, export, Sheets
src/lib/demo/           Store JSON lokal untuk mode demo
src/lib/supabase/       Store Supabase (Postgres + Storage)
supabase/migrations/    Skema 0001–0007, RLS, RPC create_invoice, bucket publik
supabase/apps-script.gs Webhook Google Sheets
worker/                 Service WhatsApp berbasis Baileys
docs/                   Panduan deploy dan login Google
```

> Data master santri (`student_directory`, 184 baris) di-seed terpisah dari repo dan bukan bagian dari source code publik.

## Jalankan lokal

```bash
npm install
cp .env.example .env.local
npm run dev
```

Buka `http://localhost:3000`. Mode demo aktif jika env Supabase kosong.

Perintah lain:

```bash
npm test        # unit test QRIS & kode unik
npm run lint
npm run build
```

## Deploy ringkas

1. Buat project Supabase dan jalankan **semua** migrasi di `supabase/migrations/` (`supabase db push --remote`).
2. Pastikan bucket Storage `proofs` (private) dan `public-assets` (public) tersedia; keduanya dibuat oleh migrasi.
3. Isi environment di Vercel sesuai `.env.example`, terutama `SESSION_SECRET`, `OTP_ENCRYPTION_KEY`, `UPLOAD_MAX_BYTES=5242880`, dan `NEXT_PUBLIC_APP_URL`.
4. Seed tabel `student_directory` dari CSV master santri.
5. Deploy ke Vercel; cabang `main` adalah sumber deploy produksi.
6. Di panel admin: buat akun, isi konten beranda, kelas, QRIS statis, nomor WhatsApp, dan gambar pratinjau jika diinginkan.
7. Jalankan `worker/` di laptop/VM dengan kunci Supabase dan `OTP_ENCRYPTION_KEY` yang sama persis, lalu pindai QR di `/admin/whatsapp`.

Panduan lebih lengkap: [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) dan [`docs/GOOGLE_LOGIN.md`](docs/GOOGLE_LOGIN.md).

## Lisensi

MIT — silakan dipakai, dimodifikasi, dan dikembangkan kembali. Kredit tetap diberikan kepada **Beny Abu Ibrahim**.
