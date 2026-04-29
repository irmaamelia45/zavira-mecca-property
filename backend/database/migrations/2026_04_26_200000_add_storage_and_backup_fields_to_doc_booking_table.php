<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('doc_booking', function (Blueprint $table) {
            if (! Schema::hasColumn('doc_booking', 'storage_disk')) {
                $table->string('storage_disk', 40)->nullable()->after('path_file');
            }

            if (! Schema::hasColumn('doc_booking', 'storage_path')) {
                $table->string('storage_path', 255)->nullable()->after('storage_disk');
            }

            if (! Schema::hasColumn('doc_booking', 'stored_filename')) {
                $table->string('stored_filename', 180)->nullable()->after('storage_path');
            }

            if (! Schema::hasColumn('doc_booking', 'sha256_checksum')) {
                $table->string('sha256_checksum', 64)->nullable()->after('file_size_kb');
            }

            if (! Schema::hasColumn('doc_booking', 'backup_provider')) {
                $table->string('backup_provider', 40)->nullable()->after('sha256_checksum');
            }

            if (! Schema::hasColumn('doc_booking', 'backup_status')) {
                $table->string('backup_status', 25)->default('disabled')->after('backup_provider');
            }

            if (! Schema::hasColumn('doc_booking', 'backup_file_id')) {
                $table->string('backup_file_id', 255)->nullable()->after('backup_status');
            }

            if (! Schema::hasColumn('doc_booking', 'backup_synced_at')) {
                $table->timestamp('backup_synced_at')->nullable()->after('backup_file_id');
            }

            if (! Schema::hasColumn('doc_booking', 'backup_last_error')) {
                $table->text('backup_last_error')->nullable()->after('backup_synced_at');
            }

            if (! Schema::hasColumn('doc_booking', 'retention_until')) {
                $table->timestamp('retention_until')->nullable()->after('backup_last_error');
            }

            if (! Schema::hasColumn('doc_booking', 'deleted_local_at')) {
                $table->timestamp('deleted_local_at')->nullable()->after('retention_until');
            }
        });
    }

    public function down(): void
    {
        Schema::table('doc_booking', function (Blueprint $table) {
            $columns = [
                'storage_disk',
                'storage_path',
                'stored_filename',
                'sha256_checksum',
                'backup_provider',
                'backup_status',
                'backup_file_id',
                'backup_synced_at',
                'backup_last_error',
                'retention_until',
                'deleted_local_at',
            ];

            foreach ($columns as $column) {
                if (Schema::hasColumn('doc_booking', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
