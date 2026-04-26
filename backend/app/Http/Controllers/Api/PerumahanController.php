<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Perumahan;
use App\Models\PerumahanMedia;
use App\Models\PerumahanUnit;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class PerumahanController extends Controller
{
    public function indexPublic(Request $request)
    {
        $query = Perumahan::query()
            ->where('status_aktif', true)
            ->with(['media' => fn ($q) => $q->orderBy('urutan')])
            ->orderByDesc('created_at');

        if ($request->filled('q')) {
            $q = trim((string) $request->query('q'));
            $query->where(function ($sub) use ($q) {
                $sub->where('nama_perumahan', 'like', "%{$q}%")
                    ->orWhere('lokasi', 'like', "%{$q}%")
                    ->orWhere('kota', 'like', "%{$q}%");
            });
        }

        if ($request->filled('kategori') && $request->query('kategori') !== 'all') {
            $query->where('kategori', $request->query('kategori'));
        }

        $items = $query->get();

        return response()->json($items->map(fn ($item) => $this->transformForUser($item)));
    }

    public function showPublic($id)
    {
        $item = Perumahan::query()
            ->where('status_aktif', true)
            ->with([
                'media' => fn ($q) => $q->orderBy('urutan'),
                'units' => fn ($q) => $q
                    ->orderBy('kode_blok')
                    ->orderBy('nomor_unit'),
            ])
            ->find($id);

        if (! $item) {
            return response()->json(['message' => 'Perumahan tidak ditemukan.'], 404);
        }

        $this->ensureDefaultUnits($item);
        $item->loadMissing([
            'units' => fn ($q) => $q
                ->orderBy('kode_blok')
                ->orderBy('nomor_unit'),
        ]);

        return response()->json($this->transformForUser($item, true));
    }

    public function unitAvailability($id)
    {
        $item = Perumahan::query()
            ->where('status_aktif', true)
            ->with([
                'units' => fn ($q) => $q
                    ->orderBy('kode_blok')
                    ->orderBy('nomor_unit'),
            ])
            ->find($id);

        if (! $item) {
            return response()->json(['message' => 'Perumahan tidak ditemukan.'], 404);
        }

        $this->ensureDefaultUnits($item);
        $item->loadMissing([
            'units' => fn ($q) => $q
                ->orderBy('kode_blok')
                ->orderBy('nomor_unit'),
        ]);

        return response()->json([
            'propertyId' => $item->id_perumahan,
            'unitBlocks' => $this->buildUnitBlocks($item),
            'updatedAt' => now()->toDateTimeString(),
        ]);
    }

    public function optionsAdmin()
    {
        $perumahan = Perumahan::query()
            ->orderBy('nama_perumahan')
            ->get(['id_perumahan', 'nama_perumahan']);

        return response()->json($perumahan->map(fn ($item) => [
            'id' => $item->id_perumahan,
            'name' => $item->nama_perumahan,
        ]));
    }

    public function indexAdmin()
    {
        $items = Perumahan::query()
            ->with(['media' => fn ($q) => $q->orderBy('urutan')])
            ->orderByDesc('created_at')
            ->get();

        return response()->json($items->map(fn ($item) => $this->transformForAdmin($item)));
    }

    public function showAdmin($id)
    {
        $item = Perumahan::query()
            ->with([
                'media' => fn ($q) => $q->orderBy('urutan'),
                'units' => fn ($q) => $q
                    ->orderBy('kode_blok')
                    ->orderBy('nomor_unit'),
            ])
            ->find($id);

        if (! $item) {
            return response()->json(['message' => 'Perumahan tidak ditemukan.'], 404);
        }

        $this->ensureDefaultUnits($item);
        $item->loadMissing([
            'units' => fn ($q) => $q
                ->orderBy('kode_blok')
                ->orderBy('nomor_unit'),
        ]);

        return response()->json($this->transformForAdmin($item, true));
    }

    public function store(Request $request)
    {
        $validated = $this->validatePayload($request);

        $property = DB::transaction(function () use ($request, $validated) {
            $blockConfig = $this->resolveBlockConfig($validated, null);
            $totalUnits = $this->countUnitsFromBlocks($blockConfig);

            $payload = $validated;
            $payload['jumlah_seluruh_unit'] = $totalUnits;
            $payload['jumlah_unit_tersedia'] = $totalUnits;

            $property = Perumahan::create($this->preparePayload($payload));
            $this->syncMedia($property, $request);
            $this->syncUnits($property, $blockConfig);
            $this->refreshUnitCounters($property);

            return $property->fresh([
                'media' => fn ($q) => $q->orderBy('urutan'),
                'units' => fn ($q) => $q
                    ->orderBy('kode_blok')
                    ->orderBy('nomor_unit'),
            ]);
        });

        return response()->json([
            'message' => 'Perumahan berhasil ditambahkan.',
            'property' => $this->transformForAdmin($property, true),
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $property = Perumahan::query()->find($id);
        if (! $property) {
            return response()->json(['message' => 'Perumahan tidak ditemukan.'], 404);
        }

        $validated = $this->validatePayload($request);

        $property = DB::transaction(function () use ($request, $validated, $property) {
            $property->loadMissing([
                'units' => fn ($q) => $q
                    ->orderBy('kode_blok')
                    ->orderBy('nomor_unit'),
            ]);

            $blockConfig = $this->resolveBlockConfig($validated, $property);
            $payload = $validated;
            $payload['jumlah_seluruh_unit'] = $this->countUnitsFromBlocks($blockConfig);
            $payload['jumlah_unit_tersedia'] = (int) $property->jumlah_unit_tersedia;

            $property->update($this->preparePayload($payload));
            $this->syncMedia($property, $request);
            $this->syncUnits($property, $blockConfig);
            $this->refreshUnitCounters($property);

            return $property->fresh([
                'media' => fn ($q) => $q->orderBy('urutan'),
                'units' => fn ($q) => $q
                    ->orderBy('kode_blok')
                    ->orderBy('nomor_unit'),
            ]);
        });

        return response()->json([
            'message' => 'Perumahan berhasil diperbarui.',
            'property' => $this->transformForAdmin($property, true),
        ]);
    }

    public function updateUnitAdmin(Request $request, $id, $unitId)
    {
        $property = Perumahan::query()->find($id);
        if (! $property) {
            return response()->json(['message' => 'Perumahan tidak ditemukan.'], 404);
        }

        $validated = $request->validate([
            'sales_mode' => 'required|string|in:ready_stock,indent',
            'estimated_completion_date' => 'nullable|date',
        ], [
            'sales_mode.required' => 'Mode penjualan unit wajib dipilih.',
            'sales_mode.in' => 'Mode penjualan unit tidak valid.',
            'estimated_completion_date.date' => 'Estimasi selesai harus berupa tanggal yang valid.',
        ]);

        if (($validated['sales_mode'] ?? 'ready_stock') === 'indent' && empty($validated['estimated_completion_date'])) {
            throw ValidationException::withMessages([
                'estimated_completion_date' => ['Estimasi selesai wajib diisi untuk unit indent.'],
            ]);
        }

        $property = DB::transaction(function () use ($property, $unitId, $validated) {
            $unit = PerumahanUnit::query()
                ->where('id_unit_perumahan', $unitId)
                ->where('id_perumahan', $property->id_perumahan)
                ->lockForUpdate()
                ->first();

            if (! $unit) {
                throw new \Symfony\Component\HttpKernel\Exception\NotFoundHttpException('Unit tidak ditemukan pada perumahan ini.');
            }

            $unit->update([
                'sales_mode' => $validated['sales_mode'],
                'estimated_completion_date' => $validated['sales_mode'] === 'indent'
                    ? $validated['estimated_completion_date']
                    : null,
            ]);

            return $property->fresh([
                'media' => fn ($q) => $q->orderBy('urutan'),
                'units' => fn ($q) => $q
                    ->orderBy('kode_blok')
                    ->orderBy('nomor_unit'),
            ]);
        });

        return response()->json([
            'message' => 'Pengaturan unit berhasil diperbarui.',
            'property' => $this->transformForAdmin($property, true),
        ]);
    }

    public function destroy($id)
    {
        $property = Perumahan::query()->find($id);
        if (! $property) {
            return response()->json(['message' => 'Perumahan tidak ditemukan.'], 404);
        }

        $activeBookingStatuses = ['Menunggu', 'Disetujui'];
        $activeBookingCount = Booking::query()
            ->where('id_perumahan', $property->id_perumahan)
            ->whereIn('status_booking', $activeBookingStatuses)
            ->count();

        if ($activeBookingCount > 0) {
            return response()->json([
                'message' => 'Perumahan tidak dapat dihapus karena masih memiliki booking aktif (Menunggu/Disetujui).',
            ], 422);
        }

        DB::transaction(function () use ($property) {
            Booking::query()
                ->where('id_perumahan', $property->id_perumahan)
                ->delete();

            $property->delete();
        });

        return response()->json(['message' => 'Perumahan berhasil dihapus.']);
    }

    private function validatePayload(Request $request): array
    {
        $validated = $request->validate([
            'nama_perumahan' => 'required|string|max:150',
            'harga' => 'required|numeric|min:0',
            'suku_bunga_kpr' => 'required|numeric|min:0|max:100',
            'tipe_unit' => 'nullable|string|max:30',
            'kategori' => 'nullable|string|max:30',
            'jumlah_seluruh_unit' => 'required|integer|min:0',
            'jumlah_unit_tersedia' => 'required|integer|min:0',
            'deskripsi' => 'nullable|string',
            'alamat_lengkap' => 'nullable|string|max:255',
            'kota' => 'nullable|string|max:120',
            'gmaps_url' => 'nullable|string|max:255',
            'lokasi' => 'nullable|string|max:200',
            'luas_tanah' => 'nullable|numeric|min:0',
            'luas_bangunan' => 'nullable|numeric|min:0',
            'jumlah_kamar_tidur' => 'nullable|integer|min:0',
            'jumlah_kamar_mandi' => 'nullable|integer|min:0',
            'fasilitas' => 'nullable|string',
            'marketing_user_id' => 'required|integer|exists:user,id_user',
            'nama_bank_utj' => 'required|string|max:120',
            'no_rekening_utj' => 'required|string|max:50|regex:/^[0-9]+$/',
            'status_aktif' => 'nullable|boolean',
            'block_payload' => 'nullable|string',
            'media_payload' => 'nullable|string',
            'photos' => 'nullable|array|max:5',
            'photos.*' => 'nullable|image|max:5120',
        ], [
            'marketing_user_id.required' => 'Marketing wajib dipilih dari akun yang terdaftar.',
            'marketing_user_id.exists' => 'Marketing yang dipilih tidak ditemukan.',
            'nama_bank_utj.required' => 'Nama bank tujuan UTJ wajib diisi.',
            'no_rekening_utj.required' => 'No. rekening tujuan UTJ wajib diisi.',
            'no_rekening_utj.regex' => 'No. rekening tujuan UTJ hanya boleh berisi angka.',
            'suku_bunga_kpr.required' => 'Suku bunga KPR wajib diisi.',
            'suku_bunga_kpr.numeric' => 'Suku bunga KPR harus berupa angka.',
            'suku_bunga_kpr.min' => 'Suku bunga KPR tidak boleh kurang dari 0%.',
            'suku_bunga_kpr.max' => 'Suku bunga KPR tidak boleh lebih dari 100%.',
        ]);

        $marketingUser = $this->resolveMarketingUser((int) $validated['marketing_user_id']);
        $validated['id_marketing_user'] = (int) $marketingUser->id_user;
        $validated['nama_marketing'] = (string) $marketingUser->nama;
        $validated['whatsapp_marketing'] = (string) $marketingUser->no_hp;

        return $validated;
    }

    private function resolveMarketingUser(int $marketingUserId): User
    {
        $marketingUser = User::query()
            ->with('role:id_role,nama_role')
            ->find($marketingUserId);

        if (! $marketingUser || strtolower((string) $marketingUser->role?->nama_role) !== 'marketing') {
            throw ValidationException::withMessages([
                'marketing_user_id' => ['Akun yang dipilih bukan akun marketing.'],
            ]);
        }

        if (! (bool) $marketingUser->is_active) {
            throw ValidationException::withMessages([
                'marketing_user_id' => ['Akun marketing yang dipilih sedang nonaktif.'],
            ]);
        }

        if (trim((string) $marketingUser->no_hp) === '') {
            throw ValidationException::withMessages([
                'marketing_user_id' => ['Nomor WhatsApp marketing belum terdaftar pada akun tersebut.'],
            ]);
        }

        return $marketingUser;
    }

    private function preparePayload(array $validated): array
    {
        $lokasi = $validated['lokasi'] ?? '';
        if ($lokasi === '') {
            $parts = array_filter([
                $validated['kota'] ?? null,
                $validated['alamat_lengkap'] ?? null,
            ]);
            $lokasi = implode(', ', $parts);
        }

        return [
            'nama_perumahan' => $validated['nama_perumahan'],
            'harga' => $validated['harga'],
            'suku_bunga_kpr' => $validated['suku_bunga_kpr'],
            'tipe_unit' => $validated['tipe_unit'] ?? null,
            'kategori' => strtolower((string) ($validated['kategori'] ?? 'komersil')),
            'id_marketing_user' => $validated['id_marketing_user'],
            'jumlah_seluruh_unit' => $validated['jumlah_seluruh_unit'],
            'jumlah_unit_tersedia' => $validated['jumlah_unit_tersedia'],
            'deskripsi' => $validated['deskripsi'] ?? null,
            'alamat_lengkap' => $validated['alamat_lengkap'] ?? null,
            'kota' => $validated['kota'] ?? null,
            'gmaps_url' => $validated['gmaps_url'] ?? null,
            'lokasi' => $lokasi ?: ($validated['kota'] ?? '-'),
            'luas_tanah' => $validated['luas_tanah'] ?? null,
            'luas_bangunan' => $validated['luas_bangunan'] ?? null,
            'jumlah_kamar_tidur' => $validated['jumlah_kamar_tidur'] ?? null,
            'jumlah_kamar_mandi' => $validated['jumlah_kamar_mandi'] ?? null,
            'fasilitas' => $this->normalizeFacilities($validated['fasilitas'] ?? null),
            'nama_marketing' => $validated['nama_marketing'],
            'whatsapp_marketing' => $validated['whatsapp_marketing'],
            'nama_bank_utj' => trim((string) ($validated['nama_bank_utj'] ?? '')) ?: null,
            'no_rekening_utj' => preg_replace('/\D+/', '', (string) ($validated['no_rekening_utj'] ?? '')) ?: null,
            'status_aktif' => isset($validated['status_aktif']) ? (bool) $validated['status_aktif'] : true,
        ];
    }

    private function syncMedia(Perumahan $property, Request $request): void
    {
        $payload = [];
        if ($request->filled('media_payload')) {
            $decoded = json_decode((string) $request->input('media_payload'), true);
            if (is_array($decoded)) {
                $payload = array_slice($decoded, 0, 5);
            }
        }

        $existingByIndex = [];
        foreach ($payload as $item) {
            if (! is_array($item)) {
                continue;
            }
            $idx = (int) ($item['index'] ?? -1);
            $url = $item['url_file'] ?? null;
            if ($idx >= 0 && $idx < 5 && is_string($url) && $url !== '') {
                $existingByIndex[$idx] = $url;
            }
        }

        $files = $request->file('photos', []);
        $finalMedia = [];

        for ($i = 0; $i < 5; $i++) {
            if (isset($files[$i]) && $files[$i]) {
                $finalMedia[] = [
                    'url_file' => $this->storePhoto($files[$i]),
                    'urutan' => $i + 1,
                ];
                continue;
            }

            if (! empty($existingByIndex[$i])) {
                $finalMedia[] = [
                    'url_file' => $existingByIndex[$i],
                    'urutan' => $i + 1,
                ];
            }
        }

        $property->media()->delete();

        foreach ($finalMedia as $media) {
            PerumahanMedia::create([
                'id_perumahan' => $property->id_perumahan,
                'tipe' => 'foto',
                'url_file' => $media['url_file'],
                'caption' => null,
                'urutan' => $media['urutan'],
            ]);
        }
    }

    private function storePhoto($file): string
    {
        $ext = $file->getClientOriginalExtension() ?: 'jpg';
        $filename = Str::uuid()->toString().'.'.$ext;
        $directory = public_path('uploads/perumahan');

        if (! is_dir($directory)) {
            mkdir($directory, 0755, true);
        }

        $file->move($directory, $filename);

        return '/uploads/perumahan/'.$filename;
    }

    private function normalizeFacilities(?string $raw): ?string
    {
        if ($raw === null || trim($raw) === '') {
            return null;
        }

        $decoded = json_decode($raw, true);
        if (! is_array($decoded)) {
            return null;
        }

        $filtered = array_values(array_filter(array_map(function ($item) {
            return is_string($item) ? trim($item) : '';
        }, $decoded)));

        return empty($filtered) ? null : json_encode($filtered);
    }

    private function resolveBlockConfig(array $validated, ?Perumahan $property): array
    {
        $payload = $this->decodeBlockPayload($validated['block_payload'] ?? null);
        if (! empty($payload)) {
            return $payload;
        }

        if ($property && $property->relationLoaded('units') && $property->units->isNotEmpty()) {
            return $property->units
                ->groupBy('kode_blok')
                ->values()
                ->map(function ($group) {
                    $first = $group->first();
                    return [
                        'block_name' => $first->nama_blok,
                        'block_code' => $first->kode_blok,
                        'unit_count' => $group->count(),
                        'units' => $group
                            ->sortBy('nomor_unit')
                            ->values()
                            ->map(fn ($unit) => [
                                'unit_number' => (int) $unit->nomor_unit,
                                'sales_mode' => $unit->sales_mode ?: 'ready_stock',
                                'estimated_completion_date' => optional($unit->estimated_completion_date)->toDateString(),
                            ])
                            ->all(),
                    ];
                })
                ->values()
                ->all();
        }

        $fallbackTotal = max(1, (int) ($validated['jumlah_seluruh_unit'] ?? 1));

        return [[
            'block_name' => 'Blok A',
            'block_code' => 'A',
            'unit_count' => $fallbackTotal,
            'units' => $this->normalizeBlockUnits([], $fallbackTotal),
        ]];
    }

    private function decodeBlockPayload(?string $raw): array
    {
        if (! is_string($raw) || trim($raw) === '') {
            return [];
        }

        $decoded = json_decode($raw, true);
        if (! is_array($decoded)) {
            throw ValidationException::withMessages([
                'block_payload' => ['Format blok unit tidak valid.'],
            ]);
        }

        $blocks = [];
        $usedCodes = [];

        foreach ($decoded as $index => $item) {
            if (! is_array($item)) {
                continue;
            }

            $blockName = trim((string) ($item['blockName'] ?? $item['block_name'] ?? ''));
            $unitCount = (int) ($item['unitCount'] ?? $item['unit_count'] ?? 0);

            if ($blockName === '' || $unitCount < 1) {
                continue;
            }

            $blockCode = $this->normalizeBlockCode($blockName, $index);
            if (isset($usedCodes[$blockCode])) {
                throw ValidationException::withMessages([
                    'block_payload' => ["Kode blok duplikat terdeteksi: {$blockCode}. Gunakan nama blok yang berbeda."],
                ]);
            }

            $usedCodes[$blockCode] = true;
            $blocks[] = [
                'block_name' => $blockName,
                'block_code' => $blockCode,
                'unit_count' => $unitCount,
                'units' => $this->normalizeBlockUnits(is_array($item['units'] ?? null) ? $item['units'] : [], $unitCount),
            ];
        }

        if (empty($blocks)) {
            throw ValidationException::withMessages([
                'block_payload' => ['Minimal satu blok dengan jumlah unit valid wajib diisi.'],
            ]);
        }

        return $blocks;
    }

    private function normalizeBlockUnits(array $rawUnits, int $unitCount): array
    {
        $unitsByNumber = [];

        foreach ($rawUnits as $index => $unit) {
            if (! is_array($unit)) {
                continue;
            }

            $unitNumber = (int) ($unit['unitNumber'] ?? $unit['unit_number'] ?? ($index + 1));
            if ($unitNumber < 1 || $unitNumber > $unitCount) {
                continue;
            }

            $salesMode = strtolower(trim((string) ($unit['salesMode'] ?? $unit['sales_mode'] ?? 'ready_stock')));
            $salesMode = $salesMode === 'indent' ? 'indent' : 'ready_stock';
            $estimatedCompletionDate = $salesMode === 'indent'
                ? trim((string) ($unit['estimatedCompletionDate'] ?? $unit['estimated_completion_date'] ?? ''))
                : null;

            if ($salesMode === 'indent' && $estimatedCompletionDate === '') {
                throw ValidationException::withMessages([
                    'block_payload' => ["Estimasi selesai wajib diisi untuk unit indent nomor {$unitNumber}."],
                ]);
            }

            if ($salesMode === 'indent' && ! $this->isValidIsoDate($estimatedCompletionDate)) {
                throw ValidationException::withMessages([
                    'block_payload' => ["Format estimasi selesai untuk unit {$unitNumber} tidak valid."],
                ]);
            }

            $unitsByNumber[$unitNumber] = [
                'unit_number' => $unitNumber,
                'sales_mode' => $salesMode,
                'estimated_completion_date' => $salesMode === 'indent'
                    ? $estimatedCompletionDate
                    : null,
            ];
        }

        $units = [];
        for ($i = 1; $i <= $unitCount; $i++) {
            $units[] = $unitsByNumber[$i] ?? [
                'unit_number' => $i,
                'sales_mode' => 'ready_stock',
                'estimated_completion_date' => null,
            ];
        }

        return $units;
    }

    private function isValidIsoDate(?string $value): bool
    {
        if (! is_string($value) || trim($value) === '') {
            return false;
        }

        $date = \DateTime::createFromFormat('Y-m-d', $value);

        return $date !== false && $date->format('Y-m-d') === $value;
    }

    private function normalizeBlockCode(string $blockName, int $index): string
    {
        $upper = strtoupper(trim($blockName));
        $upper = preg_replace('/^BLOK\s*/', '', $upper) ?? '';
        $upper = preg_replace('/[^A-Z0-9]/', '', $upper) ?? '';

        if ($upper === '') {
            return 'B'.($index + 1);
        }

        return $upper;
    }

    private function countUnitsFromBlocks(array $blocks): int
    {
        return array_reduce($blocks, function ($carry, $block) {
            return $carry + (int) ($block['unit_count'] ?? 0);
        }, 0);
    }

    private function syncUnits(Perumahan $property, array $blocks): void
    {
        $desiredUnits = [];
        foreach ($blocks as $block) {
            $blockName = $block['block_name'];
            $blockCode = $block['block_code'];
            $unitCount = (int) $block['unit_count'];
            $unitConfigs = collect($block['units'] ?? [])
                ->keyBy(fn ($unit) => (int) ($unit['unit_number'] ?? 0));

            for ($i = 1; $i <= $unitCount; $i++) {
                $code = "{$blockCode}{$i}";
                $unitConfig = $unitConfigs->get($i, [
                    'sales_mode' => 'ready_stock',
                    'estimated_completion_date' => null,
                ]);
                $desiredUnits[$code] = [
                    'id_perumahan' => $property->id_perumahan,
                    'nama_blok' => $blockName,
                    'kode_blok' => $blockCode,
                    'nomor_unit' => $i,
                    'kode_unit' => $code,
                    'sales_mode' => $unitConfig['sales_mode'] ?? 'ready_stock',
                    'estimated_completion_date' => $unitConfig['estimated_completion_date'] ?? null,
                ];
            }
        }

        $existingUnits = PerumahanUnit::query()
            ->where('id_perumahan', $property->id_perumahan)
            ->get()
            ->keyBy('kode_unit');

        $lockedUnits = [];
        foreach ($existingUnits as $existingCode => $existingUnit) {
            if (isset($desiredUnits[$existingCode])) {
                continue;
            }

            if ($existingUnit->status_unit !== 'available') {
                $lockedUnits[] = $existingCode;
            }
        }

        if (! empty($lockedUnits)) {
                throw ValidationException::withMessages([
                    'block_payload' => [
                    'Perubahan blok tidak bisa disimpan karena unit berikut sedang terbooking atau sudah terjual: '.implode(', ', $lockedUnits),
                ],
            ]);
        }

        foreach ($desiredUnits as $unitCode => $payload) {
            $existing = $existingUnits->get($unitCode);
            if ($existing) {
                $existing->update([
                    'nama_blok' => $payload['nama_blok'],
                    'kode_blok' => $payload['kode_blok'],
                    'nomor_unit' => $payload['nomor_unit'],
                    'sales_mode' => $payload['sales_mode'] ?? 'ready_stock',
                    'estimated_completion_date' => $payload['estimated_completion_date'] ?? null,
                ]);
                continue;
            }

            PerumahanUnit::create([
                'id_perumahan' => $payload['id_perumahan'],
                'nama_blok' => $payload['nama_blok'],
                'kode_blok' => $payload['kode_blok'],
                'nomor_unit' => $payload['nomor_unit'],
                'kode_unit' => $payload['kode_unit'],
                'status_unit' => 'available',
                'sales_mode' => $payload['sales_mode'] ?? 'ready_stock',
                'estimated_completion_date' => $payload['estimated_completion_date'] ?? null,
                'id_booking_terakhir' => null,
            ]);
        }

        if ($existingUnits->isNotEmpty()) {
            PerumahanUnit::query()
                ->where('id_perumahan', $property->id_perumahan)
                ->whereNotIn('kode_unit', array_keys($desiredUnits))
                ->delete();
        }
    }

    private function ensureDefaultUnits(Perumahan $property): void
    {
        if ($property->relationLoaded('units') && $property->units->isNotEmpty()) {
            return;
        }

        if (! $property->relationLoaded('units') && $property->units()->exists()) {
            return;
        }

        $totalUnits = (int) $property->jumlah_seluruh_unit;
        if ($totalUnits <= 0) {
            return;
        }

        $availableUnits = max(0, min((int) $property->jumlah_unit_tersedia, $totalUnits));

        $units = [];
        for ($i = 1; $i <= $totalUnits; $i++) {
            $units[] = [
                'id_perumahan' => $property->id_perumahan,
                'nama_blok' => 'Blok A',
                'kode_blok' => 'A',
                'nomor_unit' => $i,
                'kode_unit' => "A{$i}",
                'status_unit' => $i <= $availableUnits ? 'available' : 'sold',
                'sales_mode' => 'ready_stock',
                'estimated_completion_date' => null,
                'id_booking_terakhir' => null,
            ];
        }

        PerumahanUnit::query()->insertOrIgnore($units);
    }

    private function refreshUnitCounters(Perumahan $property): void
    {
        $total = PerumahanUnit::query()
            ->where('id_perumahan', $property->id_perumahan)
            ->count();

        $available = PerumahanUnit::query()
            ->where('id_perumahan', $property->id_perumahan)
            ->where('status_unit', 'available')
            ->count();

        $property->update([
            'jumlah_seluruh_unit' => $total,
            'jumlah_unit_tersedia' => $available,
        ]);
    }

    private function mediaUrls(Perumahan $property): array
    {
        return $property->media
            ->sortBy('urutan')
            ->pluck('url_file')
            ->filter()
            ->values()
            ->all();
    }

    private function buildUnitBlocks(Perumahan $property): array
    {
        $grouped = $property->units
            ->sortBy(fn ($unit) => sprintf('%s-%06d', $unit->kode_blok, $unit->nomor_unit))
            ->groupBy('kode_blok');

        return $grouped->map(function ($units) {
            $first = $units->first();

            return [
                'blockName' => $first->nama_blok,
                'blockCode' => $first->kode_blok,
                'units' => $units->map(function ($unit) {
                    return [
                        'id' => $unit->id_unit_perumahan,
                        'code' => $unit->kode_unit,
                        'status' => $unit->status_unit,
                        'salesMode' => $unit->sales_mode ?: 'ready_stock',
                        'estimatedCompletionDate' => optional($unit->estimated_completion_date)->toDateString(),
                    ];
                })->values()->all(),
            ];
        })->values()->all();
    }

    private function buildBlockConfig(Perumahan $property): array
    {
        return $property->units
            ->groupBy('kode_blok')
            ->map(function ($units) {
                $first = $units->first();
                return [
                    'blockName' => $first->nama_blok,
                    'unitCount' => $units->count(),
                ];
            })
            ->values()
            ->all();
    }

    private function resolvePropertyStatusLabel(Perumahan $property): string
    {
        return ((int) $property->jumlah_unit_tersedia) > 0
            ? 'Tersedia'
            : 'Terjual Habis';
    }

    private function transformForUser(Perumahan $property, bool $withUnits = false): array
    {
        $images = $this->mediaUrls($property);
        $facilities = json_decode((string) ($property->fasilitas ?? '[]'), true);

        $result = [
            'id' => $property->id_perumahan,
            'name' => $property->nama_perumahan,
            'location' => $property->lokasi,
            'address' => $property->alamat_lengkap,
            'city' => $property->kota,
            'gmapsUrl' => $property->gmaps_url,
            'price' => (float) $property->harga,
            'kprInterest' => $property->suku_bunga_kpr !== null ? (float) $property->suku_bunga_kpr : null,
            'image' => $images[0] ?? '',
            'images' => $images,
            'type' => $property->tipe_unit,
            'category' => $property->kategori ?: 'komersil',
            'beds' => $property->jumlah_kamar_tidur,
            'baths' => $property->jumlah_kamar_mandi,
            'status' => $this->resolvePropertyStatusLabel($property),
            'description' => $property->deskripsi,
            'land' => $property->luas_tanah ? (float) $property->luas_tanah : null,
            'building' => $property->luas_bangunan ? (float) $property->luas_bangunan : null,
            'availableUnits' => (int) $property->jumlah_unit_tersedia,
            'totalUnits' => (int) $property->jumlah_seluruh_unit,
            'facilities' => is_array($facilities) ? $facilities : [],
            'marketingUserId' => $property->id_marketing_user ? (int) $property->id_marketing_user : null,
            'marketingName' => $property->nama_marketing,
            'marketingWhatsapp' => $property->whatsapp_marketing,
            'bankNameUtj' => $property->nama_bank_utj,
            'noRekeningUtj' => $property->no_rekening_utj,
            'isActive' => (bool) $property->status_aktif,
        ];

        if ($withUnits) {
            $result['unitBlocks'] = $this->buildUnitBlocks($property);
        }

        return $result;
    }

    private function transformForAdmin(Perumahan $property, bool $withUnits = false): array
    {
        $result = $this->transformForUser($property, $withUnits);
        $result['statusAktif'] = (bool) $property->status_aktif;

        if ($withUnits) {
            $result['blockConfig'] = $this->buildBlockConfig($property);
        }

        return $result;
    }
}
