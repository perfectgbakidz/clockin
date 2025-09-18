# Pardee Foods Attendance System - Backend Guide

This document outlines the requirements for the backend server that will power the Pardee Foods attendance system frontend.

## 1. Tech Stack

-   **Framework**: Flask
-   **Database**: SQLite3
-   **Biometric Authentication Library**: A Python WebAuthn library is highly recommended (e.g., `webauthn`).

## 2. Database Schema

Here is the recommended schema using SQLite3.

### `users` table

Stores user information and credentials.

| Column          | Type          | Notes                                  |
| --------------- | ------------- | -------------------------------------- |
| `id`            | INTEGER       | PRIMARY KEY, AUTOINCREMENT           |
| `name`          | TEXT          | NOT NULL                               |
| `email`         | TEXT          | UNIQUE, NOT NULL                       |
| `password_hash` | TEXT          | NOT NULL (store hashed passwords only) |
| `role`          | TEXT          | NOT NULL ('employee', 'admin', 'hr')   |
| `department`    | TEXT          |                                        |
| `status`        | TEXT          | 'Active' or 'Inactive'                 |
| `created_at`    | DATETIME      | DEFAULT CURRENT_TIMESTAMP              |

### `attendance_records` table

Stores clock-in and clock-out events for each user.

| Column        | Type     | Notes                                            |
| ------------- | -------- | ------------------------------------------------ |
| `id`          | INTEGER  | PRIMARY KEY, AUTOINCREMENT                     |
| `user_id`     | INTEGER  | FOREIGN KEY to `users.id`                        |
| `date`        | DATE     | NOT NULL                                         |
| `clock_in`    | DATETIME | NULLABLE                                         |
| `clock_out`   | DATETIME | NULLABLE                                         |

### `webauthn_credentials` table

Stores biometric credential data for passwordless authentication.

| Column            | Type    | Notes                                                                 |
| ----------------- | ------- | --------------------------------------------------------------------- |
| `id`              | INTEGER | PRIMARY KEY, AUTOINCREMENT                                          |
| `user_id`         | INTEGER | FOREIGN KEY to `users.id`                                             |
| `credential_id`   | BLOB    | UNIQUE, NOT NULL. The raw ID of the credential.                       |
| `public_key`      | BLOB    | NOT NULL. The public key used for signature verification.             |
| `sign_count`      | INTEGER | NOT NULL. The signature counter to prevent replay attacks.            |
| `transports`      | TEXT    | JSON list of transports (e.g., `["internal", "usb"]`). Optional.      |

---

## 3. API Endpoints

All endpoints should be prefixed with `/api`.

### Authentication

#### `POST /auth/login`

-   **Description**: Authenticates a user with email and password.
-   **Request Body**: `{ "email": "admin@example.com", "password": "password123" }`
-   **Success Response (200)**: Returns a JWT token and user data.
    ```json
    {
      "token": "your_jwt_token",
      "user": {
        "id": 2,
        "name": "Jane Smith",
        "email": "admin@example.com",
        "role": "admin",
        "department": "Management"
      }
    }
    ```
-   **Error Response (401)**: `{ "error": "Invalid credentials" }`

#### `POST /auth/change-password`

-   **Description**: Allows an authenticated user to change their password.
-   **Auth**: JWT required.
-   **Request Body**: `{ "oldPassword": "...", "newPassword": "..." }`
-   **Success Response (200)**: `{ "message": "Password updated successfully" }`

### WebAuthn (Biometric Authentication)

#### `GET /webauthn/register/begin`

-   **Description**: Generates and returns registration options (including a challenge) for the user.
-   **Auth**: JWT required.
-   **Success Response (200)**: Returns the options object compatible with `navigator.credentials.create()`.
    ```json
    {
      "publicKey": {
        "rp": { "name": "Pardee Foods", "id": "your-domain.com" },
        "user": { "id": "encoded_user_id", "name": "user@email.com", "displayName": "User Name" },
        "challenge": "base64url_encoded_challenge",
        "pubKeyCredParams": [{ "type": "public-key", "alg": -7 }],
        "authenticatorSelection": { "userVerification": "required", "authenticatorAttachment": "platform" },
        "timeout": 60000
      }
    }
    ```

#### `POST /webauthn/register/finish`

