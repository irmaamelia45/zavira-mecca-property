<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Jobs\BackupBookingDocumentJob;
use App\Jobs\SendWhatsappMessageJob;
use App\Models\Booking;
use App\Models\Perumahan;
use App\Models\PerumahanUnit;
use App\Models\User;
use App\Services\Documents\BookingDocumentStorageService;
use App\Services\Whatsapp\WhatsappMessageTemplateService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Throwable;

class BookingController extends Controller
{
    public function __construct(
        private readonly BookingDocumentStorageService $documentStorageService,
    ) {}

    public function indexMine(Request $request)
    {
        $bookings = Booking::query()
            ->where('id_user', $request->user()->id_user)
            ->with([
                'perumahan:id_perumahan,nama_perumahan,lokasi,harga',
                'unitPerumahan:id_unit_perumahan,id_perumahan,nama_blok,kode_blok,kode_unit,status_unit,sales_mode,estimated_completion_date',
            ])
            ->orderByDesc('created_at')
            ->get();

        return response()->json($bookings->map(fn ($booking) => $this->formatBooking($booking)));
    }

    public function showMine(Request $request, $id)
    {
        $booking = Booking::query()
            ->where('id_user', $request->user()->id_user)
            ->with([
                'perumahan:id_perumahan,nama_perumahan,lokasi,harga',
                'documents:id_doc_booking,id_booking,jenis_dokumen,nama_file,path_file,mime_type,file_size_kb,uploaded_at,backup_status,deleted_local_at,storage_disk,storage_path',
                'unitPerumahan:id_unit_perumahan,id_perumahan,nama_blok,kode_blok,kode_unit,status_unit,sales_mode,estimated_completion_date',
            ])
            ->find($id);

        if (! $booking) {
            return response()->json(['message' => 'Detail booking tidak ditemukan.'], 404);
        }

        return response()->json($this->formatBooking($booking));
    }

    public function indexAdmin(Request $request)
    {
        $query = Booking::query()
            ->with([
                'user:id_user,nama,email,no_hp',
                'perumahan:id_perumahan,nama_perumahan,tipe_unit,lokasi,harga',
                'documents:id_doc_booking,id_booking,jenis_dokumen,nama_file,path_file,mime_type,file_size_kb,uploaded_at,backup_status,deleted_local_at,storage_disk,storage_path',
                'unitPerumahan:id_unit_perumahan,id_perumahan,nama_blok,kode_blok,kode_unit,status_unit,sales_mode,estimated_completion_date',
            ])
            ->orderByDesc('tanggal_booking');

        if ($request->filled('status')) {
            $query->where('status_booking', $request->query('status'));
        }

        $bookings = $query->get();

        return response()->json($bookings->map(fn (Booking $booking) => $this->formatBookingAdmin($booking)));
    }

    public function showAdmin($id)
    {
        $booking = Booking::query()
            ->with([
                'user:id_user,nama,email,no_hp',
                'perumahan:id_perumahan,nama_perumahan,tipe_unit,lokasi,harga',
                'documents:id_doc_booking,id_booking,jenis_dokumen,nama_file,path_file,mime_type,file_size_kb,uploaded_at,backup_status,deleted_local_at,storage_disk,storage_path',
                'unitPerumahan:id_unit_perumahan,id_perumahan,nama_blok,kode_blok,kode_unit,status_unit,sales_mode,estimated_completion_date',
            ])
            ->find($id);

        if (! $booking) {
            return response()->json(['message' => 'Detail booking tidak ditemukan.'], 404);
        }

        return response()->json($this->formatBookingAdmin($booking));
    }

