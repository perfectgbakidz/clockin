# Backend Database Schema Guide

This document outlines the recommended database schema for the Pardee Foods Employee Attendance System. The schema is designed to support user management, attendance tracking, and secure biometric authentication using WebAuthn.

## Table of Contents

1.  [Users Table](#1-users-table)
2.  [Attendance Records Table](#2-attendance-records-table)
3.  [WebAuthn Credentials Table](#3-webauthn-credentials-table)
4.  [Relationships Diagram](#4-relationships-diagram)

---

## 1. `users` Table

Stores information about all users in the system, including employees, HR, and administrators.

| Column Name     | Data Type                  | Constraints                             | Description                                            |
| --------------- | -------------------------- | --------------------------------------- | ------------------------------------------------------ |
| `id`            | `UUID`                     | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | Unique identifier for the user.                        |
| `name`          | `VARCHAR(255)`             | `NOT NULL`                              | Full name of the user.                                 |
| `email`         | `VARCHAR(255)`             | `NOT NULL`, `UNIQUE`                    | User's email address, used for login.                  |
| `password_hash` | `VARCHAR(255)`             | `NOT NULL`                              | Hashed password for standard login.                    |
| `role`          | `VARCHAR(50)`              | `NOT NULL`, `CHECK (role IN ('employee', 'admin', 'hr'))` | User's role in the system.            |
| `department`    | `VARCHAR(255)`             | `NOT NULL`                              | Department the user belongs to.                        |
| `status`        | `VARCHAR(50)`              | `NOT NULL`, `CHECK (status IN ('Active', 'Inactive'))`, `DEFAULT 'Active'` | User's employment status. |
| `created_at`    | `TIMESTAMP WITH TIME ZONE` | `NOT NULL`, `DEFAULT NOW()`             | Timestamp of when the user was created.                |
| `updated_at`    | `TIMESTAMP WITH TIME ZONE` | `NOT NULL`, `DEFAULT NOW()`             | Timestamp of the last update to the user record.       |

### Example (PostgreSQL):
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('employee', 'admin', 'hr')),
    department VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
```

---

## 2. `attendance_records` Table

Logs each clock-in and clock-out event for every employee.

| Column Name    | Data Type                  | Constraints                 | Description                                    |
| -------------- | -------------------------- | --------------------------- | ---------------------------------------------- |
| `id`           | `UUID`                     | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | Unique identifier for the attendance record.   |
| `user_id`      | `UUID`                     | `NOT NULL`, `FOREIGN KEY (users.id)` | Links to the user who made the record.         |
| `date`         | `DATE`                     | `NOT NULL`                  | The date of the attendance entry.              |
| `clock_in`     | `TIMESTAMP WITH TIME ZONE` | `NOT NULL`                  | The exact time the user clocked in.            |
| `clock_out`    | `TIMESTAMP WITH TIME ZONE` |                             | The exact time the user clocked out. (Nullable) |
| `total_hours`  | `NUMERIC(4, 2)`            |                             | Calculated total hours worked. (Nullable)      |

**Constraint:** A unique constraint should be placed on `(user_id, date)` to ensure only one attendance record per user per day.

### Example (PostgreSQL):
```sql
CREATE TABLE attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    clock_in TIMESTAMP WITH TIME ZONE NOT NULL,
    clock_out TIMESTAMP WITH TIME ZONE,
    total_hours NUMERIC(4, 2),
    UNIQUE(user_id, date)
);
```

---

## 3. `webauthn_credentials` Table

Stores the public key credentials required for WebAuthn (biometric) authentication.

| Column Name      | Data Type                  | Constraints                 | Description                                                  |
| ---------------- | -------------------------- | --------------------------- | ------------------------------------------------------------ |
| `id`             | `BYTEA`                    | `PRIMARY KEY`               | The credential ID, as a byte array.                          |
| `user_id`        | `UUID`                     | `NOT NULL`, `FOREIGN KEY (users.id)` | Links to the user who owns this credential.                |
| `public_key`     | `BYTEA`                    | `NOT NULL`                  | The COSE-encoded public key.                                 |
| `counter`        | `BIGINT`                   | `NOT NULL`                  | The signature counter, used to prevent replay attacks.       |
| `transports`     | `JSONB`                    |                             | A list of transports supported by the authenticator (e.g., "internal", "usb"). |
| `created_at`     | `TIMESTAMP WITH TIME ZONE` | `NOT NULL`, `DEFAULT NOW()` | Timestamp of when the credential was registered.             |

### Example (PostgreSQL):
```sql
CREATE TABLE webauthn_credentials (
    id BYTEA PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    public_key BYTEA NOT NULL,
    counter BIGINT NOT NULL,
    transports JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
```

---

## 4. Relationships Diagram

A simple representation of the relationships between the tables.

```
+-------------+      +----------------------+      +------------------------+
|    users    |      | attendance_records   |      |  webauthn_credentials  |
+-------------+      +----------------------+      +------------------------+
| id (PK)     |---- O| user_id (FK)         |      | id (PK)                |
| name        |      | id (PK)              |      | user_id (FK)         O----| users.id (PK)          |
| email       |      | date                 |      | public_key             |
| ...         |      | clock_in             |      | counter                |
+-------------+      | clock_out            |      | ...                    |
                     | ...                  |      +------------------------+
                     +----------------------+
```
- A `user` can have many `attendance_records`.
- A `user` can have many `webauthn_credentials`.
