import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Eye, EyeOff, Mail, Lock, Loader2 } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/auth")({
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

function AuthPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const toggleMode = () => setMode((m) => (m === "login" ? "signup" : "login"));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        throw redirect({ to: "/" });
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast.success("Conta criada", {
          description: "Verifique seu e-mail para confirmar o cadastro.",
        });
        setMode("login");
      }
    } catch (error) {
      toast.error(mode === "login" ? "Não foi possível entrar" : "Não foi possível criar conta", {
        description: error instanceof Error ? error.message : "Tente novamente.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-5 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-card">
            <span className="font-serif text-2xl font-semibold text-gold">LH</span>
          </div>
          <h1 className="font-serif text-2xl font-medium tracking-tight text-gold-light">LEGAL HEALTH</h1>
          <p className="mt-1 text-xs tracking-[0.24em] text-muted-foreground uppercase">Inteligência Jurídica para Medicina</p>
        </div>

        <Card className="border border-border bg-card rounded-2xl shadow-none">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-medium text-foreground">
              {mode === "login" ? "Bem-vindo de volta" : "Criar conta"}
            </CardTitle>
            <CardDescription>
              {mode === "login"
                ? "Entre com seu e-mail e senha."
                : "Cadastre-se para começar a proteger sua prática."}
            </CardDescription>
          </CardHeader>
          <CardContent>
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

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
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

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gold text-primary-foreground hover:bg-gold/90 h-11 rounded-xl font-medium"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Aguarde...
                  </>
                ) : mode === "login" ? (
                  "Entrar"
                ) : (
                  "Criar conta"
                )}
              </Button>
            </form>

            <Separator className="my-5 bg-border" />

            <div className="text-center text-sm">
              <span className="text-muted-foreground">
                {mode === "login" ? "Ainda não tem conta?" : "Já tem uma conta?"}
              </span>{" "}
              <button
                type="button"
                onClick={toggleMode}
                className="font-medium text-gold hover:text-gold-light"
              >
                {mode === "login" ? "Criar conta" : "Entrar"}
              </button>
            </div>
          </CardContent>
        </Card>

        <p className="mt-8 text-center text-xs text-subtle">
          Ao continuar, você concorda com os termos de uso e política de privacidade.
        </p>
      </div>
    </div>
  );
}
