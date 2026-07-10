# EN2H Booking Platform API - Implementation Plan

## Project Overview
A REST API built with NestJS, PostgreSQL, Prisma, and Docker to manage services and customer bookings, fulfilling the EN2H Software Engineer Intern technical assessment.

## Phases

| Phase | Description | Status |
|---|---|---|
| 1 | Environment and Setup | ✅ Complete |
| 2 | PostgreSQL & Docker Setup | ✅ Complete |
| 3 | Authentication (JWT, bcrypt, register, login, guard) | ✅ Complete |
| 4 | Service Management (CRUD, soft deletion, pagination) | ✅ Complete |
| 5A | Booking Creation & Retrieval | ✅ Complete |
| 5B | Booking Lifecycle Management | ✅ Complete |
| 6 | Documentation & Validation (Swagger, global error handling) | ✅ Complete |
| 7 | Bonus Features (pagination, search, tests) | ✅ Complete |

## Phase 5B: Booking Lifecycle Management (Complete)

### Implemented
- `PATCH /api/v1/bookings/:id/status` — Updates booking status via explicit transition map. Protected.
- `PATCH /api/v1/bookings/:id/cancel` — Cancels PENDING or CONFIRMED bookings. Protected.
- `UpdateBookingStatusDto` — Enum validation, unknown field rejection via global `whitelist` pipe, empty body rejection via `RejectEmptyBodyPipe`.
- `validateTransition()` — Single internal method, single source of truth for all lifecycle rules.
- `updateStatus()` — Applies transition map; short-circuits for same-status without a DB write.
- `cancel()` — Dedicated cancel surface; idempotent on CANCELLED; 409 on COMPLETED.

### Lifecycle Rules
| Cross-status Transition | Result |
|---|---|
| PENDING → CONFIRMED | ✅ 200 |
| PENDING → CANCELLED | ✅ 200 |
| CONFIRMED → COMPLETED | ✅ 200 |
| CONFIRMED → CANCELLED | ✅ 200 |
| PENDING → COMPLETED | ❌ 409 |
| CANCELLED → CONFIRMED / COMPLETED / PENDING | ❌ 409 |
| COMPLETED → PENDING / CONFIRMED / CANCELLED | ❌ 409 |
| same → same (all four statuses) | ✅ 200 idempotent, no DB write |

### Same-Status Idempotency
`validateTransition()` returns early if `current === next`. The `updateStatus()` caller then returns the unchanged booking immediately without calling `prisma.booking.update`. This applies to **all four statuses** including CANCELLED and COMPLETED.

### Data Integrity
No booking rows are ever deleted. Completed and cancelled bookings remain stored permanently and are queryable via `GET /bookings` with status filters.

### Tests Added
- Unit: 4 idempotency tests (PENDING/CONFIRMED/CANCELLED/COMPLETED), 4 allowed transitions, 4 rejected transitions, 1 cancel idempotency, 2 cancel transitions, 1 cancel rejected, 2 404 tests
- E2E: 401 guard, empty body, unknown field, invalid UUID, PENDING→CONFIRMED, PENDING→COMPLETED (409), CONFIRMED→COMPLETED, COMPLETED→CANCELLED (409), cancel PENDING, cancel idempotent, cancel COMPLETED (409), 404

## Key Architectural Decisions
- **Service Deletion**: Logical deactivation (`isActive=false`) instead of hard deletion to preserve booking history.
- **Booking Date & Time**: `bookingDate` (YYYY-MM-DD) and `bookingTime` (HH:mm) are accepted via API, converted to UTC using `APP_TIMEZONE` from `ConfigService`, stored as a single `bookingDateTime` timestamp. Responses always expose separate fields — `bookingDateTime` is never serialised.
- **Duplicate Prevention**: Application-level pre-check on compound key `serviceId_bookingDateTime` + P2002 catch for race conditions. Both return HTTP 409.
- **Access Control**: Service reads are public; mutations are protected. Booking creation is public; listing, retrieval, and lifecycle management are protected.
- **Booking Lifecycle**: Explicit `ALLOWED_TRANSITIONS` map in `BookingsService`. Same-status check precedes the map to ensure idempotency without consulting the map. CANCELLED and COMPLETED are terminal for cross-status transitions only.
- **Documentation**: Swagger API documentation is treated as a core requirement.
- **Validation**: DTO validation and global error handling are treated as core implementations (10 marks).
- **Refresh Tokens**: Kept as low priority since it is a bonus feature.

## Traceability Matrix (Evaluation Criteria)
- Project Structure (15 marks)
- NestJS Best Practices (15 marks)
- Authentication (15 marks)
- Database Design (15 marks)
- API Design (15 marks)
- Validation and Error Handling (10 marks)
- Code Quality and Maintainability (10 marks)
- Documentation (5 marks)
- Bonus Features (10 marks)
