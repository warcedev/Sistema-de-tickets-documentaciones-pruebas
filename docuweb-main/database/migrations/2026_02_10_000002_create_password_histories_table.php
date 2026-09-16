<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Historial de contraseñas anteriores, para impedir que un usuario
     * reutilice una contraseña reciente (norma de seguridad de Redmine).
     */
    public function up()
    {
        Schema::create('password_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('password_hash');
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('password_histories');
    }
};
