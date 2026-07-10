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
*To be implemented in Phase 3.*

## API Documentation
*Swagger UI will be available at `/api/docs`.*

## Business Rules & Assumptions
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
