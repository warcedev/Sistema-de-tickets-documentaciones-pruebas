<?php

namespace App\Http\Controllers;

use App\Models\Documentacion;
use App\Models\Tag;
use App\Models\Departamento;
use Inertia\Inertia;

class DocumentacionPageController extends Controller
{
    public function index()
    {
        return Inertia::render('Principal', [
            'documentos' => Documentacion::with([
                'autor:id,name,profile_photo_path',
                'departamentos:id,nombre',
                'tags:id,descripcion',
                // ❌ adjuntos QUITADO
            ])
            ->visiblePara(auth()->user())
            ->latest()
            ->get(),
        ]);
    }

    public function show($id)
    {
        $documento = Documentacion::with([
            'autor:id,name,profile_photo_path',
            'departamentos:id,nombre',
            'tags:id,descripcion',
            'adjuntos:id,nombre_original,mime,size',
        ])->findOrFail($id);

        abort_unless($documento->esVisiblePara(auth()->user()), 403);

        return Inertia::render('Documentacion/Show', [
            'documento' => $documento,
        ]);
    }

    public function create()
    {
        return Inertia::render('Documentacion/Create', [
            'tags' => Tag::where('estado', 1)
                ->orderBy('descripcion')
                ->get(['id', 'descripcion']),

            'departamentos' => Departamento::where('estado', 1)
                ->orderBy('nombre')
                ->get(['id', 'nombre']),
        ]);
    }

    public function edit($id)
    {
        $documento = Documentacion::with([
            'tags:id,descripcion',
            'departamentos:id,nombre',
            'adjuntos:id,nombre_original,mime,size',
        ])->findOrFail($id);

        abort_unless($documento->esVisiblePara(auth()->user()), 403);

        return Inertia::render('Documentacion/Edit', [
            'documento' => $documento,

            'tags' => Tag::where('estado', 1)
                ->orderBy('descripcion')
                ->get(['id', 'descripcion']),

            'departamentos' => Departamento::where('estado', 1)
                ->orderBy('nombre')
                ->get(['id', 'nombre']),
        ]);
    }
}