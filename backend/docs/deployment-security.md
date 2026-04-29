# Deployment Security Checklist

Panduan singkat ini dipakai sebelum backend Laravel dipasang di hosting production.

## Web Root

- Document root production wajib mengarah ke direktori `backend/public`.
- Jangan expose root repository ke publik. Direktori seperti `backend/.env`, `backend/storage`, `backend/vendor`, `frontend`, dan file repo lain tidak boleh bisa diakses langsung dari web.
- File `index.php` di root repo hanya fallback netral. Entry point aplikasi tetap `backend/public/index.php`.

## Environment Production

- `.env` production wajib berbeda dari `.env` local.
- Jangan menyimpan credential production di repository, issue tracker, chat publik, atau file dokumentasi.
- Gunakan `APP_ENV=production`.
- Gunakan `APP_DEBUG=false`.
- Isi `APP_KEY` dengan key production yang dibuat di server:

```bash
php artisan key:generate
```

- Sesuaikan `APP_URL`, `FRONTEND_URL`, `CORS_ALLOWED_ORIGINS`, dan `SANCTUM_STATEFUL_DOMAINS` dengan domain production.
- Setelah mengubah `.env`, jalankan clear/cache konfigurasi sesuai kebutuhan:

```bash
php artisan config:clear
php artisan cache:clear
php artisan config:cache
```

## Scheduler Dan Queue

- Scheduler Laravel harus aktif jika ada proses backup atau task terjadwal.
- Contoh cron production:

```cron
* * * * * cd /path/to/project/backend && php artisan schedule:run >> /dev/null 2>&1
```

- Queue worker harus aktif jika sistem memakai queue, misalnya untuk backup dokumen atau notifikasi.
- Jalankan queue worker melalui process manager hosting atau Supervisor, bukan terminal manual yang mudah mati.
- Contoh command worker:

```bash
php artisan queue:work --queue=default,document-backups --tries=3 --timeout=120
```

## Data Sensitif Dan Backup

- Dokumen syarat KPR, bukti transfer, database backup, dan backup dokumen harus berada di storage private.
- Bucket Cloudflare R2 untuk backup tidak boleh public.
- Gunakan credential R2 production khusus dengan hak akses minimum yang diperlukan.
- Pastikan retensi backup sesuai kebijakan bisnis dan kebutuhan kepatuhan.
- Uji restore database dan dokumen secara berkala, bukan hanya uji proses backup.

## Permission Server

- User web server hanya perlu write ke direktori yang memang dibutuhkan Laravel, terutama `backend/storage` dan `backend/bootstrap/cache`.
- File `.env` harus memiliki permission ketat dan tidak dapat diunduh dari web.
- Gunakan HTTPS di production dan aktifkan secure cookie melalui `SESSION_SECURE_COOKIE=true`.
