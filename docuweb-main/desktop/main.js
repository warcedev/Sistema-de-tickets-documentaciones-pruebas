/**
 * DOCWeb — app de escritorio.
 *
 * Empaqueta la app Laravel + un PHP estático (sin instalar nada en la máquina)
 * y la muestra en una ventana propia:
 *
 *   1. Los datos del usuario (base SQLite, archivos subidos, sesiones, logs)
 *      viven en la carpeta de datos del sistema:
 *        macOS:   ~/Library/Application Support/DOCWeb
 *        Windows: %APPDATA%\DOCWeb
 *   2. Al arrancar corre las migraciones y el seeder del admin.
 *   3. Levanta varios `php -S` (uno por worker) y un pequeño proxy delante
 *      que reparte los pedidos, así la app no se traba con pedidos simultáneos
 *      (el servidor embebido de PHP atiende de a uno; en Windows ni siquiera
 *      soporta PHP_CLI_SERVER_WORKERS).
 */

const { app, BrowserWindow, Menu, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const net = require('net');
const http = require('http');
const crypto = require('crypto');
const { spawn } = require('child_process');

const APP_NAME = 'DOCWeb';
const WORKERS = 4;
const PREFERRED_PORT = 8765;
const ADMIN = { email: 'admin@docuweb.local', password: 'Admin123!' };

app.setName(APP_NAME);

if (!app.requestSingleInstanceLock()) {
  app.quit();
  process.exit(0);
}

// ---------------------------------------------------------------------------
// Rutas
// ---------------------------------------------------------------------------

const IS_WIN = process.platform === 'win32';
const OS_KEY = IS_WIN ? 'win' : process.platform === 'darwin' ? 'mac' : 'linux';

const resourcesDir = app.isPackaged ? process.resourcesPath : path.join(__dirname, 'build');
const laravelDir = path.join(resourcesDir, 'laravel');
const phpDir = app.isPackaged
  ? path.join(resourcesDir, 'php')
  : path.join(__dirname, 'build', 'php', `${OS_KEY}-${process.arch}`);
const phpBin = path.join(phpDir, IS_WIN ? 'php.exe' : 'php');

const dataDir = app.getPath('userData');
const storageDir = path.join(dataDir, 'storage');
const databaseDir = path.join(dataDir, 'database');
const databaseFile = path.join(databaseDir, 'database.sqlite');
const cacheDir = path.join(dataDir, 'cache');
const logsDir = path.join(dataDir, 'logs');
const logFile = path.join(logsDir, 'desktop.log');
const configFile = path.join(dataDir, 'config.json');

// ---------------------------------------------------------------------------
// Estado
// ---------------------------------------------------------------------------

let mainWindow = null;
let proxyServer = null;
let proxyPort = null;
let backends = []; // { port, proc, active }
let quitting = false;
let logStream = null;

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------

function log(...parts) {
  const line = `[${new Date().toISOString()}] ${parts.join(' ')}\n`;
  if (logStream) logStream.write(line);
  if (!app.isPackaged) process.stdout.write(line);
}

function ensureDirs() {
  for (const dir of [
    storageDir,
    path.join(storageDir, 'app', 'public'),
    path.join(storageDir, 'framework', 'cache', 'data'),
    path.join(storageDir, 'framework', 'sessions'),
    path.join(storageDir, 'framework', 'views'),
    path.join(storageDir, 'logs'),
    path.join(storageDir, 'fonts'),
    path.join(storageDir, 'docs'),
    databaseDir,
    cacheDir,
    logsDir,
  ]) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(databaseFile)) fs.writeFileSync(databaseFile, '');

  // Log de la app de escritorio: se reinicia si crece demasiado.
  try {
    if (fs.existsSync(logFile) && fs.statSync(logFile).size > 5 * 1024 * 1024) fs.unlinkSync(logFile);
  } catch (_) {}
  logStream = fs.createWriteStream(logFile, { flags: 'a' });
}

function loadConfig() {
  let config = {};
  try {
    config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
  } catch (_) {}
  if (!config.appKey) {
    config.appKey = 'base64:' + crypto.randomBytes(32).toString('base64');
    fs.writeFileSync(configFile, JSON.stringify(config, null, 2));
  }
  return config;
}

