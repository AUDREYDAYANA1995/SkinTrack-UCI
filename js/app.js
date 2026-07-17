"use strict";


/* ==========================================================
   SKINTRACK UCI
   Aplicación principal
========================================================== */


/* ==========================================================
   ELEMENTOS PRINCIPALES
========================================================== */

const views =
    document.querySelectorAll(".view");

const navigationButtons =
    document.querySelectorAll("[data-view]");

const bottomNavigationButtons =
    document.querySelectorAll(".nav-button");

const formValoracion =
    document.getElementById("formValoracion");

const notification =
    document.getElementById("notification");

const campoCama =
    document.getElementById("cama");

const campoCedula =
    document.getElementById("cedula");

const campoNombrePaciente =
    document.getElementById("nombrePaciente");

const campoRiesgo =
    document.getElementById("riesgo");

const campoEstadoPiel =
    document.getElementById("estadoPiel");

const campoTipoLesion =
    document.getElementById("tipoLesion");

const campoSubtipoLescah =
    document.getElementById("subtipoLescah");

const campoClasificacionLesion =
    document.getElementById("clasificacionLesion");

const campoRegistradoPor =
    document.getElementById("registradoPor");

const campoObservaciones =
    document.getElementById("observaciones");

const campoBuscarPaciente =
    document.getElementById("buscarPaciente");

const botonGuardar =
    formValoracion?.querySelector(
        'button[type="submit"]'
    );


/* ==========================================================
   CONSTANTES CLÍNICAS
========================================================== */

const ESTADO_LESION =
    "Lesión";

const TIPO_PRESION =
    "Lesión por presión";

const TIPO_LESCAH =
    "LESCAH";

const TIPO_MARSI =
    "MARSI";

const TIPO_DESGARRO =
    "Desgarro cutáneo";

const TIPO_FRICCION =
    "Fricción";

const SUBTIPO_DAI =
    "DAI (Dermatitis asociada a la incontinencia)";


/* ==========================================================
   ESTADO TEMPORAL
========================================================== */

let temporizadorBusquedaPaciente =
    null;

let pacienteEncontradoActual =
    null;

let ingresoSeleccionadoActual =
    null;

let formularioDesdeFicha =
    false;

let guardandoFormulario =
    false;


/* ==========================================================
   CAMBIAR ENTRE PANTALLAS
========================================================== */

function mostrarVista(viewId) {

    const targetView =
        document.getElementById(viewId);

    if (!targetView) {

        console.error(
            `No existe la vista: ${viewId}`
        );

        return;

    }

    views.forEach((view) => {

        view.classList.remove("active");

    });

    targetView.classList.add("active");

    bottomNavigationButtons.forEach(
        (button) => {

            button.classList.toggle(
                "active",
                button.dataset.view === viewId
            );

        }
    );

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

    if (viewId === "vistaValoracion") {

        actualizarFechaHoraRegistro();

    }

    if (viewId === "vistaPacientes") {

        if (campoBuscarPaciente) {

            campoBuscarPaciente.value =
                "";

        }

        cargarPacientesActivos();

    }

}


navigationButtons.forEach((button) => {

    button.addEventListener(
        "click",
        () => {

            const vistaDestino =
                button.dataset.view;

            /*
             * Cuando se abre Nueva valoración desde Inicio
             * o desde la navegación inferior, se prepara
             * un formulario independiente.
             */
            if (
                vistaDestino ===
                "vistaValoracion"
            ) {

                prepararNuevaValoracionGeneral();

            }

            mostrarVista(
                vistaDestino
            );

        }
    );

});


/* ==========================================================
   FECHA ACTUAL DEL ENCABEZADO
========================================================== */

function actualizarFechaEncabezado() {

    const fechaActual =
        document.getElementById(
            "fechaActual"
        );

    if (!fechaActual) {

        return;

    }

    const ahora =
        new Date();

    fechaActual.textContent =
        ahora
            .toLocaleDateString(
                "es-CO",
                {
                    day: "2-digit",
                    month: "short"
                }
            )
            .replace(".", "")
            .toUpperCase();

}


/* ==========================================================
   FECHA Y HORA AUTOMÁTICAS
========================================================== */