    public function updateStatusAdmin(Request $request, $id)
    {
        $validated = $request->validate([
            'status_booking' => [
                'required',
                Rule::in([
                    'Menunggu',
                    'Menunggu Konfirmasi',
                    'Disetujui',
                    'Ditolak',
                    'Dibatalkan',
                    'Selesai',
                ]),
            ],
            'catatan_admin' => 'nullable|string|max:255',
        ]);

        $nextStatus = $validated['status_booking'];

        $result = DB::transaction(function () use ($id, $validated, $nextStatus) {
            $booking = Booking::query()
                ->with(['perumahan:id_perumahan,jumlah_unit_tersedia'])
                ->lockForUpdate()
                ->find($id);

            if (! $booking) {
                return null;
            }

            $previousStatus = $booking->status_booking;
            $attributes = [
                'status_booking' => $nextStatus,
                'catatan_admin' => $validated['catatan_admin'] ?? $booking->catatan_admin,
            ];

            if ($nextStatus === 'Disetujui' && $previousStatus !== 'Disetujui') {
                $attributes['approved_at'] = now();
            }

            if ($nextStatus === 'Ditolak' && $previousStatus !== 'Ditolak') {
                $attributes['rejected_at'] = now();
            }

            if ($nextStatus === 'Dibatalkan' && $previousStatus !== 'Dibatalkan') {
                $attributes['canceled_at'] = now();
            }

            if ($nextStatus === 'Selesai' && $previousStatus !== 'Selesai') {
                $attributes['finished_at'] = now();
            }

            $booking->update($attributes);

            $unit = null;
            if ($booking->id_unit_perumahan) {
                $unit = PerumahanUnit::query()
                    ->where('id_unit_perumahan', $booking->id_unit_perumahan)
                    ->where('id_perumahan', $booking->id_perumahan)
                    ->lockForUpdate()
                    ->first();
            }

            if ($unit) {
                $previousUnitStatus = $unit->status_unit;
                $nextUnitStatus = $this->mapBookingStatusToUnitStatus($nextStatus);

                if ($previousUnitStatus !== $nextUnitStatus) {
                    $this->syncAvailableUnitCounter($booking->id_perumahan, $previousUnitStatus, $nextUnitStatus);
                }

                $unit->status_unit = $nextUnitStatus;
                $unit->id_booking_terakhir = $nextUnitStatus === 'available'
                    ? null
                    : $booking->id_booking;
                $unit->save();
            } else {
                if ($nextStatus === 'Disetujui' && $previousStatus !== 'Disetujui') {
                    $this->syncAvailableUnitCounter($booking->id_perumahan, 'available', 'pending');
                }

                if (
                    $nextStatus === 'Dibatalkan'
                    && $previousStatus === 'Disetujui'
                ) {
                    $this->syncAvailableUnitCounter($booking->id_perumahan, 'pending', 'available');
                }
            }

            $booking->load([
                'user:id_user,nama,email,no_hp',
                'perumahan:id_perumahan,nama_perumahan,tipe_unit,lokasi,harga',
                'documents:id_doc_booking,id_booking,jenis_dokumen,nama_file,path_file,mime_type,file_size_kb,uploaded_at,backup_status,deleted_local_at,storage_disk,storage_path',
                'unitPerumahan:id_unit_perumahan,id_perumahan,nama_blok,kode_blok,kode_unit,status_unit,sales_mode,estimated_completion_date',
            ]);

            $this->documentStorageService->syncRetentionForBooking($booking);

            return [
                'booking' => $booking,
                'previous_status' => $previousStatus,
            ];
        });

        if (! $result) {
            return response()->json(['message' => 'Booking tidak ditemukan.'], 404);
        }

        $booking = $result['booking'];
        $previousStatus = (string) $result['previous_status'];
        if ($previousStatus !== (string) $booking->status_booking) {
            $this->dispatchBookingStatusChangedNotification($booking);
        }

        return response()->json([
            'message' => 'Status booking berhasil diperbarui.',
            'booking' => $this->formatBookingAdmin($booking),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'id_perumahan' => 'required|integer|exists:perumahan,id_perumahan',
            'id_unit_perumahan' => 'required|integer',
            'catatan_user' => 'nullable|string|max:255',
            'no_rekening' => 'required|string|max:50',
            'range_harga_dp' => 'required|string|max:120',
            'pekerjaan' => 'required|string|max:100',
            'jenis_pekerjaan' => ['required', Rule::in(['fixed_income', 'non_fixed_income'])],
            'gaji_bulanan' => 'required|integer|min:0',
            'memiliki_angsuran_lain' => 'required|boolean',
            'dokumen' => 'required|file|mimes:pdf|mimetypes:application/pdf|max:5120',
            'bukti_transfer_utj' => 'required|file|mimes:jpg,jpeg,png|mimetypes:image/jpeg,image/png|max:1024',
            'persetujuan_syarat' => 'accepted',
        ], [
            'range_harga_dp.required' => 'Nominal DP wajib diisi.',
            'persetujuan_syarat.accepted' => 'Anda wajib menyetujui syarat dan ketentuan booking.',
        ]);

        $storedPathsForCleanup = [];
        $documentsToBackup = [];

        try {
            $booking = DB::transaction(function () use ($request, $validated, &$storedPathsForCleanup, &$documentsToBackup) {
                $unit = PerumahanUnit::query()
                    ->where('id_unit_perumahan', $validated['id_unit_perumahan'])
                    ->where('id_perumahan', $validated['id_perumahan'])
                    ->lockForUpdate()
                    ->first();

                if (! $unit) {
                    throw ValidationException::withMessages([
                        'id_unit_perumahan' => ['Unit tidak ditemukan pada perumahan yang dipilih.'],
                    ]);
                }

                if ($unit->status_unit !== 'available') {
                    throw ValidationException::withMessages([
                        'id_unit_perumahan' => ['Unit sudah tidak tersedia. Silakan pilih unit lain.'],
                    ]);
                }

                $booking = Booking::create([
                    'id_user' => $request->user()->id_user,
                    'id_perumahan' => $validated['id_perumahan'],
                    'id_unit_perumahan' => $unit->id_unit_perumahan,
                    'kode_booking' => $this->generateBookingCode(),
                    'status_booking' => 'Menunggu',
                    'catatan_user' => $validated['catatan_user'] ?? null,
                    'no_rekening' => preg_replace('/\D+/', '', (string) $validated['no_rekening']) ?: (string) $validated['no_rekening'],
                    'range_harga_dp' => trim((string) $validated['range_harga_dp']),
                    'pekerjaan' => $validated['pekerjaan'],
                    'jenis_pekerjaan' => $validated['jenis_pekerjaan'],
                    'gaji_bulanan' => $validated['gaji_bulanan'],
                    'memiliki_angsuran_lain' => (bool) $validated['memiliki_angsuran_lain'],
                ]);

                if ($request->hasFile('dokumen')) {
                    $document = $this->documentStorageService->storeUploadedDocument(
                        bookingId: (int) $booking->id_booking,
                        file: $request->file('dokumen'),
                        documentType: 'Dokumen Booking',
                        folder: 'documents',
                    );

                    $storedPathsForCleanup[] = [
                        'disk' => (string) $document->storage_disk,
                        'path' => (string) $document->storage_path,
                    ];

                    if ($document->backup_status === 'pending') {
                        $documentsToBackup[] = (int) $document->id_doc_booking;
                    }
                }

                if ($request->hasFile('bukti_transfer_utj')) {
                    $document = $this->documentStorageService->storeUploadedDocument(
                        bookingId: (int) $booking->id_booking,
                        file: $request->file('bukti_transfer_utj'),
                        documentType: 'Bukti Transfer UTJ',
                        folder: 'transfer-proofs',
                    );

                    $storedPathsForCleanup[] = [
                        'disk' => (string) $document->storage_disk,
                        'path' => (string) $document->storage_path,
                    ];

                    if ($document->backup_status === 'pending') {
                        $documentsToBackup[] = (int) $document->id_doc_booking;
                    }
                }

                $unit->update([
                    'status_unit' => 'pending',
                    'id_booking_terakhir' => $booking->id_booking,
                ]);

                $this->syncAvailableUnitCounter($booking->id_perumahan, 'available', 'pending');

                return $booking->fresh([
                    'user:id_user,nama,no_hp',
                    'perumahan:id_perumahan,nama_perumahan,lokasi,harga',
                    'documents:id_doc_booking,id_booking,jenis_dokumen,nama_file,path_file,mime_type,file_size_kb,uploaded_at,backup_status,deleted_local_at,storage_disk,storage_path',
                    'unitPerumahan:id_unit_perumahan,id_perumahan,nama_blok,kode_blok,kode_unit,status_unit,sales_mode,estimated_completion_date',
                ]);
            });
        } catch (Throwable $exception) {
            foreach ($storedPathsForCleanup as $storedPath) {
                $this->documentStorageService->cleanupStoredPath(
                    (string) ($storedPath['disk'] ?? ''),
                    (string) ($storedPath['path'] ?? '')
                );
            }

            throw $exception;
        }

        foreach ($documentsToBackup as $documentId) {
            BackupBookingDocumentJob::dispatch($documentId);
        }

        $this->dispatchBookingCreatedNotifications($booking);

        return response()->json([
            'message' => 'Booking berhasil diajukan.',
            'booking' => $this->formatBooking($booking),
        ], 201);
    }

