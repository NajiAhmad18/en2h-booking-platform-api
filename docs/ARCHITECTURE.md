# Architecture Overview

The EN2H Booking Platform API is designed following Domain-Driven Design (DDD) principles combined with the standard NestJS modular architecture. It leverages dependency injection, layered logic, and centralized data access to provide a scalable and testable backend.

## Layered Architecture

1. **Controllers (`*.controller.ts`)**
   - Entry point for HTTP requests.
   - Responsible solely for routing, parsing parameters, invoking the service layer, and defining Swagger annotations.
   - Contains no business logic.

2. **Services (`*.service.ts`)**
   - The core of the application.
   - Handles all business rules, lifecycle validation, duplicate prevention, and orchestration.
   - Exposes clear interfaces and DTO-mapped responses to the controllers.

3. **Data Access (`prisma.service.ts`)**
   - Centralized database connection management via Prisma ORM.
   - Services inject `PrismaService` to execute queries.
   - Prisma's schema (`schema.prisma`) serves as the single source of truth for the database structure.

## Core Design Decisions

### 1. Booking Date & Time Handling
- **Problem**: Timezones cause severe issues in booking platforms if local times are stored ambiguously.
- **Solution**: The API accepts `bookingDate` and `bookingTime` natively from the client. It converts these to a UTC timestamp (`bookingDateTime`) using a configured server timezone (`Asia/Colombo`). All database storage and unique constraints operate on the UTC timestamp. When responding, the mapper safely decodes the UTC timestamp back to the local date and time fields.

### 2. Service Deletion (Logical vs. Physical)
- **Problem**: Deleting a service breaks foreign key constraints for historical bookings or orphans the data.
- **Solution**: Implemented logical deletion. Services use an `isActive` boolean flag. `DELETE /services/:id` sets `isActive=false`. The `GET /services` endpoint only returns active services. Bookings can still resolve relationships to inactive services.

### 3. Booking Lifecycle State Machine
- **Problem**: Booking statuses can easily become corrupt (e.g., cancelling an already completed booking).
- **Solution**: Centralized `validateTransition` logic in `BookingsService` uses an explicit `ALLOWED_TRANSITIONS` map. Cross-status transitions are rigorously validated (409 Conflict if invalid). Same-status transitions bypass the database write entirely, offering idempotent updates (200 OK).

### 4. Decimal Storage & Serialization
- **Problem**: Floating-point math errors in JavaScript.
- **Solution**: Price fields are stored as `Decimal` in PostgreSQL. Before returning payloads to the client, a custom mapper (`serializeService`) converts `Decimal` values to fixed-point strings (`"150.00"`).

### 5. Validation Pipeline
- **Problem**: Malformed payloads can crash the system or corrupt the database.
- **Solution**: The app enforces strict, global validation using `ValidationPipe`.
  - `whitelist: true`: Strips unknown fields.
  - `forbidNonWhitelisted: true`: Rejects unknown fields entirely with a 400 Bad Request.
  - `RejectEmptyBodyPipe`: Specifically catches HTTP PATCH requests that contain an empty `{}` body.
