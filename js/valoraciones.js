"use strict";


/* ==========================================================
   SkinTrack UCI
   Módulo de valoraciones
========================================================== */


/* ==========================================================
   NORMALIZACIÓN DE DATOS
========================================================== */

/**
 * Normaliza texto simple.
 *
 * @param {unknown} valor
 * @returns {string}
 */
function normalizarTextoValoracion(valor) {

    return String(valor ?? "")
        .trim()
        .replace(/\s+/g, " ");

}


/**
 * Normaliza nombres propios o responsables.
 *
 * @param {unknown} valor
 * @returns {string}
 */
function normalizarTextoMayuscula(valor) {

    return normalizarTextoValoracion(valor)
        .toUpperCase();

}


/* ==========================================================
   VALIDACIONES CLÍNICAS
========================================================== */

/**
 * Determina si el estado de piel corresponde a una lesión.
 *
 * @param {string} estadoPiel
 * @returns {boolean}
 */
function estadoCorrespondeALesion(
    estadoPiel
) {

    return normalizarTextoValoracion(
        estadoPiel
    ) === "Lesión";

}


/**
 * Valida los datos clínicos antes de guardar.
 *
 * @param {Object} datos
 */
function validarValoracionClinica(datos) {

    if (!datos.ingresoId) {

        throw new Error(
            "Se requiere el identificador del ingreso UCI."
        );

    }

    if (!datos.cama) {

        throw new Error(
            "La cama es obligatoria."
        );

    }

    if (!datos.registradoPor) {

        throw new Error(
            "El responsable del registro es obligatorio."
        );

    }

    if (!datos.riesgo) {

        throw new Error(
            "El riesgo es obligatorio."
        );

    }

    if (!datos.estadoPiel) {

        throw new Error(
            "El estado general de la piel es obligatorio."
        );

    }

    if (
        estadoCorrespondeALesion(
            datos.estadoPiel
        ) &&
        !datos.tipoLesion
    ) {

        throw new Error(
            "El tipo de lesión es obligatorio."
        );

    }

}


/* ==========================================================
   CONSTRUIR REGISTRO
========================================================== */

/**
 * Construye el objeto que se enviará a Supabase.
 *
 * @param {Object} datos
 * @returns {Object}
 */
function construirRegistroValoracion(datos) {

    const hayLesion =
        estadoCorrespondeALesion(
            datos.estadoPiel
        );

    return {

        ingreso_id:
            datos.ingresoId,

        cama:
            normalizarTextoMayuscula(
                datos.cama
            ),

        registrado_por:
            normalizarTextoMayuscula(
                datos.registradoPor
            ),

        riesgo:
            normalizarTextoValoracion(
                datos.riesgo
            ),

        estado_piel:
            normalizarTextoValoracion(
                datos.estadoPiel
            ),

        tipo_lesion:
            hayLesion
                ? normalizarTextoValoracion(
                    datos.tipoLesion
                ) || null
                : null,

        subtipo_lescah:
            hayLesion
                ? normalizarTextoValoracion(
                    datos.subtipoLescah
                ) || null
                : null,

        clasificacion_lesion:
            hayLesion
                ? normalizarTextoValoracion(
                    datos.clasificacionLesion
                ) || null
                : null,

        observaciones:
            normalizarTextoValoracion(
                datos.observaciones
            ) || null

    };

}


/* ==========================================================
   GUARDAR VALORACIÓN
========================================================== */

/**
 * Guarda una valoración asociada a un ingreso UCI.
 *
 * @param {Object} datos
 * @param {string} datos.ingresoId
 * @param {string} datos.cama
 * @param {string} datos.registradoPor
 * @param {string} datos.riesgo
 * @param {string} datos.estadoPiel
 * @param {string} datos.tipoLesion
 * @param {string} datos.subtipoLescah
 * @param {string} datos.clasificacionLesion
 * @param {string} datos.observaciones
 * @returns {Promise<Object>}
 */
async function guardarValoracion({
    ingresoId,
    cama,
    registradoPor,
    riesgo,
    estadoPiel,
    tipoLesion = "",
    subtipoLescah = "",
    clasificacionLesion = "",
    observaciones = ""
}) {

    const datosValoracion = {

        ingresoId,
        cama,
        registradoPor,
        riesgo,
        estadoPiel,
        tipoLesion,
        subtipoLescah,
        clasificacionLesion,
        observaciones

    };

    validarValoracionClinica(
        datosValoracion
    );

    const nuevaValoracion =
        construirRegistroValoracion(
            datosValoracion
        );

    const { data, error } =
        await supabaseClient
            .from("valoraciones")
            .insert(
                nuevaValoracion
            )
            .select(`
                id,
                ingreso_id,
                cama,
                registrado_por,
                riesgo,
                estado_piel,
                tipo_lesion,
                subtipo_lescah,
                clasificacion_lesion,
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


/* ==========================================================
   MÓDULO CARGADO
========================================================== */

console.log(
    "✅ Módulo de valoraciones cargado correctamente"
);
