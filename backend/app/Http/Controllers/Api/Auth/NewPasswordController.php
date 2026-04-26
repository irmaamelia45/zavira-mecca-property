<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ResetPasswordRequest;
use App\Models\User;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;

class NewPasswordController extends Controller
{
    public function store(ResetPasswordRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $status = Password::broker()->reset(
            $validated,
            function (User $user, string $password): void {
                $user->forceFill([
                    'password_hash' => $password,
                ]);

                $user->setRememberToken(Str::random(60));
                $user->save();

                // Revoke every active API token so the new password becomes the only valid path back in.
                $user->tokens()->delete();

                event(new PasswordReset($user));
            }
        );

        return match ($status) {
            Password::PASSWORD_RESET => response()->json([
                'message' => 'Password berhasil diperbarui. Silakan login menggunakan password baru Anda.',
            ]),
            Password::INVALID_TOKEN => response()->json([
                'message' => 'Tautan reset password tidak valid atau sudah kedaluwarsa.',
            ], 422),
            Password::INVALID_USER => response()->json([
                'message' => 'Permintaan reset password tidak valid.',
            ], 422),
            default => response()->json([
                'message' => 'Password gagal diperbarui. Silakan coba lagi.',
            ], 422),
        };
    }
}
