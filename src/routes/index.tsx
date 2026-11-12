import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ClipboardPen, Handshake, Star, ShieldCheck, Gauge } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/domus/site-header";
import { SiteFooter } from "@/components/domus/site-footer";
import { CategoryIcon } from "@/components/domus/brand";
import { CATEGORIES } from "@/lib/domus";
import hero from "@/assets/hero-domus.jpg";
import portrait from "@/assets/pro-portrait.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Subiwaza — El profesional correcto, en tu puerta" },
      {
        name: "description",
        content:
          "Publica el trabajo que necesitas, compara propuestas locales y elige con claridad.",
      },
      { property: "og:title", content: "Subiwaza — El profesional correcto, en tu puerta" },
      {
        property: "og:description",
        content: "Publica el problema de tu hogar y deja que los profesionales te encuentren.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const STEPS = [
  {
    icon: ClipboardPen,
    title: "Publicas el problema",
    text: "Describe qué ocurre, tu zona y un presupuesto de referencia. Toma menos de un minuto.",
  },
  {
    icon: Handshake,
    title: "Ellos te encuentran",
    text: "Los profesionales cercanos aceptan tu presupuesto al instante o te envían una propuesta.",
  },
  {
    icon: Star,
    title: "Eliges y calificas",
    text: "Comparas reputación, precio y tiempo. Al terminar, ambos se califican con total transparencia.",
  },
];

