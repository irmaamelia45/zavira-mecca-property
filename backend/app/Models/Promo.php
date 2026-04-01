<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Promo extends Model
{
    use HasFactory;

    protected $table = 'promo';
    protected $primaryKey = 'id_promo';
    protected $keyType = 'int';

    protected $fillable = [
        'id_perumahan',
        'judul',
        'kategori',
        'deskripsi',
        'banner_path',
        'tipe_promo',
        'nilai_promo',
        'tanggal_mulai',
        'tanggal_selesai',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'nilai_promo' => 'decimal:2',
            'tanggal_mulai' => 'date',
            'tanggal_selesai' => 'date',
            'is_active' => 'boolean',
        ];
    }

    public function perumahans()
    {
        return $this->belongsToMany(Perumahan::class, 'perumahan_promo', 'id_promo', 'id_perumahan');
    }

    public function scopeActiveOn($query, $date = null)
    {
        $date = $date ?: now()->toDateString();

        return $query
            ->where('is_active', true)
            ->whereDate('tanggal_mulai', '<=', $date)
            ->whereDate('tanggal_selesai', '>=', $date);
    }
}
