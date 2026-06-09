/**
 * Whether an event date is in the past, measured from the START of today
 * (local time) so an event happening *today* is never treated as past.
 * Accepts a "YYYY-MM-DD" date or any Date-parseable string.
 */
export function isPastEvent(dateStr: string): boolean {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  return new Date(dateStr) < startOfToday;
}
