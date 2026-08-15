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