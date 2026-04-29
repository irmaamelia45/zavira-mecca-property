<?php

namespace Tests\Feature\Auth;

use App\Models\Role;
use App\Models\User;
use App\Support\PasswordPolicy;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AuthSecurityTest extends TestCase
{
    use RefreshDatabase;

    public function test_register_rejects_password_that_does_not_match_policy(): void
    {
        $this->createRole('user');

        $response = $this->postJson('/api/auth/register', [
            'nama' => 'Tes Pengguna',
            'email' => 'tes-policy@gmail.com',
            'no_hp' => '6281234567890',
            'password' => 'PasswordValid123',
            'password_confirmation' => 'PasswordValid123',
        ]);

        $response
            ->assertStatus(422)
            ->assertJsonValidationErrors(['password']);

        $this->assertSame(PasswordPolicy::message(), $response->json('errors.password.0'));
    }

    public function test_inactive_user_request_is_rejected_and_current_token_is_revoked(): void
    {
        $user = $this->createUser('user', 'inactive-token@gmail.com', '6281111111111');
        $newToken = $user->createToken('web');
        $tokenId = $newToken->accessToken->id;

        $user->update(['is_active' => false]);

        $response = $this->withHeader('Authorization', 'Bearer '.$newToken->plainTextToken)
            ->getJson('/api/auth/me');

        $response
            ->assertStatus(403)
            ->assertJson([
                'message' => 'Akun tidak aktif. Silakan hubungi admin.',
            ]);

        $this->assertDatabaseMissing('personal_access_tokens', [
            'id' => $tokenId,
        ]);
    }

    public function test_deactivating_marketing_user_revokes_all_tokens(): void
    {
        $superadmin = $this->createUser('superadmin', 'superadmin-token@gmail.com', '6282222222222');
        $marketing = $this->createUser('marketing', 'marketing-token@gmail.com', '6283333333333');
        $newToken = $marketing->createToken('marketing-web');

        Sanctum::actingAs($superadmin);

        $this->patchJson("/api/admin/users/marketing/{$marketing->id_user}/status", [
            'is_active' => false,
        ])->assertOk();

        $this->assertDatabaseMissing('personal_access_tokens', [
            'id' => $newToken->accessToken->id,
        ]);
    }

    private function createRole(string $name): Role
    {
        return Role::query()->firstOrCreate(
            ['nama_role' => $name],
            ['deskripsi' => ucfirst($name)]
        );
    }

    private function createUser(string $roleName, string $email, string $phone): User
    {
        $role = $this->createRole($roleName);

        return User::query()->create([
            'id_role' => $role->id_role,
            'nama' => ucfirst($roleName).' Test',
            'email' => $email,
            'no_hp' => $phone,
            'password_hash' => 'PasswordValid123!',
            'alamat' => 'Alamat Tes',
            'is_active' => true,
        ]);
    }
}
