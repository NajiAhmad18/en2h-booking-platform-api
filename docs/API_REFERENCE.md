# API Reference

The EN2H Booking Platform API uses standard HTTP methods, JSON encoded payloads, and returns standard HTTP status codes.

## Authentication Endpoints

### `POST /api/v1/auth/register`
Creates a new customer account.
- **Request Body:** `name`, `email`, `password`
- **Success (201):** Returns JWT `access_token` and user details.
- **Errors:** 400 (Validation), 409 (Email in use)

### `POST /api/v1/auth/login`
Authenticates a user.
- **Request Body:** `email`, `password`
- **Success (200):** Returns JWT `access_token` and user details.
- **Errors:** 400 (Validation), 401 (Unauthorized)

## Services Endpoints

### `GET /api/v1/services`
Retrieves a paginated list of active services.
- **Query Params:** `page` (default 1), `limit` (default 10)
- **Success (200):** Returns paginated array of services.

### `GET /api/v1/services/:id`
Retrieves a single active service by UUID.
- **Success (200):** Returns service details.
- **Errors:** 400 (Invalid UUID), 404 (Not found or inactive)

### `POST /api/v1/services` **(Protected)**
Creates a new service.
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:** `name`, `description`, `durationMinutes`, `price`
- **Success (201):** Returns created service.
- **Errors:** 400 (Validation), 401 (Unauthorized)

### `PATCH /api/v1/services/:id` **(Protected)**
Updates an existing service.
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:** Partial service fields.
- **Success (200):** Returns updated service.
- **Errors:** 400 (Validation/Empty body), 401 (Unauthorized), 404 (Not found)

### `DELETE /api/v1/services/:id` **(Protected)**
Logically deletes a service (`isActive=false`). Idempotent.
- **Headers:** `Authorization: Bearer <token>`
- **Success (200):** Returns deactivated service.
- **Errors:** 400 (Invalid UUID), 401 (Unauthorized), 404 (Not found)

## Bookings Endpoints

### `POST /api/v1/bookings`
Creates a new booking. Time is parsed as `Asia/Colombo`.
- **Request Body:** `customerName`, `customerEmail`, `customerPhone`, `serviceId`, `bookingDate`, `bookingTime`, `notes`
- **Success (201):** Returns created booking (status: PENDING).
- **Errors:** 400 (Validation/Past date), 404 (Service not found/inactive), 409 (Duplicate slot)

### `GET /api/v1/bookings` **(Protected)**
Retrieves a paginated list of bookings.
- **Headers:** `Authorization: Bearer <token>`
- **Query Params:** `page`, `limit`, `status`, `serviceId`, `bookingDate`, `customerEmail`, `search`
- **Success (200):** Returns paginated array of bookings.
- **Errors:** 401 (Unauthorized)

### `GET /api/v1/bookings/:id` **(Protected)**
Retrieves a single booking by UUID.
- **Headers:** `Authorization: Bearer <token>`
- **Success (200):** Returns booking details.
- **Errors:** 400 (Invalid UUID), 401 (Unauthorized), 404 (Not found)

### `PATCH /api/v1/bookings/:id/status` **(Protected)**
Transitions booking status (PENDING, CONFIRMED, COMPLETED, CANCELLED).
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:** `status`
- **Success (200):** Returns updated booking.
- **Errors:** 400 (Validation/Empty), 401 (Unauthorized), 404 (Not found), 409 (Invalid transition)

### `PATCH /api/v1/bookings/:id/cancel` **(Protected)**
Cancels a PENDING or CONFIRMED booking.
- **Headers:** `Authorization: Bearer <token>`
- **Success (200):** Returns cancelled booking.
- **Errors:** 400 (Invalid UUID), 401 (Unauthorized), 404 (Not found), 409 (Cannot cancel COMPLETED)
