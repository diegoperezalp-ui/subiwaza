import { Link } from "@tanstack/react-router";
import { Logo } from "./brand";

export function SiteFooter() {
  return (
    <footer className="mt-32 bg-gradient-ink text-ink-foreground">
      <div className="mx-auto grid max-w-6xl gap-12 px-6 py-16 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Logo tone="light" />
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-ink-foreground/60">
            Publica lo que necesitas, compara propuestas y elige con información clara. Cada trabajo
            terminado ayuda a construir una comunidad con reputación de doble vía.
          </p>
        </div>
        <div>
          <p className="eyebrow text-ink-foreground/45">Hogares</p>
          <ul className="mt-5 space-y-3 text-sm text-ink-foreground/75">
            <li>
              <Link to="/publicar" className="hover:text-primary">
                Publicar un problema
              </Link>
            </li>
            <li>
              <Link to="/profesionales" className="hover:text-primary">
                Conocer profesionales
              </Link>
            </li>
            <li>
              <Link to="/panel" className="hover:text-primary">
                Mi panel
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="eyebrow text-ink-foreground/45">Profesionales</p>
          <ul className="mt-5 space-y-3 text-sm text-ink-foreground/75">
            <li>
              <Link to="/trabajos" className="hover:text-primary">
                Trabajos disponibles
              </Link>
            </li>
            <li>
              <Link to="/panel" className="hover:text-primary">
                Mis estadísticas
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="mx-auto max-w-6xl border-t border-ink-foreground/10 px-6 py-6 text-xs text-ink-foreground/40">
        © 2026 Subiwaza. El oficio correcto, en tu puerta.
      </div>
    </footer>
  );
}
