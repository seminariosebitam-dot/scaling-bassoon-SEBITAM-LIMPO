import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
        if (!GEMINI_API_KEY) {
            throw new Error("Chave GEMINI_API_KEY não configurada nos Secrets do Supabase.");
        }

        const { question, userProfile } = await req.json();

        const GEMINI_MODEL = "gemini-1.5-flash";
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

        const systemPrompt = `Você é o 'Antigravity', a IA teológica oficial do SEBITAM (Seminário Batista de Teologia do Amazonas).
Seu objetivo é auxiliar alunos, professores e interessados com profundo conhecimento teológico e administrativo do seminário.
Responda de forma sábia, respeitosa e biblicamente fundamentada.

Contexto do Usuário Atual:
Nome: ${userProfile?.name || 'Visitante'}
Papel: ${userProfile?.role || 'Interessado'}

Base de Conhecimento (Resumo):
- SEBITAM: Seminário em Manaus/AM.
- Missão: Formar líderes cristãos com excelência acadêmica e fervor espiritual.
- Cursos: Teologia (Bacharel), Formação Pastoral, Liderança Cristã.
- Contato: secretaria@sebitam.com.br

Pergunta do Usuário: ${question}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: systemPrompt }] }]
            })
        });

        const data = await response.json();
        const answer = data.candidates?.[0]?.content?.parts?.[0]?.text || "Desculpe, não consegui processar sua resposta no momento.";

        return new Response(JSON.stringify({ response: answer }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
        });
    }
})