function phpEnv(config) {
  const url = `http://127.0.0.1:${proxyPort}`;
  return {
    ...process.env,
    APP_NAME,
    APP_ENV: 'production',
    APP_DEBUG: 'false',
    APP_KEY: config.appKey,
    APP_URL: url,
    ASSET_URL: '',
    LOG_CHANNEL: 'single',
    LOG_LEVEL: 'warning',
    DB_CONNECTION: 'sqlite',
    DB_DATABASE: databaseFile,
    DB_FOREIGN_KEYS: 'true',
    BROADCAST_DRIVER: 'log',
    CACHE_DRIVER: 'file',
    FILESYSTEM_DISK: 'local',
    QUEUE_CONNECTION: 'sync',
    SESSION_DRIVER: 'file',
    SESSION_LIFETIME: '480',
    MAIL_MAILER: 'log',
    DOCWEB_STORAGE_PATH: storageDir,
    VIEW_COMPILED_PATH: path.join(storageDir, 'framework', 'views'),
    APP_SERVICES_CACHE: path.join(cacheDir, 'services.php'),
    APP_PACKAGES_CACHE: path.join(cacheDir, 'packages.php'),
    APP_CONFIG_CACHE: path.join(cacheDir, 'config.php'),
    APP_ROUTES_CACHE: path.join(cacheDir, 'routes-v7.php'),
    APP_EVENTS_CACHE: path.join(cacheDir, 'events.php'),
  };
}

function phpIniArgs() {
  const args = [
    '-d', 'upload_max_filesize=100M',
    '-d', 'post_max_size=105M',
    '-d', 'memory_limit=512M',
    '-d', 'max_execution_time=300',
    '-d', 'opcache.enable=1',
    '-d', 'opcache.enable_cli=1',
    '-d', 'display_errors=0',
  ];
  const cacert = path.join(phpDir, 'cacert.pem');
  if (fs.existsSync(cacert)) {
    args.push('-d', `curl.cainfo=${cacert}`, '-d', `openssl.cafile=${cacert}`);
  }
  return args;
}

function runPhp(args, env) {
  return new Promise((resolve, reject) => {
    log('php', args.join(' '));
    const proc = spawn(phpBin, [...phpIniArgs(), ...args], { cwd: laravelDir, env, windowsHide: true });
    let output = '';
    proc.stdout.on('data', (d) => (output += d));
    proc.stderr.on('data', (d) => (output += d));
    proc.on('error', reject);
    proc.on('close', (code) => {
      log(output.trim());
      if (code === 0) resolve(output);
      else reject(new Error(`php ${args.join(' ')} terminó con código ${code}\n\n${output.trim()}`));
    });
  });
}

function getFreePort(preferred = 0) {
  return new Promise((resolve) => {
    const srv = net.createServer();
    srv.once('error', () => {
      if (preferred) resolve(getFreePort(0));
      else resolve(0);
    });
    srv.listen(preferred, '127.0.0.1', () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
  });
}

function waitForPort(port, timeoutMs = 20000) {
  const started = Date.now();
  return new Promise((resolve, reject) => {
    const attempt = () => {
      const sock = net.connect(port, '127.0.0.1');
      sock.once('connect', () => {
        sock.destroy();
        resolve();
      });
      sock.once('error', () => {
        sock.destroy();
        if (Date.now() - started > timeoutMs) reject(new Error(`El servidor PHP no respondió en el puerto ${port}`));
        else setTimeout(attempt, 150);
      });
    };
    attempt();
  });
}

function setStatus(text) {
  log(text);
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.executeJavaScript(`window.setStatus && window.setStatus(${JSON.stringify(text)})`).catch(() => {});
  }
}

function showSplash() {
  return mainWindow.loadFile(path.join(__dirname, 'splash.html'));
}

// ---------------------------------------------------------------------------
// Servidores PHP + proxy
// ---------------------------------------------------------------------------

function spawnBackend(backend, env) {
  const args = [...phpIniArgs(), '-S', `127.0.0.1:${backend.port}`, '-t', 'public', 'desktop-router.php'];
  const proc = spawn(phpBin, args, { cwd: laravelDir, env, windowsHide: true });
  backend.proc = proc;
  backend.active = 0;
  // php -S escribe una línea por pedido en stderr: solo se guardan errores.
  const onData = (d) => {
    const text = d.toString();
    for (const line of text.split('\n')) {
      if (line && !/ (Accepted|Closing|\[\d{3}\]: |Closed without sending)/.test(line)) log(`[php:${backend.port}]`, line);
    }
  };
  proc.stdout.on('data', onData);
  proc.stderr.on('data', onData);
  proc.on('exit', (code) => {
    log(`[php:${backend.port}] terminó (código ${code})`);
    if (!quitting && backend.proc === proc) {
      setTimeout(() => !quitting && spawnBackend(backend, env), 500);
    }
  });
}

async function startBackends(env) {
  backends = [];
  for (let i = 0; i < WORKERS; i++) {
    const backend = { port: await getFreePort(), proc: null, active: 0 };
    backends.push(backend);
    spawnBackend(backend, env);
  }
  await Promise.all(backends.map((b) => waitForPort(b.port)));
}

