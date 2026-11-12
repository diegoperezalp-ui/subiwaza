import { Link } from "@tanstack/react-router";
import {
  Droplets,
  Zap,
  Hammer,
  Paintbrush,
  KeyRound,
  Wind,
  Leaf,
  BrickWall,
  Star,
  type LucideIcon,
} from "lucide-react";
import type { Category } from "@/lib/domus";
import { initials } from "@/lib/domus";
import { cn } from "@/lib/utils";

export function Logo({ tone = "dark" }: { tone?: "dark" | "light" }) {
  return (
    <Link to="/" className="group flex items-center gap-2.5" aria-label="Subiwaza, inicio">
      <span className="relative grid h-9 w-9 place-items-center rounded-xl bg-gradient-brand shadow-glow">
        <svg
          viewBox="0 0 24 24"
          className="h-4.5 w-4.5 text-primary-foreground"
          fill="none"
          aria-hidden
        >
          <path
            d="M4 11.5 12 5l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5h-5v5H5a1 1 0 0 1-1-1v-7.5Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span
        className={cn(
          "font-display text-[1.65rem] leading-none font-semibold tracking-tight",
          tone === "light" ? "text-ink-foreground" : "text-foreground",
        )}
      >
        Subiwaza<span className="text-primary">.</span>
      </span>
    </Link>
  );
}

const ICONS: Record<Category, LucideIcon> = {
  plomeria: Droplets,
  electricidad: Zap,
  carpinteria: Hammer,
  pintura: Paintbrush,
  cerrajeria: KeyRound,
  climatizacion: Wind,
  jardineria: Leaf,
  albanileria: BrickWall,
};

export function CategoryIcon({ category, className }: { category: Category; className?: string }) {
  const Icon = ICONS[category];
  return <Icon className={className} strokeWidth={1.5} />;
}

export function Stars({ value, size = "sm" }: { value: number; size?: "sm" | "md" }) {
  const px = size === "sm" ? "h-3.5 w-3.5" : "h-5 w-5";
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value.toFixed(2)} de 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={cn(
            px,
            i <= Math.round(value) ? "fill-gold text-gold" : "fill-muted text-border",
          )}
          strokeWidth={1.2}
        />
      ))}
    </span>
  );
}

export function PersonMark({ name, className }: { name: string; className?: string }) {
  return (
    <span
      className={cn(
        "grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-ink font-display text-lg text-ink-foreground ring-1 ring-border",
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}

export function PageIntro({
  eyebrow,
  title,
  accent,
  children,
}: {
  eyebrow: string;
  title: string;
  accent?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="animate-rise max-w-2xl">
      <p className="eyebrow text-primary">{eyebrow}</p>
      <h1 className="mt-4 text-5xl leading-[1.02] text-foreground md:text-6xl">
        {title} {accent && <em className="text-gradient-brand">{accent}</em>}
      </h1>
      {children && (
        <p className="mt-5 text-base leading-relaxed text-muted-foreground">{children}</p>
      )}
    </div>
  );
}
