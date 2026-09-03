import { useCallback, useEffect, useRef, useState } from "react";

import {
  askPublicChatbot,
  createWidgetThread,
  latestWidgetThread,
  parseChatbotAnswer,
  saveWidgetMessage,
  streamChatbot,
  type ChatbotAction,
  type ChatbotMessage,
  type ChatbotVariant,
} from "@/lib/chatbot";
import { contextSummary, fetchDiagnosticContext } from "@/lib/diagnostic-context";

export type ChatbotEntry = ChatbotMessage & { action?: ChatbotAction | null };

function newId() {
  return crypto.randomUUID();
}

export function useChatbot(variant: ChatbotVariant, open: boolean) {
  const [messages, setMessages] = useState<ChatbotEntry[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const threadRef = useRef<string | null>(null);
  const restoredRef = useRef(false);
  // Guarda por ref: `pending` no state pode estar defasado em cliques rápidos.
  const sendingRef = useRef(false);

  // Retoma a última conversa do usuário logado ao abrir a bolha.
  useEffect(() => {
    if (variant !== "app" || !open || restoredRef.current) return;
    restoredRef.current = true;
    void latestWidgetThread()
      .then((thread) => {
        if (!thread) return;
        threadRef.current = thread.id;
        setMessages(
          thread.messages
            .filter(
              (message, i, arr) =>
                i === 0 ||
                message.role !== arr[i - 1]?.role ||
                message.content !== arr[i - 1]?.content,
            )
            .map((message) =>
              message.role === "assistant"
                ? { ...message, ...parseChatbotAnswer(message.content) }
                : message,
            ),
        );
      })
      .catch(() => {
        /* histórico opcional */
      });
  }, [variant, open]);

  const reset = useCallback(() => {
    sendingRef.current = false;
    threadRef.current = null;
    setMessages([]);
    setError(null);
  }, []);

  const send = useCallback(
    async (raw: string) => {
      const text = raw.trim();
      if (!text || pending || sendingRef.current) return;
      sendingRef.current = true;

      setError(null);
      const userEntry: ChatbotEntry = { id: newId(), role: "user", content: text };
      const history = [...messages, userEntry];
      setMessages(history);
      setPending(true);

      const turns = history.map((entry) => ({ role: entry.role, content: entry.content }));
      const assistantId = newId();

      try {
        if (variant === "publico") {
          const answer = await askPublicChatbot(turns);
          const parsed = parseChatbotAnswer(answer);
          setMessages((prev) => [
            ...prev,
            { id: assistantId, role: "assistant", content: parsed.text, action: parsed.action },
          ]);
          return;
        }

        if (!threadRef.current) {
          threadRef.current = await createWidgetThread(text);
        }
        const threadId = threadRef.current;
        if (threadId) await saveWidgetMessage(threadId, "user", text);

        const contexto = await fetchDiagnosticContext()
          .then((diagnostic) => contextSummary(diagnostic))
          .catch(() => "");

        setMessages((prev) => [...prev, { id: assistantId, role: "assistant", content: "" }]);

        const answer = await streamChatbot(turns, contexto, (chunk) => {
          setMessages((prev) =>
            prev.map((entry) =>
              entry.id === assistantId ? { ...entry, content: entry.content + chunk } : entry,
            ),
          );
        });

        const parsed = parseChatbotAnswer(answer);
        setMessages((prev) =>
          prev.map((entry) =>
            entry.id === assistantId
              ? { ...entry, content: parsed.text, action: parsed.action }
              : entry,
          ),
        );
        if (threadId) await saveWidgetMessage(threadId, "assistant", answer);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Não foi possível falar com a IA agora.";
        setError(message);
        setMessages((prev) => prev.filter((entry) => entry.id !== assistantId));
      } finally {
        setPending(false);
        sendingRef.current = false;
      }
    },
    [messages, pending, variant],
  );

  return { messages, pending, error, send, reset };
}
