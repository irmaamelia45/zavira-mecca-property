<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;

class SuperadminSeeder extends Seeder
{
    /**
     * Seed a default superadmin account.
     */
    public function run(): void
    {
        $superadminRole = Role::query()->firstOrCreate(
            ['nama_role' => 'superadmin'],
            ['deskripsi' => 'Administrator utama']
        );

        $targetEmail = (string) env('SUPERADMIN_EMAIL', 'superadmin@example.com');
        $targetPhone = (string) env('SUPERADMIN_PHONE', '6281234567890');
        $targetName = (string) env('SUPERADMIN_NAME', 'Super Admin');
        $targetPassword = (string) env('SUPERADMIN_PASSWORD', 'ChangeMe123!');
        $targetAddress = (string) env('SUPERADMIN_ADDRESS', 'Kantor Zavira Mecca');

        $user = User::query()->where('email', $targetEmail)->first();

        if ($user) {
            $user->update([
                'id_role' => $superadminRole->id_role,
                'nama' => $targetName,
                'email' => $targetEmail,
                'no_hp' => $targetPhone,
                'password_hash' => $targetPassword,
                'alamat' => $targetAddress,
                'is_active' => true,
            ]);

            return;
        }

        $safePhone = $this->resolveUniquePhone($targetPhone);

        User::query()->create([
            'id_role' => $superadminRole->id_role,
            'nama' => $targetName,
            'email' => $targetEmail,
            'no_hp' => $safePhone,
            'password_hash' => $targetPassword,
            'alamat' => $targetAddress,
            'is_active' => true,
        ]);
    }

    private function resolveUniquePhone(string $preferredPhone): string
    {
        $candidate = $preferredPhone;

        if (! User::query()->where('no_hp', $candidate)->exists()) {
            return $candidate;
        }

        $digits = preg_replace('/\D+/', '', $preferredPhone) ?: '6281234567890';
        $prefix = substr($digits, 0, max(strlen($digits) - 3, 1));

        for ($i = 1; $i <= 999; $i++) {
            $candidate = $prefix . str_pad((string) $i, 3, '0', STR_PAD_LEFT);
            if (strlen($candidate) < 10 || strlen($candidate) > 20) {
                continue;
            }

            if (! User::query()->where('no_hp', $candidate)->exists()) {
                return $candidate;
            }
        }

        return '081' . (string) random_int(10000000, 99999999);
    }
}
