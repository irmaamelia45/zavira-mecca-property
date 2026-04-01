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
        Schema::create('profil_perusahaan', function (Blueprint $table) {
            $table->increments('id_profil');
            $table->string('nama_perusahaan', 150);
            $table->string('alamat', 255)->nullable();
            $table->string('email', 120)->nullable();
            $table->string('telepon', 30)->nullable();
            $table->string('whatsapp', 20)->nullable();
            $table->string('website', 120)->nullable();
            $table->text('deskripsi')->nullable();
            $table->text('visi')->nullable();
            $table->text('misi')->nullable();
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();
        });

        Schema::create('kpr_info', function (Blueprint $table) {
            $table->increments('id_kpr_info');
            $table->string('judul', 150);
            $table->text('konten');
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();
        });

        Schema::create('kpr_syarat', function (Blueprint $table) {
            $table->increments('id_syarat');
            $table->unsignedInteger('id_kpr_info');
            $table->string('nama_syarat', 150);
            $table->text('deskripsi')->nullable();
            $table->integer('urutan');

            $table->foreign('id_kpr_info')
                ->references('id_kpr_info')
                ->on('kpr_info')
                ->cascadeOnDelete()
                ->cascadeOnUpdate();
        });

        Schema::create('kpr_alur', function (Blueprint $table) {
            $table->increments('id_alur');
            $table->unsignedInteger('id_kpr_info');
            $table->integer('langkah_ke');
            $table->string('judul_langkah', 150);
            $table->text('deskripsi')->nullable();

            $table->foreign('id_kpr_info')
                ->references('id_kpr_info')
                ->on('kpr_info')
                ->cascadeOnDelete()
                ->cascadeOnUpdate();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('kpr_alur');
        Schema::dropIfExists('kpr_syarat');
        Schema::dropIfExists('kpr_info');
        Schema::dropIfExists('profil_perusahaan');
    }
};
