<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('perumahan_unit', function (Blueprint $table) {
            $table->string('sales_mode', 20)->default('ready_stock')->after('status_unit');
            $table->date('estimated_completion_date')->nullable()->after('sales_mode');
        });
    }

    public function down(): void
    {
        Schema::table('perumahan_unit', function (Blueprint $table) {
            $table->dropColumn(['sales_mode', 'estimated_completion_date']);
        });
    }
};
