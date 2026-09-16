import { useEffect } from 'react';
import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Login({ status, canResetPassword }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: '',
    });

    useEffect(() => {
        return () => {
            reset('password');
        };
    }, []);

    const handleOnChange = (event) => {
        setData(
            event.target.name,
            event.target.type === 'checkbox'
                ? event.target.checked
                : event.target.value
        );
    };

    const submit = (e) => {
        e.preventDefault();
        post(route('login'));
    };

    return (
        <>
            <Head title="Iniciar sesión" />

            <div
                className="min-h-screen flex flex-col items-center justify-center px-4 bg-cover bg-center relative"
                style={{ backgroundImage: "url('/images/backgrounds/auth-bg.jpg')" }}
            >
                {/* 🔹 Velo oscuro para contraste del texto/tarjeta */}
                <div className="absolute inset-0 bg-gradient-to-b from-brand-blue-dark/80 via-brand-blue-dark/70 to-brand-blue-dark/90" />

                {/* 🔹 Tarjeta del login */}
                <div className="relative bg-white/95 backdrop-blur shadow-2xl rounded-xl w-full max-w-md p-8 border border-white/20 overflow-hidden animate-fade-in-up">
                    {/* 🔹 Franja degradada azul */}
                    <div className="h-1.5 -mx-8 -mt-8 mb-8 bg-gradient-to-r from-brand-blue to-brand-cyan" />

                    {/* 🔸 Título */}
                    <h2 className="text-2xl font-bold text-center text-gray-800 mb-1">
                        Portal Documentación DOCWeb
                    </h2>
                    <p className="text-sm text-gray-500 text-center mb-6">
                        Inicia sesión con tu cuenta corporativa
                    </p>

                    {/* 🔸 Estado de sesión */}
                    {status && (
                        <div className="mb-4 font-medium text-sm text-brand-blue">
                            {status}
                        </div>
                    )}

                    {/* 🔸 Formulario */}
                    <form onSubmit={submit} className="space-y-5">
                        {/* Email */}
                        <div>
                            <InputLabel htmlFor="email" value="Correo institucional" />
                            <TextInput
                                id="email"
                                type="email"
                                name="email"
                                value={data.email}
                                className="mt-1 block w-full"
                                autoComplete="username"
                                isFocused={true}
                                onChange={handleOnChange}
                            />
                            <InputError message={errors.email} className="mt-2" />
                        </div>

                        {/* Password */}
                        <div>
                            <InputLabel htmlFor="password" value="Contraseña" />
                            <TextInput
                                id="password"
                                type="password"
                                name="password"
                                value={data.password}
                                className="mt-1 block w-full"
                                autoComplete="current-password"
                                onChange={handleOnChange}
                            />
                            <InputError message={errors.password} className="mt-2" />
                        </div>

                                {/* Recordarme
                                <div className="flex items-center justify-between">
                                    <label className="flex items-center text-sm text-gray-600">
                                        <Checkbox
                                            name="remember"
                                            checked={data.remember}
                                            onChange={handleOnChange}
                                        />
                                        <span className="ml-2">Recordarme</span>
                                    </label>

                                    {canResetPassword && (
                                        <Link
                                            href={route('password.request')}
                                            className="text-sm text-brand-mango hover:text-brand-mango-dark font-medium"
                                        >
                                            ¿Olvidaste tu contraseña?
                                        </Link>
                                    )}
                                </div> */}

                        {/* Botón */}
                        <PrimaryButton
                            className="w-full justify-center bg-gradient-to-r from-brand-blue to-brand-blue-mid hover:from-brand-blue-dark hover:to-brand-blue text-white font-semibold py-3 rounded-lg transition"
                            disabled={processing}
                        >
                            Iniciar sesión
                        </PrimaryButton>
                    </form>
                </div>

                {/* 🔸 Pie de página */}
                <p className="relative mt-6 text-xs text-white/70 text-center">
                    © {new Date().getFullYear()} DOCWeb — codebywill
                </p>
                <p className="relative mt-1 text-[10px] text-white/40 text-center">
                    Foto: "TOKYO Night @45F" por doronko (CC BY-SA 2.0)
                </p>
            </div>
        </>
    );
}
