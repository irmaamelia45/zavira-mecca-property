<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::middleware('guest')->group(function () {
    Route::get('/forgot-password', function () {
        return redirect()->away(rtrim((string) config('app.frontend_url'), '/').'/auth/forgot-password');
    })->name('password.request');

    Route::get('/reset-password/{token}', function (Request $request, string $token) {
        $query = http_build_query([
            'token' => $token,
            'email' => (string) $request->query('email', ''),
        ]);

        $target = rtrim((string) config('app.frontend_url'), '/').'/auth/reset-password';

        if ($query !== '') {
            $target .= '?'.$query;
        }

        return redirect()->away($target);
    })->name('password.reset');
});
