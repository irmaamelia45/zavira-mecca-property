<?php

namespace App\Services\Whatsapp;

use App\Support\PhoneNumber;
use Illuminate\Support\Facades\Http;

class FonnteClient
{
    public function isEnabled(): bool
    {
        return (bool) config('whatsapp.enabled', false);
    }

    public function normalizePhone(?string $phone): ?string
    {
        return PhoneNumber::normalizePhone($phone);
    }

    public function sendMessage(string $target, string $message): array
    {
        if (! $this->isEnabled()) {
            return [
                'ok' => false,
                'reason' => 'whatsapp_disabled',
                'response' => null,
                'http_status' => null,
            ];
        }

        $token = (string) config('services.fonnte.token');
        if ($token === '') {
            return [
                'ok' => false,
                'reason' => 'token_missing',
                'response' => null,
                'http_status' => null,
            ];
        }

        $baseUrl = rtrim((string) config('services.fonnte.base_url', 'https://api.fonnte.com'), '/');
        $timeout = (int) config('services.fonnte.timeout', 20);

        $response = Http::timeout($timeout)
            ->asForm()
            ->withHeaders([
                'Authorization' => $token,
            ])
            ->post($baseUrl.'/send', [
                'target' => $target,
                'message' => $message,
                'countryCode' => '62',
                'connectOnly' => (bool) config('services.fonnte.connect_only', true),
            ]);

        $payload = $response->json();
        if (! is_array($payload)) {
            $payload = ['raw' => $response->body()];
        }

        $status = $payload['status'] ?? $payload['Status'] ?? false;

        return [
            'ok' => $response->successful() && $status === true,
            'reason' => $payload['reason'] ?? null,
            'response' => $payload,
            'http_status' => $response->status(),
        ];
    }
}
