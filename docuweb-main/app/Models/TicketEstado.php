<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TicketEstado extends Model
{
    protected $fillable = [
        'nombre',
        'orden',
        'es_inicial',
        'es_final',
        'es_prueba',
        'es_prueba_finalizada',
        'color',
        'activo',
    ];

    protected $casts = [
        'es_inicial' => 'boolean',
        'es_final' => 'boolean',
        'es_prueba' => 'boolean',
        'es_prueba_finalizada' => 'boolean',
        'activo' => 'boolean',
    ];

    public function tickets()
    {
        return $this->hasMany(Ticket::class, 'estado_id');
    }
}
