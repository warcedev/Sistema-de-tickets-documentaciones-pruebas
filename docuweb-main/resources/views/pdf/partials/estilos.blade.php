<style>
    @page { margin: 70px 40px 55px 40px; }

    body { font-family: DejaVu Sans, sans-serif; font-size: 12px; color: #1f2937; }

    .header-fijo {
        position: fixed; top: -50px; left: 0; right: 0;
        text-align: right; font-size: 9px; color: #9ca3af;
        border-bottom: 1px solid #e5e7eb; padding-bottom: 6px;
    }
    .header-fijo .marca { color: #1F5C8C; font-weight: bold; font-size: 11px; }

    h1 { font-size: 21px; margin: 0 0 4px 0; color: #14314a; }
    h2 { font-size: 15px; margin-top: 20px; margin-bottom: 6px; color: #1F5C8C; }
    h3 { font-size: 13px; margin-top: 10px; margin-bottom: 4px; color: #14314a; }

    .muted { color: #6b7280; font-size: 11px; }
    .clear { clear: both; }

    .badge {
        display: inline-block; padding: 3px 10px; border-radius: 10px;
        color: #fff; font-size: 10.5px; font-weight: bold;
    }
    .badge-exitoso, .badge-pasa { background: #588424; }
    .badge-fallido, .badge-falla { background: #b91c1c; }
    .badge-bloqueado { background: #b5650a; }
    .badge-sinejecutar { background: #9ca3af; }

    table { width: 100%; border-collapse: collapse; margin-top: 6px; }
    td, th {
        border: 1px solid #e2e5ea; padding: 7px 8px; text-align: left;
        vertical-align: top; font-size: 11px;
    }
    th { background: #f3f6f9; color: #374151; }

    .caja {
        border: 1px solid #e2e5ea; border-radius: 6px; padding: 10px 12px;
        margin-top: 8px; background: #fafbfc;
    }

    .ticket-ref {
        display: inline-block; background: #eaf2f8; color: #1F5C8C;
        border-radius: 5px; padding: 3px 10px; font-size: 11px; margin-top: 4px;
    }

    /* --- Bloque de un paso ejecutado, estilo tarjeta (no tabla) --- */
    .paso-card {
        border: 1px solid #e2e5ea; border-radius: 6px; padding: 10px 12px;
        margin-top: 8px; page-break-inside: avoid;
    }
    .paso-card .titulo-paso { font-weight: bold; font-size: 12px; }
    .paso-card .esperado { color: #6b7280; font-size: 10.5px; margin-top: 2px; }
    .paso-card .observacion { margin-top: 6px; font-size: 11px; }

    .capturas { margin-top: 8px; }
    .captura-item {
        float: left; width: 47%; margin: 0 3% 10px 0; box-sizing: border-box;
    }
    .captura-item img {
        width: 100%; max-height: 340px; object-fit: contain;
        border: 1px solid #d7dbe0; border-radius: 4px; background: #f8f9fb;
    }
    .captura-item.unica { width: 74%; }
    .captura-item.unica img { max-height: 430px; }

    /* --- Secciones de suite (breadcrumb) --- */
    .seccion-suite {
        background: #1F5C8C; color: #fff; padding: 8px 12px; border-radius: 6px;
        font-size: 13px; font-weight: bold; margin-top: 26px; page-break-after: avoid;
    }

    /* --- Portada --- */
    .portada { text-align: center; padding-top: 130px; }
    .portada .marca-grande { color: #1F5C8C; font-size: 16px; letter-spacing: 6px; font-weight: bold; }
    .portada .linea-decorativa { width: 70px; height: 3px; background: #3FA9D1; margin: 18px auto 22px auto; }
    .portada .etiqueta-portada { color: #9ca3af; font-size: 11px; letter-spacing: 2px; margin-bottom: 6px; }
    .portada h1 { font-size: 30px; margin-top: 0; }
    .portada .subtitulo { color: #6b7280; font-size: 13px; margin-top: 4px; }
    .portada .fecha { color: #9ca3af; font-size: 11px; margin-top: 40px; }

    .stats-grid { margin: 40px auto 0 auto; width: 80%; }
    .stat-caja {
        float: left; width: 21%; margin: 0 2%; padding: 14px 6px;
        border-radius: 8px; background: #f3f6f9; text-align: center;
    }
    .stat-caja .valor { font-size: 22px; font-weight: bold; color: #14314a; }
    .stat-caja .etiqueta { font-size: 9.5px; color: #6b7280; margin-top: 2px; }
    .stat-caja.exitoso .valor { color: #588424; }
    .stat-caja.fallido .valor { color: #b91c1c; }
    .stat-caja.bloqueado .valor { color: #b5650a; }

    /* --- Índice --- */
    .indice-seccion { margin-top: 14px; }
    .indice-seccion .nombre-suite { font-weight: bold; color: #1F5C8C; font-size: 12.5px; }
    .indice-caso {
        padding: 4px 0 4px 16px; font-size: 11.5px;
        border-bottom: 1px dotted #e5e7eb;
    }

    .pagebreak { page-break-before: always; }
</style>
