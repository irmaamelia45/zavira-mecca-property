<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;

class MarketingDashboardController extends Controller
{
    public function summary()
    {
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

        return response()->json([
            'total_booking' => (int) Booking::query()->count(),
            'status_breakdown' => $statusBreakdown,
        ]);
    }
}
