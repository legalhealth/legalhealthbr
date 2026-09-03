import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  ClipboardList,
  Compass,
  FileSearch,
  Gauge,
  Lightbulb,
  MessagesSquare,
  Share2,
  ShieldCheck,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  FAQ,
  FAQ_EXTRA,
  FASES,
  LIMITES,
  RESPONSABILIDADES,
  SITUACAO_LABEL,
  TABELA_BENEFICIOS,
  type SituacaoBeneficio,
} from "@/lib/embaixadores";
import { track } from "@/lib/analytics";

/** Dispara um evento de analytics uma única vez quando a seção entra na viewport. */
function useVistoUmaVez(evento: "benefits_view" | "ambassador_section_view", secao: string) {
  const ref = useRef<HTMLElement | null>(null);
  const visto = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !visto.current) {
            visto.current = true;
            track(evento, { secao });
          }
        }
      },
      { threshold: 0.3 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [evento, secao]);

  return ref;
}

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

function SectionTitle({ eyebrow, title }: { eyebrow?: string; title: string }) {
  return (
    <div className="max-w-2xl">
      {eyebrow ? (
        <p className="text-[0.62rem] uppercase tracking-[0.28em] text-gold">{eyebrow}</p>
      ) : null}
      <h2 className="mt-3 font-display text-[1.8rem] leading-tight tracking-tight text-foreground md:text-[2.3rem]">
        {title}
      </h2>
    </div>
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
              <a
                href="#plataforma"
                onClick={() => track("platform_cta_click", { origem: "hero" })}
              >
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
    <div className="space-y-4" aria-label="Exemplo ilustrativo da plataforma">
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

/* --------------------------------- Problema --------------------------------- */

export function Problema() {
  const cards = [
    {
      icon: Compass,
      titulo: "Não sabe por onde começar",
      texto: "Transforme dúvidas dispersas em prioridades organizadas.",
    },
    {
      icon: FileSearch,
      titulo: "Quer organizar sua prática",
      texto: "Identifique rotinas e documentos que merecem revisão.",
    },
    {
      icon: Share2,
      titulo: "Quer compartilhar com responsabilidade",
      texto: "Conheça a ferramenta na prática antes de recomendá-la a colegas.",
    },
  ];
  return (
    <section className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-20">
      <SectionTitle
        eyebrow="O contexto"
        title="A prática da saúde exige decisões clínicas. A prevenção jurídica não deveria depender de improviso."
      />
      <p className="mt-5 max-w-2xl text-[0.95rem] leading-relaxed text-muted-foreground">
        Documentação, consentimento, comunicação, publicidade, privacidade e relacionamento com
        pacientes fazem parte da rotina. A Legal Health organiza esses pontos para ajudar o
        profissional a entender o que revisar primeiro.
      </p>
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {cards.map(({ icon: Icon, titulo, texto }) => (
          <div key={titulo} className="rounded-2xl border border-border bg-card p-6">
            <Icon className="h-5 w-5 text-gold" aria-hidden="true" />
            <h3 className="mt-4 text-[0.95rem] font-medium text-foreground">{titulo}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{texto}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------- A plataforma ------------------------------- */

export function Plataforma() {
  const recursos: {
    icon: typeof Gauge;
    titulo: string;
    beneficio: string;
    situacao: SituacaoBeneficio;
  }[] = [
    {
      icon: Gauge,
      titulo: "Juriscore®",
      beneficio:
        "Diagnóstico preventivo em 15 perguntas e cinco pilares: você vê onde está o maior ponto de atenção.",
      situacao: "disponivel",
    },
    {
      icon: MessagesSquare,
      titulo: "Assistente de IA",
      beneficio:
        "Apoio contextualizado com limites claros e fontes oficiais identificadas quando disponíveis.",
      situacao: "disponivel",
    },
    {
      icon: ClipboardList,
      titulo: "Plano de Ação",
      beneficio: "Prioridades organizadas por risco e prazo a partir do seu diagnóstico.",
      situacao: "disponivel",
    },
    {
      icon: FileSearch,
      titulo: "Leitura de documentos",
      beneficio:
        "Leitura assistida de uma intimação ou contrato, sem substituir a revisão jurídica.",
      situacao: "piloto",
    },
    {
      icon: BookOpen,
      titulo: "Biblioteca",
      beneficio: "Modelos, protocolos e checklists para revisar rotinas do consultório ou clínica.",
      situacao: "disponivel",
    },
    {
      icon: Users,
      titulo: "Envio ao advogado",
      beneficio:
        "Encaminhamento organizado dos anexos e do contexto, com comprovante do que foi enviado.",
      situacao: "piloto",
    },
  ];
  return (
    <section id="plataforma" className="scroll-mt-20 border-y border-border bg-card/30">
      <div className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-20">
        <SectionTitle eyebrow="A plataforma" title="Conheça o que a Legal Health organiza." />
        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {recursos.map(({ icon: Icon, titulo, beneficio, situacao }) => (
            <div key={titulo} className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-start justify-between gap-3">
                <Icon className="h-5 w-5 text-gold" aria-hidden="true" />
                <SituacaoTag situacao={situacao} />
              </div>
              <h3 className="mt-4 text-[0.95rem] font-medium text-foreground">{titulo}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{beneficio}</p>
            </div>
          ))}
        </div>
        <p className="mt-8 max-w-2xl text-xs leading-relaxed text-subtle">
          Fontes oficiais identificadas, com revisão profissional quando aplicável. As respostas
          indicam norma, órgão emissor e link oficial para que você possa conferir na fonte.
        </p>
        <div className="mt-6">
          <Link
            to="/auth"
            onClick={() => track("diagnostic_cta_click", { origem: "plataforma" })}
            className="inline-flex items-center gap-2 text-sm text-gold underline underline-offset-4 hover:text-gold-light"
          >
            Criar conta e iniciar o diagnóstico
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* --------------------------- O que é ser embaixador --------------------------- */

export function SerEmbaixador() {
  const ref = useVistoUmaVez("ambassador_section_view", "ser-embaixador");


  const blocos = [
    {
      icon: Compass,
      titulo: "Experimente",
      texto: "Use os recursos disponíveis e conheça o diagnóstico preventivo na sua própria rotina.",
    },
    {
      icon: Lightbulb,
      titulo: "Avalie",
      texto: "Envie feedback sobre clareza, utilidade e experiência de uso.",
    },
    {
      icon: Share2,
      titulo: "Compartilhe",
      texto: "Apresente a plataforma à sua rede apenas de forma ética e transparente.",
    },
  ];

  return (
    <section ref={ref} className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-20">
      <SectionTitle
        eyebrow="O programa"
        title="Ser Embaixador é experimentar, avaliar e ajudar a evoluir."
      />
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {blocos.map(({ icon: Icon, titulo, texto }) => (
          <div key={titulo} className="rounded-2xl border border-border bg-card p-6">
            <Icon className="h-5 w-5 text-gold" aria-hidden="true" />
            <h3 className="mt-4 text-[0.95rem] font-medium text-foreground">{titulo}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{texto}</p>
          </div>
        ))}
      </div>
      <p className="mt-8 rounded-2xl border border-info/30 bg-info/10 p-5 text-sm leading-relaxed text-muted-foreground">
        O embaixador não promete resultados jurídicos, não oferece aconselhamento em nome da Legal
        Health e não substitui advogado.
      </p>
    </section>
  );
}

/* ------------------------------ Vantagens 3 meses ------------------------------ */

export function Vantagens() {
  return (
    <section id="vantagens" className="scroll-mt-20 border-y border-border bg-card/30">
      <div className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-20">
        <SectionTitle eyebrow="Três meses" title="Vantagens organizadas por fase da experiência." />
        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {FASES.map((fase) => (
            <article key={fase.mes} className="glass-card rounded-2xl p-6">
              <div className="flex items-baseline justify-between">
                <p className="text-[0.62rem] uppercase tracking-[0.24em] text-gold">{fase.mes}</p>
              </div>
              <h3 className="mt-3 font-display text-xl text-foreground">{fase.titulo}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{fase.mensagem}</p>
              <ul className="mt-5 space-y-3">
                {fase.beneficios.map((b) => (
                  <li key={b.texto} className="flex items-start justify-between gap-3">
                    <span className="text-sm leading-relaxed text-muted-foreground">{b.texto}</span>
                    <SituacaoTag situacao={b.situacao} />
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
        <p className="mt-8 text-xs text-subtle">
          Benefícios podem variar conforme a fase do programa e o regulamento vigente.
        </p>
      </div>
    </section>
  );
}

/* ------------------------------- Benefícios ------------------------------- */

export function Beneficios() {
  const cards = [
    {
      titulo: "Entenda seu ponto de partida",
      programa: "Acesso de experiência durante o piloto.",
      produto: "Juriscore® para organizar sinais de atenção.",
    },
    {
      titulo: "Tenha mais clareza para decidir",
      programa: "Acompanhamento da equipe durante os três meses.",
      produto: "Plano de ação com prioridades por risco e prazo.",
    },
    {
      titulo: "Conheça a plataforma por dentro",
      programa: "Onboarding orientado no início do programa.",
      produto: "Assistente, biblioteca e leitura de documentos.",
    },
    {
      titulo: "Ajude a melhorar o produto",
      programa: "Canal de sugestões e pesquisas de feedback.",
      produto: "Registro das suas sugestões nas próximas versões.",
    },
    {
      titulo: "Faça parte da fase inicial",
      programa: "Participação na primeira turma, se selecionado.",
      produto: "Uso dos recursos liberados no plano de embaixador.",
    },
  ];
  const ref = useVistoUmaVez("benefits_view", "beneficios");
  return (
    <section ref={ref} className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-20">
      <SectionTitle eyebrow="Benefícios" title="O que o embaixador recebe." />
      <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <div key={c.titulo} className="rounded-2xl border border-border bg-card p-6">
            <h3 className="text-[0.95rem] font-medium text-foreground">{c.titulo}</h3>
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="text-[0.6rem] uppercase tracking-[0.18em] text-gold">
                  Benefício do programa
                </dt>
                <dd className="mt-1 leading-relaxed text-muted-foreground">{c.programa}</dd>
              </div>
              <div>
                <dt className="text-[0.6rem] uppercase tracking-[0.18em] text-subtle">
                  Funcionalidade da plataforma
                </dt>
                <dd className="mt-1 leading-relaxed text-muted-foreground">{c.produto}</dd>
              </div>
            </dl>
          </div>
        ))}
      </div>

      <div className="mt-10 overflow-x-auto rounded-2xl border border-border">
        <table className="w-full min-w-[42rem] border-collapse text-left text-sm">
          <caption className="sr-only">
            Benefícios do programa de Embaixadores, situação atual e observações
          </caption>
          <thead>
            <tr className="border-b border-border bg-card/60">
              <th scope="col" className="px-5 py-3 text-xs uppercase tracking-[0.14em] text-subtle">
                Benefício
              </th>
              <th scope="col" className="px-5 py-3 text-xs uppercase tracking-[0.14em] text-subtle">
                Situação
              </th>
              <th scope="col" className="px-5 py-3 text-xs uppercase tracking-[0.14em] text-subtle">
                Observação
              </th>
            </tr>
          </thead>
          <tbody>
            {TABELA_BENEFICIOS.map((linha) => (
              <tr key={linha.beneficio} className="border-b border-border/70 last:border-0">
                <th scope="row" className="px-5 py-4 font-medium text-foreground">
                  {linha.beneficio}
                </th>
                <td className="px-5 py-4">
                  <SituacaoTag situacao={linha.situacao} />
                </td>
                <td className="px-5 py-4 leading-relaxed text-muted-foreground">
                  {linha.observacao}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-xs leading-relaxed text-subtle">
        Condições comerciais ainda em definição serão informadas no regulamento antes da
        participação. Nenhum benefício futuro é apresentado como garantido.
      </p>
    </section>
  );
}

/* --------------------------- Responsabilidades --------------------------- */

export function Responsabilidades() {
  return (
    <section className="border-y border-border bg-card/30">
      <div className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-20">
        <SectionTitle eyebrow="Compromissos" title="O que se espera do embaixador." />
        <ul className="mt-10 grid gap-3 md:grid-cols-2">
          {RESPONSABILIDADES.map((item) => (
            <li
              key={item}
              className="flex items-start gap-3 rounded-2xl border border-border bg-card p-5 text-sm leading-relaxed text-muted-foreground"
            >
              <ClipboardList className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden="true" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ------------------------------- Limites ------------------------------- */

export function Limites() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-20">
      <SectionTitle eyebrow="Transparência" title="Conheça os limites antes de participar." />
      <ul className="mt-10 grid gap-3 md:grid-cols-2">
        {LIMITES.map((item) => (
          <li
            key={item}
            className="flex items-start gap-3 rounded-2xl border border-warning/25 bg-card p-5 text-sm leading-relaxed text-muted-foreground"
          >
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden="true" />
            {item}
          </li>
        ))}
      </ul>
      <p className="mt-6 text-xs leading-relaxed text-subtle">
        Não exibimos depoimentos, selos, número de usuários ou logos de parceiros: nada será
        apresentado como prova sem autorização e comprovação.
      </p>
    </section>
  );
}

/* ------------------------------ Como funciona ------------------------------ */

export function ComoFunciona() {
  const passos = [
    { titulo: "Candidate-se", texto: "Preencha seu interesse e área de atuação." },
    { titulo: "Conheça os critérios", texto: "Leia o regulamento, responsabilidades e limites." },
    { titulo: "Use por três meses", texto: "Experimente os recursos liberados no piloto." },
    { titulo: "Compartilhe seu feedback", texto: "Ajude a decidir o que deve evoluir." },
  ];
  return (
    <section id="como-funciona" className="scroll-mt-20 border-y border-border bg-card/30">
      <div className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-20">
        <SectionTitle eyebrow="Candidatura" title="Participe em quatro passos." />
        <ol className="mt-10 grid gap-4 md:grid-cols-4">
          {passos.map((p, i) => (
            <li key={p.titulo} className="rounded-2xl border border-border bg-card p-6">
              <span className="wordmark text-2xl text-gold">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="mt-3 text-[0.95rem] font-medium text-foreground">{p.titulo}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.texto}</p>
            </li>
          ))}
        </ol>
        <div className="mt-8">
          <Button
            asChild
            className="gold-gradient h-12 rounded-xl px-6 font-medium text-primary-foreground"
          >
            <a
              href="#candidatura"
              onClick={() => track("hero_cta_click", { origem: "como-funciona" })}
            >
              Quero me candidatar
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------ Quem pode ------------------------------ */

export function QuemPode() {
  const perfis = [
    "Profissionais da saúde em atividade",
    "Quem atua em consultório, clínica ou atendimento remoto",
    "Quem tem interesse em prevenção e organização da prática",
    "Criadores de conteúdo e líderes de comunidades profissionais",
  ];
  const criterios = [
    "Ter interesse real em testar a plataforma",
    "Concordar com o regulamento do programa",
    "Não divulgar promessas não autorizadas",
    "Não inserir dados de pacientes na candidatura",
    "Respeitar as normas profissionais e de publicidade da própria categoria",
  ];
  return (
    <section className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-20">
      <SectionTitle eyebrow="Elegibilidade" title="Quem pode se candidatar." />
      <div className="mt-10 grid gap-4 md:grid-cols-2">
        {perfis.map((p) => (
          <div
            key={p}
            className="flex items-start gap-3 rounded-2xl border border-border bg-card p-5 text-sm leading-relaxed text-muted-foreground"
          >
            <Users className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden="true" />
            {p}
          </div>
        ))}
      </div>
      <div className="mt-8 rounded-2xl border border-border bg-card p-6">
        <h3 className="text-[0.95rem] font-medium text-foreground">Critérios transparentes</h3>
        <ul className="mt-4 space-y-2">
          {criterios.map((c) => (
            <li key={c} className="flex items-start gap-3 text-sm leading-relaxed text-muted-foreground">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden="true" />
              {c}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ---------------------------------- FAQ ---------------------------------- */

export function FaqSection() {
  const [aberto, setAberto] = useState<string>("");
  return (
    <section id="faq" className="scroll-mt-20 border-y border-border bg-card/30">
      <div className="mx-auto max-w-3xl px-5 py-16 md:px-8 md:py-20">
        <SectionTitle eyebrow="Dúvidas" title="Perguntas frequentes." />
        <Accordion
          type="single"
          collapsible
          value={aberto}
          onValueChange={(v) => {
            setAberto(v);
            if (v) track("faq_open", { id: v });
          }}
          className="mt-8"
        >
          {[...FAQ, ...FAQ_EXTRA].map((item, i) => (
            <AccordionItem key={item.pergunta} value={`faq-${i + 1}`} className="border-border">
              <AccordionTrigger className="text-left text-[0.95rem] text-foreground hover:text-gold">
                {item.pergunta}
              </AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                {item.resposta}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

/* -------------------------------- CTA final -------------------------------- */

export function CtaFinal() {
  return (
    <section className="mx-auto max-w-3xl px-5 py-16 text-center md:px-8 md:py-20">
      <h2 className="font-display text-[1.8rem] leading-tight tracking-tight text-foreground md:text-[2.3rem]">
        Quer conhecer a Legal Health antes de recomendá-la?
      </h2>
      <p className="mx-auto mt-5 max-w-xl text-[0.95rem] leading-relaxed text-muted-foreground">
        Candidate-se ao programa de Embaixadores e participe dos primeiros três meses de evolução da
        plataforma.
      </p>
      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <Button
          asChild
          className="gold-gradient h-12 rounded-xl px-6 font-medium text-primary-foreground shadow-[var(--shadow-gold)] hover:brightness-105"
        >
          <a href="#candidatura" onClick={() => track("hero_cta_click", { origem: "cta-final" })}>
            Quero ser Embaixador Legal Health
          </a>
        </Button>
        <Button
          asChild
          variant="outline"
          className="h-12 rounded-xl border-border px-6 hover:bg-accent"
        >
          <Link to="/auth" onClick={() => track("login_click", { origem: "cta-final" })}>
            Já sou cadastrado · Entrar
          </Link>
        </Button>
      </div>
      <p className="mt-5 text-xs text-subtle">
        Candidatura sujeita a critérios e disponibilidade. Sem promessa de aprovação ou remuneração
        automática.
      </p>
    </section>
  );
}
