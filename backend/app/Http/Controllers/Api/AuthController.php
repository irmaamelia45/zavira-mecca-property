<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\User;
use App\Models\UserApiToken;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class AuthController extends Controller
{
    private const GMAIL_RULE = 'regex:/^[A-Za-z0-9._%+-]+@gmail\\.com$/i';
    private const PHONE_RULE = 'regex:/^628[0-9]{7,13}$/';

    public function register(Request $request)
    {
        $request->merge([
            'no_hp' => $this->normalizePhone62((string) $request->input('no_hp')),
        ]);

        $validated = $request->validate([
            'nama' => 'required|string|max:100',
            'email' => ['required', 'email', 'max:120', self::GMAIL_RULE, 'unique:user,email'],
            'no_hp' => ['required', 'string', 'min:10', 'max:20', self::PHONE_RULE, 'unique:user,no_hp'],
            'password' => ['required', 'confirmed', Password::min(8)],
            'alamat' => 'nullable|string|max:255',
            'device_name' => 'nullable|string|max:100',
        ], [
            'email.regex' => 'Email harus menggunakan domain @gmail.com.',
            'no_hp.regex' => 'Nomor HP harus menggunakan format 62xxxx.',
        ]);

        $userRole = Role::query()->where('nama_role', 'user')->first();
        if (! $userRole) {
            return response()->json(['message' => 'Role user belum tersedia. Jalankan seeder role.'], 500);
        }

        $user = User::create([
            'id_role' => $userRole->id_role,
            'nama' => $validated['nama'],
            'email' => $validated['email'],
            'no_hp' => $validated['no_hp'],
            'password_hash' => $validated['password'],
            'alamat' => $validated['alamat'] ?? null,
            'is_active' => true,
        ]);

        [$plainToken, $tokenModel] = $this->issueToken($user, $request, $validated['device_name'] ?? 'web');

        return response()->json([
            'message' => 'Registrasi berhasil.',
            'token' => $plainToken,
            'user' => $this->formatUser($user),
            'token_id' => $tokenModel->id_token,
        ], 201);
    }

    public function login(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
            'device_name' => 'nullable|string|max:100',
        ]);

        $user = User::query()->with('role')->where('email', $validated['email'])->first();

        if (! $user || ! Hash::check($validated['password'], $user->password_hash)) {
            return response()->json(['message' => 'Email atau password salah.'], 422);
        }

        if (! $user->is_active) {
            return response()->json(['message' => 'Akun tidak aktif.'], 403);
        }

        [$plainToken, $tokenModel] = $this->issueToken($user, $request, $validated['device_name'] ?? 'web');

        return response()->json([
            'message' => 'Login berhasil.',
            'token' => $plainToken,
            'user' => $this->formatUser($user),
            'token_id' => $tokenModel->id_token,
        ]);
    }

    public function me(Request $request)
    {
        return response()->json([
            'user' => $this->formatUser($request->user()),
        ]);
    }

    public function logout(Request $request)
    {
        $tokenId = $request->attributes->get('api_token_id');

        if ($tokenId) {
            UserApiToken::query()->where('id_token', $tokenId)->delete();
        }

        return response()->json(['message' => 'Logout berhasil.']);
    }

    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $request->merge([
            'no_hp' => $this->normalizePhone62((string) $request->input('no_hp')),
        ]);

        $validated = $request->validate([
            'nama' => 'required|string|max:100',
            'email' => ['required', 'email', 'max:120', self::GMAIL_RULE, 'unique:user,email,'.$user->id_user.',id_user'],
            'no_hp' => ['required', 'string', 'min:10', 'max:20', self::PHONE_RULE, 'unique:user,no_hp,'.$user->id_user.',id_user'],
            'alamat' => 'nullable|string|max:255',
        ], [
            'email.regex' => 'Email harus menggunakan domain @gmail.com.',
            'no_hp.regex' => 'Nomor HP harus menggunakan format 62xxxx.',
        ]);

        $user->update($validated);

        return response()->json([
            'message' => 'Profil berhasil diperbarui.',
            'user' => $this->formatUser($user->fresh('role')),
        ]);
    }

    public function updatePassword(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'current_password' => 'required|string',
            'new_password' => ['required', 'confirmed', Password::min(8)],
        ]);

        if (! Hash::check($validated['current_password'], $user->password_hash)) {
            return response()->json(['message' => 'Password saat ini tidak sesuai.'], 422);
        }

        $user->update([
            'password_hash' => $validated['new_password'],
        ]);

        UserApiToken::query()
            ->where('id_user', $user->id_user)
            ->where('id_token', '!=', $request->attributes->get('api_token_id'))
            ->delete();

        return response()->json(['message' => 'Password berhasil diubah.']);
    }

    private function issueToken(User $user, Request $request, string $deviceName): array
    {
        $plainToken = bin2hex(random_bytes(40));

        $tokenModel = UserApiToken::create([
            'id_user' => $user->id_user,
            'token_hash' => hash('sha256', $plainToken),
            'device_name' => $deviceName,
            'ip_address' => $request->ip(),
            'user_agent' => substr((string) $request->userAgent(), 0, 255),
            'last_used_at' => now(),
            'expires_at' => now()->addDays(30),
            'created_at' => now(),
        ]);

        return [$plainToken, $tokenModel];
    }

    private function formatUser(?User $user): array
    {
        if (! $user) {
            return [];
        }

        $role = $user->relationLoaded('role') ? $user->role : $user->role()->first();

        return [
            'id' => $user->id_user,
            'nama' => $user->nama,
            'email' => $user->email,
            'no_hp' => $user->no_hp,
            'alamat' => $user->alamat,
            'is_active' => (bool) $user->is_active,
            'role' => $role?->nama_role ?? 'user',
        ];
    }

    private function normalizePhone62(string $phone): string
    {
        $digits = preg_replace('/\D+/', '', $phone) ?? '';
        if ($digits === '') {
            return '';
        }

        $digits = preg_replace('/^00+/', '', $digits) ?? $digits;

        if (str_starts_with($digits, '62')) {
            $localPart = preg_replace('/^0+/', '', substr($digits, 2)) ?? substr($digits, 2);
            return '62'.$localPart;
        }

        if (str_starts_with($digits, '0')) {
            $localPart = preg_replace('/^0+/', '', $digits) ?? $digits;
            return '62'.$localPart;
        }

        if (str_starts_with($digits, '8')) {
            return '62'.$digits;
        }

        return '62'.preg_replace('/^62/', '', $digits);
    }
}
