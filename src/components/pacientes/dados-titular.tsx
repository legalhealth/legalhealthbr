import { useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import { Download, Loader2, ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useApagarPacienteDefinitivo, useExportarPaciente, type Paciente } from "@/lib/pacientes";

/** Atende aos pedidos do titular: cópia de tudo e exclusão definitiva. */
export function DadosTitular({ paciente }: { paciente: Paciente }) {
  const router = useRouter();
  const exportar = useExportarPaciente();
  const apagar = useApagarPacienteDefinitivo();
  const [confirmacao, setConfirmacao] = useState("");

  async function baixar() {
    try {
      const dados = await exportar.mutateAsync(paciente.id);
      const blob = new Blob([JSON.stringify(dados, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `paciente-${paciente.nome.replace(/\s+/g, "-").toLowerCase()}.json`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("Exportação gerada e registrada como pedido do titular.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível exportar os dados.");
    }
  }

  async function apagarTudo() {
    try {
      await apagar.mutateAsync({ patientId: paciente.id, confirmacao });
      toast.success("Paciente apagado definitivamente.");
      void router.navigate({ to: "/biblioteca", search: { cat: "pacientes" } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível apagar o paciente.");
    }
  }

  return (
    <section className="rounded-2xl glass-card p-5 md:p-6">
      <h2 className="font-display text-lg text-foreground">Direitos do paciente</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        A pedido do paciente, você pode entregar uma cópia de tudo o que está guardado ou apagar a
        ficha em definitivo. As duas ações ficam registradas com data e autor. As cópias de
        segurança da infraestrutura só expiram dentro da janela de retenção do provedor.
      </p>

      <Button
        variant="outline"
        size="sm"
        className="mt-4 border-border"
        disabled={exportar.isPending}
        onClick={() => void baixar()}
      >
        {exportar.isPending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Download className="mr-2 h-4 w-4" />
        )}
        Exportar tudo deste paciente
      </Button>

      <div className="mt-6 rounded-xl border border-danger/30 p-4">
        <p className="flex items-center gap-2 text-sm text-foreground">
          <ShieldAlert className="h-4 w-4 text-danger" />
          Apagar definitivamente
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Remove ficha, atendimentos, triagens, avaliações, gravações e o vínculo dos documentos.
          Não há como desfazer. Digite <span className="text-foreground">{paciente.nome}</span> para
          confirmar.
        </p>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <div className="space-y-2">
            <Label htmlFor="conf-nome" className="text-xs text-muted-foreground">
              Nome do paciente
            </Label>
            <Input
              id="conf-nome"
              value={confirmacao}
              onChange={(e) => setConfirmacao(e.target.value)}
              className="w-64"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            className="border-danger/40 text-danger hover:bg-danger/10"
            disabled={
              apagar.isPending ||
              confirmacao.trim().toLowerCase() !== paciente.nome.trim().toLowerCase()
            }
            onClick={() => void apagarTudo()}
          >
            {apagar.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Apagar definitivamente
          </Button>
        </div>
      </div>
    </section>
  );
}
