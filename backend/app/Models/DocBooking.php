<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DocBooking extends Model
{
    use HasFactory;

    protected $table = 'doc_booking';
    protected $primaryKey = 'id_doc_booking';
    protected $keyType = 'int';
    public $timestamps = false;

    protected $fillable = [
        'id_booking',
        'jenis_dokumen',
        'nama_file',
        'path_file',
        'mime_type',
        'file_size_kb',
        'uploaded_at',
    ];

    protected function casts(): array
    {
        return [
            'uploaded_at' => 'datetime',
        ];
    }

    public function booking()
    {
        return $this->belongsTo(Booking::class, 'id_booking', 'id_booking');
    }
}
