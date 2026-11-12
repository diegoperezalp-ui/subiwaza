// Pure marketplace logic: clients publish home problems, professionals accept or propose.
export type Category =
  | "plomeria"
  | "electricidad"
  | "carpinteria"
  | "pintura"
  | "cerrajeria"
  | "climatizacion"
  | "jardineria"
  | "albanileria";

export const CATEGORIES: { id: Category; label: string; trade: string }[] = [
  { id: "plomeria", label: "Plomería", trade: "Plomero" },
  { id: "electricidad", label: "Electricidad", trade: "Electricista" },
  { id: "carpinteria", label: "Carpintería", trade: "Carpintero" },
  { id: "pintura", label: "Pintura", trade: "Pintor" },
  { id: "cerrajeria", label: "Cerrajería", trade: "Cerrajero" },
  { id: "climatizacion", label: "Climatización", trade: "Técnico en clima" },
  { id: "jardineria", label: "Jardinería", trade: "Jardinero" },
  { id: "albanileria", label: "Albañilería", trade: "Albañil" },
];

export const categoryLabel = (c: Category) => CATEGORIES.find((x) => x.id === c)?.label ?? c;
export const tradeLabel = (c: Category) => CATEGORIES.find((x) => x.id === c)?.trade ?? c;

export type Urgency = "hoy" | "semana" | "flexible";
export const URGENCY_LABEL: Record<Urgency, string> = {
  hoy: "Urgente · hoy",
  semana: "Esta semana",
  flexible: "Fecha flexible",
};

export interface Worker {
  id: string;
  name: string;
  trade: Category;
  rating: number;
  reviews: number;
  jobsDone: number;
  years: number;
  zone: string;
  responseMin: number;
  verified: boolean;
  bio: string;
}

export type OfferStatus = "pendiente" | "aceptada" | "rechazada";
export interface Offer {
  id: string;
  workerId: string;
  price: number;
  eta: string;
  message: string;
  status: OfferStatus;
  createdAt: number;
}

export type JobStatus = "abierto" | "asignado" | "completado";
export interface Job {
  id: string;
  title: string;
  category: Category;
  description: string;
  zone: string;
  budget: number;
  urgency: Urgency;
  createdAt: number;
  clientName: string;
  clientRating: number;
  mine: boolean;
  status: JobStatus;
  offers: Offer[];
  offerCount?: number;
  reviewedByMe?: boolean;
  contactPhone?: string;
  assignedWorkerId?: string;
  finalPrice?: number;
  rating?: number;
  completedAt?: number;
}

export interface DomusState {
  version: number;
  jobs: Job[];
  workers: Worker[];
  myWorkerId: string;
  me: { name: string; rating: number; reviews: number };
  user?: import("./auth.server").PublicUser | null;
  databaseReady?: boolean;
  ratingDistribution?: Record<number, number>;
}

const uid = (p: string) => `${p}_${Math.random().toString(36).slice(2, 9)}`;
const round2 = (n: number) => Math.round(n * 100) / 100;

const mapJob = (s: DomusState, jobId: string, fn: (j: Job) => Job): DomusState => ({
  ...s,
  jobs: s.jobs.map((j) => (j.id === jobId ? fn(j) : j)),
});

export interface NewJobInput {
  title: string;
  category: Category;
  description: string;
  zone: string;
  budget: number;
  urgency: Urgency;
}

export function publishJob(s: DomusState, input: NewJobInput, now = Date.now()): DomusState {
  const job: Job = {
    ...input,
    id: uid("job"),
    createdAt: now,
    clientName: s.me.name,
    clientRating: s.me.rating,
    mine: true,
    status: "abierto",
    offers: [],
  };
  return { ...s, jobs: [job, ...s.jobs] };
}