function stopBackends() {
  const waits = backends.map(
    (b) =>
      new Promise((resolve) => {
        const proc = b.proc;
        b.proc = null;
        if (!proc || proc.exitCode !== null) return resolve();
        proc.once('exit', resolve);
        proc.kill();
        setTimeout(resolve, 3000);
      })
  );
  return Promise.all(waits);
}

function pickBackend() {
  return backends.reduce((best, b) => (b.active < best.active ? b : best), backends[0]);
}

function startProxy() {
  return new Promise(async (resolve, reject) => {
    const port = await getFreePort(PREFERRED_PORT);
    proxyServer = http.createServer((req, res) => {
      const backend = pickBackend();
      if (!backend) {
        res.writeHead(503);
        return res.end('Iniciando…');
      }
      backend.active++;
      let done = false;
      const finish = () => {
        if (!done) {
          done = true;
          backend.active--;
        }
      };
      const upstream = http.request(
        { host: '127.0.0.1', port: backend.port, method: req.method, path: req.url, headers: req.headers, agent: false },
        (upRes) => {
          res.writeHead(upRes.statusCode, upRes.rawHeaders);
          upRes.pipe(res);
          upRes.on('end', finish);
          upRes.on('error', finish);
        }
      );
      upstream.on('error', (err) => {
        finish();
        log('proxy error:', err.message);
        if (!res.headersSent) res.writeHead(502);
        res.end();
      });
      res.on('close', finish);
      req.pipe(upstream);
    });
    proxyServer.on('error', reject);
    proxyServer.listen(port, '127.0.0.1', () => {
      proxyPort = proxyServer.address().port;
      log(`proxy escuchando en http://127.0.0.1:${proxyPort}`);
      resolve();
    });
  });
}

// ---------------------------------------------------------------------------
// Arranque
// ---------------------------------------------------------------------------

async function boot() {
  await showSplash();
  try {
    if (!fs.existsSync(phpBin)) throw new Error(`No se encontró PHP en ${phpBin}`);
    if (!fs.existsSync(path.join(laravelDir, 'artisan'))) throw new Error(`No se encontró la aplicación en ${laravelDir}`);

    const config = loadConfig();
    if (!proxyServer) await startProxy();
    const env = phpEnv(config);

    setStatus('Preparando la base de datos…');
    await runPhp(['artisan', 'migrate', '--force', '--no-interaction'], env);
    await runPhp(['artisan', 'db:seed', '--force', '--no-interaction'], env);

    setStatus('Iniciando servidor…');
    await startBackends(env);

    setStatus('Abriendo…');
    await mainWindow.loadURL(`http://127.0.0.1:${proxyPort}/`);
  } catch (err) {
    log('ERROR', err.stack || err.message);
    mainWindow.webContents
      .executeJavaScript(`window.setError && window.setError(${JSON.stringify(err.message)})`)
      .catch(() => {});
  }
}

async function loadDemoData() {
  const { response } = await dialog.showMessageBox(mainWindow, {
    type: 'question',
    buttons: ['Cargar datos', 'Cancelar'],
    defaultId: 0,
    cancelId: 1,
    message: 'Cargar datos de demostración',
    detail:
      'Se crean tickets y ~100 documentos de ejemplo (prefijo "[DEMO]") y algunos usuarios de demo. ' +
      'Si ya estaban cargados, no se duplican.',
  });
  if (response !== 0) return;

  const env = phpEnv(loadConfig());
  await showSplash();
  try {
    setStatus('Cargando tickets de demostración…');
    await runPhp(['artisan', 'db:seed', '--class=DemoDashboardSeeder', '--force', '--no-interaction'], env);
    setStatus('Cargando documentos de demostración…');
    await runPhp(['artisan', 'db:seed', '--class=DemoDocumentacionSeeder', '--force', '--no-interaction'], env);
    await mainWindow.loadURL(`http://127.0.0.1:${proxyPort}/`);
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      message: 'Datos de demostración cargados',
      detail: 'Los usuarios de demo (email "demo.…") tienen la contraseña Demo1234!',
    });
  } catch (err) {
    log('ERROR', err.stack || err.message);
    await mainWindow.loadURL(`http://127.0.0.1:${proxyPort}/`);
    dialog.showErrorBox('No se pudieron cargar los datos de demostración', err.message);
  }
}

async function resetData() {
  const { response } = await dialog.showMessageBox(mainWindow, {
    type: 'warning',
    buttons: ['Borrar todo y reiniciar', 'Cancelar'],
    defaultId: 1,
    cancelId: 1,
    message: '¿Restablecer todos los datos?',
    detail:
      'Se borran la base de datos y todos los archivos subidos (documentos, tickets, casos de prueba, usuarios). ' +
      'La aplicación vuelve a quedar como recién instalada. Esta acción no se puede deshacer.',
  });
  if (response !== 0) return;

  quitting = true;
  await stopBackends();
  if (logStream) logStream.end();
  fs.rmSync(databaseDir, { recursive: true, force: true });
  fs.rmSync(storageDir, { recursive: true, force: true });
  fs.rmSync(cacheDir, { recursive: true, force: true });
  app.relaunch();
  app.exit(0);
}

