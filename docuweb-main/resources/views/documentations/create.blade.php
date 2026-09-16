@extends('layouts.app')

@section('content')
<div class="container">
    <h1>Crear nueva documentación</h1>

    <form action="{{ route('documentacion.store') }}" method="POST" enctype="multipart/form-data">
        @csrf

        <div class="form-group">
            <label for="titulo">Título</label>
            <input type="text" class="form-control" name="titulo" required>
        </div>

        <div class="form-group">
            <label for="contenido">Descripción</label>
            <textarea class="form-control" name="contenido" rows="4"></textarea>
        </div>

        <div class="form-group">
            <label for="portada">Portada</label>
            <input type="file" class="form-control" name="portada" accept="image/*">
        </div>

        <div class="form-group">
            <label for="archivo">Archivo</label>
            <input type="file" class="form-control" name="archivo"
                   accept="application/pdf,video/*,image/*">
        </div>

        <button type="submit" class="btn btn-primary">
            Cargar documentación
        </button>
    </form>
</div>
@endsection
