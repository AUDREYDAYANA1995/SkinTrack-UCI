"use strict";


/* ==========================================================
   SkinTrack UCI
   Módulo de historial de valoraciones
========================================================== */


/* ==========================================================
   UTILIDADES
========================================================== */

/**
 * Escapa texto para evitar insertar HTML no deseado.
 *
 * @param {unknown} valor
 * @returns {string}
 */
function escaparHTMLHistorial(valor) {

    return String(valor ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


/**
 * Formatea fecha y hora para mostrarla al usuario.
 *
 * @param {string|null} fechaISO
 * @returns {string}
 */
function formatearFechaHoraHistorial(fechaISO) {

    if (!fechaISO) {
        return "Sin fecha";
    }

    const fecha =
        new Date(fechaISO);

    if (Number.isNaN(fecha.getTime())) {
        return "Sin fecha";
    }

    return fecha.toLocaleString(
        "es-CO",
        {
            day: "2-digit",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    );

}


/**
 * Devuelve una etiqueta legible para valores booleanos.
 *
 * @param {unknown} valor
 * @returns {string}
 */
function textoBooleanoHistorial(valor) {

    return valor
        ? "Sí"
        : "No";

}


/* ==========================================================
   CONSULTAR HISTORIAL
========================================================== */

/**
 * Consulta todas las valoraciones asociadas a un ingreso.
 *
 * @param {string} ingresoId
 * @returns {Promise<Array>}
 */
async function consultarHistorialValoraciones(
    ingresoId
) {

    if (!ingresoId) {

        throw new Error(
            "No se recibió el identificador del ingreso."
        );

    }

    const { data, error } =
        await supabaseClient
            .from("valoraciones")
            .select(`
                id,
                ingreso_id,
                cama,
                registrado_por,
                riesgo,
                estado_piel,
                tipo_lesion,
                subtipo_lescah,
                clasificacion_lesion,
                cambio_posicion,
                acidos_grasos_hiperoxigenados,
                aposito_liberacion,
                barrera_proteccion,
                toallas_removedoras,
                uso_panal,
                observaciones,
                fecha_hora_registro
            `)
            .eq(
                "ingreso_id",
                ingresoId
            )
            .order(
                "fecha_hora_registro",
                {
                    ascending: false
                }
            );

    if (error) {

        console.error(
            "❌ Error al consultar el historial:",
            error
        );

        throw new Error(
            "No fue posible consultar el historial."
        );

    }

    return Array.isArray(data)
        ? data
        : [];

}


/* ==========================================================
   CONSTRUIR MEDIDAS PREVENTIVAS
========================================================== */

/**
 * Construye las medidas preventivas aplicadas.
 *
 * @param {Object} valoracion
 * @returns {Array<string>}
 */
function obtenerMedidasHistorial(
    valoracion
) {

    const medidas = [];

    if (valoracion.cambio_posicion) {

        medidas.push(
            "Cambio de posición"
        );

    }

    if (
        valoracion
            .acidos_grasos_hiperoxigenados
    ) {

        medidas.push(
            "Ácidos grasos hiperoxigenados"
        );

    }

    if (valoracion.aposito_liberacion) {

        medidas.push(
            "Apósitos de liberación"
        );

    }

    if (valoracion.barrera_proteccion) {

        medidas.push(
            "Barrera de protección"
        );

    }

    if (valoracion.toallas_removedoras) {

        medidas.push(
            "Toallas removedoras"
        );

    }

    return medidas;

}


/* ==========================================================
   RENDERIZAR HISTORIAL
========================================================== */

/**
 * Construye una tarjeta HTML para una valoración.
 *
 * @param {Object} valoracion
 * @returns {string}
 */
function construirTarjetaHistorial(
    valoracion
) {

    const medidas =
        obtenerMedidasHistorial(
            valoracion
        );

    const medidasHTML =
        medidas.length > 0
            ? medidas
                .map(
                    (medida) => `
                        <li>
                            ${escaparHTMLHistorial(
                                medida
                            )}
                        </li>
                    `
                )
                .join("")
            : `
                <li>
                    Sin medidas registradas
                </li>
            `;

    const tipoLesion =
        valoracion.tipo_lesion ||
        "No aplica";

    const subtipoLescah =
        valoracion.subtipo_lescah ||
        "No aplica";

    const clasificacion =
        valoracion
            .clasificacion_lesion ||
        "No aplica";

    const observaciones =
        valoracion.observaciones ||
        "Sin observaciones";

    return `
        <article
            class="history-card"
            data-valoracion-id="${escaparHTMLHistorial(
                valoracion.id
            )}"
        >

            <div class="history-card-header">

                <div>

                    <span class="history-date">
                        ${escaparHTMLHistorial(
                            formatearFechaHoraHistorial(
                                valoracion
                                    .fecha_hora_registro
                            )
                        )}
                    </span>

                    <h3>
                        ${escaparHTMLHistorial(
                            valoracion.estado_piel ||
                            "Sin estado"
                        )}
                    </h3>

                </div>

                <span class="history-risk">
                    ${escaparHTMLHistorial(
                        valoracion.riesgo ||
                        "Sin riesgo"
                    )}
                </span>

            </div>


            <div class="history-grid">

                <div class="history-item">

                    <span>
                        Tipo de lesión
                    </span>

                    <strong>
                        ${escaparHTMLHistorial(
                            tipoLesion
                        )}
                    </strong>

                </div>


                <div class="history-item">

                    <span>
                        Clasificación
                    </span>

                    <strong>
                        ${escaparHTMLHistorial(
                            clasificacion
                        )}
                    </strong>

                </div>


                <div class="history-item full-width">

                    <span>
                        Subtipo LESCAH
                    </span>

                    <strong>
                        ${escaparHTMLHistorial(
                            subtipoLescah
                        )}
                    </strong>

                </div>


                <div class="history-item">

                    <span>
                        Uso de pañal
                    </span>

                    <strong>
                        ${escaparHTMLHistorial(
                            valoracion.uso_panal ||
                            "Sin dato"
                        )}
                    </strong>

                </div>


                <div class="history-item">

                    <span>
                        Responsable
                    </span>

                    <strong>
                        ${escaparHTMLHistorial(
                            valoracion
                                .registrado_por ||
                            "Sin dato"
                        )}
                    </strong>

                </div>

            </div>


            <div class="history-measures">

                <span>
                    Medidas preventivas
                </span>

                <ul>
                    ${medidasHTML}
                </ul>

            </div>


            <div class="history-observations">

                <span>
                    Observaciones
                </span>

                <p>
                    ${escaparHTMLHistorial(
                        observaciones
                    )}
                </p>

            </div>

        </article>
    `;

}


/**
 * Muestra todas las valoraciones en pantalla.
 *
 * @param {Array} valoraciones
 */
function renderizarHistorialValoraciones(
    valoraciones
) {

    const contenedor =
        document.getElementById(
            "listaHistorialValoraciones"
        );

    if (!contenedor) {

        console.error(
            "❌ No se encontró el contenedor del historial."
        );

        return;

    }

    if (
        !Array.isArray(valoraciones) ||
        valoraciones.length === 0
    ) {

        contenedor.innerHTML = `

            <div class="empty-state">

                <div class="empty-icon">
                    H
                </div>

                <h3>
                    Sin valoraciones
                </h3>

                <p>
                    Este ingreso todavía no tiene valoraciones registradas.
                </p>

            </div>
        `;

        return;

    }

    contenedor.innerHTML =
        valoraciones
            .map(
                construirTarjetaHistorial
            )
            .join("");

}


/* ==========================================================
   ABRIR HISTORIAL
========================================================== */

/**
 * Completa los datos generales del paciente en la vista.
 *
 * @param {Object} ingreso
 */
function mostrarEncabezadoHistorial(
    ingreso
) {

    const paciente =
        ingreso?.pacientes || {};

    const nombre =
        document.getElementById(
            "historialNombrePaciente"
        );

    const cama =
        document.getElementById(
            "historialCamaPaciente"
        );

    const cedula =
        document.getElementById(
            "historialCedulaPaciente"
        );

    if (nombre) {

        nombre.textContent =
            paciente.nombre ||
            "Paciente sin nombre";

    }

    if (cama) {

        cama.textContent =
            ingreso.cama ||
            "Sin cama";

    }

    if (cedula) {

        cedula.textContent =
            paciente.cedula ||
            "Sin dato";

    }

}


/**
 * Abre y carga el historial de un ingreso.
 *
 * @param {Object} ingreso
 */
async function abrirHistorialPaciente(
    ingreso
) {

    if (!ingreso?.id) {

        mostrarNotificacion(
            "No se encontró un ingreso válido."
        );

        return;

    }

    mostrarEncabezadoHistorial(
        ingreso
    );

    mostrarVista(
        "vistaHistorialPaciente"
    );

    const contenedor =
        document.getElementById(
            "listaHistorialValoraciones"
        );

    if (contenedor) {

        contenedor.innerHTML = `

            <div class="empty-state">

                <div class="empty-icon">
                    H
                </div>

                <h3>
                    Cargando historial
                </h3>

                <p>
                    Consultando las valoraciones registradas.
                </p>

            </div>
        `;

    }

    try {

        const valoraciones =
            await consultarHistorialValoraciones(
                ingreso.id
            );

        renderizarHistorialValoraciones(
            valoraciones
        );

        console.log(
            "✅ Historial cargado:",
            valoraciones
        );

    } catch (error) {

        console.error(
            "❌ Error al abrir el historial:",
            error
        );

        if (contenedor) {

            contenedor.innerHTML = `

                <div class="empty-state">

                    <div class="empty-icon">
                        !
                    </div>

                    <h3>
                        No fue posible cargar el historial
                    </h3>

                    <p>
                        Intente nuevamente.
                    </p>

                </div>
            `;

        }

        mostrarNotificacion(
            error.message ||
            "No fue posible cargar el historial."
        );

    }

}


/* ==========================================================
   MÓDULO CARGADO
========================================================== */

console.log(
    "✅ Módulo de historial cargado correctamente"
);
