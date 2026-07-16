/* ==========================================================
   SkinTrack UCI
   Módulo de valoraciones
========================================================== */


/**
 * Convierte el valor del formulario a booleano.
 *
 * @param {string|boolean} valor
 * @returns {boolean}
 */
function convertirPresentaLesionABooleano(valor) {

    if (typeof valor === "boolean") {
        return valor;
    }

    const valorNormalizado =
        String(valor || "")
            .trim()
            .toLowerCase();

    if (valorNormalizado === "sí" ||
        valorNormalizado === "si" ||
        valorNormalizado === "true") {

        return true;
    }

    if (valorNormalizado === "no" ||
        valorNormalizado === "false") {

        return false;
    }

    throw new Error(
        "El valor de presenta lesión no es válido."
    );
}


/**
 * Guarda una valoración asociada a un ingreso UCI.
 *
 * @param {Object} datos
 * @param {string} datos.ingresoId
 * @param {string} datos.cama
 * @param {string} datos.registradoPor
 * @param {string} datos.estadoPiel
 * @param {string} datos.complejidad
 * @param {string|boolean} datos.presentaLesion
 * @param {string} datos.observaciones
 * @returns {Promise<Object>}
 */
async function guardarValoracion({
    ingresoId,
    cama,
    registradoPor,
    estadoPiel,
    complejidad,
    presentaLesion,
    observaciones
}) {

    if (!ingresoId) {
        throw new Error(
            "Se requiere el identificador del ingreso UCI."
        );
    }

    if (!cama) {
        throw new Error(
            "La cama es obligatoria."
        );
    }

    if (!registradoPor) {
        throw new Error(
            "El responsable del registro es obligatorio."
        );
    }

    if (!estadoPiel) {
        throw new Error(
            "El estado de la piel es obligatorio."
        );
    }

    if (!complejidad) {
        throw new Error(
            "La complejidad es obligatoria."
        );
    }

    const nuevaValoracion = {

        ingreso_id:
            ingresoId,

        cama:
            String(cama).trim().toUpperCase(),

        registrado_por:
            String(registradoPor)
                .trim()
                .replace(/\s+/g, " ")
                .toUpperCase(),

        estado_piel:
            String(estadoPiel).trim(),

        complejidad:
            String(complejidad).trim(),

        presenta_lesion:
            convertirPresentaLesionABooleano(
                presentaLesion
            ),

        observaciones:
            String(observaciones || "").trim() || null
    };

    const { data, error } = await supabaseClient
        .from("valoraciones")
        .insert(nuevaValoracion)
        .select(`
            id,
            ingreso_id,
            cama,
            registrado_por,
            estado_piel,
            complejidad,
            presenta_lesion,
            observaciones,
            fecha_hora_registro
        `)
        .single();

    if (error) {

        console.error(
            "❌ Error al guardar la valoración:",
            error
        );

        throw new Error(
            "No fue posible guardar la valoración."
        );
    }

    console.log(
        "✅ Valoración registrada:",
        data
    );

    return data;
}


console.log(
    "✅ Módulo de valoraciones cargado correctamente"
);
