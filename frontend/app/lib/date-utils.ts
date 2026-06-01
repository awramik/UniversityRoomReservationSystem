// Parse ISO 8601 LocalDateTime from backend (format: 2026-06-01T14:30:00)
export function parseDateTime(isoString: string): Date {
  return new Date(isoString);
}

// Format date to ISO string for API requests
export function formatDateTimeForAPI(date: Date): string {
  return date.toISOString().slice(0, 19); // Remove milliseconds and Z
}

// Format datetime for display (Polish format)
export function formatDateTimeDisplay(isoString: string): string {
  const date = parseDateTime(isoString);
  return date.toLocaleString('pl-PL', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Format date only for display (Polish format)
export function formatDateDisplay(isoString: string): string {
  const date = parseDateTime(isoString);
  return date.toLocaleString('pl-PL', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

// Format time only for display
export function formatTimeDisplay(isoString: string): string {
  const date = parseDateTime(isoString);
  return date.toLocaleString('pl-PL', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Check if datetime is in the past
export function isInPast(isoString: string): boolean {
  const date = parseDateTime(isoString);
  return date < new Date();
}

// Get current datetime in ISO format for API
export function getCurrentDateTimeISO(): string {
  return formatDateTimeForAPI(new Date());
}

// Calculate duration in hours between two datetimes
export function calculateDurationHours(startISO: string, endISO: string): number {
  const start = parseDateTime(startISO);
  const end = parseDateTime(endISO);
  return (end.getTime() - start.getTime()) / (1000 * 60 * 60);
}

// Format datetime for HTML input (datetime-local format)
export function formatDateTimeForInput(isoString: string | null): string {
  if (!isoString) {
    return '';
  }
  // Convert from 2026-06-01T14:30:00 to 2026-06-01T14:30 (removing seconds)
  return isoString.slice(0, 16);
}

// Parse datetime from HTML input (datetime-local format) to ISO format
export function parseDateTimeFromInput(inputValue: string): string {
  // Input format: 2026-06-01T14:30
  // We need to add :00 for seconds
  return `${inputValue}:00`;
}
