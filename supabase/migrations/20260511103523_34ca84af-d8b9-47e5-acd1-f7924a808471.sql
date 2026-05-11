CREATE TABLE public.dsa_problems (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  topic text NOT NULL,
  difficulty text NOT NULL,
  title text NOT NULL,
  statement text NOT NULL,
  input_format text NOT NULL,
  output_format text NOT NULL,
  constraints text NOT NULL,
  sample_input text NOT NULL,
  sample_output text NOT NULL,
  explanation text NOT NULL,
  test_cases jsonb NOT NULL DEFAULT '[]'::jsonb,
  starter_code jsonb NOT NULL DEFAULT '{}'::jsonb,
  optimal_solution text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.dsa_problems ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view own dsa problems" ON public.dsa_problems FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "insert own dsa problems" ON public.dsa_problems FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete own dsa problems" ON public.dsa_problems FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE public.dsa_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  problem_id uuid NOT NULL REFERENCES public.dsa_problems(id) ON DELETE CASCADE,
  topic text NOT NULL,
  difficulty text NOT NULL,
  language text NOT NULL,
  code text NOT NULL,
  status text NOT NULL,
  passed_count integer NOT NULL DEFAULT 0,
  total_count integer NOT NULL DEFAULT 0,
  runtime_ms integer,
  memory_kb integer,
  results jsonb NOT NULL DEFAULT '[]'::jsonb,
  ai_feedback text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.dsa_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view own dsa submissions" ON public.dsa_submissions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "insert own dsa submissions" ON public.dsa_submissions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete own dsa submissions" ON public.dsa_submissions FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX dsa_submissions_user_created_idx ON public.dsa_submissions(user_id, created_at DESC);
CREATE INDEX dsa_problems_user_created_idx ON public.dsa_problems(user_id, created_at DESC);