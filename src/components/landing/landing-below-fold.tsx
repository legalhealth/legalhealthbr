import { CandidaturaForm } from "@/components/landing/candidatura-form";
import {
  Beneficios,
  ComoFunciona,
  CtaFinal,
  FaqSection,
  Limites,
  Plataforma,
  Problema,
  QuemPode,
  Responsabilidades,
  SerEmbaixador,
  Vantagens,
} from "@/components/landing/landing-sections";

/**
 * Tudo abaixo da dobra em um único chunk carregado sob demanda (proximidade da
 * viewport ou primeira interação), para não pesar no LCP/TBT do hero.
 */
export default function LandingBelowFold() {
  return (
    <>
      <Problema />
      <Plataforma />
      <SerEmbaixador />
      <Vantagens />
      <Beneficios />
      <ComoFunciona />
      <Responsabilidades />
      <QuemPode />
      <Limites />

      <section id="candidatura" className="scroll-mt-20 border-t border-border bg-card/30">
        <div className="mx-auto max-w-3xl px-5 py-16 md:px-8 md:py-20">
          <p className="text-[0.62rem] uppercase tracking-[0.28em] text-gold">Candidatura</p>
          <h2 className="mt-3 font-display text-[1.8rem] leading-tight tracking-tight text-foreground md:text-[2.3rem]">
            Envie seu interesse em ser Embaixador.
          </h2>
          <p className="mt-4 text-[0.95rem] leading-relaxed text-muted-foreground">
            Pedimos apenas contato e área de atuação. Não solicitamos CRM, número de conselho, dados
            de pacientes ou documentos sensíveis nesta etapa.
          </p>
          <div className="mt-8">
            <CandidaturaForm />
          </div>
        </div>
      </section>

      <FaqSection />
      <CtaFinal />
    </>
  );
}
