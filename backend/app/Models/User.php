<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
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
    protected $rememberTokenName = null;

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