function actualizarFechaHoraRegistro() {

    const ahora =
        new Date();

    const fechaRegistro =
        document.getElementById(
            "fechaRegistro"
        );

    const horaRegistro =
        document.getElementById(
            "horaRegistro"
        );

    if (fechaRegistro) {

        fechaRegistro.textContent =
            ahora.toLocaleDateString(
                "es-CO",
                {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric"
                }
            );

    }

    if (horaRegistro) {

        horaRegistro.textContent =
            ahora.toLocaleTimeString(
                "es-CO",
                {
                    hour: "2-digit",
                    minute: "2-digit"
                }
            );

    }

}


/* ==========================================================
   NOTIFICACIONES
========================================================== */

function mostrarNotificacion(
    mensaje,
    duracion = 3500
) {

    if (!notification) {

        return;

    }

    notification.textContent =
        mensaje;

    notification.classList.add("show");

    window.setTimeout(
        () => {

            notification.classList.remove(
                "show"
            );

        },
        duracion
    );

}


/* ==========================================================
   CONTROL DEL BOTÓN GUARDAR
========================================================== */

function establecerEstadoGuardado(
    guardando
) {

    guardandoFormulario =
        guardando;

    if (!botonGuardar) {

        return;

    }

    botonGuardar.disabled =
        guardando;

    botonGuardar.textContent =
        guardando
            ? "Procesando..."
            : "Guardar valoración";

}


/* ==========================================================
   IDENTIFICACIÓN DEL PACIENTE
========================================================== */

/**
 * Desbloquea los campos de identificación.
 */
function desbloquearIdentificacionPaciente() {

    if (campoCama) {

        campoCama.disabled =
            false;

    }

    if (campoCedula) {

        campoCedula.readOnly =
            false;

    }

    if (campoNombrePaciente) {

        campoNombrePaciente.readOnly =
            false;

    }

}


/**
 * Bloquea los campos cuando la valoración se inicia
 * desde la ficha de un paciente activo.
 */
function bloquearIdentificacionPaciente() {

    if (campoCama) {

        campoCama.disabled =
            true;

    }

    if (campoCedula) {

        campoCedula.readOnly =
            true;

    }

    if (campoNombrePaciente) {

        campoNombrePaciente.readOnly =
            true;

    }

}


/**
 * Reinicia únicamente el paciente consultado.
 */
function reiniciarPacienteActual() {

    pacienteEncontradoActual =
        null;

    if (campoNombrePaciente) {

        campoNombrePaciente.value =
            "";

        campoNombrePaciente.readOnly =
            false;

    }

}


/**
 * Prepara una valoración general.
 *
 * Se utiliza cuando el formulario se abre desde Inicio
 * o desde la navegación inferior.
 */
function prepararNuevaValoracionGeneral() {

    formularioDesdeFicha =
        false;

    ingresoSeleccionadoActual =
        null;

    pacienteEncontradoActual =
        null;

    if (formValoracion) {

        formValoracion.reset();

    }

    desbloquearIdentificacionPaciente();

    reiniciarCamposLesion();

    actualizarFechaHoraRegistro();

}


/**
 * Abre el formulario para registrar una nueva valoración
 * a un paciente que ya tiene un ingreso UCI activo.
 *
 * Esta función puede ser llamada desde dashboard.js.
 *
 * @param {Object} ingreso
 */
function abrirValoracionDesdeFicha(
    ingreso
) {

    if (!ingreso?.id) {

        mostrarNotificacion(
            "No se encontró el ingreso activo del paciente"
        );

        return;

    }

    const paciente =
        ingreso.pacientes || {};

    if (!paciente?.id) {

        mostrarNotificacion(
            "No se encontró la información del paciente"
        );

        return;

    }

    formularioDesdeFicha =
        true;

    ingresoSeleccionadoActual =
        ingreso;

    pacienteEncontradoActual =
        paciente;

    if (formValoracion) {

        formValoracion.reset();

    }

    reiniciarCamposLesion();

    if (campoCama) {

        campoCama.value =
            ingreso.cama || "";

    }

    if (campoCedula) {

        campoCedula.value =
            paciente.cedula || "";

    }

    if (campoNombrePaciente) {

        campoNombrePaciente.value =
            paciente.nombre || "";

    }

    bloquearIdentificacionPaciente();

    actualizarFechaHoraRegistro();

    mostrarVista(
        "vistaValoracion"
    );

    console.log(
        "✅ Nueva valoración iniciada para paciente existente:",
        {
            paciente,
            ingreso
        }
    );

}


