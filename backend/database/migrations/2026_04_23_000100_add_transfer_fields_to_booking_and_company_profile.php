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
        Schema::table('booking', function (Blueprint $table) {
            $table->string('no_rekening', 50)->nullable()->after('catatan_user');
        });

        Schema::table('profil_perusahaan', function (Blueprint $table) {
            $table->string('no_rekening_utj', 50)->nullable()->after('whatsapp');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('profil_perusahaan', function (Blueprint $table) {
            $table->dropColumn(['no_rekening_utj']);
        });

        Schema::table('booking', function (Blueprint $table) {
            $table->dropColumn(['no_rekening']);
        });
    }
};
