# SOP Backup dan Restore Cloudflare R2

Dokumen ini menjelaskan prosedur restore untuk backup database dan dokumen booking/KPR yang disimpan di Cloudflare R2.

## Kapan Restore Diperlukan

Restore database diperlukan saat terjadi kehilangan data, perubahan data massal yang keliru, database corrupt, server database gagal, atau migrasi ke server baru.

Restore dokumen diperlukan saat file lokal di server hilang, storage server corrupt, dokumen terhapus sebelum masa retensi, atau server aplikasi dipindahkan.

## Lokasi Backup R2

Database backup disimpan dengan struktur:

```text
database/daily/YYYY/MM/DD/{app}-{database}-{timestamp}.sql.gz
database/weekly/YYYY/Www/{app}-{database}-{timestamp}.sql.gz
database/monthly/YYYY/MM/{app}-{database}-{timestamp}.sql.gz
```

Setiap file `.sql.gz` memiliki manifest pendamping `.json` yang berisi waktu backup, ukuran file, dan checksum SHA-256.

Dokumen booking/KPR disimpan dengan struktur:

```text
documents/bookings/{id_booking}/documents/{stored_filename}
documents/bookings/{id_booking}/transfer-proofs/{stored_filename}
```

Object key dokumen disimpan di tabel `doc_booking.backup_object_key`. Nilai lama `backup_file_id` tetap diisi untuk kompatibilitas.

## Restore Database dari R2

1. Pilih file backup yang paling sesuai dari prefix `database/daily`, `database/weekly`, atau `database/monthly`.
2. Download file `.sql.gz` dan file `.json` manifest dari R2.
3. Verifikasi checksum lokal:

```bash
sha256sum nama-backup.sql.gz
```

Nilainya harus sama dengan `checksum_sha256` di manifest.

4. Extract backup:

```bash
gunzip -k nama-backup.sql.gz
```

5. Buat database tujuan jika belum ada:

```bash
mysql -u root -p -e "CREATE DATABASE sistem_pemasaran_perumahan_restore CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

6. Import dump:

```bash
mysql -u root -p sistem_pemasaran_perumahan_restore < nama-backup.sql
```

7. Arahkan `.env` sementara ke database restore untuk validasi, atau restore ke database produksi setelah downtime dan approval.

## Restore Dokumen dari R2

1. Cari data dokumen di tabel `doc_booking`.
2. Ambil nilai `backup_object_key`.
3. Download object dari R2 sesuai key tersebut.
4. Letakkan kembali ke private storage lokal sesuai `storage_disk` dan `storage_path`.
5. Pastikan file lokal tidak diletakkan di public web root.
6. Jika restore dilakukan massal, jalankan script terkontrol yang membaca `doc_booking` dan menyalin object R2 kembali ke disk lokal.

## Verifikasi Setelah Restore

Verifikasi database:

```bash
php artisan migrate:status
php artisan tinker
```

Di `tinker`, cek jumlah data inti seperti `User::count()`, `Booking::count()`, dan `DocBooking::count()`.

Verifikasi dokumen:

1. Buka detail booking sebagai admin.
2. Download beberapa dokumen dari endpoint aplikasi.
3. Pastikan response bukan `404`, nama file benar, dan isi file dapat dibuka.
4. Cocokkan `doc_booking.storage_path` dengan file lokal atau `backup_object_key` di R2.

## Menjaga Sinkron Database dan Dokumen

Database adalah sumber metadata dokumen. Restore database dan dokumen harus memakai titik waktu yang berdekatan.

Jika database direstore ke backup lama, dokumen yang diupload setelah waktu backup database mungkin masih ada di R2 tetapi tidak tercatat di database. Jika database lebih baru dari dokumen, beberapa row `doc_booking` mungkin menunjuk file yang belum tersedia di R2.

Langkah aman:

1. Restore database terlebih dahulu.
2. Jalankan audit dokumen dengan membandingkan `doc_booking.backup_object_key` terhadap object yang ada di R2.
3. Restore file lokal hanya untuk dokumen yang tercatat di database aktif.
4. Jalankan download sampling dari aplikasi.

## Command Operasional

Jalankan backup database manual:

```bash
php artisan backups:database
```

Jalankan backup database lalu dispatch backup dokumen:

```bash
php artisan backups:run
```

Dispatch ulang dokumen yang pending, failed, disabled, atau masih provider lama:

```bash
php artisan documents:backup-pending --limit=250
```

Prune file lokal dokumen yang sudah aman dibackup dan melewati retensi:

```bash
php artisan documents:prune-local --dry-run
php artisan documents:prune-local
```

## Environment Wajib

Semua credential harus berada di `.env`.

```env
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_ACCOUNT_ID=
R2_BUCKET=
R2_ENDPOINT=https://<account_id>.r2.cloudflarestorage.com
R2_REGION=auto
R2_USE_PATH_STYLE_ENDPOINT=true

DATABASE_BACKUP_ENABLED=true
DATABASE_BACKUP_CONNECTION=mysql
DATABASE_BACKUP_DISK=r2
DATABASE_BACKUP_PREFIX=database
DATABASE_BACKUP_MYSQLDUMP_PATH=mysqldump

DOCUMENT_BACKUP_ENABLED=true
DOCUMENT_BACKUP_PROVIDER=r2
DOCUMENT_BACKUP_DISK=r2
DOCUMENT_BACKUP_PREFIX=documents
```
