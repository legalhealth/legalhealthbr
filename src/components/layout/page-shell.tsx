import type { ReactNode } from "react";

export function PageShell({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <section className="mx-auto max-w-7xl px-5 py-12 md:px-8 md:py-16">
      <span className="gold-rule mb-6" aria-hidden="true" />
      <h1 className="font-display text-3xl leading-tight tracking-tight text-foreground md:text-[2.6rem]">
        {title}
      </h1>
      {description ? (
        <p className="mt-4 max-w-xl text-[0.95rem] leading-relaxed text-muted-foreground">
          {description}
        </p>
      ) : null}
      {children}
    </section>
  );
}
