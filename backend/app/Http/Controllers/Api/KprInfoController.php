<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\KprInfo;
use Illuminate\Http\Request;

class KprInfoController extends Controller
{
    public function index()
    {
        $items = KprInfo::query()
            ->orderBy('jenis_konten')
            ->orderBy('id_kpr_info')
            ->get();

        return response()->json($items);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'judul' => 'required|string|max:150',
            'jenis_konten' => 'required|in:informasi,syarat,alur',
            'konten' => 'required|string',
        ]);

        $item = KprInfo::create($validated);

        return response()->json($item, 201);
    }

    public function show(string $id)
    {
        $item = KprInfo::findOrFail($id);

        return response()->json($item);
    }

    public function update(Request $request, string $id)
    {
        $item = KprInfo::findOrFail($id);

        $validated = $request->validate([
            'judul' => 'required|string|max:150',
            'jenis_konten' => 'required|in:informasi,syarat,alur',
            'konten' => 'required|string',
        ]);

        $item->update($validated);

        return response()->json($item);
    }

    public function destroy(string $id)
    {
        $item = KprInfo::findOrFail($id);
        $item->delete();

        return response()->json(['message' => 'Deleted']);
    }
}
