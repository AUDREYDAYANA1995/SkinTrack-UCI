"use strict";


/* ==========================================================
   SkinTrack UCI
   Módulo de historial de valoraciones
========================================================== */


/* ==========================================================
   DATOS DEL HISTORIAL EN MEMORIA
========================================================== */

let ingresoHistorialSeleccionado = null;

let valoracionesHistorialEnMemoria = [];


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
 * Devuelve la inicial del nombre del paciente.
 *
 * @param {unknown} nombre
 * @returns {string}
 */
function obtenerInicialPacienteHistorial(nombre) {

    const texto =
        String(nombre ?? "")
            .trim();

    return texto
        ? texto.charAt(0).toUpperCase()
        : "P";

}


/**
 * Cambia el contenido de un elemento mediante su ID.
 *
 * @param {string} elementoId
 * @param {unknown} valor
 * @param {string} valorAlternativo
 */
function establecerTextoDetalleValoracion(
    elementoId,
    valor,
    valorAlternativo = "Sin dato"
) {

    const elemento =
        document.getElementById(
            elementoId
        );

    if (!elemento) {
        return;
    }

    const texto =
        String(valor ?? "")
            .trim();

    elemento.textContent =
        texto ||
        valorAlternativo;

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
            error.message ||
            "No fue posible consultar el historial."
        );

    }

    return Array.isArray(data)
        ? data
        : [];

}


/* ==========================================================
   MEDIDAS PREVENTIVAS
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
   CONSTRUIR TARJETAS DEL HISTORIAL
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


            <div class="history-card-actions">

                <button
                    type="button"
                    class="history-action-button primary"
                    data-action="ver-valoracion"
                    data-valoracion-id="${escaparHTMLHistorial(
                        valoracion.id
                    )}"
                >

                    <span class="history-action-icon">
                        V
                    </span>

                    <span>
                        Ver valoración completa
                    </span>

                </button>

            </div>

        </article>
    `;

}


/* ==========================================================
   RENDERIZAR HISTORIAL
========================================================== */

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

    valoracionesHistorialEnMemoria =
        Array.isArray(valoraciones)
            ? valoraciones
            : [];

    if (
        valoracionesHistorialEnMemoria
            .length === 0
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
        valoracionesHistorialEnMemoria
            .map(
                construirTarjetaHistorial
            )
            .join("");

}


/* ==========================================================
   ENCABEZADO DEL HISTORIAL
========================================================== */

/**
 * Completa los datos generales del paciente en el historial.
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

    const inicial =
        document.getElementById(
            "historialInicialPaciente"
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

    if (inicial) {

        inicial.textContent =
            obtenerInicialPacienteHistorial(
                paciente.nombre
            );

    }

}


/* ==========================================================
   DETALLE DE LA VALORACIÓN
========================================================== */

/**
 * Construye la lista completa de medidas preventivas.
 *
 * @param {Object} valoracion
 */
function mostrarMedidasDetalleValoracion(
    valoracion
) {

    const contenedor =
        document.getElementById(
            "detalleValoracionMedidas"
        );

    if (!contenedor) {
        return;
    }

    const medidas = [
        {
            nombre:
                "Cambio de posición",
            activa:
                Boolean(
                    valoracion
                        .cambio_posicion
                )
        },
        {
            nombre:
                "Ácidos grasos hiperoxigenados",
            activa:
                Boolean(
                    valoracion
                        .acidos_grasos_hiperoxigenados
                )
        },
        {
            nombre:
                "Apósitos de liberación",
            activa:
                Boolean(
                    valoracion
                        .aposito_liberacion
                )
        },
        {
            nombre:
                "Barrera de protección",
            activa:
                Boolean(
                    valoracion
                        .barrera_proteccion
                )
        },
        {
            nombre:
                "Toallas removedoras",
            activa:
                Boolean(
                    valoracion
                        .toallas_removedoras
                )
        }
    ];

    contenedor.innerHTML =
        medidas
            .map(
                (medida) => `
                    <div
                        class="valuation-measure-item ${
                            medida.activa
                                ? "active"
                                : "inactive"
                        }"
                    >

                        <span
                            class="valuation-measure-status"
                            aria-hidden="true"
                        >
                            ${
                                medida.activa
                                    ? "✓"
                                    : "—"
                            }
                        </span>

                        <span>
                            ${escaparHTMLHistorial(
                                medida.nombre
                            )}
                        </span>

                    </div>
                `
            )
            .join("");

}


/**
 * Abre la pantalla con la valoración completa.
 *
 * @param {Object} valoracion
 */
