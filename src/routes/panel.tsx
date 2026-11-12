import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Star,
  Check,
  Clock,
  Briefcase,
  Wallet,
  Percent,
  Plus,
  MapPin,
  ArrowRight,
} from "lucide-react";
import { PageShell } from "@/components/domus/page-shell";
import { CategoryIcon, PageIntro, PersonMark, Stars } from "@/components/domus/brand";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { categoryLabel, currency, tradeLabel, workerStats, type Job } from "@/lib/domus";
import { domusActions, useDomus } from "@/lib/domus-store";
import { cn } from "@/lib/utils";
import { dashboardPath, requireAccount } from "@/lib/route-access";

export const Route = createFileRoute("/panel")({
  beforeLoad: async () => {
    const user = await requireAccount();
    throw redirect({ to: dashboardPath(user) });
  },
  head: () => ({
    meta: [
      { title: "Mi panel — Subiwaza" },
      {
        name: "description",
        content:
          "Tus solicitudes, propuestas recibidas, calificaciones y estadísticas como cliente o profesional.",
      },
      { property: "og:title", content: "Mi panel — Subiwaza" },
      {
        property: "og:description",
        content: "Estadísticas y calificaciones para clientes y profesionales.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Panel,
});

const STATUS: Record<Job["status"], { label: string; variant: "soft" | "slate" | "default" }> = {
  abierto: { label: "Recibiendo propuestas", variant: "soft" },
  asignado: { label: "En curso", variant: "default" },
  completado: { label: "Completado", variant: "slate" },
};

function Panel() {
  const state = useDomus();
  if (state.loading)
    return (
      <PageShell>
        <div className="glass rounded-3xl p-10 text-center text-muted-foreground">
          Cargando tu panel…
        </div>
      </PageShell>
    );
  if (!state.user)
    return (
      <PageShell>
        <div className="glass mx-auto max-w-xl rounded-3xl p-10 text-center">
          <h1 className="text-4xl text-foreground">Tu espacio en Subiwaza</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Inicia sesión para ver tus publicaciones, propuestas, actividad y reputación.
          </p>
          <Button asChild className="mt-7">
            <Link to="/acceso">Entrar o crear cuenta</Link>
          </Button>
        </div>
      </PageShell>
    );
  if (!state.databaseReady)
    return (
      <PageShell>
        <div className="glass mx-auto max-w-xl rounded-3xl p-10 text-center">
          <h1 className="text-3xl text-foreground">Conecta tu base de datos</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Configura MongoDB para guardar y consultar tu actividad de forma segura.
          </p>
        </div>
      </PageShell>
    );
  const canClient = state.user.roles.includes("cliente");
  const canWorker = state.user.roles.includes("profesional");
  return (
    <PageShell>
      <PageIntro eyebrow="Mi panel" title="Todo en orden," accent="a la vista." />
      <Tabs defaultValue={canClient ? "cliente" : "profesional"} className="mt-10">
        <TabsList>
          {canClient && <TabsTrigger value="cliente">Soy cliente</TabsTrigger>}
          {canWorker && <TabsTrigger value="profesional">Soy profesional</TabsTrigger>}
        </TabsList>
        {canClient && (
          <TabsContent value="cliente" className="mt-10">
            <ClientView />
          </TabsContent>
        )}
        {canWorker && (
          <TabsContent value="profesional" className="mt-10">
            <ProView />
          </TabsContent>
        )}
      </Tabs>
    </PageShell>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Star;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="glass rounded-3xl p-6">
      <div className="flex items-center justify-between">
        <p className="eyebrow text-muted-foreground">{label}</p>
        <span className="grid h-9 w-9 place-items-center rounded-full bg-primary-soft text-primary">
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-5 font-display text-5xl leading-none text-foreground">{value}</p>
      {hint && <p className="mt-2 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function ClientView() {
  const state = useDomus();
  const mine = state.jobs.filter((j) => j.mine);
  const done = mine.filter((j) => j.status === "completado").length;
  const workerById = (id?: string) => state.workers.find((w) => w.id === id);

  return (
    <div className="space-y-10">
      <div className="grid gap-5 md:grid-cols-[1.2fr_1fr_1fr_1fr]">
        <div className="glass flex items-center gap-4 rounded-3xl p-6">
          <PersonMark name={state.me.name} className="h-14 w-14 text-xl" />
          <div>
            <p className="font-semibold text-foreground">{state.me.name}</p>
            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
              <Stars value={state.me.rating} /> {state.me.rating.toFixed(1)} como cliente
            </div>
          </div>
        </div>
        <StatCard icon={Briefcase} label="Publicados" value={String(mine.length)} />
        <StatCard
          icon={Clock}
          label="En curso"
          value={String(mine.filter((j) => j.status === "asignado").length)}
        />
        <StatCard icon={Check} label="Completados" value={String(done)} />
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-3xl text-foreground">Mis solicitudes</h2>
        <Button asChild variant="ink" size="sm" className="h-9">
          <Link to="/publicar">
            <Plus /> Nueva
          </Link>
        </Button>
      </div>

      <div className="space-y-5">
        {mine.length === 0 && (
          <div className="glass rounded-3xl p-12 text-center text-muted-foreground">
            Aún no has publicado ningún problema.
          </div>
        )}
        {mine.map((j) => {
          const assigned = workerById(j.assignedWorkerId);
          const pending = j.offers.filter((o) => o.status === "pendiente");
          return (
            <article key={j.id} className="glass rounded-3xl p-7">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <span className="grid h-12 w-12 place-items-center rounded-xl bg-primary-soft text-primary">
                    <CategoryIcon category={j.category} className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="eyebrow text-muted-foreground">{categoryLabel(j.category)}</p>
                    <h3 className="text-2xl text-foreground">{j.title}</h3>
                    <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {j.zone} · Presupuesto {currency(j.budget)}
                    </p>
                  </div>
                </div>
                <Badge variant={STATUS[j.status].variant} className="px-3 py-1">
                  {STATUS[j.status].label}
                </Badge>
              </div>

              {j.status === "abierto" && (
                <div className="mt-6">
                  <p className="text-sm font-semibold text-foreground">
                    {pending.length
                      ? `${pending.length} ${pending.length === 1 ? "propuesta recibida" : "propuestas recibidas"}`
                      : "Esperando propuestas de profesionales cercanos…"}
                  </p>
                  <div className="mt-4 space-y-3">
                    {pending.map((o) => {
                      const w = workerById(o.workerId);
                      if (!w) return null;
                      return (
                        <div
                          key={o.id}
                          className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-card/60 p-4"
                        >
                          <div className="flex items-center gap-3">
                            <PersonMark name={w.name} />
                            <div>
                              <p className="font-semibold text-foreground">{w.name}</p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Stars value={w.rating} /> {w.rating.toFixed(2)} · {w.jobsDone}{" "}
                                trabajos
                              </div>
                              {o.message && (
                                <p className="mt-1 max-w-md text-xs italic text-muted-foreground">
                                  "{o.message}"
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="font-display text-2xl leading-none text-foreground">
                                {currency(o.price)}
                              </p>
                              <p className="mt-1 text-[0.7rem] text-muted-foreground">{o.eta}</p>
                            </div>
                            <Button
                              size="sm"
                              className="h-9"
                              onClick={() => {
                                void domusActions
                                  .acceptOffer(j.id, o.id)
                                  .then(() => toast.success(`Contrataste a ${w.name}`))
                                  .catch(() => undefined);
                              }}
                            >
                              Aceptar
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {j.status !== "abierto" && assigned && (
                <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-card/60 p-4">
                  <div className="flex items-center gap-3">
                    <PersonMark name={assigned.name} />
                    <div>
                      <p className="font-semibold text-foreground">{assigned.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {tradeLabel(assigned.trade)} · {currency(j.finalPrice ?? j.budget)}
                      </p>
                    </div>
                  </div>
                  {j.status === "asignado" ? (
                    <div className="flex flex-wrap items-center gap-3">
                      <WhatsAppContact phone={j.contactPhone} />
                      <RateControl
                        onRate={(n) => {
                          void domusActions
                            .completeAndRate(j.id, n)
                            .then(() =>
                              toast.success("Gracias por tu calificación", {
                                description: `Calificaste a ${assigned.name} con ${n} estrellas.`,
                              }),
                            )
                            .catch(() => undefined);
                        }}
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      Tu calificación <Stars value={j.rating ?? 0} size="md" />
                    </div>
                  )}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}

function RateControl({
  onRate,
  label = "Terminado · califica",
}: {
  onRate: (n: number) => void;
  label?: string;
}) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="flex" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            aria-label={`${n} estrellas`}
            onMouseEnter={() => setHover(n)}
            onClick={() => onRate(n)}
            className="p-0.5"
          >
            <Star
              className={cn(
                "h-6 w-6 transition-colors",
                n <= hover ? "fill-gold text-gold" : "fill-muted text-border",
              )}
              strokeWidth={1.2}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

function WhatsAppContact({ phone }: { phone?: string }) {
  if (!phone)
    return <span className="text-xs text-muted-foreground">Aún no hay teléfono compartido.</span>;
  let digits = phone.replace(/\D/g, "");
  if (digits.length === 10) digits = `52${digits}`;
  if (digits.length < 11)
    return (
      <span className="text-xs text-muted-foreground">
        El teléfono necesita lada para WhatsApp.
      </span>
    );
  return (
    <a
      href={`https://wa.me/${digits}`}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary-soft px-4 py-2 text-xs font-semibold text-accent-foreground transition hover:border-primary/60 hover:bg-primary/20"
    >
      Coordinar por WhatsApp <ArrowRight className="h-3.5 w-3.5" />
    </a>
  );
}

export function ProView() {
  const state = useDomus();
  const me = state.workers.find((w) => w.id === state.myWorkerId)!;
  const s = workerStats(state, me.id);
  const today = new Date();
  const data = Array.from({ length: 6 }, (_, index) => {
    const start = new Date(today.getFullYear(), today.getMonth() - 5 + index, 1);
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 1);
    const earnings = state.jobs
      .filter(
        (job) =>
          job.assignedWorkerId === me.id &&
          job.status === "completado" &&
          job.completedAt &&
          job.completedAt >= start.getTime() &&
          job.completedAt < end.getTime(),
      )
      .reduce((sum, job) => sum + (job.finalPrice ?? 0), 0);
    return {
      mes: start.toLocaleString("es-MX", { month: "short" }).replace(".", ""),
      ganancias: earnings,
    };
  });
  const myJobs = state.jobs.filter((j) => j.offers.some((o) => o.workerId === me.id));

  return (
    <div className="space-y-10">
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Star}
          label="Calificación"
          value={s.rating.toFixed(2)}
          hint={`${s.reviews} reseñas`}
        />
        <StatCard
          icon={Briefcase}
          label="Trabajos"
          value={String(s.jobsDone)}
          hint={`${s.active} en curso`}
        />
        <StatCard
          icon={Wallet}
          label="Este mes"
          value={currency(data[data.length - 1]?.ganancias ?? 0)}
          hint="Ganancias"
        />
        <StatCard
          icon={Percent}
          label="Aceptación"
          value={`${s.acceptance}%`}
          hint={`${s.pending} ${s.pending === 1 ? "propuesta pendiente" : "propuestas pendientes"}`}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <div className="glass rounded-3xl p-7">
          <div className="flex items-end justify-between">
            <div>
              <p className="eyebrow text-muted-foreground">Ganancias</p>
              <h3 className="mt-2 text-3xl text-foreground">Últimos 6 meses</h3>
            </div>
            <Badge variant="soft">{tradeLabel(me.trade)}</Badge>
          </div>
          <div className="mt-6 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ left: -10, right: 4, top: 10 }}>
                <defs>
                  <linearGradient id="earn" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  vertical={false}
                  stroke="var(--color-border)"
                  strokeDasharray="3 6"
                />
                <XAxis
                  dataKey="mes"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
                  tickFormatter={(v) => `${Math.round(v / 1000)}k`}
                />
                <Tooltip
                  formatter={(v: number) => [currency(v), "Ganancias"]}
                  contentStyle={{
                    borderRadius: 14,
                    border: "1px solid var(--color-border)",
                    background: "var(--color-card)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="ganancias"
                  stroke="var(--color-chart-1)"
                  strokeWidth={2.2}
                  fill="url(#earn)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass rounded-3xl p-7">
          <p className="eyebrow text-muted-foreground">Reputación</p>
          <div className="mt-4 flex items-center gap-4">
            <p className="font-display text-6xl leading-none text-foreground">
              {s.rating.toFixed(2)}
            </p>
            <div>
              <Stars value={s.rating} size="md" />
              <p className="mt-1 text-xs text-muted-foreground">
                {s.reviews} reseñas de trabajos completados
              </p>
            </div>
          </div>
          <div className="mt-6 space-y-2.5">
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = state.ratingDistribution?.[stars] ?? 0;
              const percentage = s.reviews ? Math.round((count / s.reviews) * 100) : 0;
              return (
                <div key={stars} className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="w-3">{stars}</span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-gradient-brand"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="w-8 text-right">{percentage}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-3xl text-foreground">Mis propuestas y trabajos</h2>
          <Button asChild variant="ink" size="sm" className="h-9">
            <Link to="/trabajos">Buscar trabajos</Link>
          </Button>
        </div>
        <div className="mt-6 space-y-3">
          {myJobs.length === 0 && (
            <div className="glass rounded-3xl p-12 text-center text-muted-foreground">
              Aún no has enviado propuestas. Explora los trabajos disponibles.
            </div>
          )}
          {myJobs.map((j) => {
            const o = j.offers.find((x) => x.workerId === me.id)!;
            const label =
              j.status === "completado" && j.assignedWorkerId === me.id
                ? { t: "Completado", v: "slate" as const }
                : o.status === "aceptada"
                  ? { t: "Aceptada · en curso", v: "default" as const }
                  : o.status === "rechazada"
                    ? { t: "No seleccionada", v: "slate" as const }
                    : { t: "Pendiente del cliente", v: "soft" as const };
            return (
              <div
                key={j.id}
                className="glass flex flex-wrap items-center justify-between gap-4 rounded-2xl p-5"
              >
                <div className="flex items-center gap-4">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary-soft text-primary">
                    <CategoryIcon category={j.category} className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-semibold text-foreground">{j.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {j.clientName} · {j.zone}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <p className="font-display text-2xl text-foreground">{currency(o.price)}</p>
                  <Badge variant={label.v} className="px-3 py-1">
                    {label.t}
                  </Badge>
                </div>
                {j.status === "completado" &&
                  j.assignedWorkerId === me.id &&
                  (j.reviewedByMe ? (
                    <span className="text-xs text-muted-foreground">Ya calificaste al cliente</span>
                  ) : (
                    <RateControl
                      label="Califica al cliente"
                      onRate={(stars) => {
                        void domusActions
                          .rateClient(j.id, stars)
                          .then(() => toast.success("Gracias por compartir tu experiencia"))
                          .catch(() => undefined);
                      }}
                    />
                  ))}
                {j.status === "asignado" && j.assignedWorkerId === me.id && (
                  <WhatsAppContact phone={j.contactPhone} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
