import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";

import monograma from "@/assets/lh-monograma.png.asset.json";
import { Button } from "@/components/ui/button";
import { track } from "@/lib/analytics";

const links = [
  { href: "#plataforma", label: "A plataforma" },
  { href: "#como-funciona", label: "Como funciona" },
  { href: "#vantagens", label: "Vantagens" },
  { href: "#faq", label: "Perguntas frequentes" },
];

export function PublicHeader() {
  const [open, setOpen] = useState(false);
  const botaoRef = useRef<HTMLButtonElement | null>(null);

  // Fechar por Escape e devolver o foco ao botão que abriu o menu.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        botaoRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3 md:px-8">
        <Link to="/" className="flex min-w-0 items-center gap-3 py-1">
          <img src={monograma.url} alt="" className="h-9 w-auto shrink-0 md:h-10" />
          <span className="min-w-0">
            <span className="block truncate wordmark text-[0.95rem] leading-none text-gold-light md:text-lg">
              Legal Health
            </span>
            <span className="mt-1.5 block truncate text-[0.55rem] uppercase tracking-[0.24em] text-gold md:text-[0.62rem]">
              inteligência jurídica para saúde
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-7 lg:flex" aria-label="Seções da página">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="inline-flex min-h-11 items-center text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden shrink-0 items-center gap-3 lg:flex">
          <Link
            to="/auth"
            onClick={() => track("login_click", { origem: "header" })}
            className="inline-flex min-h-11 items-center rounded-xl border border-border px-4 text-sm text-foreground transition-colors hover:bg-accent"
          >
            Entrar
          </Link>
          <Button
            asChild
            className="gold-gradient inline-flex min-h-11 items-center rounded-xl px-4 text-sm font-medium text-primary-foreground shadow-[var(--shadow-gold)] hover:brightness-105"
          >
            <a href="#candidatura" onClick={() => track("hero_cta_click", { origem: "header" })}>
              Quero ser Embaixador
            </a>
          </Button>
        </div>

        <button
          ref={botaoRef}
          type="button"
          className="grid h-10 w-10 place-items-center rounded-xl border border-border text-foreground lg:hidden"
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          aria-expanded={open}
          aria-controls="menu-publico"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div id="menu-publico" className="border-t border-border bg-background px-5 py-4 lg:hidden">
          <nav aria-label="Seções da página" className="grid gap-1">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-2 py-3 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                {l.label}
              </a>
            ))}
          </nav>
          <div className="mt-3 grid gap-2">
            <Link
              to="/auth"
              onClick={() => {
                track("login_click", { origem: "menu-mobile" });
                setOpen(false);
              }}
              className="rounded-xl border border-border px-4 py-3 text-center text-sm text-foreground"
            >
              Entrar
            </Link>
            <a
              href="#candidatura"
              onClick={() => {
                track("hero_cta_click", { origem: "menu-mobile" });
                setOpen(false);
              }}
              className="gold-gradient rounded-xl px-4 py-3 text-center text-sm font-medium text-primary-foreground"
            >
              Quero ser Embaixador
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
