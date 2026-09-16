<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('test_casos', function (Blueprint $table) {
            $table->foreignId('ticket_id')->nullable()->after('suite_id')->constrained('tickets')->nullOnDelete();
            $table->string('redmine_numero')->nullable()->after('ticket_id');
            $table->string('redmine_url')->nullable()->after('redmine_numero');
        });
    }

    public function down()
    {
        Schema::table('test_casos', function (Blueprint $table) {
            $table->dropConstrainedForeignId('ticket_id');
            $table->dropColumn(['redmine_numero', 'redmine_url']);
        });
    }
};
