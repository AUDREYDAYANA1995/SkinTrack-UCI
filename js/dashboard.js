"use strict";


/* ==========================================================
   SkinTrack UCI
   Módulo de dashboard
========================================================== */


/* ==========================================================
   FECHAS DEL DÍA ACTUAL
========================================================== */


/**
 * Obtiene el inicio del día actual en formato ISO.
 *
 * @returns {string}
 */
function obtenerInicioDelDiaISO() {

    const ahora = new Date();

    const inicioDia = new Date(
        ahora.getFullYear(),
        ahora.getMonth(),
        ahora.getDate(),
        0,
        0,
        0,
        0
    );

    return inicioDia.toISOString();
}


/**
 * Obtiene el final del día actual en formato ISO.
 *
 * @returns {string}
 */
function obtenerFinDelDiaISO() {

    const ahora = new Date();

    const finDia = new Date(
        ahora.getFullYear(),
        ahora.getMonth(),
        ahora.getDate(),
        23,
        59,
        59,
        999
    );

    return finDia.toISOString();
}


/* ==========================================================
   CONSULTAS PARA EL RESUMEN DE INICIO
========================================================== */


/**
 * Consulta los ingresos UCI activos.
 *
 * @returns {Promise<Array>}
 */
async function obtenerIngresosActivos() {

    const { data, error } = await supabaseClient
        .from("ingresos_uci")
        .select(`
            id,
            paciente_id,
            cama
        `)
        .eq("estado", "ACTIVO")
        .is("fecha_egreso", null);

    if (error) {

        console.error(
            "❌ Error al consultar ingresos activos:",
            error
        );

        throw new Error(
            "No fue posible consultar los pacientes activos."
        );
    }

    return data || [];
}


/**
 * Consulta las valoraciones registradas durante el día actual.
 *
 * @returns {Promise<Array>}
 */
async function obtenerValoracionesDeHoy() {

    const inicioDia =
        obtenerInicioDelDiaISO();

    const finDia =
        obtenerFinDelDiaISO();

    const { data, error } = await supabaseClient
        .from("valoraciones")
        .select(`
            id,
            ingreso_id,
            fecha_hora_registro
        `)
        .gte(
            "fecha_hora_registro",
            inicioDia
        )
        .lte(
            "fecha_hora_registro",
            finDia
        );

    if (error) {

        console.error(
            "❌ Error al consultar valoraciones de hoy:",
            error
        );

        throw new Error(
            "No fue posible consultar las valoraciones del día."
        );
    }

    return data || [];
}


/* ==========================================================
   RESUMEN PRINCIPAL
========================================================== */


/**
 * Actualiza los indicadores:
 * - pacientes activos;
 * - valorados hoy;
 * - pendientes.
 *
 * @returns {Promise<Object>}
 */
async function actualizarResumenInicio() {

    const elementoPacientes =
        document.getElementById(
            "totalPacientes"
        );

    const elementoValorados =
        document.getElementById(
            "totalValorados"
        );

    const elementoPendientes =
        document.getElementById(
            "totalPendientes"
        );

    try {

        const [
            ingresosActivos,
            valoracionesHoy
        ] = await Promise.all([
            obtenerIngresosActivos(),
            obtenerValoracionesDeHoy()
        ]);

        const ingresosValoradosHoy =
            new Set(
                valoracionesHoy.map(
                    (valoracion) =>
                        valoracion.ingreso_id
                )
            );

        const totalPacientes =
            ingresosActivos.length;

        const totalValorados =
            ingresosActivos.filter(
                (ingreso) =>
                    ingresosValoradosHoy.has(
                        ingreso.id
                    )
            ).length;

        const totalPendientes =
            Math.max(
                totalPacientes -
                totalValorados,
                0
            );

        if (elementoPacientes) {

            elementoPacientes.textContent =
                String(totalPacientes);

        }

        if (elementoValorados) {

            elementoValorados.textContent =
                String(totalValorados);

        }

        if (elementoPendientes) {

            elementoPendientes.textContent =
                String(totalPendientes);

        }

        const resumen = {
            totalPacientes,
            totalValorados,
            totalPendientes
        };

        console.log(
            "✅ Resumen de inicio actualizado:",
            resumen
        );

        return resumen;

    } catch (error) {

        console.error(
            "❌ No fue posible actualizar el resumen:",
            error
        );

        if (elementoPacientes) {
            elementoPacientes.textContent = "0";
        }

        if (elementoValorados) {
            elementoValorados.textContent = "0";
        }

        if (elementoPendientes) {
            elementoPendientes.textContent = "0";
        }

        return {
            totalPacientes: 0,
            totalValorados: 0,
            totalPendientes: 0
        };
    }
}


