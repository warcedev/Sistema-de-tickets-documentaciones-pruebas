<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Campos para las normas de seguridad de cuentas al estilo Redmine:
     * bloqueo tras intentos fallidos, cambio de contraseña obligatorio
     * (primer ingreso / reseteo por admin) y vencimiento de contraseña.
     */
    public function up()
    {
        Schema::table('users', function (Blueprint $table) {
            $table->unsignedInteger('failed_login_attempts')->default(0)->after('activo');
            $table->timestamp('locked_until')->nullable()->after('failed_login_attempts');
            $table->boolean('debe_cambiar_password')->default(false)->after('locked_until');
            $table->timestamp('password_changed_at')->nullable()->after('debe_cambiar_password');
        });

        // Para no forzar el cambio de contraseña a todos los usuarios ya
        // existentes apenas se despliega esto, se toma su fecha de alta
        // como referencia inicial (igual que hace Redmine al habilitar la
        // expiración de contraseñas sobre cuentas ya creadas).
        DB::table('users')->whereNull('password_changed_at')->update([
            'password_changed_at' => DB::raw('created_at'),
        ]);
    }

    public function down()
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'failed_login_attempts',
                'locked_until',
                'debe_cambiar_password',
                'password_changed_at',
            ]);
        });
    }
};
