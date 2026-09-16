<?php

namespace App\Http\Controllers;

use App\Models\Notificacion;
use Illuminate\Http\Request;

class NotificacionController extends Controller
{
    public function index(Request $request)
    {
        $notificaciones = Notificacion::where('user_id', auth()->id())
            ->with('ticket:id,numero,titulo')
            ->latest()
            ->limit(30)
            ->get();

        return response()->json([
            'notificaciones' => $notificaciones,
            'no_leidas' => Notificacion::where('user_id', auth()->id())->where('leida', false)->count(),
        ]);
    }

    public function markRead($id)
    {
        $notificacion = Notificacion::where('user_id', auth()->id())->findOrFail($id);
        $notificacion->update(['leida' => true]);

        return response()->json(['ok' => true]);
    }

    public function markAllRead()
    {
        Notificacion::where('user_id', auth()->id())->where('leida', false)->update(['leida' => true]);

        return response()->json(['ok' => true]);
    }
}
