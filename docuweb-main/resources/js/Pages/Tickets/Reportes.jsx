import React from "react";
import AppLayout from "@/Layouts/AppLayout";
import { Head } from "@inertiajs/react";

function StatCard({ label, value, color = "text-brand-blue" }) {
    return (
        <div className="bg-white rounded-xl shadow p-5">
            <div className={`text-3xl font-bold ${color}`}>{value}</div>
            <div className="text-sm text-gray-500 mt-1">{label}</div>
        </div>
    );
}

function BarRow({ label, value, max }) {
    const pct = max > 0 ? Math.round((value / max) * 100) : 0;
    return (
        <div className="mb-2">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>{label}</span>
                <span className="font-semibold">{value}</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                    className="bg-gradient-to-r from-brand-blue to-brand-blue-mid h-2 rounded-full"
                    style={{ width: `${pct}%` }}
                />
            </div>
        </div>
    );
}

export default function Reportes({ stats, porProyecto, porPersona, porTipo, porProyectoProduccionTesting }) {
    const maxProyecto = Math.max(1, ...porProyecto.map((p) => p.total));
    const maxPersona = Math.max(1, ...porPersona.map((p) => p.total));
    const maxTipo = Math.max(1, ...porTipo.map((p) => p.total));

    return (
        <AppLayout>
            <Head title="Reportes de Tickets" />

            <div className="min-h-screen bg-gray-100">
                <div className="sticky top-0 z-10 bg-white border-b shadow-sm">
                    <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <span className="text-brand-mango text-3xl">📊</span>
                            Reportes de Tickets
                        </h1>

                        <a
                            href={route("tickets.reportes.export")}
                            className="bg-gradient-to-r from-brand-blue to-brand-blue-mid hover:from-brand-blue-dark hover:to-brand-blue text-white px-4 py-2 rounded-lg text-sm"
                        >
                            ⬇️ Exportar CSV
                        </a>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-6 py-6">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                        <StatCard label="Abiertos" value={stats.abiertos} />
                        <StatCard label="Cerrados (total)" value={stats.cerrados_total} />
                        <StatCard
                            label="Cerrados (30 días)"
                            value={stats.cerrados_ultimos_30}
                        />
                        <StatCard
                            label="Tiempo prom. resolución"
                            value={`${stats.tiempo_promedio_horas}h`}
                        />
                        <StatCard
                            label="Cumplimiento SLA"
                            value={`${stats.sla_cumplimiento_pct}%`}
                            color={
                                stats.sla_cumplimiento_pct >= 80
                                    ? "text-brand-lime"
                                    : "text-red-600"
                            }
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white rounded-xl shadow p-5">
                            <h2 className="font-semibold text-gray-700 mb-4">
                                Por proyecto
                            </h2>
                            {porProyecto.length === 0 && (
                                <p className="text-sm text-gray-400">Sin datos</p>
                            )}
                            {porProyecto.map((p) => (
                                <BarRow
                                    key={p.proyecto_id ?? "sin-proyecto"}
                                    label={p.proyecto?.nombre || "Sin proyecto"}
                                    value={p.total}
                                    max={maxProyecto}
                                />
                            ))}
                        </div>

                        <div className="bg-white rounded-xl shadow p-5">
                            <h2 className="font-semibold text-gray-700 mb-4">
                                Por persona asignada
                            </h2>
                            {porPersona.length === 0 && (
                                <p className="text-sm text-gray-400">Sin datos</p>
                            )}
                            {porPersona.map((p) => (
                                <BarRow
                                    key={p.asignado_id}
                                    label={
                                        p.asignado?.cargo
                                            ? `${p.asignado.name} (${p.asignado.cargo})`
                                            : p.asignado?.name || "—"
                                    }
                                    value={p.total}
                                    max={maxPersona}
                                />
                            ))}
                        </div>

                        <div className="bg-white rounded-xl shadow p-5">
                            <h2 className="font-semibold text-gray-700 mb-4">
                                Por tipo
                            </h2>
                            {porTipo.length === 0 && (
                                <p className="text-sm text-gray-400">Sin datos</p>
                            )}
                            {porTipo.map((p) => (
                                <BarRow
                                    key={p.tipo}
                                    label={p.tipo}
                                    value={p.total}
                                    max={maxTipo}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow p-6 mt-6">
                        <h2 className="font-semibold text-gray-700 mb-1">
                            🧪 Producción y testing por proyecto
                        </h2>
                        <p className="text-xs text-gray-400 mb-4">
                            "En testing" agrupa los estados marcados como prueba/QA en
                            Admin → Catálogos. "En progreso" es con tester asignado y QA
                            sin aprobar; "finalizado" es con QA ya aprobado.
                        </p>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left text-gray-500 border-b">
                                        <th className="py-2 pr-4">Proyecto</th>
                                        <th className="py-2 px-3 text-center">
                                            Sin subir a producción
                                        </th>
                                        <th className="py-2 px-3 text-center">
                                            En testing
                                        </th>
                                        <th className="py-2 px-3 text-center">
                                            Testing en progreso (tester)
                                        </th>
                                        <th className="py-2 px-3 text-center">
                                            Testing finalizado
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {porProyectoProduccionTesting.map((p) => (
                                        <tr
                                            key={p.proyecto_id ?? "sin-proyecto"}
                                            className="border-b last:border-0"
                                        >
                                            <td className="py-2 pr-4 font-medium text-gray-700 whitespace-nowrap">
                                                {p.proyecto}
                                            </td>
                                            <td className="py-2 px-3 text-center">
                                                <span className="px-2 py-0.5 rounded-full bg-brand-peach/40 text-brand-blue text-xs font-semibold">
                                                    {p.no_produccion}
                                                </span>
                                            </td>
                                            <td className="py-2 px-3 text-center">
                                                <span className="px-2 py-0.5 rounded-full bg-brand-cyan/20 text-brand-blue text-xs font-semibold">
                                                    {p.en_testing}
                                                </span>
                                            </td>
                                            <td className="py-2 px-3 text-center">
                                                <span className="px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 text-xs font-semibold">
                                                    {p.testing_en_progreso}
                                                </span>
                                            </td>
                                            <td className="py-2 px-3 text-center">
                                                <span className="px-2 py-0.5 rounded-full bg-brand-lime/20 text-brand-blue text-xs font-semibold">
                                                    {p.testing_finalizado}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
