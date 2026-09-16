import React, { useState, useRef, useEffect } from "react";
import AppLayout from "@/Layouts/AppLayout";
import { Head, Link, router, usePage, useForm } from "@inertiajs/react";
import ReactQuill from "react-quill";
import { fixQuillImagePaste } from "@/lib/quillImagePaste";
import TicketCamposRedmineView from "@/Components/TicketCamposRedmineView";
import AdjuntoPreview from "@/Components/AdjuntoPreview";

import "react-quill/dist/quill.snow.css";
import "../../../css/quill.css";

const comentarioModules = {
    toolbar: [["bold", "italic", "underline"], ["link", "image"]],
};

const MAX_ADJUNTO_BYTES = 100 * 1024 * 1024;

const CAMPO_LABELS = {
    titulo: "Título",
    descripcion: "Detalle",
    tipo: "Tipo",
    prioridad: "Prioridad",
    severidad: "Severidad",
    proyecto_id: "Proyecto",
    departamento_id: "Departamento",
    asignado_id: "Asignado a",
    estado: "Estado",
    qa_aprobado: "QA",
    adjuntos: "Adjuntos",
    qa_archivos_modificados: "Archivos tocados (QA)",
    qa_captura_codigo: "Captura de código (QA)",
    qa_checklist: "Checklist de pruebas (QA)",
};

// El campo "descripcion" guarda HTML (texto enriquecido + imágenes en base64).
// Mostrarlo tal cual en el historial lo haría ilegible (tags crudos, imágenes
// gigantes en base64), así que acá lo resumimos a texto plano + cantidad de
// imágenes. Se usa DOMParser (documento inerte, sin scripts ni carga de
// recursos externos) en vez de asignar el HTML a un elemento real.
function resumenHtml(html) {
    if (!html) return "(vacío)";

    const doc = new DOMParser().parseFromString(html, "text/html");
    const cantImagenes = doc.querySelectorAll("img").length;

    let texto = (doc.body.textContent || "").trim().replace(/\s+/g, " ");
    if (texto.length > 160) texto = texto.slice(0, 160) + "…";

    if (cantImagenes > 0) {
        const etiqueta = `[${cantImagenes} imagen${cantImagenes > 1 ? "es" : ""}]`;
        return texto ? `${texto} ${etiqueta}` : etiqueta;
    }

    return texto || "(vacío)";
}

const prioridadColor = {
    Baja: "bg-brand-lime/20 text-brand-blue",
    Normal: "bg-brand-cyan/20 text-brand-blue",
    Alta: "bg-brand-peach text-brand-blue",
    Urgente: "bg-red-100 text-red-700",
};

function SlaBadge({ ticket }) {
    if (!ticket.sla_vencimiento) return null;

    const vencimiento = new Date(ticket.sla_vencimiento);
    const cerrado = ticket.estado?.es_final;
    const ahora = new Date();
    const horas = (vencimiento - ahora) / 3600000;

    let clase = "bg-brand-lime/20 text-brand-blue";
    let texto = `SLA: vence ${vencimiento.toLocaleString()}`;

    if (cerrado) {
        const cumplido = new Date(ticket.updated_at) <= vencimiento;
        clase = cumplido
            ? "bg-brand-lime/20 text-brand-blue"
            : "bg-red-100 text-red-700";
        texto = cumplido ? "SLA cumplido" : "SLA incumplido";
    } else if (horas < 0) {
        clase = "bg-red-100 text-red-700";
        texto = `SLA vencido hace ${Math.abs(Math.round(horas))}h`;
    } else if (horas < 8) {
        clase = "bg-brand-peach text-brand-blue";
        texto = `SLA vence en ${Math.round(horas)}h`;
    }

    return (
        <span className={`text-xs px-2 py-1 rounded-full ${clase}`}>{texto}</span>
    );
}

