@php
    $claseEstado = [
        'Exitoso' => 'badge-exitoso',
        'Fallido' => 'badge-fallido',
        'Bloqueado' => 'badge-bloqueado',
    ][$ejecucion->estado] ?? '';
@endphp

<h3>
    {{ optional($ejecucion->ejecutado_en)->format('d/m/Y H:i') }} —
    <span class="badge {{ $claseEstado }}">{{ $ejecucion->estado }}</span>
    <span class="muted">por {{ $ejecucion->ejecutor->name ?? '—' }} {{ $ejecucion->ejecutor->apellido ?? '' }}</span>
    @if($ejecucion->ambiente)
        <span class="muted">· Ambiente: {{ $ejecucion->ambiente }}</span>
    @endif
</h3>

@if($ejecucion->observaciones)
    <p style="margin: 4px 0 8px 0;">{{ $ejecucion->observaciones }}</p>
@endif

@foreach($ejecucion->pasos as $i => $p)
    @php
        $claseP = ['Pasa' => 'badge-pasa', 'Falla' => 'badge-falla'][$p->resultado] ?? 'badge-sinejecutar';
        $capturas = $p->adjuntos->filter(fn($a) => $a->data_uri);
        $otrosArchivos = $p->adjuntos->filter(fn($a) => !$a->data_uri);
    @endphp
    <div class="paso-card">
        <div class="titulo-paso">
            Paso {{ $i + 1 }}: {{ $p->paso ?? '—' }}
            <span class="badge {{ $claseP }}" style="float:right;">{{ $p->resultado }}</span>
        </div>
        @if($p->resultado_esperado)
            <div class="esperado">Esperado: {{ $p->resultado_esperado }}</div>
        @endif
        @if($p->observacion)
            <div class="observacion">{{ $p->observacion }}</div>
        @endif

        @if($capturas->count() > 0)
            <div class="capturas">
                @foreach($capturas as $adj)
                    <div class="captura-item {{ $capturas->count() === 1 ? 'unica' : '' }}">
                        <img src="{{ $adj->data_uri }}">
                    </div>
                @endforeach
                <div class="clear"></div>
            </div>
        @endif

        @foreach($otrosArchivos as $adj)
            <p class="muted" style="margin-top:6px;">Archivo adjunto: {{ $adj->nombre_original }}</p>
        @endforeach
    </div>
@endforeach
