<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Perumahan;
use App\Models\PerumahanMedia;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

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
            ->with(['media' => fn ($q) => $q->orderBy('urutan')])
            ->find($id);

        if (! $item) {
            return response()->json(['message' => 'Perumahan tidak ditemukan.'], 404);
        }

        return response()->json($this->transformForUser($item));
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
            ->with(['media' => fn ($q) => $q->orderBy('urutan')])
            ->find($id);

        if (! $item) {
            return response()->json(['message' => 'Perumahan tidak ditemukan.'], 404);
        }

        return response()->json($this->transformForAdmin($item));
    }

    public function store(Request $request)
    {
        $validated = $this->validatePayload($request);

        $property = DB::transaction(function () use ($request, $validated) {
            $property = Perumahan::create($this->preparePayload($validated));
            $this->syncMedia($property, $request);

            return $property->fresh(['media' => fn ($q) => $q->orderBy('urutan')]);
        });

        return response()->json([
            'message' => 'Perumahan berhasil ditambahkan.',
            'property' => $this->transformForAdmin($property),
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
            $property->update($this->preparePayload($validated));
            $this->syncMedia($property, $request);

            return $property->fresh(['media' => fn ($q) => $q->orderBy('urutan')]);
        });

        return response()->json([
            'message' => 'Perumahan berhasil diperbarui.',
            'property' => $this->transformForAdmin($property),
        ]);
    }

    public function destroy($id)
    {
        $property = Perumahan::query()->find($id);
        if (! $property) {
            return response()->json(['message' => 'Perumahan tidak ditemukan.'], 404);
        }

        $property->delete();

        return response()->json(['message' => 'Perumahan berhasil dihapus.']);
    }

    private function validatePayload(Request $request): array
    {
        return $request->validate([
            'nama_perumahan' => 'required|string|max:150',
            'harga' => 'required|numeric|min:0',
            'tipe_unit' => 'nullable|string|max:30',
            'kategori' => 'nullable|string|max:30',
            'status_label' => 'nullable|string|max:30',
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
            'nama_marketing' => 'required|string|max:120',
            'whatsapp_marketing' => 'required|string|regex:/^62[0-9]+$/|max:25',
            'status_aktif' => 'nullable|boolean',
            'media_payload' => 'nullable|string',
            'photos' => 'nullable|array|max:4',
            'photos.*' => 'nullable|image|max:5120',
        ]);
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
            'tipe_unit' => $validated['tipe_unit'] ?? null,
            'kategori' => strtolower((string) ($validated['kategori'] ?? 'komersil')),
            'status_label' => $validated['status_label'] ?? 'Available',
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
            'status_aktif' => isset($validated['status_aktif']) ? (bool) $validated['status_aktif'] : true,
        ];
    }

    private function syncMedia(Perumahan $property, Request $request): void
    {
        $payload = [];
        if ($request->filled('media_payload')) {
            $decoded = json_decode((string) $request->input('media_payload'), true);
            if (is_array($decoded)) {
                $payload = array_slice($decoded, 0, 4);
            }
        }

        $existingByIndex = [];
        foreach ($payload as $item) {
            if (! is_array($item)) {
                continue;
            }
            $idx = (int) ($item['index'] ?? -1);
            $url = $item['url_file'] ?? null;
            if ($idx >= 0 && $idx < 4 && is_string($url) && $url !== '') {
                $existingByIndex[$idx] = $url;
            }
        }

        $files = $request->file('photos', []);
        $finalMedia = [];

        for ($i = 0; $i < 4; $i++) {
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

    private function mediaUrls(Perumahan $property): array
    {
        return $property->media
            ->sortBy('urutan')
            ->pluck('url_file')
            ->filter()
            ->values()
            ->all();
    }

    private function transformForUser(Perumahan $property): array
    {
        $images = $this->mediaUrls($property);
        $facilities = json_decode((string) ($property->fasilitas ?? '[]'), true);

        return [
            'id' => $property->id_perumahan,
            'name' => $property->nama_perumahan,
            'location' => $property->lokasi,
            'address' => $property->alamat_lengkap,
            'city' => $property->kota,
            'gmapsUrl' => $property->gmaps_url,
            'price' => (float) $property->harga,
            'image' => $images[0] ?? '',
            'images' => $images,
            'type' => $property->tipe_unit,
            'category' => $property->kategori ?: 'komersil',
            'beds' => $property->jumlah_kamar_tidur,
            'baths' => $property->jumlah_kamar_mandi,
            'status' => $property->status_label ?: 'Available',
            'description' => $property->deskripsi,
            'land' => $property->luas_tanah ? (float) $property->luas_tanah : null,
            'building' => $property->luas_bangunan ? (float) $property->luas_bangunan : null,
            'availableUnits' => (int) $property->jumlah_unit_tersedia,
            'totalUnits' => (int) $property->jumlah_seluruh_unit,
            'facilities' => is_array($facilities) ? $facilities : [],
            'marketingName' => $property->nama_marketing,
            'marketingWhatsapp' => $property->whatsapp_marketing,
            'isActive' => (bool) $property->status_aktif,
        ];
    }

    private function transformForAdmin(Perumahan $property): array
    {
        $result = $this->transformForUser($property);
        $result['statusAktif'] = (bool) $property->status_aktif;

        return $result;
    }
}
