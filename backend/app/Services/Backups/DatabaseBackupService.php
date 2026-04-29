<?php

namespace App\Services\Backups;

use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;
use Symfony\Component\Process\Process;

class DatabaseBackupService
{
    public function run(bool $prune = true, bool $force = false): array
    {
        if (! $force && ! (bool) config('backups.database.enabled', false)) {
            Log::info('Database backup skipped because DATABASE_BACKUP_ENABLED is false.');

            return [
                'skipped' => true,
                'uploaded' => [],
                'deleted' => 0,
            ];
        }

        $this->assertBackupDiskConfigured();

        $connectionName = (string) config('backups.database.connection', config('database.default'));
        $connection = config("database.connections.{$connectionName}");

        if (! is_array($connection)) {
            throw new RuntimeException("Koneksi database [{$connectionName}] tidak ditemukan.");
        }

        $driver = (string) ($connection['driver'] ?? '');
        if (! in_array($driver, ['mysql', 'mariadb'], true)) {
            throw new RuntimeException("Backup database otomatis saat ini hanya mendukung MySQL/MariaDB. Driver aktif: {$driver}.");
        }

        $now = CarbonImmutable::now('UTC');
        $tmpDirectory = $this->ensureTemporaryDirectory();
        $database = (string) ($connection['database'] ?? '');
        $databaseSlug = $this->safeName($database);
        $timestamp = $now->format('Ymd\THis\Z');
        $baseName = $this->safeName((string) config('app.name', 'laravel'))."-{$databaseSlug}-{$timestamp}";
        $sqlPath = $tmpDirectory.DIRECTORY_SEPARATOR.$baseName.'.sql';
        $gzipPath = $sqlPath.'.gz';
        $defaultsPath = $tmpDirectory.DIRECTORY_SEPARATOR.$baseName.'.cnf';

        try {
            $this->writeMysqlDefaultsFile($defaultsPath, $connection);
            $this->dumpMysqlDatabase($connection, $database, $sqlPath, $defaultsPath);
            $this->compressSqlDump($sqlPath, $gzipPath);

            $summary = [
                'database' => $database,
                'generated_at' => $now->toIso8601String(),
                'checksum_sha256' => hash_file('sha256', $gzipPath),
                'size_bytes' => filesize($gzipPath) ?: 0,
                'uploaded' => $this->uploadBackupCopies($gzipPath, $baseName, $database, $now),
                'deleted' => $prune ? $this->pruneExpiredBackups($now) : 0,
                'skipped' => false,
            ];

            Log::info('Database backup completed.', [
                'database' => $summary['database'],
                'size_bytes' => $summary['size_bytes'],
                'uploaded' => array_column($summary['uploaded'], 'key'),
                'deleted' => $summary['deleted'],
            ]);

            return $summary;
        } catch (\Throwable $exception) {
            Log::error('Database backup failed.', [
                'database' => $database,
                'message' => $exception->getMessage(),
            ]);

            throw $exception;
        } finally {
            $this->deleteIfExists($defaultsPath);
            $this->deleteIfExists($sqlPath);
            $this->deleteIfExists($gzipPath);
        }
    }

    private function dumpMysqlDatabase(array $connection, string $database, string $sqlPath, string $defaultsPath): void
    {
        $binary = (string) config('backups.database.mysqldump_path', 'mysqldump');
        $timeout = (int) config('backups.database.timeout', 900);

        $arguments = [
            $binary,
            "--defaults-extra-file={$defaultsPath}",
            '--single-transaction',
            '--quick',
            '--routines',
            '--triggers',
            '--events',
            '--hex-blob',
            '--no-tablespaces',
            '--set-gtid-purged=OFF',
            "--result-file={$sqlPath}",
            $database,
        ];

        $process = new Process($arguments, base_path(), null, null, $timeout);
        $process->run();

        if (! $process->isSuccessful()) {
            $error = trim($process->getErrorOutput()) ?: trim($process->getOutput());
            throw new RuntimeException('mysqldump gagal: '.($error ?: 'Tidak ada detail error dari proses dump.'));
        }

        if (! is_file($sqlPath) || filesize($sqlPath) === 0) {
            throw new RuntimeException('mysqldump selesai tetapi file dump kosong atau tidak ditemukan.');
        }
    }

