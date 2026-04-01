<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rules\Password;

class AdminUserController extends Controller
{
    private const PHONE_RULE = 'regex:/^(?:\\+62|62|0)8[0-9]{7,13}$/';

    public function indexMarketing(Request $request)
    {
        if (! $this->hasAllowedRole($request, ['admin', 'superadmin'])) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $users = User::query()
            ->with('role:id_role,nama_role')
            ->whereHas('role', fn ($query) => $query->where('nama_role', 'marketing'))
            ->orderByDesc('created_at')
            ->get();

        return response()->json(
            $users->map(fn (User $user) => $this->formatUser($user))->values()->all()
        );
    }

    public function indexAdmins(Request $request)
    {
        if (! $this->hasAllowedRole($request, ['superadmin'])) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $users = User::query()
            ->with('role:id_role,nama_role')
            ->whereHas('role', fn ($query) => $query->where('nama_role', 'admin'))
            ->orderByDesc('created_at')
            ->get();

        return response()->json(
            $users->map(fn (User $user) => $this->formatUser($user))->values()->all()
        );
    }

    public function storeMarketing(Request $request)
    {
        if (! $this->hasAllowedRole($request, ['admin', 'superadmin'])) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $validated = $request->validate([
            'nama' => 'required|string|max:100',
            'email' => 'required|email|max:120|unique:user,email',
            'no_hp' => ['required', 'string', 'min:10', 'max:20', self::PHONE_RULE, 'unique:user,no_hp'],
            'password' => ['required', 'confirmed', Password::min(8)],
            'alamat' => 'nullable|string|max:255',
            'is_active' => 'nullable|boolean',
        ]);

        $marketingRole = Role::query()->firstOrCreate(
            ['nama_role' => 'marketing'],
            ['deskripsi' => 'Tim marketing']
        );

        $user = User::create([
            'id_role' => $marketingRole->id_role,
            'nama' => $validated['nama'],
            'email' => $validated['email'],
            'no_hp' => $validated['no_hp'],
            'password_hash' => $validated['password'],
            'alamat' => $validated['alamat'] ?? null,
            'is_active' => $validated['is_active'] ?? true,
        ])->load('role:id_role,nama_role');

        return response()->json([
            'message' => 'Akun marketing berhasil dibuat.',
            'user' => $this->formatUser($user),
        ], 201);
    }

    public function storeAdmin(Request $request)
    {
        if (! $this->hasAllowedRole($request, ['superadmin'])) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $validated = $request->validate([
            'nama' => 'required|string|max:100',
            'email' => 'required|email|max:120|unique:user,email',
            'no_hp' => ['required', 'string', 'min:10', 'max:20', self::PHONE_RULE, 'unique:user,no_hp'],
            'password' => ['required', 'confirmed', Password::min(8)],
            'alamat' => 'nullable|string|max:255',
            'is_active' => 'nullable|boolean',
        ]);

        $adminRole = Role::query()->firstOrCreate(
            ['nama_role' => 'admin'],
            ['deskripsi' => 'Admin perumahan']
        );

        $user = User::create([
            'id_role' => $adminRole->id_role,
            'nama' => $validated['nama'],
            'email' => $validated['email'],
            'no_hp' => $validated['no_hp'],
            'password_hash' => $validated['password'],
            'alamat' => $validated['alamat'] ?? null,
            'is_active' => $validated['is_active'] ?? true,
        ])->load('role:id_role,nama_role');

        return response()->json([
            'message' => 'Akun Admin Perumahan berhasil dibuat.',
            'user' => $this->formatUser($user),
        ], 201);
    }

    public function destroyMarketing(Request $request, $id)
    {
        if (! $this->hasAllowedRole($request, ['admin', 'superadmin'])) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $user = User::query()
            ->with('role:id_role,nama_role')
            ->find($id);

        if (! $user || ($user->role?->nama_role !== 'marketing')) {
            return response()->json(['message' => 'Akun marketing tidak ditemukan.'], 404);
        }

        if ($user->bookings()->exists()) {
            return response()->json([
                'message' => 'Akun marketing tidak dapat dihapus karena masih memiliki relasi booking.',
            ], 422);
        }

        if ($user->whatsappLogs()->exists()) {
            return response()->json([
                'message' => 'Akun marketing tidak dapat dihapus karena masih memiliki riwayat aktivitas.',
            ], 422);
        }

        if ((int) $user->id_user === (int) $request->user()?->id_user) {
            return response()->json([
                'message' => 'Anda tidak dapat menghapus akun Anda sendiri.',
            ], 422);
        }

        $user->delete();

        return response()->json(['message' => 'Akun marketing berhasil dihapus.']);
    }

    public function destroyAdmin(Request $request, $id)
    {
        if (! $this->hasAllowedRole($request, ['superadmin'])) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $user = User::query()
            ->with('role:id_role,nama_role')
            ->find($id);

        if (! $user || ($user->role?->nama_role !== 'admin')) {
            return response()->json(['message' => 'Akun Admin Perumahan tidak ditemukan.'], 404);
        }

        if ((int) $user->id_user === (int) $request->user()?->id_user) {
            return response()->json([
                'message' => 'Anda tidak dapat menghapus akun Anda sendiri.',
            ], 422);
        }

        if ($user->bookings()->exists()) {
            return response()->json([
                'message' => 'Akun Admin Perumahan tidak dapat dihapus karena masih memiliki relasi booking.',
            ], 422);
        }

        if ($user->whatsappLogs()->exists()) {
            return response()->json([
                'message' => 'Akun Admin Perumahan tidak dapat dihapus karena masih memiliki riwayat aktivitas.',
            ], 422);
        }

        $user->delete();

        return response()->json(['message' => 'Akun Admin Perumahan berhasil dihapus.']);
    }

    private function formatUser(User $user): array
    {
        return [
            'id' => $user->id_user,
            'nama' => $user->nama,
            'email' => $user->email,
            'no_hp' => $user->no_hp,
            'alamat' => $user->alamat,
            'is_active' => (bool) $user->is_active,
            'role' => $user->role?->nama_role ?? '',
            'created_at' => optional($user->created_at)->toDateTimeString(),
            'updated_at' => optional($user->updated_at)->toDateTimeString(),
        ];
    }

    private function hasAllowedRole(Request $request, array $allowedRoles): bool
    {
        $role = strtolower((string) optional($request->user()?->role)->nama_role);
        return in_array($role, array_map('strtolower', $allowedRoles), true);
    }
}
