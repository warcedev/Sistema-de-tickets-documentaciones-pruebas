<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('tickets', function (Blueprint $table) {
            // Fechas de planificación / seguimiento
            $table->date('fecha_inicio')->nullable();
            $table->date('fecha_fin')->nullable();
            $table->date('fecha_estimada_entrega')->nullable();
            $table->date('fecha_asignacion')->nullable();
            $table->date('fecha_entrega')->nullable();
            $table->date('fecha_conformidad')->nullable();

            // Relevamiento / desarrollo
            $table->date('fecha_inicio_relevamiento')->nullable();
            $table->date('fecha_fin_relevamiento')->nullable();
            $table->date('fecha_aprobacion_relevamiento')->nullable();
            $table->date('fecha_inicio_desarrollo')->nullable();
            $table->date('fecha_inicio_reanudacion')->nullable();
            $table->date('fecha_fin_reanudacion')->nullable();

            // Desvíos
            $table->integer('desvios_dias')->nullable();
            $table->string('motivo_desvio')->nullable();

            // Producción / pase
            $table->date('fecha_a_produccion')->nullable();
            $table->date('fecha_autorizacion_pasaje')->nullable();
            $table->boolean('errores_produccion')->nullable();
            $table->boolean('inconvenientes_pasaje')->nullable();
            $table->boolean('incidencias_produccion')->nullable();
            $table->integer('cant_vuelta_atras')->nullable();

            // QA (fechas específicas; habilitado/asignado ya existen como requiere_qa / qa_asignado_id)
            $table->date('fecha_estimada_entrega_qa')->nullable();
            $table->date('fecha_entrega_qa')->nullable();
            $table->string('hora_estimada_qa')->nullable();

            // Seguridad
            $table->foreignId('oficial_seguridad_id')->nullable()->constrained('users')->nullOnDelete();

            // Seguimiento / progreso
            $table->unsignedTinyInteger('porcentaje_realizado')->nullable();
            $table->string('tiempo_estimado')->nullable();
            $table->integer('cant_objetos_modif')->nullable();
            $table->integer('prioridad_ti')->nullable();
            $table->string('referencia_asignacion_ti')->nullable();
            $table->boolean('documentacion_incompleta')->nullable();
            $table->string('area')->nullable();
            $table->boolean('es_evento_ro')->nullable();
        });
    }

    public function down()
    {
        Schema::table('tickets', function (Blueprint $table) {
            $table->dropConstrainedForeignId('oficial_seguridad_id');
            $table->dropColumn([
                'fecha_inicio', 'fecha_fin', 'fecha_estimada_entrega', 'fecha_asignacion',
                'fecha_entrega', 'fecha_conformidad', 'fecha_inicio_relevamiento',
                'fecha_fin_relevamiento', 'fecha_aprobacion_relevamiento', 'fecha_inicio_desarrollo',
                'fecha_inicio_reanudacion', 'fecha_fin_reanudacion', 'desvios_dias', 'motivo_desvio',
                'fecha_a_produccion', 'fecha_autorizacion_pasaje', 'errores_produccion',
                'inconvenientes_pasaje', 'incidencias_produccion', 'cant_vuelta_atras',
                'fecha_estimada_entrega_qa', 'fecha_entrega_qa', 'hora_estimada_qa',
                'porcentaje_realizado', 'tiempo_estimado', 'cant_objetos_modif', 'prioridad_ti',
                'referencia_asignacion_ti', 'documentacion_incompleta', 'area', 'es_evento_ro',
            ]);
        });
    }
};