/** Professional takes the job at the client's published budget: assigned immediately. */
export function acceptAtBudget(s: DomusState, jobId: string, workerId: string, now = Date.now()) {
  return mapJob(s, jobId, (j) => {
    if (j.status !== "abierto") return j;
    const offer: Offer = {
      id: uid("of"),
      workerId,
      price: j.budget,
      eta: "Según disponibilidad del cliente",
      message: "Acepto el trabajo con el presupuesto publicado.",
      status: "aceptada",
      createdAt: now,
    };
    return {
      ...j,
      status: "asignado",
      assignedWorkerId: workerId,
      finalPrice: j.budget,
      offers: [
        ...j.offers.map((o) =>
          o.status === "pendiente" ? { ...o, status: "rechazada" as const } : o,
        ),
        offer,
      ],
    };
  });
}

/** Professional sends a proposal that the client must approve. One live proposal per professional. */
export function sendOffer(
  s: DomusState,
  jobId: string,
  workerId: string,
  data: { price: number; eta: string; message: string },
  now = Date.now(),
) {
  return mapJob(s, jobId, (j) => {
    if (j.status !== "abierto") return j;
    const others = j.offers.filter((o) => o.workerId !== workerId);
    return {
      ...j,
      offers: [
        ...others,
        { id: uid("of"), workerId, ...data, status: "pendiente", createdAt: now },
      ],
    };
  });
}

export function acceptOffer(s: DomusState, jobId: string, offerId: string) {
  return mapJob(s, jobId, (j) => {
    const offer = j.offers.find((o) => o.id === offerId);
    if (!offer || j.status !== "abierto") return j;
    return {
      ...j,
      status: "asignado",
      assignedWorkerId: offer.workerId,
      finalPrice: offer.price,
      offers: j.offers.map((o) => ({
        ...o,
        status: o.id === offerId ? "aceptada" : "rechazada",
      })),
    };
  });
}

/** Client closes the job and rates the professional (1–5); the professional's average updates. */
export function completeAndRate(s: DomusState, jobId: string, stars: number): DomusState {
  const job = s.jobs.find((j) => j.id === jobId);
  if (!job || job.status !== "asignado" || !job.assignedWorkerId) return s;
  const value = Math.min(5, Math.max(1, Math.round(stars)));
  const workers = s.workers.map((w) =>
    w.id === job.assignedWorkerId
      ? {
          ...w,
          rating: round2((w.rating * w.reviews + value) / (w.reviews + 1)),
          reviews: w.reviews + 1,
          jobsDone: w.jobsDone + 1,
        }
      : w,
  );
  return {
    ...mapJob(s, jobId, (j) => ({ ...j, status: "completado", rating: value })),
    workers,
  };
}

export function workerStats(s: DomusState, workerId: string) {
  const w = s.workers.find((x) => x.id === workerId);
  const offers = s.jobs.flatMap((j) => j.offers.filter((o) => o.workerId === workerId));
  const decided = offers.filter((o) => o.status !== "pendiente");
  const won = offers.filter((o) => o.status === "aceptada").length;
  const assigned = s.jobs.filter((j) => j.assignedWorkerId === workerId);
  const earned = assigned
    .filter((j) => j.status === "completado")
    .reduce((sum, j) => sum + (j.finalPrice ?? 0), 0);
  return {
    rating: w?.rating ?? 0,
    reviews: w?.reviews ?? 0,
    jobsDone: w?.jobsDone ?? 0,
    pending: offers.filter((o) => o.status === "pendiente").length,
    active: assigned.filter((j) => j.status === "asignado").length,
    earned,
    acceptance: decided.length ? Math.round((won / decided.length) * 100) : 0,
  };
}

export const currency = (n: number) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(n);

export const initials = (name: string) =>
  name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

export function timeAgo(ts: number, now = Date.now()) {
  const m = Math.max(1, Math.round((now - ts) / 60000));
  if (m < 60) return `hace ${m} min`;
  const h = Math.round(m / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.round(h / 24);
  return `hace ${d} ${d === 1 ? "día" : "días"}`;
}