    private function dispatchBookingCreatedNotifications(Booking $booking): void
    {
        $booking->loadMissing([
            'user:id_user,nama,no_hp',
            'perumahan:id_perumahan,nama_perumahan,tipe_unit,id_marketing_user',
            'unitPerumahan:id_unit_perumahan,id_perumahan,nama_blok,kode_blok,kode_unit,status_unit,sales_mode,estimated_completion_date',
        ]);

        $templateService = app(WhatsappMessageTemplateService::class);

        $admins = User::query()
            ->where('is_active', true)
            ->whereHas('role', function ($query) {
                $query->whereIn('nama_role', ['admin', 'superadmin']);
            })
            ->get(['id_user', 'nama', 'no_hp']);

        $messageToAdmin = $templateService->buildAdminBookingMasukMessage($booking);
        foreach ($admins as $admin) {
            if (! $admin->no_hp) {
                continue;
            }

            SendWhatsappMessageJob::dispatch(
                event: 'new_booking_admin',
                recipientUserId: (int) $admin->id_user,
                targetPhone: (string) $admin->no_hp,
                message: $messageToAdmin,
                bookingId: (int) $booking->id_booking,
                statusBookingAtSend: (string) $booking->status_booking,
            );
        }

        $this->dispatchMarketingBookingCreatedNotification($booking, $templateService);

        if (! $booking->user?->no_hp) {
            return;
        }

        $messageToUser = $templateService->buildUserBookingCreatedMessage($booking);

        SendWhatsappMessageJob::dispatch(
            event: 'new_booking_user',
            recipientUserId: (int) $booking->user->id_user,
            targetPhone: (string) $booking->user->no_hp,
            message: $messageToUser,
            bookingId: (int) $booking->id_booking,
            statusBookingAtSend: (string) $booking->status_booking,
        );
    }

