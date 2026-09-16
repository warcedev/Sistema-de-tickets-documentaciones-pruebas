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
            // Marca los estados que forman parte del flujo de testing/QA,
            // para poder agruparlos en el dashboard sin depender del nombre.
            $table->boolean('es_prueba')->default(false)->after('es_final');
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
            $table->dropColumn('es_prueba');
        });
    }
};
