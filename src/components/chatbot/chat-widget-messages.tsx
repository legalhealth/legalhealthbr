import { ArrowUpRight } from "lucide-react";
import { Link } from "@tanstack/react-router";

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { ChatWidgetSuggestions } from "@/components/chatbot/chat-widget-suggestions";
import type { ChatbotEntry } from "@/components/chatbot/use-chatbot";
import type { ChatbotVariant } from "@/lib/chatbot";

export function ChatWidgetMessages({
  variant,
  messages,
  pending,
  welcome,
  onSuggestion,
  onNavigate,
}: {
  variant: ChatbotVariant;
  messages: ChatbotEntry[];
  pending: boolean;
  welcome: string;
  onSuggestion: (text: string) => void;
  onNavigate: () => void;
}) {
  const lastPending = pending && messages[messages.length - 1]?.role === "user";

  return (
    <Conversation className="min-h-0 flex-1">
      <ConversationContent className="gap-4 px-4 py-4">
        <Message from="assistant" className="max-w-full">
          <MessageContent className="bg-transparent px-0 text-sm text-foreground">
            <MessageResponse>{welcome}</MessageResponse>
          </MessageContent>
        </Message>

        {messages.length === 0 && (
          <ChatWidgetSuggestions variant={variant} disabled={pending} onSelect={onSuggestion} />
        )}

        {messages.map((entry) => (
          <div key={entry.id} className="flex flex-col gap-2">
            <Message from={entry.role} className="max-w-full">
              <MessageContent
                className={
                  entry.role === "user"
                    ? "bg-[#2563EB] text-sm text-white"
                    : "bg-transparent px-0 text-sm text-foreground"
                }
              >
                <MessageResponse>{entry.content}</MessageResponse>
              </MessageContent>
            </Message>
            {entry.action && (
              <Link
                to={entry.action.to}
                onClick={onNavigate}
                className="inline-flex min-h-[40px] w-fit items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-4 text-xs font-medium text-gold-light transition-colors hover:bg-gold/20"
              >
                {entry.action.label}
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>
        ))}

        {lastPending && (
          <Shimmer className="px-1 text-sm">Pensando...</Shimmer>
        )}
      </ConversationContent>
      <ConversationScrollButton />
    </Conversation>
  );
}
