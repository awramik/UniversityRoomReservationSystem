import { toDateTime } from "./time";

export function getDurationParts(
  date?: string,
  startTime?: string,
  endTime?: string,
) {
  if (!date || !startTime || !endTime) return null;

  const minutes = Math.round(
    (toDateTime(date, endTime).getTime() -
      toDateTime(date, startTime).getTime()) /
      60000,
  );

  return {
    totalMinutes: minutes,
    hours: Math.floor(minutes / 60),
    mins: minutes % 60,
  };
}
