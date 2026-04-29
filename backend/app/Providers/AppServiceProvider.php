<?php

namespace App\Providers;

use Closure;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureRateLimiting();
    }

    private function configureRateLimiting(): void
    {
        RateLimiter::for('public-read', function (Request $request): array {
            $ip = (string) $request->ip();

            return [
                Limit::perMinute(180)
                    ->by($ip)
                    ->response($this->throttleResponse(
                        'Terlalu banyak permintaan. Silakan tunggu sebentar lalu coba lagi.'
                    )),
                Limit::perHour(2000)
                    ->by($ip)
                    ->response($this->throttleResponse(
                        'Permintaan publik dari jaringan ini terlalu sering. Silakan coba lagi nanti.'
                    )),
            ];
        });

        RateLimiter::for('auth-login', function (Request $request): array {
            $email = Str::lower((string) $request->input('email'));
            $emailKey = $email !== '' ? $email.'|'.$request->ip() : (string) $request->ip();

            return [
                Limit::perMinute(3)
                    ->by($emailKey)
                    ->response($this->throttleResponse(
                        'Terlalu banyak percobaan login. Silakan tunggu sebentar lalu coba lagi.'
                    )),
                Limit::perMinute(20)
                    ->by((string) $request->ip())
                    ->response($this->throttleResponse(
                        'Terlalu banyak percobaan login dari jaringan ini. Silakan tunggu sebentar lalu coba lagi.'
                    )),
            ];
        });

        RateLimiter::for('auth-register', function (Request $request): array {
            $email = Str::lower((string) $request->input('email'));
            $emailKey = $email !== '' ? $email.'|'.$request->ip() : (string) $request->ip();

            return [
                Limit::perMinute(3)
                    ->by((string) $request->ip())
                    ->response($this->throttleResponse(
                        'Terlalu banyak percobaan registrasi. Silakan tunggu sebentar lalu coba lagi.'
                    )),
                Limit::perHour(10)
                    ->by($emailKey)
                    ->response($this->throttleResponse(
                        'Permintaan registrasi untuk email ini terlalu sering. Silakan tunggu lalu coba lagi.'
                    )),
            ];
        });

        RateLimiter::for('booking-upload', function (Request $request): array {
            $userId = $request->user()?->getAuthIdentifier();
            $key = $userId ? 'user:'.$userId : 'ip:'.$request->ip();

            return [
                Limit::perMinute(5)
                    ->by($key)
                    ->response($this->throttleResponse(
                        'Terlalu banyak permintaan booking. Silakan tunggu sebentar lalu coba lagi.'
                    )),
                Limit::perHour(30)
                    ->by($key)
                    ->response($this->throttleResponse(
                        'Permintaan booking dari akun ini terlalu sering. Silakan coba lagi nanti.'
                    )),
            ];
        });
    }

    private function throttleResponse(string $message): Closure
    {
        return fn (Request $request, array $headers) => response()->json([
            'message' => $message,
        ], 429, $headers);
    }
}
