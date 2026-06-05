"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/src/app/auth/auth-context";
import { api } from "@/src/app/lib/api-client";
import {
  countWeeklyActiveBookings,
  getBookingLimits,
  isWeeklyLimitExceeded,
} from "@/src/app/lib/booking-limits";
import { ReservationResponse, UserRole } from "@/src/app/lib/types";

export function useBookingLimits(forDate?: string) {
  const { user } = useAuth();
  const role = user?.role as UserRole | undefined;
  const limits = role ? getBookingLimits(role) : null;

  const [reservations, setReservations] = useState<ReservationResponse[]>([]);

  useEffect(() => {
    if (!role || role === "ADMIN") return;

    let cancelled = false;

    api
      .get<ReservationResponse[]>("/reservations/my")
      .then((data) => {
        if (!cancelled) setReservations(data ?? []);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [role]);

  const checkDate = forDate || new Date().toISOString();
  const weeklyCount =
    role && role !== "ADMIN"
      ? countWeeklyActiveBookings(reservations, checkDate)
      : 0;
  const weeklyLimitReached =
    !!role &&
    role !== "ADMIN" &&
    isWeeklyLimitExceeded(role, reservations, checkDate);

  return { role, limits, weeklyCount, weeklyLimitReached };
}
