import { describe, expect, it } from "vitest";
import { acceptAtBudget, acceptOffer, completeAndRate, publishJob, sendOffer } from "./domus";
import { seedState } from "./domus-seed";

describe("Domus marketplace rules", () => {
  it("a published problem appears as the client's own open job", () => {
    const s = publishJob(seedState, {
      title: "Cambiar regadera",
      category: "plomeria",
      description: "",
      zone: "Roma",
      budget: 600,
      urgency: "hoy",
    });
    expect(s.jobs[0]).toMatchObject({
      title: "Cambiar regadera",
      mine: true,
      status: "abierto",
      offers: [],
    });
  });

  it("a professional accepting at budget is assigned at the client's price", () => {
    const s = acceptAtBudget(seedState, "j3", "w1");
    const j = s.jobs.find((x) => x.id === "j3")!;
    expect(j.status).toBe("asignado");
    expect(j.assignedWorkerId).toBe("w1");
    expect(j.finalPrice).toBe(950);
  });

  it("a proposal stays pending until the client accepts it", () => {
    let s = sendOffer(seedState, "j2", "w1", { price: 1600, eta: "Mañana", message: "" });
    const offer = s.jobs.find((x) => x.id === "j2")!.offers[0]!;
    expect(offer.status).toBe("pendiente");
    expect(s.jobs.find((x) => x.id === "j2")!.status).toBe("abierto");
    s = acceptOffer(s, "j2", offer.id);
    const j = s.jobs.find((x) => x.id === "j2")!;
    expect(j.status).toBe("asignado");
    expect(j.finalPrice).toBe(1600);
  });

  it("accepting one proposal rejects the others", () => {
    const j = acceptOffer(seedState, "j1", "o2").jobs.find((x) => x.id === "j1")!;
    expect(j.offers.find((o) => o.id === "o1")!.status).toBe("rechazada");
    expect(j.assignedWorkerId).toBe("w7");
  });

  it("rating a finished job updates the professional's average and job count", () => {
    // w1: 4.92 over 186 reviews, 214 jobs; a 5-star rating on j7
    const s = completeAndRate(seedState, "j7", 5);
    const w = s.workers.find((x) => x.id === "w1")!;
    expect(w.reviews).toBe(187);
    expect(w.jobsDone).toBe(215);
    expect(w.rating).toBe(4.92);
    expect(s.jobs.find((x) => x.id === "j7")!.status).toBe("completado");
  });

  it("an open job cannot be rated", () => {
    expect(completeAndRate(seedState, "j1", 5)).toBe(seedState);
  });
});
