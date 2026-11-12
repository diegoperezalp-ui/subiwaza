import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/domus/page-shell";
import { PageIntro } from "@/components/domus/brand";
import { ProView } from "../panel";
import { requireAccount } from "@/lib/route-access";

export const Route = createFileRoute("/panel/especialista")({
  beforeLoad: () => requireAccount("profesional"),
  head: () => ({ meta: [{ title: "Mi espacio de especialista — Subiwaza" }] }),
  component: EspecialistaDashboard,
});

function EspecialistaDashboard() {
  return (
    <PageShell>
      <PageIntro
        eyebrow="Espacio de especialista"
        title="Tu oficio,"
        accent="tu siguiente trabajo."
      />
      <div className="mt-10">
        <ProView />
      </div>
    </PageShell>
  );
}
