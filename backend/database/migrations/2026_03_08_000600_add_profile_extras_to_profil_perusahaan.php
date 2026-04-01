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
        Schema::table('profil_perusahaan', function (Blueprint $table) {
            $table->text('penghargaan')->nullable()->after('misi');
            $table->text('struktur_organisasi')->nullable()->after('penghargaan');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('profil_perusahaan', function (Blueprint $table) {
            $table->dropColumn(['penghargaan', 'struktur_organisasi']);
        });
    }
};
