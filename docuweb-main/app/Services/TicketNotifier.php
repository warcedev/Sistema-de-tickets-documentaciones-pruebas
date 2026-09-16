<?php

namespace App\Services;

use App\Models\Notificacion;
use App\Models\Ticket;

class TicketNotifier
{
    /**
     * Notifica a una lista de usuarios sobre un evento del ticket.
     * Excluye automáticamente al usuario que disparó la acción.
     */
    public static function notify(Ticket $ticket, array $userIds, string $tipo, string $mensaje): void
    {
        $actorId = auth()->id();

        $destinatarios = collect($userIds)
            ->filter()
            ->unique()
            ->reject(fn ($id) => (int) $id === (int) $actorId);

        foreach ($destinatarios as $userId) {
            Notificacion::create([
                'user_id' => $userId,
                'ticket_id' => $ticket->id,
                'tipo' => $tipo,
                'mensaje' => $mensaje,
            ]);
        }
    }

    /**
     * Destinatarios "por defecto" de un ticket: solicitante, asignado y watchers.
     */
    public static function interesados(Ticket $ticket): array
    {
        $ids = collect([$ticket->solicitante_id, $ticket->asignado_id])
            ->merge($ticket->watchers()->pluck('users.id'))
            ->filter()
            ->unique()
            ->values()
            ->all();

        return $ids;
    }

    /**
     * Detecta menciones @NombreApellido en un texto contra la lista de usuarios activos
     * y devuelve los IDs mencionados.
     */
    public static function detectarMenciones(string $texto): array
    {
        if (! preg_match_all('/@([\p{L}0-9_]+(?:\s[\p{L}0-9_]+)?)/u', $texto, $matches)) {
            return [];
        }

        $nombres = collect($matches[1])->map(fn ($n) => trim($n))->filter()->unique();

        if ($nombres->isEmpty()) {
            return [];
        }

        return \App\Models\User::where(function ($q) use ($nombres) {
            foreach ($nombres as $nombre) {
                $q->orWhereRaw('LOWER(name || " " || COALESCE(apellido, "")) LIKE ?', ['%' . strtolower($nombre) . '%']);
            }
        })->pluck('id')->all();
    }
}
