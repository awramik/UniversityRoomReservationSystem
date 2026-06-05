import { addWeeks, parseISO, startOfWeek } from "date-fns";
import {
  ROOM_TYPES,
  type ReservationResponse,
  type RoomType,
  type UserRole,
} from "./types";

export const LECTURER_ONLY_ROOM_TYPES: RoomType[] = ["LECTURE", "LABORATORY"];

export const BOOKING_LIMITS = {
  STUDENT: { maxDurationHours: 2, maxPerWeek: 5 },
  LECTURER: { maxDurationHours: 4, maxPerWeek: 10 },
} as const;

export function canBookRoomType(role: UserRole, roomType?: RoomType): boolean {
  if (!roomType || role === "ADMIN" || role === "LECTURER") return true;
  return !LECTURER_ONLY_ROOM_TYPES.includes(roomType);
}

export function getBookableRoomTypes(role?: UserRole): RoomType[] {
  const all = Object.keys(ROOM_TYPES) as RoomType[];
  if (!role || role === "ADMIN" || role === "LECTURER") return all;
  return all.filter((t) => canBookRoomType(role, t));
}

export function getBookingLimits(role: UserRole) {
  if (role === "ADMIN") return null;
  return BOOKING_LIMITS[role];
}

function weekBounds(date: Date) {
  const start = startOfWeek(date, { weekStartsOn: 1 });
  return { start, end: addWeeks(start, 1) };
}

export function countWeeklyActiveBookings(
  reservations: ReservationResponse[],
  forDate: string | Date,
): number {
  const date = typeof forDate === "string" ? parseISO(forDate) : forDate;
  const { start, end } = weekBounds(date);

  return reservations.filter((r) => {
    if (r.status !== "ACTIVE" || r.type !== "BOOKING" || !r.startTime)
      return false;
    const t = parseISO(r.startTime);
    return t >= start && t < end;
  }).length;
}

export function isWeeklyLimitExceeded(
  role: UserRole,
  reservations: ReservationResponse[],
  forDate: string | Date,
): boolean {
  const limits = getBookingLimits(role);
  if (!limits) return false;
  return countWeeklyActiveBookings(reservations, forDate) >= limits.maxPerWeek;
}

export function exceedsDurationLimit(
  role: UserRole,
  totalMinutes: number,
): boolean {
  const limits = getBookingLimits(role);
  if (!limits) return false;
  return Math.floor(totalMinutes / 60) > limits.maxDurationHours;
}
