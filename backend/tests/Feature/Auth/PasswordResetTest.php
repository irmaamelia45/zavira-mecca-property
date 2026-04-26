<?php

namespace Tests\Feature\Auth;

use App\Models\Role;
use App\Models\User;
use App\Notifications\Auth\ResetPasswordNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Tests\TestCase;

class PasswordResetTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_sends_a_reset_link_for_a_registered_email(): void
    {
        Notification::fake();

        $user = $this->createUser();

        $response = $this->postJson('/api/auth/forgot-password', [
            'email' => $user->email,
        ]);

        $response
            ->assertOk()
            ->assertJson([
                'message' => 'Jika email terdaftar, tautan reset password akan dikirim ke alamat tersebut.',
            ]);

        Notification::assertSentTo($user, ResetPasswordNotification::class);
    }

    public function test_it_returns_a_generic_message_for_an_unknown_email(): void
    {
        Notification::fake();

        $response = $this->postJson('/api/auth/forgot-password', [
            'email' => 'unknown@example.com',
        ]);

        $response
            ->assertOk()
            ->assertJson([
                'message' => 'Jika email terdaftar, tautan reset password akan dikirim ke alamat tersebut.',
            ]);

        Notification::assertNothingSent();
    }

    public function test_it_resets_password_and_revokes_existing_api_tokens(): void
    {
        $user = $this->createUser();

        $user->createToken('existing-device');

        $token = Password::broker()->createToken($user);

        $response = $this->postJson('/api/auth/reset-password', [
            'token' => $token,
            'email' => $user->email,
            'password' => 'PasswordBaru123',
            'password_confirmation' => 'PasswordBaru123',
        ]);

        $response
            ->assertOk()
            ->assertJson([
                'message' => 'Password berhasil diperbarui. Silakan login menggunakan password baru Anda.',
            ]);

        $this->assertTrue(password_verify('PasswordBaru123', $user->fresh()->password_hash));
        $this->assertNotNull($user->fresh()->remember_token);
        $this->assertDatabaseEmpty('personal_access_tokens');
    }

    public function test_it_rejects_an_invalid_reset_token(): void
    {
        $user = $this->createUser();

        $response = $this->postJson('/api/auth/reset-password', [
            'token' => 'token-yang-tidak-valid',
            'email' => $user->email,
            'password' => 'PasswordBaru123',
            'password_confirmation' => 'PasswordBaru123',
        ]);

        $response
            ->assertStatus(422)
            ->assertJson([
                'message' => 'Tautan reset password tidak valid atau sudah kedaluwarsa.',
            ]);
    }

    private function createUser(): User
    {
        $role = Role::query()->create([
            'nama_role' => 'user',
            'deskripsi' => 'Pengguna umum',
        ]);

        return User::query()->create([
            'id_role' => $role->id_role,
            'nama' => 'Tes Pengguna',
            'email' => 'tes@example.com',
            'no_hp' => '6281234567890',
            'password_hash' => 'PasswordLama123',
            'alamat' => 'Alamat Tes',
            'is_active' => true,
        ]);
    }
}
