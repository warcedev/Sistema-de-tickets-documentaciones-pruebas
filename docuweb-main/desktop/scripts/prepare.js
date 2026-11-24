#!/usr/bin/env node
/**
 * Prepara todo lo que la app de escritorio empaqueta:
 *
 *   desktop/build/laravel/          copia limpia de la app (sin dev deps) + frontend compilado
 *   desktop/build/php/<os>-<arch>/  PHP estático (static-php-cli) + cacert.pem
 *
 * Uso: node scripts/prepare.js [mac] [win] [current]
 *   mac      -> PHP para macOS Intel (x64) y Apple Silicon (arm64)
 *   win      -> PHP para Windows x64
 *   current  -> PHP solo para esta máquina (para probar con `npm start`)
 *
 * Requiere en la máquina que arma el paquete: Node 18+, PHP 8.x y Composer.
 * (Las máquinas donde se instala la app final no necesitan nada.)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const DESKTOP = path.resolve(__dirname, '..');
const ROOT = path.resolve(DESKTOP, '..');
const BUILD = path.join(DESKTOP, 'build');
const CACHE = path.join(DESKTOP, '.cache');
const PHP_MINOR = '8.3';

const MAC_BASE = 'https://dl.static-php.dev/static-php-cli/common/';
const WIN_BASE = 'https://dl.static-php.dev/static-php-cli/windows/spc-max/';
const CACERT_URL = 'https://curl.se/ca/cacert.pem';

const run = (cmd, cwd = ROOT) => {
  console.log(`\n$ ${cmd}   (${path.relative(ROOT, cwd) || '.'})`);
  execSync(cmd, { cwd, stdio: 'inherit', shell: true });
};

// ---------------------------------------------------------------------------

function buildFrontend() {
  if (!fs.existsSync(path.join(ROOT, 'node_modules'))) run('npm ci');
  run('npm run build');
}

const EXCLUDE_TOP = new Set([
  '.git', '.github', 'node_modules', 'vendor', 'desktop', 'docker', 'tests', 'storage',
  '.env', '.env.backup', '.env.production', '.phpunit.result.cache', 'docker-compose.yml',
  'Makefile', 'phpunit.xml', '.idea', '.vscode', '.fleet', '.DS_Store',
]);
const EXCLUDE_REL = new Set(['public/hot', 'public/storage']);

function stageLaravel() {
  const dest = path.join(BUILD, 'laravel');
  fs.rmSync(dest, { recursive: true, force: true });
  fs.mkdirSync(dest, { recursive: true });

  for (const entry of fs.readdirSync(ROOT)) {
    if (EXCLUDE_TOP.has(entry)) continue;
    fs.cpSync(path.join(ROOT, entry), path.join(dest, entry), {
      recursive: true,
      filter: (src) => {
        const rel = path.relative(ROOT, src).split(path.sep).join('/');
        return !EXCLUDE_REL.has(rel) && !rel.endsWith('.DS_Store');
      },
    });
  }

  // Estructura mínima de storage (en la app real se usa la carpeta de datos del usuario)
  for (const dir of ['app/public', 'framework/cache/data', 'framework/sessions', 'framework/views', 'logs']) {
    fs.mkdirSync(path.join(dest, 'storage', dir), { recursive: true });
  }
  fs.copyFileSync(path.join(DESKTOP, 'router.php'), path.join(dest, 'desktop-router.php'));

  run('composer install --no-dev --optimize-autoloader --no-interaction --prefer-dist --ignore-platform-req=php', dest);

  // Cachés generadas al instalar: en la app se regeneran en la carpeta de datos.
  for (const f of fs.readdirSync(path.join(dest, 'bootstrap', 'cache'))) {
    if (f.endsWith('.php')) fs.unlinkSync(path.join(dest, 'bootstrap', 'cache', f));
  }
  fs.rmSync(path.join(dest, 'storage', 'logs'), { recursive: true, force: true });
  fs.mkdirSync(path.join(dest, 'storage', 'logs'));
}

// ---------------------------------------------------------------------------

async function fetchText(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
  return res.text();
}

async function download(url, file) {
  if (fs.existsSync(file)) return file;
  console.log(`Descargando ${url}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file + '.part', Buffer.from(await res.arrayBuffer()));
  fs.renameSync(file + '.part', file);
  return file;
}

async function latest(base, regex) {
  const html = await fetchText(base);
  const versions = [...new Set([...html.matchAll(regex)].map((m) => m[1]))];
  versions.sort((a, b) => Number(a.split('.')[2]) - Number(b.split('.')[2]));
  if (!versions.length) throw new Error(`No se encontraron binarios de PHP ${PHP_MINOR} en ${base}`);
  return versions[versions.length - 1];
}

function extract(archive, dest) {
  fs.rmSync(dest, { recursive: true, force: true });
  fs.mkdirSync(dest, { recursive: true });
  if (archive.endsWith('.zip') && process.platform === 'linux') run(`unzip -o "${archive}" -d "${dest}"`, dest);
  else run(`tar -xf "${archive}" -C "${dest}"`, dest);
}

async function preparePhp(key) {
  const dest = path.join(BUILD, 'php', key);
  const [os, arch] = key.split('-');
  let url;
  if (os === 'mac') {
    const a = arch === 'arm64' ? 'aarch64' : 'x86_64';
    const v = await latest(MAC_BASE, new RegExp(`php-(${PHP_MINOR.replace('.', '\\.')}\\.\\d+)-cli-macos-${a}\\.tar\\.gz`, 'g'));
    url = `${MAC_BASE}php-${v}-cli-macos-${a}.tar.gz`;
  } else if (os === 'win') {
    const v = await latest(WIN_BASE, new RegExp(`php-(${PHP_MINOR.replace('.', '\\.')}\\.\\d+)-cli-win\\.zip`, 'g'));
    url = `${WIN_BASE}php-${v}-cli-win.zip`;
  } else {
    throw new Error(`Plataforma no soportada: ${key}`);
  }

  const archive = await download(url, path.join(CACHE, path.basename(url)));
  extract(archive, dest);
  const cacert = await download(CACERT_URL, path.join(CACHE, 'cacert.pem'));
  fs.copyFileSync(cacert, path.join(dest, 'cacert.pem'));

  const bin = path.join(dest, os === 'win' ? 'php.exe' : 'php');
  if (!fs.existsSync(bin)) throw new Error(`El paquete ${url} no trae ${path.basename(bin)}`);
  if (os !== 'win') fs.chmodSync(bin, 0o755);
  console.log(`PHP listo: ${path.relative(DESKTOP, bin)}`);
}

// ---------------------------------------------------------------------------

(async () => {
  const targets = process.argv.slice(2);
  if (!targets.length) targets.push('current');

  const keys = new Set();
  for (const t of targets) {
    if (t === 'mac') ['mac-x64', 'mac-arm64'].forEach((k) => keys.add(k));
    else if (t === 'win') keys.add('win-x64');
    else if (t === 'current') keys.add(`${process.platform === 'win32' ? 'win' : 'mac'}-${process.arch}`);
    else throw new Error(`Destino desconocido: ${t}`);
  }

  buildFrontend();
  stageLaravel();
  for (const key of keys) await preparePhp(key);
  console.log('\nListo. Contenido en desktop/build/');
})().catch((err) => {
  console.error('\nERROR:', err.message);
  process.exit(1);
});
