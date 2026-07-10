import {
  convertLocalToUtc,
  convertUtcToLocal,
  isFutureBooking,
} from './timezone.util';

const TZ = 'Asia/Colombo'; // UTC+5:30

describe('timezone.util', () => {
  describe('convertLocalToUtc', () => {
    it('should convert a valid Colombo datetime to correct UTC', () => {
      // Asia/Colombo is UTC+5:30, so 12:00 local = 06:30 UTC
      const utc = convertLocalToUtc('2027-06-15', '12:00', TZ);
      expect(utc.getUTCHours()).toBe(6);
      expect(utc.getUTCMinutes()).toBe(30);
      expect(utc.getUTCDate()).toBe(15);
    });

    it('should reject invalid YYYY-MM-DD format', () => {
      expect(() => convertLocalToUtc('15-06-2027', '12:00', TZ)).toThrow(
        'Invalid date format',
      );
    });

    it('should reject impossible calendar dates (2026-02-30)', () => {
      expect(() => convertLocalToUtc('2026-02-30', '10:00', TZ)).toThrow(
        'Invalid calendar date',
      );
    });

    it('should reject month out of range (2026-13-01)', () => {
      expect(() => convertLocalToUtc('2026-13-01', '10:00', TZ)).toThrow(
        'Invalid calendar date',
      );
    });

    it('should reject invalid HH:mm format', () => {
      expect(() => convertLocalToUtc('2027-06-15', '9:00', TZ)).toThrow(
        'Invalid time format',
      );
    });

    it('should reject invalid time values (25:70)', () => {
      expect(() => convertLocalToUtc('2027-06-15', '25:70', TZ)).toThrow(
        'Invalid time value',
      );
    });

    it('should handle midnight conversion correctly', () => {
      // 00:00 Colombo = 18:30 UTC previous day
      const utc = convertLocalToUtc('2027-06-15', '00:00', TZ);
      expect(utc.getUTCHours()).toBe(18);
      expect(utc.getUTCMinutes()).toBe(30);
      expect(utc.getUTCDate()).toBe(14);
    });
  });

  describe('convertUtcToLocal', () => {
    it('should convert UTC back to Colombo date/time', () => {
      const utcDate = new Date('2027-06-15T06:30:00.000Z');
      const { bookingDate, bookingTime } = convertUtcToLocal(utcDate, TZ);
      expect(bookingDate).toBe('2027-06-15');
      expect(bookingTime).toBe('12:00');
    });

    it('should handle date boundary correctly (18:30 UTC = midnight Colombo)', () => {
      const utcDate = new Date('2027-06-14T18:30:00.000Z');
      const { bookingDate, bookingTime } = convertUtcToLocal(utcDate, TZ);
      expect(bookingDate).toBe('2027-06-15');
      expect(bookingTime).toBe('00:00');
    });

    it('UTC date differs from local date when local time spans midnight', () => {
      // 2027-06-14 23:00 Colombo = 2027-06-14T17:30:00Z — same UTC date
      const utcDate = new Date('2027-06-14T17:30:00.000Z');
      const { bookingDate, bookingTime } = convertUtcToLocal(utcDate, TZ);
      expect(bookingDate).toBe('2027-06-14');
      expect(bookingTime).toBe('23:00');

      // 2027-06-15 00:30 Colombo = 2027-06-14T19:00:00Z — UTC date is day BEFORE local date
      const utcDateCrossMidnight = new Date('2027-06-14T19:00:00.000Z');
      const result2 = convertUtcToLocal(utcDateCrossMidnight, TZ);
      expect(result2.bookingDate).toBe('2027-06-15'); // local date advanced
      expect(result2.bookingTime).toBe('00:30');
    });
  });

  describe('bookingDate filter UTC range (boundary verification)', () => {
    it('start of 2027-06-15 in Colombo should be 2027-06-14T18:30Z', () => {
      const startUtc = convertLocalToUtc('2027-06-15', '00:00', TZ);
      expect(startUtc.toISOString()).toBe('2027-06-14T18:30:00.000Z');
    });

    it('end of 2027-06-15 in Colombo should be 2027-06-15T18:29Z', () => {
      const endUtc = convertLocalToUtc('2027-06-15', '23:59', TZ);
      expect(endUtc.toISOString()).toBe('2027-06-15T18:29:00.000Z');
    });
  });

  describe('isFutureBooking', () => {
    it('should return true for a future time', () => {
      const future = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours from now
      expect(isFutureBooking(future)).toBe(true);
    });

    it('should return false for a past time', () => {
      const past = new Date(Date.now() - 60 * 1000); // 1 minute ago
      expect(isFutureBooking(past)).toBe(false);
    });

    it('should return false for the exact current moment', () => {
      // Date.now() itself is not strictly greater than Date.now()
      const now = new Date(); // constructed just before assertion — may be at or just before now
      expect(isFutureBooking(now)).toBe(false);
    });
  });
});
