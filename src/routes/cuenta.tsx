import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowRight, ShieldCheck, UserRound, BriefcaseBusiness } from "lucide-react";
import { PageShell } from "@/components/domus/page-shell";
import { PageIntro } from "@/components/domus/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CATEGORIES, type Category } from "@/lib/domus";
import { domusActions, useDomus } from "@/lib/domus-store";
import { requireAccount } from "@/lib/route-access";

export const Route = createFileRoute("/cuenta")({
  beforeLoad: () => requireAccount(),
  head: () => ({
    meta: [
      { title: "Mi perfil — Subiwaza" },
      {
        name: "description",
        content: "Actualiza tu información y tus perfiles de cliente o especialista en Subiwaza.",
      },
    ],
  }),
  component: Cuenta,
});

function Cuenta() {
  const state = useDomus();
  const user = state.user;
  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [zone, setZone] = useState(user?.zone ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [years, setYears] = useState(String(user?.years ?? 0));
  const [trade, setTrade] = useState<Category>((user?.trade as Category) ?? "plomeria");
  const [addRole, setAddRole] = useState<"cliente" | "profesional">();
  const [busy, setBusy] = useState(false);

  if (state.loading)
    return (
      <PageShell>
        <div className="glass rounded-3xl p-10 text-center text-muted-foreground">
          Cargando tu perfil…
        </div>
      </PageShell>
    );
  if (!user)
    return (
      <PageShell>
        <div className="glass mx-auto max-w-xl rounded-3xl p-10 text-center">
          <UserRound className="mx-auto h-9 w-9 text-primary" />
          <h1 className="mt-4 text-3xl text-foreground">Inicia sesión para editar tu perfil</h1>
          <Button asChild className="mt-6">
            <Link to="/acceso">
              Entrar a Subiwaza <ArrowRight />
            </Link>
          </Button>
        </div>
      </PageShell>
    );

  const professional = user.roles.includes("profesional") || addRole === "profesional";
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    try {
      await domusActions.updateProfile({
        name,
        phone,
        zone,
        bio,
        years: Number(years),
        ...(professional ? { trade } : {}),
        ...(addRole ? { addRole } : {}),
      });
      setAddRole(undefined);
      toast.success("Perfil actualizado", {
        description: "Tus cambios ya están guardados en tu cuenta.",
      });
    } catch {
      /* The action shows a useful error message. */
    } finally {
      setBusy(false);
    }
  };

  return (
    <PageShell>
      <div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr]">
        <div>
          <PageIntro eyebrow="Tu cuenta" title="Tu perfil," accent="a tu manera.">
            Mantén actualizada tu información para que clientes y especialistas sepan con quién
            están coordinando.
          </PageIntro>
          <div className="glass mt-8 space-y-4 rounded-3xl p-6">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary-soft text-primary">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">Tu contacto es privado</p>
                <p className="text-xs text-muted-foreground">
                  No mostramos tu correo ni celular en los trabajos públicos.
                </p>
              </div>
            </div>
            <div className="hairline" />
            <p className="text-xs text-muted-foreground">
              Teléfono:{" "}
              <span className="font-semibold text-foreground">
                {user.phoneVerified ? "Verificado" : "Pendiente de verificación"}
              </span>
            </p>
            <p className="text-xs text-muted-foreground">
              Correo: <span className="font-semibold text-foreground">{user.email}</span> ·{" "}
              {user.emailVerified ? "Verificado" : "Pendiente de verificación"}
            </p>
          </div>
        </div>

        <form
          onSubmit={submit}
          className="glass space-y-7 rounded-[2rem] p-6 shadow-elegant sm:p-9"
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="profile-name">Nombre</Label>
              <Input
                id="profile-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                minLength={2}
                maxLength={80}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-phone">Celular / WhatsApp</Label>
              <Input
                id="profile-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                minLength={10}
                maxLength={24}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="profile-zone">Ciudad o zona de trabajo</Label>
            <Input
              id="profile-zone"
              value={zone}
              onChange={(e) => setZone(e.target.value)}
              minLength={2}
              maxLength={80}
              required
            />
          </div>
          {!user.roles.includes("cliente") && !addRole && (
            <button
              type="button"
              onClick={() => setAddRole("cliente")}
              className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card/50 p-4 text-left hover:border-primary/50"
            >
              <UserRound className="h-5 w-5 text-primary" />
              <span>
                <strong className="block text-sm text-foreground">
                  También necesito contratar
                </strong>
                <span className="text-xs text-muted-foreground">
                  Activa el perfil de cliente en esta cuenta.
                </span>
              </span>
            </button>
          )}
          {!user.roles.includes("profesional") && !addRole && (
            <button
              type="button"
              onClick={() => setAddRole("profesional")}
              className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card/50 p-4 text-left hover:border-primary/50"
            >
              <BriefcaseBusiness className="h-5 w-5 text-primary" />
              <span>
                <strong className="block text-sm text-foreground">También ofrezco un oficio</strong>
                <span className="text-xs text-muted-foreground">
                  Activa el perfil de especialista en esta cuenta.
                </span>
              </span>
            </button>
          )}
          {professional && (
            <>
              <div className="space-y-3">
                <Label>Oficio principal</Label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {CATEGORIES.map((category) => (
                    <button
                      type="button"
                      key={category.id}
                      onClick={() => setTrade(category.id)}
                      className={`rounded-xl border px-3 py-2.5 text-xs font-semibold transition ${trade === category.id ? "border-primary bg-primary-soft text-accent-foreground" : "border-border bg-card/50 text-muted-foreground hover:border-primary/40"}`}
                    >
                      {category.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="profile-years">Años de experiencia</Label>
                  <Input
                    id="profile-years"
                    type="number"
                    min={0}
                    max={60}
                    step={1}
                    value={years}
                    onChange={(e) => setYears(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profile-bio">Sobre tu trabajo</Label>
                  <Textarea
                    id="profile-bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    maxLength={700}
                    placeholder="Cuéntales qué servicios realizas y cómo trabajas."
                  />
                </div>
              </div>
            </>
          )}
          <Button type="submit" size="lg" variant="hero" className="w-full" disabled={busy}>
            {busy ? "Guardando…" : "Guardar mi perfil"}
            <ArrowRight />
          </Button>
        </form>
      </div>
    </PageShell>
  );
}
