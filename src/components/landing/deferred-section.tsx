import { Suspense, useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Renderiza o conteúdo (carregado com React.lazy) apenas quando o bloco se
 * aproxima da viewport ou o visitante interage com a página.
 */
export function DeferredSection({
  children,
  minHeight = "20rem",
  fallback = null,
}: {
  children: ReactNode;
  minHeight?: string;
  fallback?: ReactNode;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [ativo, setAtivo] = useState(false);

  useEffect(() => {
    if (ativo) return;
    const alvo = ref.current;
    const liberar = () => setAtivo(true);

    if (!alvo || typeof IntersectionObserver === "undefined") {
      liberar();
      return;
    }

    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) liberar();
      },
      { rootMargin: "200px 0px" },
    );
    obs.observe(alvo);

    const eventos = ["pointerdown", "keydown", "touchstart"] as const;
    eventos.forEach((e) => window.addEventListener(e, liberar, { once: true, passive: true }));

    return () => {
      obs.disconnect();
      eventos.forEach((e) => window.removeEventListener(e, liberar));
    };
  }, [ativo]);

  return (
    <div ref={ref} style={ativo ? undefined : { minHeight }}>
      {ativo ? <Suspense fallback={fallback}>{children}</Suspense> : null}
    </div>
  );
}
