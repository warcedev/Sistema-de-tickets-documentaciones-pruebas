<?php

namespace Database\Seeders;

use App\Models\Departamento;
use App\Models\Documentacion;
use App\Models\Tag;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Crea 100 documentos de demostración (con portada generada, tags y
 * departamentos variados) para que la sección de Documentación se vea viva
 * en capturas de pantalla / presentaciones.
 *
 * No se registra en DatabaseSeeder: se corre a mano, una sola vez, con
 *   php artisan db:seed --class=DemoDocumentacionSeeder
 *
 * Todos los documentos quedan con el título prefijado "[DEMO]" para poder
 * identificarlos y borrarlos fácilmente después. Si ya existen documentos
 * con ese prefijo, no vuelve a crear nada (evita duplicar).
 */
class DemoDocumentacionSeeder extends Seeder
{
    /** Paleta de marca de la app (colores "oscurecidos", legibles con texto blanco). */
    private const COLORES = [
        '#0B2A47', '#1F5C8C', '#3FA9D1', '#C97A0E', '#A6620A', '#2AA39C', '#7FA82E',
    ];

    public function run(): void
    {
        if (Documentacion::where('titulo', 'like', '[DEMO]%')->exists()) {
            $this->command?->warn('Ya existen documentos de demo. No se crea nada nuevo (borralos primero si querés regenerarlos).');

            return;
        }

        $autores = User::inRandomOrder()->limit(6)->get();
        if ($autores->isEmpty()) {
            $autores = collect([User::firstOrFail()]);
        }

        $departamentos = Departamento::where('estado', 1)->get(['id', 'nombre']);
        foreach (['Departamento de RRHH', 'Departamento de Finanzas', 'Departamento Legal', 'Departamento Comercial'] as $nombre) {
            if ($departamentos->firstWhere('nombre', $nombre)) {
                continue;
            }
            $departamentos->push(Departamento::create(['nombre' => $nombre, 'estado' => 1]));
        }

        $tagsNombres = [
            'Manual', 'Procedimiento', 'Política', 'FAQ', 'Guía rápida', 'Normativa',
            'Onboarding', 'Seguridad', 'Backend', 'Frontend', 'Infraestructura',
            'GeneXus', 'Redmine', 'Producción', 'RRHH', 'Finanzas',
        ];
        $tags = Tag::where('estado', 1)->get(['id', 'descripcion']);
        foreach ($tagsNombres as $nombre) {
            if ($tags->firstWhere('descripcion', $nombre)) {
                continue;
            }
            $tags->push(Tag::create(['descripcion' => $nombre, 'estado' => 1]));
        }

        $categorias = ['Manual de uso', 'Procedimiento', 'Política', 'FAQ', 'Guía rápida'];
        $temas = [
            'Sistema de Facturación', 'Alta de Clientes', 'Gestión de Stock',
            'Onboarding de Empleados', 'Seguridad de la Información', 'Uso de VPN',
            'Backup y Recuperación', 'Atención al Cliente', 'Reembolsos y Devoluciones',
            'Vacaciones y Licencias', 'Uso de Equipos Corporativos', 'Correo Electrónico Corporativo',
            'Integración con GeneXus', 'Despliegue a Producción', 'Gestión de Accesos',
            'Auditoría Interna', 'Reporting Gerencial', 'Conciliación Bancaria',
            'Gestión de Proveedores', 'Facturación Electrónica', 'Home Office',
            'Código de Conducta', 'Prevención de Fraude', 'Continuidad del Negocio',
            'Gestión de Incidentes', 'Mesa de Ayuda (Help Desk)', 'Capacitación Interna',
            'Comunicación Interna', 'Redes y Conectividad', 'Bases de Datos',
        ];

        $total = 100;
        $creados = 0;

        for ($i = 0; $i < $total; $i++) {
            $categoria = $categorias[$i % count($categorias)];
            $tema = $temas[$i % count($temas)];
            $titulo = "{$categoria} — {$tema}";
            $color = self::COLORES[$i % count(self::COLORES)];

            $portadaPath = $this->generarPortada($titulo, $color);

            $creadoEn = now()->subDays(random_int(1, 120))->subHours(random_int(0, 23));

            $doc = Documentacion::create([
                'titulo' => '[DEMO] '.$titulo,
                'contenido' => $this->contenidoDemo($categoria, $tema),
                'portada' => $portadaPath,
                'user_id' => $autores[$i % $autores->count()]->id,
            ]);

            DB::table('documentacions')->where('id', $doc->id)->update([
                'created_at' => $creadoEn,
                'updated_at' => $creadoEn,
            ]);

            // 1 a 3 tags, y 0 a 2 departamentos (0 = visible para todos).
            $tagsElegidos = $tags->random(min($tags->count(), random_int(1, 3)))->pluck('id');
            $doc->tags()->sync($tagsElegidos);

            $cantDeptos = random_int(0, 2);
            if ($cantDeptos > 0 && $departamentos->isNotEmpty()) {
                $deptosElegidos = $departamentos->random(min($departamentos->count(), $cantDeptos))->pluck('id');
                $doc->departamentos()->sync($deptosElegidos);
            }

            $creados++;
        }

        $this->command?->info("{$creados} documentos de demo creados, con ".$tags->count().' tags y '.$departamentos->count().' departamentos disponibles.');
    }

    private function contenidoDemo(string $categoria, string $tema): string
    {
        return "<h2>{$categoria}: {$tema}</h2>"
            .'<p>Este es un documento de demostración generado automáticamente para mostrar cómo se ve la sección de Documentación con contenido real cargado.</p>'
            .'<p>Incluye un título representativo, contenido de ejemplo, una portada generada, tags y departamento asociados — igual que un documento cargado a mano por un usuario.</p>'
            .'<ul><li>Objetivo del documento</li><li>Alcance y a quién aplica</li><li>Pasos o lineamientos principales</li><li>Referencias relacionadas</li></ul>';
    }

    /**
     * Genera una imagen de portada simple (rectángulo de color + título
     * centrado) usando GD, para que el listado de documentación se vea con
     * miniaturas reales en vez de espacios vacíos.
     */
    private function generarPortada(string $texto, string $colorHex): string
    {
        $ancho = 640;
        $alto = 360;

        $im = imagecreatetruecolor($ancho, $alto);
        [$r, $g, $b] = sscanf($colorHex, '#%02x%02x%02x');
        $fondo = imagecolorallocate($im, $r, $g, $b);
        imagefilledrectangle($im, 0, 0, $ancho, $alto, $fondo);

        $blanco = imagecolorallocate($im, 255, 255, 255);
        $fuente = 5;
        $lineas = explode("\n", wordwrap($texto, 28, "\n"));
        $lineHeight = imagefontheight($fuente) + 8;
        $altoTotal = count($lineas) * $lineHeight;
        $y = intdiv($alto - $altoTotal, 2);

        foreach ($lineas as $linea) {
            $anchoTexto = imagefontwidth($fuente) * strlen($linea);
            $x = intdiv($ancho - $anchoTexto, 2);
            imagestring($im, $fuente, max(0, $x), $y, $linea, $blanco);
            $y += $lineHeight;
        }

        $path = 'portadas/demo-'.Str::random(12).'.png';

        ob_start();
        imagepng($im);
        $data = ob_get_clean();
        imagedestroy($im);

        Storage::disk('public')->put($path, $data);

        return $path;
    }
}
