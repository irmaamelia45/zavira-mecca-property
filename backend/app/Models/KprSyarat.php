<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class KprSyarat extends Model
{
    use HasFactory;

    protected $table = 'kpr_syarat';
    protected $primaryKey = 'id_syarat';
    protected $keyType = 'int';
    public $timestamps = false;

    protected $fillable = [
        'id_kpr_info',
        'nama_syarat',
        'deskripsi',
        'urutan',
    ];

    public function kprInfo()
    {
        return $this->belongsTo(KprInfo::class, 'id_kpr_info', 'id_kpr_info');
    }
}
