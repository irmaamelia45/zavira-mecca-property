<?php

namespace Database\Seeders;

use App\Models\Booking;
use App\Models\Perumahan;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class BookingDummySeeder extends Seeder
{
    /**
     * Seed dummy booking data for user account pages.
     */
    public function run(): void
    {
        if (! filter_var((string) env('ENABLE_DUMMY_SEEDERS', false), FILTER_VALIDATE_BOOLEAN)) {
            return;
        }

        $userRole = Role::query()->where('nama_role', 'user')->first();
        if (! $userRole) {
            return;
        }

        $user = User::query()->updateOrCreate(
            ['email' => 'user@zavira.test'],
            [
                'id_role' => $userRole->id_role,
                'nama' => 'User Demo',
                'no_hp' => '081234567891',
                'password_hash' => Hash::make('password'),
                'alamat' => 'Bandar Lampung',
                'is_active' => true,
            ]
        );

        $properties = Perumahan::query()->orderBy('id_perumahan')->limit(3)->get()->values();
        if ($properties->isEmpty()) {
            return;
        }

        $dummyBookings = [
            [
                'kode' => 'BK-DUMMY-001',
                'status' => 'Menunggu Konfirmasi',
                'days_ago' => 2,
                'catatan_user' => 'Ingin survey unit akhir pekan ini.',
                'catatan_admin' => null,
                'approved_at' => null,
                'finished_at' => null,
            ],
            [
                'kode' => 'BK-DUMMY-002',
                'status' => 'Disetujui',
                'days_ago' => 9,
                'catatan_user' => 'Mohon dibantu simulasi cicilan 15 tahun.',
                'catatan_admin' => 'Dokumen lengkap, lanjut proses akad.',
                'approved_at' => now()->subDays(8),
                'finished_at' => null,
            ],
            [
                'kode' => 'BK-DUMMY-003',
                'status' => 'Selesai',
                'days_ago' => 22,
                'catatan_user' => 'Terima kasih, proses sangat cepat.',
                'catatan_admin' => 'Booking selesai dan unit telah diproses.',
                'approved_at' => now()->subDays(20),
                'finished_at' => now()->subDays(15),
            ],
        ];

        foreach ($dummyBookings as $index => $item) {
            $property = $properties[$index % $properties->count()];

            Booking::query()->updateOrCreate(
                ['kode_booking' => $item['kode']],
                [
                    'id_user' => $user->id_user,
                    'id_perumahan' => $property->id_perumahan,
                    'tanggal_booking' => now()->subDays($item['days_ago']),
                    'status_booking' => $item['status'],
                    'catatan_user' => $item['catatan_user'],
                    'catatan_admin' => $item['catatan_admin'],
                    'approved_at' => $item['approved_at'],
                    'finished_at' => $item['finished_at'],
                ]
            );
        }
    }
}
