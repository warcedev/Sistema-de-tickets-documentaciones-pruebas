import React, { useState, useMemo } from "react";
import AppLayout from "@/Layouts/AppLayout";
import { Head, Link } from "@inertiajs/react";

const prioridadColor = {
    Baja: "bg-brand-lime/20 text-brand-blue",
    Normal: "bg-brand-cyan/20 text-brand-blue",
    Alta: "bg-brand-peach text-brand-blue",
    Urgente: "bg-red-100 text-red-700",
};

function slaIndicator(t) {
    if (!t.sla_vencimiento) return null;
    const horas = (new Date(t.sla_vencimiento) - new Date()) / 3600000;
    if (horas < 0) return { color: "bg-red-500", label: "Vencido" };
    if (horas < 8) return { color: "bg-brand-mango", label: `${Math.round(horas)}h` };
    return { color: "bg-brand-lime", label: "OK" };
}

export default function Gestionar({ tickets, proyectos, estados, departamentos, usuarios, tipos, prioridades, puedeCrear, puedeImportar }) {
    const [numero, setNumero] = useState("");
    const [texto, setTexto] = useState("");
    const [tipo, setTipo] = useState("");
    const [prioridad, setPrioridad] = useState("");
    const [proyecto, setProyecto] = useState("");
    const [estado, setEstado] = useState("");
    const [asignado, setAsignado] = useState("");
    const [qaAsignado, setQaAsignado] = useState("");
    const [solicitante, setSolicitante] = useState("");
    const [departamento, setDepartamento] = useState("");

    const filtrados = useMemo(() => {
        return tickets.filter((t) => {
            const matchNumero =
                numero === "" || t.numero.toLowerCase().includes(numero.toLowerCase());
            const matchTexto =
                texto === "" ||
                t.titulo.toLowerCase().includes(texto.toLowerCase());
            const matchTipo = tipo === "" || t.tipo === tipo;
            const matchPrioridad = prioridad === "" || t.prioridad === prioridad;
            const matchProyecto =
                proyecto === "" || t.proyecto?.id === Number(proyecto);
            const matchEstado = estado === "" || t.estado?.id === Number(estado);
            const matchAsignado =
                asignado === "" || t.asignado?.id === Number(asignado);
            const matchQaAsignado =
                qaAsignado === "" || t.qa_asignado?.id === Number(qaAsignado);
            const matchSolicitante =
                solicitante === "" || t.solicitante?.id === Number(solicitante);
            const matchDepartamento =
                departamento === "" ||
                t.departamento?.id === Number(departamento) ||
                t.solicitante?.departamento?.id === Number(departamento) ||
                t.asignado?.departamento?.id === Number(departamento);

            return (
                matchNumero &&
                matchTexto &&
                matchTipo &&
                matchPrioridad &&
                matchProyecto &&
                matchEstado &&
                matchAsignado &&
                matchQaAsignado &&
                matchSolicitante &&
                matchDepartamento
            );
        });
    }, [
        tickets,
        numero,
        texto,
        tipo,
        prioridad,
        proyecto,
        estado,
        asignado,
        qaAsignado,
        solicitante,
        departamento,
    ]);

    return (
        <AppLayout>
            <Head title="Gestionar Tickets" />

            <div className="min-h-screen bg-gray-100">
                <div className="sticky top-0 z-10 bg-white border-b shadow-sm">
                    <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <span className="text-brand-mango text-3xl">🎫</span>
                            Gestionar Tickets
                        </h1>

                        <div className="flex gap-3">
                            {puedeImportar && (
                                <Link
                                    href={route("tickets.importar.form")}
                                    className="border border-brand-blue text-brand-blue hover:bg-brand-blue hover:text-white px-5 py-2 rounded-lg"
                                >
                                    ⬆️ Importar tickets
                                </Link>
                            )}

                            {puedeCrear && (
                                <Link
                                    href={route("tickets.create")}
                                    className="bg-gradient-to-r from-brand-blue to-brand-blue-mid hover:from-brand-blue-dark hover:to-brand-blue text-white px-5 py-2 rounded-lg"
                                >
                                    + Nuevo Ticket
                                </Link>
                            )}
                        </div>
                    </div>
                </div>

                {/* FILTROS */}
                <div className="max-w-7xl mx-auto px-6 pt-6 grid grid-cols-1 md:grid-cols-5 gap-4">
                    <input
                        type="text"
                        placeholder="🔎 Buscar por N° de ticket…"
                        className="border rounded px-4 py-2"
                        value={numero}
                        onChange={(e) => setNumero(e.target.value)}
                    />

                    <input
                        type="text"
                        placeholder="Buscar por título…"
                        className="border rounded px-4 py-2"
                        value={texto}
                        onChange={(e) => setTexto(e.target.value)}
                    />

                    <select
                        className="border rounded px-4 py-2"
                        value={tipo}
                        onChange={(e) => setTipo(e.target.value)}
                    >
                        <option value="">Todos los tipos</option>
                        {tipos.map((t) => (
                            <option key={t} value={t}>
                                {t}
                            </option>
                        ))}
                    </select>

                    <select
                        className="border rounded px-4 py-2"
                        value={prioridad}
                        onChange={(e) => setPrioridad(e.target.value)}
                    >
                        <option value="">Todas las prioridades</option>
                        {prioridades.map((p) => (
                            <option key={p} value={p}>
                                {p}
                            </option>
                        ))}
                    </select>

                    <select
                        className="border rounded px-4 py-2"
                        value={estado}
                        onChange={(e) => setEstado(e.target.value)}
                    >
                        <option value="">Todos los estados</option>
                        {estados.map((e) => (
                            <option key={e.id} value={e.id}>
                                {e.nombre}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="max-w-7xl mx-auto px-6 py-4 grid grid-cols-1 md:grid-cols-5 gap-4">
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

                    <select
                        className="border rounded px-4 py-2"
                        value={departamento}
                        onChange={(e) => setDepartamento(e.target.value)}
                    >
                        <option value="">Todos los departamentos</option>
                        {departamentos.map((d) => (
                            <option key={d.id} value={d.id}>
                                {d.nombre}
                            </option>
                        ))}
                    </select>

                    <select
                        className="border rounded px-4 py-2"
                        value={asignado}
                        onChange={(e) => setAsignado(e.target.value)}
                    >
                        <option value="">Persona asignada (todas)</option>
                        {usuarios.map((u) => (
                            <option key={u.id} value={u.id}>
                                {u.name} {u.apellido}
                            </option>
                        ))}
                    </select>

                    <select
                        className="border rounded px-4 py-2"
                        value={qaAsignado}
                        onChange={(e) => setQaAsignado(e.target.value)}
                    >
                        <option value="">QA asignado (todos)</option>
                        {usuarios.map((u) => (
                            <option key={u.id} value={u.id}>
                                {u.name} {u.apellido}
                            </option>
                        ))}
                    </select>

                    <select
                        className="border rounded px-4 py-2"
                        value={solicitante}
                        onChange={(e) => setSolicitante(e.target.value)}
                    >
                        <option value="">Quién lo creó (todos)</option>
                        {usuarios.map((u) => (
                            <option key={u.id} value={u.id}>
                                {u.name} {u.apellido}
                            </option>
                        ))}
                    </select>
                </div>

                {/* TABLA */}
                <div className="max-w-7xl mx-auto px-6 pb-10">
                    <div className="bg-white rounded-xl shadow overflow-x-auto">
                        <table className="min-w-full">
                            <thead className="bg-gradient-to-r from-brand-blue to-brand-blue-mid text-white">
                                <tr>
                                    <th className="p-3 text-left">N°</th>
                                    <th className="p-3 text-left">Título</th>
                                    <th className="p-3 text-left">Tipo</th>
                                    <th className="p-3 text-left">Prioridad</th>
                                    <th className="p-3 text-left">Proyecto</th>
                                    <th className="p-3 text-left">Departamento</th>
                                    <th className="p-3 text-left">Estado</th>
                                    <th className="p-3 text-left">Asignado</th>
                                    <th className="p-3 text-left">SLA</th>
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
                                            <td className="p-3">
                                                <span
                                                    className={`px-2 py-1 rounded-full text-xs ${
                                                        prioridadColor[t.prioridad] ||
                                                        "bg-gray-100 text-gray-700"
                                                    }`}
                                                >
                                                    {t.prioridad}
                                                </span>
                                            </td>
                                            <td className="p-3 text-gray-600">
                                                {t.proyecto?.nombre || "—"}
                                            </td>
                                            <td className="p-3 text-gray-600">
                                                {t.departamento?.nombre || "—"}
                                            </td>
                                            <td className="p-3">
                                                <span
                                                    className="px-2 py-1 rounded-full text-xs text-white"
                                                    style={{
                                                        backgroundColor:
                                                            t.estado?.color ||
                                                            "#6B7280",
                                                    }}
                                                >
                                                    {t.estado?.nombre}
                                                </span>
                                            </td>
                                            <td className="p-3 text-gray-600">
                                                {t.asignado?.name || "Sin asignar"}
                                            </td>
                                            <td className="p-3">
                                                {slaIndicator(t) && (
                                                    <span className="flex items-center gap-1.5 text-xs text-gray-600">
                                                        <span
                                                            className={`w-2.5 h-2.5 rounded-full inline-block ${
                                                                slaIndicator(t).color
                                                            }`}
                                                        />
                                                        {slaIndicator(t).label}
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={9}
                                            className="p-6 text-center text-gray-500"
                                        >
                                            No hay tickets para mostrar
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
