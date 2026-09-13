import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Building2, Clock, Copy, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useClinica, useSalvarClinica, type ClinicaInput } from "@/lib/clinica";
import { DIAS_SEMANA, horariosPadrao, type DiaHorario } from "@/lib/clinica-horarios";

const VAZIO: ClinicaInput = {
  nome: null,
  cnpj: null,
  telefone: null,
  email: null,
  responsavel_tecnico: null,
  cep: null,
  logradouro: null,
  numero: null,
  complemento: null,
  bairro: null,
  cidade: null,
  uf: null,
  horarios: horariosPadrao(),
};

function texto(v: string | null): string {
  return v ?? "";
}

function nulo(v: string): string | null {
  const t = v.trim();
  return t ? t : null;
}

/** Dados da clínica: identidade, endereço e horários de atendimento. */
export function DadosClinica() {
  const { data, isLoading } = useClinica();
  const salvar = useSalvarClinica();
  const [form, setForm] = useState<ClinicaInput>(VAZIO);
  const [pronto, setPronto] = useState(false);

  useEffect(() => {
    if (data && !pronto) {
      setForm(data.clinica ? { ...VAZIO, ...data.clinica } : VAZIO);
      setPronto(true);
    }
  }, [data, pronto]);

  if (isLoading || !pronto) {
    return (
      <Card className="rounded-2xl glass-card shadow-none">
        <CardContent className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Carregando dados da clínica…
        </CardContent>
      </Card>
    );
  }

  const ehDono = data?.ehDono ?? false;

  const set = (campo: keyof ClinicaInput, valor: string) =>
    setForm((f) => ({ ...f, [campo]: nulo(valor) }));

  const setHorario = (dia: number, patch: Partial<DiaHorario>) =>
    setForm((f) => ({
      ...f,
      horarios: f.horarios.map((h) => (h.dia === dia ? { ...h, ...patch } : h)),
    }));

  const copiarSegunda = () =>
    setForm((f) => {
      const segunda = f.horarios.find((h) => h.dia === 1);
      if (!segunda) return f;
      return {
        ...f,
        horarios: f.horarios.map((h) =>
          h.dia === 0 || h.dia === 6
            ? h
            : { ...h, aberto: segunda.aberto, abre: segunda.abre, fecha: segunda.fecha },
        ),
      };
    });

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (salvar.isPending) return;
    try {
      await salvar.mutateAsync(form);
      toast.success("Dados da clínica salvos");
    } catch (err) {
      toast.error("Não foi possível salvar", {
        description: err instanceof Error ? err.message : "Tente novamente.",
      });
    }
  };

  return (
    <Card className="rounded-2xl glass-card shadow-none">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg font-medium text-foreground">
          <Building2 className="h-5 w-5 text-gold" />
          Dados da clínica
        </CardTitle>
        <CardDescription>
          Usados no cabeçalho dos documentos gerados na Biblioteca.
          {!ehDono ? " Somente o responsável pela conta pode editar." : ""}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={(e) => void handleSalvar(e)} className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="cl-nome">Nome da clínica</Label>
              <Input
                id="cl-nome"
                value={texto(form.nome)}
                onChange={(e) => set("nome", e.target.value)}
                disabled={!ehDono}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cl-resp">Responsável técnico(a)</Label>
              <Input
                id="cl-resp"
                value={texto(form.responsavel_tecnico)}
                onChange={(e) => set("responsavel_tecnico", e.target.value)}
                disabled={!ehDono}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cl-cnpj">CNPJ</Label>
              <Input
                id="cl-cnpj"
                value={texto(form.cnpj)}
                onChange={(e) => set("cnpj", e.target.value)}
                disabled={!ehDono}
                placeholder="00.000.000/0000-00"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cl-tel">Telefone</Label>
              <Input
                id="cl-tel"
                value={texto(form.telefone)}
                onChange={(e) => set("telefone", e.target.value)}
                disabled={!ehDono}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="cl-email">E-mail da clínica</Label>
              <Input
                id="cl-email"
                type="email"
                value={texto(form.email)}
                onChange={(e) => set("email", e.target.value)}
                disabled={!ehDono}
                className="rounded-xl"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-4">
            <div className="space-y-1.5">
              <Label htmlFor="cl-cep">CEP</Label>
              <Input
                id="cl-cep"
                value={texto(form.cep)}
                onChange={(e) => set("cep", e.target.value)}
                disabled={!ehDono}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="cl-log">Logradouro</Label>
              <Input
                id="cl-log"
                value={texto(form.logradouro)}
                onChange={(e) => set("logradouro", e.target.value)}
                disabled={!ehDono}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cl-num">Número</Label>
              <Input
                id="cl-num"
                value={texto(form.numero)}
                onChange={(e) => set("numero", e.target.value)}
                disabled={!ehDono}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cl-comp">Complemento</Label>
              <Input
                id="cl-comp"
                value={texto(form.complemento)}
                onChange={(e) => set("complemento", e.target.value)}
                disabled={!ehDono}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cl-bairro">Bairro</Label>
              <Input
                id="cl-bairro"
                value={texto(form.bairro)}
                onChange={(e) => set("bairro", e.target.value)}
                disabled={!ehDono}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cl-cid">Cidade</Label>
              <Input
                id="cl-cid"
                value={texto(form.cidade)}
                onChange={(e) => set("cidade", e.target.value)}
                disabled={!ehDono}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cl-uf">UF</Label>
              <Input
                id="cl-uf"
                value={texto(form.uf)}
                onChange={(e) => set("uf", e.target.value.toUpperCase().slice(0, 2))}
                disabled={!ehDono}
                maxLength={2}
                className="rounded-xl"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-subtle">
                <Clock className="h-3.5 w-3.5" /> Horários de atendimento
              </p>
              {ehDono ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-lg"
                  onClick={copiarSegunda}
                >
                  <Copy className="h-3.5 w-3.5" />
                  Copiar segunda para todos
                </Button>
              ) : null}
            </div>
            <div className="space-y-2">
              {DIAS_SEMANA.map((rotulo, dia) => {
                const h = form.horarios.find((x) => x.dia === dia);
                if (!h) return null;
                return (
                  <div
                    key={dia}
                    className="flex flex-wrap items-center gap-3 rounded-xl border border-border/60 px-4 py-2.5"
                  >
                    <span className="w-24 text-sm text-foreground">{rotulo}</span>
                    <label className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Switch
                        checked={h.aberto}
                        onCheckedChange={(v) => setHorario(dia, { aberto: v })}
                        disabled={!ehDono}
                        aria-label={`${rotulo} aberto`}
                      />
                      {h.aberto ? "Aberto" : "Fechado"}
                    </label>
                    {h.aberto ? (
                      <span className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Input
                          type="time"
                          value={h.abre}
                          onChange={(e) => setHorario(dia, { abre: e.target.value })}
                          disabled={!ehDono}
                          className="h-8 w-24 rounded-lg"
                          aria-label={`${rotulo} abre às`}
                        />
                        às
                        <Input
                          type="time"
                          value={h.fecha}
                          onChange={(e) => setHorario(dia, { fecha: e.target.value })}
                          disabled={!ehDono}
                          className="h-8 w-24 rounded-lg"
                          aria-label={`${rotulo} fecha às`}
                        />
                      </span>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>

          {ehDono ? (
            <Button type="submit" disabled={salvar.isPending} className="rounded-xl">
              {salvar.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Salvar dados da clínica
            </Button>
          ) : null}
        </form>
      </CardContent>
    </Card>
  );
}
