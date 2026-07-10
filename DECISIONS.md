# Decisions Log

## Phase 2: Database and ORM
**Prisma Downgrade (v7 to v5):** This project pins Prisma 5 for the conventional schema-based configuration used in this time-constrained assessment. Newer Prisma versions use a different configuration and driver-adapter architecture. The pinned CLI and client versions match exactly.

**Date/Time Storage:** Booking storage combines `bookingDate` and `bookingTime` into a single `bookingDateTime` UTC timestamp. This allows straightforward multi-column unique constraints (serviceId + bookingDateTime) to prevent double bookings.

**Service Deletion:** We use a logical deletion strategy (`isActive = false`) rather than physical database deletion (`DELETE`). This prevents cascading deletions from destroying historical booking records and metrics.

## Phase 3: Authentication and Users
**Authentication Strategy:** We use stateless JWT authentication via `@nestjs/passport` and `passport-jwt`. The payload is minimal (`sub` and `email`).

**E2E Test Database Isolation:** Due to time constraints in this phase, E2E tests run against the primary development database. They are made robust by using uniquely generated emails (`test_${Date.now()}@example.com`) to prevent collisions and avoid database resets. Comprehensive unit testing provides the primary validation safety net.

**Password Hashing:** Passwords are hashed using `bcrypt` and salt rounds are strictly loaded from `BCRYPT_SALT_ROUNDS` via `@nestjs/config`.

## Phase 4: Service Management
**Price Serialization:** Prices are stored as Prisma `Decimal` in the database to prevent precision loss. Before returning to the client, they are serialized securely into 2-decimal strings (e.g. `"149.99"`).

**Empty PATCH Requests:** Rather than checking for empty bodies manually in controllers, we built a reusable `RejectEmptyBodyPipe` to catch `{}` updates globally on PATCH requests.

**Pagination Structure:** Consistent public listing is guaranteed via a `{ data, pagination }` structure calculating `totalPages`, `hasNextPage`, and limits cleanly.

**Logical Deletion & Reactivation:** We enforce strict soft-deletion. Inactive services will return 404 in public reads. Since `PATCH` is supported, administrators can reactivate services by explicitly sending `{ "isActive": true }`.

## Phase 5A: Booking Creation and Retrieval

**Timezone Isolation:** `APP_TIMEZONE` is read once from `ConfigService` in `BookingsService` constructor and passed into the utility functions. The timezone string is never hardcoded in business logic files.

**Date/Time Parsing:** `convertLocalToUtc()` in `timezone.util.ts` uses `Intl.DateTimeFormat` to resolve the UTC offset at the requested local time, then performs UTC math. Invalid calendar dates (e.g. 2026-02-30) are caught by comparing reconstructed Date fields against parsed values before any DB write.

**Past Booking Rule:** The check compares the full UTC datetime (date + time combined) against `Date.now() + 60s`, not just the calendar date, satisfying requirement 3.

**bookingDateTime Abstraction:** `bookingDateTime` is stored internally in UTC. The `mapBookingToResponse()` mapper always converts it back to separate `bookingDate` and `bookingTime` strings in the configured timezone. The field is never exposed in API responses.

**Duplicate Booking Prevention:** Two-layer protection: (1) pre-check using `findUnique` on the compound key `serviceId_bookingDateTime`, returns HTTP 409; (2) `try/catch` on `booking.create()` catches `P2002` Prisma error for concurrent race conditions, also returns HTTP 409.

**Public POST, Protected GET:** `POST /bookings` is intentionally public so customers can submit bookings without an account. `GET /bookings` and `GET /bookings/:id` are protected with `JwtAuthGuard` because booking records contain customer PII.

**Status Enforcement:** `BookingStatus.PENDING` is hardcoded in the service `create()` method and is not read from the DTO. Even if a client sends `status`, the `whitelist: true` pipe will strip it and return 400 via `forbidNonWhitelisted: true`.

**Search Design:** Simple case-insensitive `contains` filter via Prisma across `customerName`, `customerEmail`, and `customerPhone`. No full-text search engine required or introduced.
