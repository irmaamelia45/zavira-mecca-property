<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\User;
use App\Support\PhoneNumber;
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
            'no_hp' => $this->normalizePhoneForValidation($request->input('no_hp')),
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
            'no_hp.required' => 'Nomor HP wajib diisi.',
            'no_hp.regex' => 'Nomor HP tidak valid. Gunakan format 08xxxxxxxxxx.',
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

        $newToken = $user->createToken(
            $validated['device_name'] ?? 'web',
            ['*'],
            now()->addDays(30)
        );

        return response()->json([
            'message' => 'Registrasi berhasil.',
            'token' => $newToken->plainTextToken,
            'user' => $this->formatUser($user),
            'token_id' => $newToken->accessToken->id,
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

        $newToken = $user->createToken(
            $validated['device_name'] ?? 'web',
            ['*'],
            now()->addDays(30)
        );

        return response()->json([
            'message' => 'Login berhasil.',
            'token' => $newToken->plainTextToken,
            'user' => $this->formatUser($user),
            'token_id' => $newToken->accessToken->id,
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
        $request->user()?->currentAccessToken()?->delete();

        return response()->json(['message' => 'Logout berhasil.']);
    }

    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $request->merge([
            'no_hp' => $this->normalizePhoneForValidation($request->input('no_hp')),
        ]);

        $validated = $request->validate([
            'nama' => 'required|string|max:100',
            'email' => ['required', 'email', 'max:120', self::GMAIL_RULE, 'unique:user,email,'.$user->id_user.',id_user'],
            'no_hp' => ['required', 'string', 'min:10', 'max:20', self::PHONE_RULE, 'unique:user,no_hp,'.$user->id_user.',id_user'],
            'alamat' => 'nullable|string|max:255',
        ], [
            'email.regex' => 'Email harus menggunakan domain @gmail.com.',
            'no_hp.required' => 'Nomor HP wajib diisi.',
            'no_hp.regex' => 'Nomor HP tidak valid. Gunakan format 08xxxxxxxxxx.',
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

        $currentTokenId = $request->user()?->currentAccessToken()?->id;

        $user->tokens()
            ->when($currentTokenId, fn ($query) => $query->where('id', '!=', $currentTokenId))
            ->delete();

        return response()->json(['message' => 'Password berhasil diubah.']);
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

    private function normalizePhoneForValidation(mixed $input): string
    {
        $raw = is_string($input) ? $input : '';
        $normalized = PhoneNumber::normalizePhone($raw);

        if ($normalized) {
            return $normalized;
        }

        return PhoneNumber::digitsOnly($raw);
    }
}
