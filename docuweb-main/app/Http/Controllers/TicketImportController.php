<?php

namespace App\Http\Controllers;

use App\Models\Proyecto;
use App\Models\Ticket;
use App\Models\TicketAudit;
use App\Models\TicketComentario;
use App\Models\TicketEstado;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TicketImportController extends Controller
{
    /**
     * Campos "estilo Redmine" que se pueden completar automáticamente
     * a partir del historial de actividad del ticket (ver detectarCamposRedmine()).
     */
    private const CAMPOS_FECHA = [
        'fecha inicio' => 'fecha_inicio',
        'fecha fin' => 'fecha_fin',
        'fecha estimada entrega' => 'fecha_estimada_entrega',
        'fecha de asignacion' => 'fecha_asignacion',
        'fecha asignacion' => 'fecha_asignacion',
        'fecha de entrega' => 'fecha_entrega',
        'fecha entrega' => 'fecha_entrega',
        'fecha de conformidad' => 'fecha_conformidad',
        'fecha conformidad' => 'fecha_conformidad',
        'fecha inicio relevamiento' => 'fecha_inicio_relevamiento',
        'fecha fin relevamiento' => 'fecha_fin_relevamiento',
        'fecha aprobacion relevamiento' => 'fecha_aprobacion_relevamiento',
        'fecha inicio desarrollo' => 'fecha_inicio_desarrollo',
        'fecha inicio reanudacion' => 'fecha_inicio_reanudacion',
        'fecha fin reanudacion' => 'fecha_fin_reanudacion',
        'fecha a produccion' => 'fecha_a_produccion',
        'fecha autorizacion pasaje' => 'fecha_autorizacion_pasaje',
        'fecha estimada entrega qa' => 'fecha_estimada_entrega_qa',
        'fecha entrega qa' => 'fecha_entrega_qa',
    ];

    private const CAMPOS_ENTERO = [
        '% realizado' => 'porcentaje_realizado',
        'porcentaje realizado' => 'porcentaje_realizado',
        'cant objetos modif' => 'cant_objetos_modif',
        'desvios en dias' => 'desvios_dias',
        'cant vuelta atras' => 'cant_vuelta_atras',
        'cant. vuelta atras' => 'cant_vuelta_atras',
    ];

    private const CAMPOS_TEXTO = [
        'tiempo estimado' => 'tiempo_estimado',
        'hora estimada qa' => 'hora_estimada_qa',
        'prioridad ti' => 'prioridad_ti',
        'referencia asignacion ti' => 'referencia_asignacion_ti',
        'area' => 'area',
        'motivo del desvio' => 'motivo_desvio',
    ];

    private function esGestor(): bool
    {
        return in_array(auth()->user()->rol, ['Administrador', 'Gerente']);
    }

    private function normalizar(string $s): string
    {
        $s = strtr(trim($s), [
            'á' => 'a', 'é' => 'e', 'í' => 'i', 'ó' => 'o', 'ú' => 'u',
            'Á' => 'a', 'É' => 'e', 'Í' => 'i', 'Ó' => 'o', 'Ú' => 'u',
            'ñ' => 'n', 'Ñ' => 'n',
        ]);
        $s = mb_strtolower($s);
        $s = preg_replace('/\s{2,}/', ' ', $s);

        return trim($s, " .\t\n\r\0\x0B");
    }

    private function buscarUsuarioPorNombre(?string $nombreCompleto): ?int
    {
        if (!$nombreCompleto) {
            return null;
        }

        $partes = preg_split('/\s+/', trim($nombreCompleto), 2);
        $usuario = User::where('name', 'like', '%' . $partes[0] . '%')
            ->when(isset($partes[1]), fn ($q) => $q->where('apellido', 'like', '%' . $partes[1] . '%'))
            ->first();

        return $usuario?->id;
    }

    private function parsearFecha(string $valor): ?string
    {
        $valor = trim(strip_tags($valor));
        $fecha = \DateTime::createFromFormat('d/m/Y', $valor);

        return $fecha ? $fecha->format('Y-m-d') : null;
    }

    /**
     * Busca en el HTML de un journal de Redmine líneas del tipo
     * "<strong>Campo</strong> cambiado de <i>X</i> a <i>Y</i>" o
     * "<strong>Campo</strong> establecido a <i>Y</i>" y devuelve [campo_normalizado => valor].
     */
    private function extraerCambiosDeCampos(string $html): array
    {
        $cambios = [];

        // [^<] (en vez de .*?) evita que el match "salte" por encima de otros
        // <strong>/<li> cuando el primero no es un cambio de campo (ej. "Añadido
        // Fichero ..."), que si no terminaba fusionándose con el siguiente bullet.
        if (!preg_match_all(
            '/<strong>([^<]*?)<\/strong>\s*(?:cambiado de\s*<i>[^<]*?<\/i>\s*a\s*<i>([^<]*?)<\/i>|establecido a\s*<i>([^<]*?)<\/i>)/iu',
            $html,
            $matches,
            PREG_SET_ORDER
        )) {
            return $cambios;
        }

        foreach ($matches as $m) {
            $campo = $this->normalizar(strip_tags($m[1]));
            $valor = trim(strip_tags($m[2] ?? '')) !== '' ? trim(strip_tags($m[2])) : trim(strip_tags($m[3] ?? ''));

            if ($campo !== '' && $valor !== '') {
                $cambios[$campo] = $valor;
            }
        }

        return $cambios;
    }

    /**
     * A partir de todos los cambios de campo detectados en el historial (ya en
     * orden cronológico, así que el último valor de cada campo "gana"), arma el
     * array de campos Redmine a completar en el ticket + sugerencias de estado/
     * asignado/QA.
     */
    private function detectarCamposRedmine(array $cambiosAcumulados): array
    {
        $camposRedmine = [];

        foreach (self::CAMPOS_FECHA as $nombre => $campo) {
            if (isset($cambiosAcumulados[$nombre])) {
                $fecha = $this->parsearFecha($cambiosAcumulados[$nombre]);
                if ($fecha) {
                    $camposRedmine[$campo] = $fecha;
                }
            }
        }

        foreach (self::CAMPOS_ENTERO as $nombre => $campo) {
            if (isset($cambiosAcumulados[$nombre])) {
                $camposRedmine[$campo] = (int) preg_replace('/[^\d-]/', '', $cambiosAcumulados[$nombre]);
            }
        }

        foreach (self::CAMPOS_TEXTO as $nombre => $campo) {
            if (isset($cambiosAcumulados[$nombre])) {
                $valor = $cambiosAcumulados[$nombre];
                if ($campo === 'tiempo_estimado') {
                    $valor = trim(preg_replace('/\s*h\.?$/i', '', $valor));
                }
                $camposRedmine[$campo] = $valor;
            }
        }

        return $camposRedmine;
    }

    public function form()
    {
        abort_unless($this->esGestor(), 403);

        return Inertia::render('Tickets/Importar', [
            'proyectos' => Proyecto::where('activo', 1)->orderBy('nombre')->get(['id', 'nombre']),
            'estados' => TicketEstado::where('activo', 1)->orderBy('orden')->get(['id', 'nombre']),
            'tipos' => Ticket::TIPOS,
            'usuarios' => User::where('activo', 1)->orderBy('name')->get(['id', 'name', 'apellido']),
        ]);
    }

    /**
     * Lee el archivo Atom subido y devuelve un preview (sin guardar nada todavía).
     *
     * Soporta dos formatos de Atom de Redmine:
     *  - Listado de incidencias (issues.atom): 1 <entry> = 1 ticket.
     *  - Actividad de una incidencia puntual (issues/123.atom): N <entry> = N
     *    cambios/comentarios del MISMO ticket. En este caso se agrupan por
     *    número de ticket y cada entry pasa a ser un comentario, además de
     *    usarse para detectar campos (estado, fechas, asignado, etc.).
     */
    public function previsualizar(Request $request)
    {
        abort_unless($this->esGestor(), 403);

        $request->validate([
            'archivo' => 'required|file|max:20480',
        ]);

        $xmlString = file_get_contents($request->file('archivo')->getRealPath());

        libxml_use_internal_errors(true);
        $xml = simplexml_load_string($xmlString);

        if ($xml === false) {
            return response()->json([
                'error' => 'El archivo no es un XML/Atom válido.',
            ], 422);
        }

        $xml->registerXPathNamespace('atom', 'http://www.w3.org/2005/Atom');
        $entries = $xml->xpath('//atom:entry');

        if (empty($entries)) {
            $entries = $xml->xpath('//entry');
        }

        if (empty($entries)) {
            return response()->json([
                'error' => 'El archivo no tiene entradas (<entry>) para importar.',
            ], 422);
        }

        // 1) Agrupar las entries por número de ticket real
        $grupos = [];

        foreach ($entries as $entry) {
            $entry->registerXPathNamespace('atom', 'http://www.w3.org/2005/Atom');

            $tituloCrudo = trim((string) ($entry->title ?? ''));
            $idUrl = trim((string) ($entry->id ?? ''));

            $linkNodes = $entry->xpath('atom:link') ?: $entry->xpath('link');
            $link = $idUrl;
            if (!empty($linkNodes)) {
                $attrs = $linkNodes[0]->attributes();
                if (isset($attrs['href'])) {
                    $link = (string) $attrs['href'];
                }
            }

            // El número de ticket sale del link/id "/issues/343915" (ignorando
            // query params como ?journal_id=... que identifican el cambio, no el ticket).
            $redmineNumero = null;
            if (preg_match('#/issues/(\d+)#', $link, $m) || preg_match('#/issues/(\d+)#', $idUrl, $m)) {
                $redmineNumero = $m[1];
            } elseif (preg_match('/#(\d+)/', $tituloCrudo, $m)) {
                $redmineNumero = $m[1];
            }

            if (!$redmineNumero) {
                continue;
            }

            $contentNode = $entry->content ?? $entry->summary ?? null;
            $contentHtml = $contentNode !== null ? (string) $contentNode : '';

            $autor = isset($entry->author->name) ? trim((string) $entry->author->name) : null;
            $actualizado = isset($entry->updated) ? trim((string) $entry->updated) : null;

            if (!isset($grupos[$redmineNumero])) {
                $grupos[$redmineNumero] = [
                    'titulo_crudo' => $tituloCrudo,
                    'link' => $link,
                    'journals' => [],
                ];
            }

            $grupos[$redmineNumero]['journals'][] = [
                'autor' => $autor,
                'fecha' => $actualizado,
                'html' => $contentHtml,
            ];
        }

        $estadoInicial = TicketEstado::where('es_inicial', true)->first();
        $numerosExistentes = Ticket::whereNotNull('redmine_numero')->pluck('id', 'redmine_numero');

        $resultado = [];

        foreach ($grupos as $redmineNumero => $g) {
            // Las claves de array numéricas en PHP se castean a int automáticamente;
            // lo forzamos de vuelta a string (el 343915 no debe tratarse como número).
            $redmineNumero = (string) $redmineNumero;

            usort($g['journals'], fn ($a, $b) => strcmp((string) $a['fecha'], (string) $b['fecha']));

            // Título: "Proyecto - Tracker #123: Asunto" (u otras variantes similares)
            $sinNumero = trim(preg_replace('/#\d+/', '', $g['titulo_crudo']));
            $sinNumero = trim(preg_replace('/\s{2,}/', ' ', $sinNumero));

            $tracker = null;
            $subject = $g['titulo_crudo'];

            if (preg_match('/^(.*?)\s*\(([^)]+)\)\s*:\s*(.*)$/su', $sinNumero, $m)) {
                $tracker = trim($m[1]) ?: null;
                $subject = trim($m[3]) ?: $g['titulo_crudo'];
            } elseif (preg_match('/^(.*?):\s*(.*)$/su', $sinNumero, $m)) {
                $tracker = trim($m[1]) ?: null;
                $subject = trim($m[2]) ?: $g['titulo_crudo'];
            }
            // Si el tracker viene con prefijo de proyecto ("BANTOTAL - Pedido Nuevo"),
            // nos quedamos con el último segmento como tracker.
            if ($tracker && str_contains($tracker, ' - ')) {
                $partesTracker = explode(' - ', $tracker);
                $tracker = trim(end($partesTracker));
            }

            $esActividad = count($g['journals']) > 1;

            $cambiosAcumulados = [];
            $comentarios = [];

            foreach ($g['journals'] as $j) {
                foreach ($this->extraerCambiosDeCampos($j['html']) as $campo => $valor) {
                    $cambiosAcumulados[$campo] = $valor; // el último (cronológico) gana
                }

                if ($esActividad) {
                    $texto = trim(html_entity_decode(strip_tags($j['html'])));
                    if ($texto !== '') {
                        $comentarios[] = [
                            'autor' => $j['autor'],
                            'autor_id' => $this->buscarUsuarioPorNombre($j['autor']),
                            'fecha' => $j['fecha'],
                            'texto' => $texto,
                        ];
                    }
                }
            }

            $camposRedmine = $this->detectarCamposRedmine($cambiosAcumulados);

            if ($esActividad) {
                $descripcion = 'Este ticket fue importado desde el historial de actividad de Redmine '
                    . '(el feed no incluye la descripción original, solo el historial de cambios). '
                    . 'Ver comentarios para el detalle completo.';
            } else {
                $descripcion = trim(html_entity_decode(strip_tags($g['journals'][0]['html'] ?? '')));
            }

            // Estado sugerido: el último "Estado cambiado/establecido" detectado en el historial
            $estadoTexto = $cambiosAcumulados['estado'] ?? null;
            $estadoSugeridoId = null;
            if ($estadoTexto) {
                $match = TicketEstado::whereRaw('LOWER(nombre) = ?', [mb_strtolower($estadoTexto)])->first();
                if ($match) {
                    $estadoSugeridoId = $match->id;
                }
            }
            if (!$estadoSugeridoId && $estadoInicial) {
                $estadoSugeridoId = $estadoInicial->id;
            }

            $tipoSugerido = null;
            if ($tracker) {
                foreach (Ticket::TIPOS as $t) {
                    if (mb_strtolower($t) === mb_strtolower($tracker)) {
                        $tipoSugerido = $t;
                        break;
                    }
                }
            }

            $primerAutor = $g['journals'][0]['autor'] ?? null;
            $asignadoTexto = $cambiosAcumulados['asignado a'] ?? null;
            $qaTexto = $cambiosAcumulados['qa asignado'] ?? null;

            $resultado[] = [
                'redmine_numero' => $redmineNumero,
                'redmine_url' => $g['link'],
                'tracker' => $tracker,
                'titulo' => $subject ?: '(Sin título)',
                'descripcion' => $descripcion,
                'estado_texto' => $estadoTexto,
                'autor' => $primerAutor,
                'cantidad_actualizaciones' => count($g['journals']),
                'campos_detectados' => count($camposRedmine),
                'campos_redmine' => $camposRedmine,
                'comentarios' => $comentarios,
                'tipo_sugerido' => $tipoSugerido,
                'estado_sugerido_id' => $estadoSugeridoId,
                'solicitante_sugerido_id' => $this->buscarUsuarioPorNombre($primerAutor),
                'asignado_sugerido_id' => $this->buscarUsuarioPorNombre($asignadoTexto),
                'qa_asignado_sugerido_id' => $this->buscarUsuarioPorNombre($qaTexto),
                'duplicado' => isset($numerosExistentes[$redmineNumero]),
                'ticket_existente_id' => $numerosExistentes[$redmineNumero] ?? null,
            ];
        }

        return response()->json([
            'entradas' => array_values($resultado),
        ]);
    }

    /**
     * Crea los tickets a partir de las entradas revisadas/confirmadas por el usuario.
     */
    public function confirmar(Request $request)
    {
        abort_unless($this->esGestor(), 403);

        $data = $request->validate([
            'proyecto_id' => 'nullable|exists:proyectos,id',
            'entradas' => 'required|array|min:1',
            'entradas.*.titulo' => 'required|string|max:255',
            'entradas.*.descripcion' => 'nullable|string',
            'entradas.*.tipo' => 'nullable|string',
            'entradas.*.estado_id' => 'nullable|exists:ticket_estados,id',
            'entradas.*.solicitante_id' => 'nullable|exists:users,id',
            'entradas.*.asignado_id' => 'nullable|exists:users,id',
            'entradas.*.qa_asignado_id' => 'nullable|exists:users,id',
            'entradas.*.redmine_numero' => 'nullable|string',
            'entradas.*.redmine_url' => 'nullable|string',
            'entradas.*.campos_redmine' => 'nullable|array',
            'entradas.*.comentarios' => 'nullable|array',
            'entradas.*.comentarios.*.texto' => 'nullable|string',
            'entradas.*.comentarios.*.autor' => 'nullable|string',
            'entradas.*.comentarios.*.autor_id' => 'nullable|exists:users,id',
            'entradas.*.comentarios.*.fecha' => 'nullable|string',
        ]);

        $estadoInicial = TicketEstado::where('es_inicial', true)->first();
        $tipoValido = Ticket::TIPOS[0];
        $camposRedmineValidos = array_merge(
            array_values(self::CAMPOS_FECHA),
            array_values(self::CAMPOS_ENTERO),
            array_values(self::CAMPOS_TEXTO)
        );

        $creados = 0;

        foreach ($data['entradas'] as $entrada) {
            $tipo = in_array($entrada['tipo'] ?? null, Ticket::TIPOS, true)
                ? $entrada['tipo']
                : $tipoValido;

            $descripcion = trim($entrada['descripcion'] ?? '');
            if (!empty($entrada['redmine_url'])) {
                $descripcion = trim($descripcion . "\n\n— Importado desde Redmine: " . $entrada['redmine_url']);
            }

            $camposRedmine = array_intersect_key(
                $entrada['campos_redmine'] ?? [],
                array_flip($camposRedmineValidos)
            );

            $ticket = Ticket::create(array_merge([
                'titulo' => $entrada['titulo'],
                'descripcion' => $descripcion,
                'tipo' => $tipo,
                'prioridad' => 'Normal',
                'severidad' => 'Media',
                'proyecto_id' => $data['proyecto_id'] ?? null,
                'estado_id' => $entrada['estado_id'] ?? ($estadoInicial->id ?? null),
                'solicitante_id' => $entrada['solicitante_id'] ?? auth()->id(),
                'asignado_id' => $entrada['asignado_id'] ?? null,
                'qa_asignado_id' => $entrada['qa_asignado_id'] ?? null,
                'redmine_numero' => $entrada['redmine_numero'] ?? null,
                'redmine_url' => $entrada['redmine_url'] ?? null,
            ], $camposRedmine));

            TicketAudit::registrar($ticket->id, 'origen', null, 'Importado desde Redmine (Atom)' . (!empty($entrada['redmine_numero']) ? " #{$entrada['redmine_numero']}" : ''));

            foreach ($entrada['comentarios'] ?? [] as $c) {
                $texto = trim($c['texto'] ?? '');
                if ($texto === '') {
                    continue;
                }

                if (empty($c['autor_id']) && !empty($c['autor'])) {
                    $texto = "**{$c['autor']}** (Redmine):\n\n{$texto}";
                }

                $comentario = new TicketComentario([
                    'ticket_id' => $ticket->id,
                    'user_id' => $c['autor_id'] ?? auth()->id(),
                    'comentario' => $texto,
                    'interno' => false,
                ]);

                $fecha = !empty($c['fecha']) ? \Carbon\Carbon::parse($c['fecha']) : now();
                $comentario->timestamps = false;
                $comentario->created_at = $fecha;
                $comentario->updated_at = $fecha;
                $comentario->save();
            }

            $creados++;
        }

        return redirect()
            ->route('tickets.index')
            ->with('success', "Se importaron {$creados} tickets desde Redmine.")
            ->setStatusCode(303);
    }
}
