"use strict";


/* ==========================================================
   SkinTrack UCI
   Módulo de valoraciones
========================================================== */
/* ==========================================================
   ESTADO DE EDICIÓN
========================================================== */

let valoracionEnEdicionId = null;


/**
 * Activa el modo edición para una valoración.
 *
 * @param {string} valoracionId
 */
function iniciarEdicionValoracion(
    valoracionId
) {

    const idNormalizado =
        normalizarTextoValoracion(
            valoracionId
        );

    if (!idNormalizado) {

        throw new Error(
            "No se recibió el identificador de la valoración."
        );

    }

    valoracionEnEdicionId =
        idNormalizado;

    console.log(
        "✏️ Modo edición activado:",
        valoracionEnEdicionId
    );

}


/**
 * Finaliza el modo edición.
 */
function finalizarEdicionValoracion() {

    valoracionEnEdicionId = null;

    console.log(
        "✅ Modo edición finalizado"
    );

}


/**
 * Obtiene el identificador de la valoración en edición.
 *
 * @returns {string|null}
 */
function obtenerValoracionEnEdicionId() {

    return valoracionEnEdicionId;

}


/**
 * Indica si existe una valoración en edición.
 *
 * @returns {boolean}
 */
function estaEditandoValoracion() {

    return Boolean(
        valoracionEnEdicionId
    );

}

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


/**
 * Convierte cualquier valor compatible a booleano.
 *
 * @param {unknown} valor
 * @returns {boolean}
 */
function normalizarBooleano(valor) {

    if (typeof valor === "boolean") {
        return valor;
    }

    const valorNormalizado =
        String(valor ?? "")
            .trim()
            .toLowerCase();

    return [
        "true",
        "1",
        "sí",
        "si",
        "yes"
    ].includes(valorNormalizado);

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
 * Determina si se seleccionó al menos una medida preventiva.
 *
 * @param {Object} datos
 * @returns {boolean}
 */
function tieneMedidaPreventiva(datos) {

    return Boolean(
        datos.cambioPosicion ||
        datos.acidosGrasosHiperoxigenados ||
        datos.apositoLiberacion ||
        datos.barreraProteccion ||
        datos.toallasRemovedoras
    );

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

    if (!tieneMedidaPreventiva(datos)) {

        throw new Error(
            "Debe seleccionar al menos una medida preventiva."
        );

    }

    if (
        !["Sí", "No"].includes(
            normalizarTextoValoracion(
                datos.usoPanal
            )
        )
    ) {

        throw new Error(
            "Debe indicar si el paciente usa pañal."
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

        cambio_posicion:
            normalizarBooleano(
                datos.cambioPosicion
            ),

        acidos_grasos_hiperoxigenados:
            normalizarBooleano(
                datos.acidosGrasosHiperoxigenados
            ),

        aposito_liberacion:
            normalizarBooleano(
                datos.apositoLiberacion
            ),

        barrera_proteccion:
            normalizarBooleano(
                datos.barreraProteccion
            ),

        toallas_removedoras:
            normalizarBooleano(
                datos.toallasRemovedoras
            ),

        uso_panal:
            normalizarTextoValoracion(
                datos.usoPanal
            ),

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
 * @param {boolean} datos.cambioPosicion
 * @param {boolean} datos.acidosGrasosHiperoxigenados
 * @param {boolean} datos.apositoLiberacion
 * @param {boolean} datos.barreraProteccion
 * @param {boolean} datos.toallasRemovedoras
 * @param {string} datos.usoPanal
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
    cambioPosicion = false,
    acidosGrasosHiperoxigenados = false,
    apositoLiberacion = false,
    barreraProteccion = false,
    toallasRemovedoras = false,
    usoPanal = "",
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
        cambioPosicion,
        acidosGrasosHiperoxigenados,
        apositoLiberacion,
        barreraProteccion,
        toallasRemovedoras,
        usoPanal,
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
                cambio_posicion,
                acidos_grasos_hiperoxigenados,
                aposito_liberacion,
                barrera_proteccion,
                toallas_removedoras,
                uso_panal,
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
            error.message ||
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
