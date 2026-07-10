# EN2H Booking Platform API - Implementation Plan

## Project Overview
A REST API built with NestJS, PostgreSQL, Prisma, and Docker to manage services and customer bookings, fulfilling the EN2H Software Engineer Intern technical assessment.

## Phases
1. **Environment and Setup**: Initializing NestJS (strict mode), Node 24, Prisma, and core dependencies.
2. **PostgreSQL & Docker Setup**: Setting up `docker-compose.yml` (PostgreSQL only, no NestJS containerized), Prisma schema, and initial migrations.
3. **Authentication**: Implementing JWT, login, and registration.
4. **Service Management**: Implementing CRUD for services with protected mutations and soft deletion.
5. **Booking Management**: Implementing booking workflow with robust timezone handling and business rules.
6. **Documentation & Validation (Core)**: Swagger documentation, DTO validation, error handling.
7. **Bonus Features**: Pagination, filtering, duplicate prevention, and unit tests.

## Key Architectural Decisions
- **Service Deletion**: We will implement logical deactivation (`isActive=false`) instead of hard deletion to preserve booking history.
- **Booking Date & Time**: `bookingDate` (YYYY-MM-DD) and `bookingTime` (HH:mm) will be accepted via API, converted to UTC using the `Asia/Colombo` timezone, and stored as a single `bookingDateTime` timestamp in PostgreSQL. Responses will parse this back into separate fields.
- **Duplicate Prevention**: Enforced at the database level using a Prisma unique constraint on `[serviceId, bookingDateTime]`.
- **Access Control**: Service reads are public (so customers can view them), but mutations are protected. Booking creation is public, but reading/managing bookings is protected to secure customer data.
- **Documentation**: Swagger API documentation is treated as a core requirement.
- **Validation**: DTO validation and global error handling are treated as core implementations (10 marks).
- **Refresh Tokens**: Kept as low priority since it's a bonus feature.

## Traceability Matrix (Evaluation Criteria)
*To be filled during development to map every criterion to implementation files and tests.*
- Project Structure (15 marks)
- NestJS Best Practices (15 marks)
- Authentication (15 marks)
- Database Design (15 marks)
- API Design (15 marks)
- Validation and Error Handling (10 marks)
- Code Quality and Maintainability (10 marks)
- Documentation (5 marks)
- Bonus Features (10 marks)
