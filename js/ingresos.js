/* ==========================================================
   SkinTrack UCI
   Módulo de ingresos UCI
========================================================== */


/**
 * Normaliza el número o nombre de la cama.
 *
 * @param {string} cama
 * @returns {string}
 */
function normalizarCama(cama) {

    return String(cama || "")
        .trim()
        .replace(/\s+/g, " ")
        .toUpperCase();
}


/**
 * Busca el ingreso activo de un paciente.
 *
 * Un ingreso se considera activo cuando:
 * - pertenece al paciente indicado;
 * - su estado es "activo";
 * - no tiene fecha de egreso.
 *
 * @param {string} pacienteId
 * @returns {Promise<Object|null>}
 */
async function buscarIngresoActivo(pacienteId) {

    if (!pacienteId) {
        throw new Error(
            "Se requiere el identificador del paciente."
        );
    }

    const { data, error } = await supabaseClient
        .from("ingresos_uci")
        .select(`
            id,
            paciente_id,
            cama,
            fecha_ingreso,
            fecha_egreso,
            estado
        `)
        .eq("paciente_id", pacienteId)
        .eq("estado", "ACTIVO")
        .is("fecha_egreso", null)
        .order("fecha_ingreso", {
            ascending: false
        })
        .limit(1)
        .maybeSingle();

    if (error) {

        console.error(
            "❌ Error al buscar el ingreso activo:",
            error
        );

        throw new Error(
            "No fue posible consultar el ingreso UCI."
        );
    }

    return data;
}


/**
 * Crea un ingreso nuevo en UCI.
 *
 * @param {Object} datos
 * @param {string} datos.pacienteId
 * @param {string} datos.cama
 * @returns {Promise<Object>}
 */
async function crearIngresoUCI({
    pacienteId,
    cama
}) {

    if (!pacienteId) {
        throw new Error(
            "Se requiere el identificador del paciente."
        );
    }

    const camaNormalizada = normalizarCama(cama);

    if (!camaNormalizada) {
        throw new Error(
            "El número de cama es obligatorio."
        );
    }

    /*
     * Se vuelve a consultar para reducir el riesgo
     * de crear dos ingresos activos simultáneos.
     */
    const ingresoExistente =
        await buscarIngresoActivo(pacienteId);

    if (ingresoExistente) {
        return ingresoExistente;
    }

    const nuevoIngreso = {

    paciente_id: pacienteId,
    cama: camaNormalizada,
    fecha_ingreso: new Date().toISOString(),
    fecha_egreso: null,
    estado: "ACTIVO"

};

    const { data, error } = await supabaseClient
        .from("ingresos_uci")
        .insert(nuevoIngreso)
        .select(`
            id,
            paciente_id,
            cama,
            fecha_ingreso,
            fecha_egreso,
            estado
        `)
        .single();

    if (error) {

        console.error(
            "❌ Error al crear el ingreso UCI:",
            error
        );

        throw new Error(
            "No fue posible registrar el ingreso UCI."
        );
    }

    console.log(
        "✅ Ingreso UCI registrado:",
        data
    );

    return data;
}


/**
 * Obtiene el ingreso activo del paciente o crea uno nuevo.
 *
 * @param {Object} datos
 * @param {string} datos.pacienteId
 * @param {string} datos.cama
 * @returns {Promise<Object>}
 */
async function obtenerOCrearIngresoUCI({
    pacienteId,
    cama
}) {

    const ingresoActivo =
        await buscarIngresoActivo(pacienteId);

    if (ingresoActivo) {

        console.log(
            "✅ Ingreso UCI activo encontrado:",
            ingresoActivo
        );

        /*
         * Por ahora se conserva la cama registrada en el ingreso.
         * Más adelante implementaremos traslados de cama.
         */
        return ingresoActivo;
    }

    return await crearIngresoUCI({
        pacienteId,
        cama
    });
}


console.log(
    "✅ Módulo de ingresos UCI cargado correctamente"
);
