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

                const ingresoId =
                    escaparHTML(
                        ingreso.id || ""
                    );

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
                    <button
                        type="button"
                        class="patient-card"
                        data-ingreso-id="${ingresoId}"
                        aria-label="Abrir ficha de ${nombre}"
                    >

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

                        <span
                            class="patient-card-arrow"
                            aria-hidden="true"
                        >
                            ›
                        </span>

                    </button>
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
   MOTOR DE INDICADORES CLÍNICOS
========================================================== */


/**
 * Normaliza un texto para realizar comparaciones clínicas.
 *
 * Convierte el valor a mayúsculas y elimina tildes,
 * espacios adicionales y diferencias de formato.
 *
 * @param {unknown} valor
 * @returns {string}
 */
function normalizarTextoIndicador(valor) {

    return String(valor || "")
        .trim()
        .replace(/\s+/g, " ")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toUpperCase();
}


/**
 * Calcula un porcentaje evitando divisiones por cero.
 *
 * @param {number} cantidad
 * @param {number} total
 * @returns {number}
 */
function calcularPorcentajeIndicador(
    cantidad,
    total
) {

    const cantidadNumerica =
        Number(cantidad) || 0;

    const totalNumerico =
        Number(total) || 0;

    if (totalNumerico <= 0) {
        return 0;
    }

    return Number(
        (
            cantidadNumerica /
            totalNumerico *
            100
        ).toFixed(1)
    );
}


/**
 * Consulta los datos clínicos de las valoraciones
 * registradas durante el día actual.
 *
 * @returns {Promise<Array>}
 */
async function obtenerValoracionesClinicasDeHoy() {

    const inicioDia =
        obtenerInicioDelDiaISO();

    const finDia =
        obtenerFinDelDiaISO();

    const { data, error } = await supabaseClient
        .from("valoraciones")
        .select(`
            id,
            ingreso_id,
            fecha_hora_registro,
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
            uso_panal
        `)
        .gte(
            "fecha_hora_registro",
            inicioDia
        )
        .lte(
            "fecha_hora_registro",
            finDia
        )
        .order(
            "fecha_hora_registro",
            {
                ascending: false
            }
        );

    if (error) {

        console.error(
            "❌ Error al consultar datos clínicos del día:",
            error
        );

        throw new Error(
            "No fue posible consultar los indicadores clínicos."
        );
    }

    return data || [];
}


/**
 * Conserva solamente la valoración más reciente
 * de cada ingreso durante el día.
 *
 * La consulta debe venir ordenada desde la más reciente
 * hasta la más antigua.
 *
 * @param {Array} valoraciones
 * @returns {Map<string, Object>}
 */
function obtenerUltimaValoracionPorIngreso(
    valoraciones
) {

    const valoracionesPorIngreso =
        new Map();

    if (!Array.isArray(valoraciones)) {
        return valoracionesPorIngreso;
    }

    valoraciones.forEach(
        (valoracion) => {

            const ingresoId =
                valoracion?.ingreso_id;

            if (!ingresoId) {
                return;
            }

            /*
             * Como los registros vienen ordenados
             * de forma descendente, el primero es
             * la valoración más reciente.
             */
            if (
                !valoracionesPorIngreso.has(
                    ingresoId
                )
            ) {

                valoracionesPorIngreso.set(
                    ingresoId,
                    valoracion
                );

            }

        }
    );

    return valoracionesPorIngreso;
}


/**
 * Incrementa una categoría dentro de un objeto.
 *
 * @param {Object} objeto
 * @param {string} categoria
 */
function incrementarCategoriaIndicador(
    objeto,
    categoria
) {

    const clave =
        String(categoria || "").trim();

    if (!clave) {
        return;
    }

    objeto[clave] =
        (objeto[clave] || 0) + 1;
}


/**
 * Determina la categoría del riesgo.
 *
 * @param {unknown} valor
 * @returns {"bajo"|"medio"|"alto"|"sinRegistro"}
 */
function clasificarRiesgoIndicador(valor) {

    const riesgo =
        normalizarTextoIndicador(valor);

    if (riesgo.includes("ALTO")) {
        return "alto";
    }

    if (
        riesgo.includes("MEDIO") ||
        riesgo.includes("MODERADO")
    ) {
        return "medio";
    }

    if (riesgo.includes("BAJO")) {
        return "bajo";
    }

    return "sinRegistro";
}


/**
 * Determina el estado general de la piel.
 *
 * @param {unknown} valor
 * @returns {"integra"|"lesion"|"otro"|"sinRegistro"}
 */
