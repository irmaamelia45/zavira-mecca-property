<?php

namespace App\Services\Whatsapp;

use App\Models\Booking;
use App\Models\Promo;
use App\Models\User;

class WhatsappMessageTemplateService
{
    public function buildAdminBookingMasukMessage(Booking $booking): string
    {
        return $this->render('admin_booking_masuk', $this->bookingContext($booking));
    }

    public function buildUserBookingCreatedMessage(Booking $booking): string
    {
        return $this->render('user_booking_created', $this->bookingContext($booking));
    }

    public function buildMarketingBookingCreatedMessage(Booking $booking): string
    {
        return $this->render('marketing_booking_masuk', $this->bookingContext($booking));
    }

    public function buildUserBookingStatusChangedMessage(Booking $booking): string
    {
        $statusKey = $this->statusToTemplateKey((string) $booking->status_booking);

        return $this->render($statusKey, $this->bookingContext($booking));
    }

    public function buildMarketingBookingStatusChangedMessage(Booking $booking): ?string
    {
        $statusKey = $this->statusToMarketingTemplateKey((string) $booking->status_booking);
        if ($statusKey === null) {
            return null;
        }

        return $this->render($statusKey, $this->bookingContext($booking));
    }

    public function buildPromoBroadcastMessage(Promo $promo, User $user): string
    {
        $properties = $promo->relationLoaded('perumahans')
            ? $promo->perumahans->pluck('nama_perumahan')->filter()->values()->all()
            : [];

        if (empty($properties) && $promo->id_perumahan) {
            $properties = [(string) $promo->id_perumahan];
        }

        $startDate = optional($promo->tanggal_mulai)->format('d-m-Y');
        $endDate = optional($promo->tanggal_selesai)->format('d-m-Y');

        $period = '-';
        if ($startDate && $endDate) {
            $period = $startDate.' s/d '.$endDate;
        } elseif ($startDate) {
            $period = 'Mulai '.$startDate;
        } elseif ($endDate) {
            $period = 'Sampai '.$endDate;
        }

        return $this->render('promo_broadcast', [
            'nama_user' => (string) ($user->nama ?? 'Pelanggan'),
            'judul_promo' => (string) ($promo->judul ?? '-'),
            'nama_perumahan' => implode(', ', $properties) ?: '-',
            'periode_promo' => $period,
            'deskripsi_promo' => (string) ($promo->deskripsi ?: '-'),
        ]);
    }

    private function bookingContext(Booking $booking): array
    {
        $unitLabel = $this->resolveUnitLabel($booking);

        return [
            'nama_user' => (string) ($booking->user?->nama ?? 'Pelanggan'),
            'no_user' => (string) ($booking->user?->no_hp ?? '-'),
            'no_hp_user' => (string) ($booking->user?->no_hp ?? '-'),
            'nama_perumahan' => (string) ($booking->perumahan?->nama_perumahan ?? '-'),
            'nama_unit' => $unitLabel,
            'tanggal_booking' => optional($booking->tanggal_booking)->format('d-m-Y H:i') ?? '-',
            'status_booking' => (string) ($booking->status_booking ?? '-'),
            'link_maps_kantor' => (string) config('whatsapp.office_maps_link', 'https://maps.google.com'),
        ];
    }

    private function resolveUnitLabel(Booking $booking): string
    {
        $parts = array_filter([
            $booking->unitPerumahan?->kode_blok,
            $booking->unitPerumahan?->kode_unit,
        ]);

        if (! empty($parts)) {
            return implode(' ', $parts);
        }

        return (string) ($booking->unitPerumahan?->kode_unit ?: $booking->perumahan?->tipe_unit ?: '-');
    }

    private function render(string $templateKey, array $context): string
    {
        $template = (string) config("whatsapp.templates.$templateKey");

        if ($template === '') {
            $template = (string) config('whatsapp.templates.user_status_default', '');
        }

        $replacements = [];
        foreach ($context as $key => $value) {
            $replacements['{'.$key.'}'] = (string) $value;
        }

        return strtr($template, $replacements);
    }

    private function statusToTemplateKey(string $status): string
    {
        return match ($status) {
            'Disetujui' => 'user_status_disetujui',
            'Ditolak' => 'user_status_ditolak',
            'Selesai' => 'user_status_selesai',
            'Dibatalkan' => 'user_status_dibatalkan',
            default => 'user_status_default',
        };
    }

    private function statusToMarketingTemplateKey(string $status): ?string
    {
        return match ($status) {
            'Disetujui' => 'marketing_status_disetujui',
            'Ditolak' => 'marketing_status_ditolak',
            'Selesai' => 'marketing_status_selesai',
            'Dibatalkan' => 'marketing_status_dibatalkan',
            default => null,
        };
    }
}
