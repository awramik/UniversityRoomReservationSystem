import { addMinutes, isBefore, isToday, parseISO, set } from "date-fns";
import { toDateTime, formatTime } from "./date";

const WORK_START = 6;
const WORK_END = 22;
const SLOT_STEP = 15;
const MIN_DURATION = 30;

function roundUpToStep(date: Date, step: number) {
  const ms = step * 60 * 1000;
  return new Date(Math.ceil(date.getTime() / ms) * ms);
}

export function generateStartTimes(date: string) {
  const parsedDate = parseISO(date);

  const startBase = set(parsedDate, {
    hours: WORK_START,
    minutes: 0,
    seconds: 0,
    milliseconds: 0,
  });

  const lastStart = set(parsedDate, {
    hours: 21,
    minutes: 30,
    seconds: 0,
    milliseconds: 0,
  });

  let cursor = startBase;

  if (isToday(parsedDate)) {
    const now = new Date();
    const rounded = roundUpToStep(now, SLOT_STEP);
    cursor = isBefore(rounded, startBase) ? startBase : rounded;
  }

  const result: string[] = [];

  while (
    isBefore(cursor, lastStart) ||
    cursor.getTime() === lastStart.getTime()
  ) {
    result.push(formatTime(cursor));
    cursor = addMinutes(cursor, SLOT_STEP);
  }

  return result;
}

export function generateEndTimes(date: string, startTime: string) {
  if (!date || !startTime) return [];

  const parsedDate = parseISO(date);
  const start = toDateTime(date, startTime);

  const endLimit = set(parsedDate, {
    hours: WORK_END,
    minutes: 0,
    seconds: 0,
    milliseconds: 0,
  });

  const result: string[] = [];

  let cursor = addMinutes(start, MIN_DURATION);

  while (
    isBefore(cursor, endLimit) ||
    cursor.getTime() === endLimit.getTime()
  ) {
    result.push(formatTime(cursor));
    cursor = addMinutes(cursor, SLOT_STEP);
  }

  return result;
}
