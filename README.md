# Sistem Pemasaran Perumahan

Aplikasi web untuk pemasaran, pemesanan, dan pengelolaan data perumahan Zavira Mecca Property. Project ini memakai arsitektur terpisah:

- `backend/` berisi API Laravel, autentikasi, database, upload dokumen, notifikasi WhatsApp, dan backup.
- `frontend/` berisi aplikasi React + Vite untuk user, marketing, admin, dan superadmin.

## Teknologi

- Backend: PHP 8.2+, Laravel 12, Laravel Sanctum, MySQL, Composer.
- Frontend: Node.js, React 19, Vite 7, Tailwind CSS, Axios, Recharts.
- Tooling root: `concurrently` untuk menjalankan backend dan frontend sekaligus.

## Fitur Utama

- Informasi perumahan, unit, harga, media, status unit, dan promo.
- Booking unit secara online beserta upload dokumen pendukung.
- Dashboard admin dan marketing.
- Manajemen user admin, marketing, user, dan superadmin.
- Manajemen profil perusahaan, informasi KPR, template surat, dan log WhatsApp.
- Backup database dan dokumen ke Cloudflare R2 untuk kebutuhan production.

