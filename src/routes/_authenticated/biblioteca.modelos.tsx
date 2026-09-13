import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Plus, Trash2 } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BIBLIOTECA_CATEGORIAS } from "@/lib/biblioteca-catalogo";
import {
  useCategoriasModelos,
  useExcluirCategoria,
  useExcluirModelo,
  useModelos,
  useSalvarCategoria,
  useSalvarModelo,
  type LibraryTemplate,
  type ModeloEscopo,
} from "@/lib/library-templates";

export const Route = createFileRoute("/_authenticated/biblioteca/modelos")({
  head: () => ({
    meta: [
      { title: "Administrar modelos | Legal Health" },
      {
        name: "description",
        content: "Crie, edite e publique minutas e categorias da Biblioteca Inteligente.",
      },
      { property: "og:title", content: "Administrar modelos | Legal Health" },
      {
        property: "og:description",
        content: "Crie, edite e publique minutas e categorias da Biblioteca Inteligente.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Page,
});

function Page() {
  const modelos = useModelos();
  const categorias = useCategoriasModelos();
  const salvarModelo = useSalvarModelo();
  const excluirModelo = useExcluirModelo();
  const salvarCategoria = useSalvarCategoria();
  const excluirCategoria = useExcluirCategoria();

  const { data: ehAdmin } = useQuery({
    queryKey: ["is-admin"],
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!userId) return false;
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle();
      return Boolean(data);
    },
  });

  const [editando, setEditando] = useState<LibraryTemplate | null>(null);
  const [label, setLabel] = useState("");
  const [categoria, setCategoria] = useState("minutas");
  const [grupo, setGrupo] = useState("");
  const [instrucoes, setInstrucoes] = useState("");
  const [pedeProcedimento, setPedeProcedimento] = useState(false);
  const [escopo, setEscopo] = useState<ModeloEscopo>("proprio");
  const [publicar, setPublicar] = useState(true);
  const [novaCategoria, setNovaCategoria] = useState("");

  const opcoesCategoria = [
    ...BIBLIOTECA_CATEGORIAS.map((c) => ({ value: c.value as string, label: c.label })),
    ...(categorias.data ?? []).map((c) => ({ value: c.slug, label: c.label })),
  ].filter((item, i, arr) => arr.findIndex((o) => o.value === item.value) === i);

  function limpar() {
    setEditando(null);
    setLabel("");
    setGrupo("");
    setInstrucoes("");
    setPedeProcedimento(false);
    setPublicar(true);
  }

  function editar(m: LibraryTemplate) {
    setEditando(m);
    setLabel(m.label);
    setCategoria(m.categoria_slug);
    setGrupo(m.grupo ?? "");
    setInstrucoes(m.instrucoes ?? "");
    setPedeProcedimento(m.pede_procedimento);
    setEscopo(m.escopo as ModeloEscopo);
    setPublicar(m.status === "publicado");
  }

  async function submeter(e: React.FormEvent) {
    e.preventDefault();
    if (!label.trim()) {
      toast.error("Dê um nome ao modelo.");
      return;
    }
    try {
      await salvarModelo.mutateAsync({
        ...(editando ? { id: editando.id } : {}),
        label,
        categoria_slug: categoria,
        grupo,
        instrucoes,
        pede_procedimento: pedeProcedimento,
        escopo,
        status: publicar ? "publicado" : "rascunho",
      });
      toast.success(editando ? "Modelo atualizado." : "Modelo criado.");
      limpar();
    } catch (err) {
      toast.error("Não foi possível salvar", {
        description: err instanceof Error ? err.message : "Tente novamente.",
      });
    }
  }

  const lista = modelos.data ?? [];

  return (
    <PageShell
      title="Administrar modelos"
      description="Crie e edite as minutas que aparecem na Biblioteca — só suas, ou do catálogo oficial se você for do time."
    >
      <div className="mt-8 space-y-6">
        <Button asChild variant="outline" size="sm" className="border-border">
          <Link to="/biblioteca">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para a Biblioteca
          </Link>
        </Button>

        <form onSubmit={submeter} className="rounded-2xl glass-card space-y-5 p-5 md:p-6">
          <h2 className="font-display text-lg text-foreground">
            {editando ? "Editar modelo" : "Novo modelo"}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="mod-label">Nome do modelo</Label>
              <Input
                id="mod-label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Termo de consentimento para laserterapia"
                maxLength={120}
              />
            </div>
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={categoria} onValueChange={setCategoria}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {opcoesCategoria.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="mod-grupo">Subcategoria (opcional)</Label>
              <Input
                id="mod-grupo"
                value={grupo}
                onChange={(e) => setGrupo(e.target.value)}
                placeholder="Consentimentos por especialidade"
                maxLength={80}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="mod-instr">Instruções para a IA (opcional)</Label>
              <Textarea
                id="mod-instr"
                value={instrucoes}
                onChange={(e) => setInstrucoes(e.target.value)}
                rows={4}
                placeholder="O que este documento deve conter, cláusulas obrigatórias, normas a citar…"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-5">
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <Checkbox
                checked={pedeProcedimento}
                onCheckedChange={(v) => setPedeProcedimento(Boolean(v))}
              />
              Pedir o campo “Procedimento”
            </label>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <Checkbox checked={publicar} onCheckedChange={(v) => setPublicar(Boolean(v))} />
              Publicar (aparece nos chips da Biblioteca)
            </label>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <Checkbox
                checked={escopo === "clinica"}
                onCheckedChange={(v) => setEscopo(v ? "clinica" : "proprio")}
              />
              Minuta oficial da clínica (equipe vê na aba Clínica)
            </label>
            {ehAdmin && (
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <Checkbox
                  checked={escopo === "oficial"}
                  onCheckedChange={(v) => setEscopo(v ? "oficial" : "proprio")}
                />
                Catálogo oficial (todos os profissionais)
              </label>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={salvarModelo.isPending} className="rounded-xl">
              {salvarModelo.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              {editando ? "Salvar alterações" : "Criar modelo"}
            </Button>
            {editando && (
              <Button type="button" variant="ghost" className="rounded-xl" onClick={limpar}>
                Cancelar
              </Button>
            )}
          </div>
        </form>

        <section className="rounded-2xl glass-card p-5 md:p-6">
          <h2 className="font-display text-lg text-foreground">Modelos cadastrados</h2>
          {modelos.isLoading ? (
            <p className="mt-4 text-sm text-muted-foreground">Carregando…</p>
          ) : lista.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              Nenhum modelo criado ainda. Os modelos do catálogo original continuam disponíveis na
              Biblioteca.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {lista.map((m) => (
                <div
                  key={m.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm text-foreground">{m.label}</p>
                    <p className="text-xs text-subtle">
                      {m.categoria_slug}
                      {m.grupo ? ` · ${m.grupo}` : ""} ·{" "}
                      {m.escopo === "oficial"
                        ? "oficial"
                        : m.escopo === "clinica"
                          ? "da clínica"
                          : "meu modelo"}{" "}
                      · {m.status === "publicado" ? "publicado" : "rascunho"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-lg"
                      onClick={() => editar(m)}
                    >
                      Editar
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="rounded-lg text-danger"
                      onClick={() => excluirModelo.mutate(m.id)}
                      aria-label={`Excluir ${m.label}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl glass-card p-5 md:p-6">
          <h2 className="font-display text-lg text-foreground">Categorias</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            As categorias originais (Minutas, Protocolos, Checklists) continuam sempre disponíveis.
          </p>
          <div className="mt-4 flex flex-wrap items-end gap-3">
            <div className="min-w-[220px] flex-1 space-y-2">
              <Label htmlFor="cat-nova">Nova categoria</Label>
              <Input
                id="cat-nova"
                value={novaCategoria}
                onChange={(e) => setNovaCategoria(e.target.value)}
                placeholder="Ex.: Odontologia"
                maxLength={60}
              />
            </div>
            <Button
              type="button"
              className="rounded-xl"
              disabled={!novaCategoria.trim() || salvarCategoria.isPending}
              onClick={async () => {
                try {
                  await salvarCategoria.mutateAsync({
                    label: novaCategoria,
                    escopo: ehAdmin ? "oficial" : "proprio",
                  });
                  setNovaCategoria("");
                  toast.success("Categoria criada.");
                } catch (err) {
                  toast.error("Não foi possível criar", {
                    description: err instanceof Error ? err.message : "Tente novamente.",
                  });
                }
              }}
            >
              <Plus className="h-4 w-4" />
              Criar
            </Button>
          </div>

          {(categorias.data?.length ?? 0) > 0 && (
            <>
              <Separator className="my-5" />
              <div className="space-y-3">
                {(categorias.data ?? []).map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border/60 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm text-foreground">{c.label}</p>
                      <p className="text-xs text-subtle">
                        {c.escopo === "oficial" ? "oficial" : "minha categoria"}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="rounded-lg text-danger"
                      onClick={() => excluirCategoria.mutate(c.id)}
                      aria-label={`Excluir ${c.label}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      </div>
    </PageShell>
  );
}
