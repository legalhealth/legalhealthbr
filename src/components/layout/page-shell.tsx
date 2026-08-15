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
    <section className="mx-auto max-w-7xl px-5 py-10 md:px-8 md:py-14">
      <h1 className="text-3xl tracking-tight text-foreground md:text-4xl">{title}</h1>
      {description ? (
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      ) : null}
      {children}
    </section>
  );
}
