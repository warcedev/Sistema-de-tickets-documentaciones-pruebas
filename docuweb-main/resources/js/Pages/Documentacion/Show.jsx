import React, { useState } from "react";
import AppLayout from "@/Layouts/AppLayout";
import { Link, usePage } from "@inertiajs/react";
import { Inertia } from "@inertiajs/inertia";
import AdjuntoPreview from "@/Components/AdjuntoPreview";

const MAX_ADJUNTO_BYTES = 100 * 1024 * 1024;

export default function Show() {
  const { documento } = usePage().props;
  const [archivos, setArchivos] = useState([]);

  const submitAdjuntos = (e) => {
    e.preventDefault();

    if (!archivos.length) {
      alert("Seleccioná al menos un archivo");
      return;
    }

    const pesados = archivos.filter((f) => f.size > MAX_ADJUNTO_BYTES);
    if (pesados.length > 0) {
      alert(`Estos archivos superan los 100 MB: ${pesados.map((f) => f.name).join(", ")}`);
      return;
    }

    const formData = new FormData();
    archivos.forEach((file) => {
      formData.append("archivos[]", file);
    });

    Inertia.post(
      route("documentacion.adjuntos.upload", documento.id),
      formData,
      { forceFormData: true }
    );
  };

  return (
    <AppLayout>
      <div className="container mx-auto p-6 max-w-3xl">
        {/* Volver */}
        <Link
          href={route("principal")}
          className="text-brand-mango hover:underline mb-4 inline-block"
        >
          ← Volver
        </Link>

        {/* Portada */}
        {documento.portada && (
          <img
            src={`/storage/${documento.portada}`}
            className="w-full h-64 object-cover rounded mb-6"
          />
        )}

        {/* Título */}
        <h1 className="text-3xl font-bold mb-4">{documento.titulo}</h1>

        {/* Contenido */}
        <div
          className="prose max-w-none"
          dangerouslySetInnerHTML={{ __html: documento.contenido }}
        />

        {/* 📎 ADJUNTOS EXISTENTES */}
        {documento.adjuntos?.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-semibold mb-3">Adjuntos</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {documento.adjuntos.map((adj) => (
                <AdjuntoPreview
                  key={adj.id}
                  adjunto={adj}
                  verUrl={route("documentacion.adjuntos.ver", adj.id)}
                  downloadUrl={route("documentacion.adjuntos.download", adj.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* ⬆️ SUBIR ADJUNTOS */}
        <div className="mt-10 border-t pt-6">
          <h2 className="text-lg font-semibold mb-4">
            Agregar adjuntos
          </h2>

          <form onSubmit={submitAdjuntos} className="space-y-4">
            <input
              type="file"
              multiple
              onChange={(e) => setArchivos(Array.from(e.target.files))}
              className="border p-2 w-full rounded"
            />
            <p className="text-xs text-gray-400">Tamaño máximo por archivo: 100 MB</p>

            <button
              type="submit"
              className="bg-gradient-to-r from-brand-blue to-brand-blue-mid hover:from-brand-blue-dark hover:to-brand-blue text-white px-4 py-2 rounded"
            >
              Subir adjuntos
            </button>
          </form>
        </div>
      </div>
    </AppLayout>
  );
}