<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call(RoleSeeder::class);
        $this->call(PromoDummySeeder::class);

        $superadminRole = Role::query()->where('nama_role', 'superadmin')->first();
        if (! $superadminRole) {
            return;
        }

        User::updateOrCreate(
            ['email' => 'admin@zavira.test'],
            [
                'id_role' => $superadminRole->id_role,
                'nama' => 'Super Admin',
                'no_hp' => '081234567890',
                'password_hash' => Hash::make('password'),
                'alamat' => 'Kantor Zavira Mecca',
                'is_active' => true,
            ]
        );
    }
}
