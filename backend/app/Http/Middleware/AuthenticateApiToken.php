<?php

namespace App\Http\Middleware;

use App\Models\UserApiToken;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AuthenticateApiToken
{
    public function handle(Request $request, Closure $next): Response
    {
        $bearerToken = $request->bearerToken();

        if (! $bearerToken) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $token = UserApiToken::query()
            ->where('token_hash', hash('sha256', $bearerToken))
            ->with('user.role')
            ->first();

        if (! $token || ! $token->user || ! $token->user->is_active) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        if ($token->expires_at && $token->expires_at->isPast()) {
            return response()->json(['message' => 'Token expired.'], 401);
        }

        $token->forceFill([
            'last_used_at' => now(),
            'ip_address' => $request->ip(),
            'user_agent' => substr((string) $request->userAgent(), 0, 255),
        ])->save();

        $request->attributes->set('api_token_id', $token->id_token);
        $request->setUserResolver(fn () => $token->user);
        auth()->setUser($token->user);

        return $next($request);
    }
}