function Index() {
  return (
    <div className="min-h-screen">
      <SiteHeader overHero />

      {/* Hero */}
      <section className="relative isolate min-h-[100svh] overflow-hidden bg-ink">
        <img
          src={hero}
          alt="Interior elegante con herramientas de oficio sobre mármol"
          width={1920}
          height={1088}
          className="absolute inset-0 -z-10 h-full w-full object-cover"
        />
        <div className="absolute inset-0 -z-10 bg-hero-overlay" />
        <div className="mx-auto flex min-h-[100svh] max-w-6xl flex-col justify-end px-6 pt-36 pb-16 md:justify-center md:pb-24">
          <div className="max-w-2xl">
            <p className="eyebrow animate-rise text-primary">
              Servicios del hogar · Especialistas de tu zona
            </p>
            <h1 className="animate-rise mt-6 text-6xl leading-[0.95] text-ink-foreground [animation-delay:120ms] md:text-[5.5rem]">
              El oficio correcto,
              <br />
              <em className="font-normal text-primary">en tu puerta.</em>
            </h1>
            <p className="animate-rise mt-7 max-w-lg text-lg leading-relaxed text-ink-foreground/70 [animation-delay:240ms]">
              Tú publicas lo que tu hogar necesita. Plomeros, electricistas y técnicos de confianza
              te encuentran y te proponen su mejor trabajo.
            </p>
            <div className="animate-rise mt-10 flex flex-wrap gap-3 [animation-delay:360ms]">
              <Button asChild size="lg" variant="hero">
                <Link to="/publicar">
                  Publicar mi problema <ArrowRight />
                </Link>
              </Button>
              <Button asChild size="lg" variant="glassDark">
                <Link to="/trabajos">Soy profesional</Link>
              </Button>
            </div>
          </div>

          <div className="animate-rise mt-16 grid max-w-3xl grid-cols-3 gap-px overflow-hidden rounded-3xl glass-dark [animation-delay:500ms]">
            {[
              { k: "01", v: "Publicas lo que necesitas" },
              { k: "02", v: "Comparas propuestas" },
              { k: "03", v: "Tú eliges a quién contratar" },
            ].map((s) => (
              <div key={s.v} className="px-5 py-5 md:px-7">
                <p className="font-display text-3xl text-ink-foreground md:text-4xl">{s.k}</p>
                <p className="mt-1 text-xs text-ink-foreground/55">{s.v}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-6">
        {/* Categories */}
        <section className="pt-28">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="eyebrow text-primary">Especialidades</p>
              <h2 className="mt-4 max-w-xl text-4xl leading-tight md:text-5xl">
                Todo lo que tu hogar pide,{" "}
                <em className="text-gradient-brand">con un solo gesto.</em>
              </h2>
            </div>
            <Link
              to="/profesionales"
              className="group inline-flex items-center gap-2 text-sm font-semibold text-foreground"
            >
              Ver profesionales{" "}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
          <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-4">
            {CATEGORIES.map((c) => (
              <Link
                key={c.id}
                to="/publicar"
                className="glass lift group flex items-center gap-4 rounded-2xl p-5"
              >
                <span className="grid h-12 w-12 place-items-center rounded-xl bg-primary-soft text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <CategoryIcon category={c.id} className="h-5 w-5" />
                </span>
                <span>
                  <span className="block font-semibold text-foreground">{c.label}</span>
                  <span className="text-xs text-muted-foreground">{c.trade}s</span>
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="pt-32">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow text-primary">Cómo funciona</p>
            <h2 className="mt-4 text-4xl leading-tight md:text-5xl">
              Tú describes. <em className="text-gradient-brand">Ellos llegan.</em>
            </h2>
          </div>
          <div className="mt-16 grid gap-6 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <div key={s.title} className="glass relative overflow-hidden rounded-3xl p-8">
                <span className="absolute top-5 right-7 font-display text-7xl text-slate/15">
                  0{i + 1}
                </span>
                <span className="grid h-12 w-12 place-items-center rounded-full bg-gradient-brand text-primary-foreground shadow-glow">
                  <s.icon className="h-5 w-5" strokeWidth={1.6} />
                </span>
                <h3 className="mt-8 text-2xl text-foreground">{s.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{s.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* For professionals */}
        <section className="grid items-center gap-14 pt-32 md:grid-cols-2">
          <div className="relative">
            <img
              src={portrait}
              alt="Electricista profesional en un hogar moderno"
              loading="lazy"
              width={1024}
              height={1280}
              className="aspect-[4/5] w-full rounded-[2rem] object-cover shadow-elegant"
            />
            <div className="glass absolute -right-4 bottom-8 w-64 rounded-2xl p-5 md:-right-10">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">Tu perfil profesional</p>
                <ShieldCheck className="h-4 w-4 text-primary" />
              </div>
              <p className="text-xs text-muted-foreground">Plomería · Zona de trabajo</p>
              <div className="hairline my-4" />
              <div className="grid grid-cols-2 gap-2 text-center">
                <div>
                  <p className="font-display text-2xl text-foreground">★</p>
                  <p className="text-[0.65rem] text-muted-foreground">Reseñas reales</p>
                </div>
                <div>
                  <p className="font-display text-2xl text-foreground">⌖</p>
                  <p className="text-[0.65rem] text-muted-foreground">Tu zona</p>
                </div>
              </div>
            </div>
          </div>
          <div>
            <p className="eyebrow text-primary">Para profesionales</p>
            <h2 className="mt-4 text-4xl leading-tight md:text-5xl">
              Tu reputación, <em className="text-gradient-brand">tu mejor carta.</em>
            </h2>
            <p className="mt-6 leading-relaxed text-muted-foreground">
              Explora los trabajos publicados cerca de ti. Acepta al presupuesto del cliente o envía
              tu propia propuesta. Cada servicio suma a tus estadísticas: calificación, trabajos
              completados, tasa de aceptación y ganancias.
            </p>
            <ul className="mt-8 space-y-4">
              {[
                { icon: Gauge, t: "Estadísticas en tiempo real de tu desempeño" },
                { icon: ShieldCheck, t: "Clientes calificados: sabes con quién trabajas" },
                { icon: Handshake, t: "Tú decides qué trabajos tomar y a qué precio" },
              ].map((f) => (
                <li key={f.t} className="flex items-center gap-3 text-sm text-foreground">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-primary-soft text-primary">
                    <f.icon className="h-4 w-4" />
                  </span>
                  {f.t}
                </li>
              ))}
            </ul>
            <Button asChild size="lg" variant="ink" className="mt-10">
              <Link to="/trabajos">
                Ver trabajos disponibles <ArrowRight />
              </Link>
            </Button>
          </div>
        </section>

        {/* CTA */}
        <section className="pt-32">
          <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-ink px-8 py-20 text-center md:px-16">
            <div className="absolute -top-24 left-1/2 h-64 w-[36rem] -translate-x-1/2 rounded-full bg-primary/25 blur-3xl" />
            <p className="eyebrow relative text-primary">Empieza hoy</p>
            <h2 className="relative mx-auto mt-5 max-w-2xl text-4xl leading-tight text-ink-foreground md:text-6xl">
              Tu hogar merece <em>manos expertas.</em>
            </h2>
            <div className="relative mt-10 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg" variant="hero">
                <Link to="/publicar">Publicar un problema</Link>
              </Button>
              <Button asChild size="lg" variant="glassDark">
                <Link to="/profesionales">Conocer profesionales</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
