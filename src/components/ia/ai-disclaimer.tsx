export function AiDisclaimer({ className = "" }: { className?: string }) {
  return (
    <p
      className={`rounded-2xl border border-border bg-card px-4 py-3 text-xs leading-relaxed text-subtle ${className}`}
    >
      ⚠️ Conteúdo gerado por IA — sujeito a revisão do advogado responsável antes do uso. Não
      substitui parecer jurídico individualizado.
    </p>
  );
}
