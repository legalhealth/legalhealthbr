import { Link } from "@tanstack/react-router";
import { ArrowRight, BadgeCheck, ClipboardList, Gauge, MessagesSquare } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SITUACAO_LABEL, type SituacaoBeneficio } from "@/lib/embaixadores";
import { track } from "@/lib/analytics";

/**
 * Conteúdo acima da dobra: mantido em módulo próprio e leve para o LCP,
 * sem dependências de formulário, accordion ou chatbot.
 */
function SituacaoTag({ situacao }: { situacao: SituacaoBeneficio }) {
  const tone =
    situacao === "disponivel"
      ? "border-success/40 text-success"
      : situacao === "piloto"
        ? "border-gold/40 text-gold"
        : situacao === "em-breve"
          ? "border-border text-subtle"
          : "border-warning/40 text-warning";
  return (
    <span
      className={`shrink-0 rounded-full border px-2 py-0.5 text-[0.6rem] uppercase tracking-[0.12em] ${tone}`}
    >
      {SITUACAO_LABEL[situacao]}
    </span>
  );
}

/* ---------------------------------- Hero ---------------------------------- */

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 md:px-8 md:py-24 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div>
          <p className="text-[0.62rem] uppercase tracking-[0.28em] text-gold">
            Programa de Embaixadores Legal Health
          </p>
          <h1 className="mt-5 font-display text-[2.1rem] leading-[1.12] tracking-tight text-foreground md:text-[3.1rem]">
            Ajude a construir uma nova forma de cuidar dos riscos jurídicos na saúde.
          </h1>
          <p className="mt-6 max-w-xl text-[0.98rem] leading-relaxed text-muted-foreground">
            Use a Legal Health durante três meses, organize melhor os pontos de atenção da sua
            prática e participe da evolução de uma plataforma criada para tornar a prevenção
            jurídica mais clara e acessível aos profissionais da saúde.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button
              asChild
              className="gold-gradient h-12 rounded-xl px-6 text-[0.95rem] font-medium text-primary-foreground shadow-[var(--shadow-gold)] hover:brightness-105"
            >
              <a href="#candidatura" onClick={() => track("hero_cta_click", { origem: "hero" })}>
                Quero ser Embaixador Legal Health
                <ArrowRight className="ml-1 h-4 w-4" />
              </a>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-12 rounded-xl border-border px-6 text-[0.95rem] hover:bg-accent"
            >
              <a href="#plataforma" onClick={() => track("platform_cta_click", { origem: "hero" })}>
                Conhecer a plataforma
              </a>
            </Button>
            <Button
              asChild
              variant="ghost"
              className="h-12 rounded-xl px-6 text-[0.95rem] text-gold hover:bg-gold/10 hover:text-gold-light"
            >
              <Link to="/auth" onClick={() => track("login_click", { origem: "hero" })}>
                Já sou cadastrado · Entrar
              </Link>
            </Button>
          </div>

          <p className="mt-6 text-xs leading-relaxed text-subtle">
            Programa piloto · Vagas e critérios sujeitos ao regulamento · A plataforma não substitui
            advogado
          </p>
        </div>

        <HeroComposicao />
      </div>
    </section>
  );
}

function HeroComposicao() {
  const pilares = [
    { nome: "Documentação", valor: 78 },
    { nome: "Consentimento", valor: 62 },
    { nome: "Privacidade e LGPD", valor: 54 },
    { nome: "Comunicação e publicidade", valor: 71 },
    { nome: "Relação com pacientes", valor: 66 },
  ];

  return (
    <div className="space-y-4" role="group" aria-label="Exemplo ilustrativo da plataforma">
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[0.6rem] uppercase tracking-[0.2em] text-subtle">Juriscore®</p>
            <p className="mt-2 font-display text-4xl text-foreground">66</p>
            <p className="mt-1 text-xs text-muted-foreground">Atenção moderada</p>
          </div>
          <span className="rounded-full border border-border px-2 py-0.5 text-[0.6rem] uppercase tracking-[0.12em] text-subtle">
            Exemplo ilustrativo
          </span>
        </div>
        <ul className="mt-6 space-y-3">
          {pilares.map((p) => (
            <li key={p.nome}>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{p.nome}</span>
                <span className="text-subtle">{p.valor}</span>
              </div>
              <div className="mt-1.5 h-1 rounded-full bg-border">
                <div
                  className="h-1 rounded-full bg-gold"
                  style={{ width: `${p.valor}%` }}
                  aria-hidden="true"
                />
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5">
          <ClipboardList className="h-5 w-5 text-gold" aria-hidden="true" />
          <p className="mt-3 text-sm font-medium text-foreground">Plano de ação</p>
          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
            Prioridades organizadas por risco e prazo, com fundamentação nas fontes oficiais
            indexadas. Exemplo ilustrativo.
          </p>
        </div>
        <div className="rounded-2xl border border-gold/25 bg-card p-5">
          <BadgeCheck className="h-5 w-5 text-gold" aria-hidden="true" />
          <p className="mt-3 text-sm font-medium text-foreground">Experiência de 3 meses</p>
          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
            Conhecer, usar e participar. Recursos liberados conforme o regulamento do piloto.
          </p>
        </div>
      </div>
    </div>
  );
}

/* --------------------------- Clareza imediata (3 benefícios) --------------------------- */

export function TrustBar() {
  const itens: { icon: typeof ShieldCheck; texto: string; situacao: SituacaoBeneficio }[] = [
    {
      icon: BadgeCheck,
      texto: "Experimente a plataforma por três meses",
      situacao: "piloto",
    },
    {
      icon: Gauge,
      texto: "Conheça seu ponto de partida preventivo",
      situacao: "disponivel",
    },
    {
      icon: MessagesSquare,
      texto: "Envie feedback diretamente à equipe",
      situacao: "piloto",
    },
  ];
  return (
    <section className="border-b border-border bg-card/40">
      <ul className="mx-auto grid max-w-7xl gap-4 px-5 py-8 md:grid-cols-3 md:px-8">
        {itens.map(({ icon: Icon, texto, situacao }) => (
          <li
            key={texto}
            className="flex items-start gap-3 rounded-2xl border border-border bg-card p-5"
          >
            <Icon className="mt-0.5 h-5 w-5 shrink-0 text-gold" aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-sm leading-relaxed text-foreground">{texto}</p>
              <p className="mt-2">
                <SituacaoTag situacao={situacao} />
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
