<?php

namespace App\Services\Documents;

use App\Models\DocBooking;
use Illuminate\Support\Facades\Storage;
use RuntimeException;

class CloudflareR2DocumentBackupService
{
    public function isEnabled(): bool
    {
        return (bool) config('documents.backup.enabled', false)
            && (string) config('documents.backup.provider') === 'r2';
    }

    public function upsertBookingDocument(DocBooking $document): array
    {
        $this->assertConfigured();

        $sourcePath = trim((string) $document->storage_path);
        $sourceDisk = trim((string) $document->storage_disk);

        if ($sourcePath === '' || $sourceDisk === '') {
            throw new RuntimeException('Dokumen belum memiliki sumber private storage untuk dibackup.');
        }

        $source = Storage::disk($sourceDisk);
        if (! $source->exists($sourcePath)) {
            throw new RuntimeException('Dokumen private storage tidak ditemukan saat proses backup ke Cloudflare R2.');
        }

        $objectKey = $this->objectKeyForDocument($document);
        $stream = $source->readStream($sourcePath);

        if (! is_resource($stream)) {
            throw new RuntimeException('Dokumen private storage tidak dapat dibaca sebagai stream.');
        }

        try {
            Storage::disk($this->disk())->put($objectKey, $stream, [
                'visibility' => 'private',
                'ContentType' => $document->mime_type ?: 'application/octet-stream',
            ]);
        } finally {
            fclose($stream);
        }

        if (! $this->exists($objectKey)) {
            throw new RuntimeException("Upload dokumen ke Cloudflare R2 gagal diverifikasi: {$objectKey}");
        }

        return [
            'disk' => $this->disk(),
            'object_key' => $objectKey,
            'checksum' => $document->sha256_checksum,
            'size_bytes' => $this->sourceSizeBytes($sourceDisk, $sourcePath),
        ];
    }

    public function exists(string $objectKey): bool
    {
        $objectKey = trim($objectKey);

        return $objectKey !== '' && Storage::disk($this->disk())->exists($objectKey);
    }

    public function readStream(string $objectKey)
    {
        $this->assertDiskConfigured();

        $stream = Storage::disk($this->disk())->readStream($objectKey);
        if (! is_resource($stream)) {
            throw new RuntimeException('Dokumen backup R2 tidak dapat dibaca.');
        }

        return $stream;
    }

    public function disk(): string
    {
        return (string) config('documents.backup.disk', 'r2');
    }

    public function objectKeyForDocument(DocBooking $document): string
    {
        $prefix = trim((string) config('documents.backup.prefix', 'documents'), '/');
        $path = trim((string) $document->storage_path, '/');

        if ($path === '') {
            $storedFilename = trim((string) ($document->stored_filename ?: $document->nama_file));
            $path = trim(sprintf('bookings/%d/documents/%s', (int) $document->id_booking, $storedFilename), '/');
        }

        if ($path === '') {
            throw new RuntimeException('Dokumen tidak memiliki path yang valid untuk object key R2.');
        }

        return trim($prefix.'/'.$path, '/');
    }

    private function sourceSizeBytes(string $disk, string $path): ?int
    {
        try {
            return Storage::disk($disk)->size($path);
        } catch (\Throwable) {
            return null;
        }
    }

    private function assertConfigured(): void
    {
        if (! $this->isEnabled()) {
            throw new RuntimeException('Backup dokumen Cloudflare R2 belum diaktifkan.');
        }

        $this->assertDiskConfigured();
    }

    private function assertDiskConfigured(): void
    {
        if (trim((string) config('filesystems.disks.'.$this->disk().'.bucket')) === '') {
            throw new RuntimeException('Bucket Cloudflare R2 belum dikonfigurasi.');
        }

        if (trim((string) config('filesystems.disks.'.$this->disk().'.key')) === ''
            || trim((string) config('filesystems.disks.'.$this->disk().'.secret')) === '') {
            throw new RuntimeException('Access Key ID atau Secret Access Key Cloudflare R2 belum dikonfigurasi.');
        }

        if (trim((string) config('filesystems.disks.'.$this->disk().'.endpoint')) === '') {
            throw new RuntimeException('Endpoint Cloudflare R2 belum dikonfigurasi.');
        }
    }
}
