import { createServerFn } from "@tanstack/react-start";
import { ObjectId } from "mongodb";
import { z } from "zod";
import { currentUser, publicUser, requireUser, type UserDoc } from "./auth.server";
import { getDb, getMongoClient, isMongoConfigured } from "./db.server";
import { CATEGORIES, type DomusState, type Job, type Offer } from "./domus";

interface JobDoc extends Omit<Job, "id" | "mine" | "offers"> {
  _id: ObjectId;
  clientId: ObjectId;
  offers: (Offer & { workerId: string })[];
}

const jobSchema = z.object({
  title: z.string().trim().min(6).max(90),
  category: z.enum(CATEGORIES.map((c) => c.id) as [string, ...string[]]),
  description: z.string().trim().min(20).max(1000),
  zone: z.string().trim().min(2).max(80),
  budget: z.number().int().min(100).max(2_000_000),
  urgency: z.enum(["hoy", "semana", "flexible"]),
});

const offerSchema = z.object({
  jobId: z.string().regex(/^[a-f\d]{24}$/i),
  price: z.number().int().min(100).max(2_000_000),
  eta: z.string().trim().min(2).max(120),
  message: z.string().trim().max(500),
});
const idSchema = z.object({ jobId: z.string().regex(/^[a-f\d]{24}$/i) });
const acceptSchema = z.object({
  jobId: z.string().regex(/^[a-f\d]{24}$/i),
  offerId: z.string().min(8).max(100),
});
const rateSchema = z.object({
  jobId: z.string().regex(/^[a-f\d]{24}$/i),
  stars: z.number().int().min(1).max(5),
});

function emptyState(user: Awaited<ReturnType<typeof currentUser>> = null): DomusState {
  return {
    version: 2,
    jobs: [],
    workers: [],
    myWorkerId: user?.roles.includes("profesional") ? user.id : "",
    me: { name: user?.name ?? "", rating: 0, reviews: 0 },
    user,
  };
}

function publicWorker(user: UserDoc) {
  const worker = publicUser(user);
  return {
    id: worker.id,
    name: worker.name,
    trade: (worker.trade ?? "plomeria") as Job["category"],
    rating: worker.ratingCount
      ? Math.round((worker.ratingSum / worker.ratingCount) * 100) / 100
      : 0,
    reviews: worker.ratingCount,
    jobsDone: worker.jobsDone,
    years: worker.years,
    zone: worker.zone,
    responseMin: 0,
    verified: worker.emailVerified && worker.phoneVerified,
    bio: worker.bio,
  };
}

function publicJob(
  job: JobDoc,
  viewerId?: string,
  reviewedByMe = false,
  contactPhone?: string,
): Job {
  const mine = viewerId === job.clientId.toHexString();
  const canSeeAssignment = mine || job.assignedWorkerId === viewerId;
  const visibleOffers = mine
    ? (job.offers ?? [])
    : (job.offers ?? []).filter((offer) => offer.workerId === viewerId);
  return {
    id: job._id.toHexString(),
    title: job.title,
    category: job.category,
    description: job.description,
    zone: job.zone,
    budget: job.budget,
    urgency: job.urgency,
    createdAt: job.createdAt,
    clientName: job.clientName,
    clientRating: job.clientRating,
    mine,
    status: job.status,
    offers: visibleOffers,
    offerCount: job.offers?.length ?? 0,
    reviewedByMe,
    ...(contactPhone ? { contactPhone } : {}),
    ...(job.assignedWorkerId && canSeeAssignment ? { assignedWorkerId: job.assignedWorkerId } : {}),
    ...(job.finalPrice && canSeeAssignment ? { finalPrice: job.finalPrice } : {}),
    ...(job.rating ? { rating: job.rating } : {}),
    ...(job.completedAt ? { completedAt: job.completedAt } : {}),
  };
}

