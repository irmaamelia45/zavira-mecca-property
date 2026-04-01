# Sistem Pemasaran Perumahan

## Ringkasan Project
Project ini adalah aplikasi pemasaran perumahan berbasis web dengan arsitektur terpisah:
- `frontend/` untuk antarmuka pengguna (publik, user, marketing, admin)
- `backend/` untuk API, autentikasi, manajemen data, dan logika bisnis

## Tools yang Digunakan
- `Node.js` + `npm`
- `Composer`
- `Vite`
- `Concurrently`
- `ESLint`
- `Laravel Artisan`

## Bahasa Pemrograman
- `PHP`
- `JavaScript`
- `HTML`
- `CSS`

## Framework dan Library Utama
- Backend: `Laravel 12`
- Frontend: `React 19`, `React Router DOM`, `Tailwind CSS 4`, `Axios`, `Framer Motion`, `Recharts`, `React Icons`

## Inventori File dan Fungsinya
Tabel di bawah berisi file inti project (source/config) dan fungsi singkatnya.

| File | Fungsi |
|---|---|
| `backend/app/Http/Controllers/Api/AdminDashboardController.php` | Controller API backend untuk modul: Admin Dashboard Controller. |
| `backend/app/Http/Controllers/Api/AdminUserController.php` | Controller API backend untuk modul: Admin User Controller. |
| `backend/app/Http/Controllers/Api/AuthController.php` | Controller API backend untuk modul: Auth Controller. |
| `backend/app/Http/Controllers/Api/BookingController.php` | Controller API backend untuk modul: Booking Controller. |
| `backend/app/Http/Controllers/Api/CompanyProfileController.php` | Controller API backend untuk modul: Company Profile Controller. |
| `backend/app/Http/Controllers/Api/KprInfoController.php` | Controller API backend untuk modul: Kpr Info Controller. |
| `backend/app/Http/Controllers/Api/MarketingBookingController.php` | Controller API backend untuk modul: Marketing Booking Controller. |
| `backend/app/Http/Controllers/Api/MarketingDashboardController.php` | Controller API backend untuk modul: Marketing Dashboard Controller. |
| `backend/app/Http/Controllers/Api/PerumahanController.php` | Controller API backend untuk modul: Perumahan Controller. |
| `backend/app/Http/Controllers/Api/PromoController.php` | Controller API backend untuk modul: Promo Controller. |
| `backend/app/Http/Controllers/Controller.php` | Base controller untuk semua controller backend. |
| `backend/app/Http/Middleware/AuthenticateApiToken.php` | Middleware backend untuk autentikasi/otorisasi: Authenticate Api Token. |
| `backend/app/Http/Middleware/RequireRole.php` | Middleware backend untuk autentikasi/otorisasi: Require Role. |
| `backend/app/Models/Booking.php` | Model Eloquent backend untuk entitas: Booking. |
| `backend/app/Models/DocBooking.php` | Model Eloquent backend untuk entitas: Doc Booking. |
| `backend/app/Models/KprAlur.php` | Model Eloquent backend untuk entitas: Kpr Alur. |
| `backend/app/Models/KprInfo.php` | Model Eloquent backend untuk entitas: Kpr Info. |
| `backend/app/Models/KprSyarat.php` | Model Eloquent backend untuk entitas: Kpr Syarat. |
| `backend/app/Models/Perumahan.php` | Model Eloquent backend untuk entitas: Perumahan. |
| `backend/app/Models/PerumahanMedia.php` | Model Eloquent backend untuk entitas: Perumahan Media. |
| `backend/app/Models/ProfilPerusahaan.php` | Model Eloquent backend untuk entitas: Profil Perusahaan. |
| `backend/app/Models/Promo.php` | Model Eloquent backend untuk entitas: Promo. |
| `backend/app/Models/Role.php` | Model Eloquent backend untuk entitas: Role. |
| `backend/app/Models/User.php` | Model Eloquent backend untuk entitas: User. |
| `backend/app/Models/UserApiToken.php` | Model Eloquent backend untuk entitas: User Api Token. |
| `backend/app/Models/WhatsappNotifLog.php` | Model Eloquent backend untuk entitas: Whatsapp Notif Log. |
| `backend/app/Providers/AppServiceProvider.php` | Service provider Laravel: App Service Provider. |
| `backend/artisan` | CLI utama Laravel untuk menjalankan command framework. |
| `backend/bootstrap/app.php` | Bootstrap aplikasi Laravel (registrasi middleware, route, service). |
| `backend/bootstrap/cache/packages.php` | Cache manifest package Laravel (generated). |
| `backend/bootstrap/cache/services.php` | Cache manifest service Laravel (generated). |
| `backend/bootstrap/providers.php` | Daftar service provider yang dimuat Laravel. |
| `backend/composer.json` | Konfigurasi dependency PHP (Composer) untuk backend Laravel. |
| `backend/composer.lock` | Lockfile dependency Composer backend. |
| `backend/config/app.php` | Konfigurasi Laravel: app. |
| `backend/config/auth.php` | Konfigurasi Laravel: auth. |
| `backend/config/cache.php` | Konfigurasi Laravel: cache. |
| `backend/config/database.php` | Konfigurasi Laravel: database. |
| `backend/config/filesystems.php` | Konfigurasi Laravel: filesystems. |
| `backend/config/logging.php` | Konfigurasi Laravel: logging. |
| `backend/config/mail.php` | Konfigurasi Laravel: mail. |
| `backend/config/queue.php` | Konfigurasi Laravel: queue. |
| `backend/config/services.php` | Konfigurasi Laravel: services. |
| `backend/config/session.php` | Konfigurasi Laravel: session. |
| `backend/database/database.sqlite` | File database SQLite lokal untuk development/testing. |
| `backend/database/factories/UserFactory.php` | Factory data uji: User Factory. |
| `backend/database/migrations/0001_01_01_000000_create_users_table.php` | Migrasi schema database: 0001 01 01 000000 create users table. |
| `backend/database/migrations/0001_01_01_000001_create_cache_table.php` | Migrasi schema database: 0001 01 01 000001 create cache table. |
| `backend/database/migrations/0001_01_01_000002_create_jobs_table.php` | Migrasi schema database: 0001 01 01 000002 create jobs table. |
| `backend/database/migrations/2026_02_05_000100_create_perumahan_tables.php` | Migrasi schema database: 2026 02 05 000100 create perumahan tables. |
| `backend/database/migrations/2026_02_05_000200_create_booking_tables.php` | Migrasi schema database: 2026 02 05 000200 create booking tables. |
| `backend/database/migrations/2026_02_05_000300_create_company_and_kpr_tables.php` | Migrasi schema database: 2026 02 05 000300 create company and kpr tables. |
| `backend/database/migrations/2026_03_01_000300_add_marketing_contact_to_perumahan_table.php` | Migrasi schema database: 2026 03 01 000300 add marketing contact to perumahan table. |
| `backend/database/migrations/2026_03_01_000400_create_perumahan_promo_pivot.php` | Migrasi schema database: 2026 03 01 000400 create perumahan promo pivot. |
| `backend/database/migrations/2026_03_05_000500_add_jenis_konten_to_kpr_info.php` | Migrasi schema database: 2026 03 05 000500 add jenis konten to kpr info. |
| `backend/database/migrations/2026_03_08_000600_add_profile_extras_to_profil_perusahaan.php` | Migrasi schema database: 2026 03 08 000600 add profile extras to profil perusahaan. |
| `backend/database/migrations/2026_03_08_001000_add_logo_path_to_profil_perusahaan.php` | Migrasi schema database: 2026 03 08 001000 add logo path to profil perusahaan. |
| `backend/database/migrations/2026_03_08_002000_add_promo_extras.php` | Migrasi schema database: 2026 03 08 002000 add promo extras. |
| `backend/database/migrations/2026_03_14_000100_create_user_api_tokens_table.php` | Migrasi schema database: 2026 03 14 000100 create user api tokens table. |
| `backend/database/migrations/2026_03_14_000200_add_detail_columns_to_perumahan_table.php` | Migrasi schema database: 2026 03 14 000200 add detail columns to perumahan table. |
| `backend/database/migrations/2026_03_30_000700_add_job_fields_to_booking_table.php` | Migrasi schema database: 2026 03 30 000700 add job fields to booking table. |
| `backend/database/migrations/2026_03_30_000800_add_pekerjaan_to_booking_table.php` | Migrasi schema database: 2026 03 30 000800 add pekerjaan to booking table. |
| `backend/database/seeders/BookingDummySeeder.php` | Seeder data awal/dummy: Booking Dummy Seeder. |
| `backend/database/seeders/DatabaseSeeder.php` | Seeder data awal/dummy: Database Seeder. |
| `backend/database/seeders/PerumahanDummySeeder.php` | Seeder data awal/dummy: Perumahan Dummy Seeder. |
| `backend/database/seeders/PromoDummySeeder.php` | Seeder data awal/dummy: Promo Dummy Seeder. |
| `backend/database/seeders/RoleSeeder.php` | Seeder data awal/dummy: Role Seeder. |
| `backend/package.json` | Dependency JavaScript pendukung asset backend Laravel. |
| `backend/phpunit.xml` | Konfigurasi test runner PHPUnit backend. |
| `backend/public/favicon.ico` | Ikon favicon default aplikasi backend. |
| `backend/public/index.php` | Front controller public untuk backend Laravel. |
| `backend/public/robots.txt` | Aturan crawler/search engine untuk domain backend. |
| `backend/README.md` | Dokumentasi default Laravel pada folder backend. |
| `backend/resources/css/app.css` | Stylesheet asset Laravel backend. |
| `backend/resources/js/app.js` | Entry JavaScript asset backend Laravel. |
| `backend/resources/js/bootstrap.js` | Setup bootstrap JavaScript backend (axios/csrf, dll). |
| `backend/resources/views/welcome.blade.php` | Template Blade default halaman welcome Laravel. |
| `backend/routes/api.php` | Definisi seluruh route API backend. |
| `backend/routes/console.php` | Definisi route/command console Laravel. |
| `backend/routes/web.php` | Definisi route web backend Laravel. |
| `backend/tests/Feature/ExampleTest.php` | Feature test backend: Example Test. |
| `backend/tests/TestCase.php` | Base test case untuk test backend Laravel. |
| `backend/tests/Unit/ExampleTest.php` | Unit test backend: Example Test. |
| `backend/vite.config.js` | Konfigurasi Vite untuk asset pipeline backend Laravel. |
| `frontend/eslint.config.js` | Aturan linting ESLint untuk kode React frontend. |
| `frontend/index.html` | Template HTML utama tempat aplikasi React di-mount. |
| `frontend/lint_output.txt` | Output hasil linting frontend (file artefak). |
| `frontend/package.json` | Daftar script dan dependency frontend React. |
| `frontend/package-lock.json` | Lockfile dependency npm pada frontend. |
| `frontend/postcss.config.js` | Konfigurasi PostCSS (dipakai Tailwind/Autoprefixer). |
| `frontend/public/vite.svg` | Aset ikon default untuk frontend. |
| `frontend/README.md` | Dokumentasi bawaan/frontend level. |
| `frontend/src/App.css` | Style tambahan untuk komponen root frontend. |
| `frontend/src/App.jsx` | Komponen root aplikasi frontend dan definisi routing utama. |
| `frontend/src/assets/bg_page.jpg` | Aset statis frontend (logo, background, ikon). |
| `frontend/src/assets/logo_pt.png` | Aset statis frontend (logo, background, ikon). |
| `frontend/src/assets/react.svg` | Aset statis frontend (logo, background, ikon). |
| `frontend/src/components/auth/ProtectedRoute.jsx` | Guard route untuk membatasi akses halaman berdasar status login/role. |
| `frontend/src/components/layout/AdminLayout.jsx` | Komponen layout frontend: Admin Layout. |
| `frontend/src/components/layout/Footer.jsx` | Komponen layout frontend: Footer. |
| `frontend/src/components/layout/Navbar.jsx` | Komponen layout frontend: Navbar. |
| `frontend/src/components/layout/UserLayout.jsx` | Komponen layout frontend: User Layout. |
| `frontend/src/components/ui/AppErrorBoundary.jsx` | Komponen UI reusable frontend: App Error Boundary. |
| `frontend/src/components/ui/Badge.jsx` | Komponen UI reusable frontend: Badge. |
| `frontend/src/components/ui/Button.jsx` | Komponen UI reusable frontend: Button. |
| `frontend/src/components/ui/Card.jsx` | Komponen UI reusable frontend: Card. |
| `frontend/src/components/ui/Input.jsx` | Komponen UI reusable frontend: Input. |
| `frontend/src/components/ui/PromoCard.jsx` | Komponen UI reusable frontend: Promo Card. |
| `frontend/src/index.css` | Global stylesheet frontend (termasuk style admin/user). |
| `frontend/src/lib/auth.js` | Helper autentikasi frontend (token/session user). |
| `frontend/src/lib/favorites.js` | Helper penyimpanan dan akses data favorit per user. |
| `frontend/src/lib/utils.js` | Utility function umum yang dipakai lintas komponen. |
| `frontend/src/main.jsx` | Entry point React; inisialisasi dan render aplikasi. |
| `frontend/src/pages/AccountBooking.jsx` | Halaman akun user frontend: Account Booking. |
| `frontend/src/pages/AccountBookingDetail.jsx` | Halaman akun user frontend: Account Booking Detail. |
| `frontend/src/pages/AccountDashboard.jsx` | Halaman akun user frontend: Account Dashboard. |
| `frontend/src/pages/AccountFavorites.jsx` | Halaman akun user frontend: Account Favorites. |
| `frontend/src/pages/AccountHome.jsx` | Halaman akun user frontend: Account Home. |
| `frontend/src/pages/AccountProfile.jsx` | Halaman akun user frontend: Account Profile. |
| `frontend/src/pages/Admin/AddPromo.jsx` | Halaman dashboard/admin frontend: Add Promo. |
| `frontend/src/pages/Admin/AddProperty.jsx` | Halaman dashboard/admin frontend: Add Property. |
| `frontend/src/pages/Admin/BookingDetail.jsx` | Halaman dashboard/admin frontend: Booking Detail. |
| `frontend/src/pages/Admin/BookingManagement.jsx` | Halaman dashboard/admin frontend: Booking Management. |
| `frontend/src/pages/Admin/CompanyProfileManagement.jsx` | Halaman dashboard/admin frontend: Company Profile Management. |
| `frontend/src/pages/Admin/Dashboard.jsx` | Halaman dashboard/admin frontend: Dashboard. |
| `frontend/src/pages/Admin/EditPromo.jsx` | Halaman dashboard/admin frontend: Edit Promo. |
| `frontend/src/pages/Admin/EditProperty.jsx` | Halaman dashboard/admin frontend: Edit Property. |
| `frontend/src/pages/Admin/KprManagement.jsx` | Halaman dashboard/admin frontend: Kpr Management. |
| `frontend/src/pages/Admin/MarketingUserManagement.jsx` | Halaman dashboard/admin frontend: Marketing User Management. |
| `frontend/src/pages/Admin/PromoManagement.jsx` | Halaman dashboard/admin frontend: Promo Management. |
| `frontend/src/pages/Admin/PropertyDetail.jsx` | Halaman dashboard/admin frontend: Property Detail. |
| `frontend/src/pages/Admin/PropertyManagement.jsx` | Halaman dashboard/admin frontend: Property Management. |
| `frontend/src/pages/Admin/TemplateSurat.jsx` | Halaman dashboard/admin frontend: Template Surat. |
| `frontend/src/pages/Booking.jsx` | Halaman publik/frontend: Booking. |
| `frontend/src/pages/CompanyProfile.jsx` | Halaman publik/frontend: Company Profile. |
| `frontend/src/pages/Home.jsx` | Halaman publik/frontend: Home. |
| `frontend/src/pages/HousingDetail.jsx` | Halaman publik/frontend: Housing Detail. |
| `frontend/src/pages/HousingList.jsx` | Halaman publik/frontend: Housing List. |
| `frontend/src/pages/KprInfo.jsx` | Halaman publik/frontend: Kpr Info. |
| `frontend/src/pages/Login.jsx` | Halaman publik/frontend: Login. |
| `frontend/src/pages/MarketingDashboard.jsx` | Halaman publik/frontend: Marketing Dashboard. |
| `frontend/src/pages/PromoDetail.jsx` | Halaman publik/frontend: Promo Detail. |
| `frontend/src/pages/PromoList.jsx` | Halaman publik/frontend: Promo List. |
| `frontend/src/pages/Register.jsx` | Halaman publik/frontend: Register. |
| `frontend/src/utils/promo.js` | Utility data/helper frontend: promo. |
| `frontend/src/utils/property.js` | Utility data/helper frontend: property. |
| `frontend/tailwind.config.js` | Konfigurasi Tailwind CSS pada frontend. |
| `frontend/vite.config.js` | Konfigurasi Vite untuk build dan dev server frontend. |
| `index.php` | Entry point root project (pengarah awal aplikasi di environment lokal). |
| `package.json` | Konfigurasi npm root untuk menjalankan frontend dan backend bersamaan. |
| `package-lock.json` | Lockfile dependency npm di level root project. |
| `README.md` | File pendukung aplikasi. |
| `readmi.md` | Dokumentasi ringkas project versi awal. |

## Catatan File Generated/Runtime
File berikut tidak dijelaskan satu per satu karena sifatnya otomatis/generate saat aplikasi berjalan:
- `frontend/dist/**` (hasil build production frontend)
- `backend/public/uploads/**` (file upload pengguna/perumahan/dokumen)
- `backend/storage/framework/views/**` (cache compiled Blade view)
- `backend/storage/logs/**` (log runtime Laravel)
- `node_modules/**` dan `backend/vendor/**` (dependency manager)

## Catatan
Jika kamu ingin, saya bisa lanjutkan membuat versi dokumentasi terpisah `docs/FILE_GUIDE.md` yang lebih detail per modul (frontend publik, user area, marketing area, admin area, backend API, dan database).
