<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Perumahan;
use App\Models\PerumahanUnit;
use Illuminate\Support\Carbon;

class AdminDashboardController extends Controller
{
    public function summary()
    {
        $properties = Perumahan::query()->get([
            'id_perumahan',
            'nama_perumahan',
            'kategori',
            'jumlah_seluruh_unit',
            'jumlah_unit_tersedia',
        ]);

        $propertyCountByCategory = [
            'subsidi' => 0,
            'komersil' => 0,
            'townhouse' => 0,
        ];

        foreach ($properties as $property) {
            $category = strtolower((string) $property->kategori);
            if (array_key_exists($category, $propertyCountByCategory)) {
                $propertyCountByCategory[$category]++;
            }
        }

        $propertyStatusByProperty = [];
        foreach ($properties as $property) {
            $propertyId = (int) $property->id_perumahan;
            $propertyStatusByProperty[$propertyId] = [
                'id' => $propertyId,
                'name' => (string) ($property->nama_perumahan ?? '-'),
                'tersedia' => 0,
                'terbooking' => 0,
                'proses_booking' => 0,
                'total_unit' => 0,
                'has_unit_data' => false,
            ];
        }

        $unitStatusRows = PerumahanUnit::query()
            ->selectRaw('id_perumahan, status_unit, COUNT(*) as total')
            ->groupBy('id_perumahan', 'status_unit')
            ->get();

        foreach ($unitStatusRows as $row) {
            $propertyId = (int) $row->id_perumahan;
            if (! isset($propertyStatusByProperty[$propertyId])) {
                continue;
            }

            $propertyStatusByProperty[$propertyId]['has_unit_data'] = true;

            $status = strtolower((string) $row->status_unit);
            $total = (int) $row->total;
            if ($status === 'available') {
                $propertyStatusByProperty[$propertyId]['tersedia'] += $total;
            } elseif ($status === 'pending') {
                $propertyStatusByProperty[$propertyId]['proses_booking'] += $total;
            } elseif ($status === 'sold') {
                $propertyStatusByProperty[$propertyId]['terbooking'] += $total;
            }
        }

        foreach ($properties as $property) {
            $propertyId = (int) $property->id_perumahan;
            if (! isset($propertyStatusByProperty[$propertyId])) {
                continue;
            }

            // Fallback untuk data lama yang belum punya baris unit terpisah.
            if (! $propertyStatusByProperty[$propertyId]['has_unit_data']) {
                $totalUnitFallback = (int) ($property->jumlah_seluruh_unit ?? 0);
                $availableFallback = (int) ($property->jumlah_unit_tersedia ?? 0);
                $bookedFallback = max(0, $totalUnitFallback - $availableFallback);

                $propertyStatusByProperty[$propertyId]['tersedia'] = $availableFallback;
                $propertyStatusByProperty[$propertyId]['terbooking'] = $bookedFallback;
                $propertyStatusByProperty[$propertyId]['proses_booking'] = 0;
            }

            $propertyStatusByProperty[$propertyId]['total_unit'] =
                (int) $propertyStatusByProperty[$propertyId]['tersedia']
                + (int) $propertyStatusByProperty[$propertyId]['terbooking']
                + (int) $propertyStatusByProperty[$propertyId]['proses_booking'];
        }

        $propertyStatusItems = array_values(array_map(function ($item) {
            unset($item['has_unit_data']);
            return $item;
        }, $propertyStatusByProperty));

        $totalUnit = (int) array_reduce($propertyStatusItems, fn ($carry, $item) => $carry + (int) $item['total_unit'], 0);
        $totalAvailable = (int) array_reduce($propertyStatusItems, fn ($carry, $item) => $carry + (int) $item['tersedia'], 0);
        $totalBooked = (int) array_reduce($propertyStatusItems, fn ($carry, $item) => $carry + (int) $item['terbooking'], 0);
        $totalInProcess = (int) array_reduce($propertyStatusItems, fn ($carry, $item) => $carry + (int) $item['proses_booking'], 0);

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
                'subsidi' => $propertyCountByCategory['subsidi'],
                'komersil' => $propertyCountByCategory['komersil'],
                'townhouse' => $propertyCountByCategory['townhouse'],
                'total_booking' => (int) Booking::query()->count(),
            ],
            'sales_data' => array_values($salesData),
            'property_status' => [
                'terjual' => $totalBooked,
                'terbooking' => $totalBooked,
                'tersedia' => $totalAvailable,
                'proses_booking' => $totalInProcess,
                'total_unit' => $totalUnit,
            ],
            'property_filter_options' => array_map(fn ($item) => [
                'id' => $item['id'],
                'name' => $item['name'],
            ], $propertyStatusItems),
            'property_status_by_property' => $propertyStatusItems,
            'recent_bookings' => $recentBookings,
            'recent_activities' => $recentActivities,
        ]);
    }
}
