import type { components } from "@/src/api/schema";
import { ReservationResponse } from "../dto/reservation";

export type ReservationStatus = NonNullable<
  components["schemas"]["ReservationDetailResponse"]["status"]
>;

export const RESERVATION_STATUS: Record<ReservationStatus, string> = {
  ACTIVE: "Aktywna",
  PAST: "Przeszła",
  CANCELLED: "Anulowana",
};

// private backend type - not used in API
export type ReservationType = ReservationResponse["type"];

export const RESERVATION_TYPES: Record<NonNullable<ReservationType>, string> = {
  BOOKING: "Rezerwacja",
  ADMIN_BLOCK: "Blokada administracyjna",
};
