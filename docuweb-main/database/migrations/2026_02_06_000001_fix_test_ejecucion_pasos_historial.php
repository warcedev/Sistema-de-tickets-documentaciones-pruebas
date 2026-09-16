<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Bug real: test_ejecucion_pasos.test_caso_paso_id tenía
     * cascadeOnDelete(). Como "Editar caso de prueba" borra y vuelve a
     * crear TODOS los test_caso_pasos en cada guardado (incluso sin
     * cambios reales), esa cascada borraba silenciosamente los pasos
     * de CUALQUIER ejecución histórica ya registrada para ese caso.
     *
     * Arreglo en dos partes:
     *  1) Guardar una copia ("snapshot") del texto del paso y del
     *     resultado esperado en el momento de la ejecución, para que el
     *     historial no dependa de que el paso original siga existiendo
     *     tal cual (ni siquiera de que exista).
     *  2) Cambiar la FK a "SET NULL" en vez de "CASCADE": si el paso
     *     original se borra igual, solo se pierde el vínculo "en vivo",
     *     nunca la fila con el resultado/observación/capturas/snapshot.
     *
     * SQLite no permite modificar una foreign key con ALTER TABLE, así
     * que reconstruimos la tabla a mano (patrón estándar en SQLite).
     */
    public function up()
    {
        if (!Schema::hasColumn('test_ejecucion_pasos', 'paso_texto')) {
            Schema::table('test_ejecucion_pasos', function (Blueprint $table) {
                $table->text('paso_texto')->nullable()->after('test_caso_paso_id');
                $table->text('resultado_esperado_texto')->nullable()->after('paso_texto');
            });

            // Completar el snapshot para lo que todavía se pueda salvar de
            // filas ya existentes (mientras el paso original siga vivo).
            DB::statement("
                UPDATE test_ejecucion_pasos
                SET paso_texto = (
                        SELECT paso FROM test_caso_pasos
                        WHERE test_caso_pasos.id = test_ejecucion_pasos.test_caso_paso_id
                    ),
                    resultado_esperado_texto = (
                        SELECT resultado_esperado FROM test_caso_pasos
                        WHERE test_caso_pasos.id = test_ejecucion_pasos.test_caso_paso_id
                    )
            ");
        }

        DB::statement('PRAGMA foreign_keys = OFF');

        DB::statement('
            CREATE TABLE test_ejecucion_pasos_new (
                id integer not null primary key autoincrement,
                test_ejecucion_id integer not null,
                test_caso_paso_id integer,
                paso_texto text,
                resultado_esperado_texto text,
                resultado varchar not null default "N/A",
                observacion text,
                created_at datetime,
                updated_at datetime,
                foreign key(test_ejecucion_id) references test_ejecuciones(id) on delete cascade,
                foreign key(test_caso_paso_id) references test_caso_pasos(id) on delete set null
            )
        ');

        DB::statement('
            INSERT INTO test_ejecucion_pasos_new
                (id, test_ejecucion_id, test_caso_paso_id, paso_texto, resultado_esperado_texto, resultado, observacion, created_at, updated_at)
            SELECT id, test_ejecucion_id, test_caso_paso_id, paso_texto, resultado_esperado_texto, resultado, observacion, created_at, updated_at
            FROM test_ejecucion_pasos
        ');

        DB::statement('DROP TABLE test_ejecucion_pasos');
        DB::statement('ALTER TABLE test_ejecucion_pasos_new RENAME TO test_ejecucion_pasos');

        DB::statement('PRAGMA foreign_keys = ON');
    }

    public function down()
    {
        DB::statement('PRAGMA foreign_keys = OFF');

        DB::statement('
            CREATE TABLE test_ejecucion_pasos_old (
                id integer not null primary key autoincrement,
                test_ejecucion_id integer not null,
                test_caso_paso_id integer not null,
                resultado varchar not null default "N/A",
                observacion text,
                created_at datetime,
                updated_at datetime,
                foreign key(test_ejecucion_id) references test_ejecuciones(id) on delete cascade,
                foreign key(test_caso_paso_id) references test_caso_pasos(id) on delete cascade
            )
        ');

        DB::statement('
            INSERT INTO test_ejecucion_pasos_old
                (id, test_ejecucion_id, test_caso_paso_id, resultado, observacion, created_at, updated_at)
            SELECT id, test_ejecucion_id, test_caso_paso_id, resultado, observacion, created_at, updated_at
            FROM test_ejecucion_pasos
            WHERE test_caso_paso_id IS NOT NULL
        ');

        DB::statement('DROP TABLE test_ejecucion_pasos');
        DB::statement('ALTER TABLE test_ejecucion_pasos_old RENAME TO test_ejecucion_pasos');

        DB::statement('PRAGMA foreign_keys = ON');
    }
};
