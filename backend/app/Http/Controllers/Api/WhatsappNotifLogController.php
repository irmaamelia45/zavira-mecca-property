<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\WhatsappNotifLog;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class WhatsappNotifLogController extends Controller
{
    public function index(Request $request)
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', 'in:success,failed'],
            'event' => ['nullable', 'string', 'max:20'],
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date'],
        ]);

        $query = WhatsappNotifLog::query()
            ->with([
                'booking:id_booking,kode_booking,status_booking,tanggal_booking,id_perumahan',
                'booking.perumahan:id_perumahan,nama_perumahan',
                'user:id_user,nama,email',
            ])
            ->orderByDesc('sent_at')
            ->orderByDesc('id_wa_log');

        $search = trim((string) ($validated['search'] ?? ''));
        if ($search !== '') {
            $query->where(function ($builder) use ($search) {
                $builder
                    ->where('tujuan_no_hp', 'like', "%{$search}%")
                    ->orWhere('event', 'like', "%{$search}%")
                    ->orWhere('status_kirim', 'like', "%{$search}%")
                    ->orWhere('provider', 'like', "%{$search}%")
                    ->orWhereHas('user', function ($userQuery) use ($search) {
                        $userQuery
                            ->where('nama', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%");
                    })
                    ->orWhereHas('booking', function ($bookingQuery) use ($search) {
                        $bookingQuery
                            ->where('kode_booking', 'like', "%{$search}%")
                            ->orWhereHas('perumahan', function ($propertyQuery) use ($search) {
                                $propertyQuery->where('nama_perumahan', 'like', "%{$search}%");
                            });
                    });
            });
        }

        if (! empty($validated['status'])) {
            $query->where('status_kirim', $validated['status']);
        }

        if (! empty($validated['event'])) {
            $query->where('event', $validated['event']);
        }

        if (! empty($validated['date_from'])) {
            $query->whereDate('sent_at', '>=', $validated['date_from']);
        }

        if (! empty($validated['date_to'])) {
            $query->whereDate('sent_at', '<=', $validated['date_to']);
        }

        $logs = $query->get()->map(fn (WhatsappNotifLog $log) => $this->formatListItem($log))->values();

        return response()->json($logs);
    }

    public function show(string $id)
    {
        $log = WhatsappNotifLog::query()
            ->with([
                'booking:id_booking,kode_booking,status_booking,tanggal_booking,id_perumahan',
                'booking.perumahan:id_perumahan,nama_perumahan',
                'user:id_user,nama,email',
            ])
            ->findOrFail($id);

        return response()->json($this->formatDetailItem($log));
    }

    private function formatListItem(WhatsappNotifLog $log): array
    {
        return [
            'id' => (int) $log->id_wa_log,
            'event' => (string) $log->event,
            'eventLabel' => $this->eventLabel((string) $log->event),
            'statusKirim' => (string) $log->status_kirim,
            'provider' => (string) $log->provider,
            'tujuanNoHp' => (string) $log->tujuan_no_hp,
            'statusBookingAtSend' => (string) $log->status_booking_at_send,
            'sentAt' => optional($log->sent_at)?->toIso8601String(),
            'messagePreview' => Str::limit((string) $log->isi_pesan, 140),
            'booking' => [
                'id' => $log->booking?->id_booking ? (int) $log->booking->id_booking : null,
                'code' => $log->booking?->kode_booking ?: '-',
                'status' => $log->booking?->status_booking ?: '-',
                'date' => optional($log->booking?->tanggal_booking)?->toIso8601String(),
                'propertyName' => $log->booking?->perumahan?->nama_perumahan ?: '-',
            ],
            'user' => [
                'id' => $log->user?->id_user ? (int) $log->user->id_user : null,
                'name' => $log->user?->nama ?: '-',
                'email' => $log->user?->email ?: '-',
            ],
        ];
    }

    private function formatDetailItem(WhatsappNotifLog $log): array
    {
        return array_merge($this->formatListItem($log), [
            'message' => (string) $log->isi_pesan,
            'responseRaw' => $log->response_raw,
            'responseData' => $this->decodeResponseRaw($log->response_raw),
        ]);
    }

    private function decodeResponseRaw(?string $value): mixed
    {
        $trimmed = trim((string) $value);
        if ($trimmed === '') {
            return null;
        }

        $decoded = json_decode($trimmed, true);

        return json_last_error() === JSON_ERROR_NONE ? $decoded : $trimmed;
    }

    private function eventLabel(string $event): string
    {
        return match ($event) {
            'new_booking_admin' => 'Booking Baru ke Admin',
            'new_booking_user' => 'Booking Baru ke User',
            'new_booking_mkt' => 'Booking Baru ke Marketing',
            'booking_status' => 'Update Status ke User',
            'booking_status_mkt' => 'Update Status ke Marketing',
            'promo_broadcast' => 'Broadcast Promo',
            default => Str::of($event)->replace('_', ' ')->title()->value(),
        };
    }
}
