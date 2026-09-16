# 📘 DOCWeb

Plataforma interna de documentación, tickets y control de calidad. Centraliza la
documentación operativa de la empresa, la gestión de tickets con SLA y QA, y
la preparación/ejecución de casos de prueba con historial y export a PDF.

## 🧱 Qué incluye

**📄 Documentación** — repositorio de documentos con contenido enriquecido
(editor de texto, imágenes, adjuntos), clasificados por tags y por
departamento, con control de acceso: cada usuario solo ve la documentación de
su departamento (Tecnología puede gestionar todo).

**🎫 Tickets** — sistema de tickets al estilo Redmine: flujo de estados,
prioridad/severidad, SLA con vencimiento automático, gate de QA antes de
cerrar, comentarios con menciones, adjuntos (fotos/videos vistos en línea),
notificaciones, reportes, y **importación directa desde el Atom/XML de
Redmine** (tickets individuales o el historial completo de actividad de un
ticket).

**🧪 Casos de prueba** — organización en suites (con sub-suites), casos con
pasos y resultado esperado, vinculables a un ticket propio o de Redmine.
Cada ejecución queda en un historial permanente (con capturas de pantalla),
exportable a PDF con portada, índice y resultados.

## 🚀 Instalación (Docker, un solo paso)

Requisito: tener **Docker** y **Docker Compose** instalados. Nada más —
no hace falta PHP, Node ni ninguna base de datos instalada en la máquina
(usa SQLite, incluida en la imagen).

```bash
git clone git@github.com:warcedev/Sistema-de-tickets-documentaciones-pruebas.git
cd Sistema-de-tickets-documentaciones-pruebas
docker compose up --build
```

Eso es todo. La primera vez, el contenedor arma solo la aplicación completa:
compila el frontend, instala dependencias, crea la base de datos, corre las
migraciones y deja listo un usuario administrador.

Cuando termine, entrar a **http://localhost:8000**

**Usuario administrador inicial:**

| Campo | Valor |
|---|---|
| Email | `admin@docuweb.local` |
| Contraseña | `Admin123!` |

> Cambiá esta contraseña desde el propio sistema (ícono de usuario → Editar
> perfil) apenas entres, sobre todo si vas a exponer esto fuera de tu red
> interna.

## 🔁 Uso diario

```bash
docker compose up -d       # levantar en segundo plano
docker compose down        # apagar
docker compose logs -f     # ver logs en vivo
```

Tus documentos, tickets, casos de prueba y archivos subidos **no se pierden**
al apagar o reiniciar el contenedor — quedan en volúmenes de Docker aparte
(`docuweb_database` y `docuweb_storage`).

Si actualizás el código (`git pull`) y querés que los cambios se reflejen,
volvé a construir la imagen:

```bash
docker compose up -d --build
```

## 🛠️ Comandos útiles dentro del contenedor

```bash
docker compose exec app php artisan tinker      # consola interactiva
docker compose exec app php artisan migrate     # correr migraciones nuevas a mano
docker compose exec app bash                    # abrir una shell
```

(También podés usar `make shell`, `make logs`, etc. — ver el `Makefile`.)

## 🧠 Stack técnico

- **Backend:** Laravel 9 (PHP 8.3)
- **Frontend:** React + Inertia.js, Tailwind CSS
- **Base de datos:** SQLite (un solo archivo, sin servidor de base de datos aparte)
- **PDF:** dompdf
- **Todo corre en un único contenedor** — no hay servicios separados que
  coordinar (sin MySQL, sin Redis, sin nginx aparte: `php artisan serve`
  sirve la app completa).
