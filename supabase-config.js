// ========================================
// CONFIGURAÇÃO DO SUPABASE
// ========================================
// IMPORTANTE: A chave ANON (pública) é SEGURA para usar no frontend!
// Ela é protegida pelas políticas RLS (Row Level Security) do Supabase.
// NUNCA exponha a SERVICE_ROLE_KEY (chave privada)!

const SUPABASE_CONFIG = {
    // URL do seu projeto Supabase
    url: "https://vwruogwdtbsareighmoc.supabase.co",

    // Chave Anon/Public (SEGURA para frontend)
    // SUBSTITUA pela sua chave real do Supabase Dashboard > Settings > API
    // A chave deve começar com "eyJ..."
    anonKey: "COLE_AQUI_SUA_CHAVE_ANON_DO_SUPABASE"
};

// Não altere abaixo desta linha
if (typeof window !== 'undefined') {
    window.SUPABASE_CONFIG = SUPABASE_CONFIG;
}