-   **Description**: Verifies the attestation object from the browser and saves the new credential to the database.
-   **Auth**: JWT required.
-   **Request Body**: The full credential object from `navigator.credentials.create()`.
-   **Success Response (200)**: `{ "verified": true, "message": "Device registered successfully" }`
-   **Error Response (400)**: `{ "verified": false, "error": "Verification failed" }`

#### `GET /webauthn/login/begin`

-   **Description**: Generates and returns authentication options for a given user.
-   **Auth**: No JWT required (this is part of the login flow).
-   **Query Params**: `?userId=...`
-   **Success Response (200)**: Returns options compatible with `navigator.credentials.get()`.
    ```json
    {
        "publicKey": {
            "challenge": "base64url_encoded_challenge",
            "allowCredentials": [{
                "type": "public-key",
                "id": "base64url_encoded_credential_id_from_db"
            }],
            "userVerification": "required",
            "timeout": 60000
        }
    }
    ```

#### `POST /webauthn/login/finish`

-   **Description**: Verifies the assertion from the browser to authenticate the clock-in/out action.
-   **Request Body**: The full credential object from `navigator.credentials.get()`.
-   **Success Response (200)**: `{ "verified": true, "message": "Verification successful" }`
-   **Error Response (400)**: `{ "verified": false, "error": "Verification failed" }`

### Employee Actions

#### `POST /attendance/clock-in`

-   **Description**: Creates a clock-in record after successful biometric verification.
-   **Auth**: JWT required.
-   **Request Body**: `{ "webAuthnResponse": { ... } }` (The response from `/webauthn/login/finish` flow).
-   **Success Response (200)**: `{ "message": "Clocked in successfully", "clockInTime": "2023-10-27T09:00:00Z" }`

#### `POST /attendance/clock-out`

-   **Description**: Adds a clock-out time to today's attendance record after successful biometric verification.
-   **Auth**: JWT required.
-   **Request Body**: `{ "webAuthnResponse": { ... } }` (The response from `/webauthn/login/finish` flow).
-   **Success Response (200)**: `{ "message": "Clocked out successfully", "clockOutTime": "2023-10-27T17:30:00Z" }`

#### `GET /attendance/history`

-   **Description**: Gets the attendance history for the authenticated employee.
-   **Auth**: JWT required.
-   **Success Response (200)**: An array of attendance records.
    ```json
    [
      { "id": 1, "date": "2023-10-26", "clockIn": "09:05:10", "clockOut": "17:20:00", "totalHours": 8.25 },
      ...
    ]
    ```

### Admin / HR Actions

#### `GET /admin/employees`

-   **Description**: Retrieves a list of all users.
-   **Auth**: JWT required (Admin role).
-   **Success Response (200)**: An array of user objects.

#### `POST /admin/employees`

-   **Description**: Creates a new user.
-   **Auth**: JWT required (Admin role).
-   **Request Body**: `{ "name": "...", "email": "...", "password": "...", "role": "...", "department": "..." }`
-   **Success Response (201)**: The newly created user object.

#### `PUT /admin/employees/:id`

-   **Description**: Updates an existing user's details.
-   **Auth**: JWT required (Admin role).
-   **Request Body**: `{ "name": "...", "email": "...", "role": "...", "department": "..." }`
-   **Success Response (200)**: The updated user object.

#### `DELETE /admin/employees/:id`
-   **Description**: Deactivates a user (soft delete by changing `status` to 'Inactive').
-   **Auth**: JWT required (Admin role).
-   **Success Response (200)**: `{ "message": "User deactivated successfully" }`

#### `GET /admin/attendance-logs`

-   **Description**: Gets all attendance logs for all users, with filtering.
-   **Auth**: JWT required (Admin, HR roles).
-   **Query Params**: `?search=John&date=2023-10-26`
-   **Success Response (200)**: A filtered array of attendance records, including user names.

---

## 4. Initial Setup

1.  **Initialize a Flask project**:
    ```bash
    mkdir pardee-foods-backend
    cd pardee-foods-backend
    python -m venv venv
    source venv/bin/activate
    pip install Flask flask-sqlalchemy flask-cors flask-bcrypt
    # Recommend a webauthn library
    pip install webauthn
    ```

2.  **Create `app.py`**: Set up the main Flask application file.

3.  **Database Initialization**: Create a function to initialize the SQLite database and create the tables based on the schema above.

4.  **CORS**: Ensure Cross-Origin Resource Sharing (CORS) is enabled to allow requests from the frontend application's domain.
