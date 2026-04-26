<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TemplateSurat;
use Illuminate\Http\Request;

class TemplateSuratController extends Controller
{
    public function index()
    {
        $items = TemplateSurat::query()
            ->orderByDesc('updated_at')
            ->orderByDesc('id')
            ->get();

        return response()->json($items);
    }

    public function store(Request $request)
    {
        $item = TemplateSurat::create($this->validatePayload($request));

        return response()->json([
            'message' => 'Template surat berhasil ditambahkan.',
            'data' => $item,
        ], 201);
    }

    public function show(string $id)
    {
        $item = TemplateSurat::query()->findOrFail($id);

        return response()->json($item);
    }

    public function update(Request $request, string $id)
    {
        $item = TemplateSurat::query()->findOrFail($id);
        $item->update($this->validatePayload($request));

        return response()->json([
            'message' => 'Template surat berhasil diperbarui.',
            'data' => $item->fresh(),
        ]);
    }

    public function destroy(string $id)
    {
        $item = TemplateSurat::query()->findOrFail($id);
        $item->delete();

        return response()->json([
            'message' => 'Template surat berhasil dihapus.',
        ]);
    }

    private function validatePayload(Request $request): array
    {
        return $request->validate([
            'nama_file' => ['required', 'string', 'max:150'],
            'jenis_surat' => ['required', 'string', 'max:100'],
            'link_gdocs' => ['required', 'url', 'max:2000'],
        ], [
            'nama_file.required' => 'Nama template wajib diisi.',
            'nama_file.max' => 'Nama template maksimal 150 karakter.',
            'jenis_surat.required' => 'Jenis surat wajib diisi.',
            'jenis_surat.max' => 'Jenis surat maksimal 100 karakter.',
            'link_gdocs.required' => 'Link Google Docs wajib diisi.',
            'link_gdocs.url' => 'Link Google Docs harus berupa URL yang valid.',
            'link_gdocs.max' => 'Link Google Docs maksimal 2000 karakter.',
        ]);
    }
}
