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
        Schema::table('users', function (Blueprint $table) {
        // Verificamos que no exista antes de crearla
        if (!Schema::hasColumn('users', 'rol')) {
            $table->string('rol')->default('usuario');
        }

        // ❌ Si aparece esto, eliminá o comentá la línea
        // $table->string('verification_code')->nullable();
        });
    }


    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('users', function (Blueprint $table) {
            //
        });
    }
};
