<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('test_suites', function (Blueprint $table) {
            $table->foreignId('parent_id')->nullable()->after('id')->constrained('test_suites')->nullOnDelete();
        });
    }

    public function down()
    {
        Schema::table('test_suites', function (Blueprint $table) {
            $table->dropConstrainedForeignId('parent_id');
        });
    }
};
