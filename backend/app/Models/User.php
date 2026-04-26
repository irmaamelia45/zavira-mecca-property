<?php

namespace App\Models;

use App\Support\PhoneNumber;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    protected $table = 'user';
    protected $primaryKey = 'id_user';
    protected $keyType = 'int';

    protected $fillable = [
        'id_role',
        'nama',
        'email',
        'no_hp',
        'password_hash',
        'alamat',
        'is_active',
    ];

    protected $hidden = [
        'password_hash',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'password_hash' => 'hashed',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    public function getAuthPassword(): string
    {
        return $this->password_hash;
    }

    public function sendPasswordResetNotification($token): void
    {
        $this->notify(new \App\Notifications\Auth\ResetPasswordNotification($token));
    }

    protected function noHp(): Attribute
    {
        return Attribute::make(
            set: function ($value) {
                $raw = (string) $value;
                $normalized = PhoneNumber::normalizePhone($raw);

                if ($normalized) {
                    return $normalized;
                }

                if (PhoneNumber::digitsOnly($raw) === '') {
                    return '';
                }

                throw new \InvalidArgumentException('Nomor HP tidak valid. Gunakan format 08xxxxxxxxxx.');
            }
        );
    }

    public function role()
    {
        return $this->belongsTo(Role::class, 'id_role', 'id_role');
    }

    public function bookings()
    {
        return $this->hasMany(Booking::class, 'id_user', 'id_user');
    }

    public function whatsappLogs()
    {
        return $this->hasMany(WhatsappNotifLog::class, 'id_user', 'id_user');
    }
}
