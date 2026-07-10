# Testing Strategy

The EN2H Booking Platform API employs a rigorous testing strategy utilizing Jest for unit tests and Supertest for End-to-End (E2E) testing. The project boasts extensive test coverage to ensure business logic integrity and robust error handling.

## Running Tests

### Unit Tests
Execute the unit test suite:
```bash
npm test
```
To run tests with a coverage report:
```bash
npm run test:cov
```

### End-to-End (E2E) Tests
Execute the integration test suite (requires an active database connection):
```bash
npm run test:e2e
```

## Test Structure

### Unit Tests (`src/**/*.spec.ts`)
Unit tests focus on isolated business logic inside services and utility functions. The Prisma ORM is mocked to prevent database side effects.
- **`auth.service.spec.ts`**: Tests password hashing, JWT generation, and validation.
- **`services.service.spec.ts`**: Tests service creation, logic deletion (`isActive=false`), and decimal string mapping.
- **`bookings.service.spec.ts`**: Tests duplicate prevention, timezone logic, and strict lifecycle transitions.
- **`timezone.util.spec.ts`**: Verifies `Asia/Colombo` timezone conversions, including midnight boundaries and future-booking buffers.

### End-to-End Tests (`test/**/*.e2e-spec.ts`)
E2E tests interact with the actual NestJS application layer and a real PostgreSQL database instance. They verify route guards, DTO validation pipelines, and complex database flows.
- **`auth.e2e-spec.ts`**: Tests registration, login, and bad credentials.
- **`services.e2e-spec.ts`**: Tests protected routes, pagination, and `RejectEmptyBodyPipe`.
- **`bookings.e2e-spec.ts`**: Integrates services and bookings, testing full lifecycle flows, duplicate 409 responses, and public booking creation.

## Key Testing Practices
1. **Isolated State**: E2E tests generate unique emails and UUIDs or use dedicated test database schemas to prevent test pollution.
2. **Idempotency Testing**: Lifecycle endpoints (e.g., `PATCH /bookings/:id/cancel`) explicitly verify that repeated calls return HTTP 200 without executing secondary database writes.
3. **Guard & Pipe Verification**: Every protected route has a test verifying `401 Unauthorized` without a token, and every mutation verifies `400 Bad Request` with invalid DTO payloads.
