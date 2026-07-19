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
   PANTALLA DE ESTADÍSTICAS CLÍNICAS
========================================================== */


/**
 * Cambia la visibilidad de los estados principales
 * de la pantalla de estadísticas.
 *
 * @param {"cargando"|"contenido"|"sinDatos"} estado
 */
function mostrarEstadoEstadisticas(estado) {

    const cargando =
        document.getElementById(
            "estadisticasEstadoCarga"
        );

    const contenido =
        document.getElementById(
            "estadisticasContenido"
        );

    const sinDatos =
        document.getElementById(
            "estadisticasSinDatos"
        );

    if (cargando) {
        cargando.hidden =
            estado !== "cargando";
    }

    if (contenido) {
        contenido.hidden =
            estado !== "contenido";
    }

    if (sinDatos) {
        sinDatos.hidden =
            estado !== "sinDatos";
    }

}


/**
 * Convierte un porcentaje en un valor seguro
 * entre 0 y 100.
 *
 * @param {unknown} valor
 * @returns {number}
 */
function normalizarPorcentajeEstadistica(valor) {

    const porcentaje =
        Number(valor) || 0;

    return Math.min(
        Math.max(
            porcentaje,
            0
        ),
        100
    );

}


/**
 * Escribe texto en un elemento identificado por su ID.
 *
 * @param {string} id
 * @param {unknown} valor
 */
function escribirTextoEstadistica(
    id,
    valor
) {

    const elemento =
        document.getElementById(id);

    if (!elemento) {
        return;
    }

    elemento.textContent =
        String(valor ?? "");

}


/**
 * Crea una fila visual de indicador clínico.
 *
 * @param {Object} configuracion
 * @param {string} configuracion.nombre
 * @param {number} configuracion.cantidad
 * @param {number} configuracion.total
 * @returns {string}
 */
function construirFilaIndicadorEstadistica({
    nombre,
    cantidad,
    total
}) {

    const cantidadNumerica =
        Number(cantidad) || 0;

    const totalNumerico =
        Number(total) || 0;

    const porcentaje =
        calcularPorcentajeIndicador(
            cantidadNumerica,
            totalNumerico
        );

    const porcentajeSeguro =
        normalizarPorcentajeEstadistica(
            porcentaje
        );

    return `
        <article class="statistics-indicator-item">

            <div class="statistics-indicator-header">

                <span class="statistics-indicator-name">
                    ${escaparHTML(nombre)}
                </span>

                <div class="statistics-indicator-result">

                    <strong>
                        ${cantidadNumerica}
                    </strong>

                    <small>
                        ${porcentajeSeguro} %
                    </small>

                </div>

            </div>

            <div class="statistics-indicator-progress">

                <div
                    class="statistics-indicator-progress-value"
                    style="width: ${porcentajeSeguro}%;"
                ></div>

            </div>

        </article>
    `;

}


/**
 * Renderiza una lista de categorías clínicas.
 *
 * @param {string} contenedorId
 * @param {Array<Object>} categorias
 * @param {number} total
 */
function renderizarListaIndicadoresEstadistica(
    contenedorId,
    categorias,
    total
) {

    const contenedor =
        document.getElementById(
            contenedorId
        );

    if (!contenedor) {
        return;
    }

    const categoriasValidas =
        Array.isArray(categorias)
            ? categorias
            : [];

    contenedor.innerHTML =
        categoriasValidas
            .map(
                (categoria) =>
                    construirFilaIndicadorEstadistica({
                        nombre:
                            categoria.nombre,

                        cantidad:
                            categoria.cantidad,

                        total
                    })
            )
            .join("");

}


/**
 * Renderiza el cumplimiento diario.
 *
 * @param {Object} resumen
 */
function renderizarCumplimientoEstadisticas(
    resumen
) {

    const pacientesActivos =
        Number(
            resumen?.pacientesActivos
        ) || 0;

    const valoradosHoy =
        Number(
            resumen?.valoradosHoy
        ) || 0;

    const cumplimiento =
        normalizarPorcentajeEstadistica(
            resumen?.cumplimiento
        );

    escribirTextoEstadistica(
        "estadisticaCumplimientoPorcentaje",
        `${cumplimiento} %`
    );

    escribirTextoEstadistica(
        "estadisticaValoradosHoy",
        valoradosHoy
    );

    escribirTextoEstadistica(
        "estadisticaPacientesActivos",
        pacientesActivos
    );

    const barra =
        document.getElementById(
            "estadisticaCumplimientoBarra"
        );

    if (barra) {
        barra.style.width =
            `${cumplimiento}%`;
    }

}


