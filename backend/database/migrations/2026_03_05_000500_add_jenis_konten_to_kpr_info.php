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
        Schema::table('kpr_info', function (Blueprint $table) {
            $table->string('jenis_konten', 30)->default('informasi')->after('judul');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('kpr_info', function (Blueprint $table) {
            $table->dropColumn('jenis_konten');
        });
    }
};
