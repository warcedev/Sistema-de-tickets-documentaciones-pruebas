import React, { useMemo, useRef, useEffect, useState } from "react";
import AppLayout from "@/Layouts/AppLayout";
import { Head, useForm, Link } from "@inertiajs/react";
import ReactQuill from "react-quill";
import hljs from "highlight.js";
import { fixQuillImagePaste } from "@/lib/quillImagePaste";
import TicketCamposRedmine from "@/Components/TicketCamposRedmine";

import "react-quill/dist/quill.snow.css";
import "../../../css/quill.css";
import "highlight.js/styles/github.css";

const camposFecha = [
    "fecha_inicio", "fecha_fin", "fecha_estimada_entrega", "fecha_asignacion",
    "fecha_entrega", "fecha_conformidad", "fecha_inicio_relevamiento",
    "fecha_fin_relevamiento", "fecha_aprobacion_relevamiento", "fecha_inicio_desarrollo",
    "fecha_inicio_reanudacion", "fecha_fin_reanudacion", "fecha_a_produccion",
    "fecha_autorizacion_pasaje", "fecha_estimada_entrega_qa", "fecha_entrega_qa",
];

const camposRedmine = [
    ...camposFecha,
    "desvios_dias", "motivo_desvio", "errores_produccion",
    "inconvenientes_pasaje", "incidencias_produccion", "cant_vuelta_atras",
    "hora_estimada_qa", "oficial_seguridad_id", "porcentaje_realizado", "tiempo_estimado",
    "cant_objetos_modif", "prioridad_ti", "referencia_asignacion_ti",
    "documentacion_incompleta", "area", "es_evento_ro",
];