/**
 * Renderiza la distribución del riesgo.
 *
 * @param {Object} riesgo
 * @param {number} totalValorados
 */
function renderizarRiesgoEstadisticas(
    riesgo,
    totalValorados
) {

    escribirTextoEstadistica(
        "estadisticaRiesgoTotal",
        `${totalValorados} valorados`
    );

    const categorias = [
        {
            nombre: "Riesgo bajo",
            cantidad:
                riesgo?.bajo || 0
        },
        {
            nombre: "Riesgo medio",
            cantidad:
                riesgo?.medio || 0
        },
        {
            nombre: "Riesgo alto",
            cantidad:
                riesgo?.alto || 0
        }
    ];

    /*
     * Esta categoría solamente se muestra
     * cuando realmente existen registros sin dato.
     */
    if (
        Number(
            riesgo?.sinRegistro
        ) > 0
    ) {

        categorias.push({
            nombre: "Sin registro",
            cantidad:
                riesgo.sinRegistro
        });

    }

    renderizarListaIndicadoresEstadistica(
        "estadisticaRiesgoLista",
        categorias,
        totalValorados
    );

}


/**
 * Renderiza el estado general de la piel.
 *
 * @param {Object} piel
 * @param {number} totalValorados
 */
function renderizarEstadoPielEstadisticas(
    piel,
    totalValorados
) {

    escribirTextoEstadistica(
        "estadisticaPielTotal",
        `${totalValorados} valorados`
    );

    const categorias = [
        {
            nombre: "Piel íntegra",
            cantidad:
                piel?.integra || 0
        },
        {
            nombre: "Con lesión",
            cantidad:
                piel?.lesion || 0
        }
    ];

    /*
     * El motor utiliza "otro" para cualquier
     * opción existente en el formulario que
     * no corresponda a piel íntegra o lesión.
     */
    if (
        Number(
            piel?.otro
        ) > 0
    ) {

        categorias.push({
            nombre: "Otra condición registrada",
            cantidad:
                piel.otro
        });

    }

    if (
        Number(
            piel?.sinRegistro
        ) > 0
    ) {

        categorias.push({
            nombre: "Sin registro",
            cantidad:
                piel.sinRegistro
        });

    }

    renderizarListaIndicadoresEstadistica(
        "estadisticaPielLista",
        categorias,
        totalValorados
    );

}

/* ==========================================================
   TIPOS Y CLASIFICACIONES DE LESIONES
========================================================== */


/**
 * Suma las cantidades de una colección de categorías.
 *
 * @param {Object} categorias
 * @returns {number}
 */
function sumarCategoriasEstadistica(categorias) {

    if (
        !categorias ||
        typeof categorias !== "object"
    ) {
        return 0;
    }

    return Object.values(categorias)
        .reduce(
            (acumulado, cantidad) =>
                acumulado +
                (Number(cantidad) || 0),
            0
        );

}


/**
 * Convierte un objeto de categorías en la estructura
 * utilizada por las listas visuales.
 *
 * @param {Object} categorias
 * @returns {Array<Object>}
 */
function convertirCategoriasAListaEstadistica(
    categorias
) {

    if (
        !categorias ||
        typeof categorias !== "object"
    ) {
        return [];
    }

    return Object.entries(categorias)
        .filter(
            ([nombre, cantidad]) =>
                String(nombre || "").trim() &&
                Number(cantidad) > 0
        )
        .map(
            ([nombre, cantidad]) => ({
                nombre,
                cantidad:
                    Number(cantidad) || 0
            })
        )
        .sort(
            (a, b) =>
                b.cantidad -
                a.cantidad
        );

}


/**
 * Renderiza los tipos de lesión usando exactamente
 * las categorías registradas en el formulario.
 *
 * @param {Object} lesiones
 */
function renderizarTiposLesionEstadisticas(
    lesiones
) {

    const categorias =
        convertirCategoriasAListaEstadistica(
            lesiones?.categorias
        );

    const totalLesiones =
        sumarCategoriasEstadistica(
            lesiones?.categorias
        );

    escribirTextoEstadistica(
        "estadisticaLesionesTotal",
        `${totalLesiones} ${
            totalLesiones === 1
                ? "caso"
                : "casos"
        }`
    );

    const seccion =
        document.getElementById(
            "estadisticaLesionesSeccion"
        );

    if (seccion) {
        seccion.hidden =
            totalLesiones === 0;
    }

    renderizarListaIndicadoresEstadistica(
        "estadisticaLesionesLista",
        categorias,
        totalLesiones
    );

}


