<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    @include('pdf.partials.estilos')
</head>
<body>
    @include('pdf.partials.header-fijo', ['tituloHeader' => 'Historial de Caso de Prueba'])

    <h1>{{ $caso->titulo }}</h1>
    <p class="muted">
        Suite: {{ $caso->suite->nombre ?? '—' }} &middot;
        Prioridad: {{ $caso->prioridad }} &middot;
        Caso #{{ $caso->id }} &middot;
        {{ $caso->ejecuciones->count() }} ejecuciones registradas
    </p>
    @include('pdf.partials.ticket-ref')

    <div class="stats-grid">
        <div class="stat-caja exitoso">
            <div class="valor">{{ $resumen['Exitoso'] }}</div>
            <div class="etiqueta">EXITOSAS</div>
        </div>
        <div class="stat-caja fallido">
            <div class="valor">{{ $resumen['Fallido'] }}</div>
            <div class="etiqueta">FALLIDAS</div>
        </div>
        <div class="stat-caja bloqueado">
            <div class="valor">{{ $resumen['Bloqueado'] }}</div>
            <div class="etiqueta">BLOQUEADAS</div>
        </div>
        <div class="stat-caja">
            <div class="valor">{{ $caso->pasos->count() }}</div>
            <div class="etiqueta">PASOS DEFINIDOS</div>
        </div>
    </div>
    <div class="clear"></div>

    @if($caso->descripcion)
        <h2>Justificación del caso</h2>
        <p>{{ $caso->descripcion }}</p>
    @endif

    @if($caso->preparacion_entorno)
        <h2>Preparación del entorno</h2>
        <p>{{ $caso->preparacion_entorno }}</p>
    @endif

    <h2>Pasos definidos</h2>
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

    <h2>Historial de ejecuciones</h2>

    @forelse($caso->ejecuciones as $ejecucion)
        @include('pdf.partials.ejecucion-detalle', ['ejecucion' => $ejecucion])
    @empty
        <p class="muted">Todavía no se registraron ejecuciones para este caso.</p>
    @endforelse

    @include('pdf.partials.pie-pagina')
</body>
</html>
