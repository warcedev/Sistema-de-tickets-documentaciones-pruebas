<?php

namespace App\Http\Controllers;

use App\Models\TestCaso;
use App\Models\TestCasoPaso;
use App\Models\TestSuite;
use App\Models\Ticket;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TestCasoController extends Controller
{
    private function esGestor(): bool
    {
        return in_array(auth()->user()->rol, ['Administrador', 'Gerente']);
    }

    private function pasosRules(): array
    {
        return [
            'pasos' => 'required|array|min:1',
            'pasos.*.paso' => 'required|string',
            'pasos.*.resultado_esperado' => 'nullable|string',
        ];
    }

    private function ticketRules(): array
    {
        return [
            'ticket_id' => 'nullable|exists:tickets,id',
            'redmine_numero' => 'nullable|string|max:100',
            'redmine_url' => 'nullable|string|max:500',
        ];
    }

    private function ticketsParaSelector()
    {
        return Ticket::orderByDesc('id')->limit(500)->get(['id', 'numero', 'titulo']);
    }

    public function create(TestSuite $suite)
    {
        return Inertia::render('TestCases/CasoForm', [
            'suite' => $suite,
            'caso' => null,
            'prioridades' => TestCaso::PRIORIDADES,
            'tickets' => $this->ticketsParaSelector(),
        ]);
    }

    public function store(Request $request, TestSuite $suite)
    {
        $data = $request->validate([
            'titulo' => 'required|string|max:255',
            'descripcion' => 'nullable|string',
            'preparacion_entorno' => 'nullable|string',
            'prioridad' => 'required|in:' . implode(',', TestCaso::PRIORIDADES),
            ...$this->ticketRules(),
            ...$this->pasosRules(),
        ]);

        $caso = TestCaso::create([
            'suite_id' => $suite->id,
            'titulo' => $data['titulo'],
            'descripcion' => $data['descripcion'] ?? null,
            'preparacion_entorno' => $data['preparacion_entorno'] ?? null,
            'prioridad' => $data['prioridad'],
            'ticket_id' => $data['ticket_id'] ?? null,
            'redmine_numero' => $data['redmine_numero'] ?? null,
            'redmine_url' => $data['redmine_url'] ?? null,
            'creado_por' => auth()->id(),
        ]);

        foreach ($data['pasos'] as $i => $p) {
            TestCasoPaso::create([
                'test_caso_id' => $caso->id,
                'orden' => $i + 1,
                'paso' => $p['paso'],
                'resultado_esperado' => $p['resultado_esperado'] ?? null,
            ]);
        }

        return redirect()
            ->route('test-suites.index', ['suite_id' => $suite->id])
            ->with('success', 'Caso de prueba creado correctamente')
            ->setStatusCode(303);
    }

    public function edit(TestCaso $caso)
    {
        $caso->load(['pasos', 'ticket:id,numero,titulo']);

        return Inertia::render('TestCases/CasoForm', [
            'suite' => $caso->suite,
            'caso' => $caso,
            'prioridades' => TestCaso::PRIORIDADES,
            'tickets' => $this->ticketsParaSelector(),
        ]);
    }

    public function update(Request $request, TestCaso $caso)
    {
        $data = $request->validate([
            'titulo' => 'required|string|max:255',
            'descripcion' => 'nullable|string',
            'preparacion_entorno' => 'nullable|string',
            'prioridad' => 'required|in:' . implode(',', TestCaso::PRIORIDADES),
            ...$this->ticketRules(),
            ...$this->pasosRules(),
        ]);

        $caso->update([
            'titulo' => $data['titulo'],
            'descripcion' => $data['descripcion'] ?? null,
            'preparacion_entorno' => $data['preparacion_entorno'] ?? null,
            'prioridad' => $data['prioridad'],
            'ticket_id' => $data['ticket_id'] ?? null,
            'redmine_numero' => $data['redmine_numero'] ?? null,
            'redmine_url' => $data['redmine_url'] ?? null,
        ]);

        $caso->pasos()->delete();
        foreach ($data['pasos'] as $i => $p) {
            TestCasoPaso::create([
                'test_caso_id' => $caso->id,
                'orden' => $i + 1,
                'paso' => $p['paso'],
                'resultado_esperado' => $p['resultado_esperado'] ?? null,
            ]);
        }

        return redirect()
            ->route('test-suites.index', ['suite_id' => $caso->suite_id])
            ->with('success', 'Caso de prueba actualizado')
            ->setStatusCode(303);
    }

    public function destroy(TestCaso $caso)
    {
        abort_unless($this->esGestor(), 403);

        $suiteId = $caso->suite_id;
        $caso->update(['activo' => false]);

        return redirect()
            ->route('test-suites.index', ['suite_id' => $suiteId])
            ->with('success', 'Caso de prueba eliminado')
            ->setStatusCode(303);
    }

    public function move(Request $request, TestCaso $caso)
    {
        $data = $request->validate([
            'suite_id' => 'required|exists:test_suites,id',
        ]);

        $caso->update(['suite_id' => $data['suite_id']]);

        return redirect()
            ->route('test-suites.index', ['suite_id' => $data['suite_id']])
            ->with('success', 'Caso de prueba movido correctamente')
            ->setStatusCode(303);
    }

    public function copy(Request $request, TestCaso $caso)
    {
        $data = $request->validate([
            'suite_id' => 'required|exists:test_suites,id',
        ]);

        $caso->load('pasos');

        $copia = TestCaso::create([
            'suite_id' => $data['suite_id'],
            'titulo' => $caso->titulo,
            'descripcion' => $caso->descripcion,
            'preparacion_entorno' => $caso->preparacion_entorno,
            'prioridad' => $caso->prioridad,
            'ticket_id' => $caso->ticket_id,
            'redmine_numero' => $caso->redmine_numero,
            'redmine_url' => $caso->redmine_url,
            'creado_por' => auth()->id(),
        ]);

        foreach ($caso->pasos as $p) {
            TestCasoPaso::create([
                'test_caso_id' => $copia->id,
                'orden' => $p->orden,
                'paso' => $p->paso,
                'resultado_esperado' => $p->resultado_esperado,
            ]);
        }

        return redirect()
            ->route('test-suites.index', ['suite_id' => $data['suite_id']])
            ->with('success', 'Caso de prueba copiado correctamente')
            ->setStatusCode(303);
    }
}
