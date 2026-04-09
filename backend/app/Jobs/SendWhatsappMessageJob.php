<?php

namespace App\Jobs;

use App\Models\User;
use App\Models\WhatsappNotifLog;
use App\Services\Whatsapp\FonnteClient;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Str;
use Throwable;

class SendWhatsappMessageJob implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public array $backoff = [30, 120, 300];

    public function __construct(
        public string $event,
        public int $recipientUserId,
        public string $targetPhone,
        public string $message,
        public ?int $bookingId = null,
        public ?string $statusBookingAtSend = null,
    ) {
    }

    public function handle(FonnteClient $fonnteClient): void
    {
        $recipient = User::query()
            ->select(['id_user', 'is_active', 'no_hp'])
            ->find($this->recipientUserId);

        // Stop queued delivery when recipient account is no longer active.
        if (! $recipient || ! $recipient->is_active) {
            $this->storeBookingLog('failed', ['reason' => 'recipient_inactive_or_missing']);

            return;
        }

        $targetPhone = (string) ($recipient->no_hp ?: $this->targetPhone);
        $normalizedPhone = $fonnteClient->normalizePhone($targetPhone);
        if (! $normalizedPhone) {
            $this->storeBookingLog('failed', ['reason' => 'invalid_target_number']);

            return;
        }

        try {
            $result = $fonnteClient->sendMessage($normalizedPhone, $this->message);
            $status = $result['ok'] ? 'success' : 'failed';
            $this->storeBookingLog($status, $result['response'] ?? $result, $normalizedPhone);
        } catch (Throwable $exception) {
            $this->storeBookingLog('failed', [
                'reason' => 'exception',
                'message' => $exception->getMessage(),
            ], $normalizedPhone);

            throw $exception;
        }
    }

    private function storeBookingLog(string $status, array $response, ?string $phone = null): void
    {
        if (! $this->bookingId) {
            return;
        }

        WhatsappNotifLog::query()->create([
            'id_booking' => $this->bookingId,
            'id_user' => $this->recipientUserId,
            'tujuan_no_hp' => Str::limit((string) ($phone ?: $this->targetPhone), 20, ''),
            'event' => Str::limit($this->event, 20, ''),
            'status_booking_at_send' => Str::limit((string) ($this->statusBookingAtSend ?: '-'), 25, ''),
            'isi_pesan' => $this->message,
            'provider' => 'fonnte',
            'status_kirim' => Str::limit($status, 20, ''),
            'response_raw' => json_encode($response, JSON_UNESCAPED_UNICODE),
            'sent_at' => now(),
        ]);
    }
}
