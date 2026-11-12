import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/domus/page-shell";
import { PageIntro } from "@/components/domus/brand";
import { ClientView } from "../panel";
import { requireAccount } from "@/lib/route-access";

export const Route = createFileRoute("/panel/cliente")({
  beforeLoad: () => requireAccount("cliente"),
  head: () => ({ meta: [{ title: "Mi espacio de cliente — Subiwaza" }] }),
  component: ClienteDashboard,
});

function ClienteDashboard() {
  return (
    <PageShell>
      <PageIntro eyebrow="Espacio de cliente" title="Tus trabajos," accent="bajo control." />
      <div className="mt-10">
        <ClientView />
      </div>
    </PageShell>
  );
}
