import { useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { BookmarkPlus, Gavel, MessageSquare, Plus, Scale, Send, ShieldCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { PromptInputMessage } from "@/components/ai-elements/prompt-input";

import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { DiagnosticContextCard } from "@/components/ia/diagnostic-context-card";
import { Button } from "@/components/ui/button";
import { contextSummary, useDiagnosticContext } from "@/lib/diagnostic-context";
import {
  appendMessage,
  createThread,
  streamAiChat,
  useChatMessages,
  useChatThreads,
  useDeleteThread,
} from "@/lib/ia-chat";
import { useSaveRecommendation } from "@/lib/ia-recommendations";

export const Route = createFileRoute("/_authenticated/ia/assistente")({
  validateSearch: (search: Record<string, unknown>): { q?: string } =>
    typeof search['q'] === "string" ? { q: search['q'] } : {},
  head: () => ({
    meta: [
      { title: "Assistente Jurídico | Legal Health" },
      {
        name: "description",
        content:
          "Tire dúvidas jurídicas do dia a dia clínico com o assistente de IA, já ciente do seu Juriscore®.",
      },
      { property: "og:title", content: "Assistente Jurídico | Legal Health" },
      {
        property: "og:description",
        content:
          "Tire dúvidas jurídicas do dia a dia clínico com o assistente de IA, já ciente do seu Juriscore®.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Page,
});

type ChatMessage = { id: string; role: "user" | "assistant"; content: string };

function Page() {
  const { q } = Route.useSearch();
  const { data: ctx } = useDiagnosticContext();
  const queryClient = useQueryClient();
  const [threadId, setThreadId] = useState<string | null>(null);
  const { data: threads } = useChatThreads();
  const { data: storedMessages } = useChatMessages(threadId);
  const deleteThread = useDeleteThread();
  const saveRecommendation = useSaveRecommendation();
  const [input, setInput] = useState(q ?? "");
  const [status, setStatus] = useState<"ready" | "submitted" | "streaming">("ready");
  const [pendingUser, setPendingUser] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const messages: ChatMessage[] = (storedMessages ?? []).map((m) => ({
    id: m.id,
    role: m.role === "user" ? "user" : "assistant",
    content: m.content ?? "",
  }));

  const welcome = useMemo<ChatMessage>(() => {
    const base =
      "Olá, sou a IA Jurídica da Legal Health. Posso analisar situações clínicas, revisar documentos e apontar riscos da sua prática.";
    const extra = ctx?.hasDiagnostic
      ? ` Já estou considerando seu diagnóstico: Juriscore® ${ctx.score}/100 (${ctx.level?.name}), com atenção especial aos pilares ${ctx.weakest
          .map((p) => `${p.name} (${p.percent}%)`)
          .join(" e ")}.`
      : " Assim que você fizer o Juriscore®, passo a personalizar as respostas com seus pilares de risco.";
    return { id: "welcome", role: "assistant", content: base + extra };
  }, [ctx]);

  const suggestions = useMemo(() => {
    return [
      "Posso negar o prontuário ao paciente?",
      "Como divulgar antes e depois sem infringir o CFM?",
      "Paciente pediu exclusão dos dados pela LGPD. O que faço?",
      "Redija uma notificação extrajudicial de cobrança de honorários médicos.",
    ];
  }, []);

  useEffect(() => {
    if (q) textareaRef.current?.focus();
  }, [q]);

  const handleSubmit = async (
    _message: PromptInputMessage,
    e: React.FormEvent<HTMLFormElement>,
  ) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || status !== "ready") return;

    setStatus("submitted");
    setInput("");
    setPendingUser(text);
    setDraft("");

    try {
      let activeThread = threadId;
      if (!activeThread) {
        activeThread = await createThread(text);
        if (!activeThread) throw new Error("Sem sessão");
        setThreadId(activeThread);
        void queryClient.invalidateQueries({ queryKey: ["chat-threads"] });
      }

      await appendMessage(activeThread, "user", text);

      setStatus("streaming");
      const history = [
        ...messages.map((m) => ({ role: m.role, content: m.content })),
        {
          role: "user" as const,
          content: `Contexto do diagnóstico do usuário: ${contextSummary(ctx)}\n\nPergunta: ${text}`,
        },
      ];
      const answer = await streamAiChat(history, "assistente", (chunk) =>
        setDraft((prev) => prev + chunk),
      );
      await appendMessage(activeThread, "assistant", answer);
      await queryClient.invalidateQueries({ queryKey: ["chat-messages", activeThread] });
      void queryClient.invalidateQueries({ queryKey: ["chat-threads"] });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Não foi possível falar com a IA agora.",
      );
    } finally {
      setPendingUser(null);
      setDraft("");
      setStatus("ready");
    }
  };

  const isBusy = status !== "ready";

  return (
    <div className="space-y-6">
      <DiagnosticContextCard
        ctx={ctx}
        note="O assistente recebe esse resumo em cada resposta, priorizando seus pilares mais frágeis."
      />

      <section className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-serif text-lg text-foreground">Conversas salvas</h2>
          <Button
            variant="outline"
            size="sm"
            className="border-gold/40 bg-transparent text-gold hover:bg-gold/10"
            onClick={() => setThreadId(null)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Nova conversa
          </Button>
        </div>
        {(threads ?? []).length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Cada conversa é salva automaticamente ao enviar a primeira mensagem.
          </p>
        ) : (
          <ul className="mt-4 space-y-2">
            {(threads ?? []).map((thread) => (
              <li
                key={thread.id}
                className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-colors ${
                  threadId === thread.id
                    ? "border-gold/60 bg-gold/10 text-gold"
                    : "border-border bg-muted/30 text-muted-foreground"
                }`}
              >
                <MessageSquare className="h-4 w-4 shrink-0" />
                <button
                  type="button"
                  onClick={() => setThreadId(thread.id)}
                  className="min-w-0 flex-1 truncate text-left"
                >
                  {thread.title ?? "Conversa"}
                </button>
                <span className="shrink-0 text-xs text-subtle">
                  {new Date(thread.created_at).toLocaleDateString("pt-BR")}
                </span>
                <button
                  type="button"
                  aria-label="Excluir conversa"
                  className="shrink-0 text-subtle transition-colors hover:text-danger"
                  onClick={() =>
                    deleteThread.mutate(thread.id, {
                      onSuccess: () => {
                        if (threadId === thread.id) setThreadId(null);
                        toast.success("Conversa excluída.");
                      },
                      onError: () => toast.error("Não foi possível excluir."),
                    })
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="flex flex-col gap-4">
        <Conversation className="min-h-[380px] rounded-2xl border border-border bg-card/30">
          <ConversationContent className="gap-6 px-4 py-6 md:px-6">
            {messages.length === 0 ? (
              <>
                <Message from="assistant" className="max-w-[90%] md:max-w-[85%]">
                  <MessageContent className="text-foreground">
                    <MessageResponse>{welcome.content}</MessageResponse>
                  </MessageContent>
                </Message>
                <ConversationEmptyState
                  title="Comece pela sua dúvida"
                  description="Descreva um caso, cole um documento ou escolha uma sugestão abaixo."
                  icon={
                    <div className="flex size-10 items-center justify-center rounded-full border border-gold/40 bg-gold/10 text-gold">
                      <Gavel className="size-5" />
                    </div>
                  }
                />
              </>
            ) : (
              [welcome, ...messages].map((message) => (
                <Message key={message.id} from={message.role} className="max-w-[90%] md:max-w-[85%]">
                  <MessageContent
                    className={
                      message.role === "user"
                        ? "rounded-2xl px-5 py-3.5 shadow-sm !bg-info !text-info-foreground"
                        : "text-foreground"
                    }
                  >
                    <MessageResponse>{message.content}</MessageResponse>
                    {message.role === "assistant" && message.id !== "welcome" ? (
                      <button
                        type="button"
                        className="mt-3 inline-flex items-center gap-2 text-xs text-gold transition-colors hover:text-gold-light"
                        onClick={() =>
                          saveRecommendation.mutate(
                            { content: message.content, threadId },
                            {
                              onSuccess: () =>
                                toast.success("Recomendação salva — disponível na peça e no plano."),
                              onError: () => toast.error("Não foi possível salvar."),
                            },
                          )
                        }
                      >
                        <BookmarkPlus className="h-3.5 w-3.5" />
                        Salvar como recomendação
                      </button>
                    ) : null}
                  </MessageContent>
                </Message>
              ))
            )}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        {messages.length === 0 && (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {suggestions.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => {
                  setInput(prompt);
                  textareaRef.current?.focus();
                }}
                className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 text-left text-sm text-muted-foreground transition-colors hover:border-gold/50 hover:text-foreground"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gold/10 text-gold">
                  <Scale className="size-4" />
                </span>
                <span className="line-clamp-2">{prompt}</span>
              </button>
            ))}
          </div>
        )}

        <PromptInput
          onSubmit={(message, event) => {
            void handleSubmit(message, event);
          }}
          className="shrink-0"
        >
          <PromptInputTextarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.currentTarget.value)}
            placeholder="Descreva sua dúvida jurídica ou cole um documento..."
            className="min-h-[84px] bg-transparent text-foreground placeholder:text-muted-foreground"
          />
          <PromptInputFooter className="items-center justify-between px-3 pb-3 pt-0">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="size-3.5 text-gold" />
              <span>As respostas são orientativas, não substituem a opinião de um advogado.</span>
            </div>
            <PromptInputSubmit
              status={status}
              disabled={!input.trim() || status !== "ready"}
              className="bg-gold text-background hover:bg-gold-light disabled:opacity-50"
            >
              <Send className="size-4" />
            </PromptInputSubmit>
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
}
