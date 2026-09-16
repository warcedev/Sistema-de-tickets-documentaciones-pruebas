<?php

namespace App\Http\Controllers;

use App\Models\Tag;
use App\Models\Departamento;
use App\Models\Proyecto;
use App\Models\TicketEstado;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AdminCatalogosController extends Controller
{
    public function index()
    {
        return Inertia::render('Admin/Catalogos', [
            'tags' => Tag::orderBy('descripcion')->get(),
            'departamentos' => Departamento::orderBy('nombre')->get(),
            'proyectos' => Proyecto::orderBy('nombre')->get(),
            'ticketEstados' => TicketEstado::orderBy('orden')->get(),
        ]);
    }

    /* ================= TAGS ================= */

    public function storeTag(Request $request)
    {
        $data = $request->validate([
            'descripcion' => 'required|string|max:255',
        ]);

        Tag::create([
            'descripcion' => $data['descripcion'],
            'estado' => 1,
        ]);

        return back()->with('success', 'Tag creado');
    }

    public function toggleTag($id)
    {
        $tag = Tag::findOrFail($id);
        $tag->estado = ! $tag->estado;
        $tag->save();

        return back()->with('success', 'Estado del tag actualizado');
    }

    /* ================= DEPARTAMENTOS ================= */

    public function storeDepartamento(Request $request)
    {
        $data = $request->validate([
            'nombre' => 'required|string|max:255',
        ]);

        Departamento::create([
            'nombre' => $data['nombre'],
            'estado' => 1,
        ]);

        return back()->with('success', 'Departamento creado');
    }

    public function toggleDepartamento($id)
    {
        $dep = Departamento::findOrFail($id);
        $dep->estado = ! $dep->estado;
        $dep->save();

        return back()->with('success', 'Estado del departamento actualizado');
    }

    /* ================= PROYECTOS ================= */

    public function storeProyecto(Request $request)
    {
        $data = $request->validate([
            'nombre' => 'required|string|max:255',
            'descripcion' => 'nullable|string|max:255',
        ]);

        Proyecto::create([
            'nombre' => $data['nombre'],
            'descripcion' => $data['descripcion'] ?? null,
            'activo' => 1,
        ]);

        return back()->with('success', 'Proyecto creado');
    }

    public function toggleProyecto($id)
    {
        $proyecto = Proyecto::findOrFail($id);
        $proyecto->activo = ! $proyecto->activo;
        $proyecto->save();

        return back()->with('success', 'Estado del proyecto actualizado');
    }

    /* ================= ESTADOS DE TICKETS ================= */

    public function storeTicketEstado(Request $request)
    {
        $data = $request->validate([
            'nombre' => 'required|string|max:255',
            'color' => 'nullable|string|max:20',
            'es_inicial' => 'nullable|boolean',
            'es_final' => 'nullable|boolean',
            'es_prueba' => 'nullable|boolean',
            'es_prueba_finalizada' => 'nullable|boolean',
        ]);

        TicketEstado::create([
            'nombre' => $data['nombre'],
            'color' => $data['color'] ?? '#6B7280',
            'es_inicial' => $request->boolean('es_inicial'),
            'es_final' => $request->boolean('es_final'),
            'es_prueba' => $request->boolean('es_prueba'),
            'es_prueba_finalizada' => $request->boolean('es_prueba_finalizada'),
            'orden' => (TicketEstado::max('orden') ?? 0) + 1,
            'activo' => 1,
        ]);

        return back()->with('success', 'Estado de ticket creado');
    }

    public function toggleTicketEstado($id)
    {
        $estado = TicketEstado::findOrFail($id);
        $estado->activo = ! $estado->activo;
        $estado->save();

        return back()->with('success', 'Estado actualizado');
    }

    public function toggleEsPrueba($id)
    {
        $estado = TicketEstado::findOrFail($id);
        $estado->es_prueba = ! $estado->es_prueba;
        $estado->save();

        return back()->with('success', 'Estado actualizado');
    }

    public function toggleEsPruebaFinalizada($id)
    {
        $estado = TicketEstado::findOrFail($id);
        $estado->es_prueba_finalizada = ! $estado->es_prueba_finalizada;
        $estado->save();

        return back()->with('success', 'Estado actualizado');
    }
}