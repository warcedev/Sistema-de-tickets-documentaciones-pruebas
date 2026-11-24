<?php

/*
|--------------------------------------------------------------------------
| Create The Application
|--------------------------------------------------------------------------
|
| The first thing we will do is create a new Laravel application instance
| which serves as the "glue" for all the components of Laravel, and is
| the IoC container for the system binding all of the various parts.
|
*/

$app = new Illuminate\Foundation\Application(
    $_ENV['APP_BASE_PATH'] ?? dirname(__DIR__)
);

/*
| App de escritorio (desktop/): la carpeta de la aplicación instalada es de
| solo lectura, así que el lanzador indica dónde guardar storage (archivos
| subidos, sesiones, vistas compiladas, logs). Sin la variable, todo sigue
| igual que siempre (Docker / desarrollo).
*/
$desktopStorage = $_SERVER['DOCWEB_STORAGE_PATH'] ?? $_ENV['DOCWEB_STORAGE_PATH'] ?? getenv('DOCWEB_STORAGE_PATH');
if ($desktopStorage) {
    $app->useStoragePath($desktopStorage);

    // Windows: el lanzador pasa rutas de caché absolutas tipo "C:\Users\...".
    // Laravel 9 solo considera absolutas las que empiezan con "/" o "\", y a
    // las demás les antepone la carpeta de la app (ruta inexistente). Se
    // registran las letras de unidad como prefijos absolutos.
    foreach (range('A', 'Z') as $drive) {
        $app->addAbsoluteCachePathPrefix($drive . ':');
        $app->addAbsoluteCachePathPrefix(strtolower($drive) . ':');
    }
}

/*
|--------------------------------------------------------------------------
| Bind Important Interfaces
|--------------------------------------------------------------------------
|
| Next, we need to bind some important interfaces into the container so
| we will be able to resolve them when needed. The kernels serve the
| incoming requests to this application from both the web and CLI.
|
*/

$app->singleton(
    Illuminate\Contracts\Http\Kernel::class,
    App\Http\Kernel::class
);

$app->singleton(
    Illuminate\Contracts\Console\Kernel::class,
    App\Console\Kernel::class
);

$app->singleton(
    Illuminate\Contracts\Debug\ExceptionHandler::class,
    App\Exceptions\Handler::class
);

/*
|--------------------------------------------------------------------------
| Return The Application
|--------------------------------------------------------------------------
|
| This script returns the application instance. The instance is given to
| the calling script so we can separate the building of the instances
| from the actual running of the application and sending responses.
|
*/

return $app;
