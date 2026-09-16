<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Adjunto extends Model
{
    protected $fillable = [
        'nombre_original',
        'path',
        'mime',
        'size',
        'activo',
    ];

    public function documentaciones()
    {
        return $this->belongsToMany(
            Documentacion::class,
            'documentacions_adjuntos',
            'adjunto_id',
            'documentacion_id'
        );
    }

    public function tickets()
    {
        return $this->belongsToMany(
            Ticket::class,
            'ticket_adjuntos',
            'adjunto_id',
            'ticket_id'
        );
    }

    public function ejecucionPasos()
    {
        return $this->belongsToMany(
            TestEjecucionPaso::class,
            'test_ejecucion_paso_adjuntos',
            'adjunto_id',
            'test_ejecucion_paso_id'
        );
    }

    public function ticketsQaChecklist()
    {
        return $this->belongsToMany(
            Ticket::class,
            'ticket_qa_checklist_adjuntos',
            'adjunto_id',
            'ticket_id'
        );
    }
}