/* ==========================================================
   BÚSQUEDA AUTOMÁTICA DEL PACIENTE
========================================================== */

async function consultarPacienteEscrito() {

    if (
        !campoCedula ||
        !campoNombrePaciente
    ) {

        return;

    }

    if (formularioDesdeFicha) {

        return;

    }

    const cedula =
        campoCedula.value.trim();

    if (!cedula) {

        reiniciarPacienteActual();

        return;

    }

    try {

        const paciente =
            await buscarPacientePorCedula(
                cedula
            );

        pacienteEncontradoActual =
            paciente;

        if (paciente) {

            campoNombrePaciente.value =
                paciente.nombre;

            campoNombrePaciente.readOnly =
                true;

            console.log(
                "✅ Paciente encontrado:",
                paciente
            );

            mostrarNotificacion(
                "Paciente encontrado"
            );

        } else {

            pacienteEncontradoActual =
                null;

            campoNombrePaciente.value =
                "";

            campoNombrePaciente.readOnly =
                false;

            console.log(
                "ℹ️ Paciente nuevo. Debe ingresar el nombre."
            );

        }

    } catch (error) {

        reiniciarPacienteActual();

        console.error(
            "❌ No fue posible consultar el paciente:",
            error
        );

        mostrarNotificacion(
            "No fue posible consultar el paciente"
        );

    }

}


if (
    campoCedula &&
    campoNombrePaciente
) {

    campoCedula.addEventListener(
        "input",
        function () {

            if (formularioDesdeFicha) {

                return;

            }

            window.clearTimeout(
                temporizadorBusquedaPaciente
            );

            pacienteEncontradoActual =
                null;

            campoNombrePaciente.readOnly =
                false;

            const cedula =
                campoCedula.value.trim();

            if (!cedula) {

                reiniciarPacienteActual();

                return;

            }

            temporizadorBusquedaPaciente =
                window.setTimeout(
                    consultarPacienteEscrito,
                    600
                );

        }
    );

}


/* ==========================================================
   BUSCADOR DE PACIENTES ACTIVOS
========================================================== */

if (campoBuscarPaciente) {

    campoBuscarPaciente.addEventListener(
        "input",
        function () {

            buscarEnPacientesActivos(
                campoBuscarPaciente.value
            );

        }
    );

}


/* ==========================================================
   UTILIDADES DEL FORMULARIO DINÁMICO
========================================================== */

function establecerCampoRequerido(
    campo,
    requerido
) {

    if (!campo) {

        return;

    }

    campo.required =
        requerido;

}


function ocultarClasificacion() {

    ocultarGrupo(
        "grupoClasificacionLesion"
    );

    limpiarSelector(
        "clasificacionLesion",
        "Seleccione una clasificación"
    );

    establecerCampoRequerido(
        campoClasificacionLesion,
        false
    );

}


function ocultarSubtipoLescah() {

    ocultarGrupo(
        "grupoSubtipoLescah"
    );

    limpiarSelector(
        "subtipoLescah",
        "Seleccione una clasificación LESCAH"
    );

    establecerCampoRequerido(
        campoSubtipoLescah,
        false
    );

}


function ocultarTipoLesion() {

    ocultarGrupo(
        "grupoTipoLesion"
    );

    limpiarSelector(
        "tipoLesion",
        "Seleccione un tipo de lesión"
    );

    establecerCampoRequerido(
        campoTipoLesion,
        false
    );

}


/* ==========================================================
   CAMBIO DEL ESTADO GENERAL DE LA PIEL
========================================================== */

async function manejarCambioEstadoPiel() {

    const estado =
        campoEstadoPiel?.value || "";

    ocultarTipoLesion();

    ocultarSubtipoLescah();

    ocultarClasificacion();

    if (estado !== ESTADO_LESION) {

        return;

    }

    mostrarGrupo(
        "grupoTipoLesion"
    );

    establecerCampoRequerido(
        campoTipoLesion,
        true
    );

    await cargarTiposLesion();

}


/* ==========================================================
   CAMBIO DEL TIPO DE LESIÓN
========================================================== */

