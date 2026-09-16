<?php

namespace App\Http\Controllers;

use App\Models\Adjunto;
use App\Models\Departamento;
use App\Models\Proyecto;
use App\Models\Ticket;
use App\Models\TicketAudit;
use App\Models\TicketEstado;
use App\Models\User;
use App\Services\TicketNotifier;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\StreamedResponse;

class TicketController extends Controller
{
    private function esGestor(): bool
    {
        return in_array(auth()->user()->rol, ['Administrador', 'Gerente']);
    }

    /**
     * Campos adicionales estilo Redmine: todos opcionales.
     */
    private function camposRedmineRules(): array
    {
        return [
            'fecha_inicio' => 'nullable|date',
            'fecha_fin' => 'nullable|date',
            'fecha_estimada_entrega' => 'nullable|date',
            'fecha_asignacion' => 'nullable|date',
            'fecha_entrega' => 'nullable|date',
            'fecha_conformidad' => 'nullable|date',
            'fecha_inicio_relevamiento' => 'nullable|date',
            'fecha_fin_relevamiento' => 'nullable|date',
            'fecha_aprobacion_relevamiento' => 'nullable|date',
            'fecha_inicio_desarrollo' => 'nullable|date',
            'fecha_inicio_reanudacion' => 'nullable|date',
            'fecha_fin_reanudacion' => 'nullable|date',
            'desvios_dias' => 'nullable|integer',
            'motivo_desvio' => 'nullable|string|max:255',
            'fecha_a_produccion' => 'nullable|date',
            'fecha_autorizacion_pasaje' => 'nullable|date',
            'errores_produccion' => 'nullable|boolean',
            'inconvenientes_pasaje' => 'nullable|boolean',
            'incidencias_produccion' => 'nullable|boolean',
            'cant_vuelta_atras' => 'nullable|integer',
            'fecha_estimada_entrega_qa' => 'nullable|date',
            'fecha_entrega_qa' => 'nullable|date',
            'hora_estimada_qa' => 'nullable|string|max:20',
            'oficial_seguridad_id' => 'nullable|exists:users,id',
            'porcentaje_realizado' => 'nullable|integer|min:0|max:100',
            'tiempo_estimado' => 'nullable|string|max:20',
            'cant_objetos_modif' => 'nullable|integer',
            'prioridad_ti' => 'nullable|integer',
            'referencia_asignacion_ti' => 'nullable|string|max:255',
            'documentacion_incompleta' => 'nullable|boolean',
            'area' => 'nullable|string|max:255',
            'es_evento_ro' => 'nullable|boolean',
        ];
    }

    private const CAMPOS_REDMINE = [
        'fecha_inicio', 'fecha_fin', 'fecha_estimada_entrega', 'fecha_asignacion',
        'fecha_entrega', 'fecha_conformidad', 'fecha_inicio_relevamiento',
        'fecha_fin_relevamiento', 'fecha_aprobacion_relevamiento', 'fecha_inicio_desarrollo',
        'fecha_inicio_reanudacion', 'fecha_fin_reanudacion', 'desvios_dias', 'motivo_desvio',
        'fecha_a_produccion', 'fecha_autorizacion_pasaje', 'errores_produccion',
        'inconvenientes_pasaje', 'incidencias_produccion', 'cant_vuelta_atras',
        'fecha_estimada_entrega_qa', 'fecha_entrega_qa', 'hora_estimada_qa',
        'oficial_seguridad_id', 'porcentaje_realizado', 'tiempo_estimado',
        'cant_objetos_modif', 'prioridad_ti', 'referencia_asignacion_ti',
        'documentacion_incompleta', 'area', 'es_evento_ro',
    ];

    private function extraerCamposRedmine(array $data): array
    {
        return collect($data)
            ->only(self::CAMPOS_REDMINE)
            ->all();
    }

