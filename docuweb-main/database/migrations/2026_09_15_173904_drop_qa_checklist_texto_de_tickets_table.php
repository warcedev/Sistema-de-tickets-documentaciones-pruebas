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
            // El checklist de pruebas ahora se sube como documento Excel
            // (ver ticket_qa_checklist_adjuntos), reemplaza al texto libre.
            $table->dropColumn('qa_checklist');
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
            $table->text('qa_checklist')->nullable()->after('qa_aprobado');
        });
    }
};
