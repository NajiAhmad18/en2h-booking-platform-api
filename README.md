# EN2H Booking Platform API

## Project Overview
A Booking Platform REST API built for the EN2H Software Engineer Intern (NestJS) technical assignment. This API allows users to manage services and customers to book those services.

## Features
- **User Authentication**: JWT-based login and registration (Phase 3).
- **Service Management**: CRUD operations for services.
- **Booking Management**: Booking creation with robust date/time and duplicate-slot validation.

## Technology Stack
- **Framework**: NestJS (TypeScript, strict mode)
- **Database**: PostgreSQL 16
- **ORM**: Prisma 5
- **Docker**: Docker Compose for PostgreSQL
- **Node**: Node.js 24 LTS

## Folder Structure
Following NestJS best practices, the codebase uses feature modules.
- `src/auth/`
- `src/users/`
- `src/services/`
- `src/bookings/`
- `src/prisma/`

## Prerequisites
- Node.js 24
- Docker Desktop

## Installation
```bash
git clone <repository_url>
cd en2h-booking-platform-api
npm install
```

## Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Ensure Docker PostgreSQL uses the same credentials specified in your `.env`.

## PostgreSQL Setup (Docker)
Start the PostgreSQL container:
```bash
npm run db:up
# Or standard docker command: docker compose up -d
```
To stop the database:
```bash
npm run db:down
```

## Prisma Setup & Running Migrations
Initialize the schema and seed the database:
```bash
npm run prisma:migrate
npm run prisma:seed
```

## Running the Application
```bash
npm run start:dev
```

## Authentication Usage
The API uses JWT Bearer authentication.

**Password Policy:** Passwords must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number/special character.

Register a new user:
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name": "Jane Doe", "email": "jane@example.com", "password": "StrongPassword1!"}'
```

Login:
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "jane@example.com", "password": "StrongPassword1!"}'
```
Responses do not include the `passwordHash`. Keep the returned `accessToken` and use it in subsequent requests as `Authorization: Bearer <token>`.

## Service Management

Public users can browse active services. Administrators (any authenticated user) can create, update, or remove them.
- `GET /api/v1/services` (Public) - Lists all active services with pagination (`?page=1&limit=10`).
- `GET /api/v1/services/:id` (Public) - Retrieves a specific active service.
- `POST /api/v1/services` (Protected) - Creates a new service.
- `PATCH /api/v1/services/:id` (Protected) - Updates a service. Send `{"isActive": true}` to reactivate a logically deleted service.
- `DELETE /api/v1/services/:id` (Protected) - Performs logical deletion (`isActive=false`).

Prices are consistently returned as 2-decimal strings.

## API Documentation
Swagger UI is available at `http://localhost:3000/api/docs`.

## Business Rules & Assumptions
- **Prisma Version**: This project pins Prisma 5 for the conventional schema-based configuration used in this time-constrained assessment. Newer Prisma versions use a different configuration and driver-adapter architecture. The pinned CLI and client versions match exactly.
- **Booking Storage**: `bookingDate` (YYYY-MM-DD) and `bookingTime` (HH:mm) are converted to a single UTC `bookingDateTime` for database storage using the `Asia/Colombo` timezone. This ensures accurate duplicate slot prevention.
- **Service Deletion**: Uses logical soft deletion (`isActive=false`) to preserve historical booking records.
- **Duplicate Prevention**: Enforced at the database level using a unique index on `[serviceId, bookingDateTime]`.
- **Public Service Reads**: Getting a list of services is public so that unauthenticated customers can find services to book.

## Seed Credentials (Development Only)
- **Email**: `admin@example.com`
- **Password**: `ChangeMe123!`

## Author
**Naji Ahmad Javahir**
- GitHub: [NajiAhmad18](https://github.com/NajiAhmad18)
- Portfolio: [najiahmad.vercel.app](https://najiahmad.vercel.app)
- LinkedIn: [naji-ahmad-javahir](https://www.linkedin.com/in/naji-ahmad-javahir/)

## Booking Management

Customers can submit bookings without authentication. Administrators can query and manage bookings.

### Booking Endpoints
- `POST /api/v1/bookings` **(Public)** — Create a booking. `bookingDate` and `bookingTime` are in `Asia/Colombo` timezone. Status is always `PENDING`.
- `GET /api/v1/bookings` **(Protected)** — Paginated list. Supports `page`, `limit`, `status`, `serviceId`, `bookingDate`, `customerEmail`, and `search` filters.
- `GET /api/v1/bookings/:id` **(Protected)** — Retrieve a booking by UUID.

### Booking Rules
- Service must exist and be active; otherwise returns **404**.
- Booking must be at least 1 minute in the future; otherwise returns **400**.
- Duplicate `serviceId` + `bookingDate` + `bookingTime` slot returns **409**.
- `bookingDateTime` is stored in UTC internally; responses always return separate `bookingDate` (YYYY-MM-DD) and `bookingTime` (HH:mm) in `Asia/Colombo`.
- `status` cannot be set by the client — it always starts as `PENDING`.

## Booking Lifecycle

Authenticated users can manage booking status using two dedicated endpoints.

### Status Transitions
| From | To | Result |
|---|---|---|
| PENDING | CONFIRMED | ✅ 200 |
| PENDING | CANCELLED | ✅ 200 |
| CONFIRMED | COMPLETED | ✅ 200 |
| CONFIRMED | CANCELLED | ✅ 200 |
| PENDING | COMPLETED | ❌ 409 |
| CANCELLED | any | ❌ 409 |
| COMPLETED | any | ❌ 409 |
| same → same | — | ✅ 200 (idempotent) |

### Lifecycle Endpoints
- `PATCH /api/v1/bookings/:id/status` **(Protected)** — Transition to any allowed status.
- `PATCH /api/v1/bookings/:id/cancel` **(Protected)** — Cancel PENDING or CONFIRMED bookings. Idempotent if already cancelled. Returns 409 if COMPLETED.

No rows are ever deleted. All booking history is preserved.
