<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('ticket_adjuntos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ticket_id')->constrained('tickets')->cascadeOnDelete();
            $table->foreignId('adjunto_id')->constrained('adjuntos')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['ticket_id', 'adjunto_id']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('ticket_adjuntos');
    }
};
