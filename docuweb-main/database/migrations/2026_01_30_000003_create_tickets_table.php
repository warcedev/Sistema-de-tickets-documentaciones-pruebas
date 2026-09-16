<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('tickets', function (Blueprint $table) {
            $table->id();
            $table->string('numero')->nullable()->unique();
            $table->string('titulo');
            $table->longText('descripcion')->nullable();

            $table->string('tipo'); // bug, requerimiento, mejora, incidente
            $table->string('prioridad')->default('Normal'); // Baja, Normal, Alta, Urgente
            $table->string('severidad')->default('Media'); // Baja, Media, Alta, Critica

            $table->foreignId('proyecto_id')->nullable()->constrained('proyectos')->nullOnDelete();
            $table->foreignId('estado_id')->constrained('ticket_estados');

            $table->foreignId('solicitante_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('asignado_id')->nullable()->constrained('users')->nullOnDelete();

            $table->foreignId('parent_id')->nullable()->constrained('tickets')->nullOnDelete();

            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('tickets');
    }
};