    private function dispatchBookingStatusChangedNotification(Booking $booking): void
    {
        $booking->loadMissing([
            'user:id_user,nama,no_hp',
            'perumahan:id_perumahan,nama_perumahan,tipe_unit,id_marketing_user',
            'unitPerumahan:id_unit_perumahan,id_perumahan,nama_blok,kode_blok,kode_unit,status_unit,sales_mode,estimated_completion_date',
        ]);

        $templateService = app(WhatsappMessageTemplateService::class);
        $this->dispatchMarketingBookingStatusChangedNotification($booking, $templateService);

        if (! $booking->user?->no_hp) {
            return;
        }

        $message = $templateService->buildUserBookingStatusChangedMessage($booking);

        SendWhatsappMessageJob::dispatch(
            event: 'booking_status',
            recipientUserId: (int) $booking->user->id_user,
            targetPhone: (string) $booking->user->no_hp,
            message: $message,
            bookingId: (int) $booking->id_booking,
            statusBookingAtSend: (string) $booking->status_booking,
        );
    }

    private function dispatchMarketingBookingCreatedNotification(Booking $booking, WhatsappMessageTemplateService $templateService): void
    {
        $marketingRecipient = $this->resolveActiveMarketingRecipient($booking);
        if (! $marketingRecipient) {
            return;
        }

        $message = $templateService->buildMarketingBookingCreatedMessage($booking);

        SendWhatsappMessageJob::dispatch(
            event: 'new_booking_mkt',
            recipientUserId: (int) $marketingRecipient->id_user,
            targetPhone: (string) $marketingRecipient->no_hp,
            message: $message,
            bookingId: (int) $booking->id_booking,
            statusBookingAtSend: (string) $booking->status_booking,
        );
    }

