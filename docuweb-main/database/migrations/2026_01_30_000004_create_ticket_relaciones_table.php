<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('ticket_relaciones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ticket_id')->constrained('tickets')->cascadeOnDelete();
            $table->foreignId('ticket_relacionado_id')->constrained('tickets')->cascadeOnDelete();
            $table->string('tipo')->default('relacionado'); // relacionado, duplicado
            $table->timestamps();

            $table->unique(['ticket_id', 'ticket_relacionado_id']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('ticket_relaciones');
    }
};
