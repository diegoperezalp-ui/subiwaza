import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, BriefcaseBusiness, ShieldCheck, UserRound } from "lucide-react";
import { CategoryIcon } from "@/components/domus/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CATEGORIES, type Category } from "@/lib/domus";
import { loginUser, registerUser } from "@/lib/auth.functions";
import { dashboardPath } from "@/lib/route-access";
import { getCurrentUser } from "@/lib/auth.functions";

export const Route = createFileRoute("/acceso")({
  beforeLoad: async () => {
    const user = await getCurrentUser();
    if (user) throw redirect({ to: dashboardPath(user) });
  },
  head: () => ({
    meta: [
      { title: "Tu cuenta — Subiwaza" },
      {
        name: "description",
        content: "Crea tu cuenta de Subiwaza o inicia sesión para gestionar trabajos y propuestas.",
      },
    ],
  }),
  component: Acceso,
});

function Acceso() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"registro" | "entrar">("registro");
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"cliente" | "profesional" | null>(null);
  const [trade, setTrade] = useState<Category>("plomeria");
  const [zone, setZone] = useState("");
  const [contactConsent, setContactConsent] = useState(false);
  const registering = mode === "registro";

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    try {
      let account;
      if (registering) {
        if (!role) throw new Error("Primero elige si te registras como cliente o especialista.");
        account = await registerUser({
          data: {
            name,
            email,
            phone,
            password,
            role,
            ...(role === "profesional" ? { trade } : {}),
            zone,
            contactConsent: true,
          },
        });
        toast.success("¡Bienvenido a Subiwaza!", { description: "Tu cuenta ya está lista." });
      } else {
        account = await loginUser({ data: { email, password } });
        toast.success("Sesión iniciada", { description: "Ya puedes continuar con tus trabajos." });
      }
      await navigate({ to: dashboardPath(account) });
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "No pudimos crear tu cuenta.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="relative grid min-h-screen overflow-hidden bg-background lg:grid-cols-[1fr_1fr]">
      <section className="relative hidden overflow-hidden bg-gradient-ink lg:flex lg:flex-col lg:justify-between lg:p-14 xl:p-20">
        <div className="pointer-events-none absolute -top-32 -right-28 h-[30rem] w-[30rem] rounded-full bg-primary/20 blur-3xl" />
        <Link
          to="/"
          className="relative inline-flex items-center gap-2 text-sm text-ink-foreground/75"
        >
          <ArrowLeft className="h-4 w-4" /> Volver al inicio
        </Link>
        <div className="relative max-w-xl">
          <span className="mb-8 grid h-14 w-14 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-glow">
            <ShieldCheck className="h-7 w-7" />
          </span>
          <p className="eyebrow text-primary">Subiwaza · confianza en cada trabajo</p>
          <h1 className="mt-5 text-6xl leading-[.98] text-ink-foreground xl:text-7xl">
            El trabajo correcto empieza con{" "}
            <em className="font-normal text-primary">una buena conexión.</em>
          </h1>
          <p className="mt-6 max-w-md text-base leading-relaxed text-ink-foreground/65">
            Publica lo que necesitas, compara propuestas y decide con claridad. Si ofreces un
            oficio, encuentra oportunidades que se ajusten a ti.
          </p>
        </div>
        <p className="relative text-xs text-ink-foreground/40">
          Tu información personal se mantiene privada y protegida.
        </p>
      </section>

      <section className="flex items-center justify-center px-5 py-12 sm:px-8 lg:px-12">
        <div className="w-full max-w-lg">
          <Link
            to="/"
            className="mb-10 inline-flex items-center gap-2 text-sm font-semibold text-foreground lg:hidden"
          >
            <ArrowLeft className="h-4 w-4" /> Subiwaza
          </Link>
          <p className="eyebrow text-primary">
            {registering ? "Únete a la comunidad" : "Qué bueno verte de nuevo"}
          </p>
          <h2 className="mt-3 text-4xl text-foreground">
            {registering ? "Crea tu cuenta." : "Inicia sesión."}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {registering
              ? "Elige qué tipo de cuenta quieres crear. Cada perfil tiene su propio espacio y herramientas."
              : "Entra para ver el espacio y las herramientas de tu tipo de cuenta."}
          </p>

          <div className="mt-7 grid grid-cols-2 rounded-2xl border border-border bg-card/60 p-1.5">
            <button
              type="button"
              onClick={() => setMode("registro")}
              className={`rounded-xl px-3 py-3 text-sm font-semibold transition ${registering ? "bg-primary text-primary-foreground shadow-glow" : "text-muted-foreground hover:text-foreground"}`}
            >
              Crear cuenta
            </button>
            <button
              type="button"
              onClick={() => setMode("entrar")}
              className={`rounded-xl px-3 py-3 text-sm font-semibold transition ${!registering ? "bg-primary text-primary-foreground shadow-glow" : "text-muted-foreground hover:text-foreground"}`}
            >
              Iniciar sesión
            </button>
          </div>

          <form onSubmit={submit} className="mt-7 space-y-5">
            {registering && (
              <fieldset className="space-y-3">
                <legend className="font-semibold text-foreground">
                  Primero, elige tu tipo de cuenta
                </legend>
                <div
                  role="radiogroup"
                  aria-label="Tipo de cuenta"
                  className="grid gap-3 sm:grid-cols-2"
                >
                  {(
                    [
                      {
                        value: "cliente",
                        title: "Soy cliente",
                        description: "Publica un trabajo y compara especialistas.",
                        icon: UserRound,
                      },
                      {
                        value: "profesional",
                        title: "Soy especialista",
                        description: "Encuentra trabajos y envía tus propuestas.",
                        icon: BriefcaseBusiness,
                      },
                    ] as const
                  ).map(({ value, title, description, icon: Icon }) => (
                    <button
                      key={value}
                      type="button"
                      role="radio"
                      aria-checked={role === value}
                      onClick={() => setRole(value)}
                      className={`group rounded-2xl border p-4 text-left transition duration-300 hover:-translate-y-0.5 ${role === value ? "border-primary bg-primary-soft shadow-glow" : "border-border bg-card/55 hover:border-primary/50"}`}
                    >
                      <span className="flex items-center gap-3">
                        <span
                          className={`grid h-11 w-11 place-items-center rounded-xl ${role === value ? "bg-primary text-primary-foreground" : "bg-secondary text-primary"}`}
                        >
                          <Icon className="h-5 w-5" />
                        </span>
                        <span>
                          <span className="block font-semibold text-foreground">{title}</span>
                          <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                            {description}
                          </span>
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              </fieldset>
            )}
            {registering && (
              <div className="space-y-2">
                <Label htmlFor="full-name">Nombre completo</Label>
                <Input
                  id="full-name"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Cómo te llamamos"
                  required
                  minLength={2}
                  maxLength={80}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@correo.com"
                required
                maxLength={254}
              />
            </div>
            {registering && (
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="phone">Celular / WhatsApp</Label>
                  <Input
                    id="phone"
                    type="tel"
                    autoComplete="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+52 55 1234 5678"
                    required
                    minLength={10}
                    maxLength={24}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zone">Ciudad o zona</Label>
                  <Input
                    id="zone"
                    autoComplete="address-level2"
                    value={zone}
                    onChange={(e) => setZone(e.target.value)}
                    placeholder="Tu ciudad y colonia"
                    required
                    minLength={2}
                    maxLength={80}
                  />
                </div>
              </div>
            )}
            {registering && role === "profesional" && (
              <div className="space-y-2">
                <Label htmlFor="trade">Tu oficio principal</Label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {CATEGORIES.map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => setTrade(category.id)}
                      className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-medium transition ${trade === category.id ? "border-primary bg-primary-soft text-accent-foreground" : "border-border bg-card/50 text-muted-foreground hover:border-primary/40"}`}
                    >
                      <CategoryIcon category={category.id} className="h-4 w-4" />
                      {category.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {registering && (
              <label className="flex items-start gap-3 rounded-2xl border border-border bg-card/50 p-4 text-xs leading-relaxed text-muted-foreground">
                <input
                  type="checkbox"
                  checked={contactConsent}
                  onChange={(event) => setContactConsent(event.target.checked)}
                  required
                  className="mt-0.5 accent-primary"
                />
                <span>
                  Acepto que, al asignarse un trabajo, Subiwaza comparta mi número con la otra
                  persona para coordinarlo por llamada o WhatsApp. No se muestra en publicaciones
                  abiertas.
                </span>
              </label>
            )}
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                autoComplete={registering ? "new-password" : "current-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={registering ? "Al menos 10 caracteres" : "Tu contraseña"}
                required
                minLength={registering ? 10 : 1}
                maxLength={128}
              />
            </div>
            <Button
              type="submit"
              size="lg"
              variant="hero"
              className="mt-2 w-full"
              disabled={busy || (registering && (!contactConsent || !role))}
            >
              {busy ? "Un momento…" : registering ? "Crear mi cuenta" : "Entrar a Subiwaza"}
              <ArrowRight />
            </Button>
          </form>
          <p className="mt-6 text-center text-xs leading-relaxed text-muted-foreground">
            Al continuar aceptas las reglas de convivencia de Subiwaza. Tus datos de contacto no se
            muestran en los trabajos públicos.
          </p>
        </div>
      </section>
    </main>
  );
}
