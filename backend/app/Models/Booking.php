<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Booking extends Model
{
    use HasFactory;

    protected $table = 'booking';
    protected $primaryKey = 'id_booking';
    protected $keyType = 'int';

    protected $fillable = [
        'id_user',
        'id_perumahan',
        'id_unit_perumahan',
        'kode_booking',
        'tanggal_booking',
        'status_booking',
        'catatan_user',
        'no_rekening',
        'range_harga_dp',
        'pekerjaan',
        'jenis_pekerjaan',
        'gaji_bulanan',
        'memiliki_angsuran_lain',
        'catatan_admin',
        'approved_at',
        'rejected_at',
        'canceled_at',
        'finished_at',
        'cancel_reason',
        'cancel_note',
    ];

    protected function casts(): array
    {
        return [
            'tanggal_booking' => 'datetime',
            'gaji_bulanan' => 'integer',
            'memiliki_angsuran_lain' => 'boolean',
            'approved_at' => 'datetime',
            'rejected_at' => 'datetime',
            'canceled_at' => 'datetime',
            'finished_at' => 'datetime',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'id_user', 'id_user');
    }

    public function perumahan()
    {
        return $this->belongsTo(Perumahan::class, 'id_perumahan', 'id_perumahan');
    }

    public function unitPerumahan()
    {
        return $this->belongsTo(PerumahanUnit::class, 'id_unit_perumahan', 'id_unit_perumahan');
    }

    public function documents()
    {
        return $this->hasMany(DocBooking::class, 'id_booking', 'id_booking');
    }

    public function whatsappLogs()
    {
        return $this->hasMany(WhatsappNotifLog::class, 'id_booking', 'id_booking');
    }
}
