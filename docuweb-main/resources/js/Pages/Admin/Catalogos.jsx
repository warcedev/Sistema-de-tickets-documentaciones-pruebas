import React, { useState } from "react";
import { useForm, usePage } from "@inertiajs/react";
import AppLayout from "@/Layouts/AppLayout";

export default function Catalogos({ tags, departamentos, proyectos, ticketEstados }) {
    const { flash } = usePage().props;
    const [tab, setTab] = useState("tags");

    const tagForm = useForm({ descripcion: "" });
    const depForm = useForm({ nombre: "" });
    const proyectoForm = useForm({ nombre: "", descripcion: "" });
    const estadoForm = useForm({
        nombre: "",
        color: "#6B7280",
        es_inicial: false,
        es_final: false,
        es_prueba: false,
        es_prueba_finalizada: false,
    });

    return (
        <AppLayout>
            <div className="max-w-5xl mx-auto p-6 bg-white rounded shadow">
                <h1 className="text-2xl font-bold mb-4">
                    🗂️ Administración de Catálogos
                </h1>

                {flash?.success && (
                    <div className="mb-4 p-3 bg-brand-lime/15 text-brand-blue rounded">
                        {flash.success}
                    </div>
                )}

                {/* TABS */}
                <div className="flex gap-4 mb-6">
                    <button
                        onClick={() => setTab("tags")}
                        className={`px-4 py-2 rounded ${
                            tab === "tags"
                                ? "bg-gradient-to-r from-brand-blue to-brand-blue-mid text-white"
                                : "bg-gray-200"
                        }`}
                    >
                        🏷️ Tags
                    </button>

                    <button
                        onClick={() => setTab("departamentos")}
                        className={`px-4 py-2 rounded ${
                            tab === "departamentos"
                                ? "bg-gradient-to-r from-brand-blue to-brand-blue-mid text-white"
                                : "bg-gray-200"
                        }`}
                    >
                        🏢 Departamentos
                    </button>

                    <button
                        onClick={() => setTab("proyectos")}
                        className={`px-4 py-2 rounded ${
                            tab === "proyectos"
                                ? "bg-gradient-to-r from-brand-blue to-brand-blue-mid text-white"
                                : "bg-gray-200"
                        }`}
                    >
                        📁 Proyectos
                    </button>

                    <button
                        onClick={() => setTab("estados")}
                        className={`px-4 py-2 rounded ${
                            tab === "estados"
                                ? "bg-gradient-to-r from-brand-blue to-brand-blue-mid text-white"
                                : "bg-gray-200"
                        }`}
                    >
                        🎫 Estados de Tickets
                    </button>
                </div>

                {/* TAGS */}
                {tab === "tags" && (
                    <>
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                tagForm.post(route("admin.tags.store"));
                            }}
                            className="flex gap-2 mb-4"
                        >
                            <input
                                className="border rounded px-3 py-2 flex-1"
                                placeholder="Nuevo tag"
                                value={tagForm.data.descripcion}
                                onChange={(e) =>
                                    tagForm.setData(
                                        "descripcion",
                                        e.target.value
                                    )
                                }
                            />
                            <button className="bg-gradient-to-r from-brand-blue to-brand-blue-mid text-white px-4 rounded">
                                Crear
                            </button>
                        </form>

                        {tags.map((t) => (
                            <div
                                key={t.id}
                                className="flex justify-between border-b py-2"
                            >
                                <span>{t.descripcion}</span>
                                <button
                                    onClick={() =>
                                        tagForm.patch(
                                            route(
                                                "admin.tags.toggle",
                                                t.id
                                            )
                                        )
                                    }
                                    className={`px-3 py-1 rounded text-sm ${
                                        t.estado
                                            ? "bg-brand-lime/20 text-brand-blue"
                                            : "bg-red-100 text-red-700"
                                    }`}
                                >
                                    {t.estado ? "Activo" : "Inactivo"}
                                </button>
                            </div>
                        ))}
                    </>
                )}

                {/* DEPARTAMENTOS */}
                {tab === "departamentos" && (
                    <>
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                depForm.post(
                                    route(
                                        "admin.departamentos.store"
                                    )
                                );
                            }}
                            className="flex gap-2 mb-4"
                        >
                            <input
                                className="border rounded px-3 py-2 flex-1"
                                placeholder="Nuevo departamento"
                                value={depForm.data.nombre}
                                onChange={(e) =>
                                    depForm.setData(
                                        "nombre",
                                        e.target.value
                                    )
                                }
                            />
                            <button className="bg-gradient-to-r from-brand-blue to-brand-blue-mid text-white px-4 rounded">
                                Crear
                            </button>
                        </form>

                        {departamentos.map((d) => (
                            <div
                                key={d.id}
                                className="flex justify-between border-b py-2"
                            >
                                <span>{d.nombre}</span>
                                <button
                                    onClick={() =>
                                        depForm.patch(
                                            route(
                                                "admin.departamentos.toggle",
                                                d.id
                                            )
                                        )
                                    }
                                    className={`px-3 py-1 rounded text-sm ${
                                        d.estado
                                            ? "bg-brand-lime/20 text-brand-blue"
                                            : "bg-red-100 text-red-700"
                                    }`}
                                >
                                    {d.estado ? "Activo" : "Inactivo"}
                                </button>
                            </div>
                        ))}
                    </>
                )}

                {/* PROYECTOS */}
                {tab === "proyectos" && (
                    <>
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                proyectoForm.post(route("admin.proyectos.store"), {
                                    onSuccess: () => proyectoForm.reset(),
                                });
                            }}
                            className="flex gap-2 mb-4"
                        >
                            <input
                                className="border rounded px-3 py-2 flex-1"
                                placeholder="Nombre del proyecto"
                                value={proyectoForm.data.nombre}
                                onChange={(e) =>
                                    proyectoForm.setData("nombre", e.target.value)
                                }
                            />
                            <input
                                className="border rounded px-3 py-2 flex-1"
                                placeholder="Descripción (opcional)"
                                value={proyectoForm.data.descripcion}
                                onChange={(e) =>
                                    proyectoForm.setData("descripcion", e.target.value)
                                }
                            />
                            <button className="bg-gradient-to-r from-brand-blue to-brand-blue-mid text-white px-4 rounded">
                                Crear
                            </button>
                        </form>

                        {proyectos.map((p) => (
                            <div
                                key={p.id}
                                className="flex justify-between border-b py-2"
                            >
                                <span>
                                    {p.nombre}
                                    {p.descripcion && (
                                        <span className="text-gray-400 text-sm ml-2">
                                            — {p.descripcion}
                                        </span>
                                    )}
                                </span>
                                <button
                                    onClick={() =>
                                        proyectoForm.patch(
                                            route("admin.proyectos.toggle", p.id)
                                        )
                                    }
                                    className={`px-3 py-1 rounded text-sm ${
                                        p.activo
                                            ? "bg-brand-lime/20 text-brand-blue"
                                            : "bg-red-100 text-red-700"
                                    }`}
                                >
                                    {p.activo ? "Activo" : "Inactivo"}
                                </button>
                            </div>
                        ))}
                    </>
                )}

                {/* ESTADOS DE TICKETS */}
                {tab === "estados" && (
                    <>
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                estadoForm.post(route("admin.ticket-estados.store"), {
                                    onSuccess: () => estadoForm.reset(),
                                });
                            }}
                            className="flex flex-wrap gap-2 mb-4 items-center"
                        >
                            <input
                                className="border rounded px-3 py-2 flex-1"
                                placeholder="Nombre del estado"
                                value={estadoForm.data.nombre}
                                onChange={(e) =>
                                    estadoForm.setData("nombre", e.target.value)
                                }
                            />
                            <input
                                type="color"
                                className="border rounded h-10 w-14"
                                value={estadoForm.data.color}
                                onChange={(e) =>
                                    estadoForm.setData("color", e.target.value)
                                }
                            />
                            <label className="flex items-center gap-1 text-sm">
                                <input
                                    type="checkbox"
                                    checked={estadoForm.data.es_inicial}
                                    onChange={(e) =>
                                        estadoForm.setData(
                                            "es_inicial",
                                            e.target.checked
                                        )
                                    }
                                />
                                Inicial
                            </label>
                            <label className="flex items-center gap-1 text-sm">
                                <input
                                    type="checkbox"
                                    checked={estadoForm.data.es_final}
                                    onChange={(e) =>
                                        estadoForm.setData(
                                            "es_final",
                                            e.target.checked
                                        )
                                    }
                                />
                                Final (cierra el ticket)
                            </label>
                            <label className="flex items-center gap-1 text-sm">
                                <input
                                    type="checkbox"
                                    checked={estadoForm.data.es_prueba}
                                    onChange={(e) =>
                                        estadoForm.setData(
                                            "es_prueba",
                                            e.target.checked
                                        )
                                    }
                                />
                                En prueba/testing
                            </label>
                            <label className="flex items-center gap-1 text-sm">
                                <input
                                    type="checkbox"
                                    checked={estadoForm.data.es_prueba_finalizada}
                                    onChange={(e) =>
                                        estadoForm.setData(
                                            "es_prueba_finalizada",
                                            e.target.checked
                                        )
                                    }
                                />
                                Prueba finalizada
                            </label>
                            <button className="bg-gradient-to-r from-brand-blue to-brand-blue-mid text-white px-4 py-2 rounded">
                                Crear
                            </button>
                        </form>

                        {ticketEstados.map((es) => (
                            <div
                                key={es.id}
                                className="flex justify-between items-center border-b py-2"
                            >
                                <span className="flex items-center gap-2">
                                    <span
                                        className="w-3 h-3 rounded-full inline-block"
                                        style={{ backgroundColor: es.color }}
                                    />
                                    {es.nombre}
                                    {es.es_inicial && (
                                        <span className="text-xs text-gray-400">
                                            (inicial)
                                        </span>
                                    )}
                                    {es.es_final && (
                                        <span className="text-xs text-gray-400">
                                            (final)
                                        </span>
                                    )}
                                    {es.es_prueba && (
                                        <span className="text-xs text-brand-blue">
                                            (prueba)
                                        </span>
                                    )}
                                    {es.es_prueba_finalizada && (
                                        <span className="text-xs text-brand-lime">
                                            (prueba finalizada)
                                        </span>
                                    )}
                                </span>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() =>
                                            estadoForm.patch(
                                                route(
                                                    "admin.ticket-estados.toggle-prueba",
                                                    es.id
                                                )
                                            )
                                        }
                                        title="Marca este estado como parte del flujo de testing/QA, para que se cuente en el dashboard de Reportes"
                                        className={`px-3 py-1 rounded text-sm ${
                                            es.es_prueba
                                                ? "bg-brand-cyan/20 text-brand-blue"
                                                : "bg-gray-100 text-gray-500"
                                        }`}
                                    >
                                        {es.es_prueba ? "En prueba" : "Marcar prueba"}
                                    </button>
                                    <button
                                        onClick={() =>
                                            estadoForm.patch(
                                                route(
                                                    "admin.ticket-estados.toggle-prueba-finalizada",
                                                    es.id
                                                )
                                            )
                                        }
                                        title="Marca este estado como el de 'testing finalizado, a la espera del siguiente paso' en el dashboard de Reportes"
                                        className={`px-3 py-1 rounded text-sm ${
                                            es.es_prueba_finalizada
                                                ? "bg-brand-lime/20 text-brand-blue"
                                                : "bg-gray-100 text-gray-500"
                                        }`}
                                    >
                                        {es.es_prueba_finalizada
                                            ? "Prueba finalizada"
                                            : "Marcar finalizada"}
                                    </button>
                                    <button
                                        onClick={() =>
                                            estadoForm.patch(
                                                route(
                                                    "admin.ticket-estados.toggle",
                                                    es.id
                                                )
                                            )
                                        }
                                        className={`px-3 py-1 rounded text-sm ${
                                            es.activo
                                                ? "bg-brand-lime/20 text-brand-blue"
                                                : "bg-red-100 text-red-700"
                                        }`}
                                    >
                                        {es.activo ? "Activo" : "Inactivo"}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </>
                )}
            </div>
        </AppLayout>
    );
}