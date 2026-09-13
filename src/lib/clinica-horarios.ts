export type DiaHorario = {
  dia: number; // 0 = segunda … 6 = domingo
  aberto: boolean;
  abre: string;
  fecha: string;
};

export const DIAS_SEMANA = [
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
  "Domingo",
] as const;

export function horariosPadrao(): DiaHorario[] {
  return DIAS_SEMANA.map((_, i) => ({
    dia: i,
    aberto: i < 5,
    abre: "08:00",
    fecha: "18:00",
  }));
}

export function normalizarHorarios(valor: unknown): DiaHorario[] {
  const base = horariosPadrao();
  if (!Array.isArray(valor)) return base;
  return base.map((padrao) => {
    const salvo = valor.find((v) => (v as { dia?: number }).dia === padrao.dia) as
      | Partial<DiaHorario>
      | undefined;
    if (!salvo) return padrao;
    return {
      dia: padrao.dia,
      aberto: Boolean(salvo.aberto),
      abre: typeof salvo.abre === "string" ? salvo.abre : padrao.abre,
      fecha: typeof salvo.fecha === "string" ? salvo.fecha : padrao.fecha,
    };
  });
}

export function resumoHorarios(horarios: DiaHorario[]): string {
  const abertos = horarios.filter((h) => h.aberto);
  if (abertos.length === 0) return "Horários não informados";
  return abertos
    .map((h) => `${DIAS_SEMANA[h.dia].slice(0, 3)} ${h.abre}–${h.fecha}`)
    .join(" · ");
}