    public function index()
    {
        $tickets = Ticket::with([
            'proyecto:id,nombre',
            'departamento:id,nombre',
            'estado',
            'solicitante:id,name,apellido,departamento_id',
            'solicitante.departamento:id,nombre',
            'asignado:id,name,apellido,departamento_id',
            'asignado.departamento:id,nombre',
            'qaAsignado:id,name,apellido',
        ])
            ->whereHas('estado', fn ($q) => $q->where('es_final', false))
            ->latest()
            ->get();

        return Inertia::render('Tickets/Gestionar', [
            'tickets' => $tickets,
            'proyectos' => Proyecto::where('activo', 1)->orderBy('nombre')->get(['id', 'nombre']),
            'estados' => TicketEstado::where('activo', 1)->orderBy('orden')->get(),
            'departamentos' => Departamento::where('estado', 1)->orderBy('nombre')->get(['id', 'nombre']),
            'usuarios' => User::where('activo', 1)->orderBy('name')->get(['id', 'name', 'apellido']),
            'tipos' => Ticket::TIPOS,
            'prioridades' => Ticket::PRIORIDADES,
            'puedeCrear' => true,
            'puedeImportar' => $this->esGestor(),
        ]);
    }

    public function historico()
    {
        $tickets = Ticket::with(['proyecto:id,nombre', 'estado', 'solicitante:id,name', 'asignado:id,name'])
            ->whereHas('estado', fn ($q) => $q->where('es_final', true))
            ->latest()
            ->get();

        return Inertia::render('Tickets/Historico', [
            'tickets' => $tickets,
            'proyectos' => Proyecto::where('activo', 1)->orderBy('nombre')->get(['id', 'nombre']),
        ]);
    }

    public function reportes()
    {
        abort_unless($this->esGestor(), 403);

        $desde = now()->subDays(30);

        $cerrados = Ticket::whereHas('estado', fn ($q) => $q->where('es_final', true))->get();
        $abiertos = Ticket::whereHas('estado', fn ($q) => $q->where('es_final', false))->count();

        $tiempoPromedioHoras = $cerrados->isNotEmpty()
            ? round($cerrados->avg(fn ($t) => $t->created_at->diffInHours($t->updated_at)), 1)
            : 0;

        $slaCumplidos = $cerrados->filter(fn ($t) => $t->sla_vencimiento === null || $t->updated_at->lte($t->sla_vencimiento))->count();
        $slaPorcentaje = $cerrados->count() > 0 ? round(($slaCumplidos / $cerrados->count()) * 100, 1) : 100;

        $porProyecto = Ticket::selectRaw('proyecto_id, count(*) as total')
            ->with('proyecto:id,nombre')
            ->groupBy('proyecto_id')
            ->get();

        $porPersona = Ticket::selectRaw('asignado_id, count(*) as total')
            ->whereNotNull('asignado_id')
            ->with('asignado:id,name,cargo')
            ->groupBy('asignado_id')
            ->get();

        $porTipo = Ticket::selectRaw('tipo, count(*) as total')->groupBy('tipo')->get();

        $proyectosParaProduccionTesting = Proyecto::where('activo', 1)->orderBy('nombre')->get(['id', 'nombre']);
        $porProyectoProduccionTesting = $proyectosParaProduccionTesting
            ->map(fn ($p) => $this->statsProduccionTesting($p->id, $p->nombre))
            ->push($this->statsProduccionTesting(null, 'Sin proyecto'))
            ->values();

        return Inertia::render('Tickets/Reportes', [
            'stats' => [
                'abiertos' => $abiertos,
                'cerrados_total' => $cerrados->count(),
                'cerrados_ultimos_30' => $cerrados->where('updated_at', '>=', $desde)->count(),
                'tiempo_promedio_horas' => $tiempoPromedioHoras,
                'sla_cumplimiento_pct' => $slaPorcentaje,
            ],
            'porProyecto' => $porProyecto,
            'porPersona' => $porPersona,
            'porTipo' => $porTipo,
            'porProyectoProduccionTesting' => $porProyectoProduccionTesting,
        ]);
    }

    /**
     * Estados de producción/testing de los tickets de un proyecto. "En
     * testing"/"finalizado" se basan en los estados marcados como
     * es_prueba/es_prueba_finalizada (ver Admin > Catálogos); "en progreso"
     * además exige un tester (qa_asignado_id) asignado.
     */
    private function statsProduccionTesting(?int $proyectoId, string $nombre): array
    {
        $base = fn () => Ticket::where('proyecto_id', $proyectoId);
        $enPrueba = fn () => $base()->whereHas('estado', fn ($q) => $q->where('es_prueba', true));
        $pruebaFinalizada = fn () => $base()->whereHas('estado', fn ($q) => $q->where('es_prueba_finalizada', true));

        return [
            'proyecto_id' => $proyectoId,
            'proyecto' => $nombre,
            'no_produccion' => $base()->whereNull('fecha_a_produccion')->count(),
            'en_testing' => $enPrueba()->count(),
            'testing_en_progreso' => $enPrueba()
                ->whereHas('estado', fn ($q) => $q->where('es_prueba_finalizada', false))
                ->whereNotNull('qa_asignado_id')
                ->count(),
            'testing_finalizado' => $pruebaFinalizada()->count(),
        ];
    }

