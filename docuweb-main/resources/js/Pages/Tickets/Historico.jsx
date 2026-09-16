import React, { useState, useMemo } from "react";
import AppLayout from "@/Layouts/AppLayout";
import { Head } from "@inertiajs/react";

export default function Historico({ tickets, proyectos }) {
    const [texto, setTexto] = useState("");
    const [proyecto, setProyecto] = useState("");

    const filtrados = useMemo(() => {
        return tickets.filter((t) => {
            const matchTexto =
                texto === "" ||
                t.numero.toLowerCase().includes(texto.toLowerCase()) ||
                t.titulo.toLowerCase().includes(texto.toLowerCase());
            const matchProyecto =
                proyecto === "" || t.proyecto?.id === Number(proyecto);
            return matchTexto && matchProyecto;
        });
    }, [tickets, texto, proyecto]);

    return (
        <AppLayout>
            <Head title="Histórico de Tickets" />

            <div className="min-h-screen bg-gray-100">
                <div className="sticky top-0 z-10 bg-white border-b shadow-sm">
                    <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <span className="text-brand-mango text-3xl">🕘</span>
                            Histórico de Tickets
                        </h1>
                        <span className="text-sm text-gray-500">
                            Tickets cerrados
                        </span>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-6 py-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input
                        type="text"
                        placeholder="Buscar por número o título…"
                        className="border rounded px-4 py-2"
                        value={texto}
                        onChange={(e) => setTexto(e.target.value)}
                    />

                    <select
                        className="border rounded px-4 py-2"
                        value={proyecto}
                        onChange={(e) => setProyecto(e.target.value)}
                    >
                        <option value="">Todos los proyectos</option>
                        {proyectos.map((p) => (
                            <option key={p.id} value={p.id}>
                                {p.nombre}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="max-w-7xl mx-auto px-6 pb-10">
                    <div className="bg-white rounded-xl shadow overflow-x-auto">
                        <table className="min-w-full">
                            <thead className="bg-gray-700 text-white">
                                <tr>
                                    <th className="p-3 text-left">N°</th>
                                    <th className="p-3 text-left">Título</th>
                                    <th className="p-3 text-left">Tipo</th>
                                    <th className="p-3 text-left">Proyecto</th>
                                    <th className="p-3 text-left">Solicitante</th>
                                    <th className="p-3 text-left">Cerrado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtrados.length > 0 ? (
                                    filtrados.map((t, idx) => (
                                        <tr
                                            key={t.id}
                                            className="border-t hover:bg-gray-50 cursor-pointer stagger-item"
                                            style={{ animationDelay: `${Math.min(idx, 12) * 25}ms` }}
                                            onClick={() =>
                                                (window.location.href = route(
                                                    "tickets.show",
                                                    t.id
                                                ))
                                            }
                                        >
                                            <td className="p-3 font-mono text-sm text-brand-blue">
                                                #{t.numero}
                                            </td>
                                            <td className="p-3">{t.titulo}</td>
                                            <td className="p-3">{t.tipo}</td>
                                            <td className="p-3 text-gray-600">
                                                {t.proyecto?.nombre || "—"}
                                            </td>
                                            <td className="p-3 text-gray-600">
                                                {t.solicitante?.name}
                                            </td>
                                            <td className="p-3 text-gray-500 text-sm">
                                                {new Date(
                                                    t.updated_at
                                                ).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="p-6 text-center text-gray-500"
                                        >
                                            No hay tickets cerrados
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
