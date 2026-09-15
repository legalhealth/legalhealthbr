import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { FileSignature, Loader2, Plus, Search, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useCriarPaciente, usePacientes, formatarDataCurta } from "@/lib/pacientes";

export function ListaPacientes() {
  const [busca, setBusca] = useState("");
  const [aberto, setAberto] = useState(false);
  const [nome, setNome] = useState("");
  const [contato, setContato] = useState("");
  const [nascimento, setNascimento] = useState("");
  const [criado, setCriado] = useState<{ id: string; nome: string } | null>(null);
  const navigate = useNavigate();

  const { data: pacientes, isPending } = usePacientes(busca);
  const criar = useCriarPaciente();

  async function handleCriar() {
    if (nome.trim().length < 2) {
      toast.error("Informe o nome do paciente.");
      return;
    }
    try {
      const id = await criar.mutateAsync({
        nome,
        ...(contato ? { contato } : {}),
        ...(nascimento ? { nascimento } : {}),
      });
      toast.success("Paciente cadastrado.");
      setCriado({ id, nome: nome.trim() });
      setAberto(false);
      setNome("");
      setContato("");
      setNascimento("");
    } catch {
      toast.error("Não foi possível cadastrar o paciente.");
    }
  }

  return (
    <section className="rounded-2xl glass-card p-5 md:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar paciente"
            className="pl-9"
            aria-label="Buscar paciente"
          />
        </div>

        <Dialog open={aberto} onOpenChange={setAberto}>
          <DialogTrigger asChild>
            <Button
              size="sm"
              className="gold-gradient text-background shadow-[var(--shadow-gold)] hover:brightness-105"
            >
              <Plus className="mr-2 h-4 w-4" />
              Novo paciente
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo paciente</DialogTitle>
              <DialogDescription>
                O histórico fica guardado sem prazo de expiração e visível apenas para você.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pac-nome">Nome completo</Label>
                <Input id="pac-nome" value={nome} onChange={(e) => setNome(e.target.value)} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="pac-contato">Contato</Label>
                  <Input
                    id="pac-contato"
                    value={contato}
                    onChange={(e) => setContato(e.target.value)}
                    placeholder="Telefone ou e-mail"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pac-nasc">Nascimento</Label>
                  <Input
                    id="pac-nasc"
                    type="date"
                    value={nascimento}
                    onChange={(e) => setNascimento(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={() => void handleCriar()}
                disabled={criar.isPending}
                className="gold-gradient text-background hover:brightness-105"
              >
                {criar.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Cadastrar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={criado !== null} onOpenChange={(v) => !v && setCriado(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Paciente cadastrado</DialogTitle>
            <DialogDescription>
              {criado?.nome} já está na sua lista. O próximo passo é gerar a minuta com os dados da
              clínica no cabeçalho.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button
              className="h-11 w-full gold-gradient text-background hover:brightness-105 sm:h-10 sm:w-auto"
              onClick={() => {
                const id = criado?.id;
                setCriado(null);
                if (id)
                  void navigate({ to: "/biblioteca", search: { cat: "minutas", pac: id } });
              }}
            >
              <FileSignature className="mr-2 h-4 w-4" />
              Gerar minuta deste paciente
            </Button>
            <Button
              variant="outline"
              className="h-11 w-full border-border bg-transparent sm:h-10 sm:w-auto"
              onClick={() => {
                const id = criado?.id;
                setCriado(null);
                if (id) void navigate({ to: "/paciente/$id", params: { id } });
              }}
            >
              Abrir a ficha
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="mt-5 space-y-3">
        {isPending ? (
          <p className="text-sm text-muted-foreground">Carregando pacientes…</p>
        ) : !pacientes?.length ? (
          <p className="text-sm text-muted-foreground">
            Nenhum paciente cadastrado ainda. Comece criando o primeiro para guardar o histórico
            documental e as triagens.
          </p>
        ) : (
          pacientes.map((paciente) => (
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
          ))
        )}
      </div>
    </section>
  );
}
