import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  KeyRound,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { CategoryIcon } from "@/components/domus/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CATEGORIES, type Category } from "@/lib/domus";
import { loginUser, registerUser } from "@/lib/auth.functions";

export const Route = createFileRoute("/acceso")({
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
  const [role, setRole] = useState<"cliente" | "profesional" | "ambos">("cliente");
  const [trade, setTrade] = useState<Category>("plomeria");
  const [zone, setZone] = useState("");
  const [contactConsent, setContactConsent] = useState(false);
  const registering = mode === "registro";

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    try {
      if (registering) {
        await registerUser({
          data: { name, email, phone, password, role, trade, zone, contactConsent: true },
        });
        toast.success("¡Bienvenido a Subiwaza!", { description: "Tu cuenta ya está lista." });
      } else {
        await loginUser({ data: { email, password } });
        toast.success("Sesión iniciada", { description: "Ya puedes continuar con tus trabajos." });
      }
      await navigate({ to: "/panel" });
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
              ? "Un mismo perfil te permite buscar trabajos u ofrecer tus servicios."
              : "Entra para ver tus trabajos, propuestas y actividad."}
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
            {registering && (
              <div className="space-y-3">
                <Label>¿Cómo quieres usar Subiwaza?</Label>
                <div className="grid grid-cols-3 gap-2">
                  {(["cliente", "profesional", "ambos"] as const).map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setRole(value)}
                      className={`flex min-h-20 flex-col items-center justify-center gap-2 rounded-2xl border text-xs font-semibold capitalize transition ${role === value ? "border-primary bg-primary-soft text-accent-foreground shadow-glow" : "border-border bg-card/50 text-muted-foreground hover:border-primary/50"}`}
                    >
                      <span className="grid h-8 w-8 place-items-center rounded-xl bg-secondary">
                        {value === "cliente" ? (
                          <UserRound className="h-4 w-4" />
                        ) : value === "profesional" ? (
                          <BriefcaseBusiness className="h-4 w-4" />
                        ) : (
                          <KeyRound className="h-4 w-4" />
                        )}
                      </span>
                      {value}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {registering && role !== "cliente" && (
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
              disabled={busy || (registering && !contactConsent)}
            >
              {busy ? "Un momento…" : registering ? "Crear mi cuenta" : "Entrar a Subiwaza"}
              <ArrowRight />
            </Button>
          </form>
          <p className="mt-6 text-center text-xs leading-relaxed text-muted-foreground">
            Al continuar aceptas las reglas de convivencia de Subiwaza. Tus datos de contacto no se
            muestran en los trabajos públicos.
          </p>
          <p className="mt-8 text-center text-xs text-muted-foreground">
            <Link to="/" className="hover:text-primary">
              Explorar Subiwaza sin cuenta
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
