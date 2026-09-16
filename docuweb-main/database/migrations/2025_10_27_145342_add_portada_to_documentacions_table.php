<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('documentacions', function (Blueprint $table) {
            $table->string('portada')->nullable()->after('archivo');
        });
    }

    public function down()
    {
        Schema::table('documentacions', function (Blueprint $table) {
            $table->dropColumn('portada');
        });
    }
};