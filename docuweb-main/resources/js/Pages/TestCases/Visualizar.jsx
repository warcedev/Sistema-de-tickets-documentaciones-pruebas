import React from "react";
import AppLayout from "@/Layouts/AppLayout";
import { Head, Link, router } from "@inertiajs/react";
import SuiteTree from "@/Components/SuiteTree";

const estadoColor = {
    Exitoso: "bg-brand-lime/30 text-green-700",
    Fallido: "bg-red-100 text-red-700",
    Bloqueado: "bg-brand-peach text-brand-blue",
};

export default function Visualizar({ suites, suiteSeleccionada, casos }) {
    const seleccionar = (id) => {
        router.get(route("test-visualizar.index"), { suite_id: id }, { preserveState: true });
    };

    const suiteActual = suites.find((s) => s.id === Number(suiteSeleccionada));

    return (
        <AppLayout>
            <Head title="Visualizar Casos de Prueba" />

            <div className="min-h-screen bg-gray-100">
                <div className="sticky top-0 z-10 bg-white border-b shadow-sm">
                    <div className="max-w-7xl mx-auto px-6 py-4">
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <span className="text-brand-mango text-3xl">👁️</span>
                            Visualizar Casos de Prueba
                        </h1>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-6 py-6 grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="md:col-span-1 bg-white rounded-xl shadow p-4 h-fit">
                        <h2 className="font-semibold mb-3">📁 Suites</h2>
                        {suites.length === 0 ? (
                            <p className="text-sm text-gray-400">Todavía no hay suites.</p>
                        ) : (
                            <SuiteTree
                                suites={suites}
                                seleccionada={Number(suiteSeleccionada)}
                                onSelect={seleccionar}
                            />
                        )}
                    </div>

                    <div className="md:col-span-3 bg-white rounded-xl shadow p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold">
                                Casos de prueba {suiteActual ? `— ${suiteActual.nombre}` : ""}
                            </h2>
                            {suiteActual && (
                                <a
                                    href={route("test-visualizar.pdf-suite", suiteActual.id)}
                                    className="bg-gradient-to-r from-brand-blue to-brand-blue-mid hover:from-brand-blue-dark hover:to-brand-blue text-white px-4 py-2 rounded-lg text-sm"
                                >
                                    📄 Exportar PDF de esta suite
                                </a>
                            )}
                        </div>

                        <div className="space-y-3">
                            {casos.map((c, idx) => (
                                <Link
                                    key={c.id}
                                    href={route("test-visualizar.show", c.id)}
                                    className="block border rounded-lg p-4 hover:border-brand-blue hover:shadow-md transition stagger-item"
                                    style={{ animationDelay: `${Math.min(idx, 12) * 30}ms` }}
                                >
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="font-semibold">{c.titulo}</p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                {c.pasos_count} paso{c.pasos_count === 1 ? "" : "s"} ·{" "}
                                                {c.ejecuciones_count} ejecución
                                                {c.ejecuciones_count === 1 ? "" : "es"}
                                            </p>
                                        </div>
                                        {c.ultima_ejecucion ? (
                                            <span
                                                className={`text-xs px-3 py-1 rounded-full ${
                                                    estadoColor[c.ultima_ejecucion.estado]
                                                }`}
                                            >
                                                Última: {c.ultima_ejecucion.estado}
                                            </span>
                                        ) : (
                                            <span className="text-xs px-3 py-1 rounded-full bg-gray-100 text-gray-500">
                                                Sin ejecutar
                                            </span>
                                        )}
                                    </div>
                                </Link>
                            ))}
                            {suiteSeleccionada && casos.length === 0 && (
                                <p className="text-sm text-gray-400">
                                    Esta suite todavía no tiene casos de prueba propios.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
