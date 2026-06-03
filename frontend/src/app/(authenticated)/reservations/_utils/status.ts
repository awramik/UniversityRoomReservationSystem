import { ReservationResponse, ReservationStatus } from "@/src/app/lib/types";

export function toReservationStatus(
  status: ReservationResponse["status"],
): ReservationStatus | null {
  if (status === "ACTIVE" || status === "PAST" || status === "CANCELLED") {
    return status;
  }
  return null;
}
