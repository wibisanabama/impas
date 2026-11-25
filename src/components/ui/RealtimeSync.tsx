"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface RealtimeSyncProps {
  hasPending?: boolean;
}

export function RealtimeSync({ hasPending = false }: RealtimeSyncProps) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("impas-loans-sync")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "loans",
        },
        () => {
          router.refresh();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "loan_payments",
        },
        () => {
          router.refresh();
        }
      )
      .subscribe();

    const handleVisibleOrFocus = () => {
      if (document.visibilityState === "visible") {
        router.refresh();
      }
    };

    window.addEventListener("focus", handleVisibleOrFocus);
    document.addEventListener("visibilitychange", handleVisibleOrFocus);

    let interval: ReturnType<typeof setInterval> | undefined;
    if (hasPending) {
      interval = setInterval(() => {
        if (document.visibilityState === "visible") {
          router.refresh();
        }
      }, 5000);
    }

    return () => {
      void supabase.removeChannel(channel);
      window.removeEventListener("focus", handleVisibleOrFocus);
      document.removeEventListener("visibilitychange", handleVisibleOrFocus);
      if (interval) clearInterval(interval);
    };
  }, [hasPending, router]);

  return null;
}
