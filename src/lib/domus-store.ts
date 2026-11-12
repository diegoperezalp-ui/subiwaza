import { useEffect, useState } from "react";
import { toast } from "sonner";
import { updateProfile } from "./auth.functions";
import * as D from "./domus";
import {
  acceptJobAtBudget,
  acceptMarketplaceOffer,
  completeAndRateMarketplaceJob,
  getMarketplace,
  publishMarketplaceJob,
  rateClientMarketplaceJob,
  sendMarketplaceOffer,
} from "./marketplace.functions";

const refreshEvent = "subiwaza:marketplace-updated";

function blankState(): D.DomusState {
  return {
    version: 2,
    jobs: [],
    workers: [],
    myWorkerId: "",
    me: { name: "", rating: 0, reviews: 0 },
    databaseReady: false,
  };
}

export function useDomus() {
  const [state, setState] = useState<D.DomusState>(blankState);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const next = await getMarketplace();
        if (active) {
          setState(next);
          setError(null);
        }
      } catch (cause) {
        if (active)
          setError(cause instanceof Error ? cause.message : "No se pudieron cargar los datos.");
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    window.addEventListener(refreshEvent, load);
    return () => {
      active = false;
      window.removeEventListener(refreshEvent, load);
    };
  }, []);

  return { ...state, loading, error };
}

async function mutate<T>(request: () => Promise<T>): Promise<T> {
  try {
    const result = await request();
    if (typeof window !== "undefined") window.dispatchEvent(new Event(refreshEvent));
    return result;
  } catch (cause) {
    const message =
      cause instanceof Error ? cause.message : "No se pudo completar. Intenta de nuevo.";
    toast.error(message);
    throw cause;
  }
}

export const domusActions = {
  publish: (input: D.NewJobInput) => mutate(() => publishMarketplaceJob({ data: input })),
  acceptAtBudget: (jobId: string) => mutate(() => acceptJobAtBudget({ data: { jobId } })),
  sendOffer: (jobId: string, data: { price: number; eta: string; message: string }) =>
    mutate(() => sendMarketplaceOffer({ data: { jobId, ...data } })),
  acceptOffer: (jobId: string, offerId: string) =>
    mutate(() => acceptMarketplaceOffer({ data: { jobId, offerId } })),
  completeAndRate: (jobId: string, stars: number) =>
    mutate(() => completeAndRateMarketplaceJob({ data: { jobId, stars } })),
  rateClient: (jobId: string, stars: number) =>
    mutate(() => rateClientMarketplaceJob({ data: { jobId, stars } })),
  updateProfile: (data: {
    name: string;
    phone: string;
    zone: string;
    bio: string;
    years: number;
    trade?: string;
    addRole?: "cliente" | "profesional";
  }) => mutate(() => updateProfile({ data })),
};
