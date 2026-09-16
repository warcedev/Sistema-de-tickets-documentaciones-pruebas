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
        Schema::table('ticket_estados', function (Blueprint $table) {
            // Sub-marca dentro de "es_prueba": indica que este estado es el de
            // "testing terminado, a la espera del siguiente paso" (ej. "Prueba
            // Finalizada"), a diferencia de los estados de prueba en curso
            // (ej. "En Prueba", "Listo para Prueba", "Pruebas Pausadas").
            $table->boolean('es_prueba_finalizada')->default(false)->after('es_prueba');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('ticket_estados', function (Blueprint $table) {
            $table->dropColumn('es_prueba_finalizada');
        });
    }
};