async function manejarCambioTipoLesion() {

    const tipoLesion =
        campoTipoLesion?.value || "";

    ocultarSubtipoLescah();

    ocultarClasificacion();

    if (!tipoLesion) {

        return;

    }

    if (tipoLesion === TIPO_LESCAH) {

        mostrarGrupo(
            "grupoSubtipoLescah"
        );

        establecerCampoRequerido(
            campoSubtipoLescah,
            true
        );

        await cargarSubtiposLescah();

        return;

    }

    const configuraciones = {

        [TIPO_PRESION]: {

            lista:
                "CLASIFICACION_PRESION",

            texto:
                "Seleccione la clasificación por presión"

        },

        [TIPO_MARSI]: {

            lista:
                "CLASIFICACION_MARSI",

            texto:
                "Seleccione la clasificación MARSI"

        },

        [TIPO_DESGARRO]: {

            lista:
                "CLASIFICACION_DESGARRO",

            texto:
                "Seleccione la clasificación del desgarro"

        },

        [TIPO_FRICCION]: {

            lista:
                "CLASIFICACION_FRICCION",

            texto:
                "Seleccione la clasificación por fricción"

        }

    };

    const configuracion =
        configuraciones[tipoLesion];

    if (!configuracion) {

        return;

    }

    mostrarGrupo(
        "grupoClasificacionLesion"
    );

    establecerCampoRequerido(
        campoClasificacionLesion,
        true
    );

    await cargarClasificacionLesion(
        configuracion.lista,
        configuracion.texto
    );

}


/* ==========================================================
   CAMBIO DEL SUBTIPO LESCAH
========================================================== */

async function manejarCambioSubtipoLescah() {

    const subtipo =
        campoSubtipoLescah?.value || "";

    ocultarClasificacion();

    if (subtipo !== SUBTIPO_DAI) {

        return;

    }

    mostrarGrupo(
        "grupoClasificacionLesion"
    );

    establecerCampoRequerido(
        campoClasificacionLesion,
        true
    );

    await cargarClasificacionLesion(
        "CLASIFICACION_DAI",
        "Seleccione la clasificación DAI"
    );

}


/* ==========================================================
   EVENTOS DEL FORMULARIO DINÁMICO
========================================================== */

if (campoEstadoPiel) {

    campoEstadoPiel.addEventListener(
        "change",
        manejarCambioEstadoPiel
    );

}


if (campoTipoLesion) {

    campoTipoLesion.addEventListener(
        "change",
        manejarCambioTipoLesion
    );

}


if (campoSubtipoLescah) {

    campoSubtipoLescah.addEventListener(
        "change",
        manejarCambioSubtipoLescah
    );

}


/* ==========================================================
   MEDIDAS PREVENTIVAS
========================================================== */

/**
 * Obtiene todas las medidas preventivas seleccionadas.
 *
 * @param {FormData} formData
 * @returns {string[]}
 */
function obtenerMedidasPreventivas(
    formData
) {

    return formData
        .getAll("medidasPreventivas")
        .map(
            (medida) =>
                String(medida || "")
                    .trim()
        )
        .filter(Boolean);

}


/* ==========================================================
   CONSTRUIR DATOS DEL FORMULARIO
========================================================== */

function obtenerDatosFormulario() {

    if (!formValoracion) {

        throw new Error(
            "No se encontró el formulario de valoración."
        );

    }

    const formData =
        new FormData(formValoracion);

    const medidasPreventivas =
        obtenerMedidasPreventivas(
            formData
        );

    /*
     * Los campos deshabilitados no se incluyen en FormData.
     * Por eso usamos directamente su valor como respaldo.
     */
    const cama =
        String(
            formData.get("cama") ||
            campoCama?.value ||
            ""
        ).trim();

    const cedula =
        String(
            formData.get("cedula") ||
            campoCedula?.value ||
            ""
        ).trim();

    const nombrePaciente =
        String(
            formData.get("nombrePaciente") ||
            campoNombrePaciente?.value ||
            ""
        ).trim();

    return {

        cama,

        cedula,

        nombrePaciente,

        riesgo:
            String(
                formData.get("riesgo") || ""
            ).trim(),

        estadoPiel:
            String(
                formData.get(
                    "estadoPiel"
                ) || ""
            ).trim(),

        tipoLesion:
            String(
                formData.get(
                    "tipoLesion"
                ) || ""
            ).trim(),

        subtipoLescah:
            String(
                formData.get(
                    "subtipoLescah"
                ) || ""
            ).trim(),

        clasificacionLesion:
            String(
                formData.get(
                    "clasificacionLesion"
                ) || ""
            ).trim(),

        medidasPreventivas,

        cambioPosicion:
            medidasPreventivas.includes(
                "Cambio de posición"
            ),

        linovera:
            medidasPreventivas.includes(
                "Linovera"
            ),

        apositoLiberacion:
            medidasPreventivas.includes(
                "Apósitos de liberación"
            ),

        barreraProteccion:
            medidasPreventivas.includes(
                "Barrera de protección"
            ),

        registradoPor:
            String(
                formData.get(
                    "registradoPor"
                ) || ""
            ).trim(),

        observaciones:
            String(
                formData.get(
                    "observaciones"
                ) || ""
            ).trim(),

        fechaHora:
            new Date().toISOString()

    };

}


