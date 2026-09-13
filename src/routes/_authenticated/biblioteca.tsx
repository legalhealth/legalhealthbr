import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Sparkles } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { PageShell } from "@/components/layout/page-shell";
import { AiDisclaimer } from "@/components/ia/ai-disclaimer";
import { EnviarRevisaoDialog } from "@/components/ia/enviar-revisao-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { saveHistoryItem } from "@/lib/ia-history";
import { useCriarEvento, usePacientes } from "@/lib/pacientes";
import { ListaPacientes } from "@/components/pacientes/lista-pacientes";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BIBLIOTECA_CATEGORIAS,
  categoriaLabel,
  docsDaCategoria,
  gruposDaCategoria,
  streamBibliotecaDoc,
  type BibliotecaCategoria,
} from "@/lib/biblioteca";

export const Route = createFileRoute("/_authenticated/biblioteca")({
  validateSearch: (search: Record<string, unknown>): { cat?: string; doc?: string } => ({
    ...(typeof search["cat"] === "string" ? { cat: search["cat"] } : {}),
    ...(typeof search["doc"] === "string" ? { doc: search["doc"] } : {}),
  }),
  head: () => ({
    meta: [
      { title: "Biblioteca Inteligente | Legal Health" },
      {
        name: "description",
        content:
          "Minutas, protocolos e checklists jurídicos gerados por IA sob medida para a sua especialidade médica.",
      },
      { property: "og:title", content: "Biblioteca Inteligente | Legal Health" },
      {
        property: "og:description",
        content:
          "Minutas, protocolos e checklists jurídicos gerados por IA sob medida para a sua especialidade médica.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Page,
});

function Page() {
  const search = Route.useSearch();
  const modoPacientes = search.cat === "pacientes";
  const categoriaInicial = BIBLIOTECA_CATEGORIAS.some((c) => c.value === search.cat)
    ? (search.cat as BibliotecaCategoria)
    : "minutas";
  const docsIniciais = docsDaCategoria(categoriaInicial);
  const [aba, setAba] = useState<BibliotecaCategoria | "pacientes">(
    modoPacientes ? "pacientes" : categoriaInicial,
  );
  const [categoria, setCategoria] = useState<BibliotecaCategoria>(categoriaInicial);
  const [documento, setDocumento] = useState(
    docsIniciais.find((d) => d.value === search.doc)?.value ?? docsIniciais[0]!.value,
  );
  const [nome, setNome] = useState("");
  const [crm, setCrm] = useState("");
  const [especialidade, setEspecialidade] = useState("");
  const [cidade, setCidade] = useState("");
  const [procedimento, setProcedimento] = useState("");
  const [pacienteId, setPacienteId] = useState<string>("");
  const [draft, setDraft] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [docId, setDocId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const draftRef = useRef<HTMLElement | null>(null);
  const gerandoRef = useRef(false);

  const { data: pacientes } = usePacientes();
  const criarEvento = useCriarEvento();

  const docs = useMemo(() => docsDaCategoria(categoria), [categoria]);
  const grupos = useMemo(() => gruposDaCategoria(categoria), [categoria]);
  const docAtual = docs.find((d) => d.value === documento) ?? docs[0]!;

  const { data: profile } = useQuery({
    queryKey: ["profile-biblioteca"],
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!userId) return null;
      const { data } = await supabase
        .from("profiles")
        .select("nome, crm, especialidade, cidade")
        .eq("user_id", userId)
        .maybeSingle();
      return data ?? null;
    },
  });

  useEffect(() => {
    if (!profile) return;
    setNome((v) => v || (profile.nome ?? ""));
    setCrm((v) => v || (profile.crm ?? ""));
    setEspecialidade((v) => v || (profile.especialidade ?? ""));
    setCidade((v) => v || (profile.cidade ?? ""));
  }, [profile]);

  function trocarCategoria(value: BibliotecaCategoria) {
    setAba(value);
    setCategoria(value);
    setDocumento(docsDaCategoria(value)[0]!.value);
  }

  async function handleGenerate() {
    if (gerandoRef.current) return;
    gerandoRef.current = true;
    setGenerating(true);
    setError(null);
    setDocId(null);
    setDraft("");
    let text = "";
    try {
      text = await streamBibliotecaDoc(
        {
          categoria,
          documento,
          documentoLabel: docAtual.label,
          nome,
          crm,
          especialidade,
          cidade,
          ...(docAtual.procedimento ? { procedimento } : {}),
        },
        (chunk) => setDraft((prev) => (prev ?? "") + chunk),
      );
      requestAnimationFrame(() => draftRef.current?.scrollIntoView({ behavior: "smooth" }));

      const savedId = await saveHistoryItem({
        origem: "biblioteca",
        tipo: docAtual.label,
        titulo: `${categoriaLabel(categoria)} — ${docAtual.label}`,
        conteudo: text,
        ...(pacienteId ? { patientId: pacienteId } : {}),
      });
      setDocId(savedId);
      if (pacienteId) {
        await criarEvento.mutateAsync({
          patientId: pacienteId,
          tipo: "minuta",
          titulo: docAtual.label,
          descricao: categoriaLabel(categoria),
          ...(savedId ? { docId: savedId } : {}),
        });
      }
      toast.success(
        pacienteId
          ? "Documento gerado, salvo no histórico e vinculado ao paciente."
          : "Documento gerado e salvo no histórico.",
      );
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Falha ao gerar o documento. Tente novamente.";
      setError(message);
      if (!text) setDraft(null);
    } finally {
      setGenerating(false);
      gerandoRef.current = false;
    }
  }

  return (
    <PageShell
      title="Biblioteca Inteligente"
      description="Minutas, protocolos e checklists gerados sob medida para a sua especialidade, com base nas normas do CFM, LGPD e Código de Ética Médica."
    >
      <div className="mt-8 space-y-6 pb-[calc(var(--bottom-nav-h)+env(safe-area-inset-bottom)+4.5rem)] lg:pb-0">
        {/* Categorias */}
        <div className="grid grid-cols-2 gap-3 md:flex md:flex-wrap">
          {BIBLIOTECA_CATEGORIAS.map((c) => (
            <Button
              key={c.value}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => trocarCategoria(c.value)}
              className={cn(
                "rounded-xl px-5",
                aba === c.value
                  ? "border-gold/50 bg-gold/10 text-gold hover:bg-gold/15 hover:text-gold"
                  : "border-border bg-transparent text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              {c.label}
            </Button>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setAba("pacientes")}
            className={cn(
              "rounded-xl px-5",
              aba === "pacientes"
                ? "border-gold/50 bg-gold/10 text-gold hover:bg-gold/15 hover:text-gold"
                : "border-border bg-transparent text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            )}
          >
            <UserRound aria-hidden="true" />
            Pacientes
          </Button>
        </div>

        {aba === "pacientes" ? <ListaPacientes /> : null}

        {/* Painel de geração */}
        <section
          className={cn("rounded-2xl glass-card p-5 md:p-6", aba === "pacientes" && "hidden")}
        >
          <div className="space-y-5">
            {grupos.map((grupo) => (
              <div key={grupo.label || "documentos"} className="space-y-2.5">
                {grupo.label ? (
                  <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground/70">
                    {grupo.label}
                  </p>
                ) : null}
                <div className="flex flex-wrap gap-3">
                  {grupo.docs.map((d) => (
                    <Button
                      key={d.value}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setDocumento(d.value)}
                      className={cn(
                        "h-auto whitespace-normal rounded-xl px-4 py-2 text-left text-xs",
                        documento === d.value
                          ? "border-gold/50 bg-gold/10 text-gold hover:bg-gold/15 hover:text-gold"
                          : "border-border bg-transparent text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                      )}
                    >
                      {d.label}
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 grid gap-4 pr-12 sm:grid-cols-2 lg:grid-cols-5 2xl:pr-0">
            <div className="space-y-2">
              <Label htmlFor="bib-nome" className="text-xs text-muted-foreground">
                Nome do profissional
              </Label>
              <Input
                id="bib-nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Dr(a). ..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bib-crm" className="text-xs text-muted-foreground">
                CRM / UF
              </Label>
              <Input
                id="bib-crm"
                value={crm}
                onChange={(e) => setCrm(e.target.value)}
                placeholder="CRM-PB 00000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bib-esp" className="text-xs text-muted-foreground">
                Especialidade
              </Label>
              <Input
                id="bib-esp"
                value={especialidade}
                onChange={(e) => setEspecialidade(e.target.value)}
                placeholder="Dermatologia"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bib-cidade" className="text-xs text-muted-foreground">
                Cidade / UF
              </Label>
              <Input
                id="bib-cidade"
                value={cidade}
                onChange={(e) => setCidade(e.target.value)}
                placeholder="João Pessoa/PB"
              />
            </div>
            {docAtual.procedimento ? (
              <div className="space-y-2">
                <Label htmlFor="bib-proc" className="text-xs text-muted-foreground">
                  Procedimento
                </Label>
                <Input
                  id="bib-proc"
                  value={procedimento}
                  onChange={(e) => setProcedimento(e.target.value)}
                  placeholder="Ex.: preenchimento facial"
                />
              </div>
            ) : null}
            {pacientes?.length ? (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Vincular ao paciente</Label>
                <Select
                  value={pacienteId || "nenhum"}
                  onValueChange={(v) => setPacienteId(v === "nenhum" ? "" : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Nenhum" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nenhum">Nenhum</SelectItem>
                    {pacientes.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}
          </div>

          <Button
            onClick={() => void handleGenerate()}
            disabled={generating}
            className="mt-6 gold-gradient text-background shadow-[var(--shadow-gold)] hover:shadow-[var(--shadow-gold-lg)] hover:brightness-105"
          >
            {generating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            {generating ? "Gerando documento..." : "Gerar com IA"}
          </Button>

          {error ? <p className="mt-4 text-sm text-danger">{error}</p> : null}
        </section>

        {draft !== null && aba !== "pacientes" ? (
          <section ref={draftRef} className="rounded-2xl glass-card p-6">
            <h2 className="font-display text-lg text-foreground">
              {generating ? "Gerando…" : docAtual.label}
            </h2>
            <pre className="mt-4 whitespace-pre-wrap font-sans text-sm leading-relaxed text-muted-foreground">
              {draft || "Aguardando a IA…"}
            </pre>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button
                variant="outline"
                size="sm"
                disabled={generating || !draft}
                className="border-gold/40 bg-transparent text-gold hover:bg-gold/10"
                onClick={() => {
                  void navigator.clipboard.writeText(draft);
                  toast.success("Documento copiado.");
                }}
              >
                Copiar texto
              </Button>
              {!generating && draft && docId ? (
                <EnviarRevisaoDialog
                  docId={docId}
                  titulo={`${categoriaLabel(categoria)} — ${docAtual.label}`}
                  conteudo={draft}
                />
              ) : null}
            </div>
          </section>
        ) : null}

        <AiDisclaimer />
      </div>
    </PageShell>
  );
}
