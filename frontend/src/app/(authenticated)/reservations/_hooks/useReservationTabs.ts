"use client";

import { useMemo, useState } from "react";
import { ReservationResponse } from "@/src/app/lib/types";
import { Tab } from "../_utils/constants";

export function useReservationTabs(reservations: ReservationResponse[]) {
  const [activeTab, setActiveTab] = useState<Tab>("ALL");

  const filteredReservations = useMemo(() => {
    if (activeTab === "ALL") return reservations;

    return reservations.filter((r) => r.status === activeTab);
  }, [reservations, activeTab]);

  return {
    activeTab,
    setActiveTab,
    filteredReservations,
  };
}
