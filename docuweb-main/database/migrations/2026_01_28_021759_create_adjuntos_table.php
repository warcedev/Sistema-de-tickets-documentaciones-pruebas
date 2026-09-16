<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::create('adjuntos', function (Blueprint $table) {
            $table->id();
            $table->string('nombre_original');
            $table->string('path');               
            $table->string('mime', 100);
            $table->unsignedBigInteger('size');   
            $table->boolean('activo')->default(1);
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('adjuntos');
    }
};