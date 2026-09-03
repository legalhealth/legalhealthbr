import { Suspense, lazy, useEffect, useRef, useState } from "react";

// Formulário fica abaixo da dobra: carregamos o código apenas quando ele se
// aproxima da viewport, para não pesar no LCP da landing.
const CandidaturaForm = lazy(() =>
  import("@/components/landing/candidatura-form").then((m) => ({ default: m.CandidaturaForm })),
);

export function CandidaturaFormLazy() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    const alvo = ref.current;
    if (!alvo || visivel) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisivel(true);
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) setVisivel(true);
      },
      { rootMargin: "400px" },
    );
    obs.observe(alvo);
    return () => obs.disconnect();
  }, [visivel]);

  return (
    <div ref={ref} className="min-h-[24rem]">
      {visivel ? (
        <Suspense
          fallback={
            <p className="text-sm text-muted-foreground" role="status">
              Carregando formulário de candidatura…
            </p>
          }
        >
          <CandidaturaForm />
        </Suspense>
      ) : null}
    </div>
  );
}
