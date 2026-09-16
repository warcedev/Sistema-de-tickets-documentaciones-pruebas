import React, { useRef, useState } from "react";

function formatBytes(bytes) {
    if (!bytes && bytes !== 0) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function Lightbox({ src, nombre, onClose }) {
    return (
        <div
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 animate-fade-in"
            onClick={onClose}
        >
            <button
                onClick={onClose}
                className="absolute top-4 right-4 text-white text-3xl leading-none hover:text-brand-mango hover:rotate-90"
                aria-label="Cerrar"
            >
                ✕
            </button>
            <img
                src={src}
                alt={nombre}
                className="max-w-[90vw] max-h-[90vh] object-contain rounded shadow-2xl animate-scale-in"
                onClick={(e) => e.stopPropagation()}
            />
        </div>
    );
}

export default function AdjuntoPreview({ adjunto, verUrl, downloadUrl, onDelete, size = "sm" }) {
    const [lightboxAbierto, setLightboxAbierto] = useState(false);
    const videoRef = useRef(null);
    const grande = size === "lg";

    const esImagen = adjunto.mime?.startsWith("image/");
    const esVideo = adjunto.mime?.startsWith("video/");

    const abrirPantallaCompleta = () => {
        const el = videoRef.current;
        if (!el) return;
        if (el.requestFullscreen) el.requestFullscreen();
        else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    };

    if (esImagen) {
        if (grande) {
            return (
                <div className="border rounded-lg p-2">
                    <img
                        src={verUrl}
                        alt={adjunto.nombre_original}
                        onClick={() => setLightboxAbierto(true)}
                        className="w-full max-h-96 object-contain rounded cursor-zoom-in hover:opacity-90 hover:scale-[1.01] bg-gray-50"
                        title="Ver a pantalla completa"
                    />
                    <div className="flex justify-between items-center mt-2">
                        <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{adjunto.nombre_original}</p>
                            <p className="text-xs text-gray-400">{formatBytes(adjunto.size)}</p>
                        </div>
                        <div className="flex gap-3 text-xs shrink-0 ml-2">
                            <button
                                onClick={() => setLightboxAbierto(true)}
                                className="text-brand-blue hover:underline"
                            >
                                ⛶ Pantalla completa
                            </button>
                            {onDelete && (
                                <button onClick={onDelete} className="text-red-600 hover:underline">
                                    Eliminar
                                </button>
                            )}
                        </div>
                    </div>
                    {lightboxAbierto && (
                        <Lightbox
                            src={verUrl}
                            nombre={adjunto.nombre_original}
                            onClose={() => setLightboxAbierto(false)}
                        />
                    )}
                </div>
            );
        }

        return (
            <div className="flex items-center gap-3 border rounded-lg p-2">
                <img
                    src={verUrl}
                    alt={adjunto.nombre_original}
                    onClick={() => setLightboxAbierto(true)}
                    className="w-20 h-20 object-cover rounded cursor-pointer hover:opacity-80 hover:scale-105"
                    title="Ver a pantalla completa"
                />
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{adjunto.nombre_original}</p>
                    <p className="text-xs text-gray-400">{formatBytes(adjunto.size)}</p>
                    <div className="flex gap-3 mt-1 text-xs">
                        <button
                            onClick={() => setLightboxAbierto(true)}
                            className="text-brand-blue hover:underline"
                        >
                            ⛶ Pantalla completa
                        </button>
                        {onDelete && (
                            <button onClick={onDelete} className="text-red-600 hover:underline">
                                Eliminar
                            </button>
                        )}
                    </div>
                </div>
                {lightboxAbierto && (
                    <Lightbox
                        src={verUrl}
                        nombre={adjunto.nombre_original}
                        onClose={() => setLightboxAbierto(false)}
                    />
                )}
            </div>
        );
    }

    if (esVideo) {
        return (
            <div className={`border rounded-lg p-2 ${grande ? "" : "max-w-xs"}`}>
                <video ref={videoRef} src={verUrl} controls className="w-full rounded" />
                <div className="flex justify-between items-center mt-1">
                    <p className="text-sm font-medium truncate">{adjunto.nombre_original}</p>
                </div>
                <p className="text-xs text-gray-400">{formatBytes(adjunto.size)}</p>
                <div className="flex gap-3 mt-1 text-xs">
                    <button onClick={abrirPantallaCompleta} className="text-brand-blue hover:underline">
                        ⛶ Pantalla completa
                    </button>
                    {onDelete && (
                        <button onClick={onDelete} className="text-red-600 hover:underline">
                            Eliminar
                        </button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="flex justify-between items-center border rounded-lg p-2 text-sm">
            <a href={downloadUrl} className="text-brand-blue hover:underline truncate">
                📄 {adjunto.nombre_original}
            </a>
            <div className="flex items-center gap-3 text-xs shrink-0 ml-2">
                <span className="text-gray-400">{formatBytes(adjunto.size)}</span>
                {onDelete && (
                    <button onClick={onDelete} className="text-red-600 hover:underline">
                        Eliminar
                    </button>
                )}
            </div>
        </div>
    );
}
