<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Perumahan;
use App\Models\PerumahanUnit;
use App\Models\User;
use Illuminate\Support\Carbon;

class AdminDashboardController extends Controller
{
    public function summary()
    {
        $totalBookings = (int) Booking::query()->count();
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
                'terjual' => 0,
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
                $propertyStatusByProperty[$propertyId]['terbooking'] += $total;
            } elseif ($status === 'sold') {
                $propertyStatusByProperty[$propertyId]['terjual'] += $total;
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
                $soldFallback = max(0, $totalUnitFallback - $availableFallback);

                $propertyStatusByProperty[$propertyId]['tersedia'] = $availableFallback;
                $propertyStatusByProperty[$propertyId]['terbooking'] = 0;
                $propertyStatusByProperty[$propertyId]['terjual'] = $soldFallback;
            }

            $propertyStatusByProperty[$propertyId]['total_unit'] =
                (int) $propertyStatusByProperty[$propertyId]['tersedia']
                + (int) $propertyStatusByProperty[$propertyId]['terbooking']
                + (int) $propertyStatusByProperty[$propertyId]['terjual'];
        }

        $propertyStatusItems = array_values(array_map(function ($item) {
            unset($item['has_unit_data']);
            return $this->appendUnitStatusAliases($item);
        }, $propertyStatusByProperty));

        $totalUnit = (int) array_reduce($propertyStatusItems, fn ($carry, $item) => $carry + (int) $item['total_unit'], 0);
        $totalAvailable = (int) array_reduce($propertyStatusItems, fn ($carry, $item) => $carry + (int) $item['tersedia'], 0);
        $totalBooked = (int) array_reduce($propertyStatusItems, fn ($carry, $item) => $carry + (int) $item['terbooking'], 0);
        $totalSold = (int) array_reduce($propertyStatusItems, fn ($carry, $item) => $carry + (int) $item['terjual'], 0);

        $currentYear = now()->year;
        $monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        $salesData = [];
        $userGrowthData = [];

        for ($month = 1; $month <= 12; $month++) {
            $salesData[$month] = [
                'name' => $monthLabels[$month - 1],
                'Subsidi' => 0,
                'Komersil' => 0,
                'Townhouse' => 0,
            ];

            $userGrowthData[$month] = [
                'name' => $monthLabels[$month - 1],
                'total' => 0,
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

        $userRoleCounts = $this->emptyUserRoleCounts();
        $totalRegisteredUsers = (int) User::query()->count();
        $totalActiveUsers = (int) User::query()->where('is_active', true)->count();

        $userRoleRows = User::query()
            ->leftJoin('role', 'user.id_role', '=', 'role.id_role')
            ->selectRaw('LOWER(COALESCE(role.nama_role, "")) as role_key, COUNT(*) as total')
            ->groupByRaw('LOWER(COALESCE(role.nama_role, ""))')
            ->get();

        foreach ($userRoleRows as $row) {
            $roleKey = $this->normalizeUserRole((string) $row->role_key);
            $userRoleCounts[$roleKey] += (int) $row->total;
        }

        $monthlyUserRows = User::query()
            ->selectRaw('MONTH(created_at) as month_num, COUNT(*) as total')
            ->whereYear('created_at', $currentYear)
            ->groupByRaw('MONTH(created_at)')
            ->get();

        foreach ($monthlyUserRows as $row) {
            $monthNum = (int) $row->month_num;
            if ($monthNum < 1 || $monthNum > 12) {
                continue;
            }

            $userGrowthData[$monthNum]['total'] = (int) $row->total;
        }

        $userRoleSummary = [];
        foreach ($userRoleCounts as $roleKey => $total) {
            $userRoleSummary[] = [
                'key' => $roleKey,
                'label' => $this->userRoleLabel($roleKey),
                'total' => (int) $total,
            ];
        }

        $recentUsers = User::query()
            ->with(['role:id_role,nama_role'])
            ->orderByDesc('created_at')
            ->limit(5)
            ->get()
            ->map(function (User $user) {
                $roleKey = $this->normalizeUserRole((string) ($user->role?->nama_role ?? ''));

                return [
                    'id' => $user->id_user,
                    'name' => $user->nama ?: '-',
                    'email' => $user->email ?: '-',
                    'role_key' => $roleKey,
                    'role' => $this->userRoleLabel($roleKey),
                    'is_active' => (bool) $user->is_active,
                    'status' => $user->is_active ? 'Aktif' : 'Nonaktif',
                    'registered_at' => optional($user->created_at)->toDateString(),
                ];
            })
            ->values()
            ->all();

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
                'total_booking' => $totalBookings,
                'total_user' => $totalRegisteredUsers,
            ],
            'sales_data' => array_values($salesData),
            'user_summary' => [
                'total_registered' => $totalRegisteredUsers,
                'total_active' => $totalActiveUsers,
                'total_inactive' => max(0, $totalRegisteredUsers - $totalActiveUsers),
                'roles' => $userRoleSummary,
            ],
            'user_growth_data' => array_values($userGrowthData),
            'recent_users' => $recentUsers,
            'status_unit_labels' => $this->unitStatusLabels(),
            'property_status' => [
                'terbooking' => $totalBooked,
                'terjual' => $totalSold,
                'tersedia' => $totalAvailable,
                'proses_booking' => $totalBooked,
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

    public function stats()
    {
        $properties = Perumahan::query()
            ->orderBy('nama_perumahan')
            ->get([
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

        $globalBookingStatus = $this->emptyBookingStatusCounts();
        $bookingByProperty = [];
        $unitByProperty = [];

        foreach ($properties as $property) {
            $propertyId = (int) $property->id_perumahan;
            $category = $this->normalizePropertyCategory((string) $property->kategori);

            $propertyCountByCategory[$category]++;

            $bookingByProperty[$propertyId] = array_merge([
                'nama_perumahan' => (string) ($property->nama_perumahan ?? '-'),
            ], $this->emptyBookingStatusCounts());

            $unitByProperty[$propertyId] = [
                'nama_perumahan' => (string) ($property->nama_perumahan ?? '-'),
                'kategori_perumahan' => $category,
                'tersedia' => 0,
                'terbooking' => 0,
                'terjual' => 0,
                'has_unit_data' => false,
                'fallback_total_unit' => (int) ($property->jumlah_seluruh_unit ?? 0),
                'fallback_tersedia' => (int) ($property->jumlah_unit_tersedia ?? 0),
            ];
        }

        $bookingStatusRows = Booking::query()
            ->selectRaw('id_perumahan, status_booking, COUNT(*) as total')
            ->groupBy('id_perumahan', 'status_booking')
            ->get();

        foreach ($bookingStatusRows as $row) {
            $normalizedStatus = $this->normalizeBookingStatus((string) $row->status_booking);
            if (! $normalizedStatus) {
                continue;
            }

            $total = (int) $row->total;
            $propertyId = (int) $row->id_perumahan;

            $globalBookingStatus[$normalizedStatus] += $total;

            if (isset($bookingByProperty[$propertyId])) {
                $bookingByProperty[$propertyId][$normalizedStatus] += $total;
            }
        }

        $currentYear = now()->year;
        $monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        $salesByMonth = [];

        for ($month = 1; $month <= 12; $month++) {
            $salesByMonth[$month] = [
                'bulan' => $monthLabels[$month - 1],
                'total_komersil' => 0,
                'total_subsidi' => 0,
                'total_townhouse' => 0,
            ];
        }

        $monthlyRows = Booking::query()
            ->join('perumahan', 'booking.id_perumahan', '=', 'perumahan.id_perumahan')
            ->selectRaw('MONTH(booking.tanggal_booking) as month_num, perumahan.kategori as kategori, COUNT(*) as total')
            ->whereYear('booking.tanggal_booking', $currentYear)
            ->groupByRaw('MONTH(booking.tanggal_booking), perumahan.kategori')
            ->orderByRaw('MONTH(booking.tanggal_booking) asc')
            ->get();

        foreach ($monthlyRows as $row) {
            $monthNum = (int) $row->month_num;
            if ($monthNum < 1 || $monthNum > 12) {
                continue;
            }

            $category = $this->normalizePropertyCategory((string) $row->kategori);
            $total = (int) $row->total;

            if ($category === 'komersil') {
                $salesByMonth[$monthNum]['total_komersil'] += $total;
            } elseif ($category === 'subsidi') {
                $salesByMonth[$monthNum]['total_subsidi'] += $total;
            } elseif ($category === 'townhouse') {
                $salesByMonth[$monthNum]['total_townhouse'] += $total;
            }
        }

        $unitStatusRows = PerumahanUnit::query()
            ->selectRaw('id_perumahan, status_unit, COUNT(*) as total')
            ->groupBy('id_perumahan', 'status_unit')
            ->get();

        foreach ($unitStatusRows as $row) {
            $propertyId = (int) $row->id_perumahan;
            if (! isset($unitByProperty[$propertyId])) {
                continue;
            }

            $unitByProperty[$propertyId]['has_unit_data'] = true;

            $status = strtolower((string) $row->status_unit);
            $total = (int) $row->total;

            if ($status === 'available') {
                $unitByProperty[$propertyId]['tersedia'] += $total;
            } elseif ($status === 'pending') {
                $unitByProperty[$propertyId]['terbooking'] += $total;
            } elseif ($status === 'sold') {
                $unitByProperty[$propertyId]['terjual'] += $total;
            }
        }

        foreach ($unitByProperty as $propertyId => $item) {
            if ($item['has_unit_data']) {
                continue;
            }

            $available = max(0, (int) $item['fallback_tersedia']);
            $totalUnit = max($available, (int) $item['fallback_total_unit']);
            $sold = max(0, $totalUnit - $available);

            $unitByProperty[$propertyId]['tersedia'] = $available;
            $unitByProperty[$propertyId]['terbooking'] = 0;
            $unitByProperty[$propertyId]['terjual'] = $sold;
        }

        $unitByPropertyItems = array_values(array_map(function (array $item) {
            unset($item['has_unit_data'], $item['fallback_total_unit'], $item['fallback_tersedia']);
            return $this->appendUnitStatusAliases($item);
        }, $unitByProperty));

        return response()->json([
            'success' => true,
            'message' => 'Data statistik dashboard berhasil diambil.',
            'data' => [
                'total_perumahan_subsidi' => (int) $propertyCountByCategory['subsidi'],
                'total_perumahan_komersil' => (int) $propertyCountByCategory['komersil'],
                'total_perumahan_townhouse' => (int) $propertyCountByCategory['townhouse'],
                'total_booking' => (int) Booking::query()->count(),
                'penjualan_per_bulan' => array_values($salesByMonth),
                'total_booking_berdasarkan_status' => $globalBookingStatus,
                'total_booking_berdasarkan_status_dan_nama_perumahan' => array_values($bookingByProperty),
                'status_unit_labels' => $this->unitStatusLabels(),
                'total_unit_perumahan_berdasarkan_status_dan_nama_perumahan' => $unitByPropertyItems,
            ],
        ]);
    }

    private function appendUnitStatusAliases(array $item): array
    {
        return array_merge($item, [
            'proses_booking' => (int) ($item['terbooking'] ?? 0),
        ]);
    }

    private function unitStatusLabels(): array
    {
        return [
            'available' => 'Tersedia',
            'pending' => 'Terbooking',
            'sold' => 'Terjual',
            'tersedia' => 'Tersedia',
            'proses_booking' => 'Terbooking',
            'terbooking' => 'Terbooking',
            'terjual' => 'Terjual',
        ];
    }

    private function emptyBookingStatusCounts(): array
    {
        return [
            'menunggu' => 0,
            'disetujui' => 0,
            'ditolak' => 0,
            'selesai' => 0,
            'dibatalkan' => 0,
        ];
    }

    private function emptyUserRoleCounts(): array
    {
        return [
            'user' => 0,
            'marketing' => 0,
            'admin' => 0,
            'superadmin' => 0,
            'lainnya' => 0,
        ];
    }

    private function normalizePropertyCategory(string $category): string
    {
        $value = strtolower(trim($category));

        if (str_contains($value, 'subsidi')) {
            return 'subsidi';
        }

        if (str_contains($value, 'townhouse')) {
            return 'townhouse';
        }

        if (str_contains($value, 'komers')) {
            return 'komersil';
        }

        return 'komersil';
    }

    private function normalizeBookingStatus(string $status): ?string
    {
        $value = strtolower(trim($status));

        if (str_contains($value, 'menunggu')) {
            return 'menunggu';
        }

        if (str_contains($value, 'setuju')) {
            return 'disetujui';
        }

        if (str_contains($value, 'tolak')) {
            return 'ditolak';
        }

        if (str_contains($value, 'selesai')) {
            return 'selesai';
        }

        if (str_contains($value, 'batal')) {
            return 'dibatalkan';
        }

        return null;
    }

    private function normalizeUserRole(string $role): string
    {
        $value = strtolower(trim($role));

        if ($value === 'user') {
            return 'user';
        }

        if ($value === 'marketing') {
            return 'marketing';
        }

        if ($value === 'admin') {
            return 'admin';
        }

        if ($value === 'superadmin') {
            return 'superadmin';
        }

        return 'lainnya';
    }

    private function userRoleLabel(string $roleKey): string
    {
        return match ($roleKey) {
            'user' => 'User',
            'marketing' => 'Marketing',
            'admin' => 'Admin',
            'superadmin' => 'Superadmin',
            default => 'Lainnya',
        };
    }
}
