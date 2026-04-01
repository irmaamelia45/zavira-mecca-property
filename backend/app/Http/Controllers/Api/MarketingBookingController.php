<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use Illuminate\Http\Request;

class MarketingBookingController extends Controller
{
    public function index(Request $request)
    {
        $currentUser = $request->user();

        $validated = $request->validate([
            'status' => 'nullable|string|max:25',
            'perumahan_id' => 'nullable|integer|exists:perumahan,id_perumahan',
            'q' => 'nullable|string|max:120',
        ]);

        $query = Booking::query()
            ->with([
                'user:id_user,nama,email,no_hp',
                'perumahan:id_perumahan,nama_perumahan,tipe_unit,lokasi,harga',
            ])
            ->orderByDesc('tanggal_booking');

        if (! empty($validated['status'])) {
            $query->where('status_booking', $validated['status']);
        }

        if (! empty($validated['perumahan_id'])) {
            $query->where('id_perumahan', (int) $validated['perumahan_id']);
        }

        if (! empty($validated['q'])) {
            $term = trim((string) $validated['q']);
            $query->where(function ($builder) use ($term) {
                $builder->where('kode_booking', 'like', '%'.$term.'%')
                    ->orWhereHas('user', function ($userQuery) use ($term) {
                        $userQuery
                            ->where('nama', 'like', '%'.$term.'%')
                            ->orWhere('email', 'like', '%'.$term.'%')
                            ->orWhere('no_hp', 'like', '%'.$term.'%');
                    })
                    ->orWhereHas('perumahan', function ($propertyQuery) use ($term) {
                        $propertyQuery
                            ->where('nama_perumahan', 'like', '%'.$term.'%')
                            ->orWhere('tipe_unit', 'like', '%'.$term.'%')
                            ->orWhere('lokasi', 'like', '%'.$term.'%');
                    });
            });
        }

        $bookings = $query->get()->map(function (Booking $booking) {
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
            ];
        })->values()->all();

        $statusBreakdown = Booking::query()
            ->selectRaw('status_booking as status, COUNT(*) as total')
            ->groupBy('status_booking')
            ->orderBy('status_booking')
            ->get()
            ->map(fn ($row) => [
                'status' => (string) $row->status,
                'total' => (int) $row->total,
            ])
            ->values()
            ->all();

        $properties = Booking::query()
            ->join('perumahan', 'booking.id_perumahan', '=', 'perumahan.id_perumahan')
            ->select('perumahan.id_perumahan as id', 'perumahan.nama_perumahan as name')
            ->groupBy('perumahan.id_perumahan', 'perumahan.nama_perumahan')
            ->orderBy('perumahan.nama_perumahan')
            ->get()
            ->map(fn ($row) => [
                'id' => (int) $row->id,
                'name' => (string) $row->name,
            ])
            ->values()
            ->all();

        $statuses = Booking::query()
            ->select('status_booking')
            ->distinct()
            ->orderBy('status_booking')
            ->pluck('status_booking')
            ->values()
            ->all();

        return response()->json([
            'current_user' => [
                'id' => $currentUser?->id_user,
                'name' => $currentUser?->nama ?: 'Marketing',
                'role' => $currentUser?->role?->nama_role ?: 'marketing',
            ],
            'summary' => [
                'total_booking' => (int) Booking::query()->count(),
                'status_breakdown' => $statusBreakdown,
            ],
            'filters' => [
                'properties' => $properties,
                'statuses' => $statuses,
            ],
            'bookings' => $bookings,
        ]);
    }
}
