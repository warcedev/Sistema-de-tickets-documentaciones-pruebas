import React, { useState } from "react";

function fmtFecha(v) {
    if (!v) return "—";
    // v llega como "YYYY-MM-DDTHH:mm:ss...Z" (Carbon). Tomamos solo la parte de
    // fecha y la formateamos directo, sin pasar por Date(), para evitar el
    // corrimiento de un día por conversión de timezone (UTC -> local).
    const soloFecha = v.split("T")[0];
    const [y, m, d] = soloFecha.split("-");
    return `${d}/${m}/${y}`;
}

function fmtBool(v) {
    if (v === null || v === undefined) return "—";
    return v ? "Sí" : "No";
}

function Row({ label, value }) {
    return (
        <div className="flex justify-between border-b border-dashed py-1.5 text-sm">
            <span className="text-gray-500">{label}</span>
            <span className="text-gray-800 font-medium">{value ?? "—"}</span>
        </div>
    );
}

export default function TicketCamposRedmineView({ ticket }) {
    const [abierto, setAbierto] = useState(false);

    const campos = [
        "fecha_inicio", "fecha_fin", "fecha_estimada_entrega", "fecha_asignacion",
        "fecha_entrega", "fecha_conformidad", "fecha_inicio_relevamiento",
        "fecha_fin_relevamiento", "fecha_aprobacion_relevamiento", "fecha_inicio_desarrollo",
        "fecha_inicio_reanudacion", "fecha_fin_reanudacion", "desvios_dias", "motivo_desvio",
        "fecha_a_produccion", "fecha_autorizacion_pasaje", "errores_produccion",
        "inconvenientes_pasaje", "incidencias_produccion", "cant_vuelta_atras",
        "fecha_estimada_entrega_qa", "fecha_entrega_qa", "hora_estimada_qa",
        "oficial_seguridad_id", "porcentaje_realizado", "tiempo_estimado",
        "cant_objetos_modif", "prioridad_ti", "referencia_asignacion_ti",
        "documentacion_incompleta", "area", "es_evento_ro",
    ];

    const hayDatos = campos.some((c) => ticket[c] !== null && ticket[c] !== undefined && ticket[c] !== "");

    if (!hayDatos) return null;

    return (
        <div className="bg-white rounded-xl shadow p-6 mb-6">
            <button
                onClick={() => setAbierto(!abierto)}
                className="w-full flex justify-between items-center text-lg font-semibold"
            >
                <span>📋 Campos adicionales</span>
                <span className="text-gray-400 text-sm">{abierto ? "▲" : "▼"}</span>
            </button>

            {abierto && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 mt-4">
                    <div>
                        <Row label="Fecha de inicio" value={fmtFecha(ticket.fecha_inicio)} />
                        <Row label="Fecha fin" value={fmtFecha(ticket.fecha_fin)} />
                        <Row label="Fecha estimada Entrega" value={fmtFecha(ticket.fecha_estimada_entrega)} />
                        <Row label="Desvíos en días" value={ticket.desvios_dias} />
                        <Row label="Motivo del desvío" value={ticket.motivo_desvio} />
                        <Row label="Fecha a Producción" value={fmtFecha(ticket.fecha_a_produccion)} />
                        <Row label="Fecha Inicio Reanudación" value={fmtFecha(ticket.fecha_inicio_reanudacion)} />
                        <Row label="Fecha fin Reanudación" value={fmtFecha(ticket.fecha_fin_reanudacion)} />
                        <Row label="Prioridad TI" value={ticket.prioridad_ti} />
                        <Row label="Fecha de asignación" value={fmtFecha(ticket.fecha_asignacion)} />
                        <Row label="Fecha de Entrega" value={fmtFecha(ticket.fecha_entrega)} />
                        <Row label="Fecha de Conformidad" value={fmtFecha(ticket.fecha_conformidad)} />
                        <Row label="Referencia Asignación TI" value={ticket.referencia_asignacion_ti} />
                        <Row label="Fecha Inicio Relevamiento" value={fmtFecha(ticket.fecha_inicio_relevamiento)} />
                        <Row label="Fecha Fin Relevamiento" value={fmtFecha(ticket.fecha_fin_relevamiento)} />
                        <Row label="Fecha Inicio Desarrollo" value={fmtFecha(ticket.fecha_inicio_desarrollo)} />
                        <Row label="Fecha Aprobación Relevamiento" value={fmtFecha(ticket.fecha_aprobacion_relevamiento)} />
                    </div>

                    <div>
                        <Row label="% Realizado" value={ticket.porcentaje_realizado !== null ? `${ticket.porcentaje_realizado}%` : "—"} />
                        <Row label="Tiempo estimado" value={ticket.tiempo_estimado} />
                        <Row label="Cant Objetos Modif" value={ticket.cant_objetos_modif} />
                        <Row label="Oficial de Seguridad Asignado" value={ticket.oficial_seguridad?.name} />
                        <Row label="Fecha Autorización Pasaje" value={fmtFecha(ticket.fecha_autorizacion_pasaje)} />
                        <Row label="Errores en producción" value={fmtBool(ticket.errores_produccion)} />
                        <Row label="Inconvenientes en Pasaje" value={fmtBool(ticket.inconvenientes_pasaje)} />
                        <Row label="Cant. vuelta atrás" value={ticket.cant_vuelta_atras} />
                        <Row label="Documentación incompleta" value={fmtBool(ticket.documentacion_incompleta)} />
                        <Row label="Área" value={ticket.area} />
                        <Row label="Fecha Estimada Entrega QA" value={fmtFecha(ticket.fecha_estimada_entrega_qa)} />
                        <Row label="Fecha Entrega QA" value={fmtFecha(ticket.fecha_entrega_qa)} />
                        <Row label="Hora Estimada QA" value={ticket.hora_estimada_qa} />
                        <Row label="Incidencias en Producción" value={fmtBool(ticket.incidencias_produccion)} />
                        <Row label="¿Es un Evento de RO?" value={fmtBool(ticket.es_evento_ro)} />
                    </div>
                </div>
            )}
        </div>
    );
}
