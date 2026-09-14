import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

export const WELCOME_SEEN_KEY = "lh:welcome-seen";

export function markWelcomeSeen() {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(WELCOME_SEEN_KEY, "1");
  }
}

export type PassoId = "juriscore" | "riscos" | "minuta";

export type PassoTrilha = {
  id: PassoId;
  titulo: string;
  descricao: string;
  acao: string;
  to: "/juriscore" | "/plano" | "/biblioteca";
};

/** Trilha fixa: do Juriscore até a primeira minuta pronta. */
export const TRILHA: PassoTrilha[] = [
  {
    id: "juriscore",
    titulo: "Calcule seu Juriscore®",
    descricao: "Responda o questionário e veja o nível de risco jurídico da sua prática.",
    acao: "Fazer o Juriscore",
    to: "/juriscore",
  },
  {
    id: "riscos",
    titulo: "Veja seus 3 riscos",
    descricao: "O plano de ação transforma o resultado em prioridades objetivas.",
    acao: "Ver seus riscos",
    to: "/plano",
  },
  {
    id: "minuta",
    titulo: "Gere sua primeira minuta",
    descricao: "Escolha um modelo da aba Minutas e receba o documento pronto para revisar.",
    acao: "Gerar minuta",
    to: "/biblioteca",
  },
];

export type ProgressoTrilha = {
  juriscore: boolean;
  riscos: boolean;
  minuta: boolean;
  concluida: boolean;
  proximo: PassoTrilha | null;
};

/** Progresso lido do servidor: o que já existe na conta, não o que o navegador lembra. */
export function useProgressoTrilha() {
  return useQuery({
    queryKey: ["onboarding-progresso"],
    staleTime: 60_000,
    queryFn: async (): Promise<ProgressoTrilha> => {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!userId) {
        return {
          juriscore: false,
          riscos: false,
          minuta: false,
          concluida: false,
          proximo: TRILHA[0]!,
        };
      }

      const [score, plano, minuta] = await Promise.all([
        supabase.from("juriscore_results").select("id").eq("user_id", userId).limit(1),
        supabase.from("action_plans").select("id").eq("user_id", userId).limit(1),
        supabase
          .from("generated_docs")
          .select("id")
          .eq("user_id", userId)
          .eq("origem", "biblioteca")
          .ilike("titulo", "Minutas —%")
          .limit(1),
      ]);

      const feito = {
        juriscore: Boolean(score.data?.length),
        riscos: Boolean(plano.data?.length),
        minuta: Boolean(minuta.data?.length),
      };
      const proximo = TRILHA.find((passo) => !feito[passo.id]) ?? null;
      return { ...feito, concluida: !proximo, proximo };
    },
  });
}
