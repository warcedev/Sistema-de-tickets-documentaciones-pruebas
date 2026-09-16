import React, { useState, useEffect } from "react";
import AppLayout from "@/Layouts/AppLayout";
import { useForm, usePage, Link, router } from "@inertiajs/react";

export default function EditProfile({ auth }) {
  const { flash } = usePage().props;

  const { data, setData, processing, errors } = useForm({
    name: auth.user.name || "",
    email: auth.user.email || "",
    profile_photo: null,
  });

  const [preview, setPreview] = useState(auth.user.profile_photo_url || "");
  const [successMessage, setSuccessMessage] = useState(flash?.success || "");

  useEffect(() => {
    if (flash?.success) {
      setSuccessMessage(flash.success);
      const timer = setTimeout(() => setSuccessMessage(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [flash]);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setData("profile_photo", file);
      setPreview(URL.createObjectURL(file));
    }
  };

  // ✅ FIX: Forzamos PATCH real mediante _method
  const submit = (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("name", data.name || "");
    formData.append("email", data.email || "");
    if (data.profile_photo) {
      formData.append("profile_photo", data.profile_photo);
    }

    // 🔹 Laravel requiere este campo para aceptar PATCH
    formData.append("_method", "PATCH");

    router.post(route("profile.update"), formData, {
      forceFormData: true,
      onSuccess: () => {
        setSuccessMessage("Perfil actualizado correctamente ✅");
        router.reload({ only: ["auth"] }); // refresca usuario autenticado
      },
      onError: (err) => {
        console.error("❌ Error al actualizar:", err);
      },
    });
  };

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto mt-10 bg-white shadow-lg rounded-xl p-6 space-y-6">
        {/* 🔙 Encabezado */}
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-800">Editar perfil</h1>
          <Link
            href={route("principal")}
            className="text-sm bg-gradient-to-r from-brand-blue to-brand-blue-mid hover:from-brand-blue-dark hover:to-brand-blue text-white px-4 py-2 rounded-lg transition flex items-center gap-2"
          >
            ← Volver al inicio
          </Link>
        </div>

        {/* ✅ Mensaje de éxito */}
        {successMessage && (
          <div className="bg-brand-lime/15 border border-brand-lime text-brand-blue px-4 py-3 rounded transition-opacity duration-500">
            <strong className="font-semibold">{successMessage}</strong>
          </div>
        )}

        {/* 🧾 Formulario */}
        <form onSubmit={submit} encType="multipart/form-data" className="space-y-4">
          {/* Foto */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Foto de perfil
            </label>
            {preview && (
              <img
                src={preview}
                alt="Vista previa"
                className="w-24 h-24 rounded-full object-cover mb-2 border"
              />
            )}
            <input type="file" accept="image/*" onChange={handlePhotoChange} />
            {errors.profile_photo && (
              <p className="text-red-600 text-sm">{errors.profile_photo}</p>
            )}
          </div>

          {/* Nombre */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Nombre
            </label>
            <input
              type="text"
              value={data.name}
              onChange={(e) => setData("name", e.target.value)}
              className="w-full border px-3 py-2 rounded-lg"
            />
            {errors.name && <p className="text-red-600 text-sm">{errors.name}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Correo electrónico
            </label>
            <input
              type="email"
              value={data.email}
              onChange={(e) => setData("email", e.target.value)}
              className="w-full border px-3 py-2 rounded-lg"
            />
            {errors.email && <p className="text-red-600 text-sm">{errors.email}</p>}
          </div>

          {/* Botón */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={processing}
              className="bg-gradient-to-r from-brand-blue to-brand-blue-mid text-white px-5 py-2 rounded-lg hover:from-brand-blue-dark hover:to-brand-blue transition"
            >
              Guardar cambios
            </button>
          </div>
        </form>

        <hr className="my-6" />
        <PasswordForm />
      </div>
    </AppLayout>
  );
}

function PasswordForm() {
  const { flash } = usePage().props;
  const { data, setData, post, processing, errors, reset } = useForm({
    current_password: "",
    password: "",
    password_confirmation: "",
  });

  const [passwordMessage, setPasswordMessage] = useState(flash?.success || "");

  useEffect(() => {
    if (flash?.success) {
      setPasswordMessage(flash.success);
      const timer = setTimeout(() => setPasswordMessage(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [flash]);

  const submit = (e) => {
    e.preventDefault();
    post(route("password.update"), {
      onSuccess: () => reset(),
    });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-800">Cambiar contraseña</h2>

      {passwordMessage && (
        <div className="bg-brand-lime/15 border border-brand-lime text-brand-blue px-4 py-3 rounded transition-opacity duration-500">
          <strong className="font-semibold">{passwordMessage}</strong>
        </div>
      )}

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Contraseña actual
        </label>
        <input
          type="password"
          value={data.current_password}
          onChange={(e) => setData("current_password", e.target.value)}
          className="w-full border px-3 py-2 rounded-lg"
        />
        {errors.current_password && (
          <p className="text-red-600 text-sm">{errors.current_password}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Nueva contraseña
        </label>
        <input
          type="password"
          value={data.password}
          onChange={(e) => setData("password", e.target.value)}
          className="w-full border px-3 py-2 rounded-lg"
        />
        {errors.password && (
          <p className="text-red-600 text-sm">{errors.password}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Confirmar nueva contraseña
        </label>
        <input
          type="password"
          value={data.password_confirmation}
          onChange={(e) =>
            setData("password_confirmation", e.target.value)
          }
          className="w-full border px-3 py-2 rounded-lg"
        />
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={processing}
          className="bg-brand-blue text-white px-5 py-2 rounded-lg hover:bg-brand-blue-dark transition"
        >
          Actualizar contraseña
        </button>
      </div>
    </form>
  );
}

