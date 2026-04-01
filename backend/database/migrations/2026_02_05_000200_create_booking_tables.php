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
        Schema::create('booking', function (Blueprint $table) {
            $table->increments('id_booking');
            $table->unsignedInteger('id_user');
            $table->unsignedInteger('id_perumahan');
            $table->string('kode_booking', 30)->unique();
            $table->timestamp('tanggal_booking')->useCurrent();

            $table->string('status_booking', 25);
            $table->string('catatan_user', 255)->nullable();
            $table->string('catatan_admin', 255)->nullable();

            $table->timestamp('approved_at')->nullable();
            $table->timestamp('rejected_at')->nullable();
            $table->timestamp('canceled_at')->nullable();
            $table->timestamp('finished_at')->nullable();

            $table->string('cancel_reason', 30)->nullable();
            $table->string('cancel_note', 255)->nullable();

            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();

            $table->foreign('id_user')
                ->references('id_user')
                ->on('user')
                ->restrictOnDelete()
                ->cascadeOnUpdate();

            $table->foreign('id_perumahan')
                ->references('id_perumahan')
                ->on('perumahan')
                ->restrictOnDelete()
                ->cascadeOnUpdate();
        });

        Schema::create('doc_booking', function (Blueprint $table) {
            $table->increments('id_doc_booking');
            $table->unsignedInteger('id_booking');
            $table->string('jenis_dokumen', 50);
            $table->string('nama_file', 150);
            $table->string('path_file', 255);
            $table->string('mime_type', 50);
            $table->integer('file_size_kb')->nullable();
            $table->timestamp('uploaded_at')->useCurrent();

            $table->foreign('id_booking')
                ->references('id_booking')
                ->on('booking')
                ->cascadeOnDelete()
                ->cascadeOnUpdate();
        });

        Schema::create('whatsapp_notif_log', function (Blueprint $table) {
            $table->increments('id_wa_log');
            $table->unsignedInteger('id_booking');
            $table->unsignedInteger('id_user');
            $table->string('tujuan_no_hp', 20);
            $table->string('event', 20);
            $table->string('status_booking_at_send', 25);
            $table->text('isi_pesan');
            $table->string('provider', 30);
            $table->string('status_kirim', 20);
            $table->text('response_raw')->nullable();
            $table->timestamp('sent_at')->useCurrent();

            $table->foreign('id_booking')
                ->references('id_booking')
                ->on('booking')
                ->cascadeOnDelete()
                ->cascadeOnUpdate();

            $table->foreign('id_user')
                ->references('id_user')
                ->on('user')
                ->restrictOnDelete()
                ->cascadeOnUpdate();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('whatsapp_notif_log');
        Schema::dropIfExists('doc_booking');
        Schema::dropIfExists('booking');
    }
};
