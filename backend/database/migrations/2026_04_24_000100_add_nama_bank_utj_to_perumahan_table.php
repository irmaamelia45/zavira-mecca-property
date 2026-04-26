<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('perumahan', function (Blueprint $table) {
            $table->string('nama_bank_utj', 120)->nullable()->after('no_rekening_utj');
        });
    }

    public function down(): void
    {
        Schema::table('perumahan', function (Blueprint $table) {
            $table->dropColumn('nama_bank_utj');
        });
    }
};
