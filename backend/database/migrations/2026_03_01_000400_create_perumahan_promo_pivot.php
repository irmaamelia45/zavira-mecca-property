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
        Schema::create('perumahan_promo', function (Blueprint $table) {
            $table->unsignedInteger('id_perumahan');
            $table->unsignedInteger('id_promo');
            $table->timestamp('created_at')->useCurrent();

            $table->primary(['id_perumahan', 'id_promo']);

            $table->foreign('id_perumahan')
                ->references('id_perumahan')
                ->on('perumahan')
                ->cascadeOnDelete()
                ->cascadeOnUpdate();

            $table->foreign('id_promo')
                ->references('id_promo')
                ->on('promo')
                ->cascadeOnDelete()
                ->cascadeOnUpdate();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('perumahan_promo');
    }
};
