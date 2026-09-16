<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('documentations', function (Blueprint $table) {
            $table->id();
            $table->string('title');  // Título de la documentación
            $table->text('description');  // Descripción de la documentación
            $table->string('cover_image')->nullable();  // Imagen de portada (opcional)
            $table->string('file_path')->nullable();  // Ruta del archivo (PDF, video, etc.)
            $table->string('department');  // Departamento al que pertenece la documentación
            $table->foreignId('user_id')->constrained()->onDelete('cascade');  // Relación con el usuario que subió la documentación
            $table->timestamps();  // Tiempos de creación y actualización
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('documentations');
    }
};