export const getMarketplace = createServerFn({ method: "GET" }).handler(async () => {
  if (!isMongoConfigured()) return { ...emptyState(null), databaseReady: false };
  const user = await currentUser();
  const db = await getDb();
  const visibility = user
    ? {
        $or: [
          { status: "abierto" },
          { clientId: new ObjectId(user.id) },
          { assignedWorkerId: user.id },
          { "offers.workerId": user.id },
        ],
      }
    : { status: "abierto" };
  const [jobDocs, userDocs, reviewDocs] = await Promise.all([
    db.collection<JobDoc>("jobs").find(visibility).sort({ createdAt: -1 }).limit(100).toArray(),
    db
      .collection<UserDoc>("users")
      .find({ roles: "profesional" }, { projection: { passwordHash: 0, email: 0, phone: 0 } })
      .limit(200)
      .toArray(),
    user
      ? db
          .collection<{ jobId: ObjectId; authorId: string; targetId: string; stars: number }>(
            "reviews",
          )
          .find(
            { $or: [{ authorId: user.id }, { targetId: user.id }] },
            { projection: { jobId: 1, authorId: 1, targetId: 1, stars: 1 } },
          )
          .toArray()
      : Promise.resolve([]),
  ]);
  const reviewed = new Set(
    reviewDocs
      .filter((review) => review.authorId === user?.id)
      .map((review) => review.jobId.toHexString()),
  );
  const ratingDistribution = Object.fromEntries(
    [1, 2, 3, 4, 5].map((stars) => [
      stars,
      reviewDocs.filter((review) => review.targetId === user?.id && review.stars === stars).length,
    ]),
  );
  const contactPeerIds = user
    ? [
        ...new Set(
          jobDocs.flatMap((job) => {
            if (job.status !== "asignado") return [];
            if (job.clientId.toHexString() === user.id && job.assignedWorkerId)
              return [job.assignedWorkerId];
            if (job.assignedWorkerId === user.id) return [job.clientId.toHexString()];
            return [];
          }),
        ),
      ].map((id) => new ObjectId(id))
    : [];
  const contactUsers = contactPeerIds.length
    ? await db
        .collection<{ _id: ObjectId; phone: string; contactConsent?: boolean }>("users")
        .find({ _id: { $in: contactPeerIds }, contactConsent: true }, { projection: { phone: 1 } })
        .toArray()
    : [];
  const contactsById = new Map(
    contactUsers.map((contact) => [contact._id.toHexString(), contact.phone]),
  );
  const workers = userDocs.map(publicWorker);
  return {
    version: 2,
    jobs: jobDocs.map((job) => {
      const peerId =
        job.clientId.toHexString() === user?.id ? job.assignedWorkerId : job.clientId.toHexString();
      return publicJob(
        job,
        user?.id,
        reviewed.has(job._id.toHexString()),
        peerId ? contactsById.get(peerId) : undefined,
      );
    }),
    workers,
    myWorkerId: user?.roles.includes("profesional") ? user.id : "",
    me: {
      name: user?.name ?? "",
      rating: user?.ratingCount ? user.ratingSum / user.ratingCount : 0,
      reviews: user?.ratingCount ?? 0,
    },
    user,
    databaseReady: true,
    ratingDistribution,
  } satisfies DomusState;
});

export const publishMarketplaceJob = createServerFn({ method: "POST" })
  .validator(jobSchema)
  .handler(async ({ data }) => {
    const user = await requireUser("cliente");
    const job: JobDoc = {
      _id: new ObjectId(),
      clientId: new ObjectId(user.id),
      title: data.title,
      category: data.category as Job["category"],
      description: data.description,
      zone: data.zone,
      budget: data.budget,
      urgency: data.urgency,
      createdAt: Date.now(),
      clientName: user.name,
      clientRating: 0,
      status: "abierto",
      offers: [],
    };
    await (await getDb()).collection<JobDoc>("jobs").insertOne(job);
    return publicJob(job, user.id);
  });