export default function Edit({ ticket, proyectos, departamentos, tipos, prioridades, severidades, usuarios, puedeAsignar }) {
    const quillRef = useRef(null);

    const quillModules = useMemo(
        () => ({
            syntax: { highlight: (text) => hljs.highlightAuto(text).value },
            toolbar: [
                [{ header: [1, 2, 3, false] }],
                ["bold", "italic", "underline"],
                [{ list: "ordered" }, { list: "bullet" }],
                ["link", "image"],
                ["code-block"],
            ],
        }),
        []
    );

    useEffect(() => {
        const quill = quillRef.current?.getEditor();
        return fixQuillImagePaste(quill);
    }, []);

    const redmineIniciales = {};
    camposRedmine.forEach((campo) => {
        let valor = ticket[campo] ?? "";
        // Las fechas llegan como datetime ISO completo (Carbon); <input type="date">
        // solo acepta "YYYY-MM-DD".
        if (camposFecha.includes(campo) && valor) {
            valor = String(valor).split("T")[0];
        }
        redmineIniciales[campo] = valor;
    });

    const { data, setData, put, transform, processing, errors } = useForm({
        titulo: ticket.titulo,
        descripcion: ticket.descripcion || "",
        tipo: ticket.tipo,
        prioridad: ticket.prioridad,
        severidad: ticket.severidad,
        proyecto_id: ticket.proyecto_id || "",
        departamento_id: ticket.departamento_id || "",
        asignado_id: ticket.asignado_id || "",
        requiere_qa: ticket.requiere_qa || false,
        qa_asignado_id: ticket.qa_asignado_id || "",
        qa_archivos_modificados: ticket.qa_archivos_modificados || "",
        qa_captura_codigo: null,
        ...redmineIniciales,
    });

    const [previewQaCaptura, setPreviewQaCaptura] = useState(
        ticket.qa_captura_codigo ? `/storage/${ticket.qa_captura_codigo}` : null
    );

    const handleQaCapturaChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 6 * 1024 * 1024) {
            alert("La captura no puede superar 6 MB");
            return;
        }

        setData("qa_captura_codigo", file);
        const reader = new FileReader();
        reader.onload = () => setPreviewQaCaptura(reader.result);
        reader.readAsDataURL(file);
    };

    const submit = (e) => {
        e.preventDefault();
        transform((data) => ({
            ...data,
            descripcion: quillRef.current?.getEditor().root.innerHTML ?? "",
        }));
        put(route("tickets.update", ticket.id));
    };

    return (
        <AppLayout>
            <Head title={`Editar ${ticket.numero}`} />

            <div className="max-w-2xl mx-auto bg-white p-6 mt-10 rounded shadow">
                <h1 className="text-2xl font-bold mb-6">
                    ✏️ Editar Ticket {ticket.numero}
                </h1>

                <form onSubmit={submit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                            Título
                        </label>
                        <input
                            type="text"
                            className="w-full border px-3 py-2 rounded-lg"
                            value={data.titulo}
                            onChange={(e) => setData("titulo", e.target.value)}
                        />
                        {errors.titulo && (
                            <p className="text-red-600 text-sm mt-1">{errors.titulo}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                            Descripción
                        </label>
                        <ReactQuill
                            ref={quillRef}
                            modules={quillModules}
                            defaultValue={ticket.descripcion ?? ""}
                        />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">
                                Tipo
                            </label>
                            <select
                                className="w-full border px-3 py-2 rounded-lg"
                                value={data.tipo}
                                onChange={(e) => setData("tipo", e.target.value)}
                            >
                                {tipos.map((t) => (
                                    <option key={t} value={t}>
                                        {t}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">
                                Prioridad
                            </label>
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

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">
                                Severidad
                            </label>
                            <select
                                className="w-full border px-3 py-2 rounded-lg"
                                value={data.severidad}
                                onChange={(e) => setData("severidad", e.target.value)}
                            >
                                {severidades.map((s) => (
                                    <option key={s} value={s}>
                                        {s}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                            Proyecto
                        </label>
                        <select
                            className="w-full border px-3 py-2 rounded-lg"
                            value={data.proyecto_id}
                            onChange={(e) => setData("proyecto_id", e.target.value)}
                        >
                            <option value="">-- Sin proyecto --</option>
                            {proyectos.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.nombre}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                            Departamento
                        </label>
                        <select
                            className="w-full border px-3 py-2 rounded-lg"
                            value={data.departamento_id}
                            onChange={(e) => setData("departamento_id", e.target.value)}
                        >
                            <option value="">-- Sin departamento --</option>
                            {departamentos.map((d) => (
                                <option key={d.id} value={d.id}>
                                    {d.nombre}
                                </option>
                            ))}
                        </select>
                    </div>

                    {puedeAsignar && (
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">
                                Asignar a
                            </label>
                            <select
                                className="w-full border px-3 py-2 rounded-lg"
                                value={data.asignado_id}
                                onChange={(e) => setData("asignado_id", e.target.value)}
                            >
                                <option value="">-- Sin asignar --</option>
                                {usuarios.map((u) => (
                                    <option key={u.id} value={u.id}>
                                        {u.name} {u.apellido}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {puedeAsignar && (
                        <div className="border rounded-lg p-3">
                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                                <input
                                    type="checkbox"
                                    checked={data.requiere_qa}
                                    onChange={(e) =>
                                        setData("requiere_qa", e.target.checked)
                                    }
                                />
                                🧪 Requiere aprobación de QA antes de cerrarse
                            </label>

                            {data.requiere_qa && (
                                <>
                                    <select
                                        className="w-full border px-3 py-2 rounded-lg mb-2"
                                        value={data.qa_asignado_id}
                                        onChange={(e) =>
                                            setData("qa_asignado_id", e.target.value)
                                        }
                                    >
                                        <option value="">-- QA sin asignar --</option>
                                        {usuarios.map((u) => (
                                            <option key={u.id} value={u.id}>
                                                {u.name} {u.apellido}
                                            </option>
                                        ))}
                                    </select>

                                    <p className="text-xs text-gray-500 mb-2">
                                        El checklist de pruebas (Excel) se sube desde
                                        la pantalla del ticket, en "Evidencia para QA".
                                    </p>

                                    <label className="block text-sm text-gray-600 mb-1 mt-3">
                                        Archivos/objetos modificados (GeneXus)
                                    </label>
                                    <textarea
                                        rows={3}
                                        placeholder={"Uno por línea, ej:\nTRNCliente\nPRCActualizarStock"}
                                        className="w-full border px-3 py-2 rounded-lg text-sm font-mono"
                                        value={data.qa_archivos_modificados}
                                        onChange={(e) =>
                                            setData("qa_archivos_modificados", e.target.value)
                                        }
                                    />

                                    <label className="block text-sm text-gray-600 mb-1 mt-3">
                                        Captura del código agregado
                                    </label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleQaCapturaChange}
                                    />
                                    {previewQaCaptura && (
                                        <img
                                            src={previewQaCaptura}
                                            className="mt-2 max-h-48 rounded border"
                                        />
                                    )}
                                </>
                            )}
                        </div>
                    )}

                    <TicketCamposRedmine data={data} setData={setData} usuarios={usuarios} />

                    <div className="flex justify-between items-center pt-4">
                        <Link
                            href={route("tickets.show", ticket.id)}
                            className="text-sm text-gray-600 hover:underline"
                        >
                            ← Cancelar
                        </Link>

                        <button
                            type="submit"
                            disabled={processing}
                            className="bg-gradient-to-r from-brand-blue to-brand-blue-mid hover:from-brand-blue-dark hover:to-brand-blue text-white px-6 py-2 rounded-lg"
                        >
                            {processing ? "Guardando..." : "Guardar cambios"}
                        </button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
