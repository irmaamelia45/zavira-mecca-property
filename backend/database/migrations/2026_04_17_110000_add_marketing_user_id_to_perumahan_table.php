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
        if (! Schema::hasColumn('perumahan', 'id_marketing_user')) {
            Schema::table('perumahan', function (Blueprint $table) {
                $table->unsignedInteger('id_marketing_user')->nullable()->after('status_label');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('perumahan', 'id_marketing_user')) {
            Schema::table('perumahan', function (Blueprint $table) {
                $table->dropColumn('id_marketing_user');
            });
        }
    }
};
