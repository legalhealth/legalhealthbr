CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    nome TEXT,
    crm TEXT,
    especialidade TEXT,
    cidade TEXT,
    plano TEXT NOT NULL DEFAULT 'essential',
    push BOOLEAN NOT NULL DEFAULT true,
    biometria BOOLEAN NOT NULL DEFAULT false,
    offline BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.juriscore_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    score INTEGER NOT NULL,
    by_pillar JSONB,
    answers JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.action_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    result_id UUID NOT NULL,
    resumo TEXT,
    prioridades JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.action_items_done (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID NOT NULL,
    item_key TEXT NOT NULL,
    done BOOLEAN NOT NULL DEFAULT false,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.chat_threads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    title TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id UUID NOT NULL,
    role TEXT NOT NULL,
    content TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.generated_docs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    origem TEXT,
    tipo TEXT,
    conteudo TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.juriscore_results TO authenticated;
GRANT ALL ON public.juriscore_results TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.action_plans TO authenticated;
GRANT ALL ON public.action_plans TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.action_items_done TO authenticated;
GRANT ALL ON public.action_items_done TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_threads TO authenticated;
GRANT ALL ON public.chat_threads TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_messages TO authenticated;
GRANT ALL ON public.chat_messages TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.generated_docs TO authenticated;
GRANT ALL ON public.generated_docs TO service_role;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.juriscore_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.action_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.action_items_done ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_docs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own profiles" ON public.profiles FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users manage own juriscore_results" ON public.juriscore_results FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users manage own action_plans" ON public.action_plans FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users manage own action_items_done through plans" ON public.action_items_done FOR ALL TO authenticated USING (plan_id IN (SELECT id FROM public.action_plans WHERE user_id = auth.uid())) WITH CHECK (plan_id IN (SELECT id FROM public.action_plans WHERE user_id = auth.uid()));
CREATE POLICY "Users manage own chat_threads" ON public.chat_threads FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users manage own chat_messages through threads" ON public.chat_messages FOR ALL TO authenticated USING (thread_id IN (SELECT id FROM public.chat_threads WHERE user_id = auth.uid())) WITH CHECK (thread_id IN (SELECT id FROM public.chat_threads WHERE user_id = auth.uid()));
CREATE POLICY "Users manage own generated_docs" ON public.generated_docs FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (user_id, nome, plano)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'nome', 'essential');
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE TRIGGER update_action_items_done_updated_at
BEFORE UPDATE ON public.action_items_done
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();