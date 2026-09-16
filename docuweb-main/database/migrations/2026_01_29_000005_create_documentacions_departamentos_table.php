<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('documentacions_departamentos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('documentacion_id')->constrained('documentacions')->cascadeOnDelete();
            $table->foreignId('departamento_id')->constrained('departamentos')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['documentacion_id', 'departamento_id']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('documentacions_departamentos');
    }
};
