<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use App\Support\PhoneNumber;
use App\Support\PasswordPolicy;
use Illuminate\Database\Seeder;
use RuntimeException;

class SuperadminSeeder extends Seeder
{
    private const BLOCKED_PASSWORD_HASHES = [
        '9a4aabf0e5cf71cae2cea646613ce7e2a5919fa758e56819704be25a3a2c1f0b',
    ];

    /**
     * Seed a default superadmin account.
     */
    public function run(): void
    {
        $superadminRole = Role::query()->firstOrCreate(
            ['nama_role' => 'superadmin'],
            ['deskripsi' => 'Administrator utama']
        );

        $targetEmail = trim((string) config('superadmin.email', ''));
        $targetPhone = PhoneNumber::normalizePhone((string) config('superadmin.phone', ''));
        $targetName = trim((string) config('superadmin.name', 'Super Admin'));
        $targetPassword = (string) config('superadmin.password', '');
        $targetAddress = trim((string) config('superadmin.address', ''));

        $this->assertSuperadminConfigIsSafe($targetEmail, $targetPhone, $targetPassword);
        $this->assertSuperadminPhoneIsAvailable($targetEmail, $targetPhone);

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

        User::query()->create([
            'id_role' => $superadminRole->id_role,
            'nama' => $targetName,
            'email' => $targetEmail,
            'no_hp' => $targetPhone,
            'password_hash' => $targetPassword,
            'alamat' => $targetAddress,
            'is_active' => true,
        ]);
    }

    private function assertSuperadminConfigIsSafe(string $email, ?string $phone, string $password): void
    {
        $errors = [];

        if ($email === '' || ! filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $errors[] = 'SUPERADMIN_EMAIL wajib diisi dengan alamat email valid.';
        }

        if (! $phone) {
            $errors[] = 'SUPERADMIN_PHONE wajib diisi dengan nomor HP valid.';
        }

        if (trim($password) === '') {
            $errors[] = 'SUPERADMIN_PASSWORD wajib diisi.';
        } elseif (in_array(hash('sha256', $password), self::BLOCKED_PASSWORD_HASHES, true)) {
            $errors[] = 'SUPERADMIN_PASSWORD masih memakai nilai contoh/default dan tidak boleh digunakan.';
        } elseif (! PasswordPolicy::isValid($password)) {
            $errors[] = PasswordPolicy::message();
        }

        if (! empty($errors)) {
            throw new RuntimeException(
                'Seeder superadmin dibatalkan: '.implode(' ', $errors)
                .' Atur SUPERADMIN_EMAIL, SUPERADMIN_PHONE, dan SUPERADMIN_PASSWORD di file .env sebelum menjalankan seeder.'
            );
        }
    }

    private function assertSuperadminPhoneIsAvailable(string $email, string $phone): void
    {
        $existingPhoneOwner = User::query()
            ->where('no_hp', $phone)
            ->where('email', '!=', $email)
            ->first(['id_user', 'email']);

        if ($existingPhoneOwner) {
            throw new RuntimeException(
                'Seeder superadmin dibatalkan: SUPERADMIN_PHONE sudah dipakai oleh akun lain.'
                .' Gunakan nomor superadmin yang unik di file .env.'
            );
        }
    }
}
