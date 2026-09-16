<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;


return new class extends Migration {
public function up()
{
Schema::create('documentacion_adjuntos', function (Blueprint $table) {
$table->id();
$table->foreignId('documentacion_id')
->constrained('documentacions')
->cascadeOnDelete();
$table->foreignId('adjunto_id')
->constrained('adjuntos')
->cascadeOnDelete();
$table->timestamps();


$table->unique(['documentacion_id', 'adjunto_id']);
});
}


public function down()
{
Schema::dropIfExists('documentacion_adjuntos');
}
};
