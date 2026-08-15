import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { BookOpen, FileText, Gavel, Search, SlidersHorizontal, Scale } from "lucide-react";

import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export const Route = createFileRoute("/_authenticated/biblioteca")({
  head: () => ({
    meta: [
      { title: "Biblioteca | Legal Health" },
      { name: "description", content: "Modelos, pareceres e normas essenciais para a prática médica." },
      { property: "og:title", content: "Biblioteca | Legal Health" },
      { property: "og:description", content: "Modelos, pareceres e normas essenciais para a prática médica." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Page,
});

const subjects = ["Todos", "Responsabilidade médica", "Consentimento", "Contratos", "LGPD", "Regulatório"];
const types = ["Todos", "Modelo", "Parecer", "Norma", "Jurisprudência"];

const articles = [
  {
    id: "1",
    title: "Modelo de termo de consentimento livre e esclarecido",
    type: "Modelo",
    subject: "Consentimento",
    description: "Template revisado para procedimentos médicos e estéticos, com cláusulas de risco e direitos do paciente.",
    date: "2026-08-10",
  },
  {
    id: "2",
    title: "Responsabilidade civil do médico: entendimento atualizado",
    type: "Parecer",
    subject: "Responsabilidade médica",
    description: "Análise das principais teses do STJ e como aplicá-las na defesa de processos de erro médico.",
    date: "2026-08-05",
  },
  {
    id: "3",
    title: "Lei Geral de Proteção de Dados na clínica médica",
    type: "Norma",
    subject: "LGPD",
    description: "Checklist de adequação para o tratamento de dados de saúde em prontuários e sistemas digitais.",
    date: "2026-07-28",
  },
  {
    id: "4",
    title: "Contrato de prestação de serviços médicos",
    type: "Modelo",
    subject: "Contratos",
    description: "Contrato-base com cláusulas de honorários, responsabilidade, sigilo e rescisão.",
    date: "2026-07-15",
  },
  {
    id: "5",
    title: "Jurisprudência: erro de diagnóstico e nexo causal",
    type: "Jurisprudência",
    subject: "Responsabilidade médica",
    description: "Súmulas e acórdãos recentes sobre prova do nexo de causalidade na responsabilidade médica.",
    date: "2026-07-02",
  },
  {
    id: "6",
    title: "Resoluções do CFM sobre publicidade médica",
    type: "Norma",
    subject: "Regulatório",
    description: "O que pode e não pode ser divulgado em sites, redes sociais e anúncios de clínicas médicas.",
    date: "2026-06-20",
  },
];

const typeIcon: Record<string, React.ReactNode> = {
  Modelo: <FileText className="h-4 w-4" />,
  Parecer: <Scale className="h-4 w-4" />,
  Norma: <Gavel className="h-4 w-4" />,
  Jurisprudência: <BookOpen className="h-4 w-4" />,
};

function Page() {
  const [search, setSearch] = useState("");
  const [subject, setSubject] = useState("Todos");
  const [type, setType] = useState("Todos");

  const filtered = useMemo(() => {
    return articles.filter((a) => {
      const matchesSearch = [a.title, a.description].join(" ").toLowerCase().includes(search.toLowerCase());
      const matchesSubject = subject === "Todos" || a.subject === subject;
      const matchesType = type === "Todos" || a.type === type;
      return matchesSearch && matchesSubject && matchesType;
    });
  }, [search, subject, type]);

  return (
    <PageShell
      title="Biblioteca"
      description="Modelos, pareceres, normas e jurisprudência essenciais para a prática médica."
    >
      <div className="mt-8 space-y-6">
        {/* Filtros */}
        <Card className="border border-border bg-card rounded-2xl shadow-none">
          <CardContent className="p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-end">
              <div className="flex-1 space-y-2">
                <label htmlFor="search" className="text-sm font-medium text-foreground">
                  Buscar
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Título, assunto ou palavra-chave..."
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Assunto</label>
                <div className="flex flex-wrap gap-2">
                  {subjects.map((s) => (
                    <Button
                      key={s}
                      type="button"
                      variant={subject === s ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSubject(s)}
                      className={cn(
                        "rounded-full text-xs",
                        subject === s
                          ? "bg-gold text-primary-foreground hover:bg-gold/90"
                          : "border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      )}
                    >
                      {s}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Tipo</label>
                <div className="flex flex-wrap gap-2">
                  {types.map((t) => (
                    <Button
                      key={t}
                      type="button"
                      variant={type === t ? "default" : "outline"}
                      size="sm"
                      onClick={() => setType(t)}
                      className={cn(
                        "rounded-full text-xs",
                        type === t
                          ? "bg-gold text-primary-foreground hover:bg-gold/90"
                          : "border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      )}
                    >
                      {t}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resultados */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((article) => (
            <Card
              key={article.id}
              className="group border border-border bg-card rounded-2xl shadow-none transition-colors hover:border-gold/50"
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline" className="border-border text-muted-foreground">
                    {typeIcon[article.type]}
                    <span className="ml-1.5">{article.type}</span>
                  </Badge>
                  <span>{article.subject}</span>
                </div>
                <CardTitle className="text-base font-medium leading-snug text-foreground group-hover:text-gold-light transition-colors">
                  {article.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="line-clamp-2 text-sm leading-relaxed">
                  {article.description}
                </CardDescription>
                <Separator className="my-4 bg-border" />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{article.date}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs text-gold hover:bg-gold/10 hover:text-gold"
                  >
                    Abrir
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card py-16 text-center">
            <SlidersHorizontal className="h-8 w-8 text-muted-foreground" />
            <p className="mt-4 text-sm font-medium text-foreground">Nenhum artigo encontrado</p>
            <p className="text-xs text-muted-foreground">Ajuste os filtros ou a busca.</p>
          </div>
        )}
      </div>
    </PageShell>
  );
}

import { cn } from "@/lib/utils";
