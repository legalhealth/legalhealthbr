import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

export type AppRole = "medico" | "advogado" | "admin";

/** Papéis do usuário autenticado (tabela dedicada `user_roles`). */
export function useRoles() {
  return useQuery({
    queryKey: ["user-roles"],
    staleTime: 60_000,
    queryFn: async (): Promise<AppRole[]> => {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!userId) return [];
      const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", userId);
      if (error) return [];
      return (data ?? []).map((row) => row.role as AppRole);
    },
  });
}

export function useHasRole(role: AppRole) {
  const { data, isLoading } = useRoles();
  return { has: (data ?? []).includes(role), isLoading };
}
