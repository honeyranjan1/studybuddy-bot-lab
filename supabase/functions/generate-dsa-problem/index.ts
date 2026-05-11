import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { topic, difficulty } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    const sys = `You generate self-contained competitive programming problems. The user's program will read from STDIN and print to STDOUT. Test cases must be exact-match (trim trailing whitespace). Keep problems solvable in <50 lines. Provide 4-6 test cases (mix of visible and hidden). Provide starter code stubs that already read input correctly for cpp, java, python, javascript.`;
    const user = `Generate a ${difficulty} ${topic} problem.`;

    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: sys }, { role: "user", content: user }],
        tools: [{
          type: "function",
          function: {
            name: "make_problem",
            parameters: {
              type: "object",
              properties: {
                title: { type: "string" },
                statement: { type: "string" },
                input_format: { type: "string" },
                output_format: { type: "string" },
                constraints: { type: "string" },
                sample_input: { type: "string" },
                sample_output: { type: "string" },
                explanation: { type: "string" },
                test_cases: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      input: { type: "string" },
                      output: { type: "string" },
                      hidden: { type: "boolean" },
                    },
                    required: ["input", "output", "hidden"],
                    additionalProperties: false,
                  },
                },
                starter_code: {
                  type: "object",
                  properties: {
                    cpp: { type: "string" },
                    java: { type: "string" },
                    python: { type: "string" },
                    javascript: { type: "string" },
                  },
                  required: ["cpp", "java", "python", "javascript"],
                  additionalProperties: false,
                },
                optimal_solution: { type: "string", description: "Optimal Python solution with brief comments" },
              },
              required: ["title","statement","input_format","output_format","constraints","sample_input","sample_output","explanation","test_cases","starter_code","optimal_solution"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "make_problem" } },
      }),
    });

    if (!r.ok) {
      const t = await r.text();
      return new Response(JSON.stringify({ error: t }), { status: r.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const data = await r.json();
    const args = JSON.parse(data.choices[0].message.tool_calls[0].function.arguments);
    return new Response(JSON.stringify(args), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "err" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
