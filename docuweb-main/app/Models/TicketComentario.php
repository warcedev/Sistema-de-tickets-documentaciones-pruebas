<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TicketComentario extends Model
{
    protected $fillable = [
        'ticket_id',
        'user_id',
        'parent_id',
        'comentario',
        'interno',
    ];

    protected $casts = [
        'interno' => 'boolean',
    ];

    public function usuario()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function parent()
    {
        return $this->belongsTo(TicketComentario::class, 'parent_id');
    }
}
