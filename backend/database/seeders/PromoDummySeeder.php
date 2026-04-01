<?php

namespace Database\Seeders;

use App\Models\Perumahan;
use App\Models\Promo;
use Illuminate\Database\Seeder;

class PromoDummySeeder extends Seeder
{
    /**
     * Seed dummy promo for Mecca Green Valley: potongan harga Rp60.000.000.
     */
    public function run(): void
    {
        $property = Perumahan::query()
            ->where('nama_perumahan', 'Mecca Green Valley')
            ->first();

        if (! $property) {
            $property = Perumahan::create([
                'nama_perumahan' => 'Mecca Green Valley',
                'lokasi' => 'Sukarame, Bandar Lampung',
                'alamat_lengkap' => 'Jl. Endro Suratmin No. 55, Sukarame',
                'kota' => 'Bandar Lampung',
                'gmaps_url' => 'https://maps.google.com/?q=Sukarame+Bandar+Lampung',
                'deskripsi' => 'Lingkungan asri dengan akses cepat ke kampus dan pusat belanja.',
                'harga' => 560000000,
                'tipe_unit' => '45/90',
                'kategori' => 'komersil',
                'status_label' => 'Available',
                'jumlah_seluruh_unit' => 85,
                'jumlah_unit_tersedia' => 22,
                'status_aktif' => true,
                'nama_marketing' => 'Rizki Pratama',
                'whatsapp_marketing' => '6281234567802',
            ]);
        }

        $promo = Promo::query()->updateOrCreate(
            ['judul' => 'Promo Mecca Green Valley - Potongan 60 Juta'],
            [
                'id_perumahan' => $property->id_perumahan,
                'kategori' => 'Diskon',
                'deskripsi' => 'Potongan harga langsung sebesar Rp60.000.000 untuk pembelian unit Mecca Green Valley.',
                'banner_path' => 'https://images.unsplash.com/photo-1600607687644-aac4c3eac7f4?auto=format&fit=crop&w=1200&q=80',
                'tipe_promo' => 'amount',
                'nilai_promo' => 60000000,
                'tanggal_mulai' => now()->subDay()->toDateString(),
                'tanggal_selesai' => now()->addMonths(6)->toDateString(),
                'is_active' => true,
            ]
        );

        $promo->perumahans()->sync([$property->id_perumahan]);
    }
}

