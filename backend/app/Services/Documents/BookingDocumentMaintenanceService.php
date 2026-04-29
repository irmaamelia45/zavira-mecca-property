<?php

namespace App\Services\Documents;

use App\Jobs\BackupBookingDocumentJob;
use App\Models\DocBooking;
use Illuminate\Database\Eloquent\Builder;

class BookingDocumentMaintenanceService
{
    public function __construct(
        private readonly BookingDocumentStorageService $storageService,
        private readonly CloudflareR2DocumentBackupService $r2BackupService,
    ) {}

    public function dispatchPendingBackups(int $limit = 250): array
    {
        if (! (bool) config('documents.backup.enabled', false)) {
            return ['dispatched' => 0];
        }

        $provider = (string) config('documents.backup.provider', 'r2');

        $documents = DocBooking::query()
            ->whereNull('deleted_local_at')
            ->where(function (Builder $query) use ($provider) {
                $query->whereIn('backup_status', ['pending', 'failed', 'disabled'])
                    ->orWhere(function (Builder $query) use ($provider) {
                        $query->where('backup_status', 'backed_up')
                            ->where(function (Builder $query) use ($provider) {
                                $query->whereNull('backup_provider')
                                    ->orWhere('backup_provider', '!=', $provider);
                            });
                    });
            })
            ->orderBy('id_doc_booking')
            ->limit($limit)
            ->get(['id_doc_booking']);

        foreach ($documents as $document) {
            BackupBookingDocumentJob::dispatch((int) $document->id_doc_booking);
        }

        return [
            'dispatched' => $documents->count(),
        ];
    }

    public function migrateLegacyPublicDocuments(bool $deleteOriginal = true, int $limit = 250): array
    {
        $documents = DocBooking::query()
            ->with('booking:id_booking,status_booking,finished_at,rejected_at,canceled_at')
            ->where(function ($query) {
                $query->whereNull('storage_disk')
                    ->orWhereNull('storage_path')
                    ->orWhere('path_file', 'like', '/uploads/%');
            })
            ->orderBy('id_doc_booking')
            ->limit($limit)
            ->get();

        $migrated = 0;
        $skipped = 0;

        foreach ($documents as $document) {
            $legacyAbsolutePath = $this->storageService->resolveLegacyAbsolutePath($document);
            if (! $legacyAbsolutePath || ! is_file($legacyAbsolutePath)) {
                $skipped++;

                continue;
            }

            $this->storageService->migrateLegacyPublicDocument($document);
            if ($document->booking) {
                $this->storageService->syncRetentionForBooking($document->booking);
            }

            if ($deleteOriginal && is_file($legacyAbsolutePath)) {
                @unlink($legacyAbsolutePath);
            }

            if ($document->backup_status === 'pending') {
                BackupBookingDocumentJob::dispatch((int) $document->id_doc_booking);
            }

            $migrated++;
        }

        return [
            'migrated' => $migrated,
            'skipped' => $skipped,
        ];
    }

    public function pruneLocalCopies(bool $dryRun = false, int $limit = 250): array
    {
        $documents = DocBooking::query()
            ->where('backup_status', 'backed_up')
            ->where(function (Builder $query) {
                $query->whereNotNull('backup_object_key')
                    ->orWhereNotNull('backup_file_id');
            })
            ->whereNull('deleted_local_at')
            ->whereNotNull('retention_until')
            ->where('retention_until', '<=', now())
            ->orderBy('retention_until')
            ->limit($limit)
            ->get();

        $eligible = $documents->count();
        $deleted = 0;
        $failed = 0;

        foreach ($documents as $document) {
            if ($dryRun) {
                continue;
            }

            if (! $this->hasVerifiedBackup($document)) {
                $document->forceFill([
                    'backup_last_error' => 'Backup remote belum dapat diverifikasi, file lokal belum dihapus.',
                ])->save();
                $failed++;

                continue;
            }

            $deletedLocalCopy = $this->storageService->deleteLocalCopy($document);

            if (! $deletedLocalCopy) {
                if (! $this->storageService->resolveReadableSource($document)) {
                    $document->forceFill([
                        'deleted_local_at' => now(),
                        'backup_last_error' => null,
                    ])->save();
                    $deleted++;

                    continue;
                }

                $document->forceFill([
                    'backup_last_error' => 'File lokal gagal dihapus saat proses retensi dokumen.',
                ])->save();
                $failed++;

                continue;
            }

            $document->forceFill([
                'deleted_local_at' => now(),
                'backup_last_error' => null,
            ])->save();
            $deleted++;
        }

        return [
            'eligible' => $eligible,
            'deleted' => $deleted,
            'failed' => $failed,
            'dry_run' => $dryRun,
        ];
    }

    private function hasVerifiedBackup(DocBooking $document): bool
    {
        if ($document->backup_provider === 'r2') {
            $objectKey = trim((string) ($document->backup_object_key ?: $document->backup_file_id));

            return $this->r2BackupService->exists($objectKey);
        }

        return $document->isBackedUp();
    }
}
