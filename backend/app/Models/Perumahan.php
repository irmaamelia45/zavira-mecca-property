<?php

namespace App\Models;

use App\Support\PhoneNumber;
use Illuminate\Database\Eloquent\Casts\Attribute;
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
        'suku_bunga_kpr',
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
        'id_marketing_user',
        'nama_marketing',
        'whatsapp_marketing',
        'no_rekening_utj',
        'nama_bank_utj',
    ];

    protected function casts(): array
    {
        return [
            'harga' => 'decimal:2',
            'suku_bunga_kpr' => 'decimal:2',
            'luas_tanah' => 'decimal:2',
            'luas_bangunan' => 'decimal:2',
            'jumlah_kamar_tidur' => 'integer',
            'jumlah_kamar_mandi' => 'integer',
            'id_marketing_user' => 'integer',
            'status_aktif' => 'boolean',
        ];
    }

    protected function whatsappMarketing(): Attribute
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

                throw new \InvalidArgumentException('Nomor WhatsApp marketing tidak valid. Gunakan format 08xxxxxxxxxx.');
            }
        );
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

    public function units()
    {
        return $this->hasMany(PerumahanUnit::class, 'id_perumahan', 'id_perumahan');
    }

    public function marketingUser()
    {
        return $this->belongsTo(User::class, 'id_marketing_user', 'id_user');
    }
}
