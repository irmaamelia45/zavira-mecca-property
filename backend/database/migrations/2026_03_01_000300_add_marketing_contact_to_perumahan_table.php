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
            $table->string('nama_marketing', 120)->nullable()->after('status_aktif');
            $table->string('whatsapp_marketing', 25)->nullable()->after('nama_marketing');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('perumahan', function (Blueprint $table) {
            $table->dropColumn(['nama_marketing', 'whatsapp_marketing']);
        });
    }
};