export const sendMarketplaceOffer = createServerFn({ method: "POST" })
  .validator(offerSchema)
  .handler(async ({ data }) => {
    const user = await requireUser("profesional");
    const jobs = (await getDb()).collection<JobDoc>("jobs");
    const jobId = new ObjectId(data.jobId);
    const job = await jobs.findOne({
      _id: jobId,
      status: "abierto",
      clientId: { $ne: new ObjectId(user.id) },
    });
    if (!job) throw new Error("Este trabajo ya no está disponible.");
    const offer: Offer = {
      id: new ObjectId().toHexString(),
      workerId: user.id,
      price: data.price,
      eta: data.eta,
      message: data.message,
      status: "pendiente",
      createdAt: Date.now(),
    };
    const existing = job.offers.find((item) => item.workerId === user.id);
    const result = existing
      ? await jobs.updateOne(
          { _id: jobId, status: "abierto", "offers.id": existing.id, "offers.status": "pendiente" },
          {
            $set: {
              "offers.$.price": offer.price,
              "offers.$.eta": offer.eta,
              "offers.$.message": offer.message,
              "offers.$.createdAt": offer.createdAt,
            },
          },
        )
      : await jobs.updateOne(
          {
            _id: jobId,
            status: "abierto",
            offers: { $not: { $elemMatch: { workerId: user.id } } },
          },
          { $push: { offers: offer } },
        );
    if (!result.modifiedCount)
      throw new Error(
        "No se pudo actualizar tu propuesta. Recarga el trabajo y vuelve a intentar.",
      );
    return { ok: true };
  });

export const acceptJobAtBudget = createServerFn({ method: "POST" })
  .validator(idSchema)
  .handler(async ({ data }) => {
    const user = await requireUser("profesional");
    const jobs = (await getDb()).collection<JobDoc>("jobs");
    const jobId = new ObjectId(data.jobId);
    const job = await jobs.findOne({
      _id: jobId,
      status: "abierto",
      clientId: { $ne: new ObjectId(user.id) },
    });
    if (!job) throw new Error("Este trabajo ya fue tomado o es tuyo.");
    const existingOffer = job.offers.find((item) => item.workerId === user.id);
    if (existingOffer && existingOffer.status !== "pendiente")
      throw new Error("Ya respondiste a este trabajo.");
    const offer: Offer = {
      id: existingOffer?.id ?? new ObjectId().toHexString(),
      workerId: user.id,
      price: job.budget,
      eta: "Por coordinar",
      message: "Acepto el presupuesto publicado.",
      status: "aceptada",
      createdAt: Date.now(),
    };
    const result = existingOffer
      ? await jobs.updateOne(
          {
            _id: jobId,
            status: "abierto",
            clientId: { $ne: new ObjectId(user.id) },
            "offers.id": existingOffer.id,
            "offers.status": "pendiente",
          },
          {
            $set: {
              status: "asignado",
              assignedWorkerId: user.id,
              finalPrice: job.budget,
              "offers.$[self].status": "aceptada",
              "offers.$[self].price": job.budget,
              "offers.$[self].eta": offer.eta,
              "offers.$[self].message": offer.message,
              "offers.$[other].status": "rechazada",
            },
          },
          {
            arrayFilters: [
              { "self.id": existingOffer.id, "self.status": "pendiente" },
              { "other.status": "pendiente", "other.id": { $ne: existingOffer.id } },
            ],
          },
        )
      : await jobs.updateOne(
          {
            _id: jobId,
            status: "abierto",
            clientId: { $ne: new ObjectId(user.id) },
            offers: { $not: { $elemMatch: { workerId: user.id } } },
          },
          {
            $set: {
              status: "asignado",
              assignedWorkerId: user.id,
              finalPrice: job.budget,
              "offers.$[pending].status": "rechazada",
            },
            $push: { offers: offer },
          },
          { arrayFilters: [{ "pending.status": "pendiente" }] },
        );
    if (!result.modifiedCount)
      throw new Error("Alguien tomó este trabajo primero. Actualiza la lista.");
    return { ok: true };
  });

