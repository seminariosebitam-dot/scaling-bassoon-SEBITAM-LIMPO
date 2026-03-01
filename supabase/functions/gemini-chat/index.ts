import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
        if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not found");

        const { question, userProfile } = await req.json();

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

        // Prompt enriquecido com dados do sistema e instruções de personalidade
        const systemPrompt = `Você é o 'Antigravity', a IA teológica oficial do SEBITAM.
Sua missão é auxiliar de forma sábia, técnica e pastoral.

DADOS DO USUÁRIO ATUAL:
- Nome: ${userProfile?.name || 'Visitante'}
- Papel: ${userProfile?.role || 'Interessado'}

INSTRUÇÕES DE RESPOSTA:
1. Sempre cumprimente o usuário pelo nome (${userProfile?.name}) de forma respeitosa (ex: "Paz seja convosco, ${userProfile?.name}!").
2. Se o papel for 'Admin', forneça informações mais detalhadas e técnicas. Se for 'Student', seja mais encorajador e focado no aprendizado.
3. Use HTML básico (<strong>, <ul>, <li>, <p>) para formatar a resposta para o frontend.
4. Base de Dados SEBITAM:
   - Temos 5 Módulos Teológicos: 1 (Fundamentos), 2 (História), 3 (Doutrinas), 4 (Prática), 5 (Liderança).
   - O SEBITAM fica em Manaus/AM.
   - O reitor é o Pr. Luiz Eduardo.
   - O foco é formação pastoral e liderança cristã.

Pergunta do Usuário: ${question}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: systemPrompt }] }]
            })
        });

        const data = await response.json();
        const answer = data.candidates?.[0]?.content?.parts?.[0]?.text || "Não consegui processar sua resposta teológica agora.";

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
