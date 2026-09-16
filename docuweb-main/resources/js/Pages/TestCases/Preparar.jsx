import React, { useMemo, useState } from "react";
import AppLayout from "@/Layouts/AppLayout";
import { Head, Link, router, usePage } from "@inertiajs/react";
import SuiteTree from "@/Components/SuiteTree";
import KebabMenu from "@/Components/KebabMenu";

const prioridadColor = {
    Baja: "bg-brand-lime/20 text-brand-blue",
    Normal: "bg-brand-cyan/20 text-brand-blue",
    Alta: "bg-brand-peach text-brand-blue",
    Critica: "bg-red-100 text-red-700",
};

function aplanarSuites(suites) {
    const raiz = suites.filter((s) => !s.parent_id);
    const resultado = [];
    const recorrer = (lista, profundidad) => {
        lista.forEach((s) => {
            resultado.push({ id: s.id, nombre: s.nombre, profundidad });
            recorrer(
                suites.filter((h) => h.parent_id === s.id),
                profundidad + 1
            );
        });
    };
    recorrer(raiz, 0);
    return resultado;
}

export default function Preparar({ suites, suiteSeleccionada, casos, puedeEliminar }) {
    const { flash, errors } = usePage().props;

    // formSuite: null | { modo: 'crear', parentId } | { modo: 'editar', suite }
    const [formSuite, setFormSuite] = useState(null);
    const [nombreSuite, setNombreSuite] = useState("");
    const [descripcionSuite, setDescripcionSuite] = useState("");
    const [padreSuite, setPadreSuite] = useState("");

    // accionCaso: null | { modo: 'mover' | 'copiar', caso }
    const [accionCaso, setAccionCaso] = useState(null);
    const [suiteDestino, setSuiteDestino] = useState("");

    const suiteActual = suites.find((s) => s.id === Number(suiteSeleccionada));
    const suitesPlanas = useMemo(() => aplanarSuites(suites), [suites]);

    const seleccionar = (id) => {
        router.get(route("test-suites.index"), { suite_id: id }, { preserveState: true });
    };

    const abrirCrear = (parentId) => {
        setFormSuite({ modo: "crear", parentId });
        setNombreSuite("");
        setDescripcionSuite("");
        setAccionCaso(null);
    };

    const abrirEditar = (suite) => {
        setFormSuite({ modo: "editar", suite });
        setNombreSuite(suite.nombre);
        setDescripcionSuite(suite.descripcion || "");
        setPadreSuite(suite.parent_id || "");
        setAccionCaso(null);
    };

    const guardarSuite = (e) => {
        e.preventDefault();
        if (!nombreSuite.trim()) return;

        if (formSuite.modo === "crear") {
            router.post(
                route("test-suites.store"),
                { nombre: nombreSuite, descripcion: descripcionSuite, parent_id: formSuite.parentId },
                { onSuccess: () => setFormSuite(null) }
            );
        } else {
            router.put(
                route("test-suites.update", formSuite.suite.id),
                { nombre: nombreSuite, descripcion: descripcionSuite, parent_id: padreSuite || null },
                { onSuccess: () => setFormSuite(null) }
            );
        }
    };

    const eliminarSuite = (suite) => {
        if (!confirm(`¿Eliminar la suite "${suite.nombre}", sus sub-suites y todos sus casos de prueba?`))
            return;
        router.delete(route("test-suites.destroy", suite.id));
    };

    const eliminarCaso = (caso) => {
        if (!confirm(`¿Eliminar el caso de prueba "${caso.titulo}"?`)) return;
        router.delete(route("test-casos.destroy", caso.id));
    };

    const abrirAccionCaso = (modo, caso) => {
        setAccionCaso({ modo, caso });
        setSuiteDestino("");
        setFormSuite(null);
    };

    const confirmarAccionCaso = () => {
        if (!suiteDestino) return;

        if (accionCaso.modo === "mover") {
            router.patch(
                route("test-casos.move", accionCaso.caso.id),
                { suite_id: suiteDestino },
                { onSuccess: () => setAccionCaso(null) }
            );
        } else {
            router.post(
                route("test-casos.copy", accionCaso.caso.id),
                { suite_id: suiteDestino },
                { onSuccess: () => setAccionCaso(null) }
            );
        }
    };

    // Suites válidas como destino de mover/copiar: cualquiera menos la suite actual del caso
    const suitesDestinoValidas = accionCaso
        ? suitesPlanas.filter((s) => s.id !== accionCaso.caso.suite_id)
        : [];

    // Suites válidas como "suite padre" al editar: cualquiera menos ella misma y sus descendientes
    const suitesPadreValidas =
        formSuite?.modo === "editar"
            ? suitesPlanas.filter((s) => {
                  if (s.id === formSuite.suite.id) return false;
                  // excluir descendientes (recorrido simple usando la lista completa de suites)
                  let actual = suites.find((x) => x.id === s.id);
                  while (actual?.parent_id) {
                      if (actual.parent_id === formSuite.suite.id) return false;
                      actual = suites.find((x) => x.id === actual.parent_id);
                  }
                  return true;
              })
            : [];

    return (
        <AppLayout>
            <Head title="Preparar Casos de Prueba" />

            <div className="min-h-screen bg-gray-100">
                <div className="sticky top-0 z-10 bg-white border-b shadow-sm">
                    <div className="max-w-7xl mx-auto px-6 py-4">
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <span className="text-brand-mango text-3xl">🧪</span>
                            Preparar Casos de Prueba
                        </h1>
                    </div>
                </div>

                {flash?.success && (
                    <div className="max-w-7xl mx-auto px-6 pt-4">
                        <div className="bg-green-50 text-green-700 px-4 py-2 rounded">{flash.success}</div>
                    </div>
                )}
                {errors?.parent_id && (
                    <div className="max-w-7xl mx-auto px-6 pt-4">
                        <div className="bg-red-50 text-red-700 px-4 py-2 rounded">{errors.parent_id}</div>
                    </div>
                )}

                <div className="max-w-7xl mx-auto px-6 py-6 grid grid-cols-1 md:grid-cols-4 gap-6">
                    {/* SUITES */}
                    <div className="md:col-span-1 bg-white rounded-xl shadow p-4 h-fit">
                        <h2 className="font-semibold mb-3">📁 Suites</h2>

                        <div className="mb-3">
                            <SuiteTree
                                suites={suites}
                                seleccionada={Number(suiteSeleccionada)}
                                onSelect={seleccionar}
                                acciones={(suite) => (
                                    <KebabMenu
                                        items={[
                                            { label: "Editar", onClick: () => abrirEditar(suite) },
                                            {
                                                label: "+ Sub-suite aquí",
                                                onClick: () => abrirCrear(suite.id),
                                            },
                                            ...(puedeEliminar
                                                ? [
                                                      { divider: true },
                                                      {
                                                          label: "Eliminar",
                                                          danger: true,
                                                          onClick: () => eliminarSuite(suite),
                                                      },
                                                  ]
                                                : []),
                                        ]}
                                    />
                                )}
                            />
                        </div>

                        {formSuite ? (
                            <form onSubmit={guardarSuite} className="space-y-2 border-t pt-3">
                                <p className="text-xs text-gray-500">
                                    {formSuite.modo === "crear"
                                        ? formSuite.parentId
                                            ? `Nueva sub-suite dentro de "${
                                                  suites.find((s) => s.id === formSuite.parentId)?.nombre
                                              }"`
                                            : "Nueva suite en la raíz"
                                        : `Editando "${formSuite.suite.nombre}"`}
                                </p>
                                <input
                                    type="text"
                                    placeholder="Nombre de la suite"
                                    className="w-full border px-2 py-1.5 rounded text-sm"
                                    value={nombreSuite}
                                    onChange={(e) => setNombreSuite(e.target.value)}
                                    autoFocus
                                />
                                <textarea
                                    placeholder="Descripción (opcional)"
                                    rows={2}
                                    className="w-full border px-2 py-1.5 rounded text-sm"
                                    value={descripcionSuite}
                                    onChange={(e) => setDescripcionSuite(e.target.value)}
                                />
                                {formSuite.modo === "editar" && (
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">
                                            Suite padre
                                        </label>
                                        <select
                                            className="w-full border px-2 py-1.5 rounded text-sm"
                                            value={padreSuite}
                                            onChange={(e) => setPadreSuite(e.target.value)}
                                        >
                                            <option value="">— Raíz (sin padre) —</option>
                                            {suitesPadreValidas.map((s) => (
                                                <option key={s.id} value={s.id}>
                                                    {"—".repeat(s.profundidad)} {s.nombre}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                                <div className="flex gap-2">
                                    <button
                                        type="submit"
                                        className="bg-brand-blue text-white text-sm px-3 py-1.5 rounded flex-1"
                                    >
                                        {formSuite.modo === "crear" ? "Crear" : "Guardar cambios"}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormSuite(null)}
                                        className="text-sm text-gray-500 px-2"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <button
                                onClick={() => abrirCrear(null)}
                                className="w-full text-sm border border-dashed border-gray-300 rounded-lg py-2 text-gray-500 hover:border-brand-blue hover:text-brand-blue"
                            >
                                + Nueva suite
                            </button>
                        )}
                    </div>

                    {/* CASOS */}
                    <div className="md:col-span-3 bg-white rounded-xl shadow p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold">
                                Casos de prueba {suiteActual ? `— ${suiteActual.nombre}` : ""}
                            </h2>
                            {suiteSeleccionada && (
                                <Link
                                    href={route("test-casos.create", suiteSeleccionada)}
                                    className="bg-gradient-to-r from-brand-blue to-brand-blue-mid hover:from-brand-blue-dark hover:to-brand-blue text-white px-4 py-2 rounded-lg text-sm"
                                >
                                    + Nuevo caso de prueba
                                </Link>
                            )}
                        </div>

                        {!suiteSeleccionada && (
                            <p className="text-sm text-gray-400">Creá o seleccioná una suite para empezar.</p>
                        )}

                        <div className="space-y-3">
                            {casos.map((c, idx) => (
                                <div
                                    key={c.id}
                                    className="border rounded-lg p-4 hover:shadow-md stagger-item"
                                    style={{ animationDelay: `${Math.min(idx, 12) * 30}ms` }}
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-semibold">{c.titulo}</p>
                                            <div className="flex gap-2 mt-1 items-center text-xs flex-wrap">
                                                <span
                                                    className={`px-2 py-0.5 rounded-full ${prioridadColor[c.prioridad]}`}
                                                >
                                                    {c.prioridad}
                                                </span>
                                                <span className="text-gray-400">
                                                    {c.pasos_count} paso{c.pasos_count === 1 ? "" : "s"}
                                                </span>
                                                <span className="text-gray-400">
                                                    por {c.creador?.name} {c.creador?.apellido}
                                                </span>
                                                {c.ticket && (
                                                    <Link
                                                        href={route("tickets.show", c.ticket.id)}
                                                        className="text-brand-blue hover:underline"
                                                    >
                                                        🎫 #{c.ticket.numero}
                                                    </Link>
                                                )}
                                                {!c.ticket && c.redmine_numero && (
                                                    <a
                                                        href={c.redmine_url || "#"}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="text-brand-blue hover:underline"
                                                    >
                                                        🌐 Redmine #{c.redmine_numero}
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <Link
                                                href={route("test-casos.edit", c.id)}
                                                className="text-brand-blue hover:underline text-sm"
                                            >
                                                Editar
                                            </Link>
                                            <KebabMenu
                                                items={[
                                                    {
                                                        label: "Mover a otra suite",
                                                        onClick: () => abrirAccionCaso("mover", c),
                                                    },
                                                    {
                                                        label: "Copiar a otra suite",
                                                        onClick: () => abrirAccionCaso("copiar", c),
                                                    },
                                                    ...(puedeEliminar
                                                        ? [
                                                              { divider: true },
                                                              {
                                                                  label: "Eliminar",
                                                                  danger: true,
                                                                  onClick: () => eliminarCaso(c),
                                                              },
                                                          ]
                                                        : []),
                                                ]}
                                            />
                                        </div>
                                    </div>

                                    {accionCaso?.caso.id === c.id && (
                                        <div className="mt-3 border-t pt-3 flex flex-wrap items-center gap-2">
                                            <span className="text-xs text-gray-500">
                                                {accionCaso.modo === "mover" ? "Mover a:" : "Copiar a:"}
                                            </span>
                                            <select
                                                className="border px-2 py-1.5 rounded text-sm flex-1 min-w-[160px]"
                                                value={suiteDestino}
                                                onChange={(e) => setSuiteDestino(e.target.value)}
                                            >
                                                <option value="">-- Elegir suite --</option>
                                                {suitesDestinoValidas.map((s) => (
                                                    <option key={s.id} value={s.id}>
                                                        {"—".repeat(s.profundidad)} {s.nombre}
                                                    </option>
                                                ))}
                                            </select>
                                            <button
                                                onClick={confirmarAccionCaso}
                                                disabled={!suiteDestino}
                                                className="bg-brand-blue text-white text-sm px-3 py-1.5 rounded disabled:opacity-50"
                                            >
                                                Confirmar
                                            </button>
                                            <button
                                                onClick={() => setAccionCaso(null)}
                                                className="text-sm text-gray-500"
                                            >
                                                Cancelar
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                            {suiteSeleccionada && casos.length === 0 && (
                                <p className="text-sm text-gray-400">
                                    Esta suite todavía no tiene casos de prueba.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
