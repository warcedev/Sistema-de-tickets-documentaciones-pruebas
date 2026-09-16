<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('test_ejecuciones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('test_caso_id')->constrained('test_casos')->cascadeOnDelete();
            $table->foreignId('ejecutado_por')->nullable()->constrained('users')->nullOnDelete();
            $table->string('estado'); // Exitoso, Fallido, Bloqueado
            $table->string('ambiente')->nullable();
            $table->text('observaciones')->nullable();
            $table->timestamp('ejecutado_en')->nullable();
            $table->timestamps();
        });

        Schema::create('test_ejecucion_pasos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('test_ejecucion_id')->constrained('test_ejecuciones')->cascadeOnDelete();
            $table->foreignId('test_caso_paso_id')->constrained('test_caso_pasos')->cascadeOnDelete();
            $table->string('resultado')->default('N/A'); // Pasa, Falla, N/A
            $table->text('observacion')->nullable();
            $table->timestamps();
        });

        Schema::create('test_ejecucion_paso_adjuntos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('test_ejecucion_paso_id')->constrained('test_ejecucion_pasos')->cascadeOnDelete();
            $table->foreignId('adjunto_id')->constrained('adjuntos')->cascadeOnDelete();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('test_ejecucion_paso_adjuntos');
        Schema::dropIfExists('test_ejecucion_pasos');
        Schema::dropIfExists('test_ejecuciones');
    }
};