/* ==========================================================
   VALIDAR DATOS
========================================================== */

function validarDatosFormulario(
    datos
) {

    if (!datos.cama) {

        throw new Error(
            "Seleccione el número de cama."
        );

    }

    if (!datos.cedula) {

        throw new Error(
            "La cédula es obligatoria."
        );

    }

    if (!datos.nombrePaciente) {

        throw new Error(
            "El nombre del paciente es obligatorio."
        );

    }

    if (!datos.riesgo) {

        throw new Error(
            "Seleccione el nivel de riesgo."
        );

    }

    if (!datos.estadoPiel) {

        throw new Error(
            "Seleccione el estado general de la piel."
        );

    }

    if (
        datos.estadoPiel === ESTADO_LESION &&
        !datos.tipoLesion
    ) {

        throw new Error(
            "Seleccione el tipo de lesión."
        );

    }

    if (
        datos.tipoLesion === TIPO_LESCAH &&
        !datos.subtipoLescah
    ) {

        throw new Error(
            "Seleccione la clasificación LESCAH."
        );

    }

    if (
        requiereClasificacion(
            datos
        ) &&
        !datos.clasificacionLesion
    ) {

        throw new Error(
            "Seleccione la clasificación de la lesión."
        );

    }

    if (
        !Array.isArray(
            datos.medidasPreventivas
        ) ||
        datos.medidasPreventivas.length === 0
    ) {

        throw new Error(
            "Seleccione al menos una medida preventiva."
        );

    }

    if (!datos.registradoPor) {

        throw new Error(
            "El responsable del registro es obligatorio."
        );

    }

}


/* ==========================================================
   VALIDAR SI REQUIERE CLASIFICACIÓN
========================================================== */

function requiereClasificacion(
    datos
) {

    const tiposConClasificacion = [

        TIPO_PRESION,
        TIPO_MARSI,
        TIPO_DESGARRO,
        TIPO_FRICCION

    ];

    if (
        tiposConClasificacion.includes(
            datos.tipoLesion
        )
    ) {

        return true;

    }

    return (
        datos.tipoLesion === TIPO_LESCAH &&
        datos.subtipoLescah === SUBTIPO_DAI
    );

}


/* ==========================================================
   PROCESAR PACIENTE E INGRESO
========================================================== */

async function prepararPacienteEIngreso(
    datosFormulario
) {

    /*
     * Cuando la valoración se abrió desde una ficha,
     * se reutilizan el paciente y el ingreso ya seleccionados.
     */
    if (
        formularioDesdeFicha &&
        pacienteEncontradoActual?.id &&
        ingresoSeleccionadoActual?.id
    ) {

        console.log(
            "✅ Se utilizará el ingreso activo seleccionado:",
            ingresoSeleccionadoActual
        );

        return {

            paciente:
                pacienteEncontradoActual,

            ingreso:
                ingresoSeleccionadoActual

        };

    }

    const paciente =
        pacienteEncontradoActual ||
        await obtenerOCrearPaciente({

            cedula:
                datosFormulario.cedula,

            nombre:
                datosFormulario.nombrePaciente

        });

    console.log(
        "✅ Paciente listo para continuar:",
        paciente
    );

    const ingreso =
        await obtenerOCrearIngresoUCI({

            pacienteId:
                paciente.id,

            cama:
                datosFormulario.cama

        });

    console.log(
        "✅ Ingreso UCI listo para continuar:",
        ingreso
    );

    pacienteEncontradoActual =
        paciente;

    ingresoSeleccionadoActual =
        ingreso;

    return {
        paciente,
        ingreso
    };

}


