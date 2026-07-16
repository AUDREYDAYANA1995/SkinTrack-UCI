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
   CARGAR CUALQUIER LISTA EN UN SELECT
========================================================== */

/**
 * Llena un select con los valores de una lista de Supabase.
 *
 * @param {string} tipo
 * @param {string} idSelect
 * @param {string} textoInicial
 * @returns {Promise<Array>}
 */
async function cargarLista(
    tipo,
    idSelect,
    textoInicial = "Seleccione una opción"
) {

    const selector =
        document.getElementById(idSelect);

    if (!selector) {

        console.warn(
            `⚠️ No se encontró el selector: ${idSelect}`
        );

        return [];
    }

    selector.disabled = true;

    selector.innerHTML = `
        <option value="">
            Cargando opciones...
        </option>
    `;

    try {

        const lista =
            await obtenerListaPorTipo(tipo);

        if (lista.length === 0) {

            selector.innerHTML = `
                <option value="">
                    No hay opciones disponibles
                </option>
            `;

            console.warn(
                `⚠️ No se encontraron opciones activas para ${tipo}.`
            );

            return [];
        }

        selector.innerHTML = `
            <option value="">
                ${textoInicial}
            </option>
        `;

        lista.forEach((item) => {

            const opcion =
                document.createElement("option");

            opcion.value =
                item.valor;

            opcion.textContent =
                item.valor;

            selector.appendChild(opcion);

        });

        selector.disabled = false;

        console.log(
            `✅ ${tipo} cargado correctamente:`,
            lista.length
        );

        return lista;

    } catch (error) {

        console.error(
            `❌ No fue posible cargar ${tipo}:`,
            error
        );

        selector.innerHTML = `
            <option value="">
                Error al cargar las opciones
            </option>
        `;

        selector.disabled = true;

        return [];
    }

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
 *
 * @returns {Promise<Array>}
 */
async function cargarCamas() {

    const selectorCama =
        document.getElementById("cama");

    if (!selectorCama) {

        console.warn(
            "⚠️ No se encontró el selector de camas."
        );

        return [];
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

            return [];
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

        return camas;

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

        return [];
    }

}


/* ==========================================================
   CARGAR CATÁLOGOS PRINCIPALES DEL FORMULARIO
========================================================== */

/**
 * Carga los catálogos visibles inicialmente.
 */
async function cargarCatalogosFormulario() {

    const resultados =
        await Promise.all([

            cargarLista(
                "RIESGO",
                "riesgo",
                "Seleccione el riesgo"
            ),

            cargarLista(
                "ESTADO_PIEL",
                "estadoPiel",
                "Seleccione el estado de la piel"
            )

        ]);

    console.log(
        "✅ Catálogos principales del formulario cargados"
    );

    return resultados;
}


/* ==========================================================
   CARGAR TIPOS DE LESIÓN
========================================================== */

/**
 * Carga el catálogo de tipos de lesión.
 */
async function cargarTiposLesion() {

    return await cargarLista(
        "TIPO_LESION",
        "tipoLesion",
        "Seleccione un tipo de lesión"
    );

}


/* ==========================================================
   CARGAR SUBTIPOS LESCAH
========================================================== */

/**
 * Carga el catálogo de subtipos LESCAH.
 */
async function cargarSubtiposLescah() {

    return await cargarLista(
        "SUBTIPO_LESCAH",
        "subtipoLescah",
        "Seleccione una clasificación LESCAH"
    );

}


/* ==========================================================
   CARGAR CLASIFICACIÓN SEGÚN EL TIPO DE LESIÓN
========================================================== */

/**
 * Carga la clasificación correspondiente.
 *
 * @param {string} tipoLista
 * @param {string} textoInicial
 */
async function cargarClasificacionLesion(
    tipoLista,
    textoInicial = "Seleccione una clasificación"
) {

    return await cargarLista(
        tipoLista,
        "clasificacionLesion",
        textoInicial
    );

}


/* ==========================================================
   LIMPIAR UN SELECT
========================================================== */

/**
 * Limpia y deshabilita un select.
 *
 * @param {string} idSelect
 * @param {string} texto
 */
function limpiarSelector(
    idSelect,
    texto = "Seleccione una opción"
) {

    const selector =
        document.getElementById(idSelect);

    if (!selector) {
        return;
    }

    selector.innerHTML = `
        <option value="">
            ${texto}
        </option>
    `;

    selector.disabled = true;

}


/* ==========================================================
   MOSTRAR U OCULTAR GRUPOS DEL FORMULARIO
========================================================== */

/**
 * Muestra un grupo del formulario.
 *
 * @param {string} idGrupo
 */
function mostrarGrupo(idGrupo) {

    const grupo =
        document.getElementById(idGrupo);

    if (!grupo) {
        return;
    }

    grupo.hidden = false;

}


/**
 * Oculta un grupo del formulario.
 *
 * @param {string} idGrupo
 */
function ocultarGrupo(idGrupo) {

    const grupo =
        document.getElementById(idGrupo);

    if (!grupo) {
        return;
    }

    grupo.hidden = true;

}


/* ==========================================================
   REINICIAR CAMPOS DINÁMICOS DE LESIONES
========================================================== */

/**
 * Oculta y reinicia todos los campos condicionales.
 */
function reiniciarCamposLesion() {

    ocultarGrupo(
        "grupoTipoLesion"
    );

    ocultarGrupo(
        "grupoSubtipoLescah"
    );

    ocultarGrupo(
        "grupoClasificacionLesion"
    );

    limpiarSelector(
        "tipoLesion",
        "Seleccione un tipo de lesión"
    );

    limpiarSelector(
        "subtipoLescah",
        "Seleccione una clasificación LESCAH"
    );

    limpiarSelector(
        "clasificacionLesion",
        "Seleccione una clasificación"
    );

}


/* ==========================================================
   MÓDULO CARGADO
========================================================== */

console.log(
    "✅ Módulo de listas cargado correctamente"
);
