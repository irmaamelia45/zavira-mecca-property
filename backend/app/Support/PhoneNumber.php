<?php

namespace App\Support;

class PhoneNumber
{
    private const CANONICAL_PATTERN = '/^628[0-9]{7,13}$/';

    public static function digitsOnly(?string $input): string
    {
        return preg_replace('/\D+/', '', (string) $input) ?? '';
    }

    public static function normalizePhone(?string $input): ?string
    {
        $digits = self::digitsOnly($input);
        if ($digits === '') {
            return null;
        }

        $digits = preg_replace('/^00+/', '', $digits) ?? $digits;

        if (str_starts_with($digits, '62')) {
            $localPart = substr($digits, 2);
        } elseif (str_starts_with($digits, '0')) {
            $localPart = preg_replace('/^0+/', '', $digits) ?? '';
        } elseif (str_starts_with($digits, '8')) {
            $localPart = $digits;
        } else {
            return null;
        }

        $localPart = preg_replace('/^0+/', '', (string) $localPart) ?? '';
        if (! str_starts_with($localPart, '8')) {
            return null;
        }

        $canonical = '62'.$localPart;
        if (! preg_match(self::CANONICAL_PATTERN, $canonical)) {
            return null;
        }

        return $canonical;
    }

    public static function formatPhoneForDisplay(?string $canonical): ?string
    {
        $normalized = self::normalizePhone($canonical);
        if (! $normalized) {
            return null;
        }

        return '0'.substr($normalized, 2);
    }

    public static function isCanonical(?string $value): bool
    {
        return preg_match(self::CANONICAL_PATTERN, (string) $value) === 1;
    }
}
