# Ta'awun Maqom Kuttab Al Fatih Lampung

Situs pendaftaran dan pembayaran Ta'awun untuk Maqom Kuttab Al Fatih Lampung. Gratis, open-source, dan dapat di-deploy dengan biaya rendah (Vercel + Supabase + Oracle Cloud Always Free).

**Dibuat oleh: Beny Abu Ibrahim**

## Fitur

### Publik
- Beranda dengan informasi Ta'awun yang bisa diubah admin, total terkumpul, target, rekap per kelas, dan kredit.
- Halaman **Verifikasi** per kelas: nama disamarkan menjadi inisial, WhatsApp hanya 4 digit terakhir, waktu unggah bukti, dan nominal. Hanya invoice terverifikasi yang tampil.
- Pendaftaran santri dengan OTP WhatsApp: nomor → kode 4 digit → data wali → data anak dinamis (nama, kelas, nominal) → QRIS dinamis → unggah bukti transfer.
- Tambah Ta'awun untuk santri, kelas, atau Umum dengan alur OTP dan QRIS yang sama.
- Halaman invoice dengan QRIS dinamis, hitung mundur, salin nominal, unggah bukti (JPG/PNG/WEBP/PDF, maksimal 3 MB), dan pengecekan status otomatis.
- Akun pengguna dengan riwayat invoice dan status pembayaran.
- Login dengan Google (opsional): pengguna baru mengikat akun Google lewat OTP WhatsApp sekali, login berikutnya langsung masuk. Tombol otomatis tersembunyi jika client ID belum diisi.

### Admin
- Login username/password (bcrypt + JWT cookie), penyiapan akun pertama sekali jalan, ganti password.
- Kelola konten beranda, kelas, field formulir dinamis, QRIS statis, kode unik, template OTP, dan webhook Google Sheets.
- Verifikasi / tolak / batalkan invoice dengan alasan penolakan.
- Pantau koneksi worker WhatsApp, QR login, antrean OTP, serta tombol kirim manual via `wa.me`.
- Ekspor XLSX (2 sheet), CSV, dan Google Sheets. Audit log seluruh aktivitas.

### Pembayaran
- QRIS statis dari admin diubah menjadi **QRIS dinamis** dengan nominal `Ta'awun + kode unik 3 digit`.
- Kode unik mengikuti pola `9, 19, 29, ... 999`, melewati kode yang sudah dipakai, dan otomatis memakai sisa kode 3 digit bila perlu.
- Statistik memakai nominal pokok; kode unik dicatat terpisah untuk pencocokan di sisi merchant.

## Struktur

```
src/app/(public)/     Halaman publik (beranda, verifikasi, daftar, tambah, invoice, akun, masuk)
src/app/admin/        Panel admin (login, setup, dan halaman terlindungi)
src/app/api/          Route handlers (OTP, register, addition, invoice, admin, export)
src/lib/              Logika inti: QRIS, kode unik, sesi, OTP, store, export, Sheets
src/lib/demo/         Store JSON lokal untuk mode demo
src/lib/supabase/     Store Supabase (Postgres + Storage)
supabase/migrations/  Skema DB, RLS, RPC create_invoice, seed awal
supabase/apps-script.gs  Webhook Google Sheets
worker/               Service WhatsApp OTP berbasis Baileys (Docker)
docs/DEPLOYMENT.md    Panduan deploy lengkap
```

## Jalankan lokal (mode demo)

Mode demo aktif otomatis jika env Supabase tidak diisi. Data disimpan di `.data/demo.json`.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Buka `http://localhost:3000`. Admin demo: `admin` / `Taawun123!`. Kode OTP demo ditampilkan langsung di halaman dan toast.

Perintah lain:

```bash
npm test        # unit test QRIS & kode unik
npm run lint
npm run build
```

## Deploy ringkas

1. Buat project Supabase, jalankan `supabase/migrations/0001_init.sql` di SQL Editor.
2. Buat bucket Storage `proofs` (private) dan `site-assets` (public) — migration sudah membuat keduanya.
3. Isi environment di Vercel sesuai `.env.example`, terutama `SESSION_SECRET` dan `OTP_ENCRYPTION_KEY` (minimal 32 karakter acak).
4. Deploy `npm run build` ke Vercel.
5. Di panel admin, buat akun admin, isi konten, kelas, QRIS statis, dan nomor WhatsApp admin.
6. Jalankan `worker/` di Oracle Cloud Always Free (Docker/VM), isi `worker/.env` dengan kunci Supabase dan `OTP_ENCRYPTION_KEY` yang **sama persis** dengan web.
7. Buka `/admin/whatsapp`, pindai QR dengan WhatsApp admin.

Panduan lengkap ada di [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md), termasuk [aktivasi Login Google](docs/GOOGLE_LOGIN.md).

Jika memakai Supabase, jalankan juga `supabase/migrations/0002_google_auth.sql` setelah migrasi pertama.

## Lisensi

MIT — silakan dipakai, dimodifikasi, dan dikembangkan kembali. Kredit tetap diberikan kepada **Beny Abu Ibrahim**.
