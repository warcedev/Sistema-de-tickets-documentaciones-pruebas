import React, { useRef, useMemo, useState, useEffect } from "react";
import AppLayout from "@/Layouts/AppLayout";
import { router, usePage } from "@inertiajs/react";
import ReactQuill from "react-quill";
import hljs from "highlight.js";

import "react-quill/dist/quill.snow.css";
import "../../../css/quill.css";
import "highlight.js/styles/github.css";
import AdjuntoPreview from "@/Components/AdjuntoPreview";
import { fixQuillImagePaste } from "@/lib/quillImagePaste";

const MAX_ADJUNTO_BYTES = 100 * 1024 * 1024;

export default function Edit({ documento, tags, departamentos }) {
    const quillRef = useRef(null);
    const { flash } = usePage().props;

    const [titulo, setTitulo] = useState(documento.titulo);
    const [portada, setPortada] = useState(null);

    const [tagsSel, setTagsSel] = useState(
        documento.tags?.map((t) => t.id) || []
    );
    const [deptosSel, setDeptosSel] = useState(
        documento.departamentos?.map((d) => d.id) || []
    );

    const [openTags, setOpenTags] = useState(false);
    const [openDeptos, setOpenDeptos] = useState(false);

    const [adjuntos, setAdjuntos] = useState([]);
    const [processing, setProcessing] = useState(false);

    const MAX = 20;

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

    const toggle = (id, list, setList) => {
        if (list.includes(id)) {
            setList(list.filter((i) => i !== id));
        } else {
            if (list.length >= MAX) return;
            setList([...list, id]);
        }
    };

    const guardarDocumento = (e) => {
        e.preventDefault();
        if (processing) return;

        setProcessing(true);

        const contenido =
            quillRef.current?.getEditor().root.innerHTML ?? "";

        const fd = new FormData();
        fd.append("titulo", titulo);
        fd.append("contenido", contenido);
        if (portada) fd.append("portada", portada);

        tagsSel.forEach((id) => fd.append("tags[]", id));
        deptosSel.forEach((id) => fd.append("departamentos[]", id));
        fd.append("_method", "PUT");

        router.post(`/documentacion/${documento.id}`, fd, {
            forceFormData: true,
            onFinish: () => setProcessing(false),
        });
    };

    const subirAdjuntos = () => {
        if (adjuntos.length === 0) return;

        const pesados = adjuntos.filter((f) => f.size > MAX_ADJUNTO_BYTES);
        if (pesados.length > 0) {
            alert(`Estos archivos superan los 100 MB: ${pesados.map((f) => f.name).join(", ")}`);
            return;
        }

        const fd = new FormData();
        adjuntos.forEach((f) => fd.append("archivos[]", f));

        router.post(
            `/documentacion/${documento.id}/adjuntos`,
            fd,
            { forceFormData: true }
        );
    };

    return (
        <AppLayout>
            <div className="max-w-3xl mx-auto bg-white p-6 mt-10 rounded shadow">
                <h1 className="text-2xl font-bold mb-4">
                    ✏️ Editar Documento
                </h1>

                {flash?.success && (
                    <div className="mb-4 p-3 bg-brand-lime/15 text-brand-blue rounded">
                        {flash.success}
                    </div>
                )}

                {/* FORM PRINCIPAL */}
                <form className="space-y-6">
                    {/* TÍTULO */}
                    <input
                        className="w-full border px-3 py-2 rounded"
                        value={titulo}
                        onChange={(e) => setTitulo(e.target.value)}
                        required
                    />

                    {/* CONTENIDO */}
                    <ReactQuill
                        ref={quillRef}
                        defaultValue={documento.contenido ?? ""}
                        modules={quillModules}
                    />

                    {/* TAGS */}
                    <div>
                        <button
                            type="button"
                            onClick={() => setOpenTags(!openTags)}
                            className="border px-3 py-2 rounded w-full text-left"
                        >
                            🏷 Tags ({tagsSel.length}/20)
                        </button>

                        {openTags && (
                            <div className="border mt-2 rounded">
                                <div className="max-h-48 overflow-y-auto">
                                    {tags.map((t) => (
                                        <div
                                            key={t.id}
                                            onClick={() =>
                                                toggle(
                                                    t.id,
                                                    tagsSel,
                                                    setTagsSel
                                                )
                                            }
                                            className={`px-3 py-1 cursor-pointer ${
                                                tagsSel.includes(t.id)
                                                    ? "bg-brand-peach"
                                                    : ""
                                            }`}
                                        >
                                            {t.descripcion}
                                        </div>
                                    ))}
                                </div>

                                <div className="border-t p-2 text-right">
                                    <button
                                        type="button"
                                        onClick={() => setOpenTags(false)}
                                        className="bg-gradient-to-r from-brand-blue to-brand-blue-mid text-white px-3 py-1 rounded text-sm"
                                    >
                                        Aceptar
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* DEPARTAMENTOS */}
                    <div>
                        <button
                            type="button"
                            onClick={() => setOpenDeptos(!openDeptos)}
                            className="border px-3 py-2 rounded w-full text-left"
                        >
                            🏢 Departamentos ({deptosSel.length}/20)
                        </button>

                        {openDeptos && (
                            <div className="border mt-2 rounded">
                                <div className="max-h-48 overflow-y-auto">
                                    {departamentos.map((d) => (
                                        <div
                                            key={d.id}
                                            onClick={() =>
                                                toggle(
                                                    d.id,
                                                    deptosSel,
                                                    setDeptosSel
                                                )
                                            }
                                            className={`px-3 py-1 cursor-pointer ${
                                                deptosSel.includes(d.id)
                                                    ? "bg-brand-peach"
                                                    : ""
                                            }`}
                                        >
                                            {d.nombre}
                                        </div>
                                    ))}
                                </div>

                                <div className="border-t p-2 text-right">
                                    <button
                                        type="button"
                                        onClick={() => setOpenDeptos(false)}
                                        className="bg-gradient-to-r from-brand-blue to-brand-blue-mid text-white px-3 py-1 rounded text-sm"
                                    >
                                        Aceptar
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* PORTADA */}
                    <div>
                        <label className="block font-medium">Portada</label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) =>
                                setPortada(e.target.files[0])
                            }
                        />
                    </div>
                </form>

                {/* ADJUNTOS EXISTENTES */}
                {documento.adjuntos?.length > 0 && (
                    <>
                        <hr className="my-6" />
                        <h2 className="font-semibold mb-2">📎 Adjuntos</h2>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {documento.adjuntos.map((a) => (
                                <AdjuntoPreview
                                    key={a.id}
                                    adjunto={a}
                                    verUrl={route("documentacion.adjuntos.ver", a.id)}
                                    downloadUrl={`/documentacion/adjuntos/${a.id}`}
                                    onDelete={() =>
                                        router.delete(
                                            `/documentacion/adjuntos/${a.id}`
                                        )
                                    }
                                />
                            ))}
                        </div>
                    </>
                )}

                {/* SUBIR NUEVOS ADJUNTOS */}
                <hr className="my-6" />

                <h2 className="font-semibold mb-2">
                    📎 Subir nuevos adjuntos
                </h2>

                <input
                    type="file"
                    multiple
                    onChange={(e) =>
                        setAdjuntos([...e.target.files])
                    }
                />
                <p className="text-xs text-gray-400 mt-1">Tamaño máximo por archivo: 100 MB</p>

                <button
                    onClick={subirAdjuntos}
                    className="mt-3 bg-brand-blue text-white px-4 py-2 rounded"
                >
                    Subir adjuntos
                </button>

                {/* 🔥 BOTÓN FINAL */}
                <div className="mt-10 text-right">
                    <button
                        onClick={guardarDocumento}
                        disabled={processing}
                        className="bg-gradient-to-r from-brand-blue to-brand-blue-mid text-white px-6 py-2 rounded"
                    >
                        {processing ? "Guardando..." : "Guardar cambios"}
                    </button>
                </div>
            </div>
        </AppLayout>
    );
}