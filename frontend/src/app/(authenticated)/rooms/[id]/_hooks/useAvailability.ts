"use client";

import { useEffect, useState } from "react";
import { api } from "@/src/app/lib/api-client";
import { AvailabilityResponse } from "@/src/app/lib/types";
import { toDateTime } from "../_utils/date";

export function useAvailability(
  roomId: string,
  date: string,
  startTime: string,
  endTime: string,
) {
  const [availability, setAvailability] = useState<AvailabilityResponse | null>(
    null,
  );
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    const run = async () => {
      if (!date || !startTime || !endTime) return;

      try {
        setChecking(true);

        const params = new URLSearchParams({
          startTime: toDateTime(date, startTime).toISOString(),
          endTime: toDateTime(date, endTime).toISOString(),
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
    };

    run();
  }, [date, startTime, endTime, roomId]);

  return { availability, checking, setAvailability };
}
