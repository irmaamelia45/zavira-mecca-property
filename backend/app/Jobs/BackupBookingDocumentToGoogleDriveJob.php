<?php

namespace App\Jobs;

use App\Models\DocBooking;
use App\Services\Documents\GoogleDriveBackupService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Throwable;

class BackupBookingDocumentToGoogleDriveJob implements ShouldQueue
{
    use Queueable;

    public int $tries = 5;

    public array $backoff = [60, 300, 900, 1800, 3600];

    public function __construct(
        public int $documentId,
    ) {}

    public function handle(GoogleDriveBackupService $googleDriveBackupService): void
    {
        $document = DocBooking::query()->find($this->documentId);
        if (! $document) {
            return;
        }

        if (! $googleDriveBackupService->isEnabled()) {
            $document->forceFill([
                'backup_status' => 'disabled',
                'backup_provider' => null,
                'backup_last_error' => null,
            ])->save();

            return;
        }

        if ($document->deleted_local_at && ! $document->isBackedUp()) {
            $document->forceFill([
                'backup_status' => 'failed',
                'backup_last_error' => 'Dokumen lokal sudah terhapus sebelum backup terselesaikan.',
            ])->save();

            return;
        }

        try {
            $backup = $googleDriveBackupService->upsertBookingDocument($document);

            $document->forceFill([
                'backup_provider' => 'google_drive',
                'backup_status' => 'backed_up',
                'backup_file_id' => (string) ($backup['id'] ?? ''),
                'backup_synced_at' => now(),
                'backup_last_error' => null,
            ])->save();
        } catch (Throwable $exception) {
            $document->forceFill([
                'backup_provider' => 'google_drive',
                'backup_status' => 'failed',
                'backup_last_error' => $exception->getMessage(),
            ])->save();

            throw $exception;
        }
    }
}
