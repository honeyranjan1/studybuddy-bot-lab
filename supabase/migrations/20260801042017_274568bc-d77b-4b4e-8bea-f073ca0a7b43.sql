CREATE TABLE public.partner_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a uuid NOT NULL,
  user_b uuid NOT NULL,
  last_message_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT partner_conversations_ordered CHECK (user_a < user_b),
  CONSTRAINT partner_conversations_unique_pair UNIQUE (user_a, user_b)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.partner_conversations TO authenticated;
GRANT ALL ON public.partner_conversations TO service_role;

ALTER TABLE public.partner_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view their conversations"
ON public.partner_conversations FOR SELECT TO authenticated
USING (auth.uid() = user_a OR auth.uid() = user_b);

CREATE POLICY "Participants can create their conversations"
ON public.partner_conversations FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_a OR auth.uid() = user_b);

CREATE POLICY "Participants can update their conversations"
ON public.partner_conversations FOR UPDATE TO authenticated
USING (auth.uid() = user_a OR auth.uid() = user_b)
WITH CHECK (auth.uid() = user_a OR auth.uid() = user_b);

CREATE TABLE public.partner_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.partner_conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, DELETE ON public.partner_messages TO authenticated;
GRANT ALL ON public.partner_messages TO service_role;

ALTER TABLE public.partner_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view messages"
ON public.partner_messages FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.partner_conversations c
  WHERE c.id = conversation_id AND (auth.uid() = c.user_a OR auth.uid() = c.user_b)
));

CREATE POLICY "Participants can send messages"
ON public.partner_messages FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = sender_id AND EXISTS (
    SELECT 1 FROM public.partner_conversations c
    WHERE c.id = conversation_id AND (auth.uid() = c.user_a OR auth.uid() = c.user_b)
  )
);

CREATE POLICY "Senders can delete their messages"
ON public.partner_messages FOR DELETE TO authenticated
USING (auth.uid() = sender_id);

CREATE INDEX partner_messages_conversation_idx ON public.partner_messages (conversation_id, created_at);

CREATE TRIGGER update_partner_conversations_updated_at
BEFORE UPDATE ON public.partner_conversations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER PUBLICATION supabase_realtime ADD TABLE public.partner_messages;