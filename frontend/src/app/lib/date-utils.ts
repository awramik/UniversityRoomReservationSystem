import { format, isBefore, differenceInMinutes } from 'date-fns';

// parse
export const parseDateTime = (iso: string): Date =>
  new Date(iso);

// display
export const formatDateTimeDisplay = (iso: string): string =>
  format(new Date(iso), 'dd.MM.yyyy HH:mm');

export const formatDateDisplay = (iso: string): string =>
  format(new Date(iso), 'dd.MM.yyyy');

export const formatTimeDisplay = (iso: string): string =>
  format(new Date(iso), 'HH:mm');

// logic
export const isInPast = (iso: string): boolean =>
  isBefore(new Date(iso), new Date());

export const calculateDurationHours = (
  start: string,
  end: string
): number =>
  differenceInMinutes(new Date(end), new Date(start)) / 60;

// API
export const formatDateTimeForAPI = (date: Date): string =>
  format(date, "yyyy-MM-dd'T'HH:mm:ss");

export const parseDateTimeFromInput = (value: string): Date =>
  new Date(value);
