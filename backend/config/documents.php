<?php

return [
    'primary_disk' => env('DOCUMENT_STORAGE_DISK', 'local'),

    'backup' => [
        'enabled' => (bool) env('DOCUMENT_BACKUP_ENABLED', false),
        'provider' => env('DOCUMENT_BACKUP_PROVIDER', 'r2'),
        'disk' => env('DOCUMENT_BACKUP_DISK', env('BACKUP_R2_DISK', 'r2')),
        'prefix' => trim((string) env('DOCUMENT_BACKUP_PREFIX', 'documents'), '/'),
        'queue' => env('DOCUMENT_BACKUP_QUEUE', 'document-backups'),
        'batch_limit' => (int) env('DOCUMENT_BACKUP_BATCH_LIMIT', 250),
    ],

    'retention' => [
        'completed_days' => (int) env('DOCUMENT_RETENTION_COMPLETED_DAYS', 180),
        'rejected_days' => (int) env('DOCUMENT_RETENTION_REJECTED_DAYS', 90),
        'canceled_days' => (int) env('DOCUMENT_RETENTION_CANCELED_DAYS', 90),
    ],
];
