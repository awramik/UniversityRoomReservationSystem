"use client";

import { useEffect, useState } from "react";
import { api } from "@/src/app/lib/api-client";
import { AvailabilityResponse } from "@/src/app/lib/types";
import { toApiDateTime } from "../_utils/time";

export function useAvailability(
  roomId: string,
  date?: string,
  startTime?: string,
  endTime?: string,
) {
  const [availability, setAvailability] = useState<AvailabilityResponse | null>(
    null,
  );

  const [checking, setChecking] = useState(false);

  useEffect(() => {
    (async () => {
      if (!date || !startTime || !endTime) return;

      try {
        setChecking(true);

        const params = new URLSearchParams({
          startTime: toApiDateTime(date, startTime),
          endTime: toApiDateTime(date, endTime),
        });

        const data = await api.get<AvailabilityResponse>(
          `/rooms/${roomId}/availability?${params.toString()}`,
        );

        setAvailability(data);
      } catch {
        setAvailability(null);
      } finally {
        setChecking(false);
      }
    })();
  }, [roomId, date, startTime, endTime]);

  return { availability, checking };
}
