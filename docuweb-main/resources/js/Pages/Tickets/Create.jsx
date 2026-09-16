import React, { useMemo, useRef, useEffect } from "react";
import AppLayout from "@/Layouts/AppLayout";
import { Head, useForm, Link } from "@inertiajs/react";
import ReactQuill from "react-quill";
import hljs from "highlight.js";
import { fixQuillImagePaste } from "@/lib/quillImagePaste";
import TicketCamposRedmine from "@/Components/TicketCamposRedmine";

import "react-quill/dist/quill.snow.css";
import "../../../css/quill.css";
import "highlight.js/styles/github.css";

export default function Create({ proyectos, departamentos, tipos, prioridades, severidades, usuarios, puedeAsignar }) {
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

    const { data, setData, post, transform, processing, errors } = useForm({
        titulo: "",
        descripcion: "",
        tipo: tipos[0] || "",
        prioridad: "Normal",
        severidad: "Media",
        proyecto_id: "",
        departamento_id: "",
        asignado_id: "",
        requiere_qa: false,
        qa_asignado_id: "",

        // Campos opcionales estilo Redmine
        fecha_inicio: "",
        fecha_fin: "",
        fecha_estimada_entrega: "",
        fecha_asignacion: "",
        fecha_entrega: "",
        fecha_conformidad: "",
        fecha_inicio_relevamiento: "",
        fecha_fin_relevamiento: "",
        fecha_aprobacion_relevamiento: "",
        fecha_inicio_desarrollo: "",
        fecha_inicio_reanudacion: "",
        fecha_fin_reanudacion: "",
        desvios_dias: "",
        motivo_desvio: "",
        fecha_a_produccion: "",
        fecha_autorizacion_pasaje: "",
        errores_produccion: "",
        inconvenientes_pasaje: "",
        incidencias_produccion: "",
        cant_vuelta_atras: "",
        fecha_estimada_entrega_qa: "",
        fecha_entrega_qa: "",
        hora_estimada_qa: "",
        oficial_seguridad_id: "",
        porcentaje_realizado: "",
        tiempo_estimado: "",
        cant_objetos_modif: "",
        prioridad_ti: "",
        referencia_asignacion_ti: "",
        documentacion_incompleta: "",
        area: "",
        es_evento_ro: "",
    });

    const submit = (e) => {
        e.preventDefault();
        transform((data) => ({
            ...data,
            descripcion: quillRef.current?.getEditor().root.innerHTML ?? "",
        }));
        post(route("tickets.store"));
    };

    return (
        <AppLayout>
            <Head title="Nuevo Ticket" />

            <div className="max-w-2xl mx-auto bg-white p-6 mt-10 rounded shadow">
                <h1 className="text-2xl font-bold mb-6">➕ Nuevo Ticket</h1>

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
                        <ReactQuill ref={quillRef} modules={quillModules} />
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
                                <select
                                    className="w-full border px-3 py-2 rounded-lg"
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
                            )}
                        </div>
                    )}

                    <TicketCamposRedmine data={data} setData={setData} usuarios={usuarios} />

                    <div className="flex justify-between items-center pt-4">
                        <Link
                            href={route("tickets.index")}
                            className="text-sm text-gray-600 hover:underline"
                        >
                            ← Cancelar
                        </Link>

                        <button
                            type="submit"
                            disabled={processing}
                            className="bg-gradient-to-r from-brand-blue to-brand-blue-mid hover:from-brand-blue-dark hover:to-brand-blue text-white px-6 py-2 rounded-lg"
                        >
                            {processing ? "Creando..." : "Crear Ticket"}
                        </button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
