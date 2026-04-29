<?php

namespace Tests\Feature\Auth;

use App\Models\Role;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Laravel\Sanctum\PersonalAccessToken;
use Tests\TestCase;

class AuthTokenExpirationTest extends TestCase
{
    use RefreshDatabase;

    protected function tearDown(): void
    {
        Carbon::setTestNow();

        parent::tearDown();
    }

    public function test_login_issues_a_token_that_expires_in_sixty_minutes(): void
    {
        Carbon::setTestNow('2026-04-27 10:00:00');

        $role = Role::query()->create([
            'nama_role' => 'user',
            'deskripsi' => 'Pengguna umum',
        ]);

        $this->postJson('/api/auth/register', [
            'nama' => 'Tes Pengguna',
            'email' => 'tes-token@gmail.com',
            'no_hp' => '6281234567890',
            'password' => 'PasswordValid123!',
            'password_confirmation' => 'PasswordValid123!',
            'alamat' => 'Alamat Tes',
        ])->assertCreated();

        $response = $this->postJson('/api/auth/login', [
            'email' => 'tes-token@gmail.com',
            'password' => 'PasswordValid123!',
        ]);

        $response->assertOk();

        $tokenId = (int) $response->json('token_id');
        $token = PersonalAccessToken::query()->findOrFail($tokenId);

        $this->assertNotNull($token->expires_at);
        $this->assertSame(
            '2026-04-27 11:00:00',
            $token->expires_at->format('Y-m-d H:i:s')
        );
    }
}
