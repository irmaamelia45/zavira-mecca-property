<?php

namespace Database\Seeders;

use App\Models\Role;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $roles = [
            ['nama_role' => 'user', 'deskripsi' => 'Pengguna aplikasi'],
            ['nama_role' => 'marketing', 'deskripsi' => 'Tim marketing'],
            ['nama_role' => 'admin', 'deskripsi' => 'Admin perumahan'],
            ['nama_role' => 'superadmin', 'deskripsi' => 'Administrator utama'],
        ];

        foreach ($roles as $role) {
            Role::updateOrCreate(
                ['nama_role' => $role['nama_role']],
                ['deskripsi' => $role['deskripsi']]
            );
        }
    }
}
