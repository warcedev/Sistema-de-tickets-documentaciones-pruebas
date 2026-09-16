<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TicketAudit extends Model
{
    const UPDATED_AT = null;

    protected $fillable = [
        'ticket_id',
        'user_id',
        'campo',
        'valor_anterior',
        'valor_nuevo',
    ];

    public function usuario()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public static function registrar(int $ticketId, string $campo, $anterior, $nuevo): void
    {
        if ((string) $anterior === (string) $nuevo) {
            return;
        }

        static::create([
            'ticket_id' => $ticketId,
            'user_id' => auth()->id(),
            'campo' => $campo,
            'valor_anterior' => $anterior !== null ? (string) $anterior : null,
            'valor_nuevo' => $nuevo !== null ? (string) $nuevo : null,
        ]);
    }
}
