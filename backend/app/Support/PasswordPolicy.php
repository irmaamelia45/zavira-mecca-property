<?php

namespace App\Support;

class PasswordPolicy
{
    public const MESSAGE = 'Password minimal 8 karakter dan wajib memuat huruf kapital, huruf kecil, angka, dan simbol.';

    public static function isValid(mixed $value): bool
    {
        if (! is_string($value)) {
            return false;
        }

        return strlen($value) >= 8
            && preg_match('/[A-Z]/', $value) === 1
            && preg_match('/[a-z]/', $value) === 1
            && preg_match('/[0-9]/', $value) === 1
            && preg_match('/[^A-Za-z0-9]/', $value) === 1;
    }

    public static function message(): string
    {
        return self::MESSAGE;
    }
}
