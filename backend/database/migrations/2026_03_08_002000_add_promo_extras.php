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
        Schema::table('promo', function (Blueprint $table) {
            if (!Schema::hasColumn('promo', 'kategori')) {
                $table->string('kategori', 50)->nullable()->after('judul');
            }
            if (!Schema::hasColumn('promo', 'banner_path')) {
                $table->string('banner_path', 255)->nullable()->after('deskripsi');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('promo', function (Blueprint $table) {
            if (Schema::hasColumn('promo', 'kategori')) {
                $table->dropColumn('kategori');
            }
            if (Schema::hasColumn('promo', 'banner_path')) {
                $table->dropColumn('banner_path');
            }
        });
    }
};
