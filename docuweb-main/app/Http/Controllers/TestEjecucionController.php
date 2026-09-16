<?php

namespace App\Http\Controllers;

use App\Models\Adjunto;
use App\Models\TestCaso;
use App\Models\TestCasoPaso;
use App\Models\TestEjecucion;
use App\Models\TestEjecucionPaso;
use App\Models\TestSuite;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class TestEjecucionController extends Controller
{
    private function esGestor(): bool
    {
        return in_array(auth()->user()->rol, ['Administrador', 'Gerente']);
    }

    public function index(Request $request)
    {
        $suites = TestSuite::where('activo', 1)
            ->withCount(['casos' => fn ($q) => $q->where('activo', 1)])
            ->orderBy('nombre')
            ->get();

        $suiteId = $request->integer('suite_id') ?: $suites->first()?->id;

        $casos = $suiteId
            ? TestCaso::where('suite_id', $suiteId)
                ->where('activo', 1)
                ->withCount('pasos')
                ->with(['ultimaEjecucion', 'ticket:id,numero,titulo'])
                ->orderByDesc('id')
                ->get()
            : collect();

        return Inertia::render('TestCases/Ejecutar', [
            'suites' => $suites,
            'suiteSeleccionada' => $suiteId,
            'casos' => $casos,
        ]);
    }

    public function show(TestCaso $caso)
    {
        $caso->load([
            'suite:id,nombre',
            'ticket:id,numero,titulo',
            'pasos',
            'ejecuciones.ejecutor:id,name,apellido',
        ]);

        return Inertia::render('TestCases/EjecutarCaso', [
            'caso' => $caso,
            'estados' => TestEjecucion::ESTADOS,
            'puedeEliminar' => $this->esGestor(),
        ]);
    }

    public function store(Request $request, TestCaso $caso)
    {
        $data = $request->validate([
            'estado' => 'required|in:' . implode(',', TestEjecucion::ESTADOS),
            'ambiente' => 'nullable|string|max:255',
            'observaciones' => 'nullable|string',
            'pasos' => 'required|array',
            'pasos.*.test_caso_paso_id' => 'required|exists:test_caso_pasos,id',
            'pasos.*.resultado' => 'required|in:Pasa,Falla,N/A',
            'pasos.*.observacion' => 'nullable|string',
            'pasos.*.capturas' => 'nullable|array',
            'pasos.*.capturas.*' => 'file|max:20480',
        ]);

        $ejecucion = TestEjecucion::create([
            'test_caso_id' => $caso->id,
            'ejecutado_por' => auth()->id(),
            'estado' => $data['estado'],
            'ambiente' => $data['ambiente'] ?? null,
            'observaciones' => $data['observaciones'] ?? null,
            'ejecutado_en' => now(),
        ]);

        // Snapshot: guardamos el texto del paso TAL COMO ESTÁ ahora, para que
        // el historial de esta ejecución no se vea afectado si más adelante
        // se edita o se borra el paso original del caso.
        $pasosDelCaso = TestCasoPaso::whereIn('id', collect($data['pasos'])->pluck('test_caso_paso_id'))
            ->get()
            ->keyBy('id');

        foreach ($data['pasos'] as $i => $p) {
            $pasoOriginal = $pasosDelCaso->get($p['test_caso_paso_id']);

            $ejecucionPaso = TestEjecucionPaso::create([
                'test_ejecucion_id' => $ejecucion->id,
                'test_caso_paso_id' => $p['test_caso_paso_id'],
                'paso_texto' => $pasoOriginal?->paso,
                'resultado_esperado_texto' => $pasoOriginal?->resultado_esperado,
                'resultado' => $p['resultado'],
                'observacion' => $p['observacion'] ?? null,
            ]);

            $archivos = $request->file("pasos.$i.capturas") ?? [];
            foreach ($archivos as $archivo) {
                $path = $archivo->store('test-capturas', 'public');

                $adjunto = Adjunto::create([
                    'nombre_original' => $archivo->getClientOriginalName(),
                    'path' => $path,
                    'mime' => $archivo->getMimeType(),
                    'size' => $archivo->getSize(),
                    'activo' => 1,
                ]);

                $ejecucionPaso->adjuntos()->attach($adjunto->id);
            }
        }

        return redirect()
            ->route('test-ejecuciones.show', $caso->id)
            ->with('success', 'Ejecución registrada correctamente')
            ->setStatusCode(303);
    }

    public function destroy(TestEjecucion $ejecucion)
    {
        abort_unless($this->esGestor(), 403);

        $casoId = $ejecucion->test_caso_id;

        foreach ($ejecucion->pasos as $paso) {
            foreach ($paso->adjuntos as $adjunto) {
                Storage::disk('public')->delete($adjunto->path);
                $adjunto->delete();
            }
        }

        $ejecucion->delete();

        return redirect()
            ->route('test-ejecuciones.show', $casoId)
            ->with('success', 'Ejecución eliminada')
            ->setStatusCode(303);
    }

    public function verAdjunto(Adjunto $adjunto)
    {
        return Storage::disk('public')->response($adjunto->path, $adjunto->nombre_original);
    }

    public function downloadAdjunto(Adjunto $adjunto)
    {
        return Storage::disk('public')->download($adjunto->path, $adjunto->nombre_original);
    }
}
