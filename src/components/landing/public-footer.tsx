import { Link } from "@tanstack/react-router";
import monograma from "@/assets/lh-monograma.png.asset.json";

// Links sempre sublinhados: não dependem apenas da cor para se distinguir do texto.
const linkClass =
  "text-muted-foreground underline underline-offset-4 decoration-border hover:text-foreground hover:decoration-gold";

export function PublicFooter() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-5 py-12 md:px-8">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <img src={monograma.url} alt="Legal Health" className="h-9 w-auto" />
            <p className="mt-4 text-[0.65rem] uppercase tracking-[0.3em] text-gold">
              Antecipe · Decida · Proteja
            </p>
            <p className="mt-4 text-xs leading-relaxed text-subtle">
              A Legal Health organiza pontos de atenção jurídica preventiva. A plataforma não
              substitui advogado nem oferece aconselhamento jurídico individual.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-3">
            <nav aria-label="Plataforma" className="grid gap-2 text-sm">
              <p className="text-xs uppercase tracking-[0.2em] text-subtle">Plataforma</p>
              <a href="#plataforma" className={linkClass}>
                Sobre a plataforma
              </a>
              <a href="#candidatura" className={linkClass}>
                Candidatura
              </a>
              <Link to="/auth" className={linkClass}>
                Entrar
              </Link>
            </nav>

            <nav aria-label="Documentos legais" className="grid gap-2 text-sm">
              <p className="text-xs uppercase tracking-[0.2em] text-subtle">Legal</p>
              <Link to="/termos" className={linkClass}>
                Termos de Uso
              </Link>
              <Link to="/privacidade" className={linkClass}>
                Política de Privacidade
              </Link>
              <Link to="/retencao-de-dados" className={linkClass}>
                Retenção de Dados
              </Link>
              <Link to="/canal-de-privacidade" className={linkClass}>
                Canal de Privacidade
              </Link>
            </nav>

            <div className="grid gap-2 text-sm">
              <p className="text-xs uppercase tracking-[0.2em] text-subtle">Contato</p>
              <a href="mailto:contato@legalhealthbr.app" className={linkClass}>
                contato@legalhealthbr.app
              </a>
              <a href="mailto:privacidade@legalhealthbr.app" className={linkClass}>
                privacidade@legalhealthbr.app
              </a>
            </div>
          </div>
        </div>

        <p className="mt-10 border-t border-border pt-6 text-xs text-subtle">
          © {new Date().getFullYear()} Legal Health. Programa de Embaixadores em fase piloto —
          vagas, recursos e condições sujeitos ao regulamento vigente.
        </p>
      </div>
    </footer>
  );
}
