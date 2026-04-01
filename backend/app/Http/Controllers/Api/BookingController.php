<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\DocBooking;
use App\Models\Perumahan;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Str;

class BookingController extends Controller
{
    public function indexMine(Request $request)
    {
        $bookings = Booking::query()
            ->where('id_user', $request->user()->id_user)
            ->with('perumahan:id_perumahan,nama_perumahan,lokasi,harga')
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
                'documents:id_doc_booking,id_booking,jenis_dokumen,nama_file,path_file,mime_type,file_size_kb,uploaded_at',
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
                'documents:id_doc_booking,id_booking,jenis_dokumen,nama_file,path_file,mime_type,file_size_kb,uploaded_at',
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
                'documents:id_doc_booking,id_booking,jenis_dokumen,nama_file,path_file,mime_type,file_size_kb,uploaded_at',
            ])
            ->find($id);

        if (! $booking) {
            return response()->json(['message' => 'Detail booking tidak ditemukan.'], 404);
        }

        return response()->json($this->formatBookingAdmin($booking));
    }

    public function updateStatusAdmin(Request $request, $id)
    {
        $booking = Booking::query()
            ->with(['perumahan:id_perumahan,jumlah_unit_tersedia'])
            ->find($id);

        if (! $booking) {
            return response()->json(['message' => 'Booking tidak ditemukan.'], 404);
        }

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
        $previousStatus = $booking->status_booking;

        $attributes = [
            'status_booking' => $nextStatus,
            'catatan_admin' => $validated['catatan_admin'] ?? $booking->catatan_admin,
        ];

        if ($nextStatus === 'Disetujui' && $previousStatus !== 'Disetujui') {
            $attributes['approved_at'] = now();
            if ($booking->perumahan && $booking->perumahan->jumlah_unit_tersedia > 0) {
                Perumahan::query()
                    ->where('id_perumahan', $booking->perumahan->id_perumahan)
                    ->decrement('jumlah_unit_tersedia', 1);
            }
        }

        if ($nextStatus === 'Ditolak' && $previousStatus !== 'Ditolak') {
            $attributes['rejected_at'] = now();
        }

        if ($nextStatus === 'Dibatalkan' && $previousStatus !== 'Dibatalkan') {
            $attributes['canceled_at'] = now();
            if ($previousStatus === 'Disetujui' && $booking->perumahan) {
                Perumahan::query()
                    ->where('id_perumahan', $booking->perumahan->id_perumahan)
                    ->increment('jumlah_unit_tersedia', 1);
            }
        }

        if ($nextStatus === 'Selesai' && $previousStatus !== 'Selesai') {
            $attributes['finished_at'] = now();
        }

        $booking->update($attributes);

        $booking->load([
            'user:id_user,nama,email,no_hp',
            'perumahan:id_perumahan,nama_perumahan,tipe_unit,lokasi,harga',
            'documents:id_doc_booking,id_booking,jenis_dokumen,nama_file,path_file,mime_type,file_size_kb,uploaded_at',
        ]);

        return response()->json([
            'message' => 'Status booking berhasil diperbarui.',
            'booking' => $this->formatBookingAdmin($booking),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'id_perumahan' => 'required|integer|exists:perumahan,id_perumahan',
            'catatan_user' => 'nullable|string|max:255',
            'pekerjaan' => 'required|string|max:100',
            'jenis_pekerjaan' => ['required', Rule::in(['fixed_income', 'non_fixed_income'])],
            'gaji_bulanan' => 'required|integer|min:0',
            'dokumen' => 'required|file|mimes:pdf|max:5120',
        ]);

        $booking = Booking::create([
            'id_user' => $request->user()->id_user,
            'id_perumahan' => $validated['id_perumahan'],
            'kode_booking' => $this->generateBookingCode(),
            'status_booking' => 'Menunggu',
            'catatan_user' => $validated['catatan_user'] ?? null,
            'pekerjaan' => $validated['pekerjaan'],
            'jenis_pekerjaan' => $validated['jenis_pekerjaan'],
            'gaji_bulanan' => $validated['gaji_bulanan'],
        ]);

        if ($request->hasFile('dokumen')) {
            $file = $request->file('dokumen');
            $ext = $file->getClientOriginalExtension() ?: 'bin';
            $mimeType = $file->getMimeType() ?: $file->getClientMimeType() ?: 'application/octet-stream';
            $fileSizeKb = (int) ceil(($file->getSize() ?: 0) / 1024);
            $filename = Str::uuid()->toString().'.'.$ext;
            $directory = public_path('uploads/booking-documents');

            if (! is_dir($directory)) {
                mkdir($directory, 0755, true);
            }

            $file->move($directory, $filename);

            DocBooking::create([
                'id_booking' => $booking->id_booking,
                'jenis_dokumen' => 'Dokumen Booking',
                'nama_file' => $file->getClientOriginalName(),
                'path_file' => '/uploads/booking-documents/'.$filename,
                'mime_type' => $mimeType,
                'file_size_kb' => $fileSizeKb,
            ]);
        }

        $booking->load('perumahan:id_perumahan,nama_perumahan,lokasi,harga');

        return response()->json([
            'message' => 'Booking berhasil diajukan.',
            'booking' => $this->formatBooking($booking),
        ], 201);
    }

    private function generateBookingCode(): string
    {
        do {
            $code = 'BK-'.now()->format('Ymd').'-'.str_pad((string) random_int(1, 9999), 4, '0', STR_PAD_LEFT);
        } while (Booking::query()->where('kode_booking', $code)->exists());

        return $code;
    }

    private function formatBooking(Booking $booking): array
    {
        $documents = $booking->relationLoaded('documents')
            ? $booking->documents->map(fn ($doc) => [
                'id' => $doc->id_doc_booking,
                'jenis_dokumen' => $doc->jenis_dokumen,
                'nama_file' => $doc->nama_file,
                'path' => $doc->path_file,
                'mime_type' => $doc->mime_type,
                'file_size_kb' => $doc->file_size_kb,
                'uploaded_at' => optional($doc->uploaded_at)->toDateTimeString(),
            ])->values()->all()
            : [];

        return [
            'id' => $booking->id_booking,
            'kode_booking' => $booking->kode_booking,
            'tanggal_booking' => optional($booking->tanggal_booking)->toDateTimeString(),
            'status_booking' => $booking->status_booking,
            'catatan_user' => $booking->catatan_user,
            'pekerjaan' => $booking->pekerjaan,
            'jenis_pekerjaan' => $booking->jenis_pekerjaan,
            'gaji_bulanan' => $booking->gaji_bulanan,
            'catatan_admin' => $booking->catatan_admin,
            'approved_at' => optional($booking->approved_at)->toDateTimeString(),
            'rejected_at' => optional($booking->rejected_at)->toDateTimeString(),
            'canceled_at' => optional($booking->canceled_at)->toDateTimeString(),
            'finished_at' => optional($booking->finished_at)->toDateTimeString(),
            'cancel_reason' => $booking->cancel_reason,
            'cancel_note' => $booking->cancel_note,
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
                'nama_file' => $doc->nama_file,
                'path' => $doc->path_file,
                'mime_type' => $doc->mime_type,
                'file_size_kb' => $doc->file_size_kb,
            ])->values()->all()
            : [];

        return [
            'id' => $booking->id_booking,
            'code' => $booking->kode_booking,
            'date' => optional($booking->tanggal_booking)->toDateTimeString(),
            'status' => $booking->status_booking,
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
            'catatan_admin' => $booking->catatan_admin,
            'documents' => $documents,
        ];
    }
}
