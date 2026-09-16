import React, { useState, useRef, useMemo, useEffect } from "react";
import AppLayout from "@/Layouts/AppLayout";
import { router } from "@inertiajs/react";
import ReactQuill from "react-quill";
import hljs from "highlight.js";
import { fixQuillImagePaste } from "@/lib/quillImagePaste";

import "react-quill/dist/quill.snow.css";
import "../../../css/quill.css";
import "highlight.js/styles/github.css";

const MAX_ADJUNTO_BYTES = 100 * 1024 * 1024;

export default function Create({ tags, departamentos }) {
    const quillRef = useRef(null);

    const [titulo, setTitulo] = useState("");
    const [portada, setPortada] = useState(null);
    const [previewPortada, setPreviewPortada] = useState(null);
    const [adjuntos, setAdjuntos] = useState([]);

    const [tagsSel, setTagsSel] = useState([]);
    const [deptosSel, setDeptosSel] = useState([]);

    const [openTags, setOpenTags] = useState(false);
    const [openDeptos, setOpenDeptos] = useState(false);

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

    const handlePortadaChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 6 * 1024 * 1024) {
            alert("La portada no puede superar 6 MB");
            return;
        }

        setPortada(file);
        const reader = new FileReader();
        reader.onload = () => setPreviewPortada(reader.result);
        reader.readAsDataURL(file);
    };

    const submit = (e) => {
        e.preventDefault();

        const pesados = adjuntos.filter((f) => f.size > MAX_ADJUNTO_BYTES);
        if (pesados.length > 0) {
            alert(`Estos archivos superan los 100 MB: ${pesados.map((f) => f.name).join(", ")}`);
            return;
        }

        const contenido =
            quillRef.current?.getEditor().root.innerHTML ?? "";

        const fd = new FormData();
        fd.append("titulo", titulo);
        fd.append("contenido", contenido);

        if (portada) fd.append("portada", portada);

        tagsSel.forEach((id) => fd.append("tags[]", id));
        deptosSel.forEach((id) => fd.append("departamentos[]", id));

        router.post("/documentacion", fd, {
            forceFormData: true,
            onSuccess: (page) => {
                const docId = page.props?.documento?.id;

                if (docId && adjuntos.length > 0) {
                    const fa = new FormData();
                    adjuntos.forEach((f) => fa.append("archivos[]", f));

                    router.post(
                        `/documentacion/${docId}/adjuntos`,
                        fa,
                        { forceFormData: true }
                    );
                }
            },
        });
    };

    return (
        <AppLayout>
            <div className="max-w-3xl mx-auto bg-white p-6 mt-10 rounded shadow">
                <h1 className="text-2xl font-bold mb-6">
                    ➕ Crear documentación
                </h1>

                <form onSubmit={submit} className="space-y-6">
                    {/* TÍTULO */}
                    <input
                        className="w-full border px-3 py-2 rounded"
                        placeholder="Título"
                        value={titulo}
                        onChange={(e) => setTitulo(e.target.value)}
                        required
                    />

                    {/* CONTENIDO */}
                    <ReactQuill ref={quillRef} modules={quillModules} />

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
                                        onClick={() =>
                                            setOpenTags(false)
                                        }
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
                            onClick={() =>
                                setOpenDeptos(!openDeptos)
                            }
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
                                        onClick={() =>
                                            setOpenDeptos(false)
                                        }
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
                            onChange={handlePortadaChange}
                        />
                        {previewPortada && (
                            <img
                                src={previewPortada}
                                className="mt-3 max-h-48 rounded"
                            />
                        )}
                    </div>

                    {/* ADJUNTOS */}
                    <div>
                        <label className="block font-medium">Adjuntos</label>
                        <input
                            type="file"
                            multiple
                            onChange={(e) =>
                                setAdjuntos([...e.target.files])
                            }
                        />
                        <p className="text-xs text-gray-400 mt-1">Tamaño máximo por archivo: 100 MB</p>
                    </div>

                    <button className="bg-gradient-to-r from-brand-blue to-brand-blue-mid text-white px-6 py-2 rounded">
                        Guardar
                    </button>
                </form>
            </div>
        </AppLayout>
    );
}