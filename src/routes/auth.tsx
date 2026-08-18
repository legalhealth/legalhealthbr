import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Eye, EyeOff, Mail, Lock, Loader2, ArrowLeft, MailWarning, CheckCircle2 } from "lucide-react";

import verticalLogoAsset from "@/assets/LH_vertical_gradiente.png.asset.json";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { WELCOME_SEEN_KEY } from "@/lib/onboarding";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>) => ({
    next: typeof s["next"] === "string" && s["next"].startsWith("/") && !s["next"].startsWith("//")
      ? s["next"]
      : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Entrar | Legal Health" },
      { name: "description", content: "Acesse a plataforma Legal Health." },
      { property: "og:title", content: "Entrar | Legal Health" },
      { property: "og:description", content: "Acesse a plataforma Legal Health." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

type Mode = "login" | "signup" | "forgot";

function AuthPage() {
  const navigate = useNavigate();
  const { next: nextPath } = Route.useSearch();
  const returnUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}${nextPath ?? "/"}`
      : (nextPath ?? "/");
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [unconfirmed, setUnconfirmed] = useState(false);
  const [resending, setResending] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const goTo = (next: Mode) => {
    setMode(next);
    setUnconfirmed(false);
    setResetSent(false);
  };

  const handleResend = async () => {
    setResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: { emailRedirectTo: returnUrl },
      });
      if (error) throw error;
      toast.success("E-mail de confirmação reenviado", {
        description: `Verifique a caixa de entrada de ${email}.`,
      });
    } catch (error) {
      toast.error("Não foi possível reenviar", {
        description: error instanceof Error ? error.message : "Tente novamente em alguns minutos.",
      });
    } finally {
      setResending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setUnconfirmed(false);

    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (nextPath) {
          window.location.href = nextPath;
          return;
        }
        const seen = typeof window !== "undefined" && window.localStorage.getItem(WELCOME_SEEN_KEY) === "1";
        navigate({ to: seen ? "/" : "/bem-vindo", replace: true });
      } else if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: returnUrl },
        });
        if (error) throw error;
        setMode("login");
        setUnconfirmed(true);
        toast.success("Conta criada", {
          description: "Confirme seu e-mail para acessar a plataforma.",
        });
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setResetSent(true);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Tente novamente.";
      const isUnconfirmed = /not confirmed|confirm/i.test(message);
      if (mode === "login" && isUnconfirmed) {
        setUnconfirmed(true);
      } else {
        toast.error(
          mode === "login"
            ? "Não foi possível entrar"
            : mode === "signup"
              ? "Não foi possível criar conta"
              : "Não foi possível enviar o e-mail",
          { description: message },
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-svh flex-col items-center justify-center px-5 py-10 sm:py-14">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center sm:mb-10">
          <img
            src={verticalLogoAsset.url}
            alt="Legal Health — Inteligência Jurídica para Medicina"
            width={260}
            height={260}
            className="block h-auto w-[62%] min-w-[168px] max-w-[200px] object-contain sm:w-full sm:max-w-[240px]"
          />
        </div>

        <Card className="glass-card rounded-2xl shadow-none">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-medium text-foreground">
              {mode === "login" ? "Bem-vindo de volta" : mode === "signup" ? "Criar conta" : "Recuperar acesso"}
            </CardTitle>
            <CardDescription>
              {mode === "login"
                ? "Entre com seu e-mail e senha."
                : mode === "signup"
                  ? "Cadastre-se para começar a proteger sua prática."
                  : "Enviaremos um link para você definir uma nova senha."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {unconfirmed && (
              <div className="mb-5 rounded-xl border border-info/40 bg-info/10 p-4">
                <div className="flex gap-3">
                  <MailWarning className="mt-0.5 h-4 w-4 shrink-0 text-info" />
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-foreground">E-mail pendente de confirmação</p>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      Enviamos um link de confirmação para {email || "seu e-mail"}. Confirme o cadastro para poder
                      entrar na plataforma.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={resending || !email}
                      onClick={handleResend}
                      className="border-border hover:bg-accent hover:text-accent-foreground"
                    >
                      {resending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                      Reenviar e-mail de confirmação
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {resetSent ? (
              <div className="space-y-5">
                <div className="flex gap-3 rounded-xl border border-success/40 bg-success/10 p-4">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">Link enviado</p>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      Verifique a caixa de entrada de {email} e siga o link para criar uma nova senha. O link expira
                      em 1 hora.
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => goTo("login")}
                  className="w-full border-border h-11 rounded-xl hover:bg-accent hover:text-accent-foreground"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Voltar ao login
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu@email.com.br"
                      className="pl-10"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                {mode !== "forgot" && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Senha</Label>
                      {mode === "login" && (
                        <button
                          type="button"
                          onClick={() => goTo("forgot")}
                          className="text-xs font-medium text-gold hover:text-gold-light"
                        >
                          Esqueci minha senha
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="pl-10 pr-10"
                        required
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((s) => !s)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full gold-gradient text-primary-foreground shadow-[var(--shadow-gold)] hover:shadow-[var(--shadow-gold-lg)] hover:brightness-105 h-11 rounded-xl font-medium"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Aguarde...
                    </>
                  ) : mode === "login" ? (
                    "Entrar"
                  ) : mode === "signup" ? (
                    "Criar conta"
                  ) : (
                    "Enviar link de recuperação"
                  )}
                </Button>
              </form>
            )}

            {!resetSent && (
              <>
                <Separator className="my-5 bg-border" />
                <div className="text-center text-sm">
                  {mode === "forgot" ? (
                    <button
                      type="button"
                      onClick={() => goTo("login")}
                      className="font-medium text-gold hover:text-gold-light"
                    >
                      Voltar ao login
                    </button>
                  ) : (
                    <>
                      <span className="text-muted-foreground">
                        {mode === "login" ? "Ainda não tem conta?" : "Já tem uma conta?"}
                      </span>{" "}
                      <button
                        type="button"
                        onClick={() => goTo(mode === "login" ? "signup" : "login")}
                        className="font-medium text-gold hover:text-gold-light"
                      >
                        {mode === "login" ? "Criar conta" : "Entrar"}
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <p className="mt-8 text-center text-xs text-subtle">
          Ao continuar, você concorda com os termos de uso e política de privacidade.
        </p>
      </div>
    </div>
  );
}