    private function compressSqlDump(string $sqlPath, string $gzipPath): void
    {
        $input = fopen($sqlPath, 'rb');
        if (! is_resource($input)) {
            throw new RuntimeException('File dump SQL tidak dapat dibaca untuk kompresi.');
        }

        $gzip = gzopen($gzipPath, 'wb9');
        if (! is_resource($gzip)) {
            fclose($input);
            throw new RuntimeException('File gzip backup tidak dapat dibuat.');
        }

        try {
            while (! feof($input)) {
                $chunk = fread($input, 1024 * 1024);
                if ($chunk === false) {
                    throw new RuntimeException('Gagal membaca dump SQL saat kompresi.');
                }

                gzwrite($gzip, $chunk);
            }
        } finally {
            gzclose($gzip);
            fclose($input);
        }

        if (! is_file($gzipPath) || filesize($gzipPath) === 0) {
            throw new RuntimeException('File backup gzip kosong atau gagal dibuat.');
        }
    }

    private function uploadBackupCopies(string $gzipPath, string $baseName, string $database, CarbonImmutable $now): array
    {
        $disk = Storage::disk((string) config('backups.database.disk', 'r2'));
        $uploaded = [];

        foreach ($this->copyTypesForDate($now) as $type) {
            $key = $this->backupObjectKey($type, $baseName, $now);

            $stream = fopen($gzipPath, 'rb');
            if (! is_resource($stream)) {
                throw new RuntimeException('File backup gzip tidak dapat dibaca untuk upload ke R2.');
            }

            try {
                $disk->put($key, $stream, [
                    'visibility' => 'private',
                    'ContentType' => 'application/gzip',
                ]);
            } finally {
                fclose($stream);
            }

            if (! $disk->exists($key)) {
                throw new RuntimeException("Upload backup database ke R2 gagal diverifikasi: {$key}");
            }

            $manifestKey = $key.'.json';
            $manifest = [
                'type' => $type,
                'database' => $database,
                'generated_at' => $now->toIso8601String(),
                'object_key' => $key,
                'size_bytes' => filesize($gzipPath) ?: 0,
                'checksum_sha256' => hash_file('sha256', $gzipPath),
                'compression' => 'gzip',
            ];

            $disk->put($manifestKey, json_encode($manifest, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES), [
                'visibility' => 'private',
                'ContentType' => 'application/json',
            ]);

            $uploaded[] = [
                'type' => $type,
                'key' => $key,
                'manifest_key' => $manifestKey,
            ];
        }

        return $uploaded;
    }

    private function pruneExpiredBackups(CarbonImmutable $now): int
    {
        $deleted = 0;
        $disk = Storage::disk((string) config('backups.database.disk', 'r2'));
        $prefix = trim((string) config('backups.database.prefix', 'database'), '/');
        $retention = [
            'daily' => $now->subDays((int) config('backups.database.retention.daily_days', 30)),
            'weekly' => $now->subWeeks((int) config('backups.database.retention.weekly_weeks', 8)),
            'monthly' => $now->subMonthsNoOverflow((int) config('backups.database.retention.monthly_months', 12)),
        ];

        foreach ($retention as $type => $cutoff) {
            foreach ($disk->allFiles("{$prefix}/{$type}") as $path) {
                $createdAt = $this->dateFromBackupPath($path);
                if (! $createdAt || $createdAt->greaterThanOrEqualTo($cutoff)) {
                    continue;
                }

                if ($disk->delete($path)) {
                    $deleted++;
                }
            }
        }

        if ($deleted > 0) {
            Log::info('Expired database backups pruned.', ['deleted' => $deleted]);
        }

        return $deleted;
    }

