# Requirements Checklist - EN2H Booking Platform API

## Phase 1: Environment and Setup
- [x] Node.js 24 verified
- [x] Docker verified
- [x] Strict NestJS project created
- [x] Core dependencies installed
- [x] Prisma initialized for PostgreSQL
- [x] Build passed
- [x] Starter tests passed
- [x] .env confirmed ignored
- [x] .env.example created
- [x] Package functionality verification passed
- [x] Initial Git commit

## Phase 2: PostgreSQL & Docker Setup
- [x] docker-compose.yml with PostgreSQL service
- [x] Database schema defined (Prisma)
- [x] Migrations run successfully
- [x] Seed script added

## Phase 3: Authentication
- [x] JWT Module configured
- [x] bcrypt hashing implemented
- [x] POST /api/v1/auth/register
- [x] POST /api/v1/auth/login
- [x] JwtAuthGuard implemented

## Phase 4: Service Management
- [x] Create `ServicesModule`, `ServicesController`, `ServicesService`
- [x] Implement logical deletion (`isActive` flag)
- [x] Apply DTO validation (duration max, price format, required fields)
- [x] Create unit tests and E2E tests for services (Protected)
- [x] GET /api/v1/services (Public)
- [x] GET /api/v1/services/:id (Public)
- [x] POST /api/v1/services (Protected)
- [x] PATCH /api/v1/services/:id (Protected)
- [x] DELETE /api/v1/services/:id (Protected - soft delete)
- [x] DTO validation for Services

## Phase 5: Booking Management & Business Rules

### Phase 5A: Booking Creation & Retrieval (Complete)
- [x] BookingsModule, BookingsController, BookingsService
- [x] POST /api/v1/bookings (Public)
- [x] GET /api/v1/bookings (Protected, paginated, filterable)
- [x] GET /api/v1/bookings/:id (Protected)
- [x] bookingDate + bookingTime accepted separately, stored as UTC bookingDateTime
- [x] bookingDateTime never exposed in API responses
- [x] Timezone conversion via APP_TIMEZONE (Asia/Colombo) using Intl
- [x] Invalid calendar dates rejected (e.g. 2026-02-30)
- [x] Past booking rejection (full datetime comparison)
- [x] Rule: Must belong to existing active service (404 if not)
- [x] Rule: Prevent duplicate slots (409 - app-level + P2002 race condition)
- [x] Status forced to PENDING on creation — not client-controlled
- [x] DTO validation: customerName, customerEmail, customerPhone, serviceId, bookingDate, bookingTime, notes
- [x] BookingQueryDto: page, limit, status, serviceId, bookingDate, customerEmail, search
- [x] Reusable response mapper (mapBookingToResponse)
- [x] Unit tests: 14 tests (timezone util + service)
- [x] E2E tests: 14 tests

### Phase 5B: Status Updates & Cancellation (Complete)
- [x] PATCH /api/v1/bookings/:id/status (Protected)
- [x] PATCH /api/v1/bookings/:id/cancel (Protected)
- [x] Explicit transition map: PENDING→CONFIRMED, PENDING→CANCELLED, CONFIRMED→COMPLETED, CONFIRMED→CANCELLED
- [x] Rule: CANCELLED and COMPLETED are terminal states
- [x] Rule: Cancelled bookings cannot be re-opened or marked completed
- [x] Rule: PENDING cannot skip to COMPLETED
- [x] Same-status updates are idempotent (200, no DB write)
- [x] UpdateBookingStatusDto with enum validation and unknown field rejection
- [x] RejectEmptyBodyPipe applied to status endpoint
- [x] Unit tests: 15 lifecycle tests (8 updateStatus + 5 cancel + idempotency)
- [x] E2E tests: 15 lifecycle tests

## Phase 6: Core Features (Validation, Error, Docs) (Complete)
- [x] Swagger API documentation
- [x] Global Exception Handling (ValidationPipe)

## Phase 7: Bonus Features (Complete)
- [x] Pagination on bookings (and services)
- [x] Search and Filter (by status, date, etc.)
- [x] Unit & E2E Testing (100+ tests)

## Phase 8: Final Documentation (Complete)
- [x] README.md completed and rewritten
- [x] docs/API_REFERENCE.md generated
- [x] docs/TESTING.md generated
- [x] docs/ARCHITECTURE.md generated
- [x] DECISIONS.md updated
- [x] docs/IMPLEMENTATION_PLAN.md updated
