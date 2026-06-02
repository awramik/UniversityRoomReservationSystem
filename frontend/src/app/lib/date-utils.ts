import { format, isBefore, differenceInHours } from 'date-fns';

// parse
export const parseDateTime = (iso: string) => new Date(iso);

// display
export const formatDateTimeDisplay = (iso: string) =>
  format(new Date(iso), 'dd.MM.yyyy HH:mm');

export const formatDateDisplay = (iso: string) =>
  format(new Date(iso), 'dd.MM.yyyy');

export const formatTimeDisplay = (iso: string) =>
  format(new Date(iso), 'HH:mm');

// logic
export const isInPast = (iso: string) =>
  isBefore(new Date(iso), new Date());

export const calculateDurationHours = (start: string, end: string) =>
  differenceInHours(new Date(end), new Date(start));

// API
export const formatDateTimeForAPI = (date: Date) =>
  date.toISOString(); 

export const parseDateTimeFromInput = (value: string) =>
  new Date(value);
