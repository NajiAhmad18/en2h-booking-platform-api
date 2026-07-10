# Decisions Log

## Phase 2: Database and ORM
**Prisma Downgrade (v7 to v5):** This project pins Prisma 5 for the conventional schema-based configuration used in this time-constrained assessment. Newer Prisma versions use a different configuration and driver-adapter architecture. The pinned CLI and client versions match exactly.

**Date/Time Storage:** Booking storage combines `bookingDate` and `bookingTime` into a single `bookingDateTime` UTC timestamp. This allows straightforward multi-column unique constraints (serviceId + bookingDateTime) to prevent double bookings.

**Service Deletion:** We use a logical deletion strategy (`isActive = false`) rather than physical database deletion (`DELETE`). This prevents cascading deletions from destroying historical booking records and metrics.

## Phase 3: Authentication and Users
**Authentication Strategy:** We use stateless JWT authentication via `@nestjs/passport` and `passport-jwt`. The payload is minimal (`sub` and `email`).

**E2E Test Database Isolation:** Due to time constraints in this phase, E2E tests run against the primary development database. They are made robust by using uniquely generated emails (`test_${Date.now()}@example.com`) to prevent collisions and avoid database resets. Comprehensive unit testing provides the primary validation safety net.

**Password Hashing:** Passwords are hashed using `bcrypt` and salt rounds are strictly loaded from `BCRYPT_SALT_ROUNDS` via `@nestjs/config`.
