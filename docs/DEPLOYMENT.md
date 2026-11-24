# Panduan Deploy

Panduan ini menyiapkan tiga komponen:

| Komponen | Fungsi | Platform gratis |
| --- | --- | --- |
| Web app | Situs publik + panel admin | Vercel |
| Database & Storage | Data transaksi, OTP, bukti transfer | Supabase |
| WhatsApp worker | Pengirim OTP otomatis (Baileys) | Oracle Cloud Always Free |

Tanpa worker, sistem tetap berfungsi dengan mode manual: admin melihat kode OTP di `/admin/whatsapp` dan mengirimkannya lewat tombol WhatsApp.

---

## 1. Supabase

1. Buat project di https://supabase.com.
2. Buka **SQL Editor → New query**, tempel seluruh isi `supabase/migrations/0001_init.sql`, lalu jalankan.
3. Jalankan pula `supabase/migrations/0002_google_auth.sql` (kolom `email`, `google_sub`, `phone_verified_at` pada `families`).
4. Migration membuat:
   - tabel `settings`, `admins`, `classes`, `form_fields`, `families`, `students`, `invoices`, `invoice_items`, `otp_requests`, `wa_session`, `audit_logs`;
   - sequence nomor invoice;
   - RPC `create_invoice` untuk alokasi kode unik yang aman terhadap konkurensi;
   - RLS (akses lewat service role);
   - bucket Storage `proofs` (private) dan `site-assets` (public);
   - seed `settings`, `wa_session`, dan kelas contoh.
5. Salin **Project URL**, **anon key**, dan **service_role key** dari *Project Settings → API*.

> Service role key hanya boleh disimpan di server (Vercel environment variable dan worker). Jangan pernah memakainya di kode client.

### Bersihkan data contoh

Kelas dan konten di migration hanya contoh. Setelah login admin, hapus/nonaktifkan kelas yang tidak dipakai dan ubah konten di menu **Konten Beranda**.

---

## 2. Vercel

1. Import repository GitHub ke Vercel. Framework terdeteksi sebagai Next.js.
2. Tambahkan environment variables:

```env
DEMO_MODE=false
NEXT_PUBLIC_APP_URL=https://domain-anda.vercel.app
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SESSION_SECRET=<32+ karakter acak>
OTP_ENCRYPTION_KEY=<32+ karakter acak, berbeda dari SESSION_SECRET>
UPLOAD_MAX_BYTES=3145728

# Opsional — aktifkan tombol "Masuk dengan Google"
NEXT_PUBLIC_GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
```

Buat nilai acak dengan:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

3. Deploy. Setelah selesai, buka `https://domain-anda.vercel.app/admin/setup` untuk membuat akun admin pertama.

### Domain kustom

Tambahkan domain di *Vercel → Project Settings → Domains*, lalu perbarui `NEXT_PUBLIC_APP_URL` dan redeploy.

Untuk mengaktifkan Login Google, ikuti [`docs/GOOGLE_LOGIN.md`](GOOGLE_LOGIN.md).

---

## 3. WhatsApp worker (Oracle Cloud Always Free)

### Opsi A — VM + Docker (direkomendasikan)

1. Buat VM **Ubuntu 24.04**, bentuk **VM.Standard.E2.1.Micro** (Always Free).
2. Buka port 22 untuk SSH. Install Docker:
   ```bash
   sudo apt update && sudo apt install -y docker.io git
   sudo usermod -aG docker $USER
   ```
3. Clone repo dan siapkan env:
   ```bash
   git clone <URL_REPO> taawun
   cd taawun/worker
   cp .env.example .env
   nano .env
   ```
4. Isi `.env`:
   - `SUPABASE_URL` dan `SUPABASE_SERVICE_ROLE_KEY` sama dengan web;
   - `OTP_ENCRYPTION_KEY` **harus sama persis** dengan nilai di Vercel, jika tidak kode OTP tidak bisa didekripsi;
   - `AUTH_DIR=/app/auth_info`.
5. Build dan jalankan:
   ```bash
   docker build -t taawun-wa-worker .
   docker run -d --name taawun-wa --restart unless-stopped \
     --env-file .env \
     -v taawun_auth:/app/auth_info \
     taawun-wa-worker
   ```
6. Lihat log: `docker logs -f taawun-wa`.
7. Buka `/admin/whatsapp` di web, lalu pindai QR yang muncul dengan **WhatsApp → Perangkat tertaut → Tautkan perangkat**. Gunakan nomor WhatsApp admin yang aktif dan tidak dipakai di tempat lain.

### Opsi B — Jalankan langsung tanpa Docker

```bash
cd worker
npm install
cp .env.example .env
npm run build
npm start
```

Gunakan `pm2` atau `systemd` agar worker otomatis jalan ulang setelah reboot.

### Perilaku worker

