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
        if (! Schema::hasColumn('perumahan', 'suku_bunga_kpr')) {
            Schema::table('perumahan', function (Blueprint $table) {
                $table->decimal('suku_bunga_kpr', 5, 2)->nullable()->after('harga');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('perumahan', 'suku_bunga_kpr')) {
            Schema::table('perumahan', function (Blueprint $table) {
                $table->dropColumn('suku_bunga_kpr');
            });
        }
    }
};