function clasificarEstadoPielIndicador(valor) {

    const estado =
        normalizarTextoIndicador(valor);

    if (!estado) {
        return "sinRegistro";
    }

    if (
        estado.includes("INTEGRA") ||
        estado.includes("INTEGRIDAD")
    ) {
        return "integra";
    }

    if (estado.includes("LESION")) {
        return "lesion";
    }

    return "otro";
}


/**
 * Determina si el uso de pañal corresponde a sí, no
 * o no tiene información registrada.
 *
 * @param {unknown} valor
 * @returns {"si"|"no"|"sinRegistro"}
 */
function clasificarUsoPanalIndicador(valor) {

    const usoPanal =
        normalizarTextoIndicador(valor);

    if (
        usoPanal === "SI" ||
        usoPanal === "SÍ"
    ) {
        return "si";
    }

    if (usoPanal === "NO") {
        return "no";
    }

    return "sinRegistro";
}


/**
 * Construye todos los indicadores clínicos del día.
 *
 * Reglas:
 * - incluye únicamente ingresos UCI activos;
 * - toma únicamente valoraciones del día actual;
 * - si un paciente tiene varias valoraciones hoy,
 *   utiliza solamente la más reciente;
 * - los porcentajes clínicos se calculan sobre
 *   los pacientes valorados hoy.
 *
 * @returns {Promise<Object>}
 */
