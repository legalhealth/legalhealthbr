import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { CheckCircle2, Loader2, ShieldAlert } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PROFISSOES, TIPOS_ATUACAO, UFS } from "@/lib/embaixadores";
import { track } from "@/lib/analytics";

type Estado = "idle" | "enviando" | "ok" | "erro";

export function CandidaturaForm() {
  const [estado, setEstado] = useState<Estado>("idle");
  const [erro, setErro] = useState<string | null>(null);
  const [iniciado, setIniciado] = useState(false);
  const [armadilha, setArmadilha] = useState("");
  const abertoEm = useRef(Date.now());
  const enviando = useRef(false);

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [profissao, setProfissao] = useState("");
  const [estadoUf, setEstadoUf] = useState("");
  const [cidade, setCidade] = useState("");
  const [tipoAtuacao, setTipoAtuacao] = useState("");
  const [link, setLink] = useState("");
  const [comunidade, setComunidade] = useState("");
  const [motivo, setMotivo] = useState("");
  const [aceite, setAceite] = useState(false);
  const [ciencia, setCiencia] = useState(false);
  const [contato, setContato] = useState(false);

  const marcarInicio = () => {
    if (iniciado) return;
    setIniciado(true);
    track("application_start", { secao: "candidatura" });
  };

  /** Registra o erro visível e o evento de analytics, sem enviar o conteúdo digitado. */
  const falhaDeCampo = (campo: string, mensagem: string) => {
    setErro(mensagem);
    track("application_field_error", { id: campo, secao: "candidatura" });
  };

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (estado === "enviando" || enviando.current) return;
    setErro(null);

    // Anti-spam simples: armadilha preenchida ou envio em menos de 3 segundos.
    if (armadilha.trim() !== "" || Date.now() - abertoEm.current < 3000) {
      falhaDeCampo(
        "antispam",
        "Não conseguimos validar o envio. Revise os campos e tente novamente em alguns segundos.",
      );
      return;
    }

    if (!profissao || !estadoUf) {
      falhaDeCampo("obrigatorios", "Selecione sua profissão e o estado onde atua.");
      return;
    }
    if (motivo.trim().length < 10) {
      falhaDeCampo(
        "motivo",
        "Conte em poucas linhas por que deseja participar (mínimo de 10 caracteres).",
      );
      return;
    }
    if (!aceite || !ciencia) {
      falhaDeCampo(
        "consentimento",
        "É necessário aceitar o regulamento e a ciência sobre os limites da plataforma.",
      );
      return;
    }

    enviando.current = true;
    setEstado("enviando");
    const { error } = await supabase.from("ambassador_applications").insert({
      nome: nome.trim(),
      email: email.trim().toLowerCase(),
      profissao,
      estado: estadoUf,
      cidade: cidade.trim() || null,
      tipo_atuacao: tipoAtuacao || null,
      link_profissional: link.trim() || null,
      comunidade_tamanho: comunidade.trim() || null,
      motivo: motivo.trim(),
      aceite_regulamento: aceite,
      ciencia_nao_substitui_advogado: ciencia,
      consentimento_contato: contato,
    });

    enviando.current = false;
    if (error) {
      setEstado("erro");
      setErro(
        error.message.includes("JWT") || error.message.includes("session")
          ? "Sua sessão expirou. Recarregue a página e tente novamente."
          : "Não foi possível enviar sua candidatura agora. Tente novamente em alguns minutos.",
      );
      return;
    }

    track("application_submit", { secao: "candidatura" });
    setEstado("ok");
  };

  if (estado === "ok") {
    return (
      <div className="glass-card rounded-2xl p-8 text-center" role="status" aria-live="polite">
        <CheckCircle2 className="mx-auto h-8 w-8 text-success" />
        <h3 className="mt-4 font-display text-2xl text-foreground">Candidatura recebida</h3>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
          Recebemos seu interesse. A equipe analisará as informações e retornará conforme os
          critérios e a disponibilidade do programa.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button
            asChild
            className="gold-gradient h-11 rounded-xl px-5 font-medium text-primary-foreground"
          >
            <Link to="/auth" onClick={() => track("platform_cta_click", { origem: "pos-envio" })}>
              Criar conta e conhecer a plataforma
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form
      method="post"
      onSubmit={enviar}
      onFocus={marcarInicio}
      className="glass-card rounded-2xl p-6 md:p-8"
    >
      {/* Armadilha anti-spam: invisível para pessoas, preenchida por robôs. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="assunto-extra">Não preencha este campo</label>
        <input
          id="assunto-extra"
          name="assunto-extra"
          tabIndex={-1}
          autoComplete="off"
          value={armadilha}
          onChange={(e) => setArmadilha(e.target.value)}
        />
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="nome">Nome</Label>
          <Input
            id="nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
            minLength={2}
            maxLength={120}
            autoComplete="name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            placeholder="seu@email.com.br"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="profissao">Profissão</Label>
          <Select value={profissao} onValueChange={setProfissao}>
            <SelectTrigger id="profissao">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {PROFISSOES.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="tipo">
            Tipo de atuação <span className="text-subtle">(opcional)</span>
          </Label>
          <Select value={tipoAtuacao} onValueChange={setTipoAtuacao}>
            <SelectTrigger id="tipo">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {TIPOS_ATUACAO.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="uf">Estado</Label>
          <Select value={estadoUf} onValueChange={setEstadoUf}>
            <SelectTrigger id="uf">
              <SelectValue placeholder="UF" />
            </SelectTrigger>
            <SelectContent>
              {UFS.map((uf) => (
                <SelectItem key={uf} value={uf}>
                  {uf}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="cidade">
            Cidade <span className="text-subtle">(opcional)</span>
          </Label>
          <Input
            id="cidade"
            value={cidade}
            onChange={(e) => setCidade(e.target.value)}
            maxLength={80}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="link">
            Link profissional ou rede social <span className="text-subtle">(opcional)</span>
          </Label>
          <Input
            id="link"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://"
            maxLength={200}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="comunidade">
            Tamanho aproximado da comunidade <span className="text-subtle">(opcional)</span>
          </Label>
          <Input
            id="comunidade"
            value={comunidade}
            onChange={(e) => setComunidade(e.target.value)}
            placeholder="Ex.: grupo de 200 colegas"
            maxLength={80}
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="motivo">Por que deseja participar?</Label>
          <Textarea
            id="motivo"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            rows={4}
            required
            maxLength={2000}
            placeholder="Conte o que você espera da experiência de três meses."
          />
          <p className="text-xs text-subtle">
            Não inclua dados de pacientes, número de processo ou informações sigilosas.
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        <label
          htmlFor="aceite"
          className="flex items-start gap-3 text-sm text-muted-foreground"
        >
          <Checkbox
            id="aceite"
            checked={aceite}
            onCheckedChange={(v) => setAceite(v === true)}
            className="mt-0.5"
          />
          <span>
            Li e aceito o regulamento do programa e os{" "}
            <Link to="/termos" className="text-gold underline underline-offset-4 hover:text-gold-light">
              Termos de Uso
            </Link>
            .
          </span>
        </label>

        <label
          htmlFor="ciencia"
          className="flex items-start gap-3 text-sm text-muted-foreground"
        >
          <Checkbox
            id="ciencia"
            checked={ciencia}
            onCheckedChange={(v) => setCiencia(v === true)}
            className="mt-0.5"
          />
          <span>
            Tenho ciência de que a Legal Health apoia a organização preventiva e não substitui
            advogado.
          </span>
        </label>

        <label
          htmlFor="contato"
          className="flex items-start gap-3 text-sm text-muted-foreground"
        >
          <Checkbox
            id="contato"
            checked={contato}
            onCheckedChange={(v) => setContato(v === true)}
            className="mt-0.5"
          />
          <span>
            Consinto em receber contato sobre o programa de Embaixadores. Posso revogar a qualquer
            momento pelo{" "}
            <Link to="/privacidade" hash="canal" className="text-gold underline underline-offset-4 hover:text-gold-light">
              canal de privacidade
            </Link>
            .
          </span>
        </label>
      </div>

      {erro && (
        <div
          role="alert"
          aria-live="assertive"
          className="mt-5 flex gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-foreground"
        >
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          <span>{erro}</span>
        </div>
      )}

      <Button
        type="submit"
        disabled={estado === "enviando"}
        className="gold-gradient mt-6 h-12 w-full rounded-xl font-medium text-primary-foreground shadow-[var(--shadow-gold)] hover:brightness-105"
      >
        {estado === "enviando" ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando candidatura...
          </>
        ) : (
          "Enviar candidatura"
        )}
      </Button>

      <p className="mt-4 text-center text-xs text-subtle">
        Candidatura sujeita a critérios e disponibilidade. Sem promessa de aprovação, prazo de
        resposta ou remuneração automática.
      </p>
    </form>
  );
}
