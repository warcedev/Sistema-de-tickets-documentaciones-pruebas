# 🖥️ DOCWeb — app de escritorio (Mac y Windows)

Empaqueta DOCWeb como un programa normal: se instala, se abre con doble clic
y funciona. **La máquina donde se instala no necesita PHP, Node, Docker ni
base de datos** — todo viene adentro (Electron + PHP 8.3 estático + SQLite).

## 👤 Para quien recibe la app (demos)

| Sistema | Archivo | Cómo instalar |
|---|---|---|
| Mac Apple Silicon (M1/M2/M3/M4) | `DOCWeb-x.y.z-mac-arm64.dmg` | Abrir el `.dmg` y arrastrar **DOCWeb** a Aplicaciones |
| Mac Intel | `DOCWeb-x.y.z-mac-x64.dmg` | Igual |
| Windows 10/11 | `DOCWeb-x.y.z-windows-instalador.exe` | Doble clic → Siguiente → Instalar |
| Windows sin instalar | `DOCWeb-x.y.z-windows-x64.zip` | Descomprimir y abrir `DOCWeb.exe` |

**Primera apertura (la app no está firmada con certificado de pago):**

- **Mac:** clic derecho sobre DOCWeb → **Abrir** → **Abrir**. Si dice “está
  dañada” o no deja: *Configuración del Sistema → Privacidad y seguridad →
  “Abrir igualmente”*. (Alternativa en Terminal:
  `xattr -cr /Applications/DOCWeb.app`). Solo hace falta la primera vez.
- **Windows:** si aparece “Windows protegió su PC” → **Más información** →
  **Ejecutar de todas formas**.

**Ingreso:** `admin@docuweb.local` / `Admin123!`
(también en el menú **DOCWeb → Ver usuario administrador**).

**Menú DOCWeb:**
- *Cargar datos de demostración* — tickets y documentos de ejemplo `[DEMO]`
  para que el sistema se vea “vivo” (usuarios demo: contraseña `Demo1234!`).
- *Abrir carpeta de datos* — base de datos, archivos subidos y logs.
- *Restablecer todos los datos* — deja la app como recién instalada.

Los datos se guardan en la carpeta del usuario y **no se pierden al cerrar o
actualizar** la app:
- Mac: `~/Library/Application Support/DOCWeb`
- Windows: `%APPDATA%\DOCWeb`

## 🛠️ Para armar los instaladores

Requisitos (solo en la máquina que arma): **Node 18+, PHP 8.x y Composer**.

```bash
cd desktop
npm install

npm start            # prueba local: prepara y abre la app sin empaquetar
npm run build:mac    # -> dist/*.dmg (Intel + Apple Silicon)
npm run build:win    # -> dist/*.exe + dist/*.zip (Windows x64)
```

`scripts/prepare.js` hace todo lo previo:
1. compila el frontend (`npm run build` en la raíz),
2. arma una copia limpia de Laravel en `desktop/build/laravel` con
   `composer install --no-dev`,
3. descarga el PHP estático de cada plataforma desde
   [static-php-cli](https://static-php.dev) a `desktop/build/php/`.

> **Windows desde una Mac:** `npm run build:win` funciona, pero el `.exe`
> queda con el ícono genérico de Electron (cambiarlo requiere Wine). Para
> builds “perfectos” de ambas plataformas usá el workflow de GitHub Actions
> (`.github/workflows/desktop.yml`): pestaña **Actions → Desktop build → Run
> workflow**, y descargá los instaladores de los *artifacts* del run.

## ⚙️ Cómo funciona por dentro

- `main.js` (Electron) al abrir:
  1. crea la carpeta de datos y una `APP_KEY` propia de esa instalación,
  2. corre `php artisan migrate` + el seeder del admin,
  3. levanta 4 procesos `php -S` y un mini-proxy delante que reparte los
     pedidos (el servidor embebido de PHP atiende de a uno),
  4. abre la ventana apuntando a `http://127.0.0.1:8765`.
- `router.php` sirve `/storage/...` desde la carpeta de datos (reemplaza al
  symlink de `storage:link`, que no se puede crear dentro de la app instalada).
- El único cambio en Laravel está en `bootstrap/app.php`: si existe la variable
  `DOCWEB_STORAGE_PATH`, usa esa carpeta como `storage`. Sin ella (Docker /
  desarrollo) todo sigue igual que antes.
- Al cerrar la ventana se detienen los procesos de PHP.

Log de la app de escritorio: `<carpeta de datos>/logs/desktop.log`.
Log de Laravel: `<carpeta de datos>/storage/logs/laravel.log`.
