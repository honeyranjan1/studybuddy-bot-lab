
-- Generated Notes table
CREATE TABLE public.generated_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  subject TEXT NOT NULL,
  topic TEXT NOT NULL,
  content TEXT NOT NULL,
  is_favorite BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.generated_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notes" ON public.generated_notes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own notes" ON public.generated_notes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own notes" ON public.generated_notes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own notes" ON public.generated_notes FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_generated_notes_updated_at BEFORE UPDATE ON public.generated_notes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Flashcards table
CREATE TABLE public.flashcards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  subject TEXT NOT NULL,
  topic TEXT NOT NULL,
  front TEXT NOT NULL,
  back TEXT NOT NULL,
  deck_name TEXT NOT NULL DEFAULT 'Default',
  is_mastered BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own flashcards" ON public.flashcards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own flashcards" ON public.flashcards FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own flashcards" ON public.flashcards FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own flashcards" ON public.flashcards FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_flashcards_updated_at BEFORE UPDATE ON public.flashcards FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Study Partners table
CREATE TABLE public.study_partners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  semester TEXT,
  subjects TEXT[] NOT NULL DEFAULT '{}',
  goals TEXT,
  availability TEXT,
  bio TEXT,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.study_partners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view visible partners" ON public.study_partners FOR SELECT TO authenticated USING (is_visible = true OR auth.uid() = user_id);
CREATE POLICY "Users can create their own partner profile" ON public.study_partners FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own partner profile" ON public.study_partners FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own partner profile" ON public.study_partners FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_study_partners_updated_at BEFORE UPDATE ON public.study_partners FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Exam Countdowns table
CREATE TABLE public.exam_countdowns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  exam_name TEXT NOT NULL,
  exam_date DATE NOT NULL,
  subject TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.exam_countdowns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own countdowns" ON public.exam_countdowns FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own countdowns" ON public.exam_countdowns FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own countdowns" ON public.exam_countdowns FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own countdowns" ON public.exam_countdowns FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_exam_countdowns_updated_at BEFORE UPDATE ON public.exam_countdowns FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- DSA Progress table
CREATE TABLE public.dsa_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  topic_name TEXT NOT NULL,
  category TEXT NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.dsa_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own dsa progress" ON public.dsa_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own dsa progress" ON public.dsa_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own dsa progress" ON public.dsa_progress FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own dsa progress" ON public.dsa_progress FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_dsa_progress_updated_at BEFORE UPDATE ON public.dsa_progress FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
