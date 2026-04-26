<?php

namespace App\Models;

use App\Support\PhoneNumber;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProfilPerusahaan extends Model
{
    use HasFactory;

    protected $table = 'profil_perusahaan';
    protected $primaryKey = 'id_profil';
    protected $keyType = 'int';

    protected $fillable = [
        'nama_perusahaan',
        'alamat',
        'email',
        'telepon',
        'whatsapp',
        'no_rekening_utj',
        'website',
        'deskripsi',
        'visi',
        'misi',
        'logo_path',
        'penghargaan',
        'struktur_organisasi',
    ];

    protected function whatsapp(): Attribute
    {
        return Attribute::make(
            set: function ($value) {
                $raw = (string) $value;
                if (PhoneNumber::digitsOnly($raw) === '') {
                    return null;
                }

                $normalized = PhoneNumber::normalizePhone($raw);
                if ($normalized) {
                    return $normalized;
                }

                throw new \InvalidArgumentException('Nomor WhatsApp marketing tidak valid. Gunakan format 08xxxxxxxxxx.');
            }
        );
    }
}
