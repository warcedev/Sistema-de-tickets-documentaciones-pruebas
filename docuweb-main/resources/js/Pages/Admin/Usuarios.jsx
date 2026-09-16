import React, { useState } from "react";
import { useForm, Link, router, usePage } from "@inertiajs/react";
import AppLayout from "@/Layouts/AppLayout";

export default function Usuarios({ usuarios = [], departamentos = [] }) {
  const { flash, auth } = usePage().props;

  const isAdmin = auth?.user?.rol === "Administrador";

  /* =====================
     FORM CREAR USUARIO
  ====================== */
  const {
    data,
    setData,
    post,
    patch,
    processing,
    reset,
    errors,
  } = useForm({
    name: "",
    apellido: "",
    email: "",
    rol: "Usuario",
    departamento_id: "",
    password: "",
  });

  const [openCreate, setOpenCreate] = useState(false);

  /* =====================
     FORM RESET PASSWORD
  ====================== */
  const [openReset, setOpenReset] = useState(false);
  const [resetUserId, setResetUserId] = useState(null);

  const {
    data: resetData,
    setData: setResetData,
    post: postReset,
    processing: resetting,
    reset: resetResetForm,
    errors: resetErrors,
  } = useForm({
    password: "",
  });

  const roles = ["Administrador", "Gerente", "Usuario"];

  /* =====================
     ACTIONS
  ====================== */
  const actualizarRol = (id, rol) => {
    patch(route("admin.usuarios.rol", id), { rol }, { preserveScroll: true });
  };

  const actualizarDepartamento = (id, departamento_id) => {
    patch(
      route("admin.usuarios.departamento", id),
      { departamento_id: departamento_id || null },
      { preserveScroll: true }
    );
  };

  const toggleActivo = (id) => {
    patch(route("admin.usuarios.toggle", id), {}, { preserveScroll: true });
  };

  const crearUsuario = (e) => {
    e.preventDefault();

    post(route("admin.usuarios.store"), {
      preserveScroll: true,
      onSuccess: () => {
        reset();
        setOpenCreate(false);
      },
    });
  };

  /* =====================
     RENDER
  ====================== */
  return (
    <AppLayout>
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-6xl mx-auto bg-white p-6 rounded-xl shadow">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">👥 Administración de Usuarios</h1>

            <div className="flex gap-3">
              {isAdmin && (
                <button
                  onClick={() => setOpenCreate(true)}
                  className="bg-gradient-to-r from-brand-blue to-brand-blue-mid hover:from-brand-blue-dark hover:to-brand-blue text-white px-4 py-2 rounded"
                >
                  ➕ Crear usuario
                </button>
              )}

              <Link
                href={route("principal")}
                className="bg-gradient-to-r from-brand-blue to-brand-blue-mid hover:from-brand-blue-dark hover:to-brand-blue text-white px-4 py-2 rounded"
              >
                ← Volver
              </Link>
            </div>
          </div>

          {flash?.success && (
            <div className="mb-4 p-3 bg-brand-lime/15 text-brand-blue rounded">
              {flash.success}
            </div>
          )}

          {usuarios.length === 0 ? (
            <div className="text-center text-gray-500 py-10">
              No hay usuarios para mostrar
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border">
                <thead className="bg-gradient-to-r from-brand-blue to-brand-blue-mid text-white">
                  <tr>
                    <th className="p-2 text-left">Nombre</th>
                    <th className="p-2 text-left">Correo</th>
                    <th className="p-2 text-left">Departamento</th>
                    <th className="p-2 text-center">Rol</th>
                    <th className="p-2 text-center">Estado</th>
                    <th className="p-2 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map((u) => (
                    <tr key={u.id} className="border-t hover:bg-gray-50">
                      <td className="p-2">{u.name} {u.apellido}</td>
                      <td className="p-2">{u.email}</td>

                      <td className="p-2">
                        <select
                          className="border rounded px-2 py-1 w-full"
                          value={u.departamento_id ?? ""}
                          onChange={(e) =>
                            actualizarDepartamento(u.id, e.target.value)
                          }
                          disabled={processing}
                        >
                          <option value="">-- Sin departamento --</option>
                          {departamentos.map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.nombre}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="p-2 text-center">
                        <select
                          value={u.rol}
                          onChange={(e) => actualizarRol(u.id, e.target.value)}
                          className="border rounded px-2 py-1"
                          disabled={processing}
                        >
                          {roles.map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="p-2 text-center">
                        <span
                          className={`px-3 py-1 rounded-full text-sm ${
                            u.activo
                              ? "bg-brand-lime/20 text-brand-blue"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {u.activo ? "Activo" : "Inactivo"}
                        </span>
                      </td>

                      <td className="p-2 text-center space-x-2">
                        <button
                          onClick={() => toggleActivo(u.id)}
                          className="px-3 py-1 rounded bg-gray-200 text-sm"
                          disabled={processing}
                        >
                          {u.activo ? "Inactivar" : "Reactivar"}
                        </button>

                        {isAdmin && (
                          <button
                            onClick={() => {
                              setResetUserId(u.id);
                              setOpenReset(true);
                            }}
                            className="px-3 py-1 rounded bg-brand-blue hover:bg-brand-blue-dark text-white text-sm"
                            disabled={processing}
                          >
                            🔑 Reset
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* =====================
            MODAL CREAR USUARIO
        ====================== */}
        {openCreate && isAdmin && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
            <form
              onSubmit={crearUsuario}
              className="bg-white p-6 rounded shadow w-full max-w-md space-y-3"
            >
              <h2 className="text-xl font-bold">➕ Crear usuario</h2>

              <input
                className="w-full border p-2 rounded"
                placeholder="Nombre"
                value={data.name}
                onChange={(e) => setData("name", e.target.value)}
                required
              />
              {errors.name && <div className="text-sm text-red-600">{errors.name}</div>}

              <input
                className="w-full border p-2 rounded"
                placeholder="Apellido"
                value={data.apellido}
                onChange={(e) => setData("apellido", e.target.value)}
              />

              <input
                className="w-full border p-2 rounded"
                placeholder="Email (usuario@tu.com.py o @mangoapp.com.py)"
                value={data.email}
                onChange={(e) => setData("email", e.target.value)}
                required
              />
              {errors.email && <div className="text-sm text-red-600">{errors.email}</div>}

              <input
                type="password"
                className="w-full border p-2 rounded"
                placeholder="Contraseña (mínimo 8)"
                value={data.password}
                onChange={(e) => setData("password", e.target.value)}
                required
              />
              {errors.password && <div className="text-sm text-red-600">{errors.password}</div>}

              <select
                className="w-full border p-2 rounded"
                value={data.departamento_id}
                onChange={(e) => setData("departamento_id", e.target.value)}
              >
                <option value="">-- Departamento --</option>
                {departamentos.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.nombre}
                  </option>
                ))}
              </select>

              <select
                className="w-full border p-2 rounded"
                value={data.rol}
                onChange={(e) => setData("rol", e.target.value)}
              >
                {roles.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOpenCreate(false)}
                  className="px-4 py-2 bg-gray-300 rounded"
                  disabled={processing}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-brand-blue to-brand-blue-mid hover:from-brand-blue-dark hover:to-brand-blue text-white rounded"
                  disabled={processing}
                >
                  {processing ? "Creando..." : "Crear"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* =====================
            MODAL RESET PASSWORD
        ====================== */}
        {openReset && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();

                postReset(route("admin.usuarios.reset", resetUserId), {
                  preserveScroll: true,
                  onSuccess: () => {
                    setOpenReset(false);
                    resetResetForm();
                    setResetUserId(null);
                  },
                });
              }}
              className="bg-white p-6 rounded shadow w-full max-w-sm space-y-4"
            >
              <h2 className="text-xl font-bold">🔑 Resetear contraseña</h2>

              <input
                type="password"
                className="w-full border p-2 rounded"
                placeholder="Nueva contraseña (mín. 8)"
                value={resetData.password}
                onChange={(e) => setResetData("password", e.target.value)}
                required
              />
              {resetErrors.password && (
                <div className="text-sm text-red-600">
                  {resetErrors.password}
                </div>
              )}

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setOpenReset(false);
                    resetResetForm();
                    setResetUserId(null);
                  }}
                  className="px-4 py-2 bg-gray-300 rounded"
                  disabled={resetting}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-blue hover:bg-brand-blue-dark text-white rounded"
                  disabled={resetting}
                >
                  {resetting ? "Actualizando..." : "Actualizar"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </AppLayout>
  );
}