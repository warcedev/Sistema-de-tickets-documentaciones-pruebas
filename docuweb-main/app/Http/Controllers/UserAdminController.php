<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Departamento;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class UserAdminController extends Controller
{
    public function index()
    {
        return Inertia::render('Admin/Usuarios', [
            'usuarios' => User::with('departamento:id,nombre')
                ->select('id', 'name', 'apellido', 'email', 'rol', 'activo', 'departamento_id')
                ->orderBy('name')
                ->get(),

            'departamentos' => Departamento::select('id', 'nombre')
                ->where('estado', 1)
                ->orderBy('nombre')
                ->get(),
        ]);
    }

    /**
     * Crear usuario (admin elige contraseña)
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'apellido' => ['nullable', 'string', 'max:255'],
            'email' => [
                'required',
                'email',
                'max:255',
                'unique:users,email',
                'regex:/@(tu|mangoapp)\.com\.py$/i'
            ],
            'rol' => ['required', Rule::in(['Administrador', 'Gerente', 'Usuario'])],
            'departamento_id' => ['nullable', 'exists:departamentos,id'],
            'password' => ['required', Password::defaults()],
        ]);

        $hash = Hash::make($data['password']);

        $user = User::create([
            'name' => $data['name'],
            'apellido' => $data['apellido'] ?? null,
            'email' => $data['email'],
            'rol' => $data['rol'],
            'departamento_id' => $data['departamento_id'] ?? null,
            'activo' => 1,
            'password' => $hash,
            // El usuario debe elegir su propia contraseña en el primer ingreso.
            'debe_cambiar_password' => true,
        ]);

        $user->registrarHistorialPassword($hash);

        return back()->with('success', 'Usuario creado correctamente');
    }

    public function updateRole(Request $request, $id)
    {
        $data = $request->validate([
            'rol' => ['required', Rule::in(['Administrador', 'Gerente', 'Usuario'])],
        ]);

        User::where('id', $id)->update([
            'rol' => $data['rol'],
        ]);

        return back()->with('success', 'Rol actualizado');
    }

    public function updateDepartamento(Request $request, $id)
    {
        $data = $request->validate([
            'departamento_id' => ['nullable', 'exists:departamentos,id'],
        ]);

        User::where('id', $id)->update([
            'departamento_id' => $data['departamento_id'],
        ]);

        return back()->with('success', 'Departamento actualizado');
    }

    public function toggleStatus($id)
    {
        $user = User::findOrFail($id);
        $user->activo = ! $user->activo;
        $user->save();

        return back()->with('success', 'Estado actualizado');
    }

    /**
     * 🔑 Resetear contraseña (admin define la contraseña)
     */
    public function resetPassword(Request $request, User $user)
    {
        $data = $request->validate([
            'password' => ['required', Password::defaults()],
        ]);

        $hash = Hash::make($data['password']);

        $user->update([
            'password' => $hash,
            // Al resetear, el usuario debe volver a elegir su propia contraseña.
            'debe_cambiar_password' => true,
            'password_changed_at' => now(),
            'failed_login_attempts' => 0,
            'locked_until' => null,
        ]);

        $user->registrarHistorialPassword($hash);

        return back()->with('success', 'Contraseña actualizada correctamente');
    }
}