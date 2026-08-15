import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

export const DOC_TAGS = [
  { value: "prontuario", label: "Prontuário" },
  { value: "termo", label: "Termo de consentimento" },
  { value: "intimacao", label: "Intimação" },
  { value: "contrato", label: "Contrato" },
  { value: "outros", label: "Outros" },
] as const;

export type DocTag = (typeof DOC_TAGS)[number]["value"];

export type DocumentRow = {
  id: string;
  nome: string;
  tag: string;
  mime: string | null;
  size_bytes: number | null;
  storage_path: string;
  texto: string | null;
  created_at: string;
};

export function tagLabel(tag: string): string {
  return DOC_TAGS.find((t) => t.value === tag)?.label ?? "Outros";
}

export function formatSize(bytes: number | null): string {
  if (!bytes) return "—";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function useDocuments() {
  return useQuery({
    queryKey: ["documents"],
    queryFn: async (): Promise<DocumentRow[]> => {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!userId) return [];
      const { data, error } = await supabase
        .from("documents")
        .select("id, nome, tag, mime, size_bytes, storage_path, texto, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useUploadDocuments() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ files, tag }: { files: File[]; tag: DocTag }) => {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!userId) throw new Error("Sem sessão");

      for (const file of files) {
        const path = `${userId}/${Date.now()}-${file.name.replace(/[^\w.\-]/g, "_")}`;
        const { error: uploadError } = await supabase.storage
          .from("documentos")
          .upload(path, file, { contentType: file.type || "application/octet-stream" });
        if (uploadError) throw uploadError;

        const { error: insertError } = await supabase.from("documents").insert({
          user_id: userId,
          nome: file.name,
          tag,
          mime: file.type || null,
          size_bytes: file.size,
          storage_path: path,
        });
        if (insertError) throw insertError;
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });
}

export function useUpdateDocumentTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, tag }: { id: string; tag: DocTag }) => {
      const { error } = await supabase.from("documents").update({ tag }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (doc: DocumentRow) => {
      await supabase.storage.from("documentos").remove([doc.storage_path]);
      const { error } = await supabase.from("documents").delete().eq("id", doc.id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });
}

export async function documentSignedUrl(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from("documentos")
    .createSignedUrl(path, 3600);
  if (error) return null;
  return data.signedUrl;
}