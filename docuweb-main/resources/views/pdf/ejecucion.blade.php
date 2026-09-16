<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    @include('pdf.partials.estilos')
</head>
<body>
    @include('pdf.partials.header-fijo', ['tituloHeader' => 'Reporte de Ejecución'])

    <h1>{{ $ejecucion->caso->titulo }}</h1>
    <p class="muted">
        Suite: {{ $ejecucion->caso->suite->nombre ?? '—' }} &middot;
        Prioridad: {{ $ejecucion->caso->prioridad }} &middot;
        Caso #{{ $ejecucion->caso->id }}
    </p>
    @php
        $caso = $ejecucion->caso;
    @endphp
    @include('pdf.partials.ticket-ref')

    <table style="margin-top:14px;">
        <tr>
            <th style="width:22%">Estado</th>
            <td>
                @php
                    $clase = ['Exitoso' => 'badge-exitoso', 'Fallido' => 'badge-fallido', 'Bloqueado' => 'badge-bloqueado'][$ejecucion->estado] ?? '';
                @endphp
                <span class="badge {{ $clase }}">{{ $ejecucion->estado }}</span>
            </td>
        </tr>
        <tr>
            <th>Ejecutado por</th>
            <td>{{ $ejecucion->ejecutor->name ?? '—' }} {{ $ejecucion->ejecutor->apellido ?? '' }}</td>
        </tr>
        <tr>
            <th>Fecha de ejecución</th>
            <td>{{ optional($ejecucion->ejecutado_en)->format('d/m/Y H:i') }}</td>
        </tr>
        @if($ejecucion->ambiente)
        <tr>
            <th>Ambiente</th>
            <td>{{ $ejecucion->ambiente }}</td>
        </tr>
        @endif
        @if($ejecucion->observaciones)
        <tr>
            <th>Observaciones generales</th>
            <td>{{ $ejecucion->observaciones }}</td>
        </tr>
        @endif
    </table>

    @if($ejecucion->caso->preparacion_entorno)
        <h2>Preparación del entorno</h2>
        <p>{{ $ejecucion->caso->preparacion_entorno }}</p>
    @endif

    @if($ejecucion->caso->descripcion)
        <h2>Justificación del caso</h2>
        <p>{{ $ejecucion->caso->descripcion }}</p>
    @endif

    <h2>Pasos ejecutados</h2>
    @include('pdf.partials.ejecucion-detalle', ['ejecucion' => $ejecucion])

    @include('pdf.partials.pie-pagina')
</body>
</html>