    private function dispatchMarketingBookingStatusChangedNotification(Booking $booking, WhatsappMessageTemplateService $templateService): void
    {
        $marketingRecipient = $this->resolveActiveMarketingRecipient($booking);
        if (! $marketingRecipient) {
            return;
        }

        $message = $templateService->buildMarketingBookingStatusChangedMessage($booking);
        if (! $message) {
            return;
        }

        SendWhatsappMessageJob::dispatch(
            event: 'booking_status_mkt',
            recipientUserId: (int) $marketingRecipient->id_user,
            targetPhone: (string) $marketingRecipient->no_hp,
            message: $message,
            bookingId: (int) $booking->id_booking,
            statusBookingAtSend: (string) $booking->status_booking,
        );
    }

    private function resolveActiveMarketingRecipient(Booking $booking): ?User
    {
        $marketingUserId = (int) Perumahan::query()
            ->where('id_perumahan', $booking->id_perumahan)
            ->value('id_marketing_user');

        if ($marketingUserId <= 0) {
            return null;
        }

        $marketingUser = User::query()
            ->where('id_user', $marketingUserId)
            ->where('is_active', true)
            ->whereHas('role', function ($query) {
                $query->where('nama_role', 'marketing');
            })
            ->first(['id_user', 'no_hp']);

        if (! $marketingUser || ! $marketingUser->no_hp) {
            return null;
        }

        return $marketingUser;
    }

    private function generateBookingCode(): string
    {
        do {
            $code = 'BK-'.now()->format('Ymd').'-'.str_pad((string) random_int(1, 9999), 4, '0', STR_PAD_LEFT);
        } while (Booking::query()->where('kode_booking', $code)->exists());

        return $code;
    }

    private function mapBookingStatusToUnitStatus(string $bookingStatus): string
    {
        if ($bookingStatus === 'Selesai') {
            return 'sold';
        }

        if (in_array($bookingStatus, ['Ditolak', 'Dibatalkan'], true)) {
            return 'available';
        }

        return 'pending';
    }

    private function syncAvailableUnitCounter(int $propertyId, string $fromStatus, string $toStatus): void
    {
        $fromAvailable = $fromStatus === 'available';
        $toAvailable = $toStatus === 'available';

        if ($fromAvailable === $toAvailable) {
            return;
        }

        $property = Perumahan::query()
            ->where('id_perumahan', $propertyId)
            ->lockForUpdate()
            ->first();

        if (! $property) {
            return;
        }

        $current = (int) $property->jumlah_unit_tersedia;
        if ($fromAvailable && ! $toAvailable) {
            $property->jumlah_unit_tersedia = max(0, $current - 1);
        } elseif (! $fromAvailable && $toAvailable) {
            $property->jumlah_unit_tersedia = min((int) $property->jumlah_seluruh_unit, $current + 1);
        }

        $property->save();
    }

