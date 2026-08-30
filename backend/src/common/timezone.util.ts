/** Returns "today" as yyyy-mm-dd in the given IANA timezone (e.g. "America/Toronto"). */
export function todayInTimezone(timezone: string): string {
  try {
    // en-CA formats as yyyy-mm-dd, which is exactly the date shape used throughout the app.
    return new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  } catch {
    // Invalid/unknown timezone string — fall back to UTC rather than throwing.
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'UTC', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  }
}

/** Minutes since local midnight, in the given IANA timezone. */
export function currentMinutesInTimezone(timezone: string): number {
  let parts: Intl.DateTimeFormatPart[];
  try {
    parts = new Intl.DateTimeFormat('en-US', { timeZone: timezone, hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date());
  } catch {
    parts = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date());
  }
  const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? '0') % 24; // Intl can render midnight as "24"
  const minute = Number(parts.find((p) => p.type === 'minute')?.value ?? '0');
  return hour * 60 + minute;
}

/** Parses "HH:mm" into minutes since midnight. Returns null for anything malformed. */
export function parseHHMM(value: string | null): number | null {
  if (!value) return null;
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

/** Handles ranges that wrap past midnight (e.g. 22:00 -> 07:00). */
export function isWithinQuietHours(nowMinutes: number, startMinutes: number, endMinutes: number): boolean {
  if (startMinutes === endMinutes) return false;
  if (startMinutes < endMinutes) {
    return nowMinutes >= startMinutes && nowMinutes < endMinutes;
  }
  return nowMinutes >= startMinutes || nowMinutes < endMinutes;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** Formats a yyyy-mm-dd date-only string as "September 17, 2026" without any timezone conversion. */
export function formatFriendlyDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  if (!year || !month || !day) return isoDate;
  return `${MONTH_NAMES[month - 1]} ${day}, ${year}`;
}