function showCredentials() {
  dialog.showMessageBox(mainWindow, {
    type: 'info',
    message: 'Usuario administrador',
    detail: `Email: ${ADMIN.email}\nContraseña: ${ADMIN.password}\n\nUsuarios de demo (si se cargaron los datos de demostración): contraseña Demo1234!`,
  });
}

// ---------------------------------------------------------------------------
// Ventana y menú
// ---------------------------------------------------------------------------

function isAppUrl(url) {
  try {
    const u = new URL(url);
    return u.hostname === '127.0.0.1' && String(u.port) === String(proxyPort);
  } catch (_) {
    return false;
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    title: APP_NAME,
    backgroundColor: '#ffffff',
    icon: path.join(__dirname, 'build-resources', 'icon.png'),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      plugins: true, // visor de PDF integrado
      spellcheck: true,
    },
  });

  // Enlaces externos -> navegador del sistema. Los propios (PDF, adjuntos) -> ventana nueva.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (isAppUrl(url)) {
      return { action: 'allow', overrideBrowserWindowOptions: { width: 1100, height: 800, autoHideMenuBar: true } };
    }
    if (/^(https?|mailto):/.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (url.startsWith('file:') || isAppUrl(url)) return;
    event.preventDefault();
    if (/^(https?|mailto):/.test(url)) shell.openExternal(url);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function buildMenu() {
  const isMac = process.platform === 'darwin';
  const appMenu = [
    { label: 'Ver usuario administrador', click: showCredentials },
    { type: 'separator' },
    { label: 'Cargar datos de demostración…', click: loadDemoData },
    { label: 'Abrir carpeta de datos', click: () => shell.openPath(dataDir) },
    { label: 'Restablecer todos los datos…', click: resetData },
  ];

  const template = [
    ...(isMac
      ? [
          {
            label: APP_NAME,
            submenu: [
              { role: 'about', label: `Acerca de ${APP_NAME}` },
              { type: 'separator' },
              ...appMenu,
              { type: 'separator' },
              { role: 'hide', label: `Ocultar ${APP_NAME}` },
              { role: 'hideOthers', label: 'Ocultar otros' },
              { role: 'unhide', label: 'Mostrar todo' },
              { type: 'separator' },
              { role: 'quit', label: `Salir de ${APP_NAME}` },
            ],
          },
        ]
      : [
          {
            label: APP_NAME,
            submenu: [...appMenu, { type: 'separator' }, { role: 'quit', label: 'Salir' }],
          },
        ]),
    {
      label: 'Edición',
      submenu: [
        { role: 'undo', label: 'Deshacer' },
        { role: 'redo', label: 'Rehacer' },
        { type: 'separator' },
        { role: 'cut', label: 'Cortar' },
        { role: 'copy', label: 'Copiar' },
        { role: 'paste', label: 'Pegar' },
        { role: 'selectAll', label: 'Seleccionar todo' },
      ],
    },
    {
      label: 'Ver',
      submenu: [
        { label: 'Atrás', accelerator: isMac ? 'Cmd+[' : 'Alt+Left', click: () => mainWindow?.webContents.navigationHistory.goBack() },
        { label: 'Adelante', accelerator: isMac ? 'Cmd+]' : 'Alt+Right', click: () => mainWindow?.webContents.navigationHistory.goForward() },
        { role: 'reload', label: 'Recargar' },
        { type: 'separator' },
        { role: 'resetZoom', label: 'Tamaño real' },
        { role: 'zoomIn', label: 'Acercar' },
        { role: 'zoomOut', label: 'Alejar' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'Pantalla completa' },
        { role: 'toggleDevTools', label: 'Herramientas de desarrollo' },
      ],
    },
    { role: 'windowMenu', label: 'Ventana' },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// ---------------------------------------------------------------------------
// Ciclo de vida
// ---------------------------------------------------------------------------

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

app.whenReady().then(() => {
  ensureDirs();
  log(`--- ${APP_NAME} ${app.getVersion()} (${process.platform}-${process.arch}) ---`);
  buildMenu();
  createWindow();
  boot();

  app.on('activate', () => {
    // macOS: clic en el Dock sin ventanas abiertas
    if (!mainWindow) {
      createWindow();
      if (backends.length) mainWindow.loadURL(`http://127.0.0.1:${proxyPort}/`);
      else boot();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  quitting = true;
  for (const b of backends) {
    try {
      b.proc && b.proc.kill();
    } catch (_) {}
  }
  if (proxyServer) proxyServer.close();
});
