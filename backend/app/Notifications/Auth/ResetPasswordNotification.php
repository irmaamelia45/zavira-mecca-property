<?php

namespace App\Notifications\Auth;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ResetPasswordNotification extends Notification
{
    use Queueable;

    public function __construct(
        private readonly string $token,
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $resetUrl = route('password.reset', [
            'token' => $this->token,
            'email' => $notifiable->getEmailForPasswordReset(),
        ]);

        $expireMinutes = (int) config('auth.passwords.'.config('auth.defaults.passwords').'.expire', 60);
        $recipientName = trim((string) ($notifiable->nama ?? 'Pengguna'));

        return (new MailMessage)
            ->subject('Reset Password Akun '.config('app.name'))
            ->greeting('Halo '.$recipientName.',')
            ->line('Kami menerima permintaan untuk mengatur ulang password akun Anda.')
            ->line('Klik tombol di bawah ini untuk membuat password baru yang aman.')
            ->action('Atur Ulang Password', $resetUrl)
            ->line("Tautan ini berlaku selama {$expireMinutes} menit.")
            ->line('Jika Anda tidak meminta reset password, abaikan email ini. Tidak ada perubahan pada akun Anda sampai proses reset diselesaikan.')
            ->line('Apabila tombol tidak dapat digunakan, salin dan buka tautan berikut di browser Anda:')
            ->line($resetUrl)
            ->salutation('Hormat kami, '.config('app.name'));
    }
}
