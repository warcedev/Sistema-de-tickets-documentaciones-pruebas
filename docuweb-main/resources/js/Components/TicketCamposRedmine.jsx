import React, { useState } from "react";

const inputClass = "w-full border px-2 py-1.5 rounded text-sm";
const labelClass = "block text-xs font-semibold text-gray-600 mb-1";

function DateField({ label, name, data, setData }) {
    return (
        <div>
            <label className={labelClass}>{label}</label>
            <input
                type="date"
                className={inputClass}
                value={data[name] || ""}
                onChange={(e) => setData(name, e.target.value)}
            />
        </div>
    );
}

function TextField({ label, name, data, setData, type = "text" }) {
    return (
        <div>
            <label className={labelClass}>{label}</label>
            <input
                type={type}
                className={inputClass}
                value={data[name] ?? ""}
                onChange={(e) => setData(name, e.target.value)}
            />
        </div>
    );
}

function BoolField({ label, name, data, setData }) {
    return (
        <div>
            <label className={labelClass}>{label}</label>
            <select
                className={inputClass}
                value={
                    data[name] === true || data[name] === "1"
                        ? "1"
                        : data[name] === false || data[name] === "0"
                        ? "0"
                        : ""
                }
                onChange={(e) =>
                    setData(
                        name,
                        e.target.value === "" ? "" : e.target.value === "1"
                    )
                }
            >
                <option value="">—</option>
                <option value="1">Sí</option>
                <option value="0">No</option>
            </select>
        </div>
    );
}

function UserField({ label, name, data, setData, usuarios }) {
    return (
        <div>
            <label className={labelClass}>{label}</label>
            <select
                className={inputClass}
                value={data[name] || ""}
                onChange={(e) => setData(name, e.target.value)}
            >
                <option value="">-- Sin asignar --</option>
                {usuarios.map((u) => (
                    <option key={u.id} value={u.id}>
                        {u.name} {u.apellido}
                    </option>
                ))}
            </select>
        </div>
    );
}

export default function TicketCamposRedmine({ data, setData, usuarios }) {
    const [abierto, setAbierto] = useState(false);

    return (
        <div className="border rounded-lg">
            <button
                type="button"
                onClick={() => setAbierto(!abierto)}
                className="w-full flex justify-between items-center px-4 py-3 text-sm font-semibold text-gray-700"
            >
                <span>📋 Campos adicionales (opcional, estilo Redmine)</span>
                <span className="text-gray-400">{abierto ? "▲" : "▼"}</span>
            </button>

            {abierto && (
                <div className="px-4 pb-4 space-y-5 border-t pt-4">
                    <div>
                        <h3 className="text-xs uppercase tracking-wide text-gray-400 font-semibold mb-2">
                            Fechas de planificación
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            <DateField label="Fecha de inicio" name="fecha_inicio" data={data} setData={setData} />
                            <DateField label="Fecha fin" name="fecha_fin" data={data} setData={setData} />
                            <DateField label="Fecha estimada Entrega" name="fecha_estimada_entrega" data={data} setData={setData} />
                            <DateField label="Fecha de asignación" name="fecha_asignacion" data={data} setData={setData} />
                            <DateField label="Fecha de Entrega" name="fecha_entrega" data={data} setData={setData} />
                            <DateField label="Fecha de Conformidad" name="fecha_conformidad" data={data} setData={setData} />
                        </div>
                    </div>

                    <div>
                        <h3 className="text-xs uppercase tracking-wide text-gray-400 font-semibold mb-2">
                            Relevamiento y desarrollo
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            <DateField label="Fecha Inicio Relevamiento" name="fecha_inicio_relevamiento" data={data} setData={setData} />
                            <DateField label="Fecha Fin Relevamiento" name="fecha_fin_relevamiento" data={data} setData={setData} />
                            <DateField label="Fecha Aprobación Relevamiento" name="fecha_aprobacion_relevamiento" data={data} setData={setData} />
                            <DateField label="Fecha Inicio Desarrollo" name="fecha_inicio_desarrollo" data={data} setData={setData} />
                            <DateField label="Fecha Inicio Reanudación" name="fecha_inicio_reanudacion" data={data} setData={setData} />
                            <DateField label="Fecha fin Reanudación" name="fecha_fin_reanudacion" data={data} setData={setData} />
                            <TextField label="Referencia Asignación TI" name="referencia_asignacion_ti" data={data} setData={setData} />
                            <TextField label="Prioridad TI" name="prioridad_ti" data={data} setData={setData} type="number" />
                        </div>
                    </div>

                    <div>
                        <h3 className="text-xs uppercase tracking-wide text-gray-400 font-semibold mb-2">
                            Desvíos y seguimiento
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            <TextField label="Desvíos en días" name="desvios_dias" data={data} setData={setData} type="number" />
                            <TextField label="Motivo del desvío" name="motivo_desvio" data={data} setData={setData} />
                            <TextField label="% Realizado" name="porcentaje_realizado" data={data} setData={setData} type="number" />
                            <TextField label="Tiempo estimado (ej: 7:45)" name="tiempo_estimado" data={data} setData={setData} />
                            <TextField label="Cant Objetos Modif" name="cant_objetos_modif" data={data} setData={setData} type="number" />
                            <TextField label="Área" name="area" data={data} setData={setData} />
                            <BoolField label="Documentación incompleta" name="documentacion_incompleta" data={data} setData={setData} />
                        </div>
                    </div>

                    <div>
                        <h3 className="text-xs uppercase tracking-wide text-gray-400 font-semibold mb-2">
                            QA
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            <DateField label="Fecha Estimada Entrega QA" name="fecha_estimada_entrega_qa" data={data} setData={setData} />
                            <DateField label="Fecha Entrega QA" name="fecha_entrega_qa" data={data} setData={setData} />
                            <TextField label="Hora Estimada QA" name="hora_estimada_qa" data={data} setData={setData} />
                        </div>
                    </div>

                    <div>
                        <h3 className="text-xs uppercase tracking-wide text-gray-400 font-semibold mb-2">
                            Seguridad y producción
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            <UserField label="Oficial de Seguridad Asignado" name="oficial_seguridad_id" data={data} setData={setData} usuarios={usuarios} />
                            <DateField label="Fecha Autorización Pasaje" name="fecha_autorizacion_pasaje" data={data} setData={setData} />
                            <DateField label="Fecha a Producción" name="fecha_a_produccion" data={data} setData={setData} />
                            <BoolField label="Errores en producción" name="errores_produccion" data={data} setData={setData} />
                            <BoolField label="Inconvenientes en Pasaje" name="inconvenientes_pasaje" data={data} setData={setData} />
                            <BoolField label="Incidencias en Producción" name="incidencias_produccion" data={data} setData={setData} />
                            <TextField label="Cant. vuelta atrás" name="cant_vuelta_atras" data={data} setData={setData} type="number" />
                            <BoolField label="¿Es un Evento de RO?" name="es_evento_ro" data={data} setData={setData} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
