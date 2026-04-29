<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('doc_booking', function (Blueprint $table) {
            if (! Schema::hasColumn('doc_booking', 'backup_disk')) {
                $table->string('backup_disk', 40)->nullable()->after('backup_file_id');
            }

            if (! Schema::hasColumn('doc_booking', 'backup_object_key')) {
                $table->string('backup_object_key', 500)->nullable()->after('backup_disk');
            }

            if (! Schema::hasColumn('doc_booking', 'backup_checksum')) {
                $table->string('backup_checksum', 64)->nullable()->after('backup_object_key');
            }

            if (! Schema::hasColumn('doc_booking', 'backup_size_bytes')) {
                $table->unsignedBigInteger('backup_size_bytes')->nullable()->after('backup_checksum');
            }
        });
    }

    public function down(): void
    {
        Schema::table('doc_booking', function (Blueprint $table) {
            $columns = [
                'backup_disk',
                'backup_object_key',
                'backup_checksum',
                'backup_size_bytes',
            ];

            foreach ($columns as $column) {
                if (Schema::hasColumn('doc_booking', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