    private function assertBackupDiskConfigured(): void
    {
        $disk = (string) config('backups.database.disk', 'r2');
        $config = config("filesystems.disks.{$disk}");

        if (! is_array($config)) {
            throw new RuntimeException("Disk backup [{$disk}] tidak ditemukan.");
        }

        if (($config['driver'] ?? null) !== 's3') {
            return;
        }

        foreach (['bucket', 'key', 'secret', 'endpoint'] as $key) {
            if (trim((string) ($config[$key] ?? '')) === '') {
                throw new RuntimeException("Konfigurasi R2 untuk disk [{$disk}] belum lengkap: {$key} kosong.");
            }
        }
    }

    private function writeMysqlDefaultsFile(string $path, array $connection): void
    {
        $lines = ['[client]'];

        $host = (string) ($connection['host'] ?? '');
        $port = (string) ($connection['port'] ?? '');
        $socket = (string) ($connection['unix_socket'] ?? '');

        if ($socket !== '') {
            $lines[] = 'socket='.$this->optionFileValue($socket);
        } else {
            $lines[] = 'protocol=tcp';
            if ($host !== '') {
                $lines[] = 'host='.$this->optionFileValue($host);
            }
            if ($port !== '') {
                $lines[] = 'port='.$this->optionFileValue($port);
            }
        }

        $lines[] = 'user='.$this->optionFileValue((string) ($connection['username'] ?? ''));
        $lines[] = 'password='.$this->optionFileValue((string) ($connection['password'] ?? ''));

        if (file_put_contents($path, implode(PHP_EOL, $lines).PHP_EOL, LOCK_EX) === false) {
            throw new RuntimeException('File credential sementara mysqldump gagal dibuat.');
        }

        @chmod($path, 0600);
    }

    private function optionFileValue(string $value): string
    {
        return '"'.str_replace(['\\', '"'], ['\\\\', '\\"'], $value).'"';
    }

    private function copyTypesForDate(CarbonImmutable $now): array
    {
        $types = ['daily'];

        if ($now->isMonday()) {
            $types[] = 'weekly';
        }

        if ((int) $now->format('d') === 1) {
            $types[] = 'monthly';
        }

        return $types;
    }

    private function backupObjectKey(string $type, string $baseName, CarbonImmutable $now): string
    {
        $prefix = trim((string) config('backups.database.prefix', 'database'), '/');

        return match ($type) {
            'weekly' => sprintf('%s/weekly/%s/W%s/%s.sql.gz', $prefix, $now->format('Y'), $now->format('W'), $baseName),
            'monthly' => sprintf('%s/monthly/%s/%s/%s.sql.gz', $prefix, $now->format('Y'), $now->format('m'), $baseName),
            default => sprintf('%s/daily/%s/%s/%s/%s.sql.gz', $prefix, $now->format('Y'), $now->format('m'), $now->format('d'), $baseName),
        };
    }

    private function dateFromBackupPath(string $path): ?CarbonImmutable
    {
        if (! preg_match('/(\d{8}T\d{6}Z)/', $path, $matches)) {
            return null;
        }

        return CarbonImmutable::createFromFormat('Ymd\THis\Z', $matches[1], 'UTC') ?: null;
    }

    private function ensureTemporaryDirectory(): string
    {
        $path = (string) config('backups.database.tmp_path');
        if (! $this->isAbsolutePath($path)) {
            $path = storage_path($path);
        }

        if (! is_dir($path) && ! mkdir($path, 0750, true) && ! is_dir($path)) {
            throw new RuntimeException("Direktori sementara backup database gagal dibuat: {$path}");
        }

        return rtrim($path, DIRECTORY_SEPARATOR);
    }

    private function isAbsolutePath(string $path): bool
    {
        return str_starts_with($path, DIRECTORY_SEPARATOR) || preg_match('/^[A-Za-z]:\\\\/', $path) === 1;
    }

    private function safeName(string $value): string
    {
        return Str::slug($value, '-') ?: 'backup';
    }

    private function deleteIfExists(string $path): void
    {
        if (is_file($path)) {
            @unlink($path);
        }
    }
}
