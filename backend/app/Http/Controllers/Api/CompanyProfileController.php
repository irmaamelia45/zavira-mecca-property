<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ProfilPerusahaan;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CompanyProfileController extends Controller
{
    public function show()
    {
        $profile = ProfilPerusahaan::query()->first();

        if (! $profile) {
            return response()->json(null);
        }

        return response()->json([
            'id_profil' => $profile->id_profil,
            'nama_perusahaan' => $profile->nama_perusahaan,
            'alamat' => $profile->alamat,
            'email' => $profile->email,
            'telepon' => $profile->telepon,
            'whatsapp' => $profile->whatsapp,
            'website' => $profile->website,
            'deskripsi' => $profile->deskripsi,
            'visi' => $profile->visi,
            'misi' => $profile->misi,
            'logo_path' => $profile->logo_path,
            'penghargaan' => $this->decodeJson($profile->penghargaan),
            'struktur_organisasi' => $this->decodeJson($profile->struktur_organisasi),
        ]);
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'nama_perusahaan' => 'required|string|max:150',
            'alamat' => 'nullable|string|max:255',
            'email' => 'nullable|string|max:120',
            'telepon' => 'nullable|string|max:25',
            'whatsapp' => 'nullable|string|max:25',
            'website' => 'nullable|string|max:150',
            'deskripsi' => 'nullable|string',
            'visi' => 'nullable|string',
            'misi' => 'nullable|string',
            'penghargaan' => 'nullable|string',
            'struktur_organisasi' => 'nullable|string',
            'logo' => 'nullable|image|max:2048',
            'awards_images.*' => 'nullable|image|max:2048',
            'team_images.*' => 'nullable|image|max:2048',
        ]);

        $profile = ProfilPerusahaan::query()->first();
        $awards = $this->decodeJson($request->input('penghargaan'));
        $team = $this->decodeJson($request->input('struktur_organisasi'));

        $awards = $this->hydrateAwards($request, $awards);
        $team = $this->hydrateTeam($request, $team);

        $payload = [
            'nama_perusahaan' => $validated['nama_perusahaan'],
            'alamat' => $validated['alamat'] ?? null,
            'email' => $validated['email'] ?? null,
            'telepon' => $validated['telepon'] ?? null,
            'whatsapp' => $validated['whatsapp'] ?? null,
            'website' => $validated['website'] ?? null,
            'deskripsi' => $validated['deskripsi'] ?? null,
            'visi' => $validated['visi'] ?? null,
            'misi' => $validated['misi'] ?? null,
            'penghargaan' => json_encode($awards),
            'struktur_organisasi' => json_encode($team),
        ];

        if ($request->hasFile('logo')) {
            $payload['logo_path'] = $this->storePublicFile($request->file('logo'), 'company-profile');
        }

        if ($profile) {
            $profile->update($payload);
        } else {
            $profile = ProfilPerusahaan::create($payload);
        }

        return response()->json([
            'message' => 'Profil perusahaan tersimpan.',
            'id_profil' => $profile->id_profil,
        ]);
    }

    private function hydrateAwards(Request $request, array $awards): array
    {
        $awards = array_values($awards);

        foreach ($awards as $index => $award) {
            $imageFile = $request->file("awards_images.$index");
            $image = $award['image'] ?? null;

            if ($imageFile) {
                $image = $this->storePublicFile($imageFile, 'company-profile/awards');
            }

            $awards[$index] = [
                'title' => $award['title'] ?? '',
                'desc' => $award['desc'] ?? '',
                'image' => $image,
            ];
        }

        return array_values(array_filter($awards, function ($award) {
            return ($award['title'] ?? '') !== '' || ($award['desc'] ?? '') !== '' || !empty($award['image']);
        }));
    }

    private function hydrateTeam(Request $request, array $team): array
    {
        $team = array_values($team);

        foreach ($team as $index => $member) {
            $imageFile = $request->file("team_images.$index");
            $image = $member['image'] ?? null;

            if ($imageFile) {
                $image = $this->storePublicFile($imageFile, 'company-profile/organization');
            }

            $team[$index] = [
                'name' => $member['name'] ?? '',
                'role' => $member['role'] ?? '',
                'image' => $image,
            ];
        }

        return array_values(array_filter($team, function ($member) {
            return ($member['name'] ?? '') !== '' || ($member['role'] ?? '') !== '' || !empty($member['image']);
        }));
    }

    private function decodeJson(?string $value): array
    {
        if (! $value) {
            return [];
        }

        $decoded = json_decode($value, true);

        return is_array($decoded) ? $decoded : [];
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
