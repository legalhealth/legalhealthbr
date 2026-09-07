import { createFileRoute } from "@tanstack/react-router";

import { PhoneScreen } from "@/components/mockup/phone-screen";

const TITLE = "Mockup da tela do app | Legal Health";
const DESCRIPTION =
  "Tela do assistente jurídico Legal Health renderizada em HTML para uso em mockups e criativos.";

export const Route = createFileRoute("/mockup/reels")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MockupReels,
});

function MockupReels() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#161616] p-6">
      <PhoneScreen />
    </div>
  );
}
