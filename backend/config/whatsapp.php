<?php

return [
    'enabled' => (bool) env('WHATSAPP_ENABLED', false),
    'office_maps_link' => env('OFFICE_MAPS_LINK', 'https://maps.google.com'),

    'templates' => [
        'admin_booking_masuk' => <<<'TEXT'
[NOTIFIKASI BOOKING BARU]

Halo Admin ZAVIRA,
Telah masuk booking baru dari calon pembeli dengan detail berikut:

Nama: {nama_user}
No. WhatsApp: {no_user}
Perumahan: {nama_perumahan}
Unit : {nama_unit}
Tanggal Booking: {tanggal_booking}
Status Booking: {status_booking}

Silakan segera cek data booking pada sistem untuk proses tindak lanjut.
Terima kasih.
TEXT,

        'user_booking_created' => <<<'TEXT'
Halo {nama_user},
Terima kasih, booking Anda telah berhasil kami terima dengan detail berikut:

Perumahan: {nama_perumahan}
Unit : {nama_unit}
Tanggal Booking: {tanggal_booking}
Status Saat Ini: {status_booking}

Selanjutnya, silakan menunggu proses verifikasi dari admin ZAVIRA.
Kami akan menghubungi Anda kembali apabila terdapat pembaruan status booking.
Terima kasih.
TEXT,

        'user_status_disetujui' => <<<'TEXT'
Halo {nama_user},
Selamat, booking Anda telah DISETUJUI oleh admin ZAVIRA.
Detail booking Anda:

Perumahan: {nama_perumahan}
Unit : {nama_unit}
Tanggal Booking: {tanggal_booking}
Status: Disetujui

Untuk menindaklanjuti proses pembelian rumah dengan skema KPR, Anda dimohon untuk membawa berkas persyaratan KPR dalam bentuk fisik ke kantor ZAVIRA.
Silakan datang ke kantor ZAVIRA dengan membawa berkas persyaratan KPR untuk proses verifikasi dan tindak lanjut administrasi.

Lokasi kantor ZAVIRA:
{link_maps_kantor}

Apabila ada pertanyaan lebih lanjut, silakan hubungi admin ZAVIRA.
Terima kasih.
TEXT,

        'user_status_ditolak' => <<<'TEXT'
Halo {nama_user},
Kami informasikan bahwa booking Anda untuk rumah di {nama_perumahan} unit {nama_unit} telah DITOLAK pada tahap verifikasi awal oleh admin ZAVIRA.
Mohon maaf, saat ini pengajuan booking Anda belum dapat dilanjutkan ke tahap berikutnya.
Apabila Anda ingin mengetahui informasi lebih lanjut, silakan hubungi admin ZAVIRA.
Terima kasih.
TEXT,

        'user_status_selesai' => <<<'TEXT'
Halo {nama_user},
Selamat, proses booking dan pengajuan KPR Anda untuk rumah di {nama_perumahan} unit {nama_unit} telah SELESAI diproses.
Proses di pihak bank telah selesai dan saat ini Anda sudah siap untuk masuk ke tahap akad.
Silakan menunggu informasi lanjutan dari admin ZAVIRA terkait jadwal dan proses akad.
Terima kasih.
TEXT,

        'user_status_dibatalkan' => <<<'TEXT'
Halo {nama_user},
Kami informasikan bahwa booking Anda untuk rumah di {nama_perumahan} unit {nama_unit} telah DIBATALKAN.
Pembatalan ini dilakukan karena pengajuan KPR Anda tidak disetujui oleh pihak bank, sehingga proses pembelian rumah belum dapat dilanjutkan.
Apabila Anda memerlukan informasi lebih lanjut, silakan hubungi admin ZAVIRA.
Terima kasih.
TEXT,

        'user_status_default' => <<<'TEXT'
Halo {nama_user},
Status booking Anda telah diperbarui.

Perumahan: {nama_perumahan}
Unit: {nama_unit}
Tanggal Booking: {tanggal_booking}
Status terbaru: {status_booking}

Silakan cek akun Anda untuk detail terbaru.
Terima kasih.
TEXT,

        'promo_broadcast' => <<<'TEXT'
Halo {nama_user},
Ada promo baru dari ZAVIRA.

Judul Promo: {judul_promo}
Properti: {nama_perumahan}
Periode: {periode_promo}
Detail: {deskripsi_promo}

Silakan cek website untuk informasi lengkap.
Terima kasih.
TEXT,
    ],
];
