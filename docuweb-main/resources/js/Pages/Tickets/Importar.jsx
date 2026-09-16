import React, { useState } from "react";
import AppLayout from "@/Layouts/AppLayout";
import { Head, Link, router, usePage } from "@inertiajs/react";

function csrfToken() {
    return document.querySelector('meta[name="csrf-token"]')?.getAttribute("content") || "";
}

export default function Importar({ proyectos, estados, tipos, usuarios }) {
    const { errors: erroresServidor } = usePage().props;
    const [archivo, setArchivo] = useState(null);
    const [proyectoId, setProyectoId] = useState("");
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState("");
    const [entradas, setEntradas] = useState(null); // null = todavía no se previsualizó
    const [enviando, setEnviando] = useState(false);

    const previsualizar = async () => {
        if (!archivo) {
            setError("Elegí un archivo Atom (.xml) exportado de Redmine.");
            return;
        }
        setError("");
        setCargando(true);

        try {
            const fd = new FormData();
            fd.append("archivo", archivo);

            const res = await fetch(route("tickets.importar.previsualizar"), {
                method: "POST",
                headers: {
                    "X-CSRF-TOKEN": csrfToken(),
                    Accept: "application/json",
                },
                body: fd,
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "No se pudo leer el archivo.");
                setEntradas(null);
                return;
            }

            if (!data.entradas || data.entradas.length === 0) {
                setError("El archivo no tiene entradas (<entry>) de tickets para importar.");
                setEntradas(null);
                return;
            }

            setEntradas(
                data.entradas.map((e) => ({
                    ...e,
                    seleccionado: true,
                    tipo: e.tipo_sugerido || tipos[0] || "",
                    estado_id: e.estado_sugerido_id || estados[0]?.id || "",
                    solicitante_id: e.solicitante_sugerido_id || "",
                }))
            );
        } catch (e) {
            setError("Ocurrió un error leyendo el archivo. Verificá que sea un XML/Atom válido.");
        } finally {
            setCargando(false);
        }
    };

    const actualizarEntrada = (idx, campo, valor) => {
        setEntradas((prev) =>
            prev.map((e, i) => (i === idx ? { ...e, [campo]: valor } : e))
        );
    };

    const alternarTodos = (valor) => {
        setEntradas((prev) => prev.map((e) => ({ ...e, seleccionado: valor })));
    };

    const confirmarImportacion = () => {
        const seleccionadas = entradas.filter((e) => e.seleccionado);
        if (seleccionadas.length === 0) {
            setError("Seleccioná al menos una entrada para importar.");
            return;
        }

        setEnviando(true);
        router.post(
            route("tickets.importar.confirmar"),
            {
                proyecto_id: proyectoId || null,
                entradas: seleccionadas.map((e) => ({
                    titulo: e.titulo,
                    descripcion: e.descripcion,
                    tipo: e.tipo,
                    estado_id: e.estado_id || null,
                    solicitante_id: e.solicitante_id || null,
                    asignado_id: e.asignado_sugerido_id || null,
                    qa_asignado_id: e.qa_asignado_sugerido_id || null,
                    redmine_numero: e.redmine_numero,
                    redmine_url: e.redmine_url,
                    campos_redmine: e.campos_redmine || {},
                    comentarios: e.comentarios || [],
                })),
            },
            {
                onFinish: () => setEnviando(false),
            }
        );
    };

    const seleccionadasCount = entradas ? entradas.filter((e) => e.seleccionado).length : 0;
    const duplicadosCount = entradas ? entradas.filter((e) => e.duplicado).length : 0;

    return (
        <AppLayout>
            <Head title="Importar tickets" />

            <div className="min-h-screen bg-gray-100">
                <div className="sticky top-0 z-10 bg-white border-b shadow-sm">
                    <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <span className="text-brand-mango text-3xl">⬆️</span>
                            Importar tickets desde Redmine (Atom)
                        </h1>
                        <Link href={route("tickets.index")} className="text-sm text-gray-600 hover:underline">
                            ← Volver a Gestionar Tickets
                        </Link>
                    </div>
                </div>

                <div className="max-w-6xl mx-auto px-6 py-6">
                    <div className="bg-white rounded-xl shadow p-6 mb-6">
                        <p className="text-sm text-gray-600 mb-4">
                            Exportá el listado de tickets desde Redmine en formato <strong>Atom</strong> (el
                            link "Atom" que aparece al pie de la lista de incidencias, ej.{" "}
                            <code className="bg-gray-100 px-1 rounded">issues.atom</code>) y subí ese archivo
                            acá. Vas a poder revisar qué se va a crear antes de confirmar.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-semibold text-gray-700 mb-1">
                                    Archivo Atom (.xml)
                                </label>
                                <input
                                    type="file"
                                    accept=".xml,.atom,application/atom+xml,application/xml,text/xml"
                                    onChange={(e) => setArchivo(e.target.files[0] || null)}
                                    className="text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">
                                    Proyecto destino (opcional)
                                </label>
                                <select
                                    className="w-full border px-3 py-2 rounded-lg"
                                    value={proyectoId}
                                    onChange={(e) => setProyectoId(e.target.value)}
                                >
                                    <option value="">-- Sin proyecto --</option>
                                    {proyectos.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            {p.nombre}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
                        {erroresServidor && Object.keys(erroresServidor).length > 0 && (
                            <div className="text-red-600 text-sm mt-3">
                                <p>No se pudo confirmar la importación:</p>
                                <ul className="list-disc list-inside">
                                    {Object.entries(erroresServidor).map(([campo, msg]) => (
                                        <li key={campo}>
                                            {campo}: {msg}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <button
                            onClick={previsualizar}
                            disabled={cargando}
                            className="mt-4 bg-gradient-to-r from-brand-blue to-brand-blue-mid hover:from-brand-blue-dark hover:to-brand-blue text-white px-5 py-2 rounded-lg"
                        >
                            {cargando ? "Leyendo..." : "Previsualizar"}
                        </button>
                    </div>

                    {entradas && (
                        <div className="bg-white rounded-xl shadow p-6">
                            <div className="flex justify-between items-center mb-4">
                                <div>
                                    <h2 className="text-lg font-semibold">
                                        Se encontraron {entradas.length} entradas
                                    </h2>
                                    <p className="text-sm text-gray-500">
                                        {seleccionadasCount} seleccionadas para importar
                                        {duplicadosCount > 0 && (
                                            <span className="text-brand-mango">
                                                {" "}
                                                · {duplicadosCount} ya existen en DOCWeb (se crearán como
                                                tickets nuevos, con número propio)
                                            </span>
                                        )}
                                    </p>
                                </div>
                                <div className="flex gap-3 text-sm">
                                    <button onClick={() => alternarTodos(true)} className="text-brand-blue hover:underline">
                                        Seleccionar todos
                                    </button>
                                    <button onClick={() => alternarTodos(false)} className="text-gray-500 hover:underline">
                                        Ninguno
                                    </button>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-sm border-collapse">
                                    <thead>
                                        <tr className="text-left text-gray-500 border-b">
                                            <th className="py-2 pr-2"></th>
                                            <th className="py-2 pr-2">Redmine #</th>
                                            <th className="py-2 pr-2">Título</th>
                                            <th className="py-2 pr-2">Tipo</th>
                                            <th className="py-2 pr-2">Estado</th>
                                            <th className="py-2 pr-2">Autor original</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {entradas.map((e, idx) => (
                                            <tr key={idx} className="border-b last:border-0 align-top">
                                                <td className="py-2 pr-2">
                                                    <input
                                                        type="checkbox"
                                                        checked={e.seleccionado}
                                                        onChange={(ev) =>
                                                            actualizarEntrada(idx, "seleccionado", ev.target.checked)
                                                        }
                                                    />
                                                </td>
                                                <td className="py-2 pr-2 whitespace-nowrap">
                                                    {e.redmine_numero ? `#${e.redmine_numero}` : "—"}
                                                    {e.duplicado && (
                                                        <div className="text-xs text-brand-mango">
                                                            ya existe (#{e.ticket_existente_id})
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="py-2 pr-2 max-w-xs">
                                                    <input
                                                        type="text"
                                                        className="w-full border px-2 py-1 rounded"
                                                        value={e.titulo}
                                                        onChange={(ev) =>
                                                            actualizarEntrada(idx, "titulo", ev.target.value)
                                                        }
                                                    />
                                                    {e.tracker && (
                                                        <div className="text-xs text-gray-400 mt-0.5">
                                                            Tracker original: {e.tracker}
                                                        </div>
                                                    )}
                                                    {e.cantidad_actualizaciones > 1 && (
                                                        <div className="text-xs text-brand-blue mt-0.5">
                                                            🕘 {e.cantidad_actualizaciones} actualizaciones → se
                                                            importarán como comentarios
                                                            {e.campos_detectados > 0 &&
                                                                ` · ${e.campos_detectados} campos completados automáticamente`}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="py-2 pr-2">
                                                    <select
                                                        className="border px-2 py-1 rounded"
                                                        value={e.tipo}
                                                        onChange={(ev) =>
                                                            actualizarEntrada(idx, "tipo", ev.target.value)
                                                        }
                                                    >
                                                        {tipos.map((t) => (
                                                            <option key={t} value={t}>
                                                                {t}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </td>
                                                <td className="py-2 pr-2">
                                                    <select
                                                        className="border px-2 py-1 rounded"
                                                        value={e.estado_id}
                                                        onChange={(ev) =>
                                                            actualizarEntrada(idx, "estado_id", ev.target.value)
                                                        }
                                                    >
                                                        {estados.map((s) => (
                                                            <option key={s.id} value={s.id}>
                                                                {s.nombre}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    {e.estado_texto && !e.estado_sugerido_id && (
                                                        <div className="text-xs text-gray-400 mt-0.5">
                                                            Original: {e.estado_texto}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="py-2 pr-2">
                                                    <select
                                                        className="border px-2 py-1 rounded"
                                                        value={e.solicitante_id}
                                                        onChange={(ev) =>
                                                            actualizarEntrada(idx, "solicitante_id", ev.target.value)
                                                        }
                                                    >
                                                        <option value="">-- Yo (quien importa) --</option>
                                                        {usuarios.map((u) => (
                                                            <option key={u.id} value={u.id}>
                                                                {u.name} {u.apellido}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    {e.autor && (
                                                        <div className="text-xs text-gray-400 mt-0.5">
                                                            Redmine: {e.autor}
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="flex justify-end mt-6">
                                <button
                                    onClick={confirmarImportacion}
                                    disabled={enviando || seleccionadasCount === 0}
                                    className="bg-gradient-to-r from-brand-blue to-brand-blue-mid hover:from-brand-blue-dark hover:to-brand-blue text-white px-6 py-2 rounded-lg disabled:opacity-50"
                                >
                                    {enviando
                                        ? "Importando..."
                                        : `Confirmar importación (${seleccionadasCount})`}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
