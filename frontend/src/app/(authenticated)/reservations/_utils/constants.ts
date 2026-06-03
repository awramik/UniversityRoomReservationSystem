import { ReservationStatus } from "@/src/app/lib/types";

export type Tab = "ALL" | ReservationStatus;

export const STATUS_COLORS: Record<ReservationStatus, string> = {
  ACTIVE: "lime",
  PAST: "stone",
  CANCELLED: "red",
};

export const TABS: { key: Tab; label: string }[] = [
  { key: "ALL", label: "Wszystkie" },
  { key: "ACTIVE", label: "Aktywne" },
  { key: "PAST", label: "Przeszłe" },
  { key: "CANCELLED", label: "Anulowane" },
];
