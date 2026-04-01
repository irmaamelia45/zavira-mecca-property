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
        Schema::create('perumahan', function (Blueprint $table) {
            $table->increments('id_perumahan');
            $table->string('nama_perumahan', 150);
            $table->string('lokasi', 200);
            $table->text('deskripsi')->nullable();
            $table->decimal('harga', 18, 2);
            $table->decimal('luas_tanah', 10, 2)->nullable();
            $table->decimal('luas_bangunan', 10, 2)->nullable();
            $table->integer('jumlah_seluruh_unit');
            $table->integer('jumlah_unit_tersedia');
            $table->boolean('status_aktif')->default(true);
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();
        });

        Schema::create('perumahan_media', function (Blueprint $table) {
            $table->increments('id_media');
            $table->unsignedInteger('id_perumahan');
            $table->string('tipe', 20);
            $table->string('url_file', 255);
            $table->string('caption', 150)->nullable();
            $table->integer('urutan');
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('id_perumahan')
                ->references('id_perumahan')
                ->on('perumahan')
                ->cascadeOnDelete()
                ->cascadeOnUpdate();
        });

        Schema::create('promo', function (Blueprint $table) {
            $table->increments('id_promo');
            $table->unsignedInteger('id_perumahan');
            $table->string('judul', 150);
            $table->text('deskripsi')->nullable();
            $table->string('tipe_promo', 30);
            $table->decimal('nilai_promo', 18, 2)->nullable();
            $table->date('tanggal_mulai')->nullable();
            $table->date('tanggal_selesai')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();

            $table->foreign('id_perumahan')
                ->references('id_perumahan')
                ->on('perumahan')
                ->cascadeOnDelete()
                ->cascadeOnUpdate();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('promo');
        Schema::dropIfExists('perumahan_media');
        Schema::dropIfExists('perumahan');
    }
};
