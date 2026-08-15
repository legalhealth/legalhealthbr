import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Gavel, Scale, Send, ShieldCheck } from "lucide-react";
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
import { contextSummary, useDiagnosticContext } from "@/lib/diagnostic-context";

export const Route = createFileRoute("/_authenticated/ia/assistente")({
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search['q'] === "string" ? (search['q'] as string) : undefined,
  }),
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
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState(q ?? "");
  const [status, setStatus] = useState<"ready" | "submitted" | "streaming">("ready");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
    if (ctx?.hasDiagnostic && ctx.weakest.length > 0) {
      return [
        `Como elevar a conformidade do pilar ${ctx.weakest[0]!.name}?`,
        `Quais documentos faltam no pilar ${ctx.weakest[1]?.name ?? ctx.weakest[0]!.name}?`,
        "Quais riscos do meu diagnóstico devo tratar primeiro?",
        "O que responder a um paciente que ameaça processar?",
      ];
    }
    return [
      "Analisar termo de consentimento livre e esclarecido",
      "Avaliar riscos de uma reclamação no conselho regional",
      "Revisar contrato de prestação de serviços médicos",
      "Como registrar corretamente uma intercorrência no prontuário?",
    ];
  }, [ctx]);

  useEffect(() => {
    if (q) textareaRef.current?.focus();
  }, [q]);

  const handleSubmit = (_message: PromptInputMessage, e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || status !== "ready") return;

    setStatus("submitted");
    setMessages((prev) => [...prev, { id: `u-${Date.now()}`, role: "user", content: text }]);
    setInput("");

    setTimeout(() => {
      setStatus("streaming");
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: `${contextSummary(ctx)}\n\nCom base nisso, o caminho recomendado é documentar a situação, revisar os instrumentos do pilar mais frágil e registrar a comunicação com o paciente. Descreva o caso concreto (procedimento, data e documentos existentes) para eu detalhar a estratégia.`,
        },
      ]);
      setStatus("ready");
    }, 1000);
  };

  return (
    <div className="space-y-6">
      <DiagnosticContextCard
        ctx={ctx}
        note="O assistente recebe esse resumo em cada resposta, priorizando seus pilares mais frágeis."
      />

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

        <PromptInput onSubmit={handleSubmit} className="shrink-0">
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
