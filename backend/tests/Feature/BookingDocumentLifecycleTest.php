<?php

namespace Tests\Feature;

use App\Jobs\BackupBookingDocumentJob;
use App\Models\Booking;
use App\Models\DocBooking;
use App\Models\Perumahan;
use App\Models\PerumahanUnit;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class BookingDocumentLifecycleTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_stores_new_booking_documents_in_private_storage_and_dispatches_backup_jobs(): void
    {
        Storage::fake('local');
        Queue::fake();

        config([
            'documents.primary_disk' => 'local',
            'documents.backup.enabled' => true,
            'documents.backup.provider' => 'r2',
        ]);

        $user = $this->createUserWithRole('user', 'user@example.com', '6281111111111');
        [$property, $unit] = $this->createPropertyAndUnit();

        Sanctum::actingAs($user);

        $response = $this->post('/api/bookings', [
            'id_perumahan' => $property->id_perumahan,
            'id_unit_perumahan' => $unit->id_unit_perumahan,
            'no_rekening' => '1234567890',
            'range_harga_dp' => 'Rp 5.000.000',
            'pekerjaan' => 'Pegawai Swasta',
            'jenis_pekerjaan' => 'fixed_income',
            'gaji_bulanan' => 15000000,
            'memiliki_angsuran_lain' => false,
            'persetujuan_syarat' => '1',
            'dokumen' => UploadedFile::fake()->create('dokumen-booking.pdf', 200, 'application/pdf'),
            'bukti_transfer_utj' => UploadedFile::fake()->image('bukti-transfer.jpg')->size(300),
        ]);

        $response
            ->assertCreated()
            ->assertJson([
                'message' => 'Booking berhasil diajukan.',
            ]);

        $bookingId = (int) $response->json('booking.id');
        $documents = DocBooking::query()
            ->where('id_booking', $bookingId)
            ->orderBy('id_doc_booking')
            ->get();

        $this->assertCount(2, $documents);
        foreach ($documents as $document) {
            $this->assertSame('local', $document->storage_disk);
            $this->assertSame('pending', $document->backup_status);
            $this->assertNotEmpty($document->storage_path);
            Storage::disk('local')->assertExists($document->storage_path);
        }

        Queue::assertPushed(BackupBookingDocumentJob::class, 2);
    }

    public function test_document_backup_job_copies_private_document_to_r2(): void
    {
        Storage::fake('local');
        Storage::fake('r2');

        config([
            'documents.backup.enabled' => true,
            'documents.backup.provider' => 'r2',
            'documents.backup.disk' => 'r2',
            'documents.backup.prefix' => 'documents',
            'filesystems.disks.r2.key' => 'test-key',
            'filesystems.disks.r2.secret' => 'test-secret',
            'filesystems.disks.r2.bucket' => 'test-bucket',
            'filesystems.disks.r2.endpoint' => 'https://example.r2.cloudflarestorage.com',
        ]);

        $user = $this->createUserWithRole('user', 'r2@example.com', '6281999999999');
        [$booking, $document] = $this->createBookingWithDocument($user, 'local', [
            'backup_provider' => 'r2',
            'backup_status' => 'pending',
        ]);

        (new BackupBookingDocumentJob((int) $document->id_doc_booking))->handle(
            app(\App\Services\Documents\CloudflareR2DocumentBackupService::class)
        );

        $freshDocument = $document->fresh();

        $this->assertSame('backed_up', $freshDocument->backup_status);
        $this->assertSame('r2', $freshDocument->backup_provider);
        $this->assertSame('r2', $freshDocument->backup_disk);
        $this->assertSame('documents/'.$document->storage_path, $freshDocument->backup_object_key);
        Storage::disk('r2')->assertExists($freshDocument->backup_object_key);
        $this->assertSame(
            Storage::disk('local')->get($document->storage_path),
            Storage::disk('r2')->get($freshDocument->backup_object_key)
        );
        $this->assertNull($freshDocument->deleted_local_at);
    }

    public function test_user_can_download_own_booking_document_via_protected_endpoint(): void
    {
        Storage::fake('local');

        $user = $this->createUserWithRole('user', 'owner@example.com', '6281222222222');
        [$booking, $document] = $this->createBookingWithDocument($user, 'local');

        Sanctum::actingAs($user);

        $response = $this->get("/api/bookings/me/{$booking->id_booking}/documents/{$document->id_doc_booking}/download");

        $cacheControl = (string) $response->headers->get('Cache-Control');

        $response
            ->assertOk()
            ->assertDownload('dokumen-kpr.pdf')
            ->assertHeader('X-Content-Type-Options', 'nosniff');

        $this->assertStringContainsString('no-store', $cacheControl);
        $this->assertStringContainsString('no-cache', $cacheControl);
        $this->assertStringContainsString('private', $cacheControl);
    }

    public function test_user_cannot_download_other_users_booking_document(): void
    {
        Storage::fake('local');

        $owner = $this->createUserWithRole('user', 'owner2@example.com', '6281333333333');
        $anotherUser = $this->createUserWithRole('user', 'guest@example.com', '6281444444444');
        [$booking, $document] = $this->createBookingWithDocument($owner, 'local');

        Sanctum::actingAs($anotherUser);

        $response = $this->get("/api/bookings/me/{$booking->id_booking}/documents/{$document->id_doc_booking}/download");

        $response->assertNotFound();
    }

    public function test_admin_can_download_booking_document_from_admin_endpoint(): void
    {
        Storage::fake('local');

        $owner = $this->createUserWithRole('user', 'booking-owner@example.com', '6281555555555');
        $admin = $this->createUserWithRole('admin', 'admin@example.com', '6281666666666');
        [$booking, $document] = $this->createBookingWithDocument($owner, 'local');

        Sanctum::actingAs($admin);

        $response = $this->get("/api/admin/bookings/{$booking->id_booking}/documents/{$document->id_doc_booking}/download");

        $response->assertOk();
        $response->assertDownload('dokumen-kpr.pdf');
    }

    public function test_prune_command_deletes_only_backed_up_documents_that_have_passed_retention(): void
    {
        Storage::fake('local');

        $user = $this->createUserWithRole('user', 'prune@example.com', '6281777777777');
        [$booking, $eligibleDocument] = $this->createBookingWithDocument($user, 'local');
        [$__, $pendingDocument] = $this->createBookingWithDocument($user, 'local', [
            'nama_file' => 'dokumen-pending.pdf',
            'stored_filename' => 'dokumen-pending.pdf',
            'storage_path' => 'bookings/'.$booking->id_booking.'/documents/dokumen-pending.pdf',
            'path_file' => 'bookings/'.$booking->id_booking.'/documents/dokumen-pending.pdf',
            'backup_status' => 'pending',
            'backup_file_id' => null,
            'retention_until' => now()->subDay(),
        ]);

        $eligibleDocument->forceFill([
            'backup_status' => 'backed_up',
            'backup_file_id' => 'drive-file-id-123',
            'backup_object_key' => 'drive-file-id-123',
            'retention_until' => now()->subDay(),
        ])->save();

        Storage::disk('local')->put($eligibleDocument->storage_path, 'dokumen-selesai');
        Storage::disk('local')->put($pendingDocument->storage_path, 'dokumen-pending');

        $exitCode = Artisan::call('documents:prune-local', [
            '--limit' => 50,
        ]);

        $this->assertSame(0, $exitCode);
        Storage::disk('local')->assertMissing($eligibleDocument->storage_path);
        Storage::disk('local')->assertExists($pendingDocument->storage_path);
        $this->assertNotNull($eligibleDocument->fresh()->deleted_local_at);
        $this->assertNull($pendingDocument->fresh()->deleted_local_at);
    }

    public function test_migrate_command_moves_legacy_public_documents_into_private_storage(): void
    {
        Storage::fake('local');
        config(['documents.backup.enabled' => false]);

        $user = $this->createUserWithRole('user', 'legacy@example.com', '6281888888888');
        [$property, $unit] = $this->createPropertyAndUnit();

        $booking = Booking::query()->create([
            'id_user' => $user->id_user,
            'id_perumahan' => $property->id_perumahan,
            'id_unit_perumahan' => $unit->id_unit_perumahan,
            'kode_booking' => 'BK-LEGACY-'.Str::uuid()->toString(),
            'status_booking' => 'Menunggu',
            'catatan_user' => null,
            'no_rekening' => '1234567890',
            'range_harga_dp' => 'Rp 5.000.000',
            'pekerjaan' => 'Pegawai',
            'jenis_pekerjaan' => 'fixed_income',
            'gaji_bulanan' => 8000000,
            'memiliki_angsuran_lain' => false,
        ]);

        $legacyFilename = Str::uuid()->toString().'.pdf';
        $legacyRelativePath = '/uploads/booking-documents/'.$legacyFilename;
        $legacyAbsolutePath = public_path(ltrim($legacyRelativePath, '/'));
        $legacyDirectory = dirname($legacyAbsolutePath);

        if (! is_dir($legacyDirectory)) {
            mkdir($legacyDirectory, 0755, true);
        }

        file_put_contents($legacyAbsolutePath, 'isi-dokumen-legacy');

        try {
            $document = DocBooking::query()->create([
                'id_booking' => $booking->id_booking,
                'jenis_dokumen' => 'Dokumen Booking',
                'nama_file' => 'dokumen-legacy.pdf',
                'path_file' => $legacyRelativePath,
                'storage_disk' => null,
                'storage_path' => null,
                'stored_filename' => null,
                'mime_type' => 'application/pdf',
                'file_size_kb' => 1,
                'sha256_checksum' => hash('sha256', 'isi-dokumen-legacy'),
                'backup_provider' => null,
                'backup_status' => 'disabled',
                'backup_file_id' => null,
                'backup_disk' => null,
                'backup_object_key' => null,
                'backup_checksum' => null,
                'backup_size_bytes' => null,
                'backup_synced_at' => null,
                'backup_last_error' => null,
                'retention_until' => null,
                'deleted_local_at' => null,
                'uploaded_at' => now(),
            ]);

            $exitCode = Artisan::call('documents:migrate-legacy-public-files', [
                '--limit' => 50,
            ]);

            $this->assertSame(0, $exitCode);

            $freshDocument = $document->fresh();
            $this->assertSame('local', $freshDocument->storage_disk);
            $this->assertNotEmpty($freshDocument->storage_path);
            Storage::disk('local')->assertExists($freshDocument->storage_path);
            $this->assertFileDoesNotExist($legacyAbsolutePath);
        } finally {
            if (is_file($legacyAbsolutePath)) {
                @unlink($legacyAbsolutePath);
            }
        }
    }

    private function createBookingWithDocument(User $user, string $disk, array $overrides = []): array
    {
        [$property, $unit] = $this->createPropertyAndUnit();

        $booking = Booking::query()->create([
            'id_user' => $user->id_user,
            'id_perumahan' => $property->id_perumahan,
            'id_unit_perumahan' => $unit->id_unit_perumahan,
            'kode_booking' => 'BK-TEST-'.Str::uuid()->toString(),
            'status_booking' => 'Menunggu',
            'catatan_user' => null,
            'no_rekening' => '1234567890',
            'range_harga_dp' => 'Rp 5.000.000',
            'pekerjaan' => 'Pegawai',
            'jenis_pekerjaan' => 'fixed_income',
            'gaji_bulanan' => 8000000,
            'memiliki_angsuran_lain' => false,
        ]);

        $storagePath = $overrides['storage_path'] ?? 'bookings/'.$booking->id_booking.'/documents/dokumen-kpr.pdf';
        Storage::disk($disk)->put($storagePath, 'isi-dokumen');

        $document = DocBooking::query()->create(array_merge([
            'id_booking' => $booking->id_booking,
            'jenis_dokumen' => 'Dokumen Booking',
            'nama_file' => 'dokumen-kpr.pdf',
            'path_file' => $storagePath,
            'storage_disk' => $disk,
            'storage_path' => $storagePath,
            'stored_filename' => 'dokumen-kpr.pdf',
            'mime_type' => 'application/pdf',
            'file_size_kb' => 1,
            'sha256_checksum' => hash('sha256', 'isi-dokumen'),
            'backup_provider' => 'google_drive',
            'backup_status' => 'disabled',
            'backup_file_id' => null,
            'backup_disk' => null,
            'backup_object_key' => null,
            'backup_checksum' => null,
            'backup_size_bytes' => null,
            'backup_synced_at' => null,
            'backup_last_error' => null,
            'retention_until' => null,
            'deleted_local_at' => null,
            'uploaded_at' => now(),
        ], $overrides));

        return [$booking, $document];
    }

    private function createPropertyAndUnit(): array
    {
        $property = Perumahan::query()->create([
            'nama_perumahan' => 'Perumahan Test',
            'lokasi' => 'Jakarta',
            'deskripsi' => 'Perumahan untuk test',
            'harga' => 350000000,
            'jumlah_seluruh_unit' => 10,
            'jumlah_unit_tersedia' => 10,
            'status_aktif' => true,
        ]);

        $unit = PerumahanUnit::query()->create([
            'id_perumahan' => $property->id_perumahan,
            'nama_blok' => 'Blok A',
            'kode_blok' => 'A',
            'nomor_unit' => 1,
            'kode_unit' => 'A1',
            'status_unit' => 'available',
            'id_booking_terakhir' => null,
            'sales_mode' => 'ready_stock',
            'estimated_completion_date' => null,
        ]);

        return [$property, $unit];
    }

    private function createUserWithRole(string $roleName, string $email, string $phone): User
    {
        $role = Role::query()->firstOrCreate(
            ['nama_role' => $roleName],
            ['deskripsi' => ucfirst($roleName)]
        );

        return User::query()->create([
            'id_role' => $role->id_role,
            'nama' => ucfirst($roleName).' User',
            'email' => $email,
            'no_hp' => $phone,
            'password_hash' => 'Password123',
            'alamat' => 'Alamat test',
            'is_active' => true,
        ]);
    }
}
