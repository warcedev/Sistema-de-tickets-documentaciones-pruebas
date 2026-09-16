#!/bin/sh
set -e

cd /var/www/html

# .env: si no existe (primer arranque), se crea a partir del ejemplo
if [ ! -f .env ]; then
    cp .env.example .env
fi

# Clave de la app: se genera si falta
if ! grep -q "^APP_KEY=base64" .env; then
    php artisan key:generate --force
fi

# Base de datos SQLite: se crea el archivo si todavía no existe
mkdir -p "$(dirname "${DB_DATABASE:-/var/www/html/storage/database/database.sqlite}")"
touch "${DB_DATABASE:-/var/www/html/storage/database/database.sqlite}"

php artisan migrate --force

# Usuario administrador inicial (no duplica si ya existe)
php artisan db:seed --force

# Enlace público para portadas/adjuntos servidos directo desde /storage
php artisan storage:link --force || true

exec "$@"