export default function Show({ ticket, estados, puedeEditar, puedeCambiarEstado, puedeEliminar, puedeAprobarQa, siguiendo }) {
    const { flash, auth } = usePage().props;
    const [archivos, setArchivos] = useState([]);
    const [checklistFiles, setChecklistFiles] = useState([]);
    const [motivoDesvio, setMotivoDesvio] = useState("");
    const [estadoPendiente, setEstadoPendiente] = useState(null);
    const comentarioQuillRef = useRef(null);
    const [comentarioVacio, setComentarioVacio] = useState(true);

    const comentarioForm = useForm({ comentario: "", interno: false, parent_id: null });

    useEffect(() => {
        const quill = comentarioQuillRef.current?.getEditor();
        return fixQuillImagePaste(quill);
    }, []);

    const esGestor = ["Administrador", "Gerente"].includes(auth.user?.rol);

    const cambiarEstado = (estadoId, requiereMotivo) => {
        if (requiereMotivo && !motivoDesvio && estadoPendiente !== estadoId) {
            setEstadoPendiente(estadoId);
            return;
        }
        router.patch(
            route("tickets.estado", ticket.id),
            { estado_id: estadoId, sla_motivo_desvio: motivoDesvio || undefined },
            {
                onSuccess: () => {
                    setEstadoPendiente(null);
                    setMotivoDesvio("");
                },
            }
        );
    };

    const aprobarQa = () => {
        router.patch(route("tickets.qa.aprobar", ticket.id));
    };

    const toggleWatch = () => {
        router.patch(route("tickets.watch", ticket.id));
    };

    const eliminar = () => {
        if (confirm("¿Seguro que deseas eliminar este ticket?")) {
            router.delete(route("tickets.destroy", ticket.id));
        }
    };

    const enviarComentario = (e) => {
        e.preventDefault();
        comentarioForm.post(route("tickets.comentarios.store", ticket.id), {
            preserveScroll: true,
            onSuccess: () => {
                comentarioForm.reset();
                comentarioQuillRef.current?.getEditor().setText("");
                setComentarioVacio(true);
            },
        });
    };

    const subirAdjuntos = () => {
        if (archivos.length === 0) return;
        const pesados = archivos.filter((f) => f.size > MAX_ADJUNTO_BYTES);
        if (pesados.length > 0) {
            alert(`Estos archivos superan los 100 MB: ${pesados.map((f) => f.name).join(", ")}`);
            return;
        }
        const fd = new FormData();
        archivos.forEach((f) => fd.append("archivos[]", f));
        router.post(route("tickets.adjuntos.upload", ticket.id), fd, {
            forceFormData: true,
            preserveScroll: true,
        });
    };

    const eliminarAdjunto = (adjuntoId) => {
        router.delete(route("tickets.adjuntos.destroy", [ticket.id, adjuntoId]), {
            preserveScroll: true,
        });
    };

    const subirChecklist = () => {
        if (checklistFiles.length === 0) return;
        const fd = new FormData();
        checklistFiles.forEach((f) => fd.append("archivos[]", f));
        router.post(route("tickets.qa-checklist.upload", ticket.id), fd, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => setChecklistFiles([]),
        });
    };

    const relacionados = [
        ...(ticket.relacionados || []),
        ...(ticket.relacionados_inversos || []),
    ];

    const comentarios = (ticket.comentarios || []).filter(
        (c) => !c.interno || esGestor
    );

    return (
        <AppLayout>
            <Head title={`#${ticket.numero} — ${ticket.titulo}`} />

            <div className="max-w-3xl mx-auto p-6">
                <div className="flex justify-between items-center mb-4">
                    <Link
                        href={route("tickets.index")}
                        className="text-brand-mango hover:underline inline-block"
                    >
                        ← Volver a Tickets
                    </Link>

                    <button
                        onClick={toggleWatch}
                        className={`text-xs px-3 py-1.5 rounded-full border ${
                            siguiendo
                                ? "bg-brand-cyan/20 text-brand-blue border-brand-cyan"
                                : "text-gray-500 border-gray-300"
                        }`}
                    >
                        {siguiendo ? "👁 Siguiendo" : "👁 Seguir ticket"}
                    </button>
                </div>

                {flash?.success && (
                    <div className="mb-4 p-3 bg-brand-lime/15 text-brand-blue rounded">
                        {flash.success}
                    </div>
                )}

                <div className="bg-white rounded-xl shadow p-6 mb-6">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <span className="font-mono text-sm text-gray-400">
                                #{ticket.numero}
                            </span>
                            <h1 className="text-2xl font-bold text-gray-800">
                                {ticket.titulo}
                            </h1>
                        </div>

                        <span
                            className="px-3 py-1 rounded-full text-sm text-white whitespace-nowrap"
                            style={{ backgroundColor: ticket.estado?.color || "#6B7280" }}
                        >
                            {ticket.estado?.nombre}
                        </span>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-6">
                        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                            {ticket.tipo}
                        </span>
                        <span
                            className={`text-xs px-2 py-1 rounded-full ${
                                prioridadColor[ticket.prioridad] ||
                                "bg-gray-100 text-gray-700"
                            }`}
                        >
                            Prioridad: {ticket.prioridad}
                        </span>
                        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                            Severidad: {ticket.severidad}
                        </span>
                        {ticket.proyecto && (
                            <span className="text-xs bg-brand-cyan/20 text-brand-blue px-2 py-1 rounded-full">
                                📁 {ticket.proyecto.nombre}
                            </span>
                        )}
                        {ticket.departamento && (
                            <span className="text-xs bg-brand-peach/40 text-brand-blue px-2 py-1 rounded-full">
                                🏢 {ticket.departamento.nombre}
                            </span>
                        )}
                        {ticket.requiere_qa && (
                            <span
                                className={`text-xs px-2 py-1 rounded-full ${
                                    ticket.qa_aprobado
                                        ? "bg-brand-lime/20 text-brand-blue"
                                        : "bg-brand-peach text-brand-blue"
                                }`}
                            >
                                🧪 QA {ticket.qa_aprobado ? "aprobado" : "pendiente"}
                            </span>
                        )}
                        <SlaBadge ticket={ticket} />
                    </div>

                    {ticket.descripcion && (
                        <div
                            className="prose max-w-none mb-6"
                            dangerouslySetInnerHTML={{ __html: ticket.descripcion }}
                        />
                    )}

                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 border-t pt-4 mb-4">
                        <div>
                            <span className="font-semibold">Solicitante:</span>{" "}
                            {ticket.solicitante?.name}
                        </div>
                        <div>
                            <span className="font-semibold">Asignado:</span>{" "}
                            {ticket.asignado?.name || "Sin asignar"}
                        </div>
                        <div>
                            <span className="font-semibold">Creado:</span>{" "}
                            {new Date(ticket.created_at).toLocaleString()}
                        </div>
                        <div>
                            <span className="font-semibold">Actualizado:</span>{" "}
                            {new Date(ticket.updated_at).toLocaleString()}
                        </div>
                        {ticket.requiere_qa && (
                            <div>
                                <span className="font-semibold">QA asignado:</span>{" "}
                                {ticket.qa_asignado?.name || "Sin asignar"}
                            </div>
                        )}
                        {ticket.watchers?.length > 0 && (
                            <div>
                                <span className="font-semibold">Siguiendo:</span>{" "}
                                {ticket.watchers.map((w) => w.name).join(", ")}
                            </div>
                        )}
                    </div>

                    {ticket.sla_motivo_desvio && (
                        <div className="text-sm bg-red-50 text-red-700 rounded p-3 mb-4">
                            <span className="font-semibold">Motivo del desvío de SLA:</span>{" "}
                            {ticket.sla_motivo_desvio}
                        </div>
                    )}

                    {ticket.requiere_qa && (
                        <div className="text-sm bg-gray-50 rounded-lg p-4 mb-4 space-y-4">
                            <h3 className="font-semibold text-gray-700">
                                🧪 Evidencia para QA
                            </h3>

                            <div>
                                <span className="font-semibold block mb-1 text-gray-600">
                                    Checklist de pruebas (Excel)
                                </span>

                                {ticket.qa_checklist_adjuntos?.length > 0 && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                                        {ticket.qa_checklist_adjuntos.map((a) => (
                                            <AdjuntoPreview
                                                key={a.id}
                                                adjunto={a}
                                                verUrl={route("tickets.adjuntos.ver", [ticket.id, a.id])}
                                                downloadUrl={route("tickets.adjuntos.download", [ticket.id, a.id])}
                                                onDelete={
                                                    esGestor ? () => eliminarAdjunto(a.id) : undefined
                                                }
                                            />
                                        ))}
                                    </div>
                                )}

                                {!ticket.qa_checklist_adjuntos?.length && !esGestor && (
                                    <p className="text-gray-400 text-xs">Sin checklist todavía</p>
                                )}

                                {esGestor && (
                                    <div className="flex gap-2 items-center">
                                        <input
                                            type="file"
                                            multiple
                                            accept=".xls,.xlsx,.csv"
                                            onChange={(e) =>
                                                setChecklistFiles(Array.from(e.target.files))
                                            }
                                            className="text-xs"
                                        />
                                        <button
                                            onClick={subirChecklist}
                                            className="bg-brand-blue hover:bg-brand-blue-dark text-white text-xs px-3 py-1.5 rounded"
                                        >
                                            Subir
                                        </button>
                                    </div>
                                )}
                            </div>

                            {ticket.qa_archivos_modificados && (
                                    <div>
                                        <span className="font-semibold block mb-1 text-gray-600">
                                            Archivos/objetos modificados
                                        </span>
                                        <ul className="list-disc list-inside font-mono text-xs text-gray-700 space-y-0.5">
                                            {ticket.qa_archivos_modificados
                                                .split("\n")
                                                .map((linea) => linea.trim())
                                                .filter(Boolean)
                                                .map((linea, i) => (
                                                    <li key={i}>{linea}</li>
                                                ))}
                                        </ul>
                                    </div>
                                )}

                                {ticket.qa_captura_codigo && (
                                    <div>
                                        <span className="font-semibold block mb-1 text-gray-600">
                                            Captura del código agregado
                                        </span>
                                        <a
                                            href={`/storage/${ticket.qa_captura_codigo}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            <img
                                                src={`/storage/${ticket.qa_captura_codigo}`}
                                                className="max-h-64 rounded border hover:opacity-90 transition"
                                            />
                                        </a>
                                    </div>
                                )}
                            </div>
                        )}

                    {ticket.parent && (
                        <div className="mb-4 text-sm">
                            <span className="font-semibold text-gray-600">
                                Ticket padre:
                            </span>{" "}
                            <Link
                                href={route("tickets.show", ticket.parent.id)}
                                className="text-brand-blue hover:underline"
                            >
                                #{ticket.parent.numero} — {ticket.parent.titulo}
                            </Link>
                        </div>
                    )}

                    {ticket.subtareas?.length > 0 && (
                        <div className="mb-4">
                            <h2 className="text-sm font-semibold text-gray-600 mb-2">
                                Subtareas
                            </h2>
                            <ul className="text-sm space-y-1">
                                {ticket.subtareas.map((s) => (
                                    <li key={s.id}>
                                        <Link
                                            href={route("tickets.show", s.id)}
                                            className="text-brand-blue hover:underline"
                                        >
                                            #{s.numero} — {s.titulo}
                                        </Link>{" "}
                                        <span
                                            className="text-xs px-2 py-0.5 rounded-full text-white"
                                            style={{
                                                backgroundColor:
                                                    s.estado?.color || "#6B7280",
                                            }}
                                        >
                                            {s.estado?.nombre}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {relacionados.length > 0 && (
                        <div className="mb-4">
                            <h2 className="text-sm font-semibold text-gray-600 mb-2">
                                Tickets relacionados
                            </h2>
                            <ul className="text-sm space-y-1">
                                {relacionados.map((r) => (
                                    <li key={r.id}>
                                        <Link
                                            href={route("tickets.show", r.id)}
                                            className="text-brand-blue hover:underline"
                                        >
                                            #{r.numero} — {r.titulo}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {puedeAprobarQa && !ticket.qa_aprobado && (
                        <div className="border-t pt-4 mb-4">
                            <button
                                onClick={aprobarQa}
                                className="bg-brand-lime/80 hover:bg-brand-lime text-white px-4 py-2 rounded"
                            >
                                ✅ Aprobar QA
                            </button>
                        </div>
                    )}

                    {puedeCambiarEstado && (
                        <div className="border-t pt-4 mb-4">
                            <h2 className="text-sm font-semibold text-gray-600 mb-2">
                                Cambiar estado
                            </h2>
                            <div className="flex flex-wrap gap-2">
                                {estados.map((e) => {
                                    const bloqueadoPorQa =
                                        e.es_final && ticket.requiere_qa && !ticket.qa_aprobado;
                                    return (
                                        <button
                                            key={e.id}
                                            onClick={() =>
                                                cambiarEstado(
                                                    e.id,
                                                    e.es_final &&
                                                        ticket.sla_vencimiento &&
                                                        new Date(ticket.sla_vencimiento) < new Date()
                                                )
                                            }
                                            disabled={e.id === ticket.estado.id || bloqueadoPorQa}
                                            title={
                                                bloqueadoPorQa
                                                    ? "Requiere aprobación de QA"
                                                    : ""
                                            }
                                            className={`px-3 py-1.5 rounded-full text-sm text-white disabled:opacity-40 disabled:cursor-not-allowed ${
                                                e.id !== ticket.estado.id &&
                                                !bloqueadoPorQa &&
                                                "hover:brightness-110"
                                            }`}
                                            style={{ backgroundColor: e.color }}
                                        >
                                            {e.nombre}
                                        </button>
                                    );
                                })}
                            </div>

                            {estadoPendiente && (
                                <div className="mt-3 bg-red-50 p-3 rounded">
                                    <label className="block text-sm text-red-700 font-semibold mb-1">
                                        Este ticket superó el SLA. Indicá el motivo del desvío:
                                    </label>
                                    <textarea
                                        className="w-full border rounded px-3 py-2 text-sm"
                                        value={motivoDesvio}
                                        onChange={(e) => setMotivoDesvio(e.target.value)}
                                    />
                                    <button
                                        onClick={() => cambiarEstado(estadoPendiente, true)}
                                        disabled={!motivoDesvio}
                                        className="mt-2 bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white text-sm px-3 py-1.5 rounded"
                                    >
                                        Confirmar cambio de estado
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="flex justify-end gap-2 border-t pt-4">
                        {puedeEditar && (
                            <Link
                                href={route("tickets.edit", ticket.id)}
                                className="bg-gradient-to-r from-brand-blue to-brand-blue-mid hover:from-brand-blue-dark hover:to-brand-blue text-white px-4 py-2 rounded"
                            >
                                ✏️ Editar
                            </Link>
                        )}
                        {puedeEliminar && (
                            <button
                                onClick={eliminar}
                                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
                            >
                                🗑 Eliminar
                            </button>
                        )}
                    </div>
                </div>

                <TicketCamposRedmineView ticket={ticket} />

                {/* ADJUNTOS */}
                <div className="bg-white rounded-xl shadow p-6 mb-6">
                    <h2 className="text-lg font-semibold mb-3">📎 Adjuntos</h2>

                    {ticket.adjuntos?.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                            {ticket.adjuntos.map((a) => (
                                <AdjuntoPreview
                                    key={a.id}
                                    adjunto={a}
                                    verUrl={route("tickets.adjuntos.ver", [ticket.id, a.id])}
                                    downloadUrl={route("tickets.adjuntos.download", [ticket.id, a.id])}
                                    onDelete={() => eliminarAdjunto(a.id)}
                                />
                            ))}
                        </div>
                    )}

                    <div className="flex gap-2 items-center">
                        <input
                            type="file"
                            multiple
                            onChange={(e) => setArchivos(Array.from(e.target.files))}
                            className="text-sm"
                        />
                        <button
                            onClick={subirAdjuntos}
                            className="bg-brand-blue hover:bg-brand-blue-dark text-white text-sm px-3 py-1.5 rounded"
                        >
                            Subir
                        </button>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Tamaño máximo por archivo: 100 MB</p>
                </div>

                {/* COMENTARIOS */}
                <div className="bg-white rounded-xl shadow p-6 mb-6">
                    <h2 className="text-lg font-semibold mb-3">💬 Comentarios</h2>

                    <div className="space-y-3 mb-4">
                        {comentarios.length === 0 && (
                            <p className="text-sm text-gray-400">Sin comentarios todavía</p>
                        )}
                        {comentarios.map((c) => (
                            <div
                                key={c.id}
                                className={`text-sm rounded p-3 ${
                                    c.interno ? "bg-brand-peach/40" : "bg-gray-50"
                                }`}
                            >
                                <div className="flex justify-between items-center mb-1">
                                    <span className="font-semibold text-gray-700">
                                        {c.usuario?.name}
                                        {c.interno && (
                                            <span className="ml-2 text-xs text-brand-mango-dark">
                                                interno
                                            </span>
                                        )}
                                    </span>
                                    <span className="text-xs text-gray-400">
                                        {new Date(c.created_at).toLocaleString()}
                                    </span>
                                </div>
                                <div
                                    className="prose prose-sm max-w-none"
                                    dangerouslySetInnerHTML={{ __html: c.comentario }}
                                />
                            </div>
                        ))}
                    </div>

                    <form onSubmit={enviarComentario} className="space-y-2">
                        <div className="quill-comment">
                            <ReactQuill
                                ref={comentarioQuillRef}
                                modules={comentarioModules}
                                placeholder="Escribí un comentario… usá @Nombre para mencionar"
                                onChange={(html, delta, source, editor) => {
                                    comentarioForm.setData("comentario", html);
                                    setComentarioVacio(editor.getLength() <= 1);
                                }}
                            />
                        </div>
                        <div className="flex justify-between items-center">
                            {esGestor ? (
                                <label className="flex items-center gap-1 text-sm text-gray-600">
                                    <input
                                        type="checkbox"
                                        checked={comentarioForm.data.interno}
                                        onChange={(e) =>
                                            comentarioForm.setData(
                                                "interno",
                                                e.target.checked
                                            )
                                        }
                                    />
                                    Comentario interno (solo staff)
                                </label>
                            ) : (
                                <span />
                            )}
                            <button
                                type="submit"
                                disabled={comentarioForm.processing || comentarioVacio}
                                className="bg-brand-blue hover:bg-brand-blue-dark disabled:opacity-40 text-white text-sm px-4 py-1.5 rounded"
                            >
                                Comentar
                            </button>
                        </div>
                    </form>
                </div>

                {/* HISTORIAL DE CAMBIOS */}
                {ticket.audits?.length > 0 && (
                    <div className="bg-white rounded-xl shadow p-6">
                        <h2 className="text-lg font-semibold mb-3">🕵️ Historial de cambios</h2>
                        <ul className="text-xs text-gray-600 space-y-2">
                            {ticket.audits.map((a) => {
                                const esHtml = a.campo === "descripcion";
                                const anterior = esHtml
                                    ? resumenHtml(a.valor_anterior)
                                    : a.valor_anterior ?? "—";
                                const nuevo = esHtml
                                    ? resumenHtml(a.valor_nuevo)
                                    : a.valor_nuevo ?? "—";

                                return (
                                    <li key={a.id} className="flex gap-2">
                                        <span className="text-gray-400 whitespace-nowrap">
                                            {new Date(a.created_at).toLocaleString()}
                                        </span>
                                        <span className="break-words">
                                            <span className="font-semibold">
                                                {a.usuario?.name || "Sistema"}
                                            </span>{" "}
                                            cambió{" "}
                                            <span className="font-mono">
                                                {CAMPO_LABELS[a.campo] || a.campo}
                                            </span>
                                            {": "}
                                            <span className="line-through text-gray-400">
                                                {anterior}
                                            </span>{" "}
                                            → <span>{nuevo}</span>
                                        </span>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