export const acceptMarketplaceOffer = createServerFn({ method: "POST" })
  .validator(acceptSchema)
  .handler(async ({ data }) => {
    const user = await requireUser("cliente");
    const jobs = (await getDb()).collection<JobDoc>("jobs");
    const jobId = new ObjectId(data.jobId);
    const job = await jobs.findOne({
      _id: jobId,
      clientId: new ObjectId(user.id),
      status: "abierto",
    });
    const chosen = job?.offers.find(
      (offer) => offer.id === data.offerId && offer.status === "pendiente",
    );
    if (!job || !chosen) throw new Error("La propuesta ya no está disponible.");
    const result = await jobs.updateOne(
      {
        _id: jobId,
        clientId: new ObjectId(user.id),
        status: "abierto",
        "offers.id": data.offerId,
        "offers.status": "pendiente",
      },
      {
        $set: {
          status: "asignado",
          assignedWorkerId: chosen.workerId,
          finalPrice: chosen.price,
          "offers.$[accepted].status": "aceptada",
          "offers.$[rejected].status": "rechazada",
        },
      },
      {
        arrayFilters: [
          { "accepted.id": data.offerId },
          { "rejected.status": "pendiente", "rejected.id": { $ne: data.offerId } },
        ],
      },
    );
    if (!result.modifiedCount) throw new Error("La propuesta ya no está disponible.");
    return { ok: true };
  });

export const completeAndRateMarketplaceJob = createServerFn({ method: "POST" })
  .validator(rateSchema)
  .handler(async ({ data }) => {
    const user = await requireUser("cliente");
    const client = await getMongoClient();
    const session = client.startSession();
    try {
      await session.withTransaction(async () => {
        const db = client.db(process.env.MONGODB_DATABASE ?? "subiwaza");
        const jobs = db.collection<JobDoc>("jobs");
        const job = await jobs.findOne(
          { _id: new ObjectId(data.jobId), clientId: new ObjectId(user.id), status: "asignado" },
          { session },
        );
        if (!job?.assignedWorkerId)
          throw new Error("Solo puedes calificar un trabajo que ya tiene profesional asignado.");
        await db.collection("reviews").insertOne(
          {
            jobId: job._id,
            authorId: user.id,
            targetId: job.assignedWorkerId,
            stars: data.stars,
            createdAt: new Date(),
          },
          { session },
        );
        const result = await jobs.updateOne(
          { _id: job._id, clientId: new ObjectId(user.id), status: "asignado" },
          { $set: { status: "completado", rating: data.stars, completedAt: Date.now() } },
          { session },
        );
        if (!result.modifiedCount) throw new Error("No se pudo cerrar este trabajo.");
        await db
          .collection<UserDoc>("users")
          .updateOne(
            { _id: new ObjectId(job.assignedWorkerId) },
            { $inc: { ratingSum: data.stars, ratingCount: 1, jobsDone: 1 } },
            { session },
          );
      });
    } finally {
      await session.endSession();
    }
    return { ok: true };
  });

export const rateClientMarketplaceJob = createServerFn({ method: "POST" })
  .validator(rateSchema)
  .handler(async ({ data }) => {
    const user = await requireUser("profesional");
    const client = await getMongoClient();
    const session = client.startSession();
    try {
      await session.withTransaction(async () => {
        const db = client.db(process.env.MONGODB_DATABASE ?? "subiwaza");
        const job = await db
          .collection<JobDoc>("jobs")
          .findOne(
            { _id: new ObjectId(data.jobId), assignedWorkerId: user.id, status: "completado" },
            { session },
          );
        if (!job)
          throw new Error("Solo puedes calificar al cliente después de completar el trabajo.");
        await db.collection("reviews").insertOne(
          {
            jobId: job._id,
            authorId: user.id,
            targetId: job.clientId.toHexString(),
            stars: data.stars,
            createdAt: new Date(),
          },
          { session },
        );
        await db
          .collection<UserDoc>("users")
          .updateOne(
            { _id: job.clientId },
            { $inc: { ratingSum: data.stars, ratingCount: 1 } },
            { session },
          );
      });
    } finally {
      await session.endSession();
    }
    return { ok: true };
  });
