import { FileSignature, MessageSquare, ScanLine, ScrollText } from "lucide-react";
import type { ComponentType } from "react";

export type IaTool = {
  to: "/ia/peca" | "/ia/risco" | "/ia/documentos" | "/ia/assistente";
  label: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
};

export const IA_TOOLS: IaTool[] = [
  {
    to: "/ia/peca",
    label: "Redigir peça",
    description: "Defesa, petição, notificação",
    icon: FileSignature,
  },
  {
    to: "/ia/risco",
    label: "Análise de risco",
    description: "Riscos, prazos e estratégia",
    icon: ScrollText,
  },
  {
    to: "/ia/documentos",
    label: "Documentos",
    description: "Upload e OCR",
    icon: ScanLine,
  },
  {
    to: "/ia/assistente",
    label: "Assistente",
    description: "Dúvidas do dia a dia clínico",
    icon: MessageSquare,
  },
];
