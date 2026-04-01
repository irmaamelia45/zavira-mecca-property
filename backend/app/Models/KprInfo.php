<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class KprInfo extends Model
{
    use HasFactory;

    protected $table = 'kpr_info';
    protected $primaryKey = 'id_kpr_info';
    protected $keyType = 'int';

    protected $fillable = [
        'judul',
        'jenis_konten',
        'konten',
    ];

    public function syarat()
    {
        return $this->hasMany(KprSyarat::class, 'id_kpr_info', 'id_kpr_info')->orderBy('urutan');
    }

    public function alur()
    {
        return $this->hasMany(KprAlur::class, 'id_kpr_info', 'id_kpr_info')->orderBy('langkah_ke');
    }
}
