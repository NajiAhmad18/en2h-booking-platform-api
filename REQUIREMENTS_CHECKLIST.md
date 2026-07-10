# Requirements Checklist - EN2H Booking Platform API

## Phase 1: Environment and Setup

- [X] Node.js 24 verified
- [X] Docker verified
- [X] Strict NestJS project created
- [X] Core dependencies installed
- [X] Prisma initialized for PostgreSQL
- [X] Build passed
- [X] Starter tests passed
- [X] .env confirmed ignored
- [X] .env.example created
- [X] Package functionality verification passed
- [ ] Initial Git commit

## Phase 2: PostgreSQL & Docker Setup

- [ ] docker-compose.yml with PostgreSQL service
- [ ] Database schema defined (Prisma)
- [ ] Migrations run successfully
- [ ] Seed script added

## Phase 3: Authentication

- [ ] JWT Module configured
- [ ] bcrypt hashing implemented
- [ ] POST /api/v1/auth/register
- [ ] POST /api/v1/auth/login
- [ ] JwtAuthGuard implemented

## Phase 4: Service Management

- [ ] Service module/controller/service
- [ ] GET /api/v1/services (Public)
- [ ] GET /api/v1/services/:id (Public)
- [ ] POST /api/v1/services (Protected)
- [ ] PATCH /api/v1/services/:id (Protected)
- [ ] DELETE /api/v1/services/:id (Protected - soft delete)
- [ ] DTO validation for Services

## Phase 5: Booking Management & Business Rules

- [ ] Booking module/controller/service
- [ ] POST /api/v1/bookings (Public)
- [ ] GET /api/v1/bookings (Protected)
- [ ] GET /api/v1/bookings/:id (Protected)
- [ ] PATCH /api/v1/bookings/:id/status (Protected)
- [ ] PATCH /api/v1/bookings/:id/cancel (Protected)
- [ ] Rule: Cancelled bookings cannot be marked as completed
- [ ] Rule: Booking dates cannot be in the past
- [ ] Rule: Must belong to existing service
- [ ] Rule: Prevent duplicate slots
- [ ] DTO validation for Bookings

## Phase 6: Core Features (Validation, Error, Docs)

- [ ] Swagger API documentation
- [ ] Global Exception Handling

## Phase 7: Bonus Features

- [ ] Pagination on bookings (and services)
- [ ] Search and Filter (by status, date, etc.)
- [ ] Unit & E2E Testing

## Phase 8: Documentation Finalization

- [ ] README.md completed
- [ ] SRS.md completed
- [ ] RUNNING_GUIDE.md completed
- [ ] FINAL_AUDIT.md generated
- [ ] SRS and Running Guide exported as PDF
