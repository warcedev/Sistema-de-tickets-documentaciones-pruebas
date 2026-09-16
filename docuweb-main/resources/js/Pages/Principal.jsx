import React, { useState, useMemo } from "react";
import AppLayout from "@/Layouts/AppLayout";
import { Link, usePage, router } from "@inertiajs/react";

export default function Principal() {
    const { documentos = [], auth } = usePage().props;

    const [texto, setTexto] = useState("");
    const [autor, setAutor] = useState("");
    const [tag, setTag] = useState("");
    const [departamento, setDepartamento] = useState("");

    const puedeCrear =
        auth?.user &&
        ["Administrador", "Gerente"].includes(auth.user.rol);

    /* ===============================
       Opciones únicas para filtros
    =============================== */
    const autores = useMemo(() => {
        const map = new Map();
        documentos.forEach((d) => {
            if (d.autor) map.set(d.autor.id, d.autor.name);
        });
        return Array.from(map.entries()).map(([id, name]) => ({
            id,
            name,
        }));
    }, [documentos]);

    const tags = useMemo(() => {
        const map = new Map();
        documentos.forEach((d) =>
            d.tags?.forEach((t) => map.set(t.id, t.descripcion))
        );
        return Array.from(map.entries()).map(([id, descripcion]) => ({
            id,
            descripcion,
        }));
    }, [documentos]);

    const departamentos = useMemo(() => {
        const map = new Map();
        documentos.forEach((d) =>
            d.departamentos?.forEach((dep) =>
                map.set(dep.id, dep.nombre)
            )
        );
        return Array.from(map.entries()).map(([id, nombre]) => ({
            id,
            nombre,
        }));
    }, [documentos]);

    /* ===============================
       FILTRADO PRINCIPAL
    =============================== */
    const documentosFiltrados = useMemo(() => {
        return documentos.filter((doc) => {
            const matchTexto =
                texto === "" ||
                doc.titulo.toLowerCase().includes(texto.toLowerCase()) ||
                (doc.contenido &&
                    doc.contenido
                        .toLowerCase()
                        .includes(texto.toLowerCase()));

            const matchAutor =
                autor === "" || doc.autor?.id === Number(autor);

            const matchTag =
                tag === "" ||
                doc.tags?.some((t) => t.id === Number(tag));

            const matchDepartamento =
                departamento === "" ||
                doc.departamentos?.some(
                    (d) => d.id === Number(departamento)
                );

            return (
                matchTexto &&
                matchAutor &&
                matchTag &&
                matchDepartamento
            );
        });
    }, [documentos, texto, autor, tag, departamento]);

    const eliminarDocumento = (id) => {
        if (confirm("¿Seguro que deseas eliminar este documento?")) {
            router.delete(`/documentacion/${id}`);
        }
    };

    return (
        <AppLayout>
            <div className="min-h-screen bg-gray-100">
                {/* HEADER */}
                <div className="sticky top-0 z-10 bg-white border-b shadow-sm">
                    <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <span className="text-brand-mango text-3xl">📂</span>
                            Documentación DOCWeb
                        </h1>

                        {puedeCrear && (
                            <Link
                                href="/documentacion/create"
                                className="bg-gradient-to-r from-brand-blue to-brand-blue-mid hover:from-brand-blue-dark hover:to-brand-blue text-white px-5 py-2 rounded-lg"
                            >
                                + Nuevo Documento
                            </Link>
                        )}
                    </div>
                </div>

                {/* FILTROS */}
                <div className="max-w-7xl mx-auto px-6 py-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                    <input
                        type="text"
                        placeholder="Buscar por texto…"
                        className="border rounded px-4 py-2"
                        value={texto}
                        onChange={(e) => setTexto(e.target.value)}
                    />

                    <select
                        className="border rounded px-4 py-2"
                        value={autor}
                        onChange={(e) => setAutor(e.target.value)}
                    >
                        <option value="">👤 Todos los autores</option>
                        {autores.map((a) => (
                            <option key={a.id} value={a.id}>
                                {a.name}
                            </option>
                        ))}
                    </select>

                    <select
                        className="border rounded px-4 py-2"
                        value={tag}
                        onChange={(e) => setTag(e.target.value)}
                    >
                        <option value="">🏷️ Todos los tags</option>
                        {tags.map((t) => (
                            <option key={t.id} value={t.id}>
                                {t.descripcion}
                            </option>
                        ))}
                    </select>

                    <select
                        className="border rounded px-4 py-2"
                        value={departamento}
                        onChange={(e) =>
                            setDepartamento(e.target.value)
                        }
                    >
                        <option value="">
                            🏢 Todos los departamentos
                        </option>
                        {departamentos.map((d) => (
                            <option key={d.id} value={d.id}>
                                {d.nombre}
                            </option>
                        ))}
                    </select>
                </div>

                {/* GRID */}
                <div className="max-w-7xl mx-auto px-6 pb-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {documentosFiltrados.length > 0 ? (
                        documentosFiltrados.map((doc, idx) => (
                            <div
                                key={doc.id}
                                className="bg-white border rounded-xl shadow hover:shadow-lg stagger-item"
                                style={{ animationDelay: `${Math.min(idx, 12) * 30}ms` }}
                            >
                                <div className="p-4">
                                    <h2 className="font-semibold text-lg mb-2">
                                        {doc.titulo}
                                    </h2>

                                    {/* TAGS */}
                                    {doc.tags?.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mb-2">
                                            {doc.tags.map((t) => (
                                                <span
                                                    key={t.id}
                                                    className="text-xs bg-brand-leaf/20 text-brand-blue px-2 py-1 rounded-full"
                                                >
                                                    #{t.descripcion}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    {/* DEPARTAMENTOS */}
                                    {doc.departamentos?.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mb-2">
                                            {doc.departamentos.map((d) => (
                                                <span
                                                    key={d.id}
                                                    className="text-xs bg-brand-lime/20 text-brand-blue px-2 py-1 rounded-full"
                                                >
                                                    {d.nombre}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    <Link
                                        href={`/documentacion/${doc.id}`}
                                        className="text-brand-mango text-sm underline"
                                    >
                                        Ver documento →
                                    </Link>

                                    {puedeCrear && (
                                        <div className="flex gap-2 mt-4">
                                            <Link
                                                href={`/documentacion/${doc.id}/edit`}
                                                className="flex-1 bg-gradient-to-r from-brand-blue to-brand-blue-mid hover:from-brand-blue-dark hover:to-brand-blue text-white py-2 rounded text-sm text-center"
                                            >
                                                ✏️ Editar
                                            </Link>
                                            <button
                                                onClick={() =>
                                                    eliminarDocumento(
                                                        doc.id
                                                    )
                                                }
                                                className="flex-1 bg-red-600 text-white py-2 rounded text-sm"
                                            >
                                                🗑 Eliminar
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="col-span-full text-center text-gray-500">
                            No se encontraron documentos con esos filtros.
                        </p>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}