<?php

namespace App\Services\Documents;

use App\Models\DocBooking;
use Google\Client as GoogleClient;
use Google\Service\Drive;
use Google\Service\Drive\DriveFile;
use Illuminate\Support\Facades\Storage;
use RuntimeException;

class GoogleDriveBackupService
{
    private ?GoogleClient $client = null;

    public function isEnabled(): bool
    {
        return (bool) config('documents.backup.enabled', false)
            && (string) config('documents.backup.provider') === 'google_drive';
    }

    public function upsertBookingDocument(DocBooking $document): array
    {
        $this->assertConfigured();

        $document->loadMissing('booking');
        $sourcePath = trim((string) $document->storage_path);
        $sourceDisk = trim((string) $document->storage_disk);

        if ($sourcePath === '' || $sourceDisk === '') {
            throw new RuntimeException('Dokumen belum memiliki sumber private storage untuk dibackup.');
        }

        if (! Storage::disk($sourceDisk)->exists($sourcePath)) {
            throw new RuntimeException('Dokumen private storage tidak ditemukan saat proses backup ke Google Drive.');
        }

        $folderId = $this->ensureFolderHierarchy($document);
        $service = $this->driveService();
        $content = Storage::disk($sourceDisk)->get($sourcePath);

        $metadata = new DriveFile([
            'name' => $this->backupFileName($document),
            'parents' => [$folderId],
        ]);

        $params = [
            'data' => $content,
            'mimeType' => $document->mime_type ?: 'application/octet-stream',
            'uploadType' => 'multipart',
            'supportsAllDrives' => true,
            'fields' => 'id,name,md5Checksum,size,createdTime',
        ];

        $fileId = trim((string) $document->backup_file_id);

        $result = $fileId !== ''
            ? $service->files->update($fileId, $metadata, $params)
            : $service->files->create($metadata, $params);

        return [
            'id' => (string) $result->id,
            'name' => (string) $result->name,
            'size' => (string) $result->size,
            'created_time' => (string) $result->createdTime,
            'folder_id' => $folderId,
        ];
    }

    public function downloadFileContents(string $fileId): string
    {
        $this->assertConfigured();

        $httpClient = $this->googleClient()->authorize();
        $response = $httpClient->get(
            sprintf('https://www.googleapis.com/drive/v3/files/%s', rawurlencode($fileId)),
            [
                'query' => [
                    'alt' => 'media',
                    'supportsAllDrives' => 'true',
                ],
            ]
        );

        return (string) $response->getBody();
    }

    private function ensureFolderHierarchy(DocBooking $document): string
    {
        $booking = $document->booking;
        $rootFolderId = trim((string) config('services.google_drive.root_folder_id'));
        $sharedDriveId = trim((string) config('services.google_drive.shared_drive_id'));

        if ($rootFolderId === '') {
            throw new RuntimeException('Root folder Google Drive belum dikonfigurasi.');
        }

        $uploadedAt = $document->uploaded_at ?? now();
        $yearFolderId = $this->firstOrCreateFolder(
            (string) $uploadedAt->format('Y'),
            $rootFolderId,
            $sharedDriveId
        );
        $monthFolderId = $this->firstOrCreateFolder(
            (string) $uploadedAt->format('m'),
            $yearFolderId,
            $sharedDriveId
        );

        return $this->firstOrCreateFolder(
            sprintf('booking-%d', (int) ($booking?->id_booking ?? $document->id_booking)),
            $monthFolderId,
            $sharedDriveId
        );
    }

    private function firstOrCreateFolder(string $name, string $parentId, string $sharedDriveId = ''): string
    {
        $service = $this->driveService();
        $escapedName = str_replace("'", "\\'", $name);

        $query = sprintf(
            "name = '%s' and '%s' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false",
            $escapedName,
            $parentId
        );

        $params = [
            'q' => $query,
            'fields' => 'files(id, name)',
            'pageSize' => 1,
            'supportsAllDrives' => true,
            'includeItemsFromAllDrives' => true,
        ];

        if ($sharedDriveId !== '') {
            $params['driveId'] = $sharedDriveId;
            $params['corpora'] = 'drive';
        }

        $list = $service->files->listFiles($params);
        $existing = $list->getFiles();

        if (! empty($existing)) {
            return (string) $existing[0]->id;
        }

        $folder = new DriveFile([
            'name' => $name,
            'mimeType' => 'application/vnd.google-apps.folder',
            'parents' => [$parentId],
        ]);

        $created = $service->files->create($folder, [
            'fields' => 'id',
            'supportsAllDrives' => true,
        ]);

        return (string) $created->id;
    }

    private function backupFileName(DocBooking $document): string
    {
        $extension = pathinfo((string) ($document->stored_filename ?: $document->nama_file), PATHINFO_EXTENSION);
        $safeExtension = $extension !== '' ? '.'.strtolower($extension) : '';
        $safeType = preg_replace('/[^a-z0-9]+/i', '-', strtolower((string) $document->jenis_dokumen)) ?: 'document';

        return sprintf(
            'booking-%d-%s-%d%s',
            (int) $document->id_booking,
            trim($safeType, '-'),
            (int) $document->id_doc_booking,
            $safeExtension
        );
    }

    private function driveService(): Drive
    {
        return new Drive($this->googleClient());
    }

    private function googleClient(): GoogleClient
    {
        if ($this->client instanceof GoogleClient) {
            return $this->client;
        }

        $credentialPath = $this->resolveCredentialPath();
        $client = new GoogleClient;
        $client->setAuthConfig($credentialPath);
        $client->setScopes([Drive::DRIVE]);
        $client->setApplicationName(config('app.name', 'Laravel').' Document Backup');

        return $this->client = $client;
    }

    private function resolveCredentialPath(): string
    {
        $configuredPath = trim((string) config('services.google_drive.service_account_json_path'));
        if ($configuredPath === '') {
            throw new RuntimeException('Credential Google Drive service account belum dikonfigurasi.');
        }

        $absolutePath = str_starts_with($configuredPath, DIRECTORY_SEPARATOR)
            || preg_match('/^[A-Za-z]:\\\\/', $configuredPath)
            ? $configuredPath
            : base_path($configuredPath);

        if (! is_file($absolutePath)) {
            throw new RuntimeException('File credential Google Drive service account tidak ditemukan.');
        }

        return $absolutePath;
    }

    private function assertConfigured(): void
    {
        if (! $this->isEnabled()) {
            throw new RuntimeException('Backup Google Drive belum diaktifkan.');
        }

        $this->resolveCredentialPath();

        if (trim((string) config('services.google_drive.root_folder_id')) === '') {
            throw new RuntimeException('Root folder Google Drive belum diatur.');
        }
    }
}
