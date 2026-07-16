/* ==========================================================
   SkinTrack UCI
   Módulo de dashboard
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


/**
 * Consulta los ingresos UCI activos.
 *
 * @returns {Promise<Array>}
 */
async function obtenerIngresosActivos() {

    const { data, error } = await supabaseClient
        .from("ingresos_uci")
        .select("id, paciente_id, cama")
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
        .select("id, ingreso_id, fecha_hora_registro")
        .gte("fecha_hora_registro", inicioDia)
        .lte("fecha_hora_registro", finDia);

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


/**
 * Actualiza los tres indicadores principales del inicio.
 */
async function actualizarResumenInicio() {

    const elementoPacientes =
        document.getElementById("totalPacientes");

    const elementoValorados =
        document.getElementById("totalValorados");

    const elementoPendientes =
        document.getElementById("totalPendientes");

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
                totalPacientes - totalValorados,
                0
            );

        if (elementoPacientes) {
            elementoPacientes.textContent =
                totalPacientes;
        }

        if (elementoValorados) {
            elementoValorados.textContent =
                totalValorados;
        }

        if (elementoPendientes) {
            elementoPendientes.textContent =
                totalPendientes;
        }

        console.log(
            "✅ Resumen de inicio actualizado:",
            {
                totalPacientes,
                totalValorados,
                totalPendientes
            }
        );

        return {
            totalPacientes,
            totalValorados,
            totalPendientes
        };

    } catch (error) {

        console.error(
            "❌ No fue posible actualizar el resumen:",
            error
        );

        return {
            totalPacientes: 0,
            totalValorados: 0,
            totalPendientes: 0
        };
    }
}


console.log(
    "✅ Módulo de dashboard cargado correctamente"
);
