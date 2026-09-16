import React, { useState } from "react";
import AppLayout from "@/Layouts/AppLayout";
import { Head, Link, router, useForm, usePage } from "@inertiajs/react";

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

export default function EjecutarCaso({ caso, estados, puedeEliminar }) {
    const { flash } = usePage().props;
    const [mostrarForm, setMostrarForm] = useState(caso.ejecuciones.length === 0);

    const { data, setData, post, processing, errors, reset } = useForm({
        estado: "Exitoso",
        ambiente: "",
        observaciones: "",
        pasos: caso.pasos.map((p) => ({
            test_caso_paso_id: p.id,
            resultado: "Pasa",
            observacion: "",
            capturas: [],
        })),
    });

    const actualizarPaso = (idx, campo, valor) => {
        setData(
            "pasos",
            data.pasos.map((p, i) => (i === idx ? { ...p, [campo]: valor } : p))
        );
    };

    const submit = (e) => {
        e.preventDefault();
        post(route("test-ejecuciones.store", caso.id), {
            forceFormData: true,
            onSuccess: () => {
                reset();
                setMostrarForm(false);
            },
        });
    };

    const eliminarEjecucion = (id) => {
        if (!confirm("¿Eliminar esta ejecución y sus capturas? Esta acción no se puede deshacer.")) return;
        router.delete(route("test-ejecuciones.destroy", id), { preserveScroll: true });
    };

    return (
        <AppLayout>
            <Head title={caso.titulo} />

            <div className="min-h-screen bg-gray-100">
                <div className="sticky top-0 z-10 bg-white border-b shadow-sm">
                    <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
                        <div>
                            <Link
                                href={route("test-ejecuciones.index", { suite_id: caso.suite_id })}
                                className="text-sm text-brand-mango hover:underline"
                            >
                                ← Volver a Ejecutar Casos de Prueba
                            </Link>
                            <h1 className="text-2xl font-bold mt-1">▶️ {caso.titulo}</h1>
                        </div>
                    </div>
                </div>

                {flash?.success && (
                    <div className="max-w-5xl mx-auto px-6 pt-4">
                        <div className="bg-green-50 text-green-700 px-4 py-2 rounded">{flash.success}</div>
                    </div>
                )}

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
                            <p className="text-sm text-gray-600">
                                <strong>Preparación del entorno:</strong> {caso.preparacion_entorno}
                            </p>
                        )}
                    </div>

                    {!mostrarForm && (
                        <button
                            onClick={() => setMostrarForm(true)}
                            className="bg-gradient-to-r from-brand-blue to-brand-blue-mid hover:from-brand-blue-dark hover:to-brand-blue text-white px-5 py-2 rounded-lg"
                        >
                            ▶️ Nueva ejecución
                        </button>
                    )}

                    {mostrarForm && (
                        <form onSubmit={submit} className="bg-white rounded-xl shadow p-6 space-y-4">
                            <h2 className="text-lg font-semibold">Nueva ejecución</h2>

                            <div className="space-y-3">
                                {caso.pasos.map((p, idx) => (
                                    <div key={p.id} className="border rounded-lg p-3">
                                        <p className="text-sm font-semibold">
                                            Paso {idx + 1}: {p.paso}
                                        </p>
                                        {p.resultado_esperado && (
                                            <p className="text-xs text-gray-500 mt-1">
                                                Resultado esperado: {p.resultado_esperado}
                                            </p>
                                        )}

                                        <div className="mt-2 flex flex-wrap gap-3 items-center">
                                            <select
                                                className="border px-2 py-1.5 rounded text-sm"
                                                value={data.pasos[idx].resultado}
                                                onChange={(e) => actualizarPaso(idx, "resultado", e.target.value)}
                                            >
                                                <option value="Pasa">✅ Pasa</option>
                                                <option value="Falla">❌ Falla</option>
                                                <option value="N/A">➖ N/A</option>
                                            </select>

                                            <input
                                                type="file"
                                                multiple
                                                accept="image/*,video/*"
                                                className="text-xs"
                                                onChange={(e) =>
                                                    actualizarPaso(idx, "capturas", Array.from(e.target.files))
                                                }
                                            />
                                            {data.pasos[idx].capturas.length > 0 && (
                                                <span className="text-xs text-gray-400">
                                                    {data.pasos[idx].capturas.length} archivo(s)
                                                </span>
                                            )}
                                        </div>

                                        <textarea
                                            rows={2}
                                            placeholder="Observación de este paso (opcional)"
                                            className="w-full border px-2 py-1.5 rounded text-sm mt-2"
                                            value={data.pasos[idx].observacion}
                                            onChange={(e) => actualizarPaso(idx, "observacion", e.target.value)}
                                        />
                                    </div>
                                ))}
                            </div>

                            <div className="border-t pt-4">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Resultado general del caso
                                </label>
                                <div className="flex gap-3 mb-3">
                                    {estados.map((es) => (
                                        <label
                                            key={es}
                                            className={`px-4 py-2 rounded-lg cursor-pointer text-sm border ${
                                                data.estado === es
                                                    ? "border-brand-blue bg-brand-blue/10"
                                                    : "border-gray-200"
                                            }`}
                                        >
                                            <input
                                                type="radio"
                                                name="estado"
                                                className="hidden"
                                                checked={data.estado === es}
                                                onChange={() => setData("estado", es)}
                                            />
                                            {es}
                                        </label>
                                    ))}
                                </div>

                                <input
                                    type="text"
                                    placeholder="Ambiente probado (opcional, ej: QA, Staging)"
                                    className="w-full border px-3 py-2 rounded-lg text-sm mb-2"
                                    value={data.ambiente}
                                    onChange={(e) => setData("ambiente", e.target.value)}
                                />

                                <textarea
                                    rows={2}
                                    placeholder="Observaciones generales (opcional)"
                                    className="w-full border px-3 py-2 rounded-lg text-sm"
                                    value={data.observaciones}
                                    onChange={(e) => setData("observaciones", e.target.value)}
                                />
                            </div>

                            <div className="flex justify-end gap-3">
                                {caso.ejecuciones.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => setMostrarForm(false)}
                                        className="text-sm text-gray-500 px-4"
                                    >
                                        Cancelar
                                    </button>
                                )}
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="bg-gradient-to-r from-brand-blue to-brand-blue-mid hover:from-brand-blue-dark hover:to-brand-blue text-white px-6 py-2 rounded-lg"
                                >
                                    {processing ? "Guardando..." : "Registrar ejecución"}
                                </button>
                            </div>
                        </form>
                    )}

                    <div className="bg-white rounded-xl shadow p-6">
                        <h2 className="text-lg font-semibold mb-4">🕘 Historial de ejecuciones</h2>

                        {caso.ejecuciones.length === 0 && (
                            <p className="text-sm text-gray-400">Todavía no hay ejecuciones registradas.</p>
                        )}

                        <div className="space-y-3">
                            {caso.ejecuciones.map((ej) => (
                                <div key={ej.id} className="border rounded-lg p-4">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <span
                                                className={`text-xs px-3 py-1 rounded-full ${estadoColor[ej.estado]}`}
                                            >
                                                {ej.estado}
                                            </span>
                                            <span className="text-sm text-gray-500">
                                                {fmtFecha(ej.ejecutado_en)} por {ej.ejecutor?.name}{" "}
                                                {ej.ejecutor?.apellido}
                                            </span>
                                        </div>
                                        <div className="flex gap-3 text-sm">
                                            <Link
                                                href={route("test-visualizar.show", caso.id)}
                                                className="text-brand-blue hover:underline"
                                            >
                                                Ver detalle
                                            </Link>
                                            {puedeEliminar && (
                                                <button
                                                    onClick={() => eliminarEjecucion(ej.id)}
                                                    className="text-red-600 hover:underline"
                                                >
                                                    Eliminar
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    {ej.observaciones && (
                                        <p className="text-sm text-gray-600 mt-2">{ej.observaciones}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
