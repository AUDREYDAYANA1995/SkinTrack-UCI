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

const campoCedula =
    document.getElementById("cedula");

const campoNombrePaciente =
    document.getElementById("nombrePaciente");

const campoCama =
    document.getElementById("cama");

const botonGuardar =
    formValoracion?.querySelector(
        'button[type="submit"]'
    );


/* ==========================================================
   ESTADO TEMPORAL DE LA APLICACIÓN
========================================================== */

let temporizadorBusquedaPaciente = null;

let pacienteEncontradoActual = null;

let guardandoFormulario = false;


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

    bottomNavigationButtons.forEach((button) => {

        button.classList.toggle(
            "active",
            button.dataset.view === viewId
        );

    });

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

    if (viewId === "vistaValoracion") {
        actualizarFechaHoraRegistro();
    }

}


navigationButtons.forEach((button) => {

    button.addEventListener("click", () => {

        mostrarVista(
            button.dataset.view
        );

    });

});


/* ==========================================================
   FECHA ACTUAL DEL ENCABEZADO
========================================================== */

function actualizarFechaEncabezado() {

    const fechaActual =
        document.getElementById("fechaActual");

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
   FECHA Y HORA AUTOMÁTICAS DEL FORMULARIO
========================================================== */

function actualizarFechaHoraRegistro() {

    const ahora =
        new Date();

    const fechaRegistro =
        document.getElementById("fechaRegistro");

    const horaRegistro =
        document.getElementById("horaRegistro");

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
    message,
    duration = 3500
) {

    if (!notification) {
        return;
    }

    notification.textContent =
        message;

    notification.classList.add("show");

    window.setTimeout(() => {

        notification.classList.remove("show");

    }, duration);

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
   LIMPIAR DATOS DEL PACIENTE EN MEMORIA
========================================================== */

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


/* ==========================================================
   BÚSQUEDA AUTOMÁTICA DE PACIENTE POR CÉDULA
========================================================== */

async function consultarPacienteEscrito() {

    if (
        !campoCedula ||
        !campoNombrePaciente
    ) {
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

    return {

        cama:
            String(
                formData.get("cama") || ""
            ).trim(),

        cedula:
            String(
                formData.get("cedula") || ""
            ).trim(),

        nombrePaciente:
            String(
                formData.get(
                    "nombrePaciente"
                ) || ""
            ).trim(),

        estadoPiel:
            String(
                formData.get("estadoPiel") || ""
            ).trim(),

        complejidad:
            String(
                formData.get("complejidad") || ""
            ).trim(),

        presentaLesion:
            String(
                formData.get(
                    "presentaLesion"
                ) || ""
            ).trim(),

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
   VALIDAR DATOS ESENCIALES
========================================================== */

function validarDatosFormulario(
    datos
) {

    if (!datos.cama) {
        throw new Error(
            "El número de cama es obligatorio."
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

    if (!datos.estadoPiel) {
        throw new Error(
            "Seleccione el estado general de la piel."
        );
    }

    if (!datos.complejidad) {
        throw new Error(
            "Seleccione la complejidad del paciente."
        );
    }

    if (!datos.presentaLesion) {
        throw new Error(
            "Indique si el paciente presenta lesión."
        );
    }

    if (!datos.registradoPor) {
        throw new Error(
            "El nombre de quien realiza el registro es obligatorio."
        );
    }

}


/* ==========================================================
   PROCESAR PACIENTE E INGRESO UCI
========================================================== */

async function prepararPacienteEIngreso(
    datosFormulario
) {

    /*
     * 1. Buscar o crear al paciente.
     */
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


    /*
     * 2. Buscar el ingreso activo o crear uno.
     */
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

    return {
        paciente,
        ingreso
    };

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

            establecerEstadoGuardado(true);

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

                /*
                 * Todavía no insertamos en valoraciones.
                 * En el siguiente módulo usaremos:
                 *
                 * ingreso.id
                 * datosFormulario.estadoPiel
                 * datosFormulario.complejidad
                 * datosFormulario.presentaLesion
                 * datosFormulario.registradoPor
                 * datosFormulario.observaciones
                 */

                console.log(
                    "✅ Datos preparados para guardar la valoración:",
                    {
                        paciente,
                        ingreso,
                        valoracion:
                            datosFormulario
                    }
                );

                mostrarNotificacion(
                    "Paciente e ingreso UCI preparados correctamente",
                    4500
                );

            } catch (error) {

                console.error(
                    "❌ Error al preparar el registro:",
                    error
                );

                mostrarNotificacion(
                    error.message ||
                    "No fue posible procesar el registro",
                    5000
                );

            } finally {

                establecerEstadoGuardado(false);

            }

        }
    );

}


/* ==========================================================
   PRUEBA DE CONEXIÓN CON SUPABASE
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

actualizarFechaEncabezado();

actualizarFechaHoraRegistro();

mostrarVista("vistaInicio");

probarConexionSupabase();
