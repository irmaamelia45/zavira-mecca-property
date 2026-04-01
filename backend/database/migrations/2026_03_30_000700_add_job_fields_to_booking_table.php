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
            $table->string('jenis_pekerjaan', 20)->nullable()->after('catatan_user');
            $table->unsignedBigInteger('gaji_bulanan')->nullable()->after('jenis_pekerjaan');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('booking', function (Blueprint $table) {
            $table->dropColumn(['jenis_pekerjaan', 'gaji_bulanan']);
        });
    }
};

