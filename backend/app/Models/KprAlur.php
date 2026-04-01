<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class KprAlur extends Model
{
    use HasFactory;

    protected $table = 'kpr_alur';
    protected $primaryKey = 'id_alur';
    protected $keyType = 'int';
    public $timestamps = false;

    protected $fillable = [
        'id_kpr_info',
        'langkah_ke',
        'judul_langkah',
        'deskripsi',
    ];

    public function kprInfo()
    {
        return $this->belongsTo(KprInfo::class, 'id_kpr_info', 'id_kpr_info');
    }
}
