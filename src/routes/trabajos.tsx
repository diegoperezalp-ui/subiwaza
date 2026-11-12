import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Clock, MapPin, Send, Check, Users, Search } from "lucide-react";
import { PageShell } from "@/components/domus/page-shell";
import { CategoryIcon, PageIntro, PersonMark, Stars } from "@/components/domus/brand";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CATEGORIES,
  URGENCY_LABEL,
  categoryLabel,
  currency,
  timeAgo,
  tradeLabel,
  type Category,
  type Job,
} from "@/lib/domus";
import { domusActions, useDomus } from "@/lib/domus-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/trabajos")({
  head: () => ({
    meta: [
      { title: "Trabajos disponibles — Subiwaza" },
      {
        name: "description",
        content:
          "Encuentra trabajos de plomería, electricidad y más cerca de ti. Acepta al presupuesto del cliente o envía tu propuesta.",
      },
      { property: "og:title", content: "Trabajos disponibles — Subiwaza" },
      {
        property: "og:description",
        content:
          "Los profesionales eligen: acepta trabajos o envía propuestas a clientes cercanos.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Trabajos,
});

function Trabajos() {
  const state = useDomus();
  const me = state.workers.find((w) => w.id === state.myWorkerId);
  const [filter, setFilter] = useState<Category | "todas">("todas");
  const [search, setSearch] = useState("");
  const [offerJob, setOfferJob] = useState<Job | null>(null);

  const jobs = useMemo(
    () =>
      state.jobs
        .filter((j) => !j.mine && (j.status === "abierto" || j.assignedWorkerId === me?.id))
        .filter((j) => filter === "todas" || j.category === filter)
        .filter(
          (j) =>
            !search.trim() ||
            `${j.title} ${j.description} ${j.zone} ${j.category}`
              .toLocaleLowerCase("es-MX")
              .includes(search.trim().toLocaleLowerCase("es-MX")),
        ),
    [state.jobs, filter, me?.id, search],
  );

  return (
    <PageShell>
      <div className="flex flex-col justify-between gap-10 lg:flex-row lg:items-end">
        <PageIntro eyebrow="Para profesionales" title="Trabajos que" accent="te esperan.">
          Elige los servicios que quieres tomar. Acepta con el presupuesto del cliente o envíale tu
          propia propuesta para que la apruebe.
        </PageIntro>
        <div className="glass flex items-center gap-4 rounded-2xl p-4 pr-6">
          <PersonMark name={me?.name ?? "Subiwaza"} />
          <div>
            <p className="eyebrow text-muted-foreground">Perfil activo</p>
            <p className="font-semibold text-foreground">{me?.name ?? "Explora trabajos"}</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {me ? (
                <>
                  {tradeLabel(me.trade)} · <Stars value={me.rating} />{" "}
                  {me.rating ? me.rating.toFixed(2) : "Aún sin reseñas"}
                </>
              ) : (
                "Crea tu perfil para postularte"
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <label className="relative block w-full max-w-xl">
          <Search className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Busca por oficio, problema o zona"
            aria-label="Buscar trabajos"
            className="pl-11"
          />
        </label>
        <p className="shrink-0 text-xs text-muted-foreground">
          {jobs.length} {jobs.length === 1 ? "trabajo" : "trabajos"}
        </p>
      </div>
      <div className="mt-5 flex gap-2 overflow-x-auto pb-2">
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

      {(!state.user || !state.user.roles.includes("profesional")) && (
        <div className="glass mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl p-5">
          <div>
            <p className="font-semibold text-foreground">¿Ofreces un oficio?</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Crea un perfil de especialista para proponer tu precio y tomar trabajos.
            </p>
          </div>
          <Button asChild size="sm">
            <Link to="/acceso">Crear perfil profesional</Link>
          </Button>
        </div>
      )}
      {!state.databaseReady && (
        <div className="glass mt-6 rounded-2xl p-5 text-sm text-muted-foreground">
          Conecta MongoDB para ver trabajos publicados por otras cuentas.
        </div>
      )}

      <div className="mt-8 grid gap-5 md:grid-cols-2">
        {jobs.length === 0 && (
          <div className="glass col-span-full rounded-3xl p-12 text-center text-muted-foreground">
            No hay trabajos abiertos en esta especialidad por ahora.
          </div>
        )}
        {jobs.map((j) => {
          const myOffer = j.offers.find((o) => o.workerId === me?.id);
          const assignedToMe = j.assignedWorkerId === me?.id;
          return (
            <article key={j.id} className="glass lift flex flex-col rounded-3xl p-7">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary-soft text-primary">
                    <CategoryIcon category={j.category} className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="eyebrow text-muted-foreground">{categoryLabel(j.category)}</p>
                    <p className="text-xs text-muted-foreground" suppressHydrationWarning>
                      {timeAgo(j.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-display text-3xl leading-none text-foreground">
                    {currency(j.budget)}
                  </p>
                  <p className="mt-1 text-[0.7rem] text-muted-foreground">Presupuesto</p>
                </div>
              </div>
              <h3 className="mt-6 text-2xl leading-snug text-foreground">{j.title}</h3>
              <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                {j.description}
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-2">
                <Badge variant={j.urgency === "hoy" ? "soft" : "slate"}>
                  <Clock className="h-3 w-3" /> {URGENCY_LABEL[j.urgency]}
                </Badge>
                <Badge variant="slate">
                  <MapPin className="h-3 w-3" /> {j.zone}
                </Badge>
                <Badge variant="slate">
                  <Users className="h-3 w-3" /> {j.offerCount ?? j.offers.length}{" "}
                  {(j.offerCount ?? j.offers.length) === 1 ? "propuesta" : "propuestas"}
                </Badge>
              </div>
              <div className="hairline my-6" />
              <div className="mt-auto flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">{j.clientName}</span>
                  <Stars value={j.clientRating} /> {j.clientRating.toFixed(1)}
                </div>
                {assignedToMe ? (
                  <Badge variant="default" className="px-3 py-1">
                    <Check className="h-3 w-3" /> Asignado a ti
                  </Badge>
                ) : myOffer ? (
                  <Badge variant="soft" className="px-3 py-1">
                    Propuesta enviada · {currency(myOffer.price)}
                  </Badge>
                ) : state.user?.roles.includes("profesional") ? (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-9"
                      onClick={() => setOfferJob(j)}
                    >
                      <Send /> Proponer
                    </Button>
                    <Button
                      size="sm"
                      className="h-9"
                      onClick={() => {
                        void domusActions
                          .acceptAtBudget(j.id)
                          .then(() =>
                            toast.success("Trabajo aceptado", {
                              description: "El cliente recibirá tu confirmación.",
                            }),
                          )
                          .catch(() => undefined);
                      }}
                    >
                      Aceptar por {currency(j.budget)}
                    </Button>
                  </div>
                ) : (
                  <Button asChild size="sm" variant="outline">
                    <Link to="/acceso">Postularme</Link>
                  </Button>
                )}
              </div>
            </article>
          );
        })}
      </div>

      <OfferDialog job={offerJob} onClose={() => setOfferJob(null)} />
    </PageShell>
  );
}

function OfferDialog({ job, onClose }: { job: Job | null; onClose: () => void }) {
  const [price, setPrice] = useState("");
  const [eta, setEta] = useState("");
  const [message, setMessage] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!job) return;
    const amount = Number(price);
    if (!amount || amount < 100) {
      toast.error("Indica un precio válido.");
      return;
    }
    if (!eta.trim()) {
      toast.error("Indica cuándo podrías ir.");
      return;
    }
    try {
      await domusActions.sendOffer(job.id, {
        price: amount,
        eta: eta.trim(),
        message: message.trim(),
      });
    } catch {
      return;
    }
    toast.success("Propuesta enviada", {
      description: "El cliente decidirá si acepta tu solicitud.",
    });
    setPrice("");
    setEta("");
    setMessage("");
    onClose();
  };

  return (
    <Dialog open={!!job} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <p className="eyebrow text-primary">Enviar solicitud</p>
          <DialogTitle>{job?.title}</DialogTitle>
          <DialogDescription>
            Presupuesto del cliente: {job ? currency(job.budget) : ""}. Propón tu precio y horario.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="price">Tu precio (MXN)</Label>
              <Input
                id="price"
                type="number"
                min={100}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder={job ? String(job.budget) : ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="eta">Disponibilidad</Label>
              <Input
                id="eta"
                value={eta}
                onChange={(e) => setEta(e.target.value)}
                placeholder="Hoy, 5:00 pm"
                maxLength={40}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="msg">Mensaje para el cliente</Label>
            <Textarea
              id="msg"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Qué incluye tu servicio, materiales, garantía…"
              maxLength={300}
            />
          </div>
          <Button type="submit" variant="hero" size="lg" className="w-full">
            Enviar propuesta <Send />
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
