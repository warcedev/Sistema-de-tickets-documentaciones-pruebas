<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('documentacions_tags', function (Blueprint $table) {
            $table->id();
            $table->foreignId('documentacion_id')->constrained('documentacions')->cascadeOnDelete();
            $table->foreignId('tag_id')->constrained('tags')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['documentacion_id', 'tag_id']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('documentacions_tags');
    }
};
