<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsActive
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user || (bool) $user->is_active) {
            return $next($request);
        }

        $currentToken = $user->currentAccessToken();
        if ($currentToken && method_exists($currentToken, 'delete')) {
            $currentToken->delete();
        }

        return response()->json([
            'message' => 'Akun tidak aktif. Silakan hubungi admin.',
        ], 403);
    }
}
