<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class EnsurePasswordIsFresh
{
    /**
     * Días antes de forzar el cambio de contraseña por vencimiento
     * (norma de seguridad estilo Redmine).
     */
    protected const DIAS_EXPIRACION = 90;

    protected const RUTAS_PERMITIDAS = [
        'profile.edit',
        'profile.update',
        'profile.destroy',
        'password.update',
        'logout',
    ];

    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();

        if (! $user || $request->routeIs(self::RUTAS_PERMITIDAS)) {
            return $next($request);
        }

        $vencida = $user->password_changed_at
            && $user->password_changed_at->lt(now()->subDays(self::DIAS_EXPIRACION));

        if ($user->debe_cambiar_password || $vencida) {
            return redirect()->route('profile.edit')->with(
                'error',
                $vencida && ! $user->debe_cambiar_password
                    ? 'Tu contraseña venció, actualízala para continuar.'
                    : 'Debes definir una nueva contraseña antes de continuar.'
            );
        }

        return $next($request);
    }
}
