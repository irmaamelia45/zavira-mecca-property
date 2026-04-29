<?php

use App\Services\Backups\DatabaseBackupService;
use App\Services\Documents\BookingDocumentMaintenanceService;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('backups:database {--no-prune} {--force}', function () {
    $result = app(DatabaseBackupService::class)->run(
        prune: ! (bool) $this->option('no-prune'),
        force: (bool) $this->option('force'),
    );

    if ($result['skipped'] ?? false) {
        $this->warn('Database backup skipped because DATABASE_BACKUP_ENABLED=false.');

        return 0;
    }

    $this->info('Database backup uploaded to R2:');
    foreach ($result['uploaded'] as $backup) {
        $this->line("- {$backup['type']}: {$backup['key']}");
    }
    $this->info("Expired database backup objects deleted: {$result['deleted']}");

    return 0;
})->purpose('Create a compressed database backup, upload it to Cloudflare R2, and prune expired backup objects.');

Artisan::command('backups:run {--documents-limit=}', function () {
    $databaseBackup = app(DatabaseBackupService::class)->run();

    if ($databaseBackup['skipped'] ?? false) {
        $this->warn('Database backup skipped. Document backup dispatch was not started by backups:run.');

        return 0;
    }

    $limit = $this->option('documents-limit');
    $result = app(BookingDocumentMaintenanceService::class)
        ->dispatchPendingBackups((int) ($limit ?: config('documents.backup.batch_limit', 250)));

    $this->info("Database backup completed. Dokumen backup dispatched: {$result['dispatched']}");

    return 0;
})->purpose('Run database backup first, then dispatch pending document backup jobs.');

Artisan::command('documents:backup-pending {--limit=250}', function () {
    $result = app(BookingDocumentMaintenanceService::class)
        ->dispatchPendingBackups((int) $this->option('limit'));

    $this->info("Dokumen backup dispatched: {$result['dispatched']}");
})->purpose('Dispatch backup jobs for booking documents that are still pending or failed.');

Artisan::command('documents:migrate-legacy-public-files {--keep-original} {--limit=250}', function () {
    $result = app(BookingDocumentMaintenanceService::class)
        ->migrateLegacyPublicDocuments(
            deleteOriginal: ! (bool) $this->option('keep-original'),
            limit: (int) $this->option('limit'),
        );

    $this->info("Dokumen legacy migrated: {$result['migrated']}");
    $this->info("Dokumen legacy skipped: {$result['skipped']}");
})->purpose('Move legacy public booking documents into protected private storage.');

Artisan::command('documents:prune-local {--dry-run} {--limit=250}', function () {
    $result = app(BookingDocumentMaintenanceService::class)
        ->pruneLocalCopies(
            dryRun: (bool) $this->option('dry-run'),
            limit: (int) $this->option('limit'),
        );

    $this->info("Dokumen eligible for prune: {$result['eligible']}");
    $this->info("Dokumen deleted locally: {$result['deleted']}");
    $this->info("Dokumen gagal dihapus: {$result['failed']}");
    $this->info('Dry run: '.($result['dry_run'] ? 'yes' : 'no'));
})->purpose('Delete local booking document copies that have already been safely backed up.');

Schedule::command('auth:clear-resets')->everyFifteenMinutes();
Schedule::command('sanctum:prune-expired --hours=24')->daily()->withoutOverlapping();
Schedule::command('backups:run')
    ->dailyAt((string) config('backups.database.schedule_at', '00:30'))
    ->withoutOverlapping(180);
Schedule::command('documents:migrate-legacy-public-files --limit=250')->dailyAt('01:00')->withoutOverlapping();
Schedule::command('documents:backup-pending --limit='.(int) config('documents.backup.batch_limit', 250))->hourly()->withoutOverlapping();
Schedule::command('documents:prune-local')->dailyAt('02:00')->withoutOverlapping();
