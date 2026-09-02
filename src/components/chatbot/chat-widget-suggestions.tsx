import type { ChatbotVariant } from "@/lib/chatbot";

const SUGGESTIONS: Record<ChatbotVariant, string[]> = {
  app: [
    "O que meu Juriscore® indica?",
    "Como responder a uma intimação?",
    "Onde vejo meu plano de ação?",
  ],
  publico: [
    "O que é o Juriscore®?",
    "Quais são os planos?",
    "Como a IA ajuda minha clínica?",
  ],
};

export function ChatWidgetSuggestions({
  variant,
  disabled,
  onSelect,
}: {
  variant: ChatbotVariant;
  disabled: boolean;
  onSelect: (text: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {SUGGESTIONS[variant].map((suggestion) => (
        <button
          key={suggestion}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(suggestion)}
          className="rounded-full border border-border bg-card px-3 py-2 text-left text-xs text-muted-foreground transition-colors hover:border-gold/50 hover:text-foreground disabled:opacity-50"
        >
          {suggestion}
        </button>
      ))}
    </div>
  );
}