    private function formatBooking(Booking $booking): array
    {
        $documents = $booking->relationLoaded('documents')
            ? $booking->documents->map(fn ($doc) => [
                'id' => $doc->id_doc_booking,
                'jenis_dokumen' => $doc->jenis_dokumen,
                'nama_file' => $doc->nama_file,
                'mime_type' => $doc->mime_type,
                'file_size_kb' => $doc->file_size_kb,
                'backup_status' => $doc->backup_status,
                'deleted_local_at' => optional($doc->deleted_local_at)->toDateTimeString(),
                'download_url' => route('bookings.documents.mine.download', [
                    'bookingId' => $booking->id_booking,
                    'documentId' => $doc->id_doc_booking,
                ], false),
                'uploaded_at' => optional($doc->uploaded_at)->toDateTimeString(),
            ])->values()->all()
            : [];

        return [
            'id' => $booking->id_booking,
            'kode_booking' => $booking->kode_booking,
            'tanggal_booking' => optional($booking->tanggal_booking)->toDateTimeString(),
            'status_booking' => $booking->status_booking,
            'catatan_user' => $booking->catatan_user,
            'no_rekening' => $booking->no_rekening,
            'range_harga_dp' => $booking->range_harga_dp,
            'pekerjaan' => $booking->pekerjaan,
            'jenis_pekerjaan' => $booking->jenis_pekerjaan,
            'gaji_bulanan' => $booking->gaji_bulanan,
            'memiliki_angsuran_lain' => (bool) $booking->memiliki_angsuran_lain,
            'catatan_admin' => $booking->catatan_admin,
            'approved_at' => optional($booking->approved_at)->toDateTimeString(),
            'rejected_at' => optional($booking->rejected_at)->toDateTimeString(),
            'canceled_at' => optional($booking->canceled_at)->toDateTimeString(),
            'finished_at' => optional($booking->finished_at)->toDateTimeString(),
            'cancel_reason' => $booking->cancel_reason,
            'cancel_note' => $booking->cancel_note,
            'unit' => [
                'id' => $booking->unitPerumahan?->id_unit_perumahan,
                'block_name' => $booking->unitPerumahan?->nama_blok,
                'block_code' => $booking->unitPerumahan?->kode_blok,
                'code' => $booking->unitPerumahan?->kode_unit,
                'status' => $booking->unitPerumahan?->status_unit,
                'sales_mode' => $booking->unitPerumahan?->sales_mode ?: 'ready_stock',
                'estimated_completion_date' => optional($booking->unitPerumahan?->estimated_completion_date)->toDateString(),
            ],
            'perumahan' => [
                'id' => $booking->perumahan?->id_perumahan,
                'nama' => $booking->perumahan?->nama_perumahan,
                'lokasi' => $booking->perumahan?->lokasi,
                'harga' => $booking->perumahan?->harga,
            ],
            'documents' => $documents,
        ];
    }

    private function formatBookingAdmin(Booking $booking): array
    {
        $documents = $booking->documents
            ? $booking->documents->map(fn ($doc) => [
                'id' => $doc->id_doc_booking,
                'jenis_dokumen' => $doc->jenis_dokumen,
                'nama_file' => $doc->nama_file,
                'mime_type' => $doc->mime_type,
                'file_size_kb' => $doc->file_size_kb,
                'backup_status' => $doc->backup_status,
                'deleted_local_at' => optional($doc->deleted_local_at)->toDateTimeString(),
                'download_url' => route('admin.bookings.documents.download', [
                    'bookingId' => $booking->id_booking,
                    'documentId' => $doc->id_doc_booking,
                ], false),
            ])->values()->all()
            : [];

        return [
            'id' => $booking->id_booking,
            'code' => $booking->kode_booking,
            'date' => optional($booking->tanggal_booking)->toDateTimeString(),
            'status' => $booking->status_booking,
            'no_rekening' => $booking->no_rekening,
            'range_harga_dp' => $booking->range_harga_dp,
            'unit' => [
                'id' => $booking->unitPerumahan?->id_unit_perumahan,
                'block_name' => $booking->unitPerumahan?->nama_blok,
                'block_code' => $booking->unitPerumahan?->kode_blok,
                'code' => $booking->unitPerumahan?->kode_unit,
                'status' => $booking->unitPerumahan?->status_unit,
                'sales_mode' => $booking->unitPerumahan?->sales_mode ?: 'ready_stock',
                'estimated_completion_date' => optional($booking->unitPerumahan?->estimated_completion_date)->toDateString(),
            ],
            'user' => [
                'id' => $booking->user?->id_user,
                'name' => $booking->user?->nama,
                'email' => $booking->user?->email,
                'phone' => $booking->user?->no_hp,
            ],
            'property' => [
                'id' => $booking->perumahan?->id_perumahan,
                'name' => $booking->perumahan?->nama_perumahan,
                'type' => $booking->perumahan?->tipe_unit,
                'location' => $booking->perumahan?->lokasi,
                'price' => $booking->perumahan?->harga,
            ],
            'catatan_user' => $booking->catatan_user,
            'pekerjaan' => $booking->pekerjaan,
            'jenis_pekerjaan' => $booking->jenis_pekerjaan,
            'gaji_bulanan' => $booking->gaji_bulanan,
            'memiliki_angsuran_lain' => (bool) $booking->memiliki_angsuran_lain,
            'catatan_admin' => $booking->catatan_admin,
            'documents' => $documents,
        ];
    }
}