async function obtenerMotorIndicadoresClinicos() {

    const [
        ingresosActivos,
        valoracionesClinicas
    ] = await Promise.all([

        obtenerIngresosActivos(),

        obtenerValoracionesClinicasDeHoy()

    ]);

    const idsIngresosActivos =
        new Set(
            ingresosActivos.map(
                (ingreso) =>
                    ingreso.id
            )
        );

    const valoracionesActivas =
        valoracionesClinicas.filter(
            (valoracion) =>
                idsIngresosActivos.has(
                    valoracion.ingreso_id
                )
        );

    const valoracionesPorIngreso =
        obtenerUltimaValoracionPorIngreso(
            valoracionesActivas
        );

    const ultimasValoraciones =
        Array.from(
            valoracionesPorIngreso.values()
        );

    const totalPacientesActivos =
        ingresosActivos.length;

    const totalValoradosHoy =
        ultimasValoraciones.length;

    const totalPendientes =
        Math.max(
            totalPacientesActivos -
            totalValoradosHoy,
            0
        );

    const indicadores = {

        fechaGeneracion:
            new Date().toISOString(),

        resumen: {

            pacientesActivos:
                totalPacientesActivos,

            valoradosHoy:
                totalValoradosHoy,

            pendientes:
                totalPendientes,

            cumplimiento:
                calcularPorcentajeIndicador(
                    totalValoradosHoy,
                    totalPacientesActivos
                )

        },

        riesgo: {

            bajo: 0,

            medio: 0,

            alto: 0,

            sinRegistro: 0

        },

        piel: {

            integra: 0,

            lesion: 0,

            otro: 0,

            sinRegistro: 0

        },

        lesiones: {

            presion: 0,

            lescah: 0,

            marsi: 0,

            desgarroCutaneo: 0,

            friccion: 0,

            otro: 0,

            sinRegistro: 0,

            categorias: {}

        },

        lescah: {

            dai: 0,

            intertrigo: 0,

            perilesional: 0,

            periestomal: 0,

            otro: 0,

            categorias: {}

        },

        clasificaciones: {},

        medidasPreventivas: {

            cambioPosicion: {
                total: 0,
                porcentaje: 0
            },

            acidosGrasosHiperoxigenados: {
                total: 0,
                porcentaje: 0
            },

            apositoLiberacion: {
                total: 0,
                porcentaje: 0
            },

            barreraProteccion: {
                total: 0,
                porcentaje: 0
            },

            toallasRemovedoras: {
                total: 0,
                porcentaje: 0
            }

        },

        usoPanal: {

            si: 0,

            no: 0,

            sinRegistro: 0

        }

    };


    ultimasValoraciones.forEach(
        (valoracion) => {

            /* ==============================================
               RIESGO
            ============================================== */

            const categoriaRiesgo =
                clasificarRiesgoIndicador(
                    valoracion.riesgo
                );

            indicadores.riesgo[
                categoriaRiesgo
            ] += 1;


            /* ==============================================
               ESTADO DE LA PIEL
            ============================================== */

            const categoriaPiel =
                clasificarEstadoPielIndicador(
                    valoracion.estado_piel
                );

            indicadores.piel[
                categoriaPiel
            ] += 1;


            /* ==============================================
               TIPO DE LESIÓN
            ============================================== */

            const tipoLesionOriginal =
                String(
                    valoracion.tipo_lesion || ""
                ).trim();

            const tipoLesion =
                normalizarTextoIndicador(
                    tipoLesionOriginal
                );

            if (!tipoLesion) {

                indicadores.lesiones
                    .sinRegistro += 1;

            } else if (
                tipoLesion.includes("PRESION")
            ) {

                indicadores.lesiones
                    .presion += 1;

            } else if (
                tipoLesion.includes("LESCAH")
            ) {

                indicadores.lesiones
                    .lescah += 1;

            } else if (
                tipoLesion.includes("MARSI")
            ) {

                indicadores.lesiones
                    .marsi += 1;

            } else if (
                tipoLesion.includes("DESGARRO")
            ) {

                indicadores.lesiones
                    .desgarroCutaneo += 1;

            } else if (
                tipoLesion.includes("FRICCION")
            ) {

                indicadores.lesiones
                    .friccion += 1;

            } else {

                indicadores.lesiones
                    .otro += 1;

            }

            if (tipoLesionOriginal) {

                incrementarCategoriaIndicador(
                    indicadores
                        .lesiones
                        .categorias,

                    tipoLesionOriginal
                );

            }


            /* ==============================================
               SUBTIPOS LESCAH
            ============================================== */

            const subtipoLescahOriginal =
                String(
                    valoracion.subtipo_lescah ||
                    ""
                ).trim();

            const subtipoLescah =
                normalizarTextoIndicador(
                    subtipoLescahOriginal
                );

            if (subtipoLescah) {

                incrementarCategoriaIndicador(
                    indicadores
                        .lescah
                        .categorias,

                    subtipoLescahOriginal
                );

                if (
                    subtipoLescah.includes("DAI") ||
                    subtipoLescah.includes(
                        "INCONTINENCIA"
                    )
                ) {

                    indicadores.lescah
                        .dai += 1;

                } else if (
                    subtipoLescah.includes(
                        "INTERTRIGO"
                    ) ||
                    subtipoLescah.includes(
                        "INTERTRIGINOSA"
                    )
                ) {

                    indicadores.lescah
                        .intertrigo += 1;

                } else if (
                    subtipoLescah.includes(
                        "PERILESIONAL"
                    )
                ) {

                    indicadores.lescah
                        .perilesional += 1;

                } else if (
                    subtipoLescah.includes(
                        "PERIESTOMAL"
                    ) ||
                    subtipoLescah.includes(
                        "PERISTOMAL"
                    )
                ) {

                    indicadores.lescah
                        .periestomal += 1;

                } else {

                    indicadores.lescah
                        .otro += 1;

                }

            }


            /* ==============================================
               CLASIFICACIÓN DE LA LESIÓN
            ============================================== */

            const clasificacion =
                String(
                    valoracion
                        .clasificacion_lesion ||
                    ""
                ).trim();

            if (clasificacion) {

                incrementarCategoriaIndicador(
                    indicadores.clasificaciones,
                    clasificacion
                );

            }


            /* ==============================================
               MEDIDAS PREVENTIVAS
            ============================================== */

            if (valoracion.cambio_posicion) {

                indicadores
                    .medidasPreventivas
                    .cambioPosicion
                    .total += 1;

            }

            if (
                valoracion
                    .acidos_grasos_hiperoxigenados
            ) {

                indicadores
                    .medidasPreventivas
                    .acidosGrasosHiperoxigenados
                    .total += 1;

            }

            if (
                valoracion.aposito_liberacion
            ) {

                indicadores
                    .medidasPreventivas
                    .apositoLiberacion
                    .total += 1;

            }

            if (
                valoracion.barrera_proteccion
            ) {

                indicadores
                    .medidasPreventivas
                    .barreraProteccion
                    .total += 1;

            }

            if (
                valoracion.toallas_removedoras
            ) {

                indicadores
                    .medidasPreventivas
                    .toallasRemovedoras
                    .total += 1;

            }


            /* ==============================================
               USO DE PAÑAL
            ============================================== */

            const categoriaUsoPanal =
                clasificarUsoPanalIndicador(
                    valoracion.uso_panal
                );

            indicadores.usoPanal[
                categoriaUsoPanal
            ] += 1;

        }
    );


    /* ======================================================
       PORCENTAJES DE MEDIDAS PREVENTIVAS
    ====================================================== */

    Object.values(
        indicadores.medidasPreventivas
    ).forEach(
        (medida) => {

            medida.porcentaje =
                calcularPorcentajeIndicador(
                    medida.total,
                    totalValoradosHoy
                );

        }
    );


    console.log(
        "✅ Motor de indicadores clínicos generado:",
        indicadores
    );

    return indicadores;
}

/* ==========================================================
   MÓDULO CARGADO
========================================================== */

console.log(
    "✅ Módulo de dashboard cargado correctamente"
);
