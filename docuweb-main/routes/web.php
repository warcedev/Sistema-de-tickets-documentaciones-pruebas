<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\VerificationController;
use App\Http\Controllers\UserAdminController;
use App\Http\Controllers\DocumentacionPageController;
use App\Http\Controllers\DocumentacionController;
use App\Http\Controllers\AdminCatalogosController;
use App\Http\Controllers\TicketController;
use App\Http\Controllers\TicketImportController;
use App\Http\Controllers\NotificacionController;
use App\Http\Controllers\TestSuiteController;
use App\Http\Controllers\TestCasoController;
use App\Http\Controllers\TestEjecucionController;
use App\Http\Controllers\TestVisualizarController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| AUTH
|--------------------------------------------------------------------------
*/

Route::get('/', [AuthenticatedSessionController::class, 'create'])
    ->middleware('guest')
    ->name('login');

// El auto-registro público está deshabilitado: las cuentas las crea un
// administrador desde Gestión de usuarios (norma de seguridad interna).

/*
|--------------------------------------------------------------------------
| RUTAS PROTEGIDAS
|--------------------------------------------------------------------------
*/
Route::middleware(['auth', 'verified', 'auth.session', 'password.fresh'])->group(function () {

    /*
    |--------------------------------------------------------------------------
    | DOCUMENTACIÓN (PÁGINAS)
    |--------------------------------------------------------------------------
    */

    Route::get('/principal', [DocumentacionPageController::class, 'index'])
        ->name('principal');

    Route::get('/documentacion/create', [DocumentacionPageController::class, 'create'])
        ->name('documentacion.create');

    Route::get('/documentacion/{id}', [DocumentacionPageController::class, 'show'])
        ->whereNumber('id')
        ->name('documentacion.show');

    Route::get('/documentacion/{id}/edit', [DocumentacionPageController::class, 'edit'])
        ->whereNumber('id')
        ->name('documentacion.edit');

    /*
    |--------------------------------------------------------------------------
    | DOCUMENTACIÓN (ACCIONES)
    |--------------------------------------------------------------------------
    */

    Route::post('/documentacion', [DocumentacionController::class, 'store'])
        ->name('documentacion.store');

    Route::put('/documentacion/{id}', [DocumentacionController::class, 'update'])
        ->whereNumber('id')
        ->name('documentacion.update');

    Route::delete('/documentacion/{id}', [DocumentacionController::class, 'destroy'])
        ->whereNumber('id')
        ->name('documentacion.destroy');

    Route::post('/documentacion/{id}/adjuntos', [DocumentacionController::class, 'uploadAdjuntos'])
        ->whereNumber('id')
        ->name('documentacion.adjuntos.upload');

    Route::get('/documentacion/adjuntos/{adjunto}', [DocumentacionController::class, 'downloadAdjunto'])
        ->name('documentacion.adjuntos.download');

    Route::get('/documentacion/adjuntos/{adjunto}/ver', [DocumentacionController::class, 'verAdjunto'])
        ->name('documentacion.adjuntos.ver');

    Route::delete('/documentacion/adjuntos/{adjunto}', [DocumentacionController::class, 'destroyAdjunto'])
        ->name('documentacion.adjuntos.destroy');

    /*
    |--------------------------------------------------------------------------
    | TICKETS
    |--------------------------------------------------------------------------
    */

    Route::get('/tickets', [TicketController::class, 'index'])
        ->name('tickets.index');

    Route::get('/tickets/historico', [TicketController::class, 'historico'])
        ->name('tickets.historico');

    Route::get('/tickets/reportes', [TicketController::class, 'reportes'])
        ->name('tickets.reportes');

    Route::get('/tickets/reportes/export', [TicketController::class, 'exportCsv'])
        ->name('tickets.reportes.export');

    Route::get('/tickets/create', [TicketController::class, 'create'])
        ->name('tickets.create');

    Route::post('/tickets', [TicketController::class, 'store'])
        ->name('tickets.store');

    Route::get('/tickets/importar', [TicketImportController::class, 'form'])
        ->name('tickets.importar.form');

    Route::post('/tickets/importar/previsualizar', [TicketImportController::class, 'previsualizar'])
        ->name('tickets.importar.previsualizar');

    Route::post('/tickets/importar/confirmar', [TicketImportController::class, 'confirmar'])
        ->name('tickets.importar.confirmar');

    Route::get('/tickets/{id}', [TicketController::class, 'show'])
        ->whereNumber('id')
        ->name('tickets.show');

    Route::get('/tickets/{id}/edit', [TicketController::class, 'edit'])
        ->whereNumber('id')
        ->name('tickets.edit');

    Route::put('/tickets/{id}', [TicketController::class, 'update'])
        ->whereNumber('id')
        ->name('tickets.update');

    Route::patch('/tickets/{id}/estado', [TicketController::class, 'updateEstado'])
        ->whereNumber('id')
        ->name('tickets.estado');

    Route::patch('/tickets/{id}/qa-aprobar', [TicketController::class, 'aprobarQa'])
        ->whereNumber('id')
        ->name('tickets.qa.aprobar');

    Route::patch('/tickets/{id}/watch', [TicketController::class, 'toggleWatch'])
        ->whereNumber('id')
        ->name('tickets.watch');

    Route::delete('/tickets/{id}', [TicketController::class, 'destroy'])
        ->whereNumber('id')
        ->name('tickets.destroy');

    Route::post('/tickets/{id}/comentarios', [TicketController::class, 'storeComentario'])
        ->whereNumber('id')
        ->name('tickets.comentarios.store');

    Route::post('/tickets/{id}/adjuntos', [TicketController::class, 'uploadAdjuntos'])
        ->whereNumber('id')
        ->name('tickets.adjuntos.upload');

    Route::get('/tickets/{ticketId}/adjuntos/{adjunto}', [TicketController::class, 'downloadAdjunto'])
        ->whereNumber('ticketId')
        ->name('tickets.adjuntos.download');

    Route::get('/tickets/{ticketId}/adjuntos/{adjunto}/ver', [TicketController::class, 'verAdjunto'])
        ->whereNumber('ticketId')
        ->name('tickets.adjuntos.ver');

    Route::delete('/tickets/{ticketId}/adjuntos/{adjunto}', [TicketController::class, 'destroyAdjunto'])
        ->whereNumber('ticketId')
        ->name('tickets.adjuntos.destroy');

    Route::post('/tickets/{id}/qa-checklist', [TicketController::class, 'uploadQaChecklist'])
        ->whereNumber('id')
        ->name('tickets.qa-checklist.upload');

    /*
    |--------------------------------------------------------------------------
    | CASOS DE PRUEBA: PREPARAR
    |--------------------------------------------------------------------------
    */

    Route::get('/casos-prueba/preparar', [TestSuiteController::class, 'index'])
        ->name('test-suites.index');

    Route::post('/casos-prueba/suites', [TestSuiteController::class, 'store'])
        ->name('test-suites.store');

    Route::put('/casos-prueba/suites/{suite}', [TestSuiteController::class, 'update'])
        ->name('test-suites.update');

    Route::delete('/casos-prueba/suites/{suite}', [TestSuiteController::class, 'destroy'])
        ->name('test-suites.destroy');

    Route::get('/casos-prueba/suites/{suite}/casos/crear', [TestCasoController::class, 'create'])
        ->name('test-casos.create');

    Route::post('/casos-prueba/suites/{suite}/casos', [TestCasoController::class, 'store'])
        ->name('test-casos.store');

    Route::get('/casos-prueba/casos/{caso}/editar', [TestCasoController::class, 'edit'])
        ->name('test-casos.edit');

    Route::put('/casos-prueba/casos/{caso}', [TestCasoController::class, 'update'])
        ->name('test-casos.update');

    Route::delete('/casos-prueba/casos/{caso}', [TestCasoController::class, 'destroy'])
        ->name('test-casos.destroy');

    Route::patch('/casos-prueba/casos/{caso}/mover', [TestCasoController::class, 'move'])
        ->name('test-casos.move');

    Route::post('/casos-prueba/casos/{caso}/copiar', [TestCasoController::class, 'copy'])
        ->name('test-casos.copy');

    /*
    |--------------------------------------------------------------------------
    | CASOS DE PRUEBA: EJECUTAR
    |--------------------------------------------------------------------------
    */

    Route::get('/casos-prueba/ejecutar', [TestEjecucionController::class, 'index'])
        ->name('test-ejecuciones.index');

    Route::get('/casos-prueba/ejecutar/casos/{caso}', [TestEjecucionController::class, 'show'])
        ->name('test-ejecuciones.show');

    Route::post('/casos-prueba/ejecutar/casos/{caso}/ejecuciones', [TestEjecucionController::class, 'store'])
        ->name('test-ejecuciones.store');

    Route::delete('/casos-prueba/ejecuciones/{ejecucion}', [TestEjecucionController::class, 'destroy'])
        ->name('test-ejecuciones.destroy');

    Route::get('/casos-prueba/adjuntos/{adjunto}/ver', [TestEjecucionController::class, 'verAdjunto'])
        ->name('test-ejecuciones.adjuntos.ver');

    Route::get('/casos-prueba/adjuntos/{adjunto}', [TestEjecucionController::class, 'downloadAdjunto'])
        ->name('test-ejecuciones.adjuntos.download');

    /*
    |--------------------------------------------------------------------------
    | CASOS DE PRUEBA: VISUALIZAR
    |--------------------------------------------------------------------------
    */

    Route::get('/casos-prueba/visualizar', [TestVisualizarController::class, 'index'])
        ->name('test-visualizar.index');

    Route::get('/casos-prueba/visualizar/casos/{caso}', [TestVisualizarController::class, 'show'])
        ->name('test-visualizar.show');

    Route::get('/casos-prueba/visualizar/ejecuciones/{ejecucion}/pdf', [TestVisualizarController::class, 'pdf'])
        ->name('test-visualizar.pdf');

    Route::get('/casos-prueba/visualizar/casos/{caso}/pdf', [TestVisualizarController::class, 'pdfCaso'])
        ->name('test-visualizar.pdf-caso');

    Route::get('/casos-prueba/visualizar/suites/{suite}/pdf', [TestVisualizarController::class, 'pdfSuite'])
        ->name('test-visualizar.pdf-suite');

    /*
    |--------------------------------------------------------------------------
    | NOTIFICACIONES
    |--------------------------------------------------------------------------
    */

    Route::get('/notificaciones', [NotificacionController::class, 'index'])
        ->name('notificaciones.index');

    Route::post('/notificaciones/{id}/leer', [NotificacionController::class, 'markRead'])
        ->name('notificaciones.leer');

    Route::post('/notificaciones/leer-todas', [NotificacionController::class, 'markAllRead'])
        ->name('notificaciones.leer-todas');

    /*
    |--------------------------------------------------------------------------
    | PERFIL
    |--------------------------------------------------------------------------
    */

    Route::get('/profile', [ProfileController::class, 'edit'])
        ->name('profile.edit');

    Route::patch('/profile', [ProfileController::class, 'update'])
        ->name('profile.update');

    Route::delete('/profile', [ProfileController::class, 'destroy'])
        ->name('profile.destroy');
});

