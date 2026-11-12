import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowRight, MapPin, ShieldCheck } from "lucide-react";
import { PageShell } from "@/components/domus/page-shell";
import { CategoryIcon, PageIntro } from "@/components/domus/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CATEGORIES, URGENCY_LABEL, type Category, type Urgency } from "@/lib/domus";
import { domusActions, useDomus } from "@/lib/domus-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/publicar")({
  head: () => ({
    meta: [
      { title: "Publicar un trabajo — Subiwaza" },
      {
        name: "description",
        content: "Describe lo que necesitas y recibe propuestas de especialistas de tu zona.",
      },
      { property: "og:title", content: "Publicar un trabajo — Subiwaza" },
      {
        property: "og:description",
        content: "Describe lo que necesita tu hogar y deja que los profesionales te encuentren.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Publicar,
});

function Publicar() {
  const navigate = useNavigate();
  const state = useDomus();
  const [category, setCategory] = useState<Category>("plomeria");
  const [urgency, setUrgency] = useState<Urgency>("semana");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [zone, setZone] = useState("");
  const [budget, setBudget] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(budget);
    if (title.trim().length < 6) {
      toast.error("Describe el problema en un título más claro.");
      return;
    }
    if (!zone.trim()) {
      toast.error("Indica tu colonia o zona.");
      return;
    }
    if (!amount || amount < 100) {
      toast.error("El presupuesto mínimo es de $100.");
      return;
    }
    try {
      await domusActions.publish({
        title: title.trim(),
        description: description.trim(),
        zone: zone.trim(),
        budget: amount,
        category,
        urgency,
      });
    } catch {
      return;
    }
    toast.success("Tu problema fue publicado", {
      description: "Los profesionales cercanos ya pueden verlo y enviarte propuestas.",
    });
    navigate({ to: "/panel" });
  };

  if (state.loading)
    return (
      <PageShell>
        <div className="glass rounded-3xl p-10 text-center text-muted-foreground">
          Cargando tu cuenta…
        </div>
      </PageShell>
    );
  if (!state.user)
    return (
      <PageShell>
        <div className="glass mx-auto max-w-2xl rounded-3xl p-8 text-center md:p-12">
          <ShieldCheck className="mx-auto h-10 w-10 text-primary" />
          <h1 className="mt-5 text-4xl text-foreground">Inicia sesión para publicar</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Tu trabajo quedará guardado en tu cuenta y los especialistas podrán enviarte propuestas.
          </p>
          <Button asChild className="mt-7">
            <Link to="/acceso">
              Entrar o crear cuenta <ArrowRight />
            </Link>
          </Button>
        </div>
      </PageShell>
    );
  if (!state.user.roles.includes("cliente"))
    return (
      <PageShell>
        <div className="glass mx-auto max-w-2xl rounded-3xl p-8 text-center md:p-12">
          <h1 className="text-4xl text-foreground">Esta cuenta es de especialista</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Para publicar trabajos, elige el perfil de cliente al registrarte.
          </p>
          <Button asChild className="mt-7">
            <Link to="/panel">
              Ir a mi panel <ArrowRight />
            </Link>
          </Button>
        </div>
      </PageShell>
    );
  if (!state.databaseReady)
    return (
      <PageShell>
        <div className="glass mx-auto max-w-2xl rounded-3xl p-8 text-center md:p-12">
          <h1 className="text-3xl text-foreground">Falta conectar la base de datos</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Configura MongoDB en el archivo privado `.env` para guardar publicaciones y compartirlas
            entre todas las cuentas.
          </p>
        </div>
      </PageShell>
    );

  return (
    <PageShell>
      <div className="grid gap-14 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <PageIntro eyebrow="Para tu hogar" title="Cuéntanos qué" accent="necesitas.">
            Publica el problema una sola vez. Los profesionales de tu zona lo verán y podrán
            aceptarlo con tu presupuesto o enviarte una propuesta para que tú elijas.
          </PageIntro>
          <div className="mt-12 space-y-4">
            {[
              { icon: ShieldCheck, t: "Tu teléfono privado no aparece en la publicación" },
              { icon: MapPin, t: "Tu dirección exacta se comparte únicamente al confirmar" },
            ].map((f) => (
              <div key={f.t} className="flex items-center gap-3 text-sm text-muted-foreground">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-primary-soft text-primary">
                  <f.icon className="h-4 w-4" />
                </span>
                {f.t}
              </div>
            ))}
          </div>
        </div>

        <form
          onSubmit={submit}
          className="glass animate-rise space-y-8 rounded-[2rem] p-7 shadow-elegant md:p-10"
        >
          <div>
            <Label className="eyebrow text-muted-foreground">Especialidad</Label>
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {CATEGORIES.map((c) => (
                <button
                  type="button"
                  key={c.id}
                  onClick={() => setCategory(c.id)}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-2xl border px-2 py-4 text-xs font-semibold transition-all",
                    category === c.id
                      ? "border-primary bg-primary-soft text-accent-foreground shadow-glow"
                      : "border-border bg-card/50 text-muted-foreground hover:border-primary/40 hover:text-foreground",
                  )}
                >
                  <CategoryIcon category={c.id} className="h-5 w-5" />
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">¿Qué está pasando?</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej. Fuga de agua bajo el fregadero"
              maxLength={90}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="desc">Detalles</Label>
            <Textarea
              id="desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Desde cuándo ocurre, qué has intentado, medidas o materiales…"
              maxLength={500}
            />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="zone">Colonia o zona</Label>
              <Input
                id="zone"
                value={zone}
                onChange={(e) => setZone(e.target.value)}
                placeholder="Ej. Centro, Monterrey"
                maxLength={80}
                required
                minLength={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="budget">Presupuesto de referencia (MXN)</Label>
              <Input
                id="budget"
                type="number"
                inputMode="numeric"
                min={100}
                max={2000000}
                step={1}
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="1,000"
                required
              />
            </div>
          </div>
          <div>
            <Label className="eyebrow text-muted-foreground">¿Para cuándo?</Label>
            <div className="mt-4 flex flex-wrap gap-2">
              {(Object.keys(URGENCY_LABEL) as Urgency[]).map((u) => (
                <button
                  type="button"
                  key={u}
                  onClick={() => setUrgency(u)}
                  className={cn(
                    "rounded-full border px-4 py-2 text-sm font-medium transition-all",
                    urgency === u
                      ? "border-ink bg-ink text-ink-foreground"
                      : "border-border bg-card/50 text-muted-foreground hover:text-foreground",
                  )}
                >
                  {URGENCY_LABEL[u]}
                </button>
              ))}
            </div>
          </div>
          <Button type="submit" size="lg" variant="hero" className="w-full">
            Publicar y recibir propuestas <ArrowRight />
          </Button>
        </form>
      </div>
    </PageShell>
  );
}
