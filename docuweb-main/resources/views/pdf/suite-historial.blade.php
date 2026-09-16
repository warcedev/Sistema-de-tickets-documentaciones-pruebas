<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    @include('pdf.partials.estilos')
</head>
<body>
    {{-- ===================== PORTADA ===================== --}}
    <div class="portada">
        <div class="marca-grande">DOCWEB</div>
        <div class="linea-decorativa"></div>
        <div class="etiqueta-portada">SUITE DE PRUEBAS</div>
        <h1>{{ $suite->nombre }}</h1>
        <div class="subtitulo">Reporte de Casos de Prueba</div>
        @if($suite->descripcion)
            <p class="muted" style="width:60%; margin:14px auto 0 auto;">{{ $suite->descripcion }}</p>
        @endif

        <div class="stats-grid">
            <div class="stat-caja">
                <div class="valor">{{ $totalCasos }}</div>
                <div class="etiqueta">CASOS DE PRUEBA</div>
            </div>
            <div class="stat-caja exitoso">
                <div class="valor">{{ $resumen['Exitoso'] }}</div>
                <div class="etiqueta">EXITOSOS</div>
            </div>
            <div class="stat-caja fallido">
                <div class="valor">{{ $resumen['Fallido'] }}</div>
                <div class="etiqueta">FALLIDOS</div>
            </div>
            <div class="stat-caja bloqueado">
                <div class="valor">{{ $resumen['Bloqueado'] }}</div>
                <div class="etiqueta">BLOQUEADOS / SIN EJECUTAR</div>
            </div>
        </div>
        <div class="clear"></div>

        <p class="muted" style="margin-top:20px;">{{ $totalEjecuciones }} ejecuciones registradas en total</p>
        <div class="fecha">Generado desde DOCWeb el {{ now()->format('d/m/Y H:i') }}</div>
    </div>

    {{-- ===================== ÍNDICE ===================== --}}
    <div class="pagebreak"></div>
    @include('pdf.partials.header-fijo', ['tituloHeader' => $suite->nombre])
    <h1 style="font-size:19px;">Índice</h1>
    <p class="muted">{{ count($secciones) }} suite{{ count($secciones) === 1 ? '' : 's' }} con casos de prueba</p>

    @foreach($secciones as $sec)
        <div class="indice-seccion">
            <div class="nombre-suite">{{ $sec['breadcrumb'] }}</div>
            @foreach($sec['casos'] as $c)
                @php
                    $ultima = $c->ejecuciones->first();
                @endphp
                <div class="indice-caso">
                    {{ $c->titulo }}
                    @if($ultima)
                        <span class="badge {{ ['Exitoso'=>'badge-exitoso','Fallido'=>'badge-fallido','Bloqueado'=>'badge-bloqueado'][$ultima->estado] ?? '' }}" style="float:right;">
                            {{ $ultima->estado }}
                        </span>
                    @else
                        <span class="badge badge-sinejecutar" style="float:right;">Sin ejecutar</span>
                    @endif
                </div>
            @endforeach
        </div>
    @endforeach

    {{-- ===================== CONTENIDO ===================== --}}
    <div class="pagebreak"></div>
    @include('pdf.partials.header-fijo', ['tituloHeader' => $suite->nombre])

    @forelse($secciones as $sec)
        <div class="seccion-suite">{{ $sec['breadcrumb'] }}</div>

        @foreach($sec['casos'] as $caso)
            <h2 style="margin-top:16px;">{{ $caso->titulo }}</h2>
            <p class="muted">Prioridad: {{ $caso->prioridad }} &middot; Caso #{{ $caso->id }}</p>
            @include('pdf.partials.ticket-ref')

            @if($caso->descripcion)
                <p style="margin-top:8px;"><strong>Por qué:</strong> {{ $caso->descripcion }}</p>
            @endif

            <table>
                <tr>
                    <th style="width:5%">#</th>
                    <th style="width:47%">Paso</th>
                    <th style="width:48%">Resultado esperado</th>
                </tr>
                @foreach($caso->pasos as $i => $p)
                <tr>
                    <td>{{ $i + 1 }}</td>
                    <td>{{ $p->paso }}</td>
                    <td>{{ $p->resultado_esperado ?: '—' }}</td>
                </tr>
                @endforeach
            </table>

            @if($caso->ejecuciones->isEmpty())
                <p class="muted" style="margin-top:8px;">Todavía no se registraron ejecuciones para este caso.</p>
            @else
                @foreach($caso->ejecuciones as $ejecucion)
                    @include('pdf.partials.ejecucion-detalle', ['ejecucion' => $ejecucion])
                @endforeach
            @endif
        @endforeach
    @empty
        <p class="muted">Esta suite todavía no tiene casos de prueba.</p>
    @endforelse

    @include('pdf.partials.pie-pagina')
</body>
</html>
