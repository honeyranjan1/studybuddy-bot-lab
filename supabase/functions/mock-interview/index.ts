import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

async function callAI(messages: any[], opts: { json?: boolean } = {}) {
  const res = await fetch(GATEWAY, {
    method: "POST",
    headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages,
      ...(opts.json ? { response_format: { type: "json_object" } } : {}),
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`AI error ${res.status}: ${t}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const body = await req.json();
    const { action } = body;

    if (action === "start") {
      const { role, topic, difficulty, numQuestions = 5 } = body;
      const prompt = `You are an experienced technical interviewer. Generate ${numQuestions} interview questions for a ${difficulty} level candidate applying for a ${role} role, focused on: ${topic}.
Mix behavioral, conceptual, and problem-solving questions. Return STRICT JSON:
{"questions":[{"id":1,"question":"...","type":"conceptual|behavioral|problem-solving","expected_points":["key point 1","key point 2","key point 3"]}]}`;
      const raw = await callAI([{ role: "user", content: prompt }], { json: true });
      const parsed = JSON.parse(raw);
      return Response.json(parsed, { headers: corsHeaders });
    }

    if (action === "feedback") {
      const { question, expected_points, answer, role } = body;
      const prompt = `You are a strict but fair technical interviewer for a ${role} role.

QUESTION: ${question}
EXPECTED KEY POINTS: ${JSON.stringify(expected_points)}
CANDIDATE'S ANSWER: ${answer}

Evaluate the answer on this rubric (each 0-10):
- clarity: how clear and structured
- correctness: technical accuracy
- depth: how thoroughly it covers the topic
- communication: tone, confidence, professionalism

Return STRICT JSON:
{"scores":{"clarity":0,"correctness":0,"depth":0,"communication":0},"overall":0,"strengths":["..."],"improvements":["..."],"model_answer":"a concise ideal answer in 3-5 sentences"}
The "overall" is the average of the 4 scores rounded to 1 decimal.`;
      const raw = await callAI([{ role: "user", content: prompt }], { json: true });
      const parsed = JSON.parse(raw);
      return Response.json(parsed, { headers: corsHeaders });
    }

    if (action === "summary") {
      const { role, topic, results } = body;
      const prompt = `You are an interview coach. The candidate completed a mock interview for ${role} on ${topic}.
Per-question results: ${JSON.stringify(results)}

Return STRICT JSON:
{"overall_score":0,"verdict":"Strong Hire|Hire|Lean Hire|No Hire","top_strengths":["..."],"top_improvements":["..."],"study_plan":["actionable item 1","actionable item 2","actionable item 3"],"summary":"2-3 sentence overall assessment"}
overall_score is the average of all per-question overall scores (0-10, 1 decimal).`;
      const raw = await callAI([{ role: "user", content: prompt }], { json: true });
      const parsed = JSON.parse(raw);
      return Response.json(parsed, { headers: corsHeaders });
    }

    return new Response(JSON.stringify({ error: "unknown action" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("mock-interview error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
