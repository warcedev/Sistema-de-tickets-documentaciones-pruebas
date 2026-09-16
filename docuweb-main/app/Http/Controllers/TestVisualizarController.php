<?php

namespace App\Http\Controllers;

use App\Models\TestCaso;
use App\Models\TestEjecucion;
use App\Models\TestSuite;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class TestVisualizarController extends Controller
{
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
                ->withCount(['pasos', 'ejecuciones'])
                ->with(['ultimaEjecucion', 'ticket:id,numero,titulo'])
                ->orderByDesc('id')
                ->get()
            : collect();

        return Inertia::render('TestCases/Visualizar', [
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
            'ejecuciones.pasos.pasoDefinicion',
            'ejecuciones.pasos.adjuntos',
        ]);

        return Inertia::render('TestCases/VisualizarCaso', [
            'caso' => $caso,
        ]);
    }

    /**
     * Convierte las capturas (imágenes) de cada paso ejecutado en data-uris
     * base64, para que dompdf pueda embeberlas sin depender de una URL pública.
     */
    private function embeberCapturas($ejecuciones): void
    {
        foreach ($ejecuciones as $ejecucion) {
            foreach ($ejecucion->pasos as $paso) {
                foreach ($paso->adjuntos as $adjunto) {
                    if (
                        $adjunto->mime
                        && str_starts_with($adjunto->mime, 'image/')
                        && Storage::disk('public')->exists($adjunto->path)
                    ) {
                        $contenido = Storage::disk('public')->get($adjunto->path);
                        $adjunto->data_uri = 'data:' . $adjunto->mime . ';base64,' . base64_encode($contenido);
                    } else {
                        $adjunto->data_uri = null;
                    }
                }
            }
        }
    }

    /**
     * Resumen de estados a partir de la última ejecución de cada caso (para
     * la portada de los PDF de caso/suite).
     */
    private function resumenPorCasos($casos): array
    {
        $resumen = ['Exitoso' => 0, 'Fallido' => 0, 'Bloqueado' => 0, 'Sin ejecutar' => 0];

        foreach ($casos as $caso) {
            $ultima = $caso->ejecuciones->first(); // ya viene ordenado desc por ejecutado_en
            $resumen[$ultima->estado ?? 'Sin ejecutar']++;
        }

        return $resumen;
    }

    public function pdf(TestEjecucion $ejecucion)
    {
        $ejecucion->load([
            'caso.suite:id,nombre',
            'caso.ticket:id,numero,titulo',
            'ejecutor:id,name,apellido',
            'pasos.pasoDefinicion',
            'pasos.adjuntos',
        ]);

        $this->embeberCapturas([$ejecucion]);

        $pdf = Pdf::loadView('pdf.ejecucion', ['ejecucion' => $ejecucion])
            ->setPaper('a4')
            ->setOption('isPhpEnabled', true);

        return $pdf->download("caso-{$ejecucion->test_caso_id}-ejecucion-{$ejecucion->id}.pdf");
    }

    public function pdfCaso(TestCaso $caso)
    {
        $caso->load([
            'suite:id,nombre',
            'ticket:id,numero,titulo',
            'pasos',
            'ejecuciones.ejecutor:id,name,apellido',
            'ejecuciones.pasos.pasoDefinicion',
            'ejecuciones.pasos.adjuntos',
        ]);

        $this->embeberCapturas($caso->ejecuciones);

        $resumen = $this->resumenPorCasos(collect([$caso]));

        $pdf = Pdf::loadView('pdf.caso-historial', ['caso' => $caso, 'resumen' => $resumen])
            ->setPaper('a4')
            ->setOption('isPhpEnabled', true);

        return $pdf->download("caso-{$caso->id}-historial.pdf");
    }

    public function pdfSuite(TestSuite $suite)
    {
        $todasLasSuites = TestSuite::where('activo', 1)->get(['id', 'parent_id', 'nombre']);
        $ids = TestSuite::idsConDescendientes($suite->id, $todasLasSuites);

        $casosPorSuite = TestCaso::whereIn('suite_id', $ids)
            ->where('activo', 1)
            ->with([
                'ticket:id,numero,titulo',
                'pasos',
                'ejecuciones.ejecutor:id,name,apellido',
                'ejecuciones.pasos.pasoDefinicion',
                'ejecuciones.pasos.adjuntos',
            ])
            ->orderBy('id')
            ->get()
            ->groupBy('suite_id');

        foreach ($casosPorSuite as $casos) {
            foreach ($casos as $caso) {
                $this->embeberCapturas($caso->ejecuciones);
            }
        }

        // Armamos secciones en orden jerárquico (padre, luego sus hijas, recursivo),
        // con el "camino" completo de nombres para poder mostrarlo como breadcrumb.
        // Esto deja el mismo formato tanto si hay muchas sub-suites como si hay una
        // sola suite con varios casos (en ese caso, una única sección).
        $secciones = [];
        $construirSecciones = function (int $suiteId, array $camino) use (
            &$construirSecciones,
            &$secciones,
            $todasLasSuites,
            $casosPorSuite
        ) {
            $s = $todasLasSuites->firstWhere('id', $suiteId);
            $camino[] = $s->nombre;
            $casos = $casosPorSuite->get($suiteId, collect());

            if ($casos->isNotEmpty()) {
                $secciones[] = [
                    'suite' => $s,
                    'breadcrumb' => implode(' ▸ ', $camino),
                    'casos' => $casos,
                ];
            }

            foreach ($todasLasSuites->where('parent_id', $suiteId) as $hija) {
                $construirSecciones($hija->id, $camino);
            }
        };
        $construirSecciones($suite->id, []);

        $todosLosCasos = collect($secciones)->flatMap(fn ($sec) => $sec['casos']);
        $resumen = $this->resumenPorCasos($todosLosCasos);

        $pdf = Pdf::loadView('pdf.suite-historial', [
            'suite' => $suite,
            'secciones' => $secciones,
            'totalCasos' => $todosLosCasos->count(),
            'totalEjecuciones' => $todosLosCasos->sum(fn ($c) => $c->ejecuciones->count()),
            'resumen' => $resumen,
        ])->setPaper('a4')
            ->setOption('isPhpEnabled', true);

        return $pdf->download("suite-{$suite->id}-historial.pdf");
    }
}
