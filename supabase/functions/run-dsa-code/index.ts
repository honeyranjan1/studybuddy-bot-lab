import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Paiza.io free public API (no key required, use api_key=guest)
const PAIZA_BASE = "https://api.paiza.io/runners";

const LANG_MAP: Record<string, string> = {
  cpp: "cpp",
  java: "java",
  python: "python3",
  javascript: "javascript",
};

async function runOnce(language: string, code: string, stdin: string) {
  const lang = LANG_MAP[language];
  if (!lang) throw new Error("Unsupported language");

  const body = new URLSearchParams();
  body.set("source_code", code);
  body.set("language", lang);
  body.set("input", stdin || "");
  body.set("longpoll", "true");
  body.set("longpoll_timeout", "15");
  body.set("api_key", "guest");

  const create = await fetch(`${PAIZA_BASE}/create`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  const created = await create.json();
  if (!created.id) throw new Error("Paiza create failed: " + JSON.stringify(created));

  // Poll if not completed
  let status = created.status;
  let id = created.id;
  for (let i = 0; i < 10 && status !== "completed"; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    const s = await fetch(`${PAIZA_BASE}/get_status?id=${id}&api_key=guest`);
    const sj = await s.json();
    status = sj.status;
  }

  const det = await fetch(`${PAIZA_BASE}/get_details?id=${id}&api_key=guest`);
  return det.json();
}

const norm = (s: string) => (s || "").replace(/\r\n/g, "\n").replace(/[ \t]+\n/g, "\n").replace(/\s+$/g, "");

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { language, code, test_cases } = await req.json();
    if (!Array.isArray(test_cases) || test_cases.length === 0) {
      return new Response(JSON.stringify({ error: "no test cases" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const results: any[] = [];
    let passed = 0;
    let totalRuntime = 0;
    let maxMem = 0;
    let compileError: string | null = null;

    for (let i = 0; i < test_cases.length; i++) {
      const tc = test_cases[i];
      const out = await runOnce(language, code, tc.input);

      // Build error
      if (out.build_exit_code && out.build_exit_code !== "0" && out.build_result !== "success") {
        compileError = out.build_stderr || out.build_stdout || "Compile error";
        results.push({
          index: i, hidden: tc.hidden, status: "compile_error",
          stderr: compileError, expected: tc.output, actual: "",
        });
        break;
      }

      const stdout = norm(out.stdout || "");
      const expected = norm(tc.output || "");
      const stderr = out.stderr || "";
      const runtime = parseFloat(out.time || "0") * 1000;
      const mem = parseInt(out.memory || "0", 10) / 1024;
      totalRuntime += runtime;
      if (mem > maxMem) maxMem = mem;

      let status = "passed";
      if (out.result === "timeout") status = "runtime_error";
      else if (out.exit_code && out.exit_code !== "0" && stderr) status = "runtime_error";
      else if (stdout !== expected) status = "wrong_answer";
      if (status === "passed") passed++;

      results.push({
        index: i, hidden: tc.hidden, status,
        input: tc.hidden ? null : tc.input,
        expected: tc.hidden ? null : expected,
        actual: tc.hidden ? null : stdout,
        stderr: stderr || null,
      });
    }

    const overall = compileError
      ? "compile_error"
      : passed === test_cases.length
        ? "accepted"
        : results.some((r) => r.status === "runtime_error") ? "runtime_error" : "wrong_answer";

    return new Response(JSON.stringify({
      status: overall,
      passed_count: passed,
      total_count: test_cases.length,
      runtime_ms: Math.round(totalRuntime),
      memory_kb: Math.round(maxMem),
      results,
      compile_error: compileError,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "err" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
