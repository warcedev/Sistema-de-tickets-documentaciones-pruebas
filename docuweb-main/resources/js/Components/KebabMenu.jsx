import React, { useEffect, useRef, useState } from "react";

export default function KebabMenu({ items, className = "" }) {
    const [abierto, setAbierto] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (ref.current && !ref.current.contains(e.target)) {
                setAbierto(false);
            }
        };
        document.addEventListener("click", handleClickOutside);
        return () => document.removeEventListener("click", handleClickOutside);
    }, []);

    return (
        <div className={`relative ${className}`} ref={ref}>
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation();
                    setAbierto((v) => !v);
                }}
                className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-200 text-gray-500 hover:scale-110"
                title="Más opciones"
            >
                ⋮
            </button>

            {abierto && (
                <ul className="absolute right-0 z-20 mt-1 w-48 bg-white border rounded-lg shadow-lg py-1 text-sm animate-scale-in">
                    {items.map((item, i) =>
                        item.divider ? (
                            <li key={i} className="border-t my-1" />
                        ) : (
                            <li key={i}>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setAbierto(false);
                                        item.onClick();
                                    }}
                                    className={`w-full text-left px-3 py-1.5 hover:bg-gray-100 ${
                                        item.danger ? "text-red-600" : "text-gray-700"
                                    }`}
                                >
                                    {item.label}
                                </button>
                            </li>
                        )
                    )}
                </ul>
            )}
        </div>
    );
}
