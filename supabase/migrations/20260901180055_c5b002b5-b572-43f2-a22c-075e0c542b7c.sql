CREATE POLICY "Sem acesso direto às sessões do chatbot"
  ON public.chatbot_public_sessions
  FOR SELECT
  TO anon, authenticated
  USING (false);

CREATE POLICY "Sem acesso direto às mensagens do chatbot"
  ON public.chatbot_public_messages
  FOR SELECT
  TO anon, authenticated
  USING (false);