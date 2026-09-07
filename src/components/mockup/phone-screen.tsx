import monograma from "@/assets/lh-monograma.png.asset.json";

/**
 * Tela de app (9:19.5) construída com texto real em HTML/CSS.
 * Usada para compor mockups e criativos — nenhum texto é imagem.
 */
export function PhoneScreen() {
  return (
    <div
      id="phone-screen"
      className="relative flex flex-col overflow-hidden bg-[#0A0A0A] text-[#F5F2EC]"
      style={{ width: 540, height: 1170, fontFamily: "Karla, system-ui, sans-serif" }}
    >
      {/* Status bar */}
      <div className="flex items-center justify-between px-7 pt-5 text-[15px] tabular-nums text-[#8A8A8A]">
        <span>9:41</span>
        <span className="tracking-[0.2em]">••• ⌁ ▰</span>
      </div>

      {/* Cabeçalho */}
      <header className="flex flex-col items-center gap-3 border-b border-[#242424] px-7 pb-6 pt-6">
        <img src={monograma.url} alt="Legal Health" className="h-14 w-auto" />
        <h1
          className="text-[27px] leading-tight text-[#C8A96A]"
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
        >
          Seu Assistente Jurídico
        </h1>
        <p className="flex items-center gap-2 text-[15px] text-[#9A9A9A]">
          <span className="inline-block h-2 w-2 rounded-full bg-[#2FBF7B]" />
          online
        </p>
      </header>

      {/* Conversa */}
      <main className="flex flex-1 flex-col gap-4 px-6 py-6">
        <Bubble side="left">Olá, Dr. Alexandre. Como posso te ajudar hoje?</Bubble>
        <Bubble side="right">
          Quais documentos preciso reforçar no consentimento para reduzir risco de processo em uma
          mamoplastia de aumento?
        </Bubble>
        <Bubble side="left">
          Reforce o consentimento informado assinado, a documentação fotográfica pré e pós, e o
          registro em prontuário dos riscos discutidos na consulta.
        </Bubble>

        {/* Juriscore */}
        <section className="mt-2 rounded-3xl border border-[#242424] bg-[#141414] p-6">
          <div className="flex items-center gap-6">
            <Gauge value={66} />
            <div className="min-w-0">
              <p className="text-[19px] text-[#F5F2EC]">Juriscore®</p>
              <p className="mt-1 text-[16px] text-[#D9A648]">Atenção moderada</p>
            </div>
          </div>
          <ul className="mt-5 space-y-2 text-[15px] text-[#9A9A9A]">
            <Cat label="Documentação" value={78} />
            <Cat label="Consentimento" value={62} />
            <Cat label="Privacidade e LGPD" value={54} />
          </ul>
        </section>
      </main>

      {/* Campo de mensagem */}
      <footer className="flex items-center gap-3 border-t border-[#242424] px-6 py-5">
        <div className="flex-1 rounded-full border border-[#242424] bg-[#141414] px-5 py-4 text-[16px] text-[#6F6F6F]">
          Digite sua mensagem...
        </div>
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#C8A96A] text-[22px] text-[#0A0A0A]">
          ➤
        </div>
      </footer>
    </div>
  );
}

function Bubble({ side, children }: { side: "left" | "right"; children: React.ReactNode }) {
  const isUser = side === "right";
  return (
    <div className={isUser ? "flex justify-end" : "flex justify-start"}>
      <p
        className={
          isUser
            ? "max-w-[82%] rounded-3xl rounded-br-lg bg-[#C8A96A] px-5 py-4 text-[17px] leading-snug text-[#0A0A0A]"
            : "max-w-[82%] rounded-3xl rounded-bl-lg border border-[#242424] bg-[#141414] px-5 py-4 text-[17px] leading-snug text-[#E8E4DC]"
        }
      >
        {children}
      </p>
    </div>
  );
}

function Cat({ label, value }: { label: string; value: number }) {
  return (
    <li className="flex items-center justify-between">
      <span>{label}</span>
      <span className="tabular-nums text-[#F5F2EC]">{value}</span>
    </li>
  );
}

function Gauge({ value }: { value: number }) {
  const r = 42;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative h-[110px] w-[110px] shrink-0">
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="#242424" strokeWidth="8" />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke="#C8A96A"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${(c * value) / 100} ${c}`}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[34px] tabular-nums text-[#C8A96A]">
        {value}
      </span>
    </div>
  );
}
