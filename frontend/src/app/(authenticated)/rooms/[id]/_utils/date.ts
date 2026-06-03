import { parseISO, format } from "date-fns";

export function toDateTime(date: string, time: string) {
  return parseISO(`${date}T${time}:00`);
}

export function formatTime(date: Date) {
  return format(date, "HH:mm");
}
