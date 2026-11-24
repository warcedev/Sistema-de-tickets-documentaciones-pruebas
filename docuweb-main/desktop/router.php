<?php

/**
 * Router del servidor embebido de PHP para la app de escritorio.
 *
 * Igual al de `php artisan serve`, más una cosa: sirve /storage/... directo
 * desde la carpeta de datos del usuario (DOCWEB_STORAGE_PATH/app/public),
 * porque dentro de la app instalada no se puede crear el symlink que
 * normalmente hace `php artisan storage:link`.
 */

$publicPath = __DIR__ . '/public';
$uri = urldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?? '/');

if (strncmp($uri, '/storage/', 9) === 0) {
    $root = realpath(getenv('DOCWEB_STORAGE_PATH') . '/app/public');
    $file = $root ? realpath($root . substr($uri, 8)) : false;

    if ($file && strncmp($file, $root . DIRECTORY_SEPARATOR, strlen($root) + 1) === 0 && is_file($file)) {
        docweb_send_file($file);
        return true;
    }
}

if ($uri !== '/' && is_file($publicPath . $uri)) {
    return false;
}

$_SERVER['SCRIPT_FILENAME'] = $publicPath . '/index.php';
$_SERVER['SCRIPT_NAME'] = '/index.php';
$_SERVER['PHP_SELF'] = '/index.php';

require_once $publicPath . '/index.php';

/** Envía un archivo con soporte de Range (para poder adelantar videos). */
function docweb_send_file(string $file): void
{
    $size = filesize($file);
    $mime = function_exists('mime_content_type') ? (mime_content_type($file) ?: 'application/octet-stream') : 'application/octet-stream';
    $start = 0;
    $end = $size - 1;

    header('Content-Type: ' . $mime);
    header('Accept-Ranges: bytes');
    header('Cache-Control: private, max-age=3600');

    if (isset($_SERVER['HTTP_RANGE']) && preg_match('/bytes=(\d*)-(\d*)/', $_SERVER['HTTP_RANGE'], $m)) {
        if ($m[1] === '' && $m[2] !== '') {
            $start = max(0, $size - (int) $m[2]);
        } else {
            $start = (int) $m[1];
            if ($m[2] !== '') {
                $end = min((int) $m[2], $size - 1);
            }
        }
        if ($start > $end || $start >= $size) {
            http_response_code(416);
            header("Content-Range: bytes */$size");
            return;
        }
        http_response_code(206);
        header("Content-Range: bytes $start-$end/$size");
    }

    $length = $end - $start + 1;
    header('Content-Length: ' . $length);

    if ($_SERVER['REQUEST_METHOD'] === 'HEAD') {
        return;
    }

    $fp = fopen($file, 'rb');
    fseek($fp, $start);
    while ($length > 0 && !feof($fp)) {
        $chunk = fread($fp, min(1024 * 256, $length));
        echo $chunk;
        $length -= strlen($chunk);
        flush();
    }
    fclose($fp);
}
