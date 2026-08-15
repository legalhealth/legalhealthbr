import { useState, useRef } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Send, Scale, ShieldCheck, Gavel } from "lucide-react";

import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/ia")({
  head: () => ({
    meta: [
      { title: "IA Jurídica | Legal Health" },
      { name: "description", content: "Assistente de inteligência jurídica para médicos e clínicas no Brasil." },
      { property: "og:title", content: "IA Jurídica | Legal Health" },
      { property: "og:description", content: "Assistente de inteligência jurídica para médicos e clínicas no Brasil." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Page,
});

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: "welcome",
    role: "assistant",
    content:
      "Olá, sou a IA Jurídica da Legal Health. Posso analisar processos, revisar termos de consentimento e identificar riscos para sua prática médica. Como posso ajudar hoje?",
  },
  {
    id: "mock-user",
    role: "user",
    content: "Quais são os principais riscos jurídicos em cirurgia plástica estética?",
  },
  {
    id: "mock-response",
    role: "assistant",
    content:
      "Os principais riscos envolvem falha no consentimento informado (incluindo riscos, alternativas e reversibilidade), documentação insuficiente da evolução pós-operatória, expectativa não alinhada com o paciente e responsabilidade por resultado não satisfatório. Posso gerar uma análise completa com base no seu caso específico.",
  },
];

const EXAMPLE_PROMPTS = [
  "Analisar termo de consentimento livre e esclarecido",
  "Avaliar riscos de uma reclamação no CREMESP",
  "Revisar contrato de prestação de serviços médicos",
  "Identificar jurisprudência recente sobre responsabilidade civil",
];

function Page() {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<"ready" | "submitted" | "streaming">("ready");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (
    _message: { text: string; files?: File[] },
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || status !== "ready") return;

    setStatus("submitted");
    const userMessage: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content: text,
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    setTimeout(() => {
      setStatus("streaming");
      const assistantMessage: ChatMessage = {
        id: `a-${Date.now()}`,
        role: "assistant",
        content:
          "Entendi. Para uma análise jurídica precisa, vou precisar de mais contexto: qual é a especialidade envolvida, o tipo de procedimento e o documento ou situação que deseja revisar. Enquanto isso, você pode consultar o Juriscore® para uma avaliação rápida de risco.",
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setStatus("ready");
    }, 1200);
  };

  const handleExampleClick = (text: string) => {
    setInput(text);
    textareaRef.current?.focus();
  };

  return (
    <div className="flex h-[calc(100vh-var(--header-h)-var(--bottom-nav-h)-env(safe-area-inset-bottom)-2rem)] flex-col px-4 pt-6 lg:pb-6 lg:pt-8">
      <div className="mx-auto w-full max-w-3xl flex-1 flex flex-col gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl tracking-tight text-foreground md:text-3xl">IA Jurídica</h1>
          <p className="text-sm text-muted-foreground">Assistente especializado em direito médico e saúde.</p>
        </div>

        <Conversation className="flex-1 rounded-2xl border border-border bg-card/30">
          <ConversationContent className="gap-6 px-4 py-6 md:px-6">
            {messages.length === 0 ? (
              <ConversationEmptyState
                title="Bem-vindo à IA Jurídica"
                description="Descreva um caso, cole um documento ou escolha um exemplo abaixo."
                icon={<LHAvatar className="size-10" />}
              />
            ) : (
              messages.map((message) => (
                <Message key={message.id} from={message.role} className="max-w-[90%] md:max-w-[85%]">
                  <MessageContent
                    className={
                      message.role === "user"
                        ? "bg-info text-info-foreground rounded-2xl px-5 py-3.5 shadow-sm"
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

        {messages.length <= 3 && (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {EXAMPLE_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => handleExampleClick(prompt)}
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
          onSubmit={handleSubmit}
          className="shrink-0"
        >
          <PromptInputTextarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.currentTarget.value)}
            placeholder="Descreva sua dúvida jurídica ou cole um documento..."
            className="min-h-[84px] bg-transparent text-foreground placeholder:text-muted-foreground"
          />
          <PromptInputFooter className="px-3 pb-3 pt-0 justify-between items-center">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="size-3.5 text-gold" />
              <span>As respostas são orientativas, não substituem a opinião de um advogado.</span>
            </div>
            <PromptInputSubmit
              status={status}
              disabled={!input.trim() || status !== "ready"}
              className="bg-gold text-primary-foreground hover:bg-gold/90 disabled:opacity-50"
            >
              <Send className="size-4" />
            </PromptInputSubmit>
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
}

function LHAvatar({ className }: { className?: string }) {
  return (
    <div
      className={`
        flex items-center justify-center rounded-full border border-gold/40 bg-gold/10 text-gold
        ${className ?? ""}
      `}
    >
      <Gavel className="size-5" />
    </div>
  );
}
