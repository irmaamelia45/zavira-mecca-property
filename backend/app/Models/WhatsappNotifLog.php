<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WhatsappNotifLog extends Model
{
    use HasFactory;

    protected $table = 'whatsapp_notif_log';
    protected $primaryKey = 'id_wa_log';
    protected $keyType = 'int';
    public $timestamps = false;

    protected $fillable = [
        'id_booking',
        'id_user',
        'tujuan_no_hp',
        'event',
        'status_booking_at_send',
        'isi_pesan',
        'provider',
        'status_kirim',
        'response_raw',
        'sent_at',
    ];

    protected function casts(): array
    {
        return [
            'sent_at' => 'datetime',
        ];
    }

    public function booking()
    {
        return $this->belongsTo(Booking::class, 'id_booking', 'id_booking');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'id_user', 'id_user');
    }
}