/*
|--------------------------------------------------------------------------
| ADMINISTRACIÓN DE USUARIOS
|--------------------------------------------------------------------------
*/
Route::middleware(['auth', 'verified', 'auth.session', 'password.fresh', 'admin'])->group(function () {

    Route::get('/admin/usuarios', [UserAdminController::class, 'index'])
        ->name('admin.usuarios');

    Route::post('/admin/usuarios', [UserAdminController::class, 'store'])
        ->name('admin.usuarios.store');

    Route::patch('/admin/usuarios/{id}/rol', [UserAdminController::class, 'updateRole'])
        ->name('admin.usuarios.rol');

    Route::patch('/admin/usuarios/{id}/departamento', [UserAdminController::class, 'updateDepartamento'])
        ->name('admin.usuarios.departamento');

    Route::patch('/admin/usuarios/{id}/toggle', [UserAdminController::class, 'toggleStatus'])
        ->name('admin.usuarios.toggle');

    Route::post('/admin/usuarios/{user}/reset', [UserAdminController::class, 'resetPassword'])
        ->name('admin.usuarios.reset');
});

/*
|--------------------------------------------------------------------------
| ADMINISTRACIÓN DE TAGS Y DEPARTAMENTOS
|--------------------------------------------------------------------------
*/
Route::middleware(['auth', 'verified', 'admin'])->group(function () {

    Route::get('/admin/catalogos', [AdminCatalogosController::class, 'index'])
        ->name('admin.catalogos');

    // TAGS
    Route::post('/admin/tags', [AdminCatalogosController::class, 'storeTag'])
        ->name('admin.tags.store');

    Route::patch('/admin/tags/{id}/toggle', [AdminCatalogosController::class, 'toggleTag'])
        ->name('admin.tags.toggle');

    // DEPARTAMENTOS
    Route::post('/admin/departamentos', [AdminCatalogosController::class, 'storeDepartamento'])
        ->name('admin.departamentos.store');

    Route::patch('/admin/departamentos/{id}/toggle', [AdminCatalogosController::class, 'toggleDepartamento'])
        ->name('admin.departamentos.toggle');

    // PROYECTOS
    Route::post('/admin/proyectos', [AdminCatalogosController::class, 'storeProyecto'])
        ->name('admin.proyectos.store');

    Route::patch('/admin/proyectos/{id}/toggle', [AdminCatalogosController::class, 'toggleProyecto'])
        ->name('admin.proyectos.toggle');

    // ESTADOS DE TICKETS
    Route::post('/admin/ticket-estados', [AdminCatalogosController::class, 'storeTicketEstado'])
        ->name('admin.ticket-estados.store');

    Route::patch('/admin/ticket-estados/{id}/toggle', [AdminCatalogosController::class, 'toggleTicketEstado'])
        ->name('admin.ticket-estados.toggle');

    Route::patch('/admin/ticket-estados/{id}/toggle-prueba', [AdminCatalogosController::class, 'toggleEsPrueba'])
        ->name('admin.ticket-estados.toggle-prueba');

    Route::patch('/admin/ticket-estados/{id}/toggle-prueba-finalizada', [AdminCatalogosController::class, 'toggleEsPruebaFinalizada'])
        ->name('admin.ticket-estados.toggle-prueba-finalizada');
});

/*
|--------------------------------------------------------------------------
| VERIFICACIÓN
|--------------------------------------------------------------------------
*/
Route::get('/verificar-codigo', [VerificationController::class, 'showForm'])
    ->name('verificar.codigo');

Route::post('/verificar-codigo', [VerificationController::class, 'verify'])
    ->name('verificar.codigo.post');

require __DIR__ . '/auth.php';