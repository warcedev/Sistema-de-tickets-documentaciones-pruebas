<?php

namespace App\Http\Controllers;

use App\Models\TestCaso;
use App\Models\TestSuite;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TestSuiteController extends Controller
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
                ->with(['creador:id,name,apellido', 'pasos:id,test_caso_id', 'ticket:id,numero,titulo'])
                ->withCount('pasos')
                ->orderByDesc('id')
                ->get()
            : collect();

        return Inertia::render('TestCases/Preparar', [
            'suites' => $suites,
            'suiteSeleccionada' => $suiteId,
            'casos' => $casos,
            'puedeEliminar' => $this->esGestor(),
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'nombre' => 'required|string|max:255',
            'descripcion' => 'nullable|string',
            'parent_id' => 'nullable|exists:test_suites,id',
        ]);

        $suite = TestSuite::create([
            ...$data,
            'creado_por' => auth()->id(),
        ]);

        return redirect()
            ->route('test-suites.index', ['suite_id' => $suite->id])
            ->with('success', 'Suite creada correctamente')
            ->setStatusCode(303);
    }

    public function update(Request $request, TestSuite $suite)
    {
        $data = $request->validate([
            'nombre' => 'required|string|max:255',
            'descripcion' => 'nullable|string',
            'parent_id' => 'nullable|exists:test_suites,id',
        ]);

        $parentId = $data['parent_id'] ?? null;

        if ($parentId) {
            if ($parentId === $suite->id) {
                return back()->withErrors(['parent_id' => 'Una suite no puede ser su propia suite padre.']);
            }

            $todasLasSuites = TestSuite::where('activo', 1)->get(['id', 'parent_id']);
            $descendientes = TestSuite::idsConDescendientes($suite->id, $todasLasSuites);

            if (in_array($parentId, $descendientes, true)) {
                return back()->withErrors(['parent_id' => 'No se puede mover una suite dentro de una de sus propias sub-suites.']);
            }
        }

        $suite->update([
            'nombre' => $data['nombre'],
            'descripcion' => $data['descripcion'] ?? null,
            'parent_id' => $parentId,
        ]);

        return redirect()
            ->route('test-suites.index', ['suite_id' => $suite->id])
            ->with('success', 'Suite actualizada correctamente')
            ->setStatusCode(303);
    }

    public function destroy(TestSuite $suite)
    {
        abort_unless($this->esGestor(), 403);

        $todasLasSuites = TestSuite::where('activo', 1)->get(['id', 'parent_id']);
        $ids = TestSuite::idsConDescendientes($suite->id, $todasLasSuites);

        TestSuite::whereIn('id', $ids)->update(['activo' => false]);

        return redirect()
            ->route('test-suites.index')
            ->with('success', 'Suite eliminada')
            ->setStatusCode(303);
    }
}
