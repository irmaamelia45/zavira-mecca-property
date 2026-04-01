<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RequireRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (! $user || ! $user->role) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $roleName = strtolower((string) $user->role->nama_role);
        $allowed = array_map(fn ($role) => strtolower(trim($role)), $roles);

        if (! in_array($roleName, $allowed, true)) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        return $next($request);
    }
}
