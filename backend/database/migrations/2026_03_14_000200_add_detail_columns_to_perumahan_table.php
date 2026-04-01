<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('perumahan', function (Blueprint $table) {
            $table->string('tipe_unit', 30)->nullable()->after('harga');
            $table->string('kategori', 30)->default('komersil')->after('tipe_unit');
            $table->string('status_label', 30)->default('Available')->after('status_aktif');
            $table->unsignedTinyInteger('jumlah_kamar_tidur')->nullable()->after('luas_bangunan');
            $table->unsignedTinyInteger('jumlah_kamar_mandi')->nullable()->after('jumlah_kamar_tidur');
            $table->text('fasilitas')->nullable()->after('deskripsi');
            $table->string('alamat_lengkap', 255)->nullable()->after('lokasi');
            $table->string('kota', 120)->nullable()->after('alamat_lengkap');
            $table->string('gmaps_url', 255)->nullable()->after('kota');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('perumahan', function (Blueprint $table) {
            $table->dropColumn([
                'tipe_unit',
                'kategori',
                'status_label',
                'jumlah_kamar_tidur',
                'jumlah_kamar_mandi',
                'fasilitas',
                'alamat_lengkap',
                'kota',
                'gmaps_url',
            ]);
        });
    }
};
