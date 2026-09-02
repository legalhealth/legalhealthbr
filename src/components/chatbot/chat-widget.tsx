import { useEffect, useRef, useState } from "react";
import { MessageCircle, RotateCcw, X } from "lucide-react";

import monograma from "@/assets/lh-monograma.png.asset.json";
import type { PromptInputMessage } from "@/components/ai-elements/prompt-input";
import {
  PromptInput,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { ChatWidgetMessages } from "@/components/chatbot/chat-widget-messages";
import { useChatbot } from "@/components/chatbot/use-chatbot";
import { cn } from "@/lib/utils";
import type { ChatbotVariant } from "@/lib/chatbot";

const WELCOME: Record<ChatbotVariant, string> = {
  app: "Olá. Sou o assistente da Legal Health. Posso tirar dúvidas jurídicas rápidas, explicar seu Juriscore® e indicar a tela certa para cada demanda.",
  publico:
    "Olá. Sou o assistente da Legal Health. Posso explicar o Juriscore®, os módulos de IA e os planos da plataforma.",
};

export function ChatWidget({ variant }: { variant: ChatbotVariant }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const { messages, pending, error, send, reset } = useChatbot(variant, open);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => textareaRef.current?.focus(), 120);
    return () => window.clearTimeout(timer);
  }, [open, pending]);

  const submit = (text: string) => {
    setInput("");
    void send(text);
  };

  const handleSubmit = (_message: PromptInputMessage, event: React.FormEvent) => {
    event.preventDefault();
    submit(input);
  };

  return (
    <>
      {open && (
        <div
          className={cn(
            "fixed z-[70] flex flex-col overflow-hidden rounded-[20px] border border-border bg-card shadow-2xl",
            "inset-x-3 bottom-[calc(var(--bottom-nav-h)+env(safe-area-inset-bottom)+4.75rem)] top-[calc(var(--header-h)+1rem)]",
            "sm:inset-x-auto sm:right-5 sm:top-auto sm:h-[min(34rem,calc(100vh-8rem))] sm:w-[23rem]",
            "lg:bottom-24",
          )}
        >
          <header className="flex items-center gap-3 border-b border-border px-4 py-3">
            <img src={monograma.url} alt="Legal Health" className="h-7 w-auto shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="wordmark truncate text-sm leading-none text-gold-light">
                Assistente Legal Health
              </p>
              <p className="mt-1 truncate text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground">
                {variant === "app" ? "atendimento com ia" : "conheça a plataforma"}
              </p>
            </div>
            {variant === "app" && (
              <button
                type="button"
                onClick={reset}
                aria-label="Nova conversa"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border text-muted-foreground transition-colors hover:text-foreground"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Fechar chat"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </header>

          <ChatWidgetMessages
            variant={variant}
            messages={messages}
            pending={pending}
            welcome={WELCOME[variant]}
            onSuggestion={submit}
            onNavigate={() => setOpen(false)}
          />

          {error && (
            <p className="border-t border-border px-4 py-2 text-xs text-[#E0655F]">{error}</p>
          )}

          <div className="border-t border-border p-3">
            <PromptInput onSubmit={handleSubmit}>
              <PromptInputTextarea
                ref={textareaRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder={
                  variant === "app" ? "Pergunte algo em uma frase..." : "Tire sua dúvida sobre a plataforma..."
                }
                className="min-h-[2.75rem] text-sm"
              />
              <PromptInputFooter className="justify-end">
                <PromptInputSubmit
                  status={pending ? "submitted" : "ready"}
                  disabled={pending || input.trim().length === 0}
                />
              </PromptInputFooter>
            </PromptInput>
            <p className="mt-2 text-[0.6rem] leading-relaxed text-muted-foreground/80">
              {variant === "app"
                ? "Respostas geradas por IA — sujeitas à revisão do advogado responsável."
                : "Conteúdo informativo sobre a plataforma. Orientação jurídica com IA fica disponível após o cadastro."}
            </p>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? "Fechar assistente" : "Abrir assistente"}
        className={cn(
          "fixed right-4 z-[71] grid h-14 w-14 place-items-center rounded-full border border-gold/40 shadow-xl transition-transform hover:scale-105",
          "bottom-[calc(var(--bottom-nav-h)+env(safe-area-inset-bottom)+1rem)] lg:bottom-6 lg:right-6",
          "bg-gradient-to-br from-[#D4B87A] to-[#B8975A]",
        )}
        style={{ WebkitTapHighlightColor: "transparent" }}
      >
        {open ? (
          <X className="h-5 w-5 text-[#0A0A0A]" />
        ) : (
          <MessageCircle className="h-6 w-6 text-[#0A0A0A]" />
        )}
      </button>
    </>
  );
}
