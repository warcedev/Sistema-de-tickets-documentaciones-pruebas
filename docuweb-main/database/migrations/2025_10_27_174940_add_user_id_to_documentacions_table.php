<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('documentacions', function (Blueprint $table) {
            // 👇 Solo agregar la foreign key si NO existe todavía
            if (!Schema::hasColumn('documentacions', 'user_id')) {
                $table->foreignId('user_id')->nullable()->constrained()->onDelete('cascade');
            } else {
                // Si ya existe, solo asegurar la relación foránea
                $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            }
        });
    }

    public function down()
    {
        Schema::table('documentacions', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
        });
    }
};
