<?php

namespace App\Services\Documents;

use App\Models\Booking;
use App\Models\DocBooking;
use Carbon\CarbonInterface;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;

class BookingDocumentStorageService
{
    public function primaryDisk(): string
    {
        return (string) config('documents.primary_disk', 'local');
    }

    public function storeUploadedDocument(
        int $bookingId,
        UploadedFile $file,
        string $documentType,
        string $folder,
        ?CarbonInterface $retentionUntil = null,
    ): DocBooking {
        $disk = $this->primaryDisk();
        $storedFilename = $this->buildStoredFilename(
            $file->guessExtension() ?: 'bin'
        );
        $directory = $this->buildStorageDirectory($bookingId, $folder);
        $storagePath = trim($directory.'/'.$storedFilename, '/');

        $storedPath = Storage::disk($disk)->putFileAs($directory, $file, $storedFilename);

        if (! is_string($storedPath) || trim($storedPath) === '') {
            throw new RuntimeException('Dokumen gagal disimpan ke private storage.');
        }

        return DocBooking::query()->create([
            'id_booking' => $bookingId,
            'jenis_dokumen' => $documentType,
            'nama_file' => $file->getClientOriginalName(),
            'path_file' => $storedPath,
            'storage_disk' => $disk,
            'storage_path' => $storedPath,
            'stored_filename' => $storedFilename,
            'mime_type' => $file->getMimeType() ?: $file->getClientMimeType() ?: 'application/octet-stream',
            'file_size_kb' => (int) ceil(($file->getSize() ?: 0) / 1024),
            'sha256_checksum' => $this->checksumForPath($file->getRealPath()),
            'backup_provider' => $this->backupProvider(),
            'backup_status' => $this->initialBackupStatus(),
            'retention_until' => $retentionUntil,
            'uploaded_at' => now(),
        ]);
    }

    public function migrateLegacyPublicDocument(DocBooking $document): ?DocBooking
    {
        $legacyAbsolutePath = $this->resolveLegacyAbsolutePath($document);
        if (! $legacyAbsolutePath || ! is_file($legacyAbsolutePath)) {
            return null;
        }

        $disk = $this->primaryDisk();
        $extension = pathinfo($legacyAbsolutePath, PATHINFO_EXTENSION)
            ?: pathinfo((string) $document->nama_file, PATHINFO_EXTENSION)
            ?: 'bin';

        $storedFilename = $this->buildStoredFilename($extension);
        $directory = $this->buildStorageDirectory(
            (int) $document->id_booking,
            $this->folderFromDocumentType((string) $document->jenis_dokumen)
        );
        $storagePath = trim($directory.'/'.$storedFilename, '/');

        $stream = fopen($legacyAbsolutePath, 'rb');
        if (! is_resource($stream)) {
            throw new RuntimeException('Dokumen publik lama tidak dapat dibaca untuk proses migrasi.');
        }

        try {
            $stored = Storage::disk($disk)->put($storagePath, $stream);
        } finally {
            fclose($stream);
        }

        if (! $stored) {
            throw new RuntimeException('Dokumen publik lama gagal dipindahkan ke private storage.');
        }

        $document->forceFill([
            'path_file' => $storagePath,
            'storage_disk' => $disk,
            'storage_path' => $storagePath,
            'stored_filename' => $storedFilename,
            'sha256_checksum' => $this->checksumForPath($legacyAbsolutePath),
            'backup_provider' => $this->backupProvider(),
            'backup_status' => $this->initialBackupStatus(),
            'backup_last_error' => null,
            'deleted_local_at' => null,
        ])->save();

        return $document->refresh();
    }

    public function resolveReadableSource(DocBooking $document): ?array
    {
        $disk = trim((string) $document->storage_disk);
        $path = trim((string) $document->storage_path);

        if ($disk !== '' && $path !== '' && Storage::disk($disk)->exists($path)) {
            return [
                'type' => 'disk',
                'disk' => $disk,
                'path' => $path,
            ];
        }

        return null;
    }

    public function resolveLegacyAbsolutePath(DocBooking $document): ?string
    {
        $legacyPath = trim((string) $document->path_file);
        if ($legacyPath === '' || ! str_starts_with($legacyPath, '/uploads/')) {
            return null;
        }

        return public_path(ltrim($legacyPath, '/'));
    }

    public function deleteLocalCopy(DocBooking $document): bool
    {
        $source = $this->resolveReadableSource($document);
        if (! $source) {
            return false;
        }

        if ($source['type'] === 'disk') {
            return (bool) Storage::disk($source['disk'])->delete($source['path']);
        }

        return false;
    }

    public function cleanupStoredPath(string $disk, ?string $path): void
    {
        $path = trim((string) $path);
        if ($path === '') {
            return;
        }

        if (Storage::disk($disk)->exists($path)) {
            Storage::disk($disk)->delete($path);
        }
    }

    public function syncRetentionForBooking(Booking $booking): void
    {
        $retentionUntil = $this->calculateRetentionDeadline($booking);

        $booking->documents()->update([
            'retention_until' => $retentionUntil,
        ]);
    }

    public function calculateRetentionDeadline(Booking $booking): ?CarbonInterface
    {
        return match ((string) $booking->status_booking) {
            'Selesai' => ($booking->finished_at ?? now())->copy()->addDays((int) config('documents.retention.completed_days', 180)),
            'Ditolak' => ($booking->rejected_at ?? now())->copy()->addDays((int) config('documents.retention.rejected_days', 90)),
            'Dibatalkan' => ($booking->canceled_at ?? now())->copy()->addDays((int) config('documents.retention.canceled_days', 90)),
            default => null,
        };
    }

    public function folderFromDocumentType(string $documentType): string
    {
        $normalized = strtolower(trim($documentType));

        if (str_contains($normalized, 'transfer')) {
            return 'transfer-proofs';
        }

        return 'documents';
    }

    private function buildStorageDirectory(int $bookingId, string $folder): string
    {
        return trim("bookings/{$bookingId}/{$folder}", '/');
    }

    private function buildStoredFilename(string $extension): string
    {
        $safeExtension = strtolower(trim($extension)) ?: 'bin';
        $safeExtension = preg_replace('/[^a-z0-9]+/', '', $safeExtension) ?: 'bin';

        return Str::uuid()->toString().'.'.$safeExtension;
    }

    private function checksumForPath(?string $path): ?string
    {
        if (! is_string($path) || trim($path) === '' || ! is_file($path)) {
            return null;
        }

        return hash_file('sha256', $path) ?: null;
    }

    private function initialBackupStatus(): string
    {
        return $this->isBackupEnabled() ? 'pending' : 'disabled';
    }

    private function backupProvider(): ?string
    {
        if (! $this->isBackupEnabled()) {
            return null;
        }

        return (string) config('documents.backup.provider', 'r2');
    }

    private function isBackupEnabled(): bool
    {
        return (bool) config('documents.backup.enabled', false);
    }
}
