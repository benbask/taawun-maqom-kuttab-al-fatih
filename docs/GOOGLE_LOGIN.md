# Login dengan Google (pengguna)

Fitur ini opsional dan hanya untuk **wali santri**. Admin tetap memakai username/password. Tombol otomatis tersembunyi jika `NEXT_PUBLIC_GOOGLE_CLIENT_ID` kosong, jadi mode demo tidak terpengaruh.

## Prinsip

Nomor WhatsApp tetap menjadi identitas utama karena dipakai untuk OTP, kepemilikan invoice, dan rekap verifikasi. Google tidak mengirim nomor WhatsApp, maka:

- **Pengguna baru**: Google → verifikasi nomor WhatsApp via OTP sekali → akun Google diikat ke keluarga.
- **Pengguna lama**: Google → langsung masuk (tidak perlu OTP lagi).

## 1. Buat kredensial Google

1. Buka https://console.cloud.google.com/ lalu buat/ pilih project.
2. **APIs & Services → OAuth consent screen**
   - User Type: **External**
   - Isi App name, User support email, Developer email.
   - Scopes: centang `openid`, `email`, `profile` (biasanya sudah default).
   - **Test users**: tambahkan email Anda sendiri selama masih dalam mode testing.
3. **APIs & Services → Credentials → Create Credentials → OAuth client ID**
   - Application type: **Web application**
   - Authorized JavaScript origins:
     - `http://localhost:3000`
     - `https://domain-anda.vercel.app`
   - Authorized redirect URIs: **tidak perlu diisi** untuk mode popup GIS.
4. Salin **Client ID** (bentuknya `xxxx.apps.googleusercontent.com`).

> Tidak perlu Client Secret. ID token dari browser diverifikasi langsung di server dengan JWKS Google.

## 2. Pasang ke aplikasi

Tambahkan ke `.env.local` (lokal) dan Vercel Environment Variables:

```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
```

Jalankan migrasi jika memakai Supabase:

```sql
-- sudah tersedia di supabase/migrations/0002_google_auth.sql
alter table public.families
  add column if not exists email text,
  add column if not exists google_sub text,
  add column if not exists phone_verified_at timestamptz;
```

Lalu deploy ulang. Jika memakai domain kustom, pastikan domain tersebut terdaftar di Authorized JavaScript origins.

## 3. Alur teknis

| Langkah | File | Keterangan |
| --- | --- | --- |
| Tombol GIS | `src/components/public/google-signin-button.tsx` | Memuat `https://accounts.google.com/gsi/client`, render tombol popup |
| Terima token | `src/app/api/auth/google/route.ts` | Verifikasi ID token; jika `sub` belum dikenal, simpan identitas di cookie pendek |
| Cookie sementara | `src/lib/google-pending.ts` | Signed JWT, httpOnly, 10 menit |
| Verifikasi token | `src/lib/google.ts` | `jose` + JWKS Google, cek `iss`, `aud`, `exp`, `email_verified` |
| Binding nomor | `src/app/api/auth/google/bind/route.ts` | Dipanggil setelah OTP WhatsApp berhasil; mengikat `sub` ke `families` |
| UI | `src/components/public/login-flow.tsx` | Mode normal dan mode `?google=bind` |

Session akhir tetap `taawun_user` berisi `phone` + `familyId`, sehingga invoice, unggah bukti, dan audit tidak berubah.

## 4. Pengujian

1. Tanpa client ID → tombol Google tidak muncul; login OTP masih normal.
2. Dengan client ID:
   - Klik **Masuk dengan Google**, pilih akun.
   - Pengguna baru akan diarahkan ke `?google=bind`.
   - Masukkan nomor WhatsApp → terima OTP → verifikasi.
   - Cek di database: `families.google_sub`, `families.email`, `families.phone_verified_at` terisi.
   - Logout, lalu masuk dengan Google lagi → langsung masuk tanpa OTP.
3. Cek invoice lama masih muncul di `/akun` dengan nomor yang sama.
4. Cek dua akun Google tidak bisa mengikat satu keluarga yang sama (akan ditolak).

## 5. Pemecahan masalah

| Gejala | Penyebab | Solusi |
| --- | --- | --- |
| Tombol tidak muncul | `NEXT_PUBLIC_GOOGLE_CLIENT_ID` kosong | Isi env lalu deploy ulang |
| Error `401 invalid_client` / audience | Client ID di Google berbeda dengan env | Samakan persis, termasuk redeploy setelah ubah env |
| Error origin tidak diizinkan | Domain belum terdaftar | Tambahkan origin di OAuth client ID |
| Pesan “Sesi Google sudah berakhir” | Cookie pending > 10 menit | Ulangi klik Google |
| Email tidak tersimpan | `email_verified` false | Pakai akun Google dengan email terverifikasi |

## Keamanan

- Cookie pending ditandatangani dengan `SESSION_SECRET` dan kedaluwarsa 10 menit.
- Endpoint Google dan binding diberi rate limit.
- Email hanya disimpan bila `email_verified === true`.
- Akun Google yang sudah terikat ke keluarga lain tidak dapat dipakai ulang.
- Audit log mencatat `google_login`, `google_login_pending`, dan `google_linked`.
