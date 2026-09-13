import { Link } from "@tanstack/react-router";
import { ArrowRight, UserRound } from "lucide-react";

import { usePacientes, formatarDataCurta } from "@/lib/pacientes";

const RECENTES = 5;

export function ResumoPacientes() {
  const { data: pacientes, isPending } = usePacientes();
  const total = pacientes?.length ?? 0;
  const recentes = pacientes?.slice(0, RECENTES) ?? [];

  return (
    <div className="space-y-3">
      {isPending ? (
        <p className="text-sm text-muted-foreground">Carregando pacientes…</p>
      ) : !total ? (
        <p className="text-sm text-muted-foreground">
          Nenhum paciente cadastrado ainda. Cadastre o primeiro na aba Pacientes da Biblioteca para
          guardar o histórico documental e as triagens.
        </p>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">
            {total} paciente{total === 1 ? "" : "s"} cadastrado{total === 1 ? "" : "s"} ·{" "}
            {recentes.length < total ? `mostrando os ${RECENTES} mais recentes` : "lista completa"}
          </p>
          {recentes.map((paciente) => (
            <Link
              key={paciente.id}
              to="/paciente/$id"
              params={{ id: paciente.id }}
              className="flex items-center gap-4 rounded-xl border border-border bg-transparent p-4 transition-colors hover:border-gold/40 hover:bg-gold/5"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gold/30 bg-gold/10 text-gold">
                <UserRound className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm text-foreground">{paciente.nome}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {paciente.contato || "Sem contato"} · Nascimento{" "}
                  {formatarDataCurta(paciente.nascimento)}
                </span>
              </span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {paciente.atendimentos} registro{paciente.atendimentos === 1 ? "" : "s"}
              </span>
            </Link>
          ))}
        </>
      )}

      <Link
        to="/biblioteca"
        search={{ cat: "pacientes" }}
        className="inline-flex items-center gap-1.5 text-sm text-gold transition-colors hover:text-gold/80"
      >
        Ver todos na Biblioteca
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
