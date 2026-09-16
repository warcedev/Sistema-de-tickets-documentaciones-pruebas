<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up()
    {
        Schema::create('ticket_estados', function (Blueprint $table) {
            $table->id();
            $table->string('nombre');
            $table->unsignedInteger('orden')->default(0);
            $table->boolean('es_inicial')->default(false);
            $table->boolean('es_final')->default(false);
            $table->string('color')->default('#6B7280');
            $table->boolean('activo')->default(true);
            $table->timestamps();
        });

        $now = now();

        DB::table('ticket_estados')->insert([
            ['nombre' => 'Nuevo', 'orden' => 1, 'es_inicial' => true, 'es_final' => false, 'color' => '#3FA9D1', 'activo' => true, 'created_at' => $now, 'updated_at' => $now],
            ['nombre' => 'En Progreso', 'orden' => 2, 'es_inicial' => false, 'es_final' => false, 'color' => '#1F5C8C', 'activo' => true, 'created_at' => $now, 'updated_at' => $now],
            ['nombre' => 'Pendiente', 'orden' => 3, 'es_inicial' => false, 'es_final' => false, 'color' => '#C97A0E', 'activo' => true, 'created_at' => $now, 'updated_at' => $now],
            ['nombre' => 'Resuelto', 'orden' => 4, 'es_inicial' => false, 'es_final' => false, 'color' => '#7FA82E', 'activo' => true, 'created_at' => $now, 'updated_at' => $now],
            ['nombre' => 'Cerrado', 'orden' => 5, 'es_inicial' => false, 'es_final' => true, 'color' => '#4B5563', 'activo' => true, 'created_at' => $now, 'updated_at' => $now],
        ]);
    }

    public function down()
    {
        Schema::dropIfExists('ticket_estados');
    }
};
