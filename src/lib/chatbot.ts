import { supabase } from "@/integrations/supabase/client";
import { streamAiEndpoint, type ChatTurn } from "@/lib/ia-chat";

export type ChatbotVariant = "app" | "publico";

export type ChatbotMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

/** Atalhos que o modelo pode sugerir no fim da resposta, no formato [IR:/caminho|Rótulo]. */
export const CHATBOT_ROUTES = [
  "/",
  "/auth",
  "/ia",
  "/ia/assistente",
  "/ia/risco",
  "/ia/peca",
  "/ia/documentos",
  "/ia/revisoes",
  "/ia/historico",
  "/juriscore",
  "/plano",
  "/biblioteca",
  "/perfil",
] as const;

export type ChatbotRoute = (typeof CHATBOT_ROUTES)[number];

export type ChatbotAction = { to: ChatbotRoute; label: string };

const ACTION_RE = /\[IR:(\/[a-z0-9/_-]*)\|([^\]]{1,60})\]/i;

/** Separa o texto exibido do atalho de navegação sugerido pela IA. */
export function parseChatbotAnswer(raw: string): { text: string; action: ChatbotAction | null } {
  const match = raw.match(ACTION_RE);
  const text = raw.replace(ACTION_RE, "").trim();
  if (!match) return { text: raw.trim(), action: null };
  const path = (match[1] ?? "").replace(/\/$/, "") || "/";
  const found = CHATBOT_ROUTES.find((route) => route === path);
  if (!found) return { text, action: null };
  return { text, action: { to: found, label: (match[2] ?? "Abrir").trim() } };
}

const SESSION_STORAGE_KEY = "lh-chatbot-session";

/** Identificador anônimo do visitante, guardado apenas neste navegador. */
export function publicSessionKey(): string {
  if (typeof window === "undefined") return "sem-sessao-servidor";
  const existing = window.localStorage.getItem(SESSION_STORAGE_KEY);
  if (existing && existing.length >= 8) return existing;
  const created = crypto.randomUUID().replace(/-/g, "");
  window.localStorage.setItem(SESSION_STORAGE_KEY, created);
  return created;
}

/** Chat do usuário logado: mesma IA da plataforma, com streaming. */
export function streamChatbot(
  messages: ChatTurn[],
  contexto: string,
  onDelta: (chunk: string) => void,
): Promise<string> {
  return streamAiEndpoint("/api/ai-chatbot", { messages, contexto }, onDelta);
}

/** Chat do visitante: resposta curta, sem streaming. */
export async function askPublicChatbot(messages: ChatTurn[]): Promise<string> {
  const response = await fetch("/api/public/ai-chatbot", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ sessionKey: publicSessionKey(), messages }),
  });
  const payload = (await response.json().catch(() => ({}))) as {
    answer?: string;
    error?: string;
  };
  if (!response.ok || !payload.answer) {
    throw new Error(payload.error ?? "Não foi possível falar com a IA agora. Tente novamente.");
  }
  return payload.answer;
}

/** Conversa mais recente iniciada pelo chat flutuante do usuário logado. */
export async function latestWidgetThread(): Promise<{
  id: string;
  messages: ChatbotMessage[];
} | null> {
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) return null;

  const { data: thread } = await supabase
    .from("chat_threads")
    .select("id")
    .eq("user_id", userId)
    .eq("source", "widget")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!thread) return null;

  const { data: rows } = await supabase
    .from("chat_messages")
    .select("id, role, content, created_at")
    .eq("thread_id", thread.id)
    .order("created_at", { ascending: true });

  const messages: ChatbotMessage[] = (rows ?? [])
    .filter((row) => row.role === "user" || row.role === "assistant")
    .map((row) => ({
      id: row.id,
      role: row.role as "user" | "assistant",
      content: row.content ?? "",
    }));

  return { id: thread.id, messages };
}

export async function createWidgetThread(title: string): Promise<string | null> {
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) return null;
  const { data, error } = await supabase
    .from("chat_threads")
    .insert({ user_id: userId, title: title.slice(0, 80), source: "widget" })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

export async function saveWidgetMessage(
  threadId: string,
  role: "user" | "assistant",
  content: string,
): Promise<void> {
  const { error } = await supabase
    .from("chat_messages")
    .insert({ thread_id: threadId, role, content });
  if (error) console.error("chatbot: falha ao salvar mensagem", error);
}
