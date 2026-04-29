<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\DocBooking;
use App\Services\Documents\BookingDocumentStorageService;
use App\Services\Documents\CloudflareR2DocumentBackupService;
use App\Services\Documents\GoogleDriveBackupService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\Response;

class BookingDocumentController extends Controller
{
    public function __construct(
        private readonly BookingDocumentStorageService $documentStorageService,
        private readonly CloudflareR2DocumentBackupService $r2BackupService,
        private readonly GoogleDriveBackupService $googleDriveBackupService,
    ) {}

    public function downloadMine(Request $request, int $bookingId, int $documentId): Response
    {
        $booking = Booking::query()
            ->where('id_booking', $bookingId)
            ->where('id_user', $request->user()->id_user)
            ->first();

        if (! $booking) {
            return response()->json(['message' => 'Dokumen tidak ditemukan.'], 404);
        }

        $document = DocBooking::query()
            ->where('id_doc_booking', $documentId)
            ->where('id_booking', $bookingId)
            ->first();

        if (! $document) {
            return response()->json(['message' => 'Dokumen tidak ditemukan.'], 404);
        }

        return $this->downloadDocument($document);
    }

    public function downloadAdmin(int $bookingId, int $documentId): Response
    {
        $document = DocBooking::query()
            ->where('id_doc_booking', $documentId)
            ->where('id_booking', $bookingId)
            ->first();

        if (! $document) {
            return response()->json(['message' => 'Dokumen tidak ditemukan.'], 404);
        }

        return $this->downloadDocument($document);
    }

    private function downloadDocument(DocBooking $document): Response
    {
        $source = $this->documentStorageService->resolveReadableSource($document);

        if ($source) {
            if ($source['type'] === 'disk') {
                return $this->applyDownloadHeaders(response()->download(
                    Storage::disk($source['disk'])->path($source['path']),
                    $document->nama_file
                ), $document);
            }

            return $this->applyDownloadHeaders(
                response()->download($source['path'], $document->nama_file),
                $document
            );
        }

        if ($document->isBackedUp() && $document->backup_provider === 'r2') {
            $objectKey = trim((string) ($document->backup_object_key ?: $document->backup_file_id));

            return $this->applyDownloadHeaders(response()->streamDownload(function () use ($objectKey): void {
                $stream = $this->r2BackupService->readStream($objectKey);

                try {
                    fpassthru($stream);
                } finally {
                    fclose($stream);
                }
            }, $document->nama_file), $document);
        }

        if ($document->isBackedUp() && $document->backup_provider === 'google_drive') {
            $content = $this->googleDriveBackupService->downloadFileContents((string) $document->backup_file_id);

            return $this->applyDownloadHeaders(response()->streamDownload(function () use ($content): void {
                echo $content;
            }, $document->nama_file), $document);
        }

        return response()->json(['message' => 'Dokumen tidak tersedia.'], 404);
    }

    private function applyDownloadHeaders(Response $response, DocBooking $document): Response
    {
        foreach ($this->downloadHeaders($document) as $header => $value) {
            $response->headers->set($header, $value, true);
        }

        return $response;
    }

    private function downloadHeaders(DocBooking $document): array
    {
        return [
            'Content-Type' => $document->mime_type ?: 'application/octet-stream',
            'Cache-Control' => 'private, no-store, no-cache, must-revalidate, max-age=0',
            'Pragma' => 'no-cache',
            'Expires' => '0',
            'X-Content-Type-Options' => 'nosniff',
            'X-Frame-Options' => 'DENY',
        ];
    }
}
