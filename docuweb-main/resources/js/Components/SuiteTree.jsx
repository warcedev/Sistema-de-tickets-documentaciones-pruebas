import React, { useState } from "react";

function Nodo({ suite, hijas, nivel, seleccionada, onSelect, acciones, expandidas, setExpandidas }) {
    const propias = hijas.filter((s) => s.parent_id === suite.id);
    const tieneHijas = propias.length > 0;
    const estaExpandida = expandidas.has(suite.id);

    const alternarExpandir = (e) => {
        e.stopPropagation();
        setExpandidas((prev) => {
            const next = new Set(prev);
            if (next.has(suite.id)) next.delete(suite.id);
            else next.add(suite.id);
            return next;
        });
    };

    const seleccionar = () => {
        onSelect(suite.id);
        if (tieneHijas && !estaExpandida) {
            setExpandidas((prev) => new Set(prev).add(suite.id));
        }
    };

    return (
        <li>
            <div
                className={`group flex items-center pr-1 rounded-lg ${
                    seleccionada === suite.id ? "bg-brand-blue text-white" : "hover:bg-gray-100"
                }`}
                style={{ paddingLeft: `${4 + nivel * 14}px` }}
            >
                {tieneHijas ? (
                    <button
                        onClick={alternarExpandir}
                        className={`w-5 shrink-0 text-xs transition-transform duration-200 ${
                            estaExpandida ? "rotate-90" : ""
                        } ${seleccionada === suite.id ? "text-white/80" : "text-gray-400"}`}
                    >
                        ▸
                    </button>
                ) : (
                    <span className="w-5 shrink-0" />
                )}

                <button onClick={seleccionar} className="flex-1 min-w-0 text-left py-2 flex items-center justify-between">
                    <span className="truncate">{suite.nombre}</span>
                    <span
                        className={`text-xs rounded-full px-2 shrink-0 ml-2 ${
                            seleccionada === suite.id ? "bg-white/20" : "bg-gray-200 text-gray-600"
                        }`}
                    >
                        {suite.casos_count}
                    </span>
                </button>

                {acciones && <div className="shrink-0">{acciones(suite)}</div>}
            </div>

            {tieneHijas && estaExpandida && (
                <ul className="animate-fade-in-down">
                    {propias.map((s) => (
                        <Nodo
                            key={s.id}
                            suite={s}
                            hijas={hijas}
                            nivel={nivel + 1}
                            seleccionada={seleccionada}
                            onSelect={onSelect}
                            acciones={acciones}
                            expandidas={expandidas}
                            setExpandidas={setExpandidas}
                        />
                    ))}
                </ul>
            )}
        </li>
    );
}

export default function SuiteTree({ suites, seleccionada, onSelect, acciones }) {
    const [expandidas, setExpandidas] = useState(() => new Set());
    const raiz = suites.filter((s) => !s.parent_id);

    if (suites.length === 0) {
        return <p className="text-sm text-gray-400">Todavía no hay suites.</p>;
    }

    return (
        <ul className="space-y-0.5">
            {raiz.map((s) => (
                <Nodo
                    key={s.id}
                    suite={s}
                    hijas={suites}
                    nivel={0}
                    seleccionada={seleccionada}
                    onSelect={onSelect}
                    acciones={acciones}
                    expandidas={expandidas}
                    setExpandidas={setExpandidas}
                />
            ))}
        </ul>
    );
}
