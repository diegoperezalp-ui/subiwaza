import { Link } from "@tanstack/react-router";
import { LogOut, Menu, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { getCurrentUser, logoutUser } from "@/lib/auth.functions";
import type { PublicUser } from "@/lib/auth.server";
import { Logo } from "./brand";

const NAV = [
  { to: "/profesionales", label: "Profesionales" },
  { to: "/trabajos", label: "Trabajos disponibles" },
  { to: "/panel", label: "Mi panel" },
  { to: "/cuenta", label: "Mi perfil" },
] as const;

export function SiteHeader({ overHero = false }: { overHero?: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<PublicUser | null>(null);
  const [authLoaded, setAuthLoaded] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  useEffect(() => {
    let active = true;
    void getCurrentUser()
      .then((current) => {
        if (active) {
          setUser(current);
          setAuthLoaded(true);
        }
      })
      .catch(() => {
        if (active) setAuthLoaded(true);
      });
    return () => {
      active = false;
    };
  }, []);
  const light = overHero && !scrolled;
  const leave = async () => {
    try {
      await logoutUser();
      setUser(null);
      toast.success("Sesión cerrada");
    } catch {
      toast.error("No se pudo cerrar la sesión. Intenta de nuevo.");
    }
  };

  return (
    <header className="fixed inset-x-0 top-0 z-40 px-4 pt-4">
      <div
        className={cn(
          "mx-auto flex h-16 max-w-6xl items-center justify-between rounded-full px-4 pl-5 transition-all duration-500",
          light ? "glass-dark" : "glass shadow-elegant",
        )}
      >
        <Logo tone={light ? "light" : "dark"} />
        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                light
                  ? "text-ink-foreground/75 hover:text-ink-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
              activeProps={{
                className: light ? "text-ink-foreground" : "text-foreground bg-secondary/70",
              }}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {user ? (
            <div className="hidden items-center gap-2 sm:flex">
              <Button asChild size="sm" variant="hero" className="h-10 px-4">
                <Link to="/publicar">Publicar trabajo</Link>
              </Button>
              <Button
                asChild
                size="icon"
                variant="ghost"
                className="rounded-full"
                aria-label={`Abrir panel de ${user.name}`}
              >
                <Link to="/panel">
                  <UserRound />
                </Link>
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="rounded-full"
                aria-label="Cerrar sesión"
                onClick={() => void leave()}
              >
                <LogOut />
              </Button>
            </div>
          ) : (
            <Button asChild size="sm" variant="hero" className="hidden h-10 px-5 sm:inline-flex">
              <Link to="/acceso">{authLoaded ? "Entrar / Registrarme" : "Entrar"}</Link>
            </Button>
          )}
          <Sheet>
            <SheetTrigger asChild>
              <Button
                size="icon"
                variant={light ? "glassDark" : "ghost"}
                className="md:hidden"
                aria-label="Abrir menú"
              >
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent className="glass border-l-0">
              <SheetTitle className="sr-only">Menú</SheetTitle>
              <div className="mt-2">
                <Logo />
              </div>
              <nav className="mt-10 flex flex-col gap-1">
                {[
                  { to: "/", label: "Inicio" } as const,
                  ...NAV,
                  { to: "/publicar", label: "Publicar un trabajo" } as const,
                  ...(!user ? [{ to: "/acceso", label: "Entrar o crear cuenta" } as const] : []),
                ].map((n) => (
                  <Link
                    key={n.to}
                    to={n.to}
                    className="rounded-xl px-3 py-3 font-display text-2xl text-foreground hover:bg-secondary/70"
                  >
                    {n.label}
                  </Link>
                ))}
              </nav>
              {user && (
                <div className="mt-7 flex items-center justify-between gap-3 border-t border-border pt-5">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{user.name}</p>
                    <p className="text-xs text-muted-foreground">Sesión activa</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => void leave()}>
                    <LogOut className="h-4 w-4" /> Salir
                  </Button>
                </div>
              )}
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
