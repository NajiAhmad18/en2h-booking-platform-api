# Booking Platform API

A production-ready RESTful API for managing services and customer bookings, developed for the EN2H Software Engineer Intern technical assessment.

## 1. Project Overview
The EN2H Booking Platform API provides a robust backend solution for service-based businesses. It allows administrators to manage their service catalog and enables customers to create and track bookings. Built with strict adherence to enterprise design patterns, the API ensures data integrity, comprehensive validation, and a seamless developer experience.

## 2. Features
- **Robust Authentication**: JWT-based stateless authentication with secure password hashing (bcrypt).
- **Service Management**: Full CRUD capabilities for services with logical (soft) deletion to preserve historical booking data.
- **Booking Workflow**: Advanced lifecycle management (Pending, Confirmed, Completed, Cancelled) with strict state transition validation.
- **Timezone Awareness**: Accurate handling of local booking times (Asia/Colombo) converted to UTC for safe database storage.
- **Duplicate Prevention**: Database-level constraints combined with application-level validation to prevent double bookings.
- **Pagination & Filtering**: Efficient data retrieval for listing endpoints.
- **Comprehensive API Docs**: Fully integrated Swagger UI for interactive exploration and testing.

## 3. Tech Stack
- **Framework**: NestJS (v11) with TypeScript (Strict Mode)
- **Database**: PostgreSQL 16
- **ORM**: Prisma
- **Validation**: class-validator, class-transformer
- **Authentication**: Passport-JWT
- **Testing**: Jest, Supertest
- **Containerization**: Docker & Docker Compose

## 4. Architecture
The application follows a modular, controller-service-repository pattern (via Prisma), grouped by feature domains.
- **Controllers**: Handle HTTP requests, routing, and Swagger annotations.
- **Services**: Contain all business logic and rule validation.
- **Prisma**: Serves as the data access layer.
- **Guards/Pipes**: Handle authentication authorization and data transformation/validation at the request boundary.

## 5. Folder Structure
```text
src/
├── auth/            # Authentication logic, JWT strategies, and guards
├── bookings/        # Booking lifecycle, DTOs, and controllers
├── prisma/          # Prisma service and database connection
├── services/        # Service management module and shared pipes
├── users/           # User management (internal)
├── app.module.ts    # Root application module
└── main.ts          # Application entry point
```

## 6. Prerequisites
- **Node.js**: v24+
- **npm**: v10+
- **Docker**: Engine & Compose v2+

## 7. Installation
1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd en2h-booking-platform-api
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

## 8. Environment Variables
Copy the example environment file and configure it:
```bash
cp .env.example .env
```
Ensure the `DATABASE_URL` matches your Docker setup and configure a secure `JWT_SECRET`.

## 9. Docker Database Setup
Start the PostgreSQL container:
```bash
docker compose up -d
```
Verify the database is running:
```bash
docker compose ps
```

## 10. Prisma Migration
Apply the database schema and create necessary tables:
```bash
npx prisma migrate deploy
```
*(Optionally, run `npx prisma generate` if the client was not auto-generated during install).*

## 11. Seed Database
The project includes a seeder to populate an initial admin user and sample services.
Run the seed script:
```bash
npx prisma db seed
```

## 12. Running the API
Start the NestJS development server:
```bash
npm run start:dev
```
The API will be available at `http://localhost:3000/api/v1`.

## 13. Running Tests
The project includes an extensive suite of unit and end-to-end tests.
- **Unit Tests**: `npm test`
- **E2E Tests**: `npm run test:e2e`

## 14. Swagger URL
Once the application is running, navigate to the Swagger UI to explore and test the endpoints:
- **Local URL**: [http://localhost:3000/api/docs](http://localhost:3000/api/docs)

## 15. Authentication
Most endpoints (except public reads and login/register) are protected by a JWT auth guard.
1. Authenticate via `POST /api/v1/auth/login` to receive an `access_token`.
2. In Swagger, click the **Authorize** button at the top right and input the token.
3. For raw HTTP requests, include the header: `Authorization: Bearer <your_token>`.

## 16. API Endpoint Summary
- **Auth**: `POST /auth/register`, `POST /auth/login`
- **Services**: `POST /services`, `GET /services`, `GET /services/:id`, `PATCH /services/:id`, `DELETE /services/:id`
- **Bookings**: `POST /bookings`, `GET /bookings`, `GET /bookings/:id`, `PATCH /bookings/:id/status`, `PATCH /bookings/:id/cancel`

## 17. Booking Lifecycle
Bookings transition through a strict state machine:
- `PENDING` → `CONFIRMED` or `CANCELLED`
- `CONFIRMED` → `COMPLETED` or `CANCELLED`
- `COMPLETED` and `CANCELLED` are terminal states.
Same-status updates are safely ignored (idempotent).

## 18. Business Rules
- **No Hard Deletion**: Deleted services are marked as `isActive=false`. They disappear from public API results but remain linked to historical bookings.
- **Booking Time Restrictions**: Bookings must be scheduled at least 60 seconds in the future (relative to the configured server timezone).
- **Duplicate Prevention**: A customer cannot book the same service at the exact same time.

## 19. Assumptions
- **Timezone**: All local booking inputs are assumed to be in the `APP_TIMEZONE` (default: `Asia/Colombo`).
- **Currency**: Prices are stored as high-precision decimals but serialized to clients as fixed-point 2-decimal strings to prevent floating-point errors.

## 20. Future Improvements
- Implement automated email notifications for status transitions.
- Add rate limiting and robust CORS configuration for a production frontend.
- Introduce refresh tokens for extended session management.
- Integrate Redis for caching frequently accessed data (like the active service catalog).

## 21. Development Seed Credentials
If the seed script was executed, you can authenticate using:
- **Email**: `admin@en2h.com`
- **Password**: `password123`

## 22. Author
Developed as part of the EN2H Software Engineer Intern assessment.
