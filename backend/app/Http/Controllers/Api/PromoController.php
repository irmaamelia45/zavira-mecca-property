<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Promo;
use App\Models\Perumahan;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class PromoController extends Controller
{
    public function index()
    {
        $promos = Promo::query()
            ->with(['perumahans:id_perumahan,nama_perumahan'])
            ->orderByDesc('created_at')
            ->get();

        return response()->json($promos->map(fn ($promo) => $this->formatPromo($promo)));
    }

    public function show($id)
    {
        $promo = Promo::query()
            ->with(['perumahans:id_perumahan,nama_perumahan'])
            ->find($id);

        if (! $promo) {
            return response()->json(['message' => 'Promo tidak ditemukan.'], 404);
        }

        return response()->json($this->formatPromo($promo));
    }

    public function store(Request $request)
    {
        $validated = $this->validatePayload($request);

        $propertyIds = $this->normalizePropertyIds($request->input('property_ids', []));

        if (empty($propertyIds)) {
            return response()->json(['message' => 'Pilih minimal satu perumahan.'], 422);
        }

        $payload = $this->buildPayload($validated, $request);
        $payload['id_perumahan'] = $propertyIds[0];

        $promo = Promo::create($payload);
        $promo->perumahans()->sync($propertyIds);

        return response()->json([
            'message' => 'Promo berhasil ditambahkan.',
            'promo' => $this->formatPromo($promo->load('perumahans:id_perumahan,nama_perumahan')),
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $promo = Promo::query()->find($id);

        if (! $promo) {
            return response()->json(['message' => 'Promo tidak ditemukan.'], 404);
        }

        $validated = $this->validatePayload($request, true);
        $propertyIds = $this->normalizePropertyIds($request->input('property_ids', []));

        if (empty($propertyIds)) {
            return response()->json(['message' => 'Pilih minimal satu perumahan.'], 422);
        }

        $payload = $this->buildPayload($validated, $request);
        $payload['id_perumahan'] = $propertyIds[0];

        $promo->update($payload);
        $promo->perumahans()->sync($propertyIds);

        return response()->json([
            'message' => 'Promo berhasil diperbarui.',
            'promo' => $this->formatPromo($promo->load('perumahans:id_perumahan,nama_perumahan')),
        ]);
    }

    public function destroy($id)
    {
        $promo = Promo::query()->find($id);

        if (! $promo) {
            return response()->json(['message' => 'Promo tidak ditemukan.'], 404);
        }

        $promo->perumahans()->detach();
        $promo->delete();

        return response()->json(['message' => 'Promo berhasil dihapus.']);
    }

    private function validatePayload(Request $request, bool $isUpdate = false): array
    {
        return $request->validate([
            'judul' => ($isUpdate ? 'sometimes' : 'required').'|string|max:150',
            'kategori' => 'nullable|string|max:50',
            'deskripsi' => 'nullable|string',
            'tipe_promo' => ($isUpdate ? 'sometimes' : 'required').'|string|max:30',
            'nilai_promo' => 'nullable|numeric|min:0',
            'tanggal_mulai' => 'nullable|date',
            'tanggal_selesai' => 'nullable|date|after_or_equal:tanggal_mulai',
            'is_active' => 'nullable|boolean',
            'banner' => 'nullable|image|max:2048',
            'property_ids' => 'nullable|array',
            'property_ids.*' => 'integer|exists:perumahan,id_perumahan',
        ]);
    }

    private function normalizePropertyIds($propertyIds): array
    {
        if (! is_array($propertyIds)) {
            return [];
        }

        return array_values(array_unique(array_filter($propertyIds, fn ($id) => ! empty($id))));
    }

    private function buildPayload(array $validated, Request $request): array
    {
        $payload = [
            'judul' => $validated['judul'] ?? $request->input('judul'),
            'kategori' => $validated['kategori'] ?? $request->input('kategori'),
            'deskripsi' => $validated['deskripsi'] ?? $request->input('deskripsi'),
            'tipe_promo' => $validated['tipe_promo'] ?? $request->input('tipe_promo'),
            'nilai_promo' => $validated['nilai_promo'] ?? $request->input('nilai_promo'),
            'tanggal_mulai' => $validated['tanggal_mulai'] ?? $request->input('tanggal_mulai'),
            'tanggal_selesai' => $validated['tanggal_selesai'] ?? $request->input('tanggal_selesai'),
            'is_active' => isset($validated['is_active']) ? $validated['is_active'] : (bool) $request->input('is_active'),
        ];

        if ($request->hasFile('banner')) {
            $payload['banner_path'] = $this->storePublicFile($request->file('banner'), 'promos');
        }

        return $payload;
    }

    private function formatPromo(Promo $promo): array
    {
        $properties = $promo->perumahans ?? collect();

        if ($properties->isEmpty() && $promo->id_perumahan) {
            $primary = Perumahan::query()->find($promo->id_perumahan);
            if ($primary) {
                $properties = collect([$primary]);
            }
        }
        $propertyIds = $properties->pluck('id_perumahan')->values();

        if ($propertyIds->isEmpty() && $promo->id_perumahan) {
            $propertyIds = collect([$promo->id_perumahan]);
        }

        return [
            'id' => $promo->id_promo,
            'judul' => $promo->judul,
            'kategori' => $promo->kategori,
            'deskripsi' => $promo->deskripsi,
            'tipe_promo' => $promo->tipe_promo,
            'nilai_promo' => $promo->nilai_promo,
            'tanggal_mulai' => optional($promo->tanggal_mulai)->toDateString(),
            'tanggal_selesai' => optional($promo->tanggal_selesai)->toDateString(),
            'is_active' => (bool) $promo->is_active,
            'banner_path' => $promo->banner_path,
            'property_ids' => $propertyIds->values()->all(),
            'properties' => $properties->map(fn ($property) => [
                'id' => $property->id_perumahan,
                'name' => $property->nama_perumahan,
            ])->values()->all(),
        ];
    }

    private function storePublicFile($file, string $folder): string
    {
        $extension = $file->getClientOriginalExtension() ?: 'jpg';
        $filename = Str::uuid()->toString().'.'.$extension;
        $path = public_path('uploads/'.$folder);

        if (! is_dir($path)) {
            mkdir($path, 0755, true);
        }

        $file->move($path, $filename);

        return '/uploads/'.$folder.'/'.$filename;
    }
}
