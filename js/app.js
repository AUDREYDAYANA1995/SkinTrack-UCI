"use strict";


/* ==========================================================
   ELEMENTOS PRINCIPALES
========================================================== */

const views = document.querySelectorAll(".view");

const navigationButtons =
    document.querySelectorAll("[data-view]");

const bottomNavigationButtons =
    document.querySelectorAll(".nav-button");

const formValoracion =
    document.getElementById("formValoracion");

const notification =
    document.getElementById("notification");


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

        mostrarVista(button.dataset.view);

    });

});


/* ==========================================================
   FECHA ACTUAL DEL ENCABEZADO
========================================================== */

function actualizarFechaEncabezado() {

    const fechaActual =
        document.getElementById("fechaActual");

    const ahora =
        new Date();

    fechaActual.textContent =
        ahora.toLocaleDateString(
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

    fechaRegistro.textContent =
        ahora.toLocaleDateString(
            "es-CO",
            {
                day: "2-digit",
                month: "2-digit",
                year: "numeric"
            }
        );

    horaRegistro.textContent =
        ahora.toLocaleTimeString(
            "es-CO",
            {
                hour: "2-digit",
                minute: "2-digit"
            }
        );

}


/* ==========================================================
   NOTIFICACIONES
========================================================== */

function mostrarNotificacion(message) {

    notification.textContent = message;

    notification.classList.add("show");

    window.setTimeout(() => {

        notification.classList.remove("show");

    }, 3000);

}


/* ==========================================================
   ENVÍO TEMPORAL DEL FORMULARIO
   Aún no guarda en Supabase
========================================================== */

formValoracion.addEventListener(
    "submit",
    (event) => {

        event.preventDefault();

        const formData =
            new FormData(formValoracion);

        const valoracion = {

            cama:
                formData.get("cama"),

            cedula:
                formData.get("cedula"),

            nombrePaciente:
                formData.get("nombrePaciente"),

            estadoPiel:
                formData.get("estadoPiel"),

            complejidad:
                formData.get("complejidad"),

            presentaLesion:
                formData.get("presentaLesion"),

            registradoPor:
                formData.get("registradoPor"),

            observaciones:
                formData.get("observaciones"),

            fechaHora:
                new Date().toISOString()

        };

        console.log(
            "Valoración lista para guardar:",
            valoracion
        );

        mostrarNotificacion(
            "Formulario validado correctamente"
        );

        /*
        No limpiamos todavía el formulario,
        porque primero verificaremos que la
        interfaz esté como la necesitas.

        Cuando conectemos Supabase, aquí se
        realizará el guardado real.
        */

    }
);


/* ==========================================================
   INICIALIZACIÓN
========================================================== */

actualizarFechaEncabezado();

actualizarFechaHoraRegistro();

mostrarVista("vistaInicio");

/* ==========================================================
   BÚSQUEDA AUTOMÁTICA DE PACIENTE POR CÉDULA
========================================================== */

const campoCedula = document.getElementById("cedula");
const campoNombrePaciente = document.getElementById("nombrePaciente");

let temporizadorBusquedaPaciente = null;

if (campoCedula && campoNombrePaciente) {

    campoCedula.addEventListener("input", function () {

        clearTimeout(temporizadorBusquedaPaciente);

        const cedula = campoCedula.value.trim();

        if (!cedula) {
            campoNombrePaciente.value = "";
            campoNombrePaciente.readOnly = false;
            return;
        }

        temporizadorBusquedaPaciente = setTimeout(
            async function () {

                try {

                    const paciente =
                        await buscarPacientePorCedula(cedula);

                    if (paciente) {

                        campoNombrePaciente.value =
                            paciente.nombre;

                        campoNombrePaciente.readOnly = true;

                        console.log(
                            "✅ Paciente encontrado:",
                            paciente
                        );

                    } else {

                        campoNombrePaciente.value = "";
                        campoNombrePaciente.readOnly = false;

                        console.log(
                            "ℹ️ Paciente nuevo. Debe ingresar el nombre."
                        );
                    }

                } catch (error) {

                    campoNombrePaciente.value = "";
                    campoNombrePaciente.readOnly = false;

                    console.error(
                        "❌ No fue posible consultar el paciente:",
                        error
                    );
                }

            },
            600
        );
    });
}

/* ==========================================================
   PRUEBA DE CONEXIÓN CON SUPABASE
========================================================== */

async function probarConexionSupabase() {

    try {

        const { data, error } = await supabaseClient
            .from("listas")
            .select("*")
            .limit(1);

        if (error) {

            console.error(
                "❌ Error de conexión con Supabase:",
                JSON.stringify(error, null, 2)
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

probarConexionSupabase();
