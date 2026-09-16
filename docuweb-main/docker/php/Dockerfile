# syntax=docker/dockerfile:1

# ============================================================
# Etapa 1: compilar el frontend (React + Vite)
# ============================================================
FROM node:20-alpine AS frontend

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY vite.config.js tailwind.config.js postcss.config.js jsconfig.json ./
COPY resources ./resources
COPY public ./public

RUN npm run build

# ============================================================
# Etapa 2: la aplicación PHP
# ============================================================
FROM php:8.3-cli

WORKDIR /var/www/html

# Dependencias del sistema + extensiones de PHP que usa la app
# (sqlite para la base de datos, gd/dom/mbstring para dompdf y el
# editor de documentación, zip/xml para varias librerías de Laravel)
RUN apt-get update && apt-get install -y --no-install-recommends \
        git unzip libzip-dev libpng-dev libjpeg-dev libfreetype6-dev \
        libonig-dev libxml2-dev libsqlite3-dev sqlite3 \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j"$(nproc)" \
        pdo pdo_sqlite mbstring exif pcntl bcmath gd zip xml dom \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Límite de subida de archivos (fotos/videos en tickets y documentación)
RUN { \
        echo "upload_max_filesize=100M"; \
        echo "post_max_size=105M"; \
        echo "memory_limit=512M"; \
    } > /usr/local/etc/php/conf.d/uploads.ini

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

COPY composer.json composer.lock ./
RUN composer install --no-dev --no-scripts --no-interaction --prefer-dist --optimize-autoloader

COPY . .
COPY --from=frontend /app/public/build ./public/build

RUN composer dump-autoload --optimize \
    && mkdir -p storage/framework/{cache,sessions,views} storage/logs database \
    && chown -R www-data:www-data storage bootstrap/cache database

COPY docker/php/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

EXPOSE 8000

ENTRYPOINT ["entrypoint.sh"]
CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]
