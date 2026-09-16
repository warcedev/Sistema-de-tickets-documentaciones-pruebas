@extends('layouts.app')

@section('content')
<div class="container">
    <h1>Documentaciones</h1>

    @foreach($documentations as $documentation)
        @php
            // soporta nombres nuevos (Docuweb) y viejos (ejemplo genérico)
            $titulo   = $documentation->titulo ?? $documentation->title ?? '';
            $contenido = $documentation->contenido ?? $documentation->description ?? '';
            $portada  = $documentation->portada ?? $documentation->cover_image ?? null;
            $archivo  = $documentation->archivo ?? $documentation->file_path ?? null;
        @endphp

        <div class="card mb-3">

            {{-- 🖼 Portada (pública) --}}
            @if($portada)
                <img
                    src="{{ asset('storage/' . $portada) }}"
                    class="card-img-top"
                    alt="Portada">
            @endif

            <div class="card-body">
                <h5 class="card-title">{{ $titulo }}</h5>

                @if($contenido)
                    <p class="card-text">{{ $contenido }}</p>
                @endif

                {{-- 📎 Archivo (privado, SOLO si existe) --}}
                @if($archivo)
                    <a
                        href="{{ route('documentacion.archivo', $documentation->id) }}"
                        class="btn btn-primary"
                        target="_blank">
                        Ver archivo
                    </a>
                @else
                    <span class="badge bg-secondary">Sin archivo</span>
                @endif
            </div>
        </div>
    @endforeach
</div>
@endsection