/* ==========================================================
   REINICIAR FORMULARIO
========================================================== */

function limpiarFormularioValoracion() {

    if (!formValoracion) {

        return;

    }

    formValoracion.reset();

    pacienteEncontradoActual =
        null;

    ingresoSeleccionadoActual =
        null;

    formularioDesdeFicha =
        false;

    desbloquearIdentificacionPaciente();

    reiniciarCamposLesion();

    actualizarFechaHoraRegistro();

}


/* ==========================================================
   ENVÍO DEL FORMULARIO
========================================================== */

if (formValoracion) {

    formValoracion.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            if (guardandoFormulario) {

                return;

            }

            establecerEstadoGuardado(
                true
            );

            try {

                const datosFormulario =
                    obtenerDatosFormulario();

                validarDatosFormulario(
                    datosFormulario
                );

                console.log(
                    "Valoración lista para guardar:",
                    datosFormulario
                );

                const {
                    paciente,
                    ingreso
                } =
                    await prepararPacienteEIngreso(
                        datosFormulario
                    );

                const valoracionGuardada =
                    await guardarValoracion({

                        ingresoId:
                            ingreso.id,

                        cama:
                            ingreso.cama ||
                            datosFormulario.cama,

                        registradoPor:
                            datosFormulario.registradoPor,

                        riesgo:
                            datosFormulario.riesgo,

                        estadoPiel:
                            datosFormulario.estadoPiel,

                        tipoLesion:
                            datosFormulario.tipoLesion,

                        subtipoLescah:
                            datosFormulario.subtipoLescah,

                        clasificacionLesion:
                            datosFormulario.clasificacionLesion,

                        cambioPosicion:
                            datosFormulario.cambioPosicion,

                        linovera:
                            datosFormulario.linovera,

                        apositoLiberacion:
                            datosFormulario.apositoLiberacion,

                        barreraProteccion:
                            datosFormulario.barreraProteccion,

                        observaciones:
                            datosFormulario.observaciones

                    });

                console.log(
                    "✅ Flujo completo guardado:",
                    {
                        paciente,
                        ingreso,
                        valoracion:
                            valoracionGuardada
                    }
                );

                mostrarNotificacion(
                    "Valoración guardada correctamente",
                    4500
                );

                await actualizarResumenInicio();

                limpiarFormularioValoracion();

                window.setTimeout(
                    () => {

                        mostrarVista(
                            "vistaInicio"
                        );

                    },
                    1200
                );

            } catch (error) {

                console.error(
                    "❌ Error al guardar la valoración:",
                    error
                );

                mostrarNotificacion(
                    error.message ||
                    "No fue posible guardar la valoración",
                    5000
                );

            } finally {

                establecerEstadoGuardado(
                    false
                );

            }

        }
    );

}


/* ==========================================================
   PRUEBA DE CONEXIÓN
========================================================== */

async function probarConexionSupabase() {

    try {

        const { data, error } =
            await supabaseClient
                .from("listas")
                .select("*")
                .limit(1);

        if (error) {

            console.error(
                "❌ Error de conexión con Supabase:",
                JSON.stringify(
                    error,
                    null,
                    2
                )
            );

            return;

        }

        console.log(
            "✅ Conexión correcta con Supabase"
        );

        console.log(
            "Datos recibidos:",
            data
        );

    } catch (error) {

        console.error(
            "❌ Error inesperado:",
            error
        );

    }

}


/* ==========================================================
   INICIALIZACIÓN
========================================================== */

async function inicializarAplicacion() {

    actualizarFechaEncabezado();

    actualizarFechaHoraRegistro();

    mostrarVista(
        "vistaInicio"
    );

    reiniciarCamposLesion();

    await Promise.all([

        probarConexionSupabase(),

        actualizarResumenInicio(),

        cargarCamas(),

        cargarCatalogosFormulario()

    ]);

    console.log(
        "✅ SkinTrack UCI inicializado correctamente"
    );

}


inicializarAplicacion();
