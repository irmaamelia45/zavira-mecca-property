<?php

namespace Tests\Feature\Auth;

use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthRateLimitTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_is_rate_limited_after_too_many_failed_attempts(): void
    {
        $this->createRole('user');
        $user = User::query()->create([
            'id_role' => Role::query()->where('nama_role', 'user')->value('id_role'),
            'nama' => 'Tes Login',
            'email' => 'tes-login@gmail.com',
            'no_hp' => '6281111111111',
            'password_hash' => 'PasswordValid123',
            'alamat' => 'Alamat Tes',
            'is_active' => true,
        ]);

        for ($attempt = 1; $attempt <= 3; $attempt++) {
            $this->withServerVariables(['REMOTE_ADDR' => '127.0.0.10'])
                ->postJson('/api/auth/login', [
                    'email' => $user->email,
                    'password' => 'PasswordSalah123!',
                ])
                ->assertStatus(422);
        }

        $this->withServerVariables(['REMOTE_ADDR' => '127.0.0.10'])
            ->postJson('/api/auth/login', [
                'email' => $user->email,
                'password' => 'PasswordSalah123!',
            ])
            ->assertStatus(429)
            ->assertJson([
                'message' => 'Terlalu banyak percobaan login. Silakan tunggu sebentar lalu coba lagi.',
            ]);
    }

    public function test_register_is_rate_limited_after_too_many_attempts_from_the_same_ip(): void
    {
        $this->createRole('user');

        for ($attempt = 1; $attempt <= 3; $attempt++) {
            $this->withServerVariables(['REMOTE_ADDR' => '127.0.0.11'])
                ->postJson('/api/auth/register', [
                    'nama' => "User {$attempt}",
                    'email' => "register{$attempt}@gmail.com",
                    'no_hp' => '62822222222'.$attempt,
                    'password' => 'PasswordValid123!',
                    'password_confirmation' => 'PasswordValid123!',
                ])
                ->assertCreated();
        }

        $this->withServerVariables(['REMOTE_ADDR' => '127.0.0.11'])
            ->postJson('/api/auth/register', [
                'nama' => 'User 4',
                'email' => 'register4@gmail.com',
                'no_hp' => '628222222224',
                'password' => 'PasswordValid123!',
                'password_confirmation' => 'PasswordValid123!',
            ])
            ->assertStatus(429)
            ->assertJson([
                'message' => 'Terlalu banyak percobaan registrasi. Silakan tunggu sebentar lalu coba lagi.',
            ]);
    }

    private function createRole(string $name): Role
    {
        return Role::query()->firstOrCreate(
            ['nama_role' => $name],
            ['deskripsi' => ucfirst($name)]
        );
    }
}
