<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PerumahanUnit extends Model
{
    use HasFactory;

    protected $table = 'perumahan_unit';
    protected $primaryKey = 'id_unit_perumahan';
    protected $keyType = 'int';

    protected $fillable = [
        'id_perumahan',
        'nama_blok',
        'kode_blok',
        'nomor_unit',
        'kode_unit',
        'status_unit',
        'sales_mode',
        'estimated_completion_date',
        'id_booking_terakhir',
    ];

    protected function casts(): array
    {
        return [
            'estimated_completion_date' => 'date',
        ];
    }

    public function perumahan()
    {
        return $this->belongsTo(Perumahan::class, 'id_perumahan', 'id_perumahan');
    }

    public function bookingTerakhir()
    {
        return $this->belongsTo(Booking::class, 'id_booking_terakhir', 'id_booking');
    }

    public function bookings()
    {
        return $this->hasMany(Booking::class, 'id_unit_perumahan', 'id_unit_perumahan');
    }
}
