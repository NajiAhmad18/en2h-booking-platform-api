/**
 * Timezone utility for booking date/time conversion.
 * Asia/Colombo is UTC+05:30 with no DST (fixed offset).
 * All conversions use APP_TIMEZONE passed in from ConfigService — not hardcoded.
 */

/** Validated offset in minutes for a given IANA timezone string, using Intl */
function getUtcOffsetMinutes(timezone: string, date: Date): number {
  // Use Intl to resolve the offset for a given timezone at a given moment
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    timeZoneName: 'shortOffset',
  });

  const parts = formatter.formatToParts(date);
  const offsetPart =
    parts.find((p) => p.type === 'timeZoneName')?.value ?? 'GMT+0';

  // Match patterns like GMT+5:30, GMT-3, GMT+11
  const match = offsetPart.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
  if (!match) return 0;

  const sign = match[1] === '+' ? 1 : -1;
  const hours = parseInt(match[2], 10);
  const minutes = parseInt(match[3] ?? '0', 10);
  return sign * (hours * 60 + minutes);
}

/** Validates YYYY-MM-DD format and the actual calendar date */
function validateDate(dateStr: string): void {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    throw new Error(
      `Invalid date format. Expected YYYY-MM-DD, got: ${dateStr}`,
    );
  }
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(Date.UTC(year, month - 1, day));
  if (
    d.getUTCFullYear() !== year ||
    d.getUTCMonth() !== month - 1 ||
    d.getUTCDate() !== day
  ) {
    throw new Error(`Invalid calendar date: ${dateStr}`);
  }
}

/** Validates HH:mm 24-hour format */
function validateTime(timeStr: string): void {
  if (!/^\d{2}:\d{2}$/.test(timeStr)) {
    throw new Error(`Invalid time format. Expected HH:mm, got: ${timeStr}`);
  }
  const [hours, minutes] = timeStr.split(':').map(Number);
  if (hours > 23 || minutes > 59) {
    throw new Error(`Invalid time value: ${timeStr}`);
  }
}

/**
 * Convert local date + time strings to UTC Date.
 * @param dateStr YYYY-MM-DD (in local timezone)
 * @param timeStr HH:mm (in local timezone)
 * @param timezone IANA timezone string e.g. 'Asia/Colombo'
 */
export function convertLocalToUtc(
  dateStr: string,
  timeStr: string,
  timezone: string,
): Date {
  validateDate(dateStr);
  validateTime(timeStr);

  const [year, month, day] = dateStr.split('-').map(Number);
  const [hours, minutes] = timeStr.split(':').map(Number);

  // Build a temporary Date to resolve the offset at the requested local time
  // We use UTC constructor to get a neutral anchor, then adjust for the offset
  const tempUtc = new Date(
    Date.UTC(year, month - 1, day, hours, minutes, 0, 0),
  );
  const offsetMinutes = getUtcOffsetMinutes(timezone, tempUtc);

  // Subtract offset to get real UTC
  return new Date(tempUtc.getTime() - offsetMinutes * 60 * 1000);
}

/**
 * Convert a UTC Date back to local date/time strings in a given timezone.
 * @param utcDate UTC Date object
 * @param timezone IANA timezone string e.g. 'Asia/Colombo'
 * @returns { bookingDate: 'YYYY-MM-DD', bookingTime: 'HH:mm' }
 */
export function convertUtcToLocal(
  utcDate: Date,
  timezone: string,
): { bookingDate: string; bookingTime: string } {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(utcDate);
  const get = (type: string) =>
    parts.find((p) => p.type === type)?.value ?? '00';

  const year = get('year');
  const month = get('month');
  const day = get('day');
  let hour = get('hour');
  const minute = get('minute');

  // Intl hour12:false may return '24' for midnight in some environments
  if (hour === '24') hour = '00';

  return {
    bookingDate: `${year}-${month}-${day}`,
    bookingTime: `${hour}:${minute}`,
  };
}

/**
 * Returns true if the given UTC datetime is strictly in the future (after now).
 * Rejects any timestamp that is at or before the current server time.
 */
export function isFutureBooking(utcDateTime: Date): boolean {
  return utcDateTime.getTime() > Date.now();
}
