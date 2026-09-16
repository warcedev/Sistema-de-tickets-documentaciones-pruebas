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
        Schema::table('tickets', function (Blueprint $table) {
            // Evidencia para la revisión de QA: captura del bloque de código
            // agregado y detalle de los archivos/objetos (normalmente GeneXus)
            // que se tocaron.
            $table->string('qa_captura_codigo')->nullable()->after('qa_checklist');
            $table->text('qa_archivos_modificados')->nullable()->after('qa_captura_codigo');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('tickets', function (Blueprint $table) {
            $table->dropColumn(['qa_captura_codigo', 'qa_archivos_modificados']);
        });
    }
};
