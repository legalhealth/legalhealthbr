import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

export type ChatRole = "user" | "assistant";

export type StoredMessage = {
  id: string;
  role: string;
  content: string | null;
  created_at: string;
};

export type ChatThread = {
  id: string;
  title: string | null;
  created_at: string;
};

async function currentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

export type ChatTurn = { role: ChatRole; content: string };

export type ChatAttachment = {
  name: string;
  mime: string;
  /** data:<mime>;base64,... para PDF e imagens */
  dataUrl?: string;
  /** conteúdo já extraído, usado para arquivos de texto */
  text?: string;
};

// `image/*` garante que fotos do celular (inclusive HEIC do iPhone) apareçam
// selecionáveis no seletor de arquivos; extensões cobrem navegadores antigos.
export const ATTACHMENT_ACCEPT =
  "application/pdf,image/*,text/plain,.pdf,.png,.jpg,.jpeg,.webp,.heic,.heif,.txt,.md";
export const ATTACHMENT_MAX_BYTES = 8 * 1024 * 1024;

/** Converte o arquivo escolhido em um anexo pronto para a IA. */
export async function fileToAttachment(file: File): Promise<ChatAttachment> {
  if (file.size > ATTACHMENT_MAX_BYTES) {
    throw new Error(`${file.name} passa de 8 MB. Envie um arquivo menor.`);
  }
  const mime = file.type || "application/octet-stream";
  const isText = mime.startsWith("text/") || /\.(txt|md)$/i.test(file.name);
  if (isText) {
    return { name: file.name, mime: "text/plain", text: (await file.text()).slice(0, 40000) };
  }
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Não foi possível ler o arquivo."));
    reader.readAsDataURL(file);
  });
  return { name: file.name, mime, dataUrl };
}

/**
 * Chama a rota protegida /api/ai-chat (a chave de IA vive apenas no servidor)
 * e entrega o texto em pedaços conforme chega.
 */
export async function streamAiChat(
  messages: ChatTurn[],
  task: string,
  onDelta: (chunk: string) => void,
  attachments?: ChatAttachment[],
): Promise<string> {
  return streamAiEndpoint(
    "/api/ai-chat",
    { messages, task, attachments: attachments ?? [] },
    onDelta,
  );
}

/** Chama qualquer rota protegida de IA que devolva SSE e entrega o texto em pedaços. */
export async function streamAiEndpoint(
  url: string,
  body: unknown,
  onDelta: (chunk: string) => void,
): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Sessão expirada. Faça login novamente.");

  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });

  if (!response.ok || !response.body) {
    let message = "Não foi possível falar com a IA agora. Tente novamente.";
    try {
      const payload = (await response.json()) as { error?: string };
      if (payload.error) message = payload.error;
    } catch {
      /* resposta sem corpo JSON */
    }
    throw new Error(message);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let full = "";

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const payload = trimmed.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      try {
        const parsed = JSON.parse(payload) as {
          choices?: { delta?: { content?: string } }[];
        };
        const delta = parsed.choices?.[0]?.delta?.content;
        if (delta) {
          full += delta;
          onDelta(delta);
        }
      } catch {
        /* fragmento incompleto — ignorado */
      }
    }
  }

  if (!full.trim()) {
    throw new Error("A IA não retornou conteúdo. Tente novamente.");
  }
  return full;
}

export function useChatThreads() {
  return useQuery({
    queryKey: ["chat-threads"],
    queryFn: async (): Promise<ChatThread[]> => {
      const userId = await currentUserId();
      if (!userId) return [];
      const { data, error } = await supabase
        .from("chat_threads")
        .select("id, title, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useChatMessages(threadId: string | null) {
  return useQuery({
    queryKey: ["chat-messages", threadId],
    enabled: Boolean(threadId),
    queryFn: async (): Promise<StoredMessage[]> => {
      if (!threadId) return [];
      const { data, error } = await supabase
        .from("chat_messages")
        .select("id, role, content, created_at")
        .eq("thread_id", threadId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export async function createThread(title: string): Promise<string | null> {
  const userId = await currentUserId();
  if (!userId) return null;
  const { data, error } = await supabase
    .from("chat_threads")
    .insert({ user_id: userId, title: title.slice(0, 80) })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

export async function appendMessage(
  threadId: string,
  role: ChatRole,
  content: string,
): Promise<void> {
  const { error } = await supabase
    .from("chat_messages")
    .insert({ thread_id: threadId, role, content });
  if (error) throw error;
}

export function useDeleteThread() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (threadId: string) => {
      const { error } = await supabase.from("chat_threads").delete().eq("id", threadId);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["chat-threads"] });
    },
  });
}