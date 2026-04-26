<?php

namespace Database\Seeders;

use App\Models\Perumahan;
use App\Models\PerumahanMedia;
use Illuminate\Database\Seeder;

class PerumahanDummySeeder extends Seeder
{
    /**
     * Seed 4 dummy housing data for development/testing.
     */
    public function run(): void
    {
        if (! filter_var((string) env('ENABLE_DUMMY_SEEDERS', false), FILTER_VALIDATE_BOOLEAN)) {
            return;
        }

        $items = [
            [
                'nama_perumahan' => 'Zavira Harmoni Residence',
                'lokasi' => 'Kedamaian, Bandar Lampung',
                'alamat_lengkap' => 'Jl. Soekarno Hatta No. 18, Kedamaian',
                'kota' => 'Bandar Lampung',
                'gmaps_url' => 'https://maps.google.com/?q=Bandar+Lampung',
                'deskripsi' => 'Hunian modern dekat pusat kota, cocok untuk keluarga muda.',
                'harga' => 425000000,
                'suku_bunga_kpr' => 7.25,
                'tipe_unit' => '36/72',
                'kategori' => 'subsidi',
                'status_label' => 'Available',
                'luas_tanah' => 72,
                'luas_bangunan' => 36,
                'jumlah_kamar_tidur' => 2,
                'jumlah_kamar_mandi' => 1,
                'jumlah_seluruh_unit' => 120,
                'jumlah_unit_tersedia' => 37,
                'fasilitas' => ['Masjid', 'Taman Bermain', 'One Gate System'],
                'nama_marketing' => 'Nadia Putri',
                'whatsapp_marketing' => '6281234567801',
                'status_aktif' => true,
                'images' => [
                    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c',
                    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c',
                    'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d',
                    'https://images.unsplash.com/photo-1600566753151-384129cf4e3e',
                ],
            ],
            [
                'nama_perumahan' => 'Mecca Green Valley',
                'lokasi' => 'Sukarame, Bandar Lampung',
                'alamat_lengkap' => 'Jl. Endro Suratmin No. 55, Sukarame',
                'kota' => 'Bandar Lampung',
                'gmaps_url' => 'https://maps.google.com/?q=Sukarame+Bandar+Lampung',
                'deskripsi' => 'Lingkungan asri dengan akses cepat ke kampus dan pusat belanja.',
                'harga' => 560000000,
                'suku_bunga_kpr' => 8.10,
                'tipe_unit' => '45/90',
                'kategori' => 'komersil',
                'status_label' => 'Available',
                'luas_tanah' => 90,
                'luas_bangunan' => 45,
                'jumlah_kamar_tidur' => 3,
                'jumlah_kamar_mandi' => 2,
                'jumlah_seluruh_unit' => 85,
                'jumlah_unit_tersedia' => 22,
                'fasilitas' => ['Keamanan 24 Jam', 'Dekat Sekolah', 'Bebas Banjir'],
                'nama_marketing' => 'Rizki Pratama',
                'whatsapp_marketing' => '6281234567802',
                'status_aktif' => true,
                'images' => [
                    'https://images.unsplash.com/photo-1600573472592-401b489a3cdc',
                    'https://images.unsplash.com/photo-1600607687644-c7171b42498f',
                    'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde',
                    'https://images.unsplash.com/photo-1600047509358-9dc75507daeb',
                ],
            ],
            [
                'nama_perumahan' => 'Zavira Townhouse Prime',
                'lokasi' => 'Rajabasa, Bandar Lampung',
                'alamat_lengkap' => 'Jl. ZA Pagar Alam No. 101, Rajabasa',
                'kota' => 'Bandar Lampung',
                'gmaps_url' => 'https://maps.google.com/?q=Rajabasa+Bandar+Lampung',
                'deskripsi' => 'Townhouse premium dengan desain minimalis dan parkir luas.',
                'harga' => 715000000,
                'suku_bunga_kpr' => 8.75,
                'tipe_unit' => '60/120',
                'kategori' => 'townhouse',
                'status_label' => 'Coming Soon',
                'luas_tanah' => 120,
                'luas_bangunan' => 60,
                'jumlah_kamar_tidur' => 3,
                'jumlah_kamar_mandi' => 2,
                'jumlah_seluruh_unit' => 40,
                'jumlah_unit_tersedia' => 14,
                'fasilitas' => ['One Gate System', 'Dekat Tol', 'Keamanan 24 Jam'],
                'nama_marketing' => 'Fajar Maulana',
                'whatsapp_marketing' => '6281234567803',
                'status_aktif' => true,
                'images' => [
                    'https://images.unsplash.com/photo-1600607687644-aac4c3eac7f4',
                    'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0',
                    'https://images.unsplash.com/photo-1600566752447-f4d3d99abf5f',
                    'https://images.unsplash.com/photo-1600573472550-8090b5e0745e',
                ],
            ],
            [
                'nama_perumahan' => 'Mecca Skyline Residence',
                'lokasi' => 'Enggal, Bandar Lampung',
                'alamat_lengkap' => 'Jl. Diponegoro No. 12, Enggal',
                'kota' => 'Bandar Lampung',
                'gmaps_url' => 'https://maps.google.com/?q=Enggal+Bandar+Lampung',
                'deskripsi' => 'Hunian vertikal modern dengan fasilitas lengkap dan akses transportasi.',
                'harga' => 650000000,
                'suku_bunga_kpr' => 8.40,
                'tipe_unit' => 'Studio 30',
                'kategori' => 'komersil',
                'status_label' => 'Available',
                'luas_tanah' => 30,
                'luas_bangunan' => 30,
                'jumlah_kamar_tidur' => 1,
                'jumlah_kamar_mandi' => 1,
                'jumlah_seluruh_unit' => 160,
                'jumlah_unit_tersedia' => 64,
                'fasilitas' => ['Keamanan 24 Jam', 'Dekat Pasar', 'Dekat Sekolah'],
                'nama_marketing' => 'Salsa Rahma',
                'whatsapp_marketing' => '6281234567804',
                'status_aktif' => true,
                'images' => [
                    'https://images.unsplash.com/photo-1600607688969-a5bfcd646154',
                    'https://images.unsplash.com/photo-1600566752227-8f3b5f2f9f4f',
                    'https://images.unsplash.com/photo-1600607688962-6f7d2f3d34d4',
                    'https://images.unsplash.com/photo-1600566752734-4f63c6f5f7f2',
                ],
            ],
        ];

        foreach ($items as $item) {
            $images = $item['images'];
            unset($item['images']);

            $property = Perumahan::updateOrCreate(
                ['nama_perumahan' => $item['nama_perumahan']],
                [
                    ...$item,
                    'fasilitas' => json_encode($item['fasilitas']),
                ]
            );

            $property->media()->delete();

            foreach (array_slice($images, 0, 5) as $index => $image) {
                PerumahanMedia::create([
                    'id_perumahan' => $property->id_perumahan,
                    'tipe' => 'foto',
                    'url_file' => $image,
                    'caption' => null,
                    'urutan' => $index + 1,
                ]);
            }
        }
    }
}
