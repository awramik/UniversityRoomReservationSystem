"use client";

import { useEffect, useState } from "react";
import { api } from "@/src/app/lib/api-client";
import { ReservationResponse, APIError } from "@/src/app/lib/types";

export function useReservations() {
  const [reservations, setReservations] = useState<ReservationResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        setError("");

        const data = await api.get<ReservationResponse[]>("/reservations/my");

        setReservations(data || []);
      } catch (err) {
        if (err instanceof APIError) {
          setError(err.message || "Błąd podczas ładowania rezerwacji");
        } else {
          setError("Błąd sieci");
        }
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, []);

  const refetch = async () => {
    const data = await api.get<ReservationResponse[]>("/reservations/my");
    setReservations(data || []);
  };

  return {
    reservations,
    setReservations,
    isLoading,
    error,
    setError,
    refetch,
  };
}
