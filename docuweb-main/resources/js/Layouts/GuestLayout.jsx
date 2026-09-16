import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link } from '@inertiajs/react';

export default function Guest({ children }) {
    return (
        <div
            className="min-h-screen flex flex-col sm:justify-center items-center pt-6 sm:pt-0 px-4 bg-cover bg-center relative"
            style={{ backgroundImage: "url('/images/backgrounds/auth-bg.jpg')" }}
        >
            <div className="absolute inset-0 bg-gradient-to-b from-brand-blue-dark/80 via-brand-blue-dark/70 to-brand-blue-dark/90" />

            <div className="relative w-full sm:max-w-md mt-6 px-6 py-4 bg-white/95 backdrop-blur shadow-2xl overflow-hidden sm:rounded-xl border border-white/20">
                {children}
            </div>

            <p className="relative mt-6 text-[10px] text-white/40 text-center">
                Foto: "TOKYO Night @45F" por doronko (CC BY-SA 2.0)
            </p>
        </div>
    );
}
