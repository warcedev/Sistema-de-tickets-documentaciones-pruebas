import React, { useState, useEffect, useRef } from "react";
import { Link, usePage, router } from "@inertiajs/react";
import NotificationBell from "@/Components/NotificationBell";

export default function AppLayout({ children }) {
    const { auth, url } = usePage().props;
    const [menuOpen, setMenuOpen] = useState(false);
    const [navOpen, setNavOpen] = useState(false);
    const menuRef = useRef(null);
    const navRef = useRef(null);

    const isAdmin = auth.user?.rol === "Administrador";
    const isGestor = ["Administrador", "Gerente"].includes(auth.user?.rol);

    const logout = (e) => {
        e.preventDefault();
        router.post(route("logout"));
    };

    // 🔒 Cierra los menús al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setMenuOpen(false);
            }
            if (navRef.current && !navRef.current.contains(e.target)) {
                setNavOpen(false);
            }
        };
        document.addEventListener("click", handleClickOutside);
        return () =>
            document.removeEventListener("click", handleClickOutside);
    }, []);

    const navLinkClass =
        "flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 hover:translate-x-0.5 rounded-md mx-1";

    // 🧩 Evita cache de la imagen de perfil
    const profilePhoto = auth.user?.profile_photo_url
        ? `${auth.user.profile_photo_url}?t=${new Date().getTime()}`
        : `https://ui-avatars.com/api/?name=${encodeURIComponent(
              auth.user?.name || "Usuario"
          )}`;

    return (
        <div
            className="min-h-screen bg-gray-100 bg-cover bg-center bg-fixed"
            style={{
                backgroundImage:
                    "linear-gradient(rgba(243,244,246,0.94), rgba(243,244,246,0.94)), url('/images/backgrounds/app-bg.jpg')",
            }}
        >
            {/* 🔹 Navbar superior */}
            <nav className="bg-white border-b shadow-sm sticky top-0 z-50">
                <div className="h-1 bg-gradient-to-r from-brand-blue to-brand-cyan" />
                <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
                    {/* 🔸 Lado izquierdo */}
                    <div className="flex items-center space-x-4">
                        {/* ☰ Menú hamburguesa */}
                        <div className="relative" ref={navRef}>
                            <button
                                onClick={() => setNavOpen(!navOpen)}
                                aria-label="Abrir menú"
                                className="flex items-center justify-center w-9 h-9 rounded-md text-gray-700 hover:bg-gray-100 focus:outline-none"
                            >
                                <svg
                                    className="w-6 h-6"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M4 6h16M4 12h16M4 18h16"
                                    />
                                </svg>
                            </button>

                            {navOpen && (
                                <div className="absolute left-0 mt-2 w-64 bg-white border rounded-lg shadow-lg z-50 py-1 animate-scale-in">
                                    <Link
                                        href={route("principal")}
                                        className={navLinkClass}
                                        onClick={() => setNavOpen(false)}
                                    >
                                        📄 Documentos
                                    </Link>

                                    {isAdmin && (
                                        <Link
                                            href={route("admin.usuarios")}
                                            className={navLinkClass}
                                            onClick={() => setNavOpen(false)}
                                        >
                                            ⚙️ Administrar Usuarios
                                        </Link>
                                    )}

                                    {isAdmin && (
                                        <Link
                                            href={route("admin.catalogos")}
                                            className={navLinkClass}
                                            onClick={() => setNavOpen(false)}
                                        >
                                            🗂️ Administrar Tags / Departamentos
                                        </Link>
                                    )}

                                    <hr className="my-1" />

                                    <Link
                                        href={route("tickets.index")}
                                        className={navLinkClass}
                                        onClick={() => setNavOpen(false)}
                                    >
                                        🎫 Gestionar Tickets
                                    </Link>

                                    <Link
                                        href={route("tickets.historico")}
                                        className={navLinkClass}
                                        onClick={() => setNavOpen(false)}
                                    >
                                        🕘 Histórico Tickets
                                    </Link>

                                    {isGestor && (
                                        <Link
                                            href={route("tickets.reportes")}
                                            className={navLinkClass}
                                            onClick={() => setNavOpen(false)}
                                        >
                                            📊 Reportes de Tickets
                                        </Link>
                                    )}

                                    <hr className="my-1" />

                                    <Link
                                        href={route("test-suites.index")}
                                        className={navLinkClass}
                                        onClick={() => setNavOpen(false)}
                                    >
                                        🧪 Preparar Casos de Prueba
                                    </Link>

                                    <Link
                                        href={route("test-ejecuciones.index")}
                                        className={navLinkClass}
                                        onClick={() => setNavOpen(false)}
                                    >
                                        ▶️ Ejecutar Casos de Prueba
                                    </Link>

                                    <Link
                                        href={route("test-visualizar.index")}
                                        className={navLinkClass}
                                        onClick={() => setNavOpen(false)}
                                    >
                                        👁️ Visualizar Casos de Prueba
                                    </Link>
                                </div>
                            )}
                        </div>

                        <h1 className="text-xl font-bold text-brand-mango">
                            DOCWeb
                        </h1>
                    </div>

                    {/* 🔸 Notificaciones + Menú de usuario */}
                    <div className="flex items-center gap-2">
                    <NotificationBell />
                    <div className="relative" ref={menuRef}>
                        <button
                            onClick={() => setMenuOpen(!menuOpen)}
                            className="flex items-center space-x-2 focus:outline-none group"
                        >
                            <img
                                src={profilePhoto}
                                alt="Foto de perfil"
                                className="w-8 h-8 rounded-full border object-cover transition-transform group-hover:scale-105"
                            />
                            <span className="font-medium text-gray-800">
                                {auth.user?.name}
                            </span>
                            <svg
                                className={`w-4 h-4 ml-1 transition-transform ${
                                    menuOpen ? "rotate-180" : ""
                                }`}
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M19 9l-7 7-7-7"
                                />
                            </svg>
                        </button>

                        {menuOpen && (
                            <div className="absolute right-0 mt-2 w-52 bg-white border rounded-lg shadow-lg z-50 animate-scale-in overflow-hidden">
                                <Link
                                    href={route("profile.edit")}
                                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                                >
                                    🧍 Editar perfil
                                </Link>

                                <form onSubmit={logout}>
                                    <button
                                        type="submit"
                                        className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50"
                                    >
                                        🔒 Cerrar sesión
                                    </button>
                                </form>
                            </div>
                        )}
                    </div>
                    </div>
                </div>
            </nav>

            {/* 🔸 Contenido */}
            <main key={url} className="animate-fade-in-up">
                {children}
            </main>
        </div>
    );
}