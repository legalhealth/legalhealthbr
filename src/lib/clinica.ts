import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

export type VinculoClinica = {
  id: string;
  medico_user_id: string;
  assistente_user_id: string;
  nome: string | null;
  status: string;
  created_at: string;
};

export type ConviteClinica = {
  id: string;
  email: string;
  nome: string | null;
  token: string;
  status: string;
  expires_at: string;
  created_at: string;
};

const CONTA_ATIVA_KEY = "lh:conta-ativa";

/** Conta escolhida pelo assistente (quando ele atende mais de um médico). */
export function contaAtivaSalva(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(CONTA_ATIVA_KEY);
}

export function salvarContaAtiva(medicoUserId: string | null) {
  if (typeof window === "undefined") return;
  if (medicoUserId) window.localStorage.setItem(CONTA_ATIVA_KEY, medicoUserId);
  else window.localStorage.removeItem(CONTA_ATIVA_KEY);
}

/**
 * Dono da agenda de pacientes em uso: o próprio usuário, ou o médico de quem
 * ele é assistente ativo. Tudo que grava ficha usa este id em `user_id`.
 */
export async function contaAtivaId(): Promise<string> {
  const { data } = await supabase.auth.getUser();
  const userId = data.user?.id;
  if (!userId) throw new Error("Sessão expirada. Faça login novamente.");

  const salva = contaAtivaSalva();
  if (salva && salva !== userId) {
    const { data: vinculo } = await supabase
      .from("clinic_members")
      .select("medico_user_id")
      .eq("assistente_user_id", userId)
      .eq("medico_user_id", salva)
      .eq("status", "ativo")
      .maybeSingle();
    if (vinculo) return vinculo.medico_user_id as string;
    salvarContaAtiva(null);
  }

  // Sem escolha explícita: se o usuário só existe como assistente, usa aquele médico.
  const { data: proprio } = await supabase
    .from("patients")
    .select("id")
    .eq("user_id", userId)
    .limit(1);
  if (proprio && proprio.length > 0) return userId;

  const { data: vinculos } = await supabase
    .from("clinic_members")
    .select("medico_user_id")
    .eq("assistente_user_id", userId)
    .eq("status", "ativo")
    .order("created_at", { ascending: true })
    .limit(1);
  if (vinculos && vinculos.length > 0) return vinculos[0]!.medico_user_id as string;

  return userId;
}

/** Vínculos em que o usuário atual é assistente de alguém. */
export function useMinhasContas() {
  return useQuery({
    queryKey: ["clinica", "minhas-contas"],
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!userId) return [];
      const { data, error } = await supabase
        .from("clinic_members")
        .select("id, medico_user_id, nome, status, created_at")
        .eq("assistente_user_id", userId)
        .eq("status", "ativo");
      if (error) throw error;
      return data ?? [];
    },
  });
}

/** Assistentes e convites da clínica do usuário atual. */
export function useEquipe() {
  return useQuery({
    queryKey: ["clinica", "equipe"],
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!userId) return { membros: [] as VinculoClinica[], convites: [] as ConviteClinica[] };
      const [membros, convites] = await Promise.all([
        supabase
          .from("clinic_members")
          .select("id, medico_user_id, assistente_user_id, nome, status, created_at")
          .eq("medico_user_id", userId)
          .order("created_at", { ascending: true }),
        supabase
          .from("clinic_invites")
          .select("id, email, nome, token, status, expires_at, created_at")
          .eq("medico_user_id", userId)
          .eq("status", "pendente")
          .order("created_at", { ascending: false }),
      ]);
      if (membros.error) throw membros.error;
      if (convites.error) throw convites.error;
      return {
        membros: (membros.data ?? []) as VinculoClinica[],
        convites: (convites.data ?? []) as ConviteClinica[],
      };
    },
  });
}

export function useAlterarAssistente() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; status: "ativo" | "inativo" }) => {
      const { error } = await supabase
        .from("clinic_members")
        .update({ status: input.status })
        .eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["clinica"] });
    },
  });
}

export function useRemoverAssistente() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("clinic_members").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["clinica"] });
    },
  });
}

export function useCancelarConvite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("clinic_invites")
        .update({ status: "cancelado" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["clinica"] });
    },
  });
}
