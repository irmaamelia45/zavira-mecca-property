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
        Schema::create('perumahan_unit', function (Blueprint $table) {
            $table->increments('id_unit_perumahan');
            $table->unsignedInteger('id_perumahan');
            $table->string('nama_blok', 50);
            $table->string('kode_blok', 20);
            $table->unsignedInteger('nomor_unit');
            $table->string('kode_unit', 40);
            $table->string('status_unit', 20)->default('available');
            $table->unsignedInteger('id_booking_terakhir')->nullable();
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();

            $table->foreign('id_perumahan')
                ->references('id_perumahan')
                ->on('perumahan')
                ->cascadeOnDelete()
                ->cascadeOnUpdate();

            $table->index(['id_perumahan', 'status_unit']);
            $table->unique(['id_perumahan', 'kode_unit']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('perumahan_unit');
    }
};
