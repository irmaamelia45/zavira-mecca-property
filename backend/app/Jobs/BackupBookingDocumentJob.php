<?php

namespace App\Jobs;

use App\Models\DocBooking;
use App\Services\Documents\CloudflareR2DocumentBackupService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\Middleware\WithoutOverlapping;
use Illuminate\Support\Facades\Log;
use Throwable;

class BackupBookingDocumentJob implements ShouldQueue
{
    use Queueable;

    public int $tries = 5;

    public array $backoff = [60, 300, 900, 1800, 3600];

    public function __construct(
        public int $documentId,
    ) {
        $this->onQueue((string) config('documents.backup.queue', 'document-backups'));
    }

    public function middleware(): array
    {
        return [
            (new WithoutOverlapping("booking-document-backup:{$this->documentId}"))
                ->releaseAfter(300)
                ->expireAfter(3600),
        ];
    }

    public function handle(CloudflareR2DocumentBackupService $r2BackupService): void
    {
        $document = DocBooking::query()->find($this->documentId);
        if (! $document) {
            return;
        }

        if (! $r2BackupService->isEnabled()) {
            $document->forceFill([
                'backup_status' => 'disabled',
                'backup_provider' => null,
                'backup_last_error' => null,
            ])->save();

            return;
        }

        if ($document->deleted_local_at && ! $document->isBackedUp()) {
            $document->forceFill([
                'backup_provider' => 'r2',
                'backup_status' => 'failed',
                'backup_last_error' => 'Dokumen lokal sudah terhapus sebelum backup R2 terselesaikan.',
            ])->save();

            return;
        }

        try {
            $backup = $r2BackupService->upsertBookingDocument($document);

            $document->forceFill([
                'backup_provider' => 'r2',
                'backup_status' => 'backed_up',
                'backup_file_id' => (string) $backup['object_key'],
                'backup_disk' => (string) $backup['disk'],
                'backup_object_key' => (string) $backup['object_key'],
                'backup_checksum' => $backup['checksum'],
                'backup_size_bytes' => $backup['size_bytes'],
                'backup_synced_at' => now(),
                'backup_last_error' => null,
            ])->save();

            Log::info('Booking document backed up to Cloudflare R2.', [
                'document_id' => $document->id_doc_booking,
                'object_key' => $backup['object_key'],
            ]);
        } catch (Throwable $exception) {
            $document->forceFill([
                'backup_provider' => 'r2',
                'backup_status' => 'failed',
                'backup_last_error' => $exception->getMessage(),
            ])->save();

            Log::error('Booking document backup to Cloudflare R2 failed.', [
                'document_id' => $document->id_doc_booking,
                'message' => $exception->getMessage(),
            ]);

            throw $exception;
        }
    }
}
