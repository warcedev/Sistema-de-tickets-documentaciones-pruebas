<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        if (Schema::hasTable('documentacion_adjuntos') && !Schema::hasTable('documentacions_adjuntos')) {
            Schema::rename('documentacion_adjuntos', 'documentacions_adjuntos');
        }
    }

    public function down()
    {
        if (Schema::hasTable('documentacions_adjuntos') && !Schema::hasTable('documentacion_adjuntos')) {
            Schema::rename('documentacions_adjuntos', 'documentacion_adjuntos');
        }
    }
};
