<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use Illuminate\Http\Request;

class MarketingDashboardController extends Controller
{
    public function summary(Request $request)
    {
        $marketingUserId = (int) ($request->user()?->id_user ?? 0);

        $marketingScopedQuery = Booking::query()
            ->whereHas('perumahan', function ($propertyQuery) use ($marketingUserId) {
                $propertyQuery->where('id_marketing_user', $marketingUserId);
            });

        $statusBreakdown = (clone $marketingScopedQuery)
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
            'total_booking' => (int) (clone $marketingScopedQuery)->count(),
            'status_breakdown' => $statusBreakdown,
        ]);
    }
}
