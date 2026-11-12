import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { BadgeCheck, Clock, MapPin } from "lucide-react";
import { PageShell } from "@/components/domus/page-shell";
import { CategoryIcon, PageIntro, PersonMark, Stars } from "@/components/domus/brand";
import { CATEGORIES, tradeLabel, type Category } from "@/lib/domus";
import { useDomus } from "@/lib/domus-store";
import { cn } from "@/lib/utils";
import { requireAccount } from "@/lib/route-access";

export const Route = createFileRoute("/profesionales")({
  beforeLoad: () => requireAccount("cliente"),
  head: () => ({
    meta: [
      { title: "Especialistas locales — Subiwaza" },
      {
        name: "description",
        content:
          "Conoce perfiles de especialistas locales, sus oficios, zonas y reseñas basadas en trabajos terminados.",
      },
      { property: "og:title", content: "Especialistas locales — Subiwaza" },
      {
        property: "og:description",
        content:
          "Reputación transparente: calificaciones, trabajos y experiencia de cada profesional.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Profesionales,
});

function Profesionales() {
  const { workers } = useDomus();
  const [filter, setFilter] = useState<Category | "todas">("todas");
  const list = workers
    .filter((w) => filter === "todas" || w.trade === filter)
    .sort((a, b) => b.rating - a.rating);

  return (
    <PageShell>
      <PageIntro eyebrow="Nuestra comunidad" title="Manos expertas," accent="reputación visible.">
        Cada profesional construye su historial servicio a servicio. Así sabes exactamente quién
        llega a tu hogar.
      </PageIntro>

      <div className="mt-12 flex gap-2 overflow-x-auto pb-2">
        {[{ id: "todas" as const, label: "Todas" }, ...CATEGORIES].map((c) => (
          <button
            key={c.id}
            onClick={() => setFilter(c.id)}
            className={cn(
              "shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-all",
              filter === c.id
                ? "border-ink bg-ink text-ink-foreground"
                : "glass text-muted-foreground hover:text-foreground",
            )}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {list.length === 0 && (
          <div className="glass col-span-full rounded-3xl p-12 text-center text-muted-foreground">
            Aún no hay profesionales en esta especialidad.
          </div>
        )}
        {list.map((w) => (
          <article key={w.id} className="glass lift rounded-3xl p-7">
            <div className="flex items-start justify-between">
              <PersonMark name={w.name} className="h-14 w-14 text-xl" />
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary-soft text-primary">
                <CategoryIcon category={w.trade} className="h-4.5 w-4.5" />
              </span>
            </div>
            <div className="mt-5 flex items-center gap-2">
              <h3 className="text-2xl text-foreground">{w.name}</h3>
              {w.verified && (
                <BadgeCheck className="h-4.5 w-4.5 text-primary" aria-label="Verificado" />
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {tradeLabel(w.trade)} · {w.years ? `${w.years} años de experiencia` : "Perfil nuevo"}
            </p>
            <div className="mt-4 flex items-center gap-2">
              <Stars value={w.rating} />
              <span className="text-sm font-semibold text-foreground">{w.rating.toFixed(2)}</span>
              <span className="text-xs text-muted-foreground">({w.reviews} reseñas)</span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{w.bio}</p>
            <div className="hairline my-5" />
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="font-display text-2xl text-foreground">{w.jobsDone}</p>
                <p className="text-[0.65rem] text-muted-foreground">Trabajos</p>
              </div>
              <div>
                <p className="flex items-center justify-center gap-1 font-display text-2xl text-foreground">
                  {w.responseMin ? (
                    <>
                      {w.responseMin}
                      <span className="text-sm">min</span>
                    </>
                  ) : (
                    "—"
                  )}
                </p>
                <p className="flex items-center justify-center gap-1 text-[0.65rem] text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  Respuesta
                </p>
              </div>
              <div>
                <p className="truncate pt-1.5 text-sm font-semibold text-foreground">{w.zone}</p>
                <p className="mt-1 flex items-center justify-center gap-1 text-[0.65rem] text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  Zona
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </PageShell>
  );
}
