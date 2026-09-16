<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('tickets', function (Blueprint $table) {
            // SLA
            $table->timestamp('sla_vencimiento')->nullable()->after('parent_id');
            $table->text('sla_motivo_desvio')->nullable()->after('sla_vencimiento');

            // QA Gate
            $table->boolean('requiere_qa')->default(false)->after('sla_motivo_desvio');
            $table->foreignId('qa_asignado_id')->nullable()->after('requiere_qa')->constrained('users')->nullOnDelete();
            $table->boolean('qa_aprobado')->default(false)->after('qa_asignado_id');
            $table->text('qa_checklist')->nullable()->after('qa_aprobado');
        });
    }

    public function down()
    {
        Schema::table('tickets', function (Blueprint $table) {
            $table->dropConstrainedForeignId('qa_asignado_id');
            $table->dropColumn([
                'sla_vencimiento',
                'sla_motivo_desvio',
                'requiere_qa',
                'qa_aprobado',
                'qa_checklist',
            ]);
        });
    }
};
