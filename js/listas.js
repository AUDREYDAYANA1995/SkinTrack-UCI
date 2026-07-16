"use strict";


/* ==========================================================
   SkinTrack UCI
   Módulo de listas y catálogos
========================================================== */


/* ==========================================================
   CONSULTAR LISTA DESDE SUPABASE
========================================================== */

/**
 * Consulta una lista activa por tipo.
 *
 * @param {string} tipo
 * @returns {Promise<Array>}
 */
async function obtenerListaPorTipo(tipo) {

    const tipoNormalizado =
        String(tipo || "")
            .trim()
            .toUpperCase();

    if (!tipoNormalizado) {

        throw new Error(
            "El tipo de lista es obligatorio."
        );

    }

    const { data, error } = await supabaseClient
        .from("listas")
        .select(`
            id,
            tipo,
            valor,
            orden,
            activo
        `)
        .eq("tipo", tipoNormalizado)
        .eq("activo", true)
        .order("orden", {
            ascending: true
        });

    if (error) {

        console.error(
            `❌ Error al consultar la lista ${tipoNormalizado}:`,
            error
        );

        throw new Error(
            `No fue posible cargar la lista ${tipoNormalizado}.`
        );

    }

    return data || [];
}


/* ==========================================================
   DETERMINAR EL ÁREA DE UNA CAMA
========================================================== */

/**
 * Determina el grupo visual de una cama.
 *
 * @param {string} cama
 * @returns {string}
 */
function obtenerAreaDeCama(cama) {

    const valor =
        String(cama || "")
            .trim()
            .toUpperCase();

    if (valor.startsWith("U3")) {
        return "Área 300";
    }

    if (valor.startsWith("U4")) {
        return "Área 400";
    }

    if (valor.startsWith("800")) {
        return "Área 8000";
    }

    return "Otras camas";
}


/* ==========================================================
   CREAR GRUPOS DE CAMAS
========================================================== */

/**
 * Agrupa las camas por área.
 *
 * @param {Array} camas
 * @returns {Object}
 */
function agruparCamasPorArea(camas) {

    return camas.reduce(
        (grupos, item) => {

            const area =
                obtenerAreaDeCama(
                    item.valor
                );

            if (!grupos[area]) {
                grupos[area] = [];
            }

            grupos[area].push(item);

            return grupos;

        },
        {}
    );

}


/* ==========================================================
   CARGAR CAMAS EN EL SELECT
========================================================== */

/**
 * Llena el selector de camas con datos de Supabase.
 */
async function cargarCamas() {

    const selectorCama =
        document.getElementById("cama");

    if (!selectorCama) {

        console.warn(
            "⚠️ No se encontró el selector de camas."
        );

        return;

    }

    selectorCama.disabled = true;

    selectorCama.innerHTML = `
        <option value="">
            Cargando camas...
        </option>
    `;

    try {

        const camas =
            await obtenerListaPorTipo(
                "CAMA"
            );

        if (camas.length === 0) {

            selectorCama.innerHTML = `
                <option value="">
                    No hay camas disponibles
                </option>
            `;

            console.warn(
                "⚠️ No se encontraron camas activas."
            );

            return;

        }

        const camasAgrupadas =
            agruparCamasPorArea(
                camas
            );

        selectorCama.innerHTML = `
            <option value="">
                Seleccione una cama
            </option>
        `;

        const ordenAreas = [
            "Área 300",
            "Área 400",
            "Área 8000",
            "Otras camas"
        ];

        ordenAreas.forEach((area) => {

            const camasDelArea =
                camasAgrupadas[area];

            if (
                !camasDelArea ||
                camasDelArea.length === 0
            ) {
                return;
            }

            const grupo =
                document.createElement(
                    "optgroup"
                );

            grupo.label = area;

            camasDelArea.forEach(
                (item) => {

                    const opcion =
                        document.createElement(
                            "option"
                        );

                    opcion.value =
                        item.valor;

                    opcion.textContent =
                        item.valor;

                    grupo.appendChild(
                        opcion
                    );

                }
            );

            selectorCama.appendChild(
                grupo
            );

        });

        selectorCama.disabled = false;

        console.log(
            "✅ Camas cargadas correctamente:",
            camas.length
        );

    } catch (error) {

        console.error(
            "❌ No fue posible cargar las camas:",
            error
        );

        selectorCama.innerHTML = `
            <option value="">
                Error al cargar las camas
            </option>
        `;

        selectorCama.disabled = true;

    }

}


/* ==========================================================
   MÓDULO CARGADO
========================================================== */

console.log(
    "✅ Módulo de listas cargado correctamente"
);