/* ==========================================================
   CONSULTA DETALLADA DE PACIENTES ACTIVOS
========================================================== */


/**
 * Consulta ingresos activos junto con los datos del paciente.
 *
 * @returns {Promise<Array>}
 */
async function obtenerPacientesActivosConDatos() {

    const { data, error } = await supabaseClient
        .from("ingresos_uci")
        .select(`
            id,
            cama,
            fecha_ingreso,
            paciente_id,
            pacientes (
                id,
                cedula,
                nombre
            )
        `)
        .eq("estado", "ACTIVO")
        .is("fecha_egreso", null)
        .order(
            "cama",
            {
                ascending: true
            }
        );

    if (error) {

        console.error(
            "❌ Error al consultar pacientes activos:",
            error
        );

        throw new Error(
            "No fue posible consultar los pacientes activos."
        );
    }

    return data || [];
}


/* ==========================================================
   ESTADO TEMPORAL DE PACIENTES ACTIVOS
========================================================== */

let pacientesActivosEnMemoria = [];


/* ==========================================================
   SEGURIDAD DE TEXTO
========================================================== */


/**
 * Escapa caracteres especiales antes de insertarlos en HTML.
 *
 * @param {unknown} valor
 * @returns {string}
 */
function escaparHTML(valor) {

    return String(valor ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


/* ==========================================================
   RESUMEN DE LA PANTALLA PACIENTES ACTIVOS
========================================================== */


/**
 * Muestra únicamente el total de pacientes activos.
 */
function mostrarResumenPacientesActivos() {

    const contenedor =
        document.getElementById(
            "listaPacientes"
        );

    if (!contenedor) {
        return;
    }

    const total =
        pacientesActivosEnMemoria.length;

    contenedor.className =
        "patients-search-state";

    contenedor.innerHTML = `
        <div class="patients-count-card">

            <span>
                Pacientes activos
            </span>

            <strong>
                ${total}
            </strong>

            <small>
                Busque por cama, cédula o nombre
                para consultar la información.
            </small>

        </div>
    `;
}


/* ==========================================================
   RESULTADOS DE BÚSQUEDA
========================================================== */


/**
 * Muestra los pacientes encontrados.
 *
 * @param {Array} ingresos
 */
function renderizarResultadosPacientes(
    ingresos
) {

    const contenedor =
        document.getElementById(
            "listaPacientes"
        );

    if (!contenedor) {
        return;
    }

    if (!Array.isArray(ingresos)) {

        contenedor.className =
            "empty-state";

        contenedor.innerHTML = `
            <div class="empty-icon">
                !
            </div>

            <h3>
                Resultado no válido
            </h3>

            <p>
                No fue posible procesar la consulta.
            </p>
        `;

        return;
    }

    if (ingresos.length === 0) {

        contenedor.className =
            "empty-state";

        contenedor.innerHTML = `
            <div class="empty-icon">
                !
            </div>

            <h3>
                No se encontraron pacientes
            </h3>

            <p>
                Revise la cama, la cédula
                o el nombre ingresado.
            </p>
        `;

        return;
    }

    contenedor.className =
        "patients-list";

    contenedor.innerHTML =
        ingresos
            .map((ingreso) => {

                const paciente =
                    ingreso.pacientes || {};

                const fechaIngreso =
                    ingreso.fecha_ingreso
                        ? new Date(
                            ingreso.fecha_ingreso
                        ).toLocaleDateString(
                            "es-CO",
                            {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric"
                            }
                        )
                        : "Sin fecha";

                const valoradoHoy =
                    Boolean(
                        ingreso.valoradoHoy
                    );

                const textoEstado =
                    valoradoHoy
                        ? "Valorado hoy"
                        : "Pendiente";

                const claseEstado =
                    valoradoHoy
                        ? "completed"
                        : "pending";

                const cama =
                    escaparHTML(
                        ingreso.cama || "—"
                    );

                const nombre =
                    escaparHTML(
                        paciente.nombre ||
                        "Sin nombre"
                    );

                const cedula =
                    escaparHTML(
                        paciente.cedula ||
                        "Sin dato"
                    );

                return `
                    <article class="patient-card">

                        <div class="patient-card-header">

                            <div>

                                <span class="patient-bed">
                                    Cama ${cama}
                                </span>

                                <h3>
                                    ${nombre}
                                </h3>

                            </div>

                            <span
                                class="
                                    patient-status
                                    ${claseEstado}
                                "
                            >
                                ${textoEstado}
                            </span>

                        </div>

                        <div class="patient-card-data">

                            <p>
                                <strong>
                                    Cédula:
                                </strong>

                                ${cedula}
                            </p>

                            <p>
                                <strong>
                                    Ingreso:
                                </strong>

                                ${fechaIngreso}
                            </p>

                        </div>

                    </article>
                `;

            })
            .join("");
}


/* ==========================================================
   CARGA DE PACIENTES ACTIVOS
========================================================== */


/**
 * Consulta pacientes activos y conserva los resultados
 * en memoria para realizar búsquedas locales.
 */
async function cargarPacientesActivos() {

    const contenedor =
        document.getElementById(
            "listaPacientes"
        );

    if (!contenedor) {
        return;
    }

    contenedor.className =
        "empty-state";

    contenedor.innerHTML = `
        <div class="empty-icon">
            …
        </div>

        <h3>
            Cargando pacientes
        </h3>

        <p>
            Espere un momento.
        </p>
    `;

    try {

        const [
            ingresosActivos,
            valoracionesHoy
        ] = await Promise.all([
            obtenerPacientesActivosConDatos(),
            obtenerValoracionesDeHoy()
        ]);

        const ingresosValoradosHoy =
            new Set(
                valoracionesHoy.map(
                    (valoracion) =>
                        valoracion.ingreso_id
                )
            );

        pacientesActivosEnMemoria =
            ingresosActivos.map(
                (ingreso) => ({
                    ...ingreso,

                    valoradoHoy:
                        ingresosValoradosHoy.has(
                            ingreso.id
                        )
                })
            );

        mostrarResumenPacientesActivos();

        console.log(
            "✅ Pacientes activos disponibles:",
            pacientesActivosEnMemoria.length
        );

    } catch (error) {

        pacientesActivosEnMemoria = [];

        console.error(
            "❌ No fue posible cargar los pacientes activos:",
            error
        );

        contenedor.className =
            "empty-state";

        contenedor.innerHTML = `
            <div class="empty-icon">
                !
            </div>

            <h3>
                No fue posible cargar los pacientes
            </h3>

            <p>
                Intente nuevamente en unos segundos.
            </p>
        `;
    }
}


/* ==========================================================
   BUSCADOR DE PACIENTES ACTIVOS
========================================================== */


/**
 * Busca por cama, cédula o nombre.
 *
 * @param {string} texto
 */
function buscarEnPacientesActivos(
    texto
) {

    const consulta =
        String(texto || "")
            .trim()
            .toLowerCase();

    if (!consulta) {

        mostrarResumenPacientesActivos();

        return;
    }

    const resultados =
        pacientesActivosEnMemoria.filter(
            (ingreso) => {

                const paciente =
                    ingreso.pacientes || {};

                const cama =
                    String(
                        ingreso.cama || ""
                    ).toLowerCase();

                const cedula =
                    String(
                        paciente.cedula || ""
                    ).toLowerCase();

                const nombre =
                    String(
                        paciente.nombre || ""
                    ).toLowerCase();

                return (
                    cama.includes(
                        consulta
                    ) ||
                    cedula.includes(
                        consulta
                    ) ||
                    nombre.includes(
                        consulta
                    )
                );
            }
        );

    renderizarResultadosPacientes(
        resultados
    );
}


/* ==========================================================
   MÓDULO CARGADO
========================================================== */

console.log(
    "✅ Módulo de dashboard cargado correctamente"
);
