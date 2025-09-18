# Backend Implementation Guide: Clock-In & Clock-Out

This document provides backend developers with a detailed guide for implementing the secure clock-in and clock-out endpoints. These actions are critical and are protected by both a standard session JWT and a mandatory WebAuthn biometric verification step to ensure user presence.

## Core Flow Overview

1.  **Frontend Initiates**: The user clicks "Clock In" or "Clock Out".
2.  **Challenge Request**: A popup requests a WebAuthn challenge from a dedicated endpoint (e.g., `/api/webauthn/login/begin`).
3.  **User Biometric Scan**: The user provides their fingerprint/face scan, which signs the challenge.
4.  **Action Request**: The main page receives the signed assertion and sends it to the appropriate action endpoint (`/clock-in` or `/clock-out`) along with location data.
5.  **Backend Verifies & Records**: The backend verifies the JWT, the WebAuthn assertion, and the business rules, then records the event in the database.

---

## 1. Endpoints

### `POST /api/attendance/clock-in`
-   **Description:** Creates a new attendance record for the authenticated user for the current day.
-   **Protection:** Requires a valid JWT and a valid WebAuthn assertion.

### `POST /api/attendance/clock-out`
-   **Description:** Updates an existing attendance record for the authenticated user for the current day, adding the clock-out time and calculating total hours.
-   **Protection:** Requires a valid JWT and a valid WebAuthn assertion.

---

## 2. Request Body Structure

Both endpoints expect the same JSON body structure.

```json
{
  "webAuthnResponse": {
    "id": "credential_id_from_client",
    "rawId": "base64url_encoded_rawId",
    "type": "public-key",
    "response": {
      "clientDataJSON": "base64url_encoded_clientData",
      "authenticatorData": "base64url_encoded_authenticatorData",
      "signature": "base64url_encoded_signature",
      "userHandle": "base64url_encoded_userHandle_if_present"
    }
  },
  "location": {
    "lat": 34.0522,
    "lng": -118.2437
  }
}
```

---

## 3. Implementation Steps

### Step A: JWT & Input Validation (Middleware)
1.  **Verify JWT**: Ensure a valid, non-expired JWT is present in the `Authorization: Bearer <token>` header. Extract the `userId` from the token payload.
2.  **Validate Body**: Check that the request body contains the `webAuthnResponse` and `location` objects with the expected structure.

### Step B: WebAuthn Assertion Verification
This is the most critical security step. It should be implemented as a reusable service.

1.  **Retrieve Challenge**: Fetch the WebAuthn challenge that was generated for this user and stored in their server-side session (or a temporary cache like Redis) when the frontend called `/api/webauthn/login/begin`. A challenge must be single-use.
2.  **Retrieve Stored Credential**: Using the `id` from `webAuthnResponse.rawId`, look up the corresponding credential in the `webauthn_credentials` table for the `userId`. Fetch its `public_key` and `counter`.
3.  **Verify Signature**: Use a trusted FIDO2/WebAuthn server-side library to perform the verification. The library should:
    -   Verify the signature in `webAuthnResponse.response.signature` using the stored `public_key`.
    -   Match the challenge in the `clientDataJSON` against the challenge stored in the session.
    -   Verify that the origin (e.g., `https://your-app.com`) in the `clientDataJSON` matches your application's domain.
    -   **Prevent Replay Attacks**: Check that the signature counter from the authenticator (`authenticatorData`) is **greater than** the `counter` value stored in your database. This is mandatory.
4.  **Update Counter**: If verification is successful, update the `counter` in your `webauthn_credentials` table with the new, higher value from the authenticator.

### Step C: Endpoint-Specific Business Logic

#### For `POST /api/attendance/clock-in`

1.  **Check for Existing Record**: Query the `attendance_records` table for an entry where `user_id` matches the authenticated user and `date` is the current date.
2.  **Enforce Rules**:
    -   If a record already exists with a non-null `clock_in` time, return a **400 Bad Request** with an error like `"You have already clocked in today."`
3.  **Validate Location (Optional but Recommended)**: Implement server-side geofencing. Check if the provided `location` coordinates are within an acceptable radius of a valid work location. If not, return a **400 Bad Request**.
4.  **Create Database Record**: If all checks pass, `INSERT` a new row into `attendance_records` with the `user_id`, current `date`, and the current timestamp for `clock_in`.
5.  **Respond**: Return a **200 OK** with a success message and the clock-in time.

    ```json
    {
      "message": "Clock-in successful.",
      "clockInTime": "2023-10-27T09:00:15.123Z"
    }
    ```

#### For `POST /api/attendance/clock-out`

1.  **Find Existing Record**: Query the `attendance_records` table for an entry where `user_id` matches the authenticated user and `date` is the current date.
2.  **Enforce Rules**:
    -   If no record is found or the record's `clock_in` is null, return a **400 Bad Request** with an error like `"You must clock in before you can clock out."`
    -   If the record's `clock_out` time is already set, return a **400 Bad Request** with an error like `"You have already clocked out today."`
3.  **Validate Location**: Perform the same geofencing check as for clock-in.
4.  **Update Database Record**:
    -   `UPDATE` the existing attendance record.
    -   Set `clock_out` to the current timestamp.
    -   Calculate the `total_hours` worked by finding the duration between the `clock_out` and `clock_in` timestamps. Store this as a numeric value (e.g., `8.5` for 8 hours and 30 minutes).
5.  **Respond**: Return a **200 OK** with a success message, the clock-out time, and the calculated total hours.

    ```json
    {
      "message": "Clock-out successful.",
      "clockOutTime": "2023-10-27T17:30:45.567Z",
      "totalHours": 8.5
    }
    ```
