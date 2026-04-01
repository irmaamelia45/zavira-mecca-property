<?php

namespace App\Models;

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
        'website',
        'deskripsi',
        'visi',
        'misi',
        'logo_path',
        'penghargaan',
        'struktur_organisasi',
    ];
}
