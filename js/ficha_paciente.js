"use strict";


/* ==========================================================
   SkinTrack UCI
   Módulo de ficha del paciente
========================================================== */


/* ==========================================================
   PACIENTE E INGRESO SELECCIONADOS
========================================================== */

let ingresoPacienteSeleccionado = null;


/* ==========================================================
   UTILIDADES
========================================================== */

/**
 * Formatea una fecha para mostrarla al usuario.
 *
 * @param {string|null} fechaISO
 * @returns {string}
 */
function formatearFechaPaciente(fechaISO) {

    if (!fechaISO) {
        return "Sin fecha";
    }

    const fecha = new Date(fechaISO);

    if (Number.isNaN(fecha.getTime())) {
        return "Sin fecha";
    }

    return fecha.toLocaleDateString(
        "es-CO",
        {
            day: "2-digit",
            month: "long",
            year: "numeric"
        }
    );
}


/* ==========================================================
   MOSTRAR INFORMACIÓN DEL PACIENTE
========================================================== */

/**
 * Llena la ficha con la información del ingreso seleccionado.
 *
 * @param {Object} ingreso
 */
function mostrarDatosFichaPaciente(ingreso) {

    const paciente =
        ingreso?.pacientes || {};

    const elementoNombre =
        document.getElementById(
            "detalleNombrePaciente"
        );

    const elementoEstado =
        document.getElementById(
            "detalleEstadoPaciente"
        );

    const elementoCama =
        document.getElementById(
            "detalleCamaPaciente"
        );

    const elementoCedula =
        document.getElementById(
            "detalleCedulaPaciente"
        );

    const elementoIngreso =
        document.getElementById(
            "detalleFechaIngreso"
        );

    if (elementoNombre) {

        elementoNombre.textContent =
            paciente.nombre ||
            "Paciente sin nombre";

    }

    if (elementoCama) {

        elementoCama.textContent =
            ingreso.cama || "Sin cama";

    }

    if (elementoCedula) {

        elementoCedula.textContent =
            paciente.cedula || "Sin dato";

    }

    if (elementoIngreso) {

        elementoIngreso.textContent =
            formatearFechaPaciente(
                ingreso.fecha_ingreso
            );

    }

    if (elementoEstado) {

        const valoradoHoy =
            Boolean(
                ingreso.valoradoHoy
            );

        elementoEstado.textContent =
            valoradoHoy
                ? "Valorado hoy"
                : "Pendiente de valoración";

        elementoEstado.className =
            valoradoHoy
                ? "patient-detail-status completed"
                : "patient-detail-status pending";

    }

}


/* ==========================================================
   ABRIR FICHA
========================================================== */

/**
 * Conserva el ingreso seleccionado y abre su ficha.
 *
 * @param {Object} ingreso
 */
function abrirFichaPaciente(ingreso) {

    if (!ingreso?.id) {

        console.error(
            "❌ No se recibió un ingreso válido."
        );

        return;
    }

    ingresoPacienteSeleccionado =
        ingreso;

    mostrarDatosFichaPaciente(
        ingresoPacienteSeleccionado
    );

    mostrarVista(
        "vistaDetallePaciente"
    );

    console.log(
        "✅ Ficha del paciente abierta:",
        ingresoPacienteSeleccionado
    );

}


/* ==========================================================
   SELECCIÓN DESDE LA LISTA DE PACIENTES
========================================================== */

const listaPacientesActivos =
    document.getElementById(
        "listaPacientes"
    );

if (listaPacientesActivos) {

    listaPacientesActivos.addEventListener(
        "click",
        function (event) {

            const tarjeta =
                event.target.closest(
                    "[data-ingreso-id]"
                );

            if (!tarjeta) {
                return;
            }

            const ingresoId =
                tarjeta.dataset.ingresoId;

            const ingreso =
                pacientesActivosEnMemoria.find(
                    (item) =>
                        String(item.id) ===
                        String(ingresoId)
                );

            if (!ingreso) {

                console.error(
                    "❌ No se encontró el ingreso seleccionado."
                );

                return;
            }

            abrirFichaPaciente(
                ingreso
            );

        }
    );

}


/* ==========================================================
   ACCIONES DE LA FICHA
========================================================== */

const botonRealizarValoracion =
    document.getElementById(
        "btnRealizarValoracionPaciente"
    );

const botonHistorial =
    document.getElementById(
        "btnHistorialPaciente"
    );

const botonEgreso =
    document.getElementById(
        "btnEgresoPaciente"
    );


if (botonRealizarValoracion) {

    botonRealizarValoracion.addEventListener(
        "click",
        function () {

            if (!ingresoPacienteSeleccionado?.id) {

                mostrarNotificacion(
                    "Seleccione primero un paciente"
                );

                return;

            }

            abrirValoracionDesdeFicha(
                ingresoPacienteSeleccionado
            );

            mostrarNotificacion(
                "Paciente seleccionado para valoración"
            );

            console.log(
                "✅ Paciente preparado para valoración:",
                ingresoPacienteSeleccionado
            );

        }
    );

}


if (botonHistorial) {

    botonHistorial.addEventListener(
        "click",
        async function () {

            if (!ingresoPacienteSeleccionado?.id) {

                mostrarNotificacion(
                    "Seleccione primero un paciente"
                );

                return;

            }

            await abrirHistorialPaciente(
                ingresoPacienteSeleccionado
            );

        }
    );

}


if (botonEgreso) {

    botonEgreso.addEventListener(
        "click",
        async function () {

            if (!ingresoPacienteSeleccionado?.id) {

                mostrarNotificacion(
                    "Seleccione primero un paciente."
                );

                return;

            }

            const confirmar = confirm(
                "¿Está seguro de dar egreso a este paciente?\n\n" +
                "El paciente dejará de aparecer como ACTIVO, " +
                "pero conservará todo su historial clínico."
            );

            if (!confirmar) {
                return;
            }

            try {

                await darEgresoIngresoUCI(
                    ingresoPacienteSeleccionado.id
                );

                mostrarNotificacion(
                    "Paciente egresado correctamente."
                );

                ingresoPacienteSeleccionado = null;

                /*
                 * Recargar pacientes activos
                 */
                if (typeof cargarPacientesActivos === "function") {
                    await cargarPacientesActivos();
                }

                /*
                 * Actualizar dashboard
                 */
                if (typeof actualizarResumenInicio === "function") {
                    await actualizarResumenInicio();
                }

                /*
                 * Volver a la lista de pacientes
                 */
                mostrarVista("vistaPacientes");

            } catch (error) {

                console.error(
                    "❌ Error al dar egreso:",
                    error
                );

                mostrarNotificacion(
                    error.message ||
                    "No fue posible registrar el egreso."
                );

            }

        }
    );

}


/* ==========================================================
   MÓDULO CARGADO
========================================================== */

console.log(
    "✅ Módulo de ficha del paciente cargado correctamente"
);
