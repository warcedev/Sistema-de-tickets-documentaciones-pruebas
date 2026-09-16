import React from "react";
import AppLayout from "@/Layouts/AppLayout";
import { Head, Link } from "@inertiajs/react";
import AdjuntoPreview from "@/Components/AdjuntoPreview";

const estadoColor = {
    Exitoso: "bg-brand-lime/30 text-green-700",
    Fallido: "bg-red-100 text-red-700",
    Bloqueado: "bg-brand-peach text-brand-blue",
};

const resultadoColor = {
    Pasa: "bg-brand-lime/30 text-green-700",
    Falla: "bg-red-100 text-red-700",
    "N/A": "bg-gray-100 text-gray-500",
};

function fmtFecha(v) {
    if (!v) return "—";
    return new Date(v).toLocaleString();
}

export default function VisualizarCaso({ caso }) {
    return (
        <AppLayout>
            <Head title={caso.titulo} />

            <div className="min-h-screen bg-gray-100">
                <div className="sticky top-0 z-10 bg-white border-b shadow-sm">
                    <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
                        <div>
                            <Link
                                href={route("test-visualizar.index", { suite_id: caso.suite_id })}
                                className="text-sm text-brand-mango hover:underline"
                            >
                                ← Volver a Visualizar Casos de Prueba
                            </Link>
                            <h1 className="text-2xl font-bold mt-1">👁️ {caso.titulo}</h1>
                            <p className="text-sm text-gray-500">Suite: {caso.suite?.nombre}</p>
                        </div>

                        {caso.ejecuciones.length > 0 && (
                            <a
                                href={route("test-visualizar.pdf-caso", caso.id)}
                                className="bg-gradient-to-r from-brand-blue to-brand-blue-mid hover:from-brand-blue-dark hover:to-brand-blue text-white px-4 py-2 rounded-lg text-sm"
                            >
                                📄 Exportar historial completo (PDF)
                            </a>
                        )}
                    </div>
                </div>

                <div className="max-w-5xl mx-auto px-6 py-6 space-y-6">
                    <div className="bg-white rounded-xl shadow p-6">
                        {(caso.ticket || caso.redmine_numero) && (
                            <p className="text-sm mb-2">
                                <strong>Ticket:</strong>{" "}
                                {caso.ticket ? (
                                    <Link
                                        href={route("tickets.show", caso.ticket.id)}
                                        className="text-brand-blue hover:underline"
                                    >
                                        🎫 #{caso.ticket.numero} — {caso.ticket.titulo}
                                    </Link>
                                ) : (
                                    <a
                                        href={caso.redmine_url || "#"}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-brand-blue hover:underline"
                                    >
                                        🌐 Redmine #{caso.redmine_numero}
                                    </a>
                                )}
                            </p>
                        )}
                        {caso.descripcion && (
                            <p className="text-sm text-gray-600 mb-2">
                                <strong>Por qué:</strong> {caso.descripcion}
                            </p>
                        )}
                        {caso.preparacion_entorno && (
                            <p className="text-sm text-gray-600 mb-2">
                                <strong>Preparación del entorno:</strong> {caso.preparacion_entorno}
                            </p>
                        )}
                        <p className="text-sm text-gray-600">
                            <strong>Pasos definidos:</strong> {caso.pasos.length}
                        </p>
                    </div>

                    <h2 className="text-lg font-semibold">🕘 Historial de ejecuciones</h2>

                    {caso.ejecuciones.length === 0 && (
                        <div className="bg-white rounded-xl shadow p-6">
                            <p className="text-sm text-gray-400">
                                Todavía no hay ejecuciones registradas para este caso.
                            </p>
                        </div>
                    )}

                    {caso.ejecuciones.map((ej) => (
                        <div key={ej.id} className="bg-white rounded-xl shadow p-6">
                            <div className="flex justify-between items-center mb-4">
                                <div className="flex items-center gap-3">
                                    <span
                                        className={`text-sm px-3 py-1 rounded-full ${estadoColor[ej.estado]}`}
                                    >
                                        {ej.estado}
                                    </span>
                                    <span className="text-sm text-gray-500">
                                        {fmtFecha(ej.ejecutado_en)} por {ej.ejecutor?.name}{" "}
                                        {ej.ejecutor?.apellido}
                                    </span>
                                    {ej.ambiente && (
                                        <span className="text-xs text-gray-400">· {ej.ambiente}</span>
                                    )}
                                </div>
                                <a
                                    href={route("test-visualizar.pdf", ej.id)}
                                    className="text-sm text-brand-blue hover:underline"
                                >
                                    📄 Exportar PDF
                                </a>
                            </div>

                            {ej.observaciones && (
                                <p className="text-sm text-gray-600 mb-4">{ej.observaciones}</p>
                            )}

                            <div className="space-y-3">
                                {ej.pasos.map((p, idx) => (
                                    <div key={p.id} className="border rounded-lg p-3">
                                        <div className="flex justify-between items-start gap-3">
                                            <div>
                                                <p className="text-sm font-semibold">
                                                    Paso {idx + 1}: {p.paso}
                                                </p>
                                                {p.resultado_esperado && (
                                                    <p className="text-xs text-gray-500 mt-0.5">
                                                        Esperado: {p.resultado_esperado}
                                                    </p>
                                                )}
                                            </div>
                                            <span
                                                className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
                                                    resultadoColor[p.resultado]
                                                }`}
                                            >
                                                {p.resultado}
                                            </span>
                                        </div>

                                        {p.observacion && (
                                            <p className="text-sm text-gray-600 mt-2">{p.observacion}</p>
                                        )}

                                        {p.adjuntos?.length > 0 && (
                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-3">
                                                {p.adjuntos.map((a) => (
                                                    <AdjuntoPreview
                                                        key={a.id}
                                                        adjunto={a}
                                                        size="lg"
                                                        verUrl={route("test-ejecuciones.adjuntos.ver", a.id)}
                                                        downloadUrl={route(
                                                            "test-ejecuciones.adjuntos.download",
                                                            a.id
                                                        )}
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </AppLayout>
    );
}
