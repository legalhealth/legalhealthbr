import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2, Mail, UserPlus, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { convidarAssistente, reenviarConvite } from "@/lib/clinica.functions";
import {
  useAlterarAssistente,
  useCancelarConvite,
  useEquipe,
  useRemoverAssistente,
} from "@/lib/clinica";

/** Assistentes da clínica: convite por e-mail e controle de acesso. */
export function EquipeClinica() {
  const queryClient = useQueryClient();
  const equipe = useEquipe();
  const convidar = useServerFn(convidarAssistente);
  const reenviar = useServerFn(reenviarConvite);
  const alterar = useAlterarAssistente();
  const remover = useRemoverAssistente();
  const cancelar = useCancelarConvite();

  const [email, setEmail] = useState("");
  const [nome, setNome] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [reenviando, setReenviando] = useState<string | null>(null);

  const handleReenviar = async (id: string) => {
    if (reenviando) return;
    setReenviando(id);
    try {
      const r = await reenviar({ data: { id } });
      await queryClient.invalidateQueries({ queryKey: ["clinica"] });
      if (r.enviado) {
        toast.success("Convite reenviado", {
          description: "Um novo link, válido por 7 dias, foi enviado por e-mail.",
        });
      } else {
        await navigator.clipboard?.writeText(r.link).catch(() => undefined);
        toast.warning("Novo link criado, mas o e-mail não saiu", {
          description: `${r.aviso ?? ""} O link foi copiado para você enviar por outro canal.`,
        });
      }
    } catch (err) {
      toast.error("Não foi possível reenviar", {
        description: err instanceof Error ? err.message : "Tente novamente.",
      });
    } finally {
      setReenviando(null);
    }
  };

  const handleConvidar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (enviando) return;
    setEnviando(true);
    try {
      const r = await convidar({ data: { email, nome } });
      setEmail("");
      setNome("");
      await queryClient.invalidateQueries({ queryKey: ["clinica"] });
      if (r.enviado) {
        toast.success("Convite enviado", {
          description: "A pessoa recebeu o link por e-mail e tem 7 dias para aceitar.",
        });
      } else {
        await navigator.clipboard?.writeText(r.link).catch(() => undefined);
        toast.warning("Convite criado, mas o e-mail não saiu", {
          description: `${r.aviso ?? ""} O link foi copiado para você enviar por outro canal.`,
        });
      }
    } catch (err) {
      toast.error("Não foi possível convidar", {
        description: err instanceof Error ? err.message : "Tente novamente.",
      });
    } finally {
      setEnviando(false);
    }
  };

  const membros = equipe.data?.membros ?? [];
  const convites = equipe.data?.convites ?? [];

  return (
    <Card className="rounded-2xl glass-card shadow-none">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg font-medium text-foreground">
          <Users className="h-5 w-5 text-gold" />
          Equipe da clínica
        </CardTitle>
        <CardDescription>
          Convide o assistente para ver e cadastrar fichas e triagens dos seus pacientes. Ele não vê
          assinatura, configurações nem pode excluir registros.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <form onSubmit={handleConvidar} className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="assist-nome">Nome (opcional)</Label>
            <Input
              id="assist-nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Carla Souza"
              maxLength={120}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="assist-email">E-mail do assistente</Label>
            <Input
              id="assist-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="assistente@clinica.com.br"
              required
            />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={enviando} className="rounded-xl">
              {enviando ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <UserPlus className="h-4 w-4" />
              )}
              Enviar convite
            </Button>
          </div>
        </form>

        {convites.length > 0 && (
          <>
            <Separator />
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.18em] text-subtle">Convites</p>
              {convites.map((c) => (
                <div
                  key={c.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm text-foreground">
                      <Mail className="mr-2 inline h-3.5 w-3.5 text-gold" aria-hidden="true" />
                      {c.email}
                    </p>
                    <p className="text-xs text-subtle">
                      {c.status === "expirado"
                        ? "Expirado — reenvie para gerar novo link"
                        : `Válido até ${new Date(c.expires_at).toLocaleDateString("pt-BR")}`}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {c.status === "expirado" ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="rounded-lg"
                        disabled={reenviando === c.id}
                        onClick={() => void handleReenviar(c.id)}
                      >
                        {reenviando === c.id ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                        Reenviar
                      </Button>
                    ) : null}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="rounded-lg text-muted-foreground"
                      onClick={() => cancelar.mutate({ id: c.id, email: c.email })}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <Separator />
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.18em] text-subtle">Assistentes com acesso</p>
          {equipe.isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando…</p>
          ) : membros.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Ninguém com acesso ainda. Use o convite acima.
            </p>
          ) : (
            membros.map((m) => (
              <div
                key={m.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm text-foreground">{m.nome || "Assistente"}</p>
                  <p className="text-xs text-subtle">
                    {m.status === "ativo" ? "Acesso ativo" : "Acesso pausado"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-lg"
                    onClick={() =>
                      alterar.mutate({
                        id: m.id,
                        status: m.status === "ativo" ? "inativo" : "ativo",
                      })
                    }
                  >
                    {m.status === "ativo" ? "Pausar" : "Reativar"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="rounded-lg text-danger"
                    onClick={() =>
                      remover.mutate({ id: m.id, ...(m.nome ? { nome: m.nome } : {}) })
                    }
                  >
                    Remover
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
