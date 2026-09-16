<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;

class PasswordController extends Controller
{
    /**
     * Update the user's password.
     */
    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'current_password' => ['required', 'current_password'],
            'password' => ['required', Password::defaults(), 'confirmed'],
        ]);

        $user = $request->user();

        if ($user->passwordFueUsadaAntes($validated['password'])) {
            throw ValidationException::withMessages([
                'password' => 'No podés reutilizar una de tus últimas ' . $user::HISTORIAL_PASSWORDS_A_CONSERVAR . ' contraseñas.',
            ]);
        }

        $hash = Hash::make($validated['password']);

        $user->update([
            'password' => $hash,
            'debe_cambiar_password' => false,
            'password_changed_at' => now(),
        ]);

        $user->registrarHistorialPassword($hash);

        return back();
    }
}
