import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PISTON = "https://emkc.org/api/v2/piston/execute";

const LANG_MAP: Record<string, { language: string; version: string; filename: string }> = {
  cpp: { language: "c++", version: "10.2.0", filename: "main.cpp" },
  java: { language: "java", version: "15.0.2", filename: "Main.java" },
  python: { language: "python", version: "3.10.0", filename: "main.py" },
  javascript: { language: "javascript", version: "18.15.0", filename: "main.js" },
};

async function runOnce(language: string, code: string, stdin: string) {
  const cfg = LANG_MAP[language];
  if (!cfg) throw new Error("Unsupported language");
  const res = await fetch(PISTON, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      language: cfg.language,
      version: cfg.version,
      files: [{ name: cfg.filename, content: code }],
      stdin,
      run_timeout: 5000,
      compile_timeout: 10000,
    }),
  });
  return res.json();
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
      if (out.compile && out.compile.code !== 0) {
        compileError = out.compile.stderr || out.compile.output;
        results.push({ index: i, hidden: tc.hidden, status: "compile_error", stderr: compileError, expected: tc.output, actual: "" });
        break;
      }
      const run = out.run || {};
      const stdout = norm(run.stdout || "");
      const expected = norm(tc.output || "");
      const stderr = run.stderr || "";
      const runtime = run.runtime_ms ?? run.time ?? 0;
      const mem = run.memory ?? 0;
      totalRuntime += Number(runtime) || 0;
      if (mem > maxMem) maxMem = mem;

      let status = "passed";
      if (run.signal === "SIGKILL" || (run.code && run.code !== 0 && stderr)) status = "runtime_error";
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
