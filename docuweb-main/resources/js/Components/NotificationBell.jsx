import React, { useState, useEffect, useRef } from "react";
import { router } from "@inertiajs/react";

export default function NotificationBell() {
    const [open, setOpen] = useState(false);
    const [items, setItems] = useState([]);
    const [noLeidas, setNoLeidas] = useState(0);
    const ref = useRef(null);

    const cargar = async () => {
        try {
            const res = await fetch(route("notificaciones.index"), {
                headers: { Accept: "application/json" },
            });
            if (!res.ok) return;
            const data = await res.json();
            setItems(data.notificaciones);
            setNoLeidas(data.no_leidas);
        } catch (e) {
            // silencioso: notificaciones no son críticas para el uso de la app
        }
    };

    useEffect(() => {
        cargar();
        const interval = setInterval(cargar, 30000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (ref.current && !ref.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener("click", handleClickOutside);
        return () => document.removeEventListener("click", handleClickOutside);
    }, []);

    const abrir = async (n) => {
        if (!n.leida) {
            await fetch(route("notificaciones.leer", n.id), {
                method: "POST",
                headers: {
                    "X-CSRF-TOKEN": document
                        .querySelector('meta[name="csrf-token"]')
                        .getAttribute("content"),
                },
            });
        }
        setOpen(false);
        if (n.ticket_id) {
            router.visit(route("tickets.show", n.ticket_id));
        }
    };

    const leerTodas = async (e) => {
        e.stopPropagation();
        await fetch(route("notificaciones.leer-todas"), {
            method: "POST",
            headers: {
                "X-CSRF-TOKEN": document
                    .querySelector('meta[name="csrf-token"]')
                    .getAttribute("content"),
            },
        });
        cargar();
    };

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => {
                    setOpen(!open);
                    if (!open) cargar();
                }}
                aria-label="Notificaciones"
                className="relative flex items-center justify-center w-9 h-9 rounded-md text-gray-700 hover:bg-gray-100 focus:outline-none group"
            >
                <svg
                    className="w-5 h-5 transition-transform group-hover:-rotate-12"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                </svg>
                {noLeidas > 0 && (
                    <span className="absolute -top-1 -right-1 flex items-center justify-center">
                        <span className="absolute inline-flex h-4 w-4 rounded-full bg-red-500 opacity-60 animate-pulse-soft" />
                        <span className="relative bg-red-600 text-white text-[10px] leading-none rounded-full w-4 h-4 flex items-center justify-center">
                            {noLeidas > 9 ? "9+" : noLeidas}
                        </span>
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 mt-2 w-80 bg-white border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto animate-scale-in">
                    <div className="flex justify-between items-center px-4 py-2 border-b">
                        <span className="text-sm font-semibold text-gray-700">
                            Notificaciones
                        </span>
                        {noLeidas > 0 && (
                            <button
                                onClick={leerTodas}
                                className="text-xs text-brand-blue hover:underline"
                            >
                                Marcar todas leídas
                            </button>
                        )}
                    </div>

                    {items.length === 0 ? (
                        <div className="p-4 text-sm text-gray-400 text-center">
                            Sin notificaciones
                        </div>
                    ) : (
                        items.map((n) => (
                            <button
                                key={n.id}
                                onClick={() => abrir(n)}
                                className={`w-full text-left px-4 py-2.5 text-sm border-b hover:bg-gray-50 ${
                                    !n.leida ? "bg-brand-cyan/10" : ""
                                }`}
                            >
                                <div className="text-gray-700">{n.mensaje}</div>
                                {n.ticket && (
                                    <div className="text-xs text-brand-blue mt-0.5">
                                        #{n.ticket.numero}
                                    </div>
                                )}
                            </button>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
