<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('test_casos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('suite_id')->constrained('test_suites')->cascadeOnDelete();
            $table->string('titulo');
            $table->text('descripcion')->nullable(); // por qué / justificación del caso
            $table->text('preparacion_entorno')->nullable();
            $table->string('prioridad')->default('Normal'); // Baja, Normal, Alta, Critica
            $table->foreignId('creado_por')->nullable()->constrained('users')->nullOnDelete();
            $table->boolean('activo')->default(true);
            $table->timestamps();
        });

        Schema::create('test_caso_pasos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('test_caso_id')->constrained('test_casos')->cascadeOnDelete();
            $table->unsignedInteger('orden')->default(1);
            $table->text('paso');
            $table->text('resultado_esperado')->nullable();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('test_caso_pasos');
        Schema::dropIfExists('test_casos');
    }
};
