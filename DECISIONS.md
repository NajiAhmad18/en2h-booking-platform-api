# Architectural Decisions

## Service Deletion
- **Decision**: Soft Deletion (Deactivation)
- **Reasoning**: The PDF requires a "Delete Service" feature. However, hard-deleting a service would break historical booking records (as a booking belongs to a service). Therefore, we will implement logical deactivation using the `isActive` flag or reject deletion if bookings exist. For simplicity and user experience, we will use soft deletion (`isActive = false`) so historical bookings retain their service details.

## Booking Storage (Date & Time)
- **Decision**: Accept `bookingDate` and `bookingTime` separately, convert to UTC `bookingDateTime` for storage.
- **Reasoning**: The PDF requires `bookingDate` (YYYY-MM-DD) and `bookingTime` (HH:mm) as separate fields on the model. Storing them as separate database strings introduces validation and timezone complexity, and makes it harder to prevent duplicate slots or past dates.
- **Assumption**: 
  - The API receives dates and times separately in the `Asia/Colombo` timezone (since EN2H operates in Sri Lanka). 
  - We convert this local time to a UTC timestamp (`bookingDateTime`) for database storage. 
  - The API will format the returned value back into `bookingDate` and `bookingTime` strings for the response. 
  - This ensures accurate conflict detection (duplicate bookings) and prevents past-date bookings without timezone drift.

## Duplicate Booking Prevention
- **Decision**: Database-level unique constraint on `serviceId` + `bookingDateTime`.
- **Reasoning**: Application-level checks are subject to race conditions under concurrent load. Enforcing a `@@unique([serviceId, bookingDateTime])` in the Prisma schema ensures the database prevents duplicate slots robustly.

## Public Service Reads
- **Decision**: Service reading is public.
- **Reasoning**: The PDF says "Authenticated users should be able to... Get All Services", but it also says customers can "create bookings without authentication". Customers cannot realistically create a booking without discovering the available services and their IDs first. Therefore, we assume read access (GET) is public, while mutation (POST/PATCH/DELETE) requires authentication.

## Booking Privacy
- **Decision**: Booking reads/updates are protected.
- **Reasoning**: Public users may create bookings, but listing bookings, retrieving booking details, updating status, and cancelling bookings must require authentication to protect customer personal information (Name, Email, Phone).
