<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Perumahan;
use Illuminate\Support\Carbon;

class AdminDashboardController extends Controller
{
    public function summary()
    {
        $properties = Perumahan::query()->get([
            'id_perumahan',
            'kategori',
            'jumlah_seluruh_unit',
            'jumlah_unit_tersedia',
        ]);

        $unitByCategory = [
            'subsidi' => 0,
            'komersil' => 0,
            'townhouse' => 0,
        ];

        foreach ($properties as $property) {
            $category = strtolower((string) $property->kategori);
            if (array_key_exists($category, $unitByCategory)) {
                $unitByCategory[$category] += (int) ($property->jumlah_seluruh_unit ?? 0);
            }
        }

        $totalUnit = (int) $properties->sum('jumlah_seluruh_unit');
        $totalAvailable = (int) $properties->sum('jumlah_unit_tersedia');
        $totalSold = max(0, $totalUnit - $totalAvailable);

        $currentYear = now()->year;
        $monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        $salesData = [];

        for ($month = 1; $month <= 12; $month++) {
            $salesData[$month] = [
                'name' => $monthLabels[$month - 1],
                'Subsidi' => 0,
                'Komersil' => 0,
                'Townhouse' => 0,
            ];
        }

        $monthlyRows = Booking::query()
            ->join('perumahan', 'booking.id_perumahan', '=', 'perumahan.id_perumahan')
            ->selectRaw('MONTH(booking.tanggal_booking) as month_num, LOWER(perumahan.kategori) as kategori, COUNT(*) as total')
            ->whereYear('booking.tanggal_booking', $currentYear)
            ->groupByRaw('MONTH(booking.tanggal_booking), LOWER(perumahan.kategori)')
            ->get();

        foreach ($monthlyRows as $row) {
            $monthNum = (int) $row->month_num;
            if ($monthNum < 1 || $monthNum > 12) {
                continue;
            }

            $key = strtolower((string) $row->kategori);
            if ($key === 'subsidi') {
                $salesData[$monthNum]['Subsidi'] = (int) $row->total;
            } elseif ($key === 'komersil') {
                $salesData[$monthNum]['Komersil'] = (int) $row->total;
            } elseif ($key === 'townhouse') {
                $salesData[$monthNum]['Townhouse'] = (int) $row->total;
            }
        }

        $recentBookings = Booking::query()
            ->with([
                'user:id_user,nama',
                'perumahan:id_perumahan,nama_perumahan,tipe_unit',
            ])
            ->orderByDesc('tanggal_booking')
            ->limit(7)
            ->get()
            ->map(function (Booking $booking) {
                return [
                    'id' => $booking->id_booking,
                    'name' => $booking->user?->nama ?: '-',
                    'code' => $booking->kode_booking,
                    'property' => $booking->perumahan?->nama_perumahan ?: '-',
                    'type' => $booking->perumahan?->tipe_unit ?: '-',
                    'date' => optional($booking->tanggal_booking)->toDateString(),
                    'status' => $booking->status_booking,
                ];
            })
            ->values()
            ->all();

        $recentActivities = Booking::query()
            ->with(['user:id_user,nama'])
            ->orderByDesc('updated_at')
            ->limit(5)
            ->get()
            ->map(function (Booking $booking) {
                $status = strtolower((string) $booking->status_booking);
                $title = 'Update Booking';
                $iconType = 'status';

                if (str_contains($status, 'menunggu')) {
                    $title = 'Booking Baru';
                    $iconType = 'new';
                } elseif (str_contains($status, 'setuju')) {
                    $title = 'Booking Disetujui';
                    $iconType = 'approved';
                } elseif (str_contains($status, 'tolak')) {
                    $title = 'Booking Ditolak';
                    $iconType = 'rejected';
                } elseif (str_contains($status, 'selesai')) {
                    $title = 'Booking Selesai';
                    $iconType = 'done';
                }

                return [
                    'title' => $title,
                    'subtitle' => trim(($booking->user?->nama ?: 'User').' - '.$booking->kode_booking),
                    'time' => Carbon::parse($booking->updated_at)->diffForHumans(),
                    'icon_type' => $iconType,
                ];
            })
            ->values()
            ->all();

        return response()->json([
            'cards' => [
                'subsidi' => $unitByCategory['subsidi'],
                'komersil' => $unitByCategory['komersil'],
                'townhouse' => $unitByCategory['townhouse'],
                'total_booking' => (int) Booking::query()->count(),
            ],
            'sales_data' => array_values($salesData),
            'property_status' => [
                'terjual' => $totalSold,
                'tersedia' => $totalAvailable,
                'total_unit' => $totalUnit,
            ],
            'recent_bookings' => $recentBookings,
            'recent_activities' => $recentActivities,
        ]);
    }
}