/**
 * Construye una tarjeta de clasificación clínica.
 *
 * @param {string} titulo
 * @param {Array<Object>} categorias
 * @param {number} total
 * @returns {string}
 */
function construirTarjetaClasificacionEstadistica(
    titulo,
    categorias,
    total
) {

    if (
        !Array.isArray(categorias) ||
        categorias.length === 0 ||
        total <= 0
    ) {
        return "";
    }

    const filas =
        categorias
            .map(
                (categoria) =>
                    construirFilaIndicadorEstadistica({
                        nombre:
                            categoria.nombre,

                        cantidad:
                            categoria.cantidad,

                        total
                    })
            )
            .join("");

    return `
        <article class="statistics-classification-card">

            <h4>
                ${escaparHTML(titulo)}
            </h4>

            <div class="statistics-indicator-list">
                ${filas}
            </div>

        </article>
    `;

}


/**
 * Renderiza el detalle de LESCAH y las clasificaciones
 * registradas para las lesiones.
 *
 * @param {Object} indicadores
 */
function renderizarClasificacionesEstadisticas(
    indicadores
) {

    const contenedor =
        document.getElementById(
            "estadisticaClasificacionesContenedor"
        );

    const seccion =
        document.getElementById(
            "estadisticaClasificacionesSeccion"
        );

    if (!contenedor) {
        return;
    }

    const tarjetas = [];

    const categoriasLescah =
        convertirCategoriasAListaEstadistica(
            indicadores?.lescah?.categorias
        );

    const totalLescah =
        sumarCategoriasEstadistica(
            indicadores?.lescah?.categorias
        );

    const tarjetaLescah =
        construirTarjetaClasificacionEstadistica(
            "Clasificación LESCAH",
            categoriasLescah,
            totalLescah
        );

    if (tarjetaLescah) {
        tarjetas.push(tarjetaLescah);
    }

    const categoriasClasificacion =
        convertirCategoriasAListaEstadistica(
            indicadores?.clasificaciones
        );

    const totalClasificaciones =
        sumarCategoriasEstadistica(
            indicadores?.clasificaciones
        );

    const tarjetaClasificaciones =
        construirTarjetaClasificacionEstadistica(
            "Clasificación de las lesiones",
            categoriasClasificacion,
            totalClasificaciones
        );

    if (tarjetaClasificaciones) {
        tarjetas.push(
            tarjetaClasificaciones
        );
    }

    contenedor.innerHTML =
        tarjetas.join("");

    if (seccion) {
        seccion.hidden =
            tarjetas.length === 0;
    }

}


/* ==========================================================
   MEDIDAS PREVENTIVAS
========================================================== */


/**
 * Renderiza las medidas preventivas del formulario.
 *
 * @param {Object} medidas
 * @param {number} totalValorados
 */
function renderizarMedidasPreventivasEstadisticas(
    medidas,
    totalValorados
) {

    escribirTextoEstadistica(
        "estadisticaMedidasTotal",
        `${totalValorados} valorados`
    );

    const categorias = [
        {
            nombre:
                "Cambio de posición",

            cantidad:
                medidas
                    ?.cambioPosicion
                    ?.total || 0
        },
        {
            nombre:
                "Ácidos grasos hiperoxigenados",

            cantidad:
                medidas
                    ?.acidosGrasosHiperoxigenados
                    ?.total || 0
        },
        {
            nombre:
                "Apósitos de liberación",

            cantidad:
                medidas
                    ?.apositoLiberacion
                    ?.total || 0
        },
        {
            nombre:
                "Barrera de protección",

            cantidad:
                medidas
                    ?.barreraProteccion
                    ?.total || 0
        },
        {
            nombre:
                "Toallas removedoras",

            cantidad:
                medidas
                    ?.toallasRemovedoras
                    ?.total || 0
        }
    ];

    renderizarListaIndicadoresEstadistica(
        "estadisticaMedidasLista",
        categorias,
        totalValorados
    );

}


/* ==========================================================
   USO DE PAÑAL
========================================================== */


/**
 * Renderiza el uso de pañal.
 *
 * @param {Object} usoPanal
 * @param {number} totalValorados
 */
