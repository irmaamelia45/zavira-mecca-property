# Sistem Pemasaran Perumahan

## Deskripsi
Sistem Pemasaran Perumahan adalah aplikasi berbasis web yang dirancang untuk membantu proses pemasaran, pemesanan, dan pengelolaan data perumahan secara terintegrasi. Sistem ini digunakan untuk mempertemukan calon konsumen dengan informasi perumahan yang tersedia, sekaligus memudahkan pengelolaan operasional oleh tim marketing dan admin.

Melalui sistem ini, pengguna dapat melihat daftar perumahan, mempelajari detail unit, melihat promo yang sedang berjalan, melakukan simulasi KPR, hingga mengajukan booking unit secara online. Di sisi pengelola, sistem menyediakan dashboard dan fitur untuk memantau data perumahan, booking, pengguna, promosi, serta aktivitas pendukung lainnya.

## Tujuan Sistem
Sistem ini dikembangkan untuk:
- mempermudah penyampaian informasi perumahan kepada calon konsumen
- membantu proses booking unit agar lebih cepat dan terdokumentasi
- mendukung pengelolaan data pemasaran secara lebih rapi dan terpusat
- memudahkan monitoring aktivitas penjualan dan status unit perumahan

## Fitur Utama
- menampilkan daftar perumahan beserta detail unit, harga, dan informasi pendukung
- menyediakan halaman promo perumahan untuk menarik minat calon konsumen
- menyediakan simulasi KPR dan informasi pembiayaan
- mendukung proses booking unit rumah secara online
- menampilkan status unit perumahan seperti tersedia, terbooking, dan terjual
- menyediakan profil perusahaan dan struktur organisasi
- mendukung pengelolaan template surat dan riwayat notifikasi WhatsApp
- menyediakan dashboard monitoring untuk admin dan marketing

## Peran Pengguna

### Pengunjung / User
Pengunjung atau user dapat melihat informasi perumahan, promo, profil perusahaan, simulasi KPR, serta melakukan booking unit dan memantau riwayat booking yang dimiliki.

### Marketing
Marketing dapat memantau data booking yang menjadi tanggung jawabnya serta membantu proses tindak lanjut calon konsumen.

### Admin
Admin berperan dalam mengelola data perumahan, promo, booking, informasi perusahaan, template surat, akun pengguna tertentu, dan berbagai laporan pada dashboard sistem.

### Superadmin
Superadmin memiliki hak akses tertinggi untuk mengelola sistem secara menyeluruh.

## Modul Dalam Sistem
- **Manajemen Perumahan**: pengelolaan data perumahan, unit, status unit, dan media perumahan
- **Manajemen Booking**: proses pengajuan, verifikasi, dan pemantauan booking unit
- **Manajemen Promo**: publikasi dan pengelolaan promo perumahan
- **Informasi KPR**: simulasi dan informasi pendukung pembiayaan rumah
- **Manajemen Pengguna**: pengelolaan akun admin, marketing, dan user
- **Profil Perusahaan**: informasi perusahaan, kontak, dan struktur organisasi
- **Dokumen dan Komunikasi**: template surat dan riwayat notifikasi WhatsApp

## Teknologi yang Digunakan

### Backend
- Laravel
- PHP
- MySQL

### Frontend
- React
- Vite
- Tailwind CSS
- Axios
- Recharts
- React Icons

## Arsitektur Project
Project ini menggunakan arsitektur terpisah antara frontend dan backend:
- `frontend/` digunakan untuk antarmuka pengguna
- `backend/` digunakan untuk API, autentikasi, dan logika bisnis

Pemisahan ini membantu pengembangan sistem agar lebih terstruktur, mudah dikelola, dan lebih fleksibel untuk pengembangan selanjutnya.

## Manfaat Sistem
Dengan adanya sistem ini, proses pemasaran perumahan dapat dilakukan dengan lebih efektif, informasi dapat tersampaikan dengan lebih jelas kepada calon konsumen, dan pengelolaan data oleh pihak internal menjadi lebih rapi, cepat, dan terdokumentasi.
