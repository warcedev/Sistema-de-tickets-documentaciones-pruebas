<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     *
     * Crea el usuario administrador inicial si todavía no existe, para
     * que el sistema quede utilizable apenas se levanta (sin pasos
     * manuales adicionales). Es seguro correr esto varias veces: no
     * duplica ni pisa la cuenta si ya existe.
     */
    public function run()
    {
        User::firstOrCreate(
            ['email' => 'admin@docuweb.local'],
            [
                'name' => 'Admin',
                'apellido' => 'DOCWeb',
                'password' => Hash::make('Admin123!'),
                'rol' => 'Administrador',
                'activo' => 1,
            ]
        );
    }
}
