import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

export const DOC_BUCKET = "documents";
export const DOC_MAX_BYTES = 15 * 1024 * 1024;

export const DOC_TAGS = [
  { value: "prontuario", label: "Prontuário" },
  { value: "termo", label: "Termo de consentimento" },
  { value: "intimacao", label: "Intimação" },
  { value: "contrato", label: "Contrato" },
  { value: "outros", label: "Outros" },
] as const;

export type DocTag = (typeof DOC_TAGS)[number]["value"];

export type DocRisco = "alto" | "medio" | "baixo";

export type DocAnalise = {
  tipo_documento: string;
  partes_envolvidas: string[];
  transcricao_essencial: string[];
  pontos_criticos: { titulo: string; descricao: string; risco: DocRisco }[];
  prazos: { descricao: string; data_ou_contagem: string; urgencia: "alta" | "media" | "baixa" }[];
  proximo_passo: string;
};

export type DocumentRow = {
  id: string;
  nome: string;
  tag: string;
  mime: string | null;
  size_bytes: number | null;
  storage_path: string;
  texto: string | null;
  analise: DocAnalise | null;
  analisado_em: string | null;
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
        .select(
          "id, nome, tag, mime, size_bytes, storage_path, texto, analise, analisado_em, created_at",
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as DocumentRow[];
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
        if (file.size > DOC_MAX_BYTES) {
          throw new Error(`${file.name} excede 15 MB.`);
        }
        const path = `${userId}/${Date.now()}-${file.name.replace(/[^\w.\-]/g, "_")}`;
        const { error: uploadError } = await supabase.storage
          .from(DOC_BUCKET)
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
      await supabase.storage.from(DOC_BUCKET).remove([doc.storage_path]);
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
    .from(DOC_BUCKET)
    .createSignedUrl(path, 3600);
  if (error) return null;
  return data.signedUrl;
}

export async function downloadAsDataUrl(path: string): Promise<{ dataUrl: string; mime: string }> {
  const { data, error } = await supabase.storage.from(DOC_BUCKET).download(path);
  if (error || !data) throw new Error("Não foi possível baixar o arquivo para leitura.");
  const mime = data.type || "application/octet-stream";
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Falha ao ler o arquivo."));
    reader.readAsDataURL(data);
  });
  return { dataUrl, mime };
}

/** Envia o documento à rota protegida de leitura por IA e guarda o resultado. */
export function useAnalyzeDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (doc: DocumentRow): Promise<DocAnalise> => {
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;
      if (!token) throw new Error("Sessão expirada. Faça login novamente.");

      const { dataUrl, mime } = await downloadAsDataUrl(doc.storage_path);

      const response = await fetch("/api/ai-documento-leitura", {
        method: "POST",
        headers: { "content-type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: doc.nome, mime: doc.mime ?? mime, dataUrl }),
      });

      if (!response.ok) {
        let message = "A leitura do documento falhou. Tente novamente.";
        try {
          const payload = (await response.json()) as { error?: string };
          if (payload.error) message = payload.error;
        } catch {
          /* sem corpo JSON */
        }
        throw new Error(message);
      }

      const { analise } = (await response.json()) as { analise: DocAnalise };

      await supabase
        .from("documents")
        .update({
          analise: analise as unknown as never,
          analisado_em: new Date().toISOString(),
        })
        .eq("id", doc.id);

      return analise;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });
}