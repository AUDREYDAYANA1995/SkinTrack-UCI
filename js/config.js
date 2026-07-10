/* ==========================================================
   SkinTrack UCI
   Configuración de Supabase
========================================================== */

const SUPABASE_URL =
    "https://wjjcmxtkrzqzvgiddmne.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_xVe5EQRUYyoj9npCfrbrsQ_htzGd-I0";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);

console.log("✅ Cliente de Supabase creado correctamente");