import React, { useState } from "react";
import AppLayout from "@/Layouts/AppLayout";
import { Head, Link, useForm } from "@inertiajs/react";
import TicketPicker from "@/Components/TicketPicker";
import KebabMenu from "@/Components/KebabMenu";

const pasoVacio = () => ({ paso: "", resultado_esperado: "" });

export default function CasoForm({ suite, caso, prioridades, tickets }) {
    const esEdicion = !!caso;

    const [origenTicket, setOrigenTicket] = useState(() => {
        if (caso?.ticket_id) return "sistema";
        if (caso?.redmine_numero || caso?.redmine_url) return "redmine";
        return "ninguno";
    });

    const { data, setData, post, put, processing, errors } = useForm({
        titulo: caso?.titulo || "",
        descripcion: caso?.descripcion || "",
        preparacion_entorno: caso?.preparacion_entorno || "",
        prioridad: caso?.prioridad || "Normal",
        ticket_id: caso?.ticket_id || null,
        redmine_numero: caso?.redmine_numero || "",
        redmine_url: caso?.redmine_url || "",
        pasos:
            caso?.pasos?.length > 0
                ? caso.pasos.map((p) => ({ paso: p.paso, resultado_esperado: p.resultado_esperado || "" }))
                : [{ paso: "", resultado_esperado: "" }],
    });

    const actualizarPaso = (idx, campo, valor) => {
        setData(
            "pasos",
            data.pasos.map((p, i) => (i === idx ? { ...p, [campo]: valor } : p))
        );
    };

    const agregarPaso = () => {
        setData("pasos", [...data.pasos, pasoVacio()]);
    };

    const eliminarPaso = (idx) => {
        if (data.pasos.length === 1) return;
        setData(
            "pasos",
            data.pasos.filter((_, i) => i !== idx)
        );
    };

    const insertarPasoArriba = (idx) => {
        const nuevos = [...data.pasos];
        nuevos.splice(idx, 0, pasoVacio());
        setData("pasos", nuevos);
    };

    const insertarPasoAbajo = (idx) => {
        const nuevos = [...data.pasos];
        nuevos.splice(idx + 1, 0, pasoVacio());
        setData("pasos", nuevos);
    };

    const elegirOrigen = (origen) => {
        setOrigenTicket(origen);
        if (origen !== "sistema") setData("ticket_id", null);
        if (origen !== "redmine") {
            setData("redmine_numero", "");
            setData("redmine_url", "");
        }
    };

    const submit = (e) => {
        e.preventDefault();
        if (esEdicion) {
            put(route("test-casos.update", caso.id));
        } else {
            post(route("test-casos.store", suite.id));
        }
    };

    return (
        <AppLayout>
            <Head title={esEdicion ? "Editar caso de prueba" : "Nuevo caso de prueba"} />

            <div className="max-w-3xl mx-auto bg-white p-6 mt-10 mb-10 rounded shadow">
                <h1 className="text-2xl font-bold mb-1">
                    {esEdicion ? "✏️ Editar caso de prueba" : "➕ Nuevo caso de prueba"}
                </h1>
                <p className="text-sm text-gray-500 mb-6">Suite: {suite.nombre}</p>

                <form onSubmit={submit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Título</label>
                        <input
                            type="text"
                            className="w-full border px-3 py-2 rounded-lg"
                            value={data.titulo}
                            onChange={(e) => setData("titulo", e.target.value)}
                        />
                        {errors.titulo && <p className="text-red-600 text-sm mt-1">{errors.titulo}</p>}
                    </div>

                    <div className="border rounded-lg p-3">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Ticket relacionado (opcional)
                        </label>

                        <div className="flex gap-2 mb-2">
                            <button
                                type="button"
                                onClick={() => elegirOrigen(origenTicket === "sistema" ? "ninguno" : "sistema")}
                                className={`text-xs px-3 py-1.5 rounded-full border ${
                                    origenTicket === "sistema"
                                        ? "bg-brand-blue text-white border-brand-blue"
                                        : "border-gray-300 text-gray-600"
                                }`}
                            >
                                🎫 Ticket del sistema
                            </button>
                            <button
                                type="button"
                                onClick={() => elegirOrigen(origenTicket === "redmine" ? "ninguno" : "redmine")}
                                className={`text-xs px-3 py-1.5 rounded-full border ${
                                    origenTicket === "redmine"
                                        ? "bg-brand-blue text-white border-brand-blue"
                                        : "border-gray-300 text-gray-600"
                                }`}
                            >
                                🌐 Ticket de Redmine (externo)
                            </button>
                        </div>

                        {origenTicket === "sistema" && (
                            <TicketPicker
                                tickets={tickets}
                                ticketId={data.ticket_id}
                                ticketLabel={caso?.ticket ? `#${caso.ticket.numero} — ${caso.ticket.titulo}` : null}
                                onChange={(id) => setData("ticket_id", id)}
                            />
                        )}

                        {origenTicket === "redmine" && (
                            <div className="space-y-2">
                                <input
                                    type="text"
                                    placeholder="Número de ticket de Redmine (ej: 343915)"
                                    className="w-full border px-3 py-2 rounded-lg text-sm"
                                    value={data.redmine_numero}
                                    onChange={(e) => setData("redmine_numero", e.target.value)}
                                />
                                <input
                                    type="text"
                                    placeholder="Link del ticket en Redmine"
                                    className="w-full border px-3 py-2 rounded-lg text-sm"
                                    value={data.redmine_url}
                                    onChange={(e) => setData("redmine_url", e.target.value)}
                                />
                            </div>
                        )}

                        {origenTicket === "ninguno" && (
                            <p className="text-xs text-gray-400">
                                Este caso de prueba no está vinculado a ningún ticket.
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                            Justificación del caso (por qué existe este caso de prueba)
                        </label>
                        <textarea
                            rows={2}
                            className="w-full border px-3 py-2 rounded-lg"
                            value={data.descripcion}
                            onChange={(e) => setData("descripcion", e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                            Preparación del entorno de prueba
                        </label>
                        <textarea
                            rows={2}
                            className="w-full border px-3 py-2 rounded-lg"
                            placeholder="Datos, usuarios, configuración necesaria antes de ejecutar el caso..."
                            value={data.preparacion_entorno}
                            onChange={(e) => setData("preparacion_entorno", e.target.value)}
                        />
                    </div>

                    <div className="w-40">
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Prioridad</label>
                        <select
                            className="w-full border px-3 py-2 rounded-lg"
                            value={data.prioridad}
                            onChange={(e) => setData("prioridad", e.target.value)}
                        >
                            {prioridades.map((p) => (
                                <option key={p} value={p}>
                                    {p}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="border-t pt-4">
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-semibold text-gray-700">
                                Pasos del caso de prueba
                            </label>
                            <button
                                type="button"
                                onClick={agregarPaso}
                                className="text-sm text-brand-blue hover:underline"
                            >
                                + Agregar paso
                            </button>
                        </div>

                        <div className="space-y-3">
                            {data.pasos.map((p, idx) => (
                                <div key={idx} className="border rounded-lg p-3">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-xs font-semibold text-gray-500">
                                            Paso {idx + 1}
                                        </span>
                                        <KebabMenu
                                            items={[
                                                {
                                                    label: "↑ Insertar paso arriba",
                                                    onClick: () => insertarPasoArriba(idx),
                                                },
                                                {
                                                    label: "↓ Insertar paso abajo",
                                                    onClick: () => insertarPasoAbajo(idx),
                                                },
                                                ...(data.pasos.length > 1
                                                    ? [
                                                          { divider: true },
                                                          {
                                                              label: "Eliminar paso",
                                                              danger: true,
                                                              onClick: () => eliminarPaso(idx),
                                                          },
                                                      ]
                                                    : []),
                                            ]}
                                        />
                                    </div>
                                    <textarea
                                        rows={2}
                                        placeholder="¿Qué hay que hacer en este paso?"
                                        className="w-full border px-2 py-1.5 rounded text-sm mb-2"
                                        value={p.paso}
                                        onChange={(e) => actualizarPaso(idx, "paso", e.target.value)}
                                    />
                                    <textarea
                                        rows={2}
                                        placeholder="Resultado esperado"
                                        className="w-full border px-2 py-1.5 rounded text-sm"
                                        value={p.resultado_esperado}
                                        onChange={(e) =>
                                            actualizarPaso(idx, "resultado_esperado", e.target.value)
                                        }
                                    />
                                </div>
                            ))}
                        </div>
                        {errors.pasos && <p className="text-red-600 text-sm mt-2">{errors.pasos}</p>}
                    </div>

                    <div className="flex justify-between items-center pt-4">
                        <Link
                            href={route("test-suites.index", { suite_id: suite.id })}
                            className="text-sm text-gray-600 hover:underline"
                        >
                            ← Cancelar
                        </Link>
                        <button
                            type="submit"
                            disabled={processing}
                            className="bg-gradient-to-r from-brand-blue to-brand-blue-mid hover:from-brand-blue-dark hover:to-brand-blue text-white px-6 py-2 rounded-lg"
                        >
                            {processing ? "Guardando..." : esEdicion ? "Guardar cambios" : "Crear caso de prueba"}
                        </button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