function renderizarUsoPanalEstadisticas(
    usoPanal,
    totalValorados
) {

    escribirTextoEstadistica(
        "estadisticaPanalTotal",
        `${totalValorados} valorados`
    );

    const categorias = [
        {
            nombre: "Sí",
            cantidad:
                usoPanal?.si || 0
        },
        {
            nombre: "No",
            cantidad:
                usoPanal?.no || 0
        }
    ];

    if (
        Number(
            usoPanal?.sinRegistro
        ) > 0
    ) {

        categorias.push({
            nombre: "Sin registro",
            cantidad:
                usoPanal.sinRegistro
        });

    }

    renderizarListaIndicadoresEstadistica(
        "estadisticaPanalLista",
        categorias,
        totalValorados
    );

}

/**
 * Consulta y muestra las estadísticas clínicas del día.
 *
 * @returns {Promise<void>}
 */
async function cargarEstadisticasClinicas() {

    mostrarEstadoEstadisticas(
        "cargando"
    );

    try {

        const indicadores =
            await obtenerMotorIndicadoresClinicos();

        const totalValorados =
            Number(
                indicadores
                    ?.resumen
                    ?.valoradosHoy
            ) || 0;

        if (totalValorados === 0) {

            /*
             * Aunque no existan valoraciones,
             * conservamos el cumplimiento calculado
             * para poder revisar la información
             * desde la consola.
             */
            console.log(
                "ℹ️ No hay valoraciones clínicas del día:",
                indicadores
            );

            mostrarEstadoEstadisticas(
                "sinDatos"
            );

            return;
        }

        renderizarCumplimientoEstadisticas(
            indicadores.resumen
        );

        renderizarRiesgoEstadisticas(
            indicadores.riesgo,
            totalValorados
        );

        renderizarEstadoPielEstadisticas(
    indicadores.piel,
    totalValorados
);

renderizarTiposLesionEstadisticas(
    indicadores.lesiones
);

renderizarClasificacionesEstadisticas(
    indicadores
);

renderizarMedidasPreventivasEstadisticas(
    indicadores.medidasPreventivas,
    totalValorados
);

renderizarUsoPanalEstadisticas(
    indicadores.usoPanal,
    totalValorados
);

mostrarEstadoEstadisticas(
    "contenido"
);

        console.log(
            "✅ Estadísticas clínicas mostradas:",
            {
                resumen:
                    indicadores.resumen,

                riesgo:
                    indicadores.riesgo,

                piel:
                    indicadores.piel
            }
        );

    } catch (error) {

        console.error(
            "❌ No fue posible cargar las estadísticas clínicas:",
            error
        );

        const estadoCarga =
            document.getElementById(
                "estadisticasEstadoCarga"
            );

        if (estadoCarga) {

            estadoCarga.innerHTML = `
                <div class="statistics-empty-icon">
                    !
                </div>

                <h3>
                    No fue posible cargar los indicadores
                </h3>

                <p>
                    Revise la conexión e intente nuevamente.
                </p>
            `;

        }

        mostrarEstadoEstadisticas(
            "cargando"
        );

    }

}


/* ==========================================================
   ACTIVACIÓN DE LA PANTALLA DE ESTADÍSTICAS
========================================================== */


/**
 * Observa la clase de la vista para cargar
 * los indicadores cuando Estadísticas se activa.
 */
document.addEventListener(
    "click",
    (evento) => {

        const boton =
            evento.target.closest(
                '[data-view="vistaEstadisticas"]'
            );

        if (!boton) {
            return;
        }

        /*
         * Se utiliza setTimeout para permitir que app.js
         * termine primero el cambio de vista.
         */
        window.setTimeout(
            () => {
                cargarEstadisticasClinicas();
            },
            0
        );

    }
);


/**
 * También observa la clase de la vista para cubrir
 * aperturas realizadas mediante mostrarVista()
 * desde otros módulos.
 */
const vistaEstadisticasObservada =
    document.getElementById(
        "vistaEstadisticas"
    );

if (vistaEstadisticasObservada) {

    const observadorVistaEstadisticas =
        new MutationObserver(
            () => {

                if (
                    vistaEstadisticasObservada
                        .classList
                        .contains("active")
                ) {

                    cargarEstadisticasClinicas();

                }

            }
        );

    observadorVistaEstadisticas.observe(
        vistaEstadisticasObservada,
        {
            attributes: true,
            attributeFilter: [
                "class"
            ]
        }
    );

}
/* ==========================================================
   MÓDULO CARGADO
========================================================== */

console.log(
    "✅ Módulo de dashboard cargado correctamente"
);