function abrirDetalleValoracion(
    valoracion
) {

    if (!valoracion?.id) {

        mostrarNotificacion(
            "No se encontró la valoración seleccionada."
        );

        return;

    }

    const paciente =
        ingresoHistorialSeleccionado
            ?.pacientes || {};

    establecerTextoDetalleValoracion(
        "detalleValoracionInicial",
        obtenerInicialPacienteHistorial(
            paciente.nombre
        ),
        "P"
    );

    establecerTextoDetalleValoracion(
        "detalleValoracionNombrePaciente",
        paciente.nombre,
        "Paciente sin nombre"
    );

    establecerTextoDetalleValoracion(
        "detalleValoracionCama",
        valoracion.cama ||
        ingresoHistorialSeleccionado?.cama
    );

    establecerTextoDetalleValoracion(
        "detalleValoracionCedula",
        paciente.cedula
    );

    establecerTextoDetalleValoracion(
        "detalleValoracionFecha",
        formatearFechaHoraHistorial(
            valoracion.fecha_hora_registro
        ),
        "Sin fecha"
    );

    establecerTextoDetalleValoracion(
        "detalleValoracionRiesgo",
        valoracion.riesgo
    );

    establecerTextoDetalleValoracion(
        "detalleValoracionEstadoPiel",
        valoracion.estado_piel
    );

    establecerTextoDetalleValoracion(
        "detalleValoracionTipoLesion",
        valoracion.tipo_lesion,
        "No aplica"
    );

    establecerTextoDetalleValoracion(
        "detalleValoracionClasificacion",
        valoracion.clasificacion_lesion,
        "No aplica"
    );

    establecerTextoDetalleValoracion(
        "detalleValoracionSubtipoLescah",
        valoracion.subtipo_lescah,
        "No aplica"
    );

    establecerTextoDetalleValoracion(
        "detalleValoracionUsoPanal",
        valoracion.uso_panal
    );

    establecerTextoDetalleValoracion(
        "detalleValoracionResponsable",
        valoracion.registrado_por
    );

    establecerTextoDetalleValoracion(
        "detalleValoracionObservaciones",
        valoracion.observaciones,
        "Sin observaciones"
    );

    mostrarMedidasDetalleValoracion(
        valoracion
    );

    mostrarVista(
        "vistaDetalleValoracion"
    );

    console.log(
        "✅ Detalle de valoración abierto:",
        valoracion
    );

}


/* ==========================================================
   ABRIR HISTORIAL
========================================================== */

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

    ingresoHistorialSeleccionado =
        ingreso;

    mostrarEncabezadoHistorial(
        ingresoHistorialSeleccionado
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
   ACCIONES DEL HISTORIAL
========================================================== */

const contenedorHistorialValoraciones =
    document.getElementById(
        "listaHistorialValoraciones"
    );

if (contenedorHistorialValoraciones) {

    contenedorHistorialValoraciones
        .addEventListener(
            "click",
            function (event) {

                const boton =
                    event.target.closest(
                        "[data-action='ver-valoracion']"
                    );

                if (!boton) {
                    return;
                }

                const valoracionId =
                    boton.dataset.valoracionId;

                const valoracion =
                    valoracionesHistorialEnMemoria
                        .find(
                            (item) =>
                                String(item.id) ===
                                String(valoracionId)
                        );

                if (!valoracion) {

                    mostrarNotificacion(
                        "No se encontró la valoración seleccionada."
                    );

                    return;

                }

                abrirDetalleValoracion(
                    valoracion
                );

            }
        );

}

/* ==========================================================
   ACCIONES DEL DETALLE DE LA VALORACIÓN
========================================================== */

const botonEditarValoracion =
    document.getElementById(
        "btnEditarValoracion"
    );

if (botonEditarValoracion) {

    botonEditarValoracion.addEventListener(
        "click",
        function () {

            const valoracionActual =
                valoracionesHistorialEnMemoria.find(
                    (item) =>
                        String(item.id) ===
                        String(
                            document
                                .getElementById("detalleValoracionFecha")
                                ?.dataset
                                ?.valoracionId
                        )
                );

            if (!valoracionActual) {

                mostrarNotificacion(
                    "No se encontró la valoración."
                );

                return;

            }

            console.log(
                "✏️ Editar valoración:",
                valoracionActual
            );

            iniciarEdicionValoracion(
                valoracionActual.id
            );

            // Aquí cargaremos el formulario
            // en el siguiente paso.

            mostrarNotificacion(
                "Modo edición activado."
            );

        }
    );

}
/* ==========================================================
   MÓDULO CARGADO
========================================================== */

console.log(
    "✅ Módulo de historial cargado correctamente"
);
