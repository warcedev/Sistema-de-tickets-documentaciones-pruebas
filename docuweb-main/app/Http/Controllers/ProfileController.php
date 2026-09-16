<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Support\Facades\Log;

class ProfileController extends Controller
{
    public function edit(Request $request)
    {
        return inertia('Profile/Edit', [
            'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,
            'status' => session('status'),
            'success' => session('success'),
        ]);
    }

    public function update(Request $request)
    {
        $user = $request->user();

        // 🧠 Validaciones condicionales (solo obligatorias si están vacías)
        $nameRule = empty($user->name)
            ? ['required', 'string', 'max:255']
            : ['nullable', 'string', 'max:255'];

        $emailRule = empty($user->email)
            ? ['required', 'email', 'max:255', Rule::unique('users')->ignore($user->id)]
            : ['nullable', 'email', 'max:255', Rule::unique('users')->ignore($user->id)];

        // 🧾 Validación principal
        $validated = $request->validate([
            'name' => $nameRule,
            'email' => $emailRule,
            'profile_photo' => ['nullable', 'image', 'max:2048'],
        ]);

        // 📁 Subida de foto si se envía un nuevo archivo
        if ($request->hasFile('profile_photo')) {
            $path = $request->file('profile_photo')->store('profile-photos', 'public');
            $validated['profile_photo_path'] = $path;

            Log::info('📸 Foto subida correctamente', [
                'user_id' => $user->id,
                'path' => $path,
                'original_name' => $request->file('profile_photo')->getClientOriginalName(),
            ]);

            // 🚫 Evitar que Laravel intente actualizar una columna inexistente
            unset($validated['profile_photo']);
        } else {
            Log::info('📂 No se subió nueva foto para el usuario', [
                'user_id' => $user->id,
            ]);
        }

        // 💾 Actualizar solo campos con valor
        foreach ($validated as $key => $value) {
            if (!is_null($value) && $value !== '') {
                $user->{$key} = $value;
            }
        }

        Log::info('💾 Datos recibidos para actualización', [
            'user_id' => $user->id,
            'payload' => $validated,
        ]);

        $user->save();

        // 🔄 Refrescar sesión del usuario autenticado
        auth()->setUser($user);

        return back()->with('success', 'Perfil actualizado correctamente.');
    }

    public function destroy(Request $request)
    {
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();

        Log::warning('🗑️ Eliminando usuario', ['user_id' => $user->id, 'email' => $user->email]);

        auth()->logout();
        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }
}
