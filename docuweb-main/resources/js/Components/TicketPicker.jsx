import React, { useMemo, useState } from "react";

export default function TicketPicker({ tickets, ticketId, ticketLabel, onChange }) {
    const [busqueda, setBusqueda] = useState("");
    const [abierto, setAbierto] = useState(false);

    const seleccionado = tickets.find((t) => t.id === ticketId);

    const resultados = useMemo(() => {
        if (!busqueda.trim()) return tickets.slice(0, 15);
        const q = busqueda.toLowerCase();
        return tickets
            .filter(
                (t) =>
                    t.numero?.toString().toLowerCase().includes(q) ||
                    t.titulo?.toLowerCase().includes(q)
            )
            .slice(0, 15);
    }, [busqueda, tickets]);

    if (seleccionado || (ticketId && ticketLabel)) {
        const label = seleccionado
            ? `#${seleccionado.numero} — ${seleccionado.titulo}`
            : ticketLabel;
        return (
            <div className="flex items-center justify-between border rounded-lg px-3 py-2 bg-gray-50 text-sm">
                <span className="truncate">🎫 {label}</span>
                <button
                    type="button"
                    onClick={() => onChange(null)}
                    className="text-xs text-red-600 hover:underline shrink-0 ml-2"
                >
                    Quitar
                </button>
            </div>
        );
    }

    return (
        <div className="relative">
            <input
                type="text"
                placeholder="Buscar por N° de ticket o título..."
                className="w-full border px-3 py-2 rounded-lg text-sm"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                onFocus={() => setAbierto(true)}
                onBlur={() => setTimeout(() => setAbierto(false), 150)}
            />
            {abierto && resultados.length > 0 && (
                <ul className="absolute z-20 mt-1 w-full bg-white border rounded-lg shadow-lg max-h-56 overflow-y-auto animate-scale-in">
                    {resultados.map((t) => (
                        <li key={t.id}>
                            <button
                                type="button"
                                onMouseDown={() => {
                                    onChange(t.id);
                                    setBusqueda("");
                                    setAbierto(false);
                                }}
                                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
                            >
                                <span className="font-medium">#{t.numero}</span> — {t.titulo}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
