<?php

return [
    'r2' => [
        'disk' => env('BACKUP_R2_DISK', 'r2'),
    ],

    'database' => [
        'enabled' => (bool) env('DATABASE_BACKUP_ENABLED', false),
        'connection' => env('DATABASE_BACKUP_CONNECTION', env('DB_CONNECTION', 'mysql')),
        'disk' => env('DATABASE_BACKUP_DISK', env('BACKUP_R2_DISK', 'r2')),
        'prefix' => trim((string) env('DATABASE_BACKUP_PREFIX', 'database'), '/'),
        'tmp_path' => env('DATABASE_BACKUP_TMP_PATH') ?: storage_path('app/private/backups/database/tmp'),
        'mysqldump_path' => env('DATABASE_BACKUP_MYSQLDUMP_PATH', 'mysqldump'),
        'timeout' => (int) env('DATABASE_BACKUP_TIMEOUT', 900),
        'schedule_at' => env('DATABASE_BACKUP_SCHEDULE_AT', '00:30'),

        'retention' => [
            'daily_days' => (int) env('DATABASE_BACKUP_DAILY_RETENTION_DAYS', 30),
            'weekly_weeks' => (int) env('DATABASE_BACKUP_WEEKLY_RETENTION_WEEKS', 8),
            'monthly_months' => (int) env('DATABASE_BACKUP_MONTHLY_RETENTION_MONTHS', 12),
        ],
    ],
];
