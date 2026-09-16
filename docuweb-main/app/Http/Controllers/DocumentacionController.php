<?php

namespace App\Http\Controllers;

use App\Models\Documentacion;
use App\Models\Adjunto;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class DocumentacionController extends Controller
{
    /**
     * Crear documento
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'titulo' => 'required|string|max:255',
            'contenido' => 'nullable|string',
            'portada' => 'nullable|image|max:6144',

            'tags' => 'array|max:20',
            'tags.*' => 'exists:tags,id',

            'departamentos' => 'array|max:20',
            'departamentos.*' => 'exists:departamentos,id',
        ]);

        $portadaPath = null;

        if ($request->hasFile('portada')) {
            $portadaPath = $request->file('portada')->store('portadas', 'public');
        }

        $doc = Documentacion::create([
            'titulo' => $data['titulo'],
            'contenido' => $data['contenido'] ?? null,
            'portada' => $portadaPath,
            'user_id' => auth()->id(),
        ]);

        if (!empty($data['tags'])) {
            $doc->tags()->sync($data['tags']);
        }

        if (!empty($data['departamentos'])) {
            $doc->departamentos()->sync($data['departamentos']);
        }

        return redirect()
            ->route('documentacion.show', $doc->id)
            ->with('success', 'Documento creado correctamente')
            ->setStatusCode(303);
    }

    /**
     * Actualizar documento
     */
    public function update(Request $request, $id)
    {
        $doc = Documentacion::findOrFail($id);

        abort_unless($doc->esVisiblePara(auth()->user()), 403);

        $data = $request->validate([
            'titulo' => 'required|string|max:255',
            'contenido' => 'nullable|string',
            'portada' => 'nullable|image|max:6144',

            'tags' => 'array|max:20',
            'tags.*' => 'exists:tags,id',

            'departamentos' => 'array|max:20',
            'departamentos.*' => 'exists:departamentos,id',
        ]);

        if ($request->hasFile('portada')) {
            $data['portada'] = $request->file('portada')->store('portadas', 'public');
        } else {
            unset($data['portada']);
        }

        $doc->update($data);

        if ($request->has('tags')) {
            $doc->tags()->sync($request->input('tags', []));
        }

        if ($request->has('departamentos')) {
            $doc->departamentos()->sync($request->input('departamentos', []));
        }

        return redirect()
            ->route('documentacion.show', $doc->id)
            ->with('success', 'Documento actualizado correctamente')
            ->setStatusCode(303);
    }

    /**
     * Eliminar documento
     */
    public function destroy($id)
    {
        $doc = Documentacion::findOrFail($id);

        abort_unless($doc->esVisiblePara(auth()->user()), 403);

        $doc->delete();

        return redirect()
            ->route('principal')
            ->with('success', 'Documento eliminado')
            ->setStatusCode(303);
    }

    /**
     * Subir adjuntos
     */
    public function uploadAdjuntos(Request $request, $id)
    {
        $documentacion = Documentacion::findOrFail($id);

        abort_unless($documentacion->esVisiblePara(auth()->user()), 403);

        $request->validate([
            'archivos' => 'required|array',
            'archivos.*' => 'file|max:102400',
        ]);

        foreach ($request->file('archivos') as $archivo) {
            $path = $archivo->store('documentos', 'public');

            $adjunto = Adjunto::create([
                'nombre_original' => $archivo->getClientOriginalName(),
                'path' => $path,
                'mime' => $archivo->getMimeType(),
                'size' => $archivo->getSize(),
                'activo' => 1,
            ]);

            $documentacion->adjuntos()->attach($adjunto->id);
        }

        return redirect()
            ->route('documentacion.edit', $documentacion->id)
            ->with('success', 'Adjuntos subidos correctamente')
            ->setStatusCode(303);
    }

    /**
     * Eliminar adjunto
     */
    public function destroyAdjunto(Adjunto $adjunto)
    {
        $doc = $adjunto->documentaciones()->first();
        abort_if($doc && ! $doc->esVisiblePara(auth()->user()), 403);

        Storage::disk('public')->delete($adjunto->path);

        $adjunto->documentaciones()->detach();
        $adjunto->delete();

        return back()
            ->with('success', 'Adjunto eliminado correctamente')
            ->setStatusCode(303);
    }

    /**
     * Descargar adjunto
     */
    public function downloadAdjunto(Adjunto $adjunto): StreamedResponse
    {
        $doc = $adjunto->documentaciones()->first();
        abort_if($doc && ! $doc->esVisiblePara(auth()->user()), 403);

        return Storage::disk('public')->download(
            $adjunto->path,
            $adjunto->nombre_original
        );
    }

    /**
     * Ver adjunto inline (imágenes/videos), sin forzar descarga
     */
    public function verAdjunto(Adjunto $adjunto)
    {
        $doc = $adjunto->documentaciones()->first();
        abort_if($doc && ! $doc->esVisiblePara(auth()->user()), 403);

        return Storage::disk('public')->response(
            $adjunto->path,
            $adjunto->nombre_original
        );
    }
}