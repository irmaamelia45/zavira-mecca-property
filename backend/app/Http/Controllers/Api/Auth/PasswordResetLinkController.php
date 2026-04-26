<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\SendPasswordResetLinkRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Password;
use Symfony\Component\Mailer\Exception\TransportExceptionInterface;
use Throwable;

class PasswordResetLinkController extends Controller
{
    private const GENERIC_SUCCESS_MESSAGE = 'Jika email terdaftar, tautan reset password akan dikirim ke alamat tersebut.';

    public function store(SendPasswordResetLinkRequest $request): JsonResponse
    {
        try {
            $status = Password::broker()->sendResetLink($request->safe()->only('email'));
        } catch (TransportExceptionInterface $exception) {
            Log::error('Password reset email failed to send.', [
                'email' => $request->string('email')->toString(),
                'error' => $exception->getMessage(),
            ]);

            return response()->json([
                'message' => 'Email reset password gagal dikirim. Periksa konfigurasi SMTP Anda lalu coba lagi.',
            ], 500);
        } catch (Throwable $exception) {
            Log::error('Password reset request failed.', [
                'email' => $request->string('email')->toString(),
                'error' => $exception->getMessage(),
            ]);

            return response()->json([
                'message' => 'Permintaan reset password sedang mengalami kendala. Silakan coba lagi beberapa saat lagi.',
            ], 500);
        }

        return match ($status) {
            Password::RESET_LINK_SENT,
            Password::INVALID_USER => response()->json([
                'message' => self::GENERIC_SUCCESS_MESSAGE,
            ]),
            Password::RESET_THROTTLED => response()->json([
                'message' => 'Permintaan reset password terlalu sering. Silakan tunggu sebentar lalu coba lagi.',
            ], 429),
            default => response()->json([
                'message' => 'Permintaan reset password tidak dapat diproses saat ini.',
            ], 422),
        };
    }
}
