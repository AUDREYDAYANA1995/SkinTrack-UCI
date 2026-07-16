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

/* ==========================================================
   LISTADO DE PACIENTES ACTIVOS
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
        .order("cama", {
            ascending: true
        });

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


/**
 * Construye la lista visual de pacientes activos.
 */
async function cargarPacientesActivos() {

    const contenedor =
        document.getElementById("listaPacientes");

    if (!contenedor) {
        return;
    }

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

        if (ingresosActivos.length === 0) {

            contenedor.className =
                "empty-state";

            contenedor.innerHTML = `
                <div class="empty-icon">P</div>

                <h3>No hay pacientes activos</h3>

                <p>
                    Los pacientes con ingreso activo
                    aparecerán aquí.
                </p>
            `;

            return;
        }

        contenedor.className =
            "patients-list";

        contenedor.innerHTML =
            ingresosActivos
                .map((ingreso) => {

                    const paciente =
                        ingreso.pacientes || {};

                    const valoradoHoy =
                        ingresosValoradosHoy.has(
                            ingreso.id
                        );

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

                    return `
                        <article class="patient-card">

                            <div class="patient-card-header">

                                <div>
                                    <span class="patient-bed">
                                        Cama ${ingreso.cama || "—"}
                                    </span>

                                    <h3>
                                        ${paciente.nombre || "Sin nombre"}
                                    </h3>
                                </div>

                                <span class="
                                    patient-status
                                    ${valoradoHoy
                                        ? "completed"
                                        : "pending"}
                                ">
                                    ${valoradoHoy
                                        ? "Valorado hoy"
                                        : "Pendiente"}
                                </span>

                            </div>

                            <div class="patient-card-data">

                                <p>
                                    <strong>Cédula:</strong>
                                    ${paciente.cedula || "Sin dato"}
                                </p>

                                <p>
                                    <strong>Ingreso:</strong>
                                    ${fechaIngreso}
                                </p>

                            </div>

                        </article>
                    `;

                })
                .join("");

        console.log(
            "✅ Pacientes activos cargados:",
            ingresosActivos.length
        );

    } catch (error) {

        console.error(
            "❌ No fue posible cargar los pacientes activos:",
            error
        );

        contenedor.className =
            "empty-state";

        contenedor.innerHTML = `
            <div class="empty-icon">!</div>

            <h3>No fue posible cargar los pacientes</h3>

            <p>
                Intente nuevamente en unos segundos.
            </p>
        `;
    }
}

console.log(
    "✅ Módulo de dashboard cargado correctamente"
);