    public function exportCsv()
    {
        abort_unless($this->esGestor(), 403);

        $tickets = Ticket::with(['proyecto:id,nombre', 'estado:id,nombre', 'solicitante:id,name', 'asignado:id,name'])->get();

        $callback = function () use ($tickets) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, ['Numero', 'Titulo', 'Tipo', 'Prioridad', 'Severidad', 'Proyecto', 'Estado', 'Solicitante', 'Asignado', 'Creado', 'Actualizado']);

            foreach ($tickets as $t) {
                fputcsv($handle, [
                    '#' . $t->numero,
                    $t->titulo,
                    $t->tipo,
                    $t->prioridad,
                    $t->severidad,
                    $t->proyecto?->nombre,
                    $t->estado?->nombre,
                    $t->solicitante?->name,
                    $t->asignado?->name,
                    $t->created_at,
                    $t->updated_at,
                ]);
            }

            fclose($handle);
        };

        return response()->streamDownload($callback, 'tickets.csv', ['Content-Type' => 'text/csv']);
    }

    public function create()
    {
        return Inertia::render('Tickets/Create', [
            'proyectos' => Proyecto::where('activo', 1)->orderBy('nombre')->get(['id', 'nombre']),
            'departamentos' => Departamento::where('estado', 1)->orderBy('nombre')->get(['id', 'nombre']),
            'tipos' => Ticket::TIPOS,
            'prioridades' => Ticket::PRIORIDADES,
            'severidades' => Ticket::SEVERIDADES,
            'usuarios' => $this->esGestor() ? User::where('activo', 1)->orderBy('name')->get(['id', 'name', 'apellido']) : [],
            'puedeAsignar' => $this->esGestor(),
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate(array_merge([
            'titulo' => 'required|string|max:255',
            'descripcion' => 'nullable|string',
            'tipo' => ['required', Rule::in(Ticket::TIPOS)],
            'prioridad' => ['required', Rule::in(Ticket::PRIORIDADES)],
            'severidad' => ['required', Rule::in(Ticket::SEVERIDADES)],
            'proyecto_id' => 'nullable|exists:proyectos,id',
            'departamento_id' => 'nullable|exists:departamentos,id',
            'parent_id' => 'nullable|exists:tickets,id',
            'asignado_id' => 'nullable|exists:users,id',
            'requiere_qa' => 'nullable|boolean',
            'qa_asignado_id' => 'nullable|exists:users,id',
        ], $this->camposRedmineRules()));

        $estadoInicial = TicketEstado::where('es_inicial', true)->where('activo', 1)->first()
            ?? TicketEstado::where('activo', 1)->orderBy('orden')->firstOrFail();

        $slaHoras = Ticket::SLA_HORAS[$data['prioridad']] ?? null;

        $ticket = Ticket::create(array_merge([
            'titulo' => $data['titulo'],
            'descripcion' => $data['descripcion'] ?? null,
            'tipo' => $data['tipo'],
            'prioridad' => $data['prioridad'],
            'severidad' => $data['severidad'],
            'proyecto_id' => $data['proyecto_id'] ?? null,
            'departamento_id' => $data['departamento_id'] ?? null,
            'parent_id' => $data['parent_id'] ?? null,
            'estado_id' => $estadoInicial->id,
            'solicitante_id' => auth()->id(),
            'asignado_id' => $this->esGestor() ? ($data['asignado_id'] ?? null) : null,
            'sla_vencimiento' => $slaHoras ? now()->addHours($slaHoras) : null,
            'requiere_qa' => $this->esGestor() ? $request->boolean('requiere_qa') : false,
            'qa_asignado_id' => $this->esGestor() ? ($data['qa_asignado_id'] ?? null) : null,
        ], $this->extraerCamposRedmine($data)));

        if ($ticket->asignado_id) {
            TicketNotifier::notify($ticket, [$ticket->asignado_id], 'asignacion', "Se te asignó el ticket #{$ticket->numero}: {$ticket->titulo}");
        }

        return redirect()
            ->route('tickets.show', $ticket->id)
            ->with('success', 'Ticket creado correctamente')
            ->setStatusCode(303);
    }

    public function show($id)
    {
        $ticket = Ticket::with([
            'proyecto:id,nombre',
            'departamento:id,nombre',
            'estado',
            'solicitante:id,name',
            'asignado:id,name',
            'qaAsignado:id,name',
            'oficialSeguridad:id,name',
            'parent:id,numero,titulo',
            'subtareas:id,parent_id,numero,titulo,estado_id',
            'subtareas.estado:id,nombre,color',
            'relacionados:id,numero,titulo',
            'relacionadosInversos:id,numero,titulo',
            'comentarios.usuario:id,name',
            'audits.usuario:id,name',
            'adjuntos',
            'qaChecklistAdjuntos',
            'watchers:id,name',
        ])->findOrFail($id);

        $user = auth()->user();
        $puedeEditar = $this->esGestor()
            || ($ticket->solicitante_id === $user->id && $ticket->estado->es_inicial);
        $puedeCambiarEstado = $this->esGestor() || $ticket->asignado_id === $user->id;
        $puedeEliminar = $user->rol === 'Administrador';
        $puedeAprobarQa = $ticket->requiere_qa && ($this->esGestor() || $ticket->qa_asignado_id === $user->id);
        $siguiendo = $ticket->watchers->contains($user->id);

        return Inertia::render('Tickets/Show', [
            'ticket' => $ticket,
            'estados' => TicketEstado::where('activo', 1)->orderBy('orden')->get(),
            'puedeEditar' => $puedeEditar,
            'puedeCambiarEstado' => $puedeCambiarEstado,
            'puedeEliminar' => $puedeEliminar,
            'puedeAprobarQa' => $puedeAprobarQa,
            'siguiendo' => $siguiendo,
        ]);
    }

    public function edit($id)
    {
        $ticket = Ticket::findOrFail($id);
        $user = auth()->user();

        $puedeEditar = $this->esGestor()
            || ($ticket->solicitante_id === $user->id && $ticket->estado()->first()->es_inicial);

        abort_unless($puedeEditar, 403);

        return Inertia::render('Tickets/Edit', [
            'ticket' => $ticket,
            'proyectos' => Proyecto::where('activo', 1)->orderBy('nombre')->get(['id', 'nombre']),
            'departamentos' => Departamento::where('estado', 1)->orderBy('nombre')->get(['id', 'nombre']),
            'tipos' => Ticket::TIPOS,
            'prioridades' => Ticket::PRIORIDADES,
            'severidades' => Ticket::SEVERIDADES,
            'usuarios' => $this->esGestor() ? User::where('activo', 1)->orderBy('name')->get(['id', 'name', 'apellido']) : [],
            'puedeAsignar' => $this->esGestor(),
        ]);
    }

    public function update(Request $request, $id)
    {
        $ticket = Ticket::findOrFail($id);
        $user = auth()->user();

        $puedeEditar = $this->esGestor()
            || ($ticket->solicitante_id === $user->id && $ticket->estado()->first()->es_inicial);

        abort_unless($puedeEditar, 403);

        $data = $request->validate(array_merge([
            'titulo' => 'required|string|max:255',
            'descripcion' => 'nullable|string',
            'tipo' => ['required', Rule::in(Ticket::TIPOS)],
            'prioridad' => ['required', Rule::in(Ticket::PRIORIDADES)],
            'severidad' => ['required', Rule::in(Ticket::SEVERIDADES)],
            'proyecto_id' => 'nullable|exists:proyectos,id',
            'departamento_id' => 'nullable|exists:departamentos,id',
            'asignado_id' => 'nullable|exists:users,id',
            'requiere_qa' => 'nullable|boolean',
            'qa_asignado_id' => 'nullable|exists:users,id',
            'qa_captura_codigo' => 'nullable|image|max:6144',
            'qa_archivos_modificados' => 'nullable|string',
        ], $this->camposRedmineRules()));

        $camposSeguidos = ['titulo', 'descripcion', 'tipo', 'prioridad', 'severidad', 'proyecto_id', 'departamento_id'];
        foreach ($camposSeguidos as $campo) {
            TicketAudit::registrar($ticket->id, $campo, $ticket->$campo, $data[$campo] ?? null);
        }

        $asignadoAnterior = $ticket->asignado_id;

        if ($this->esGestor()) {
            TicketAudit::registrar($ticket->id, 'asignado_id', $ticket->asignado_id, $data['asignado_id'] ?? null);
            $ticket->asignado_id = $data['asignado_id'] ?? null;
            $ticket->requiere_qa = $request->boolean('requiere_qa');
            $ticket->qa_asignado_id = $data['qa_asignado_id'] ?? null;

            TicketAudit::registrar($ticket->id, 'qa_archivos_modificados', $ticket->qa_archivos_modificados, $data['qa_archivos_modificados'] ?? null);
            $ticket->qa_archivos_modificados = $data['qa_archivos_modificados'] ?? null;

            if ($request->hasFile('qa_captura_codigo')) {
                TicketAudit::registrar($ticket->id, 'qa_captura_codigo', $ticket->qa_captura_codigo, 'imagen actualizada');
                $ticket->qa_captura_codigo = $request->file('qa_captura_codigo')->store('tickets/qa', 'public');
            }
        }

        $ticket->update(array_merge([
            'titulo' => $data['titulo'],
            'descripcion' => $data['descripcion'] ?? null,
            'tipo' => $data['tipo'],
            'prioridad' => $data['prioridad'],
            'severidad' => $data['severidad'],
            'proyecto_id' => $data['proyecto_id'] ?? null,
            'departamento_id' => $data['departamento_id'] ?? null,
        ], $this->extraerCamposRedmine($data)));

        if ($this->esGestor() && $ticket->asignado_id && $ticket->asignado_id != $asignadoAnterior) {
            TicketNotifier::notify($ticket, [$ticket->asignado_id], 'asignacion', "Se te asignó el ticket #{$ticket->numero}: {$ticket->titulo}");
        }

        return redirect()
            ->route('tickets.show', $ticket->id)
            ->with('success', 'Ticket actualizado correctamente')
            ->setStatusCode(303);
    }

    public function updateEstado(Request $request, $id)
    {
        $ticket = Ticket::findOrFail($id);
        $user = auth()->user();

        abort_unless($this->esGestor() || $ticket->asignado_id === $user->id, 403);

        $data = $request->validate([
            'estado_id' => 'required|exists:ticket_estados,id',
            'sla_motivo_desvio' => 'nullable|string',
        ]);

        $nuevoEstado = TicketEstado::findOrFail($data['estado_id']);

        if ($nuevoEstado->es_final) {
            if ($ticket->requiere_qa && ! $ticket->qa_aprobado) {
                throw ValidationException::withMessages([
                    'estado_id' => 'Este ticket requiere aprobación de QA antes de poder cerrarse.',
                ]);
            }

            $fueraDeSla = $ticket->sla_vencimiento && now()->gt($ticket->sla_vencimiento);
            if ($fueraDeSla && empty($data['sla_motivo_desvio']) && empty($ticket->sla_motivo_desvio)) {
                throw ValidationException::withMessages([
                    'sla_motivo_desvio' => 'El ticket superó el SLA. Indicá el motivo del desvío para poder cerrarlo.',
                ]);
            }
        }

        TicketAudit::registrar($ticket->id, 'estado', $ticket->estado->nombre, $nuevoEstado->nombre);

        $ticket->estado_id = $nuevoEstado->id;
        if (! empty($data['sla_motivo_desvio'])) {
            $ticket->sla_motivo_desvio = $data['sla_motivo_desvio'];
        }
        $ticket->save();

        TicketNotifier::notify(
            $ticket,
            TicketNotifier::interesados($ticket),
            'cambio_estado',
            "El ticket #{$ticket->numero} cambió a estado \"{$nuevoEstado->nombre}\""
        );

        return back()->with('success', 'Estado actualizado')->setStatusCode(303);
    }

    public function aprobarQa($id)
    {
        $ticket = Ticket::findOrFail($id);
        $user = auth()->user();

        abort_unless($this->esGestor() || $ticket->qa_asignado_id === $user->id, 403);

        TicketAudit::registrar($ticket->id, 'qa_aprobado', $ticket->qa_aprobado ? '1' : '0', '1');
        $ticket->update(['qa_aprobado' => true]);

        TicketNotifier::notify(
            $ticket,
            TicketNotifier::interesados($ticket),
            'qa',
            "QA aprobado en el ticket #{$ticket->numero}"
        );

        return back()->with('success', 'QA aprobado')->setStatusCode(303);
    }

    public function toggleWatch($id)
    {
        $ticket = Ticket::findOrFail($id);
        $userId = auth()->id();

        if ($ticket->watchers()->where('user_id', $userId)->exists()) {
            $ticket->watchers()->detach($userId);
        } else {
            $ticket->watchers()->attach($userId);
        }

        return back()->setStatusCode(303);
    }

    public function destroy($id)
    {
        abort_unless(auth()->user()->rol === 'Administrador', 403);

        Ticket::findOrFail($id)->delete();

        return redirect()
            ->route('tickets.index')
            ->with('success', 'Ticket eliminado')
            ->setStatusCode(303);
    }

    /* ================= COMENTARIOS ================= */

    public function storeComentario(Request $request, $id)
    {
        $ticket = Ticket::findOrFail($id);

        $data = $request->validate([
            'comentario' => 'required|string',
            'interno' => 'nullable|boolean',
            'parent_id' => 'nullable|exists:ticket_comentarios,id',
        ]);

        $comentario = $ticket->comentarios()->create([
            'user_id' => auth()->id(),
            'comentario' => $data['comentario'],
            'interno' => $this->esGestor() ? $request->boolean('interno') : false,
            'parent_id' => $data['parent_id'] ?? null,
        ]);

        $menciones = TicketNotifier::detectarMenciones($data['comentario']);
        if (! empty($menciones)) {
            TicketNotifier::notify($ticket, $menciones, 'mencion', "Te mencionaron en el ticket #{$ticket->numero}");
        }

        $interesados = array_diff(TicketNotifier::interesados($ticket), $menciones);
        TicketNotifier::notify($ticket, $interesados, 'comentario', "Nuevo comentario en el ticket #{$ticket->numero}");

        return back()->with('success', 'Comentario agregado')->setStatusCode(303);
    }

    /* ================= ADJUNTOS ================= */

    public function uploadAdjuntos(Request $request, $id)
    {
        $ticket = Ticket::findOrFail($id);

        $request->validate([
            'archivos' => 'required|array',
            'archivos.*' => 'file|max:102400',
        ]);

        foreach ($request->file('archivos') as $archivo) {
            $path = $archivo->store('tickets', 'public');

            $adjunto = Adjunto::create([
                'nombre_original' => $archivo->getClientOriginalName(),
                'path' => $path,
                'mime' => $archivo->getMimeType(),
                'size' => $archivo->getSize(),
                'activo' => 1,
            ]);

            $ticket->adjuntos()->attach($adjunto->id);
        }

        TicketAudit::registrar($ticket->id, 'adjuntos', null, 'archivo agregado');

        return back()->with('success', 'Adjuntos subidos correctamente')->setStatusCode(303);
    }

    public function destroyAdjunto($ticketId, Adjunto $adjunto)
    {
        Storage::disk('public')->delete($adjunto->path);

        $adjunto->tickets()->detach();
        $adjunto->ticketsQaChecklist()->detach();
        $adjunto->delete();

        return back()->with('success', 'Adjunto eliminado correctamente')->setStatusCode(303);
    }

    public function uploadQaChecklist(Request $request, $id)
    {
        $ticket = Ticket::findOrFail($id);

        abort_unless($this->esGestor(), 403);

        $request->validate([
            'archivos' => 'required|array',
            'archivos.*' => 'file|mimes:xls,xlsx,csv|max:10240',
        ]);

        foreach ($request->file('archivos') as $archivo) {
            $path = $archivo->store('tickets/qa-checklist', 'public');

            $adjunto = Adjunto::create([
                'nombre_original' => $archivo->getClientOriginalName(),
                'path' => $path,
                'mime' => $archivo->getMimeType(),
                'size' => $archivo->getSize(),
                'activo' => 1,
            ]);

            $ticket->qaChecklistAdjuntos()->attach($adjunto->id);
        }

        TicketAudit::registrar($ticket->id, 'qa_checklist', null, 'checklist agregado');

        return back()->with('success', 'Checklist subido correctamente')->setStatusCode(303);
    }

    public function downloadAdjunto($ticketId, Adjunto $adjunto): StreamedResponse
    {
        return Storage::disk('public')->download($adjunto->path, $adjunto->nombre_original);
    }

    public function verAdjunto($ticketId, Adjunto $adjunto)
    {
        return Storage::disk('public')->response($adjunto->path, $adjunto->nombre_original);
    }
}
