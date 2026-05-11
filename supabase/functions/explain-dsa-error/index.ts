import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { problem, language, code, results, status } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    const failing = (results || []).filter((r: any) => r.status !== "passed").slice(0, 3);
    const prompt = `Problem: ${problem.title}\n${problem.statement}\n\nLanguage: ${language}\nSubmission status: ${status}\nFailing cases (sample):\n${JSON.stringify(failing, null, 2)}\n\nUser code:\n\`\`\`${language}\n${code}\n\`\`\`\n\nGive a concise, friendly explanation (max 6 short bullets) of what's wrong and how to fix it. Mention algorithmic improvements only if relevant.`;

    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a friendly DSA coach. Be concise, kind, and actionable." },
          { role: "user", content: prompt },
        ],
      }),
    });
    if (!r.ok) {
      return new Response(JSON.stringify({ feedback: "Couldn't generate AI feedback right now." }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const data = await r.json();
    const feedback = data.choices?.[0]?.message?.content || "";
    return new Response(JSON.stringify({ feedback }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ feedback: "AI feedback unavailable." }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
