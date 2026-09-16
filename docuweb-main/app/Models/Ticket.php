<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Ticket extends Model
{
    const TIPOS = ['Bug', 'Requerimiento', 'Mejora', 'Incidente'];
    const PRIORIDADES = ['Baja', 'Normal', 'Alta', 'Urgente'];
    const SEVERIDADES = ['Baja', 'Media', 'Alta', 'Critica'];

    // Horas de SLA por prioridad (simplificado: horas corridas desde la creación)
    const SLA_HORAS = [
        'Urgente' => 24,
        'Alta' => 48,
        'Normal' => 120,  // 5 días
        'Baja' => 240,    // 10 días
    ];

    protected $fillable = [
        'numero',
        'titulo',
        'descripcion',
        'tipo',
        'prioridad',
        'severidad',
        'proyecto_id',
        'departamento_id',
        'estado_id',
        'solicitante_id',
        'asignado_id',
        'parent_id',
        'sla_vencimiento',
        'sla_motivo_desvio',
        'requiere_qa',
        'qa_asignado_id',
        'qa_aprobado',
        'qa_captura_codigo',
        'qa_archivos_modificados',

        // Campos estilo Redmine (opcionales)
        'fecha_inicio',
        'fecha_fin',
        'fecha_estimada_entrega',
        'fecha_asignacion',
        'fecha_entrega',
        'fecha_conformidad',
        'fecha_inicio_relevamiento',
        'fecha_fin_relevamiento',
        'fecha_aprobacion_relevamiento',
        'fecha_inicio_desarrollo',
        'fecha_inicio_reanudacion',
        'fecha_fin_reanudacion',
        'desvios_dias',
        'motivo_desvio',
        'fecha_a_produccion',
        'fecha_autorizacion_pasaje',
        'errores_produccion',
        'inconvenientes_pasaje',
        'incidencias_produccion',
        'cant_vuelta_atras',
        'fecha_estimada_entrega_qa',
        'fecha_entrega_qa',
        'hora_estimada_qa',
        'oficial_seguridad_id',
        'porcentaje_realizado',
        'tiempo_estimado',
        'cant_objetos_modif',
        'prioridad_ti',
        'referencia_asignacion_ti',
        'documentacion_incompleta',
        'area',
        'es_evento_ro',

        // Importación desde Redmine
        'redmine_numero',
        'redmine_url',
    ];

    protected $casts = [
        'sla_vencimiento' => 'datetime',
        'requiere_qa' => 'boolean',
        'qa_aprobado' => 'boolean',

        'fecha_inicio' => 'date',
        'fecha_fin' => 'date',
        'fecha_estimada_entrega' => 'date',
        'fecha_asignacion' => 'date',
        'fecha_entrega' => 'date',
        'fecha_conformidad' => 'date',
        'fecha_inicio_relevamiento' => 'date',
        'fecha_fin_relevamiento' => 'date',
        'fecha_aprobacion_relevamiento' => 'date',
        'fecha_inicio_desarrollo' => 'date',
        'fecha_inicio_reanudacion' => 'date',
        'fecha_fin_reanudacion' => 'date',
        'fecha_a_produccion' => 'date',
        'fecha_autorizacion_pasaje' => 'date',
        'fecha_estimada_entrega_qa' => 'date',
        'fecha_entrega_qa' => 'date',
        'errores_produccion' => 'boolean',
        'inconvenientes_pasaje' => 'boolean',
        'incidencias_produccion' => 'boolean',
        'documentacion_incompleta' => 'boolean',
        'es_evento_ro' => 'boolean',
    ];

    protected static function booted()
    {
        static::created(function (Ticket $ticket) {
            if (empty($ticket->numero)) {
                $ticket->numero = (string) $ticket->id;
                $ticket->saveQuietly();
            }
        });
    }

    public function proyecto()
    {
        return $this->belongsTo(Proyecto::class);
    }

    public function departamento()
    {
        return $this->belongsTo(Departamento::class);
    }

    public function estado()
    {
        return $this->belongsTo(TicketEstado::class, 'estado_id');
    }

    public function solicitante()
    {
        return $this->belongsTo(User::class, 'solicitante_id');
    }

    public function asignado()
    {
        return $this->belongsTo(User::class, 'asignado_id');
    }

    public function qaAsignado()
    {
        return $this->belongsTo(User::class, 'qa_asignado_id');
    }

    public function oficialSeguridad()
    {
        return $this->belongsTo(User::class, 'oficial_seguridad_id');
    }

    public function parent()
    {
        return $this->belongsTo(Ticket::class, 'parent_id');
    }

    public function subtareas()
    {
        return $this->hasMany(Ticket::class, 'parent_id');
    }

    public function relacionados()
    {
        return $this->belongsToMany(
            Ticket::class,
            'ticket_relaciones',
            'ticket_id',
            'ticket_relacionado_id'
        )->withPivot('tipo');
    }

    public function relacionadosInversos()
    {
        return $this->belongsToMany(
            Ticket::class,
            'ticket_relaciones',
            'ticket_relacionado_id',
            'ticket_id'
        )->withPivot('tipo');
    }

    public function comentarios()
    {
        return $this->hasMany(TicketComentario::class)->orderBy('created_at');
    }

    public function audits()
    {
        return $this->hasMany(TicketAudit::class)->orderByDesc('created_at');
    }

    public function adjuntos()
    {
        return $this->belongsToMany(
            Adjunto::class,
            'ticket_adjuntos',
            'ticket_id',
            'adjunto_id'
        )->withTimestamps();
    }

    public function qaChecklistAdjuntos()
    {
        return $this->belongsToMany(
            Adjunto::class,
            'ticket_qa_checklist_adjuntos',
            'ticket_id',
            'adjunto_id'
        )->withTimestamps();
    }

    public function watchers()
    {
        return $this->belongsToMany(User::class, 'ticket_watchers', 'ticket_id', 'user_id');
    }
}
