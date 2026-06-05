import { addMinutes, format, isBefore, isToday, parseISO, set } from "date-fns";
import { formatDateTimeForAPI } from "@/src/app/lib/date-utils";

const WORK_START = 6;
const WORK_END = 22;
const SLOT_STEP = 15;
const MIN_DURATION = 30;

export function toDateTime(date: string, time: string) {
  return parseISO(`${date}T${time}:00`);
}

export function toApiDateTime(date: string, time: string) {
  return formatDateTimeForAPI(toDateTime(date, time));
}

export function formatTime(date: Date) {
  return format(date, "HH:mm");
}

export function roundUpToStep(date: Date, step: number) {
  const ms = step * 60 * 1000;
  return new Date(Math.ceil(date.getTime() / ms) * ms);
}

export function generateStartTimes(date: string) {
  const parsed = parseISO(date);

  const startBase = set(parsed, { hours: WORK_START, minutes: 0 });
  const lastStart = set(parsed, { hours: 21, minutes: 30 });

  let cursor = startBase;

  if (isToday(parsed)) {
    const now = new Date();
    const rounded = roundUpToStep(now, SLOT_STEP);
    cursor = isBefore(rounded, startBase) ? startBase : rounded;
  }

  const result: string[] = [];

  while (cursor <= lastStart) {
    result.push(formatTime(cursor));
    cursor = addMinutes(cursor, SLOT_STEP);
  }

  return result;
}

export function generateEndTimes(date: string, startTime: string) {
  const start = toDateTime(date, startTime);
  const limit = set(parseISO(date), { hours: WORK_END, minutes: 0 });

  const result: string[] = [];
  let cursor = addMinutes(start, MIN_DURATION);

  while (cursor <= limit) {
    result.push(formatTime(cursor));
    cursor = addMinutes(cursor, SLOT_STEP);
  }

  return result;
}
