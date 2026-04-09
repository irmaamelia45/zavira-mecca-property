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
            $table->unsignedInteger('id_unit_perumahan')->nullable()->after('id_perumahan');

            $table->foreign('id_unit_perumahan')
                ->references('id_unit_perumahan')
                ->on('perumahan_unit')
                ->nullOnDelete()
                ->cascadeOnUpdate();

            $table->index('id_unit_perumahan');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('booking', function (Blueprint $table) {
            $table->dropForeign(['id_unit_perumahan']);
            $table->dropIndex(['id_unit_perumahan']);
            $table->dropColumn('id_unit_perumahan');
        });
    }
};
