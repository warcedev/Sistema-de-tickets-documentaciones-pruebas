<?php

namespace Database\Seeders;

use App\Models\Departamento;
use App\Models\Proyecto;
use App\Models\Ticket;
use App\Models\TicketEstado;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * Crea 128 tickets de demostración, variados en tipo/prioridad/severidad,
 * proyecto, departamento, persona asignada y etapa (abiertos, en distintas
 * etapas de testing, cerrados/en producción), con fechas de creación/cierre
 * escalonadas para que el tiempo de resolución y el cumplimiento de SLA del
 * dashboard de "Reportes" tengan valores reales (no todo en 0hs).
 *
 * También crea un puñado de usuarios de demo (prefijo de email "demo.") para
 * que aparezcan asignados a tickets y se vean en el gráfico "Por persona
 * asignada".
 *
 * No se registra en DatabaseSeeder: se corre a mano, una sola vez, con
 *   php artisan db:seed --class=DemoDashboardSeeder
 *
 * Todos los tickets quedan con el título prefijado "[DEMO]" para poder
 * identificarlos y borrarlos fácilmente después. Si ya existen tickets con
 * ese prefijo, no vuelve a crear nada (evita duplicar si se corre dos veces).
 */
class DemoDashboardSeeder extends Seeder
{
    public function run(): void
    {
        if (Ticket::where('titulo', 'like', '[DEMO]%')->exists()) {
            $this->command?->warn('Ya existen tickets de demo. No se crea nada nuevo (borralos primero si querés regenerarlos).');

            return;
        }

        $admin = User::where('rol', 'Administrador')->first() ?? User::firstOrFail();

        $proyectos = Proyecto::where('activo', 1)->get(['id', 'nombre']);
        foreach (['Sistema de Facturación', 'Portal de Clientes', 'App Interna'] as $nombre) {
            if ($proyectos->count() >= 4) {
                break;
            }
            if ($proyectos->firstWhere('nombre', $nombre)) {
                continue;
            }
            $proyectos->push(Proyecto::create([
                'nombre' => $nombre,
                'descripcion' => 'Proyecto de demostración',
                'activo' => 1,
            ]));
        }

        $departamentos = Departamento::where('estado', 1)->get(['id', 'nombre']);
        foreach (['Departamento de Ventas', 'Departamento de Soporte'] as $nombre) {
            if ($departamentos->count() >= 3) {
                break;
            }
            if ($departamentos->firstWhere('nombre', $nombre)) {
                continue;
            }
            $departamentos->push(Departamento::create([
                'nombre' => $nombre,
                'estado' => 1,
            ]));
        }

        // Usuarios de demo, para que "asignado" y "tester" varíen y se vea
        // el gráfico "Por persona asignada" en Reportes. El "cargo" es el
        // puesto real (se muestra junto al nombre); "rol" es el nivel de
        // permisos del sistema (Administrador/Gerente/Usuario) — los puestos
        // de jefatura/gerencia quedan como "Gerente" (gestor).
        $nombresDemo = [
            ['Lucía', 'Fernández', 'Desarrollador', 'Usuario'],
            ['Martín', 'Gómez', 'Desarrollador', 'Usuario'],
            ['Nicolás', 'Pérez', 'Jefe de Desarrollo', 'Gerente'],
            ['Sofía', 'Rodríguez', 'QA', 'Usuario'],
            ['Rocío', 'Álvarez', 'QA', 'Usuario'],
            ['Valentina', 'Torres', 'Supervisor QA', 'Gerente'],
            ['Federico', 'Sosa', 'Gerente de Core Bancario', 'Gerente'],
            ['Camila', 'Díaz', 'Infraestructura', 'Usuario'],
            ['Ignacio', 'Molina', 'Infraestructura', 'Usuario'],
            ['Tomás', 'Herrera', 'Help Desk', 'Usuario'],
        ];
        $usuarios = collect($nombresDemo)->map(function ($nombre, $i) use ($departamentos) {
            [$name, $apellido, $cargo, $rol] = $nombre;
            $email = 'demo.'.Str::slug($name.'.'.$apellido).'@docuweb.local';

            return User::firstOrCreate(
                ['email' => $email],
                [
                    'name' => $name,
                    'apellido' => $apellido,
                    'password' => Hash::make('Demo1234!'),
                    'rol' => $rol,
                    'cargo' => $cargo,
                    'activo' => 1,
                    'departamento_id' => $departamentos->isNotEmpty()
                        ? $departamentos[$i % $departamentos->count()]->id
                        : null,
                ]
            );
        });

        // Asegura que los estados de testing tengan las marcas que usa el
        // dashboard (por si todavía no se configuraron en Admin > Catálogos).
        TicketEstado::whereIn('nombre', ['En Prueba', 'Listo para Prueba', 'Pruebas Pausadas'])
            ->update(['es_prueba' => true]);
        TicketEstado::where('nombre', 'Prueba Finalizada')
            ->update(['es_prueba' => true, 'es_prueba_finalizada' => true]);

        $estado = fn (string $nombre) => TicketEstado::where('nombre', $nombre)->first();

        // Distribución de las 128 tickets por etapa. Cada bucket define
        // cuántos tickets crear en ese estado y con qué combinación de flags.
        $buckets = [
            ['estado' => 'Nuevo', 'cantidad' => 18],
            ['estado' => 'En Progreso', 'cantidad' => 18],
            ['estado' => 'Pendiente', 'cantidad' => 13],
            ['estado' => 'Resuelto', 'cantidad' => 13],
            ['estado' => 'Cerrado', 'cantidad' => 22, 'en_produccion' => true],
            ['estado' => 'Listo para Prueba', 'cantidad' => 9, 'requiere_qa' => true],
            ['estado' => 'Pruebas Pausadas', 'cantidad' => 7, 'requiere_qa' => true],
            ['estado' => 'En Prueba', 'cantidad' => 11, 'requiere_qa' => true, 'con_tester' => true],
            ['estado' => 'En Prueba', 'cantidad' => 7, 'requiere_qa' => true],
            ['estado' => 'Prueba Finalizada', 'cantidad' => 10, 'requiere_qa' => true, 'con_tester' => true, 'qa_aprobado' => true],
        ];

        $titulosBase = [
            'Validación de CUIT en alta de clientes', 'Performance del reporte de ventas',
            'Refactor del módulo de stock', 'Definición de reglas de descuentos',
            'Cálculo de IVA en nota de crédito', 'Listado de pedidos pendientes',
            'Exportación de reportes a Excel', 'Alta masiva de proveedores',
            'Notificaciones por email de vencimientos', 'Permisos por rol de usuario',
            'Flujo de recupero de contraseña', 'Bug en login con SSO',
            'Tiempos de carga del dashboard', 'Actualización de textos legales',
            'Integración con pasarela de pagos', 'Sincronización de inventario',
            'Alertas de stock mínimo', 'Reporte de comisiones por vendedor',
            'Carga masiva de artículos', 'Historial de auditoría de cambios',
            'Panel de indicadores para gerencia', 'Envío de facturas por email',
            'Conciliación bancaria automática', 'Módulo de devoluciones',
            'Búsqueda avanzada de clientes', 'Gestión de turnos de entrega',
            'Firma digital de documentos', 'Optimización de consultas SQL',
            'Migración de datos legacy', 'Control de acceso por sucursal',
        ];

        $numero = 0;
        foreach ($buckets as $bucket) {
            $estadoModel = $estado($bucket['estado']);
            if (! $estadoModel) {
                continue;
            }

            for ($i = 0; $i < $bucket['cantidad']; $i++) {
                $titulo = $titulosBase[$numero % count($titulosBase)];
                $proyecto = $proyectos[$numero % $proyectos->count()];
                $departamento = $departamentos->isNotEmpty()
                    ? $departamentos[$numero % $departamentos->count()]
                    : null;
                $asignado = $usuarios[$numero % $usuarios->count()];
                $prioridad = Ticket::PRIORIDADES[$numero % count(Ticket::PRIORIDADES)];

                // Fechas escalonadas: el ticket se creó hace un tiempo, y
                // (si aplica) se cerró/actualizó bastante después, para que
                // el tiempo de resolución y el SLA del dashboard no den 0hs.
                $creado = now()->subDays(random_int(2, 90))->subHours(random_int(0, 23));
                $esFinal = $estadoModel->es_final;
                $horasHastaActualizar = $esFinal
                    ? random_int(4, 360)   // 4hs a 15 días para resolver
                    : random_int(0, 96);   // actividad más reciente si sigue abierto
                $actualizado = $creado->copy()->addHours($horasHastaActualizar)->min(now());

                $slaHoras = Ticket::SLA_HORAS[$prioridad] ?? null;
                $slaVencimiento = $slaHoras ? $creado->copy()->addHours($slaHoras) : null;

                $fechaProduccion = null;
                if ($bucket['en_produccion'] ?? false) {
                    $fechaProduccion = $actualizado->copy()->subHours(random_int(0, min(48, $horasHastaActualizar)));
                }

                $ticket = Ticket::create([
                    'titulo' => '[DEMO] '.$titulo,
                    'descripcion' => '<p>Ticket de demostración generado para probar el dashboard.</p>',
                    'tipo' => Ticket::TIPOS[$numero % count(Ticket::TIPOS)],
                    'prioridad' => $prioridad,
                    'severidad' => Ticket::SEVERIDADES[$numero % count(Ticket::SEVERIDADES)],
                    'proyecto_id' => $proyecto->id,
                    'departamento_id' => $departamento?->id,
                    'estado_id' => $estadoModel->id,
                    'solicitante_id' => $admin->id,
                    'asignado_id' => $asignado->id,
                    'requiere_qa' => $bucket['requiere_qa'] ?? false,
                    'qa_asignado_id' => ($bucket['con_tester'] ?? false)
                        ? $usuarios[($numero + 1) % $usuarios->count()]->id
                        : null,
                    'qa_aprobado' => $bucket['qa_aprobado'] ?? false,
                    'fecha_a_produccion' => $fechaProduccion,
                ]);

                // Se pisan las fechas directo por query builder (sin pasar
                // por Eloquent) para que created_at/updated_at no vuelvan a
                // "ahora" solos, y sla_vencimiento quede acorde a created_at.
                DB::table('tickets')->where('id', $ticket->id)->update([
                    'created_at' => $creado,
                    'updated_at' => $actualizado,
                    'sla_vencimiento' => $slaVencimiento,
                ]);

                $numero++;
            }
        }

        $this->command?->info($numero.' tickets de demo creados, con '.$usuarios->count().' usuarios de demo.');
    }
}
