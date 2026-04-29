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
        'storage_disk',
        'storage_path',
        'stored_filename',
        'mime_type',
        'file_size_kb',
        'sha256_checksum',
        'backup_provider',
        'backup_status',
        'backup_file_id',
        'backup_disk',
        'backup_object_key',
        'backup_checksum',
        'backup_size_bytes',
        'backup_synced_at',
        'backup_last_error',
        'retention_until',
        'deleted_local_at',
        'uploaded_at',
    ];

    protected function casts(): array
    {
        return [
            'backup_synced_at' => 'datetime',
            'backup_size_bytes' => 'integer',
            'retention_until' => 'datetime',
            'deleted_local_at' => 'datetime',
            'uploaded_at' => 'datetime',
        ];
    }

    public function booking()
    {
        return $this->belongsTo(Booking::class, 'id_booking', 'id_booking');
    }

    public function isBackedUp(): bool
    {
        return $this->backup_status === 'backed_up'
            && (
                trim((string) $this->backup_object_key) !== ''
                || trim((string) $this->backup_file_id) !== ''
            );
    }
}
