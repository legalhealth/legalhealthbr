import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import type { BibliotecaDoc } from "@/lib/biblioteca-catalogo";

export type ModeloEscopo = "oficial" | "proprio" | "clinica";

/** Categoria das minutas oficiais da clínica (aba Clínica da Biblioteca). */
export const CLINICA_CATEGORIA = "clinica-minutas";

export type LibraryTemplate = {
  id: string;
  slug: string;
  label: string;
  categoria_slug: string;
  grupo: string | null;
  escopo: string;
  user_id: string | null;
  clinic_owner_id: string | null;
  pede_procedimento: boolean;
  instrucoes: string | null;
  ordem: number;
  status: string;
  created_at: string;
};

export type LibraryCategory = {
  id: string;
  slug: string;
  label: string;
  escopo: string;
  user_id: string | null;
  ordem: number;
  status: string;
};

export function slugificar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/** Modelos visíveis para o usuário: oficiais publicados + os próprios. */
export function useModelos() {
  return useQuery({
    queryKey: ["library-templates"],
    queryFn: async (): Promise<LibraryTemplate[]> => {
      const { data, error } = await supabase
        .from("library_templates")
        .select("*")
        .order("ordem", { ascending: true })
        .order("label", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as LibraryTemplate[];
    },
  });
}

export function useCategoriasModelos() {
  return useQuery({
    queryKey: ["library-categories"],
    queryFn: async (): Promise<LibraryCategory[]> => {
      const { data, error } = await supabase
        .from("library_categories")
        .select("*")
        .order("ordem", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as LibraryCategory[];
    },
  });
}

export type ModeloInput = {
  id?: string;
  label: string;
  categoria_slug: string;
  grupo?: string;
  pede_procedimento: boolean;
  instrucoes?: string;
  escopo: ModeloEscopo;
  status: "rascunho" | "publicado";
};

export function useSalvarModelo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: ModeloInput) => {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id ?? null;
      const linha = {
        slug: slugificar(input.label),
        label: input.label.trim(),
        categoria_slug: input.escopo === "clinica" ? CLINICA_CATEGORIA : input.categoria_slug,
        grupo:
          input.escopo === "clinica"
            ? input.grupo?.trim() || "Minutas oficiais da clínica"
            : input.grupo?.trim() || null,
        escopo: input.escopo,
        user_id: input.escopo === "oficial" ? null : userId,
        clinic_owner_id: input.escopo === "clinica" ? userId : null,
        pede_procedimento: input.pede_procedimento,
        instrucoes: input.instrucoes?.trim() || null,
        status: input.status,
      };
      const query = input.id
        ? supabase.from("library_templates").update(linha).eq("id", input.id)
        : supabase.from("library_templates").insert(linha);
      const { error } = await query;
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["library-templates"] });
    },
  });
}

export function useExcluirModelo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("library_templates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["library-templates"] });
    },
  });
}

export function useSalvarCategoria() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id?: string; label: string; escopo: ModeloEscopo }) => {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id ?? null;
      const linha = {
        slug: slugificar(input.label),
        label: input.label.trim(),
        escopo: input.escopo,
        user_id: input.escopo === "proprio" ? userId : null,
        status: "publicado",
      };
      const query = input.id
        ? supabase.from("library_categories").update(linha).eq("id", input.id)
        : supabase.from("library_categories").insert(linha);
      const { error } = await query;
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["library-categories"] });
    },
  });
}

export function useExcluirCategoria() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("library_categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["library-categories"] });
    },
  });
}

/** Converte os modelos do banco no formato usado pelos chips da Biblioteca. */
export function modelosDaCategoria(
  modelos: LibraryTemplate[] | undefined,
  categoria: string,
): BibliotecaDoc[] {
  return (modelos ?? [])
    .filter((m) => m.categoria_slug === categoria && m.status === "publicado")
    .map((m) => ({
      value: m.slug,
      label: m.label,
      ...(m.pede_procedimento ? { procedimento: true } : {}),
      grupo: m.grupo ?? (m.escopo === "proprio" ? "Meus modelos" : "Novos modelos"),
    }));
}
