<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PerumahanMedia extends Model
{
    use HasFactory;

    protected $table = 'perumahan_media';
    protected $primaryKey = 'id_media';
    protected $keyType = 'int';
    public $timestamps = true;
    const CREATED_AT = 'created_at';
    const UPDATED_AT = null;

    protected $fillable = [
        'id_perumahan',
        'tipe',
        'url_file',
        'caption',
        'urutan',
    ];

    public function perumahan()
    {
        return $this->belongsTo(Perumahan::class, 'id_perumahan', 'id_perumahan');
    }
}
