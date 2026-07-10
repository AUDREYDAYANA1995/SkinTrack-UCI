/* ==========================================================
   SkinTrack UCI
   Módulo de pacientes
========================================================== */


/**
 * Normaliza una cédula eliminando espacios.
 *
 * @param {string} cedula
 * @returns {string}
 */
function normalizarCedula(cedula) {
    return String(cedula || "").trim();
}


/**
 * Normaliza el nombre del paciente.
 *
 * @param {string} nombre
 * @returns {string}
 */
function normalizarNombrePaciente(nombre) {
    return String(nombre || "")
        .trim()
        .replace(/\s+/g, " ")
        .toUpperCase();
}


/**
 * Busca un paciente por número de cédula.
 *
 * @param {string} cedula
 * @returns {Promise<Object|null>}
 */
async function buscarPacientePorCedula(cedula) {

    const cedulaNormalizada = normalizarCedula(cedula);

    if (!cedulaNormalizada) {
        throw new Error("La cédula es obligatoria.");
    }

    const { data, error } = await supabaseClient
        .from("pacientes")
        .select("id, cedula, nombre")
        .eq("cedula", cedulaNormalizada)
        .maybeSingle();

    if (error) {
        console.error(
            "❌ Error al buscar el paciente:",
            error
        );

        throw new Error(
            "No fue posible consultar el paciente."
        );
    }

    return data;
}


/**
 * Crea un paciente nuevo.
 *
 * @param {Object} paciente
 * @param {string} paciente.cedula
 * @param {string} paciente.nombre
 * @returns {Promise<Object>}
 */
async function crearPaciente({ cedula, nombre }) {

    const cedulaNormalizada = normalizarCedula(cedula);
    const nombreNormalizado =
        normalizarNombrePaciente(nombre);

    if (!cedulaNormalizada) {
        throw new Error("La cédula es obligatoria.");
    }

    if (!nombreNormalizado) {
        throw new Error(
            "El nombre del paciente es obligatorio."
        );
    }

    /*
     * Verificar nuevamente antes de insertar para evitar
     * duplicados cuando dos personas registren al mismo tiempo.
     */
    const pacienteExistente =
        await buscarPacientePorCedula(
            cedulaNormalizada
        );

    if (pacienteExistente) {
        return pacienteExistente;
    }

    const { data, error } = await supabaseClient
        .from("pacientes")
        .insert({
            cedula: cedulaNormalizada,
            nombre: nombreNormalizado
        })
        .select("id, cedula, nombre")
        .single();

    if (error) {
        console.error(
            "❌ Error al crear el paciente:",
            error
        );

        throw new Error(
            "No fue posible registrar el paciente."
        );
    }

    console.log(
        "✅ Paciente registrado:",
        data
    );

    return data;
}


/**
 * Obtiene el paciente existente o lo crea si no existe.
 *
 * @param {Object} datosPaciente
 * @param {string} datosPaciente.cedula
 * @param {string} datosPaciente.nombre
 * @returns {Promise<Object>}
 */
async function obtenerOCrearPaciente({
    cedula,
    nombre
}) {

    const pacienteExistente =
        await buscarPacientePorCedula(cedula);

    if (pacienteExistente) {
        console.log(
            "✅ Paciente existente encontrado:",
            pacienteExistente
        );

        return pacienteExistente;
    }

    return await crearPaciente({
        cedula,
        nombre
    });
}


console.log(
    "✅ Módulo de pacientes cargado correctamente"
);
