<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Perumahan extends Model
{
    use HasFactory;

    protected $table = 'perumahan';
    protected $primaryKey = 'id_perumahan';
    protected $keyType = 'int';

    protected $fillable = [
        'nama_perumahan',
        'lokasi',
        'alamat_lengkap',
        'kota',
        'gmaps_url',
        'deskripsi',
        'fasilitas',
        'harga',
        'tipe_unit',
        'kategori',
        'luas_tanah',
        'luas_bangunan',
        'jumlah_kamar_tidur',
        'jumlah_kamar_mandi',
        'jumlah_seluruh_unit',
        'jumlah_unit_tersedia',
        'status_aktif',
        'status_label',
        'nama_marketing',
        'whatsapp_marketing',
    ];

    protected function casts(): array
    {
        return [
            'harga' => 'decimal:2',
            'luas_tanah' => 'decimal:2',
            'luas_bangunan' => 'decimal:2',
            'jumlah_kamar_tidur' => 'integer',
            'jumlah_kamar_mandi' => 'integer',
            'status_aktif' => 'boolean',
        ];
    }

    public function media()
    {
        return $this->hasMany(PerumahanMedia::class, 'id_perumahan', 'id_perumahan');
    }

    public function promos()
    {
        return $this->belongsToMany(Promo::class, 'perumahan_promo', 'id_perumahan', 'id_promo');
    }

    public function promosAktif($date = null)
    {
        $date = $date ?: now()->toDateString();

        return $this->promos()->activeOn($date);
    }

    public function bookings()
    {
        return $this->hasMany(Booking::class, 'id_perumahan', 'id_perumahan');
    }
}