- Menyimpan QR dan status koneksi ke tabel `wa_session` setiap ada perubahan.
- Menulis heartbeat tiap 30 detik saat terhubung. Web menganggap worker offline bila heartbeat lebih tua dari 2 menit.
- Mengambil maksimal 20 OTP `pending` yang belum kedaluwarsa tiap 3 detik, mendekripsi kode, lalu mengirim ke `62xxxx@s.whatsapp.net`.
- Status OTP berubah `pending → sending → sent` atau `failed` beserta `worker_error`.
- Tombol **Keluar dari WhatsApp** dan **Reset sesi** di panel admin memicu worker menghapus kredensial dan membuat QR baru.
- Jika worker mati, OTP tetap dibuat dan admin bisa mengirim manual lewat `wa.me` dari panel admin.

### Keamanan akun WhatsApp

- Pakai nomor khusus untuk bot, bukan nomor pribadi utama.
- Jangan pernah commit folder `worker/auth_info/` atau file `.env`.
- Jika kredensial bocor, klik **Reset sesi** di panel admin untuk memutus perangkat.

---

## 4. Google Sheets (opsional)

1. Buat Spreadsheet, salin `SPREADSHEET_ID` dari URL-nya.
2. Buka **Extensions → Apps Script**, tempel isi `supabase/apps-script.gs`.
3. Isi `SPREADSHEET_ID` dan `WEBHOOK_SECRET` (buat secret acak).
4. **Deploy → New deployment → Web app**:
   - Execute as: **Me**
   - Who has access: **Anyone**
5. Salin URL `/exec`.
6. Di panel admin, buka **QRIS & Pengaturan**, isi URL webhook dan secret yang sama.
7. Setiap invoice diverifikasi, sistem mengirim payload `{ secret, sheet, generatedAt, headers, rows }`. Tombol **Kirim ke Sheets** di menu Ekspor mengirim seluruh data.

---

## 5. QRIS statis

1. Ajukan QRIS statis (tanpa nominal) ke penyedia QRIS merchant Anda.
2. Dapatkan **payload string** (biasanya diawali `0002010102...`) — bukan hanya file gambar. Jika hanya ada gambar, minta payload/string aslinya dari penyedia.
3. Tempel di menu admin **QRIS & Pengaturan**. Sistem memvalidasi TLV dan CRC16, lalu menolak payload yang sudah memiliki nominal.
4. Sistem otomatis membuat QRIS dinamis: mengganti field nominal dengan total `Ta'awun + kode unik` dan menghitung ulang CRC.

### Kode unik

- Admin menentukan base (default `9`). Kode yang dipakai: `9, 19, 29, ..., 999`.
- Kode yang sudah dipakai dilewati. Jika pola habis, sistem memakai kode 3 digit tersisa.
- Alokasi terjadi di dalam transaksi database/RPC agar dua invoice tidak mendapat kode sama.
- Pedagang mencocokkan pembayaran berdasarkan 3 digit terakhir nominal.

---

## 6. Verifikasi setelah deploy

| Cek | Cara |
| --- | --- |
| Beranda | Buka `/`, pastikan total, rekap kelas, dan kredit tampil |
| OTP | Minta kode di `/daftar`; cek status di `/admin/whatsapp` |
| QRIS | Buat invoice, pastikan QR dapat dipindai dan nominal akhir benar |
| Bukti | Unggah gambar di `/invoice/<id>`, cek di Storage bucket `proofs` |
| Verifikasi | Setujui invoice di `/admin/verifikasi`, lalu cek `/verifikasi` |
| Ekspor | Unduh XLSX/CSV dan kirim ke Sheets |
| Audit | Lihat `/admin/audit` |
| Worker | Heartbeat di `/admin/whatsapp` tidak lebih tua dari 2 menit |

---

## 7. Cadangan & pembaruan

- Backup database Supabase secara berkala (Project Settings → Backup) atau jadwalkan `pg_dump`.
- Simpan `OTP_ENCRYPTION_KEY` dan `SESSION_SECRET` di pengelola rahasia; kehilangan kunci OTP membuat antrean lama tidak bisa dikirim.
- Saat mengubah kode: jalankan `npm test`, `npm run lint`, `npm run build` sebelum push.
- Untuk memperbarui worker: `docker pull`/`docker build` ulang lalu restart container; folder `auth_info` tetap dipertahankan supaya tidak perlu scan QR ulang.

---

## 8. Biaya

- **Vercel Hobby**: gratis untuk penggunaan pribadi/komunitas.
- **Supabase Free**: 500 MB database, 1 GB Storage — cukup untuk ribuan transaksi.
- **Oracle Always Free**: 1 VM micro + penyimpanan, cukup untuk worker Baileys.
- **Google Sheets/Apps Script**: gratis dengan kuota harian.

---

Dibuat oleh **Beny Abu Ibrahim**. Lisensi MIT.
