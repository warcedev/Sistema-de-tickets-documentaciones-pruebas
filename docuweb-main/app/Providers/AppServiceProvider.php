<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     *
     * @return void
     */
    public function register()
    {
        //
    }

    /**
     * Bootstrap any application services.
     *
     * @return void
     */
    public function boot()
    {
        // Política de contraseñas para todo el sistema (norma de seguridad
        // estilo Redmine): mínimo 8 caracteres, mayúsculas, minúsculas y
        // números. Se deja fuera ->uncompromised() a propósito: consulta un
        // servicio externo (HaveIBeenPwned) y este es un sistema interno.
        Password::defaults(function () {
            return Password::min(8)->mixedCase()->numbers();
        });

        Inertia::share([
            // 🔹 Información global del usuario autenticado
            'auth' => function () {
                $user = auth()->user();

                if (!$user) {
                    return null;
                }

                // ✅ Generar URL manualmente (en caso de que Inertia no lea el accessor)
                $photoUrl = $user->profile_photo_path
                    ? asset('storage/' . $user->profile_photo_path)
                    : 'https://ui-avatars.com/api/?name=' . urlencode($user->name);

                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'rol' => $user->rol,
                    'profile_photo_url' => $photoUrl, // 🔥 ahora forzado
                ];
            },

            // 🔹 Mensajes flash (mantiene tu implementación original)
            'flash' => fn () => [
                'success' => session('success'),
                'error' => session('error'),
            ],
        ]);
    }
}